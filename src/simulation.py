"""
Simulation Engine for Smart Traffic Management.
Runs training episodes across multiple scenarios and agent types,
collects metrics, and exports results for dashboard visualization.
"""
import numpy as np
import json
import os
import time
from collections import defaultdict


class NumpyEncoder(json.JSONEncoder):
    """JSON encoder that handles numpy types."""
    def default(self, obj):
        if isinstance(obj, (np.integer,)):
            return int(obj)
        if isinstance(obj, (np.floating,)):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

from .environment import TrafficEnvironment
from .agents import MultiAgentController
from .mcdm import evaluate_policies


class SimulationRunner:
    """
    Orchestrates RL training and evaluation across scenarios.
    """

    SCENARIOS = ["normal", "rush_hour", "incident", "event", "bus_priority"]
    AGENT_TYPES = ["fixed_timer", "q_learning", "sarsa"]

    SCENARIO_LABELS = {
        "normal": "Normal Traffic",
        "rush_hour": "Rush Hour (2.5x)",
        "incident": "Incident / Lane Closure",
        "event": "Event Traffic",
        "bus_priority": "Bus Priority Mode"
    }

    AGENT_LABELS = {
        "fixed_timer": "Fixed Timer",
        "q_learning": "Q-Learning",
        "sarsa": "SARSA"
    }

    def __init__(self, num_episodes=300, steps_per_episode=200):
        self.num_episodes = num_episodes
        self.steps_per_episode = steps_per_episode
        self.results = {}
        self.trained_controllers = {}  # Store trained agents for live sim

    def train_agent(self, agent_type, scenario, num_episodes=None, verbose=True):
        """
        Train a specific agent type on a specific scenario.

        Returns:
            training_history: episode-by-episode metrics
            final_metrics: summary of final performance
            controller: the trained MultiAgentController (for reuse in live sim)
        """
        if num_episodes is None:
            num_episodes = self.num_episodes

        env = TrafficEnvironment(scenario=scenario,
                                  time_steps_per_episode=self.steps_per_episode)

        # Agent configuration
        agent_kwargs = {}
        if agent_type == "q_learning":
            agent_kwargs = {
                "alpha": 0.15, "gamma": 0.95,
                "epsilon": 1.0, "epsilon_decay": 0.993, "epsilon_min": 0.01
            }
        elif agent_type == "sarsa":
            agent_kwargs = {
                "alpha": 0.12, "gamma": 0.95,
                "epsilon": 1.0, "epsilon_decay": 0.993, "epsilon_min": 0.01
            }
        elif agent_type == "fixed_timer":
            agent_kwargs = {"switch_interval": 15}

        controller = MultiAgentController(agent_type=agent_type, **agent_kwargs)

        # Training history
        history = {
            "episode_rewards": [],
            "avg_wait_times": [],
            "throughputs": [],
            "avg_queues": [],
            "emissions": [],
            "safety_scores": [],
            "bus_delays": [],
            "epsilons": []
        }

        if verbose:
            print(f"  Training {self.AGENT_LABELS[agent_type]} on {self.SCENARIO_LABELS[scenario]}...")

        for episode in range(num_episodes):
            states = env.reset()
            episode_total_reward = 0

            # Choose initial actions (needed for SARSA)
            actions = controller.choose_actions(states)

            for step in range(self.steps_per_episode):
                # Execute actions
                next_states, rewards, done, info = env.step(actions)
                episode_total_reward += sum(rewards)

                # Choose next actions
                next_actions = controller.choose_actions(next_states)

                # Update agents
                if agent_type == "sarsa":
                    controller.update_all(states, actions, rewards,
                                          next_states, next_actions)
                else:
                    controller.update_all(states, actions, rewards, next_states)

                states = next_states
                actions = next_actions

                if done:
                    break

            # Decay exploration
            controller.decay_exploration()

            # Collect episode metrics
            summary = env.get_episode_summary()
            history["episode_rewards"].append(round(episode_total_reward, 2))
            history["avg_wait_times"].append(summary["avg_wait_time"])
            history["throughputs"].append(summary["total_throughput"])
            history["avg_queues"].append(summary["avg_queue_length"])
            history["emissions"].append(summary["total_emissions_kg"])
            history["safety_scores"].append(summary["safety_score"])
            history["bus_delays"].append(summary.get("bus_delay", 0))

            # Track epsilon
            agent_stats = controller.get_stats()
            epsilon = agent_stats.get("epsilon", 0)
            history["epsilons"].append(epsilon)

            if verbose and (episode + 1) % 50 == 0:
                last_50_reward = np.mean(history["episode_rewards"][-50:])
                last_50_wait = np.mean(history["avg_wait_times"][-50:])
                last_50_throughput = np.mean(history["throughputs"][-50:])
                print(f"    Episode {episode+1}/{num_episodes} | "
                      f"Reward: {last_50_reward:.1f} | "
                      f"Wait: {last_50_wait:.1f} | "
                      f"Throughput: {last_50_throughput:.0f} | "
                      f"ε: {epsilon:.3f}")

        # Final performance (average of last 50 episodes)
        window = min(50, num_episodes)
        final_metrics = {
            "avg_reward": round(np.mean(history["episode_rewards"][-window:]), 2),
            "avg_wait_time": round(np.mean(history["avg_wait_times"][-window:]), 2),
            "avg_throughput": round(np.mean(history["throughputs"][-window:]), 2),
            "avg_queue": round(np.mean(history["avg_queues"][-window:]), 2),
            "avg_emissions": round(np.mean(history["emissions"][-window:]), 4),
            "avg_safety_score": round(np.mean(history["safety_scores"][-window:]), 2),
            "avg_bus_delay": round(np.mean(history["bus_delays"][-window:]), 2),
            "total_episodes": num_episodes
        }

        return history, final_metrics, controller

    def run_all_experiments(self, verbose=True):
        """
        Run all agent types across all scenarios.
        """
        all_results = {}
        start_time = time.time()

        for scenario in self.SCENARIOS:
            if verbose:
                print(f"\n{'='*60}")
                print(f"Scenario: {self.SCENARIO_LABELS[scenario]}")
                print(f"{'='*60}")

            scenario_results = {}

            for agent_type in self.AGENT_TYPES:
                history, final_metrics, controller = self.train_agent(
                    agent_type, scenario, verbose=verbose)

                # Store trained controller for live sim reuse
                self.trained_controllers[(scenario, agent_type)] = controller

                scenario_results[agent_type] = {
                    "history": history,
                    "final_metrics": final_metrics,
                    "agent_label": self.AGENT_LABELS[agent_type],
                    "scenario_label": self.SCENARIO_LABELS[scenario]
                }

            all_results[scenario] = scenario_results

        elapsed = time.time() - start_time
        if verbose:
            print(f"\n{'='*60}")
            print(f"All experiments completed in {elapsed:.1f}s")
            print(f"{'='*60}")

        self.results = all_results
        return all_results

    def run_mcdm_evaluation(self, scenario="normal"):
        """
        Run MCDM evaluation for a specific scenario comparing all agent types.
        """
        if scenario not in self.results:
            raise ValueError(f"No results for scenario: {scenario}. Run experiments first.")

        scenario_results = self.results[scenario]

        # Build policy results for MCDM
        policy_results = {}
        for agent_type in self.AGENT_TYPES:
            metrics = scenario_results[agent_type]["final_metrics"]

            policy_results[self.AGENT_LABELS[agent_type]] = {
                "throughput": metrics["avg_throughput"],
                "safety_score": metrics["avg_safety_score"],
                "emissions": metrics["avg_emissions"],
                "bus_delay": metrics.get("avg_bus_delay", metrics["avg_wait_time"] * 0.9)
            }

        # Also add bus-priority variants for RL agents
        if "bus_priority" in self.results:
            bp_results = self.results["bus_priority"]
            for agent_type in ["q_learning", "sarsa"]:
                if agent_type in bp_results:
                    bp_metrics = bp_results[agent_type]["final_metrics"]
                    label = f"{self.AGENT_LABELS[agent_type]} + Bus Priority"
                    policy_results[label] = {
                        "throughput": bp_metrics["avg_throughput"],
                        "safety_score": bp_metrics["avg_safety_score"],
                        "emissions": bp_metrics["avg_emissions"],
                        "bus_delay": bp_metrics.get("avg_bus_delay", bp_metrics["avg_wait_time"] * 0.7)
                    }

        return evaluate_policies(policy_results)

    def generate_live_simulation_data(self, agent_type="q_learning",
                                       scenario="normal", num_steps=100):
        """
        Generate step-by-step simulation data for live dashboard visualization.
        Uses TRAINED controllers when available for realistic learned behavior.
        Also exports Q-values for XAI (Explainable AI) panel.
        """
        env = TrafficEnvironment(scenario=scenario,
                                  time_steps_per_episode=num_steps)

        # Use trained controller if available, otherwise create fresh
        key = (scenario, agent_type)
        if key in self.trained_controllers:
            controller = self.trained_controllers[key]
            # Set epsilon to near-zero for exploitation (show learned policy)
            for agent in controller.agents:
                if hasattr(agent, 'epsilon'):
                    agent.epsilon = 0.02  # Tiny exploration for variety
            print(f"    Using trained {agent_type} controller for live sim")
        else:
            agent_kwargs = {}
            if agent_type == "q_learning":
                agent_kwargs = {
                    "alpha": 0.05, "gamma": 0.95,
                    "epsilon": 0.1, "epsilon_decay": 1.0, "epsilon_min": 0.1
                }
            elif agent_type == "sarsa":
                agent_kwargs = {
                    "alpha": 0.05, "gamma": 0.95,
                    "epsilon": 0.1, "epsilon_decay": 1.0, "epsilon_min": 0.1
                }
            elif agent_type == "fixed_timer":
                agent_kwargs = {"switch_interval": 15}
            controller = MultiAgentController(agent_type=agent_type, **agent_kwargs)
            print(f"    No trained controller for {agent_type}/{scenario}, using fresh")

        states = env.reset()
        frames = []

        for step in range(num_steps):
            actions = controller.choose_actions(states)
            next_states, rewards, done, info = env.step(actions)

            # Extract Q-values for XAI (only for RL agents)
            q_values_data = []
            for i, agent in enumerate(controller.agents):
                if hasattr(agent, 'q_table'):
                    state = states[i]
                    qvals = agent.q_table[state].tolist()
                    best_action = int(np.argmax(qvals))
                    q_max = float(max(qvals))
                    q_second = float(sorted(qvals)[-2]) if len(qvals) > 1 else q_max
                    confidence = min(100, max(10, (q_max - q_second) * 25 + 50))
                    q_values_data.append({
                        "q_values": [round(float(q), 3) for q in qvals],
                        "best_action": best_action,
                        "confidence": round(confidence, 1),
                        "state_visits": int(agent.training_steps // 16)
                    })
                else:
                    q_values_data.append({
                        "q_values": [0, 0, 0],
                        "best_action": int(actions[i]),
                        "confidence": 50.0,
                        "state_visits": 0
                    })

            # Record frame
            grid_state = env.get_grid_state()
            step_emissions = round(sum(inter.total_emissions for inter in env.intersections), 4)
            frame = {
                "step": step,
                "grid": grid_state,
                "metrics": {
                    "avg_queue": info["avg_queue_length"],
                    "avg_wait": info["avg_wait_time"],
                    "throughput": info["total_throughput"],
                    "emissions": float(step_emissions),
                    "hour": info["hour"]
                },
                "actions": [int(a) for a in actions],
                "rewards": [round(float(r), 2) for r in rewards],
                "q_values": q_values_data
            }
            frames.append(frame)

            states = next_states
            if done:
                break

        return frames

    def export_results(self, output_dir):
        """
        Export all results to JSON files for the dashboard.
        """
        os.makedirs(output_dir, exist_ok=True)

        # 1. Training curves for all scenarios and agents
        training_data = {}
        for scenario in self.results:
            training_data[scenario] = {}
            for agent_type in self.results[scenario]:
                agent_result = self.results[scenario][agent_type]
                # Smooth the curves for visualization
                history = agent_result["history"]
                window = 10
                smoothed = {}
                for key in ["episode_rewards", "avg_wait_times", "throughputs",
                            "avg_queues", "emissions", "safety_scores"]:
                    values = history[key]
                    smoothed_values = []
                    for i in range(len(values)):
                        start = max(0, i - window + 1)
                        smoothed_values.append(round(np.mean(values[start:i+1]), 3))
                    smoothed[key] = smoothed_values
                smoothed["epsilons"] = history["epsilons"]

                training_data[scenario][agent_type] = {
                    "history": smoothed,
                    "final_metrics": agent_result["final_metrics"],
                    "agent_label": agent_result["agent_label"],
                    "scenario_label": agent_result["scenario_label"]
                }

        with open(os.path.join(output_dir, "training_results.json"), "w") as f:
            json.dump(training_data, f, indent=2, cls=NumpyEncoder)

        # 2. MCDM evaluation results
        mcdm_results = {}
        for scenario in self.SCENARIOS:
            if scenario in self.results:
                mcdm_results[scenario] = self.run_mcdm_evaluation(scenario)
        with open(os.path.join(output_dir, "mcdm_results.json"), "w") as f:
            json.dump(mcdm_results, f, indent=2, cls=NumpyEncoder)

        # 3. Live simulation frames for each agent type
        for agent_type in self.AGENT_TYPES:
            frames = self.generate_live_simulation_data(agent_type, "normal", 100)
            filename = f"live_simulation_{agent_type}.json"
            with open(os.path.join(output_dir, filename), "w") as f:
                json.dump(frames, f, indent=2, cls=NumpyEncoder)

        # 4. Scenario comparison summary
        comparison = {}
        for scenario in self.results:
            comparison[scenario] = {
                "label": self.SCENARIO_LABELS.get(scenario, scenario),
                "agents": {}
            }
            for agent_type in self.results[scenario]:
                comparison[scenario]["agents"][agent_type] = {
                    "label": self.AGENT_LABELS.get(agent_type, agent_type),
                    "metrics": self.results[scenario][agent_type]["final_metrics"]
                }
        with open(os.path.join(output_dir, "scenario_comparison.json"), "w") as f:
            json.dump(comparison, f, indent=2, cls=NumpyEncoder)

        # 5. Intersection metadata
        from .environment import INTERSECTION_NAMES
        env = TrafficEnvironment()
        intersection_meta = []
        for i, inter in enumerate(env.intersections):
            intersection_meta.append({
                "id": inter.id,
                "name": INTERSECTION_NAMES[i],
                "row": inter.row,
                "col": inter.col,
                "base_volume": inter.base_traffic_volume
            })
        with open(os.path.join(output_dir, "intersection_meta.json"), "w") as f:
            json.dump(intersection_meta, f, indent=2, cls=NumpyEncoder)

        print(f"Results exported to: {output_dir}")
        print(f"  - training_results.json")
        print(f"  - mcdm_results.json")
        print(f"  - live_simulation_*.json (3 files)")
        print(f"  - scenario_comparison.json")
        print(f"  - intersection_meta.json")
