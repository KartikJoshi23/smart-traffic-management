"""
Reinforcement Learning Agents for Traffic Signal Control.
Implements Q-Learning, SARSA, and Fixed-Timer baseline agents.
"""
import numpy as np
from collections import defaultdict
import json


class QLearningAgent:
    """
    Q-Learning Agent for traffic signal control (off-policy TD control).
    Each intersection has its own Q-table for decentralized learning.
    """

    def __init__(self, num_actions=3, alpha=0.1, gamma=0.95,
                 epsilon=1.0, epsilon_decay=0.995, epsilon_min=0.01):
        self.num_actions = num_actions
        self.alpha = alpha          # Learning rate
        self.gamma = gamma          # Discount factor
        self.epsilon = epsilon      # Exploration rate
        self.epsilon_decay = epsilon_decay
        self.epsilon_min = epsilon_min

        # Q-table: state -> action values
        self.q_table = defaultdict(lambda: np.zeros(num_actions))

        # Training metrics
        self.episode_rewards = []
        self.training_steps = 0

    def choose_action(self, state):
        """ε-greedy action selection."""
        if np.random.random() < self.epsilon:
            return np.random.randint(self.num_actions)
        else:
            q_values = self.q_table[state]
            return np.argmax(q_values)

    def update(self, state, action, reward, next_state):
        """Q-Learning update rule: Q(s,a) += α[r + γ·max_a'Q(s',a') - Q(s,a)]"""
        current_q = self.q_table[state][action]
        max_next_q = np.max(self.q_table[next_state])
        td_target = reward + self.gamma * max_next_q
        td_error = td_target - current_q
        self.q_table[state][action] += self.alpha * td_error
        self.training_steps += 1

    def decay_epsilon(self):
        """Decay exploration rate."""
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)

    def get_policy(self):
        """Extract the learned policy."""
        policy = {}
        for state, q_values in self.q_table.items():
            policy[str(state)] = int(np.argmax(q_values))
        return policy

    def get_stats(self):
        """Return agent statistics."""
        return {
            "type": "Q-Learning",
            "epsilon": round(self.epsilon, 4),
            "num_states_explored": len(self.q_table),
            "training_steps": self.training_steps,
            "alpha": self.alpha,
            "gamma": self.gamma
        }


class SARSAAgent:
    """
    SARSA Agent for traffic signal control (on-policy TD control).
    """

    def __init__(self, num_actions=3, alpha=0.1, gamma=0.95,
                 epsilon=1.0, epsilon_decay=0.995, epsilon_min=0.01):
        self.num_actions = num_actions
        self.alpha = alpha
        self.gamma = gamma
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.epsilon_min = epsilon_min

        self.q_table = defaultdict(lambda: np.zeros(num_actions))
        self.episode_rewards = []
        self.training_steps = 0

    def choose_action(self, state):
        """ε-greedy action selection."""
        if np.random.random() < self.epsilon:
            return np.random.randint(self.num_actions)
        else:
            q_values = self.q_table[state]
            return np.argmax(q_values)

    def update(self, state, action, reward, next_state, next_action):
        """SARSA update: Q(s,a) += α[r + γ·Q(s',a') - Q(s,a)]"""
        current_q = self.q_table[state][action]
        next_q = self.q_table[next_state][next_action]
        td_target = reward + self.gamma * next_q
        td_error = td_target - current_q
        self.q_table[state][action] += self.alpha * td_error
        self.training_steps += 1

    def decay_epsilon(self):
        """Decay exploration rate."""
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)

    def get_policy(self):
        """Extract the learned policy."""
        policy = {}
        for state, q_values in self.q_table.items():
            policy[str(state)] = int(np.argmax(q_values))
        return policy

    def get_stats(self):
        """Return agent statistics."""
        return {
            "type": "SARSA",
            "epsilon": round(self.epsilon, 4),
            "num_states_explored": len(self.q_table),
            "training_steps": self.training_steps,
            "alpha": self.alpha,
            "gamma": self.gamma
        }


class FixedTimerAgent:
    """
    Fixed-Timer Baseline Agent.
    Switches signal phase every fixed number of steps (no learning).
    """

    def __init__(self, switch_interval=15, num_actions=3):
        self.switch_interval = switch_interval
        self.num_actions = num_actions
        self.step_counter = defaultdict(int)
        self.training_steps = 0

    def choose_action(self, state, intersection_id=0):
        """Fixed timer: switch every N steps."""
        self.step_counter[intersection_id] += 1
        if self.step_counter[intersection_id] >= self.switch_interval:
            self.step_counter[intersection_id] = 0
            return 1  # ACTION_SWITCH
        return 0  # ACTION_KEEP

    def update(self, *args, **kwargs):
        """No learning for fixed timer."""
        self.training_steps += 1
        pass

    def decay_epsilon(self):
        """No exploration decay for fixed timer."""
        pass

    def get_stats(self):
        return {
            "type": "Fixed-Timer",
            "switch_interval": self.switch_interval,
            "training_steps": self.training_steps
        }


class CoordinationLayer:
    """
    Network-level coordination layer that sits on top of individual agent decisions.
    Implements three coordination protocols:
    1. Green Wave: Align phases along corridors for smooth traffic flow
    2. Conflict Resolution: Prevent adjacent intersections from switching simultaneously
    3. Corridor Balancing: Coordinated flushing when a corridor is congested
    """

    GRID_SIZE = 4

    def __init__(self):
        self.override_log = []  # Track overrides for XAI
        self.total_overrides = 0
        self.total_decisions = 0

        # Define corridors (rows and columns in the 4x4 grid)
        # Row corridors (EW direction): indices along each row
        self.row_corridors = [[r * 4 + c for c in range(4)] for r in range(4)]
        # Column corridors (NS direction): indices along each column
        self.col_corridors = [[r * 4 + c for r in range(4)] for c in range(4)]

    def coordinate(self, proposed_actions, states, env_intersections):
        """
        Review proposed actions and apply network-level coordination.

        Args:
            proposed_actions: list of 16 actions from individual agents
            states: list of 16 state tuples
            env_intersections: list of 16 Intersection objects (for queue info)

        Returns:
            final_actions: list of 16 coordinated actions
            overrides: list of override info dicts (for XAI)
        """
        self.total_decisions += len(proposed_actions)
        final_actions = list(proposed_actions)  # Copy
        overrides = []

        # Protocol 1: Green Wave Coordination
        gw_overrides = self._green_wave(final_actions, env_intersections)
        overrides.extend(gw_overrides)

        # Protocol 2: Conflict Resolution (adjacent simultaneous switches)
        cr_overrides = self._conflict_resolution(final_actions, env_intersections)
        overrides.extend(cr_overrides)

        # Protocol 3: Corridor Balancing (only if not too many overrides already)
        if len(overrides) < 4:
            cb_overrides = self._corridor_balancing(final_actions, env_intersections)
            overrides.extend(cb_overrides)

        self.total_overrides += len(overrides)
        self.override_log.extend(overrides)

        return final_actions, overrides

    def _green_wave(self, actions, intersections):
        """
        If intersection i just has NS-green and downstream intersection i+1
        is about to SWITCH away from NS-green, override to HOLD to maintain
        the green wave. Conservative: only when cross-queue is manageable.
        """
        overrides = []

        # Check column corridors (NS flow, top to bottom)
        for corridor in self.col_corridors:
            for k in range(len(corridor) - 1):
                upstream = corridor[k]
                downstream = corridor[k + 1]
                up_inter = intersections[upstream]
                dn_inter = intersections[downstream]

                # Only trigger in narrow timing window AND cross-queue isn't critical
                if (up_inter.phase == 0 and not up_inter.is_yellow and
                    up_inter.phase_timer >= 5 and up_inter.phase_timer <= 10 and
                    dn_inter.phase == 0 and actions[downstream] == 1 and
                    dn_inter.queue_ew < 15):  # Don't override if cross-dir is backed up
                    actions[downstream] = 0  # HOLD
                    overrides.append({
                        "intersection": downstream,
                        "original": 1, "final": 0,
                        "reason": "green_wave",
                        "detail": f"Maintaining NS green wave from {upstream} to {downstream}"
                    })

        # Check row corridors (EW flow, left to right)
        for corridor in self.row_corridors:
            for k in range(len(corridor) - 1):
                upstream = corridor[k]
                downstream = corridor[k + 1]
                up_inter = intersections[upstream]
                dn_inter = intersections[downstream]

                if (up_inter.phase == 1 and not up_inter.is_yellow and
                    up_inter.phase_timer >= 5 and up_inter.phase_timer <= 10 and
                    dn_inter.phase == 1 and actions[downstream] == 1 and
                    dn_inter.queue_ns < 15):  # Don't override if cross-dir is backed up
                    actions[downstream] = 0
                    overrides.append({
                        "intersection": downstream,
                        "original": 1, "final": 0,
                        "reason": "green_wave",
                        "detail": f"Maintaining EW green wave from {upstream} to {downstream}"
                    })

        return overrides

    def _conflict_resolution(self, actions, intersections):
        """
        Prevent adjacent intersections from switching simultaneously.
        If both want to SWITCH, the one with lower total queue defers (HOLD).
        """
        overrides = []
        already_deferred = set()

        for idx in range(16):
            if actions[idx] != 1:  # Only check SWITCHes
                continue
            if idx in already_deferred:
                continue

            row, col = idx // 4, idx % 4
            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nr, nc = row + dr, col + dc
                if 0 <= nr < 4 and 0 <= nc < 4:
                    nidx = nr * 4 + nc
                    if actions[nidx] == 1 and nidx not in already_deferred:
                        # Both want to switch — defer the less urgent one
                        q_idx = intersections[idx].queue_ns + intersections[idx].queue_ew
                        q_nidx = intersections[nidx].queue_ns + intersections[nidx].queue_ew
                        defer = nidx if q_idx >= q_nidx else idx
                        actions[defer] = 0  # HOLD instead of SWITCH
                        already_deferred.add(defer)
                        overrides.append({
                            "intersection": defer,
                            "original": 1, "final": 0,
                            "reason": "conflict_resolution",
                            "detail": f"Deferred SWITCH at {defer} (queue {intersections[defer].queue_ns + intersections[defer].queue_ew}) to avoid simultaneous switch with neighbor"
                        })
                        break  # Only one deferral per intersection

        return overrides

    def _corridor_balancing(self, actions, intersections):
        """
        If an entire corridor has severe congestion (avg queue > 40),
        coordinate: intersections in that corridor should HOLD their
        current green to flush traffic through, rather than switching.
        Limited to max 2 overrides per corridor to avoid over-intervention.
        """
        overrides = []

        for corridor in self.row_corridors + self.col_corridors:
            avg_q = sum(intersections[i].queue_ns + intersections[i].queue_ew
                        for i in corridor) / len(corridor)

            if avg_q > 40:  # Only severe congestion
                is_row = (corridor[1] - corridor[0] == 1)
                target_phase = 1 if is_row else 0

                corridor_overrides = 0
                for idx in corridor:
                    if corridor_overrides >= 2:  # Cap per corridor
                        break
                    inter = intersections[idx]
                    if inter.phase == target_phase and actions[idx] == 1:
                        actions[idx] = 0  # HOLD instead of EXTEND
                        corridor_overrides += 1
                        overrides.append({
                            "intersection": idx,
                            "original": 1, "final": 0,
                            "reason": "corridor_balancing",
                            "detail": f"Corridor congested (avg queue {avg_q:.0f}), holding green to flush"
                        })

        return overrides

    def get_stats(self):
        """Return coordination statistics."""
        rate = (self.total_overrides / max(1, self.total_decisions)) * 100
        by_reason = {}
        for o in self.override_log:
            by_reason[o["reason"]] = by_reason.get(o["reason"], 0) + 1
        return {
            "total_overrides": self.total_overrides,
            "total_decisions": self.total_decisions,
            "override_rate": round(rate, 2),
            "by_reason": by_reason
        }

    def reset_log(self):
        """Reset per-episode override log."""
        self.override_log = []


class MultiAgentController:
    """
    Controller that manages multiple agents across the grid.
    Each intersection gets its own agent instance.
    """

    def __init__(self, agent_type="q_learning", num_intersections=16, **kwargs):
        self.agent_type = agent_type
        self.num_intersections = num_intersections
        self.agents = []
        self.coordinator = None
        self.last_overrides = []  # For XAI export

        # Determine base RL type (strip "coordinated_" prefix if present)
        self.is_coordinated = agent_type.startswith("coordinated_")
        base_type = agent_type.replace("coordinated_", "") if self.is_coordinated else agent_type

        if self.is_coordinated:
            self.coordinator = CoordinationLayer()

        for _ in range(num_intersections):
            if base_type == "q_learning":
                self.agents.append(QLearningAgent(**kwargs))
            elif base_type == "sarsa":
                self.agents.append(SARSAAgent(**kwargs))
            elif base_type == "fixed_timer":
                self.agents.append(FixedTimerAgent(**kwargs))
            else:
                raise ValueError(f"Unknown agent type: {agent_type}")

    def choose_actions(self, states, env_intersections=None):
        """Choose actions for all intersections, with optional coordination."""
        base_type = self.agent_type.replace("coordinated_", "")
        actions = []
        for idx, (agent, state) in enumerate(zip(self.agents, states)):
            if base_type == "fixed_timer":
                actions.append(agent.choose_action(state, intersection_id=idx))
            else:
                actions.append(agent.choose_action(state))

        # Apply coordination layer if enabled
        self.last_overrides = []
        if self.coordinator is not None and env_intersections is not None:
            actions, self.last_overrides = self.coordinator.coordinate(
                actions, states, env_intersections)

        return actions

    def update_all(self, states, actions, rewards, next_states, next_actions=None):
        """Update all agents."""
        base_type = self.agent_type.replace("coordinated_", "")
        for idx, agent in enumerate(self.agents):
            if base_type == "q_learning":
                agent.update(states[idx], actions[idx], rewards[idx], next_states[idx])
            elif base_type == "sarsa":
                if next_actions is not None:
                    agent.update(states[idx], actions[idx], rewards[idx],
                                next_states[idx], next_actions[idx])
            elif base_type == "fixed_timer":
                agent.update()

    def decay_exploration(self):
        """Decay epsilon for all agents."""
        for agent in self.agents:
            agent.decay_epsilon()

    def get_stats(self):
        """Get aggregate stats."""
        stats = self.agents[0].get_stats()
        if self.coordinator:
            stats["coordination"] = self.coordinator.get_stats()
        return stats
