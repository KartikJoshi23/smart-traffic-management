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


class MultiAgentController:
    """
    Controller that manages multiple agents across the grid.
    Each intersection gets its own agent instance.
    """

    def __init__(self, agent_type="q_learning", num_intersections=16, **kwargs):
        self.agent_type = agent_type
        self.num_intersections = num_intersections
        self.agents = []

        for _ in range(num_intersections):
            if agent_type == "q_learning":
                self.agents.append(QLearningAgent(**kwargs))
            elif agent_type == "sarsa":
                self.agents.append(SARSAAgent(**kwargs))
            elif agent_type == "fixed_timer":
                self.agents.append(FixedTimerAgent(**kwargs))
            else:
                raise ValueError(f"Unknown agent type: {agent_type}")

    def choose_actions(self, states):
        """Choose actions for all intersections."""
        actions = []
        for idx, (agent, state) in enumerate(zip(self.agents, states)):
            if self.agent_type == "fixed_timer":
                actions.append(agent.choose_action(state, intersection_id=idx))
            else:
                actions.append(agent.choose_action(state))
        return actions

    def update_all(self, states, actions, rewards, next_states, next_actions=None):
        """Update all agents."""
        for idx, agent in enumerate(self.agents):
            if self.agent_type == "q_learning":
                agent.update(states[idx], actions[idx], rewards[idx], next_states[idx])
            elif self.agent_type == "sarsa":
                if next_actions is not None:
                    agent.update(states[idx], actions[idx], rewards[idx],
                                next_states[idx], next_actions[idx])
            elif self.agent_type == "fixed_timer":
                agent.update()

    def decay_exploration(self):
        """Decay epsilon for all agents."""
        for agent in self.agents:
            agent.decay_epsilon()

    def get_stats(self):
        """Get aggregate stats."""
        return self.agents[0].get_stats()
