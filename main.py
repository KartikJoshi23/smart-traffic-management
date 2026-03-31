"""
Smart Traffic Management System - Main Entry Point.
Generates synthetic data, runs simulations, and exports results.
"""
import sys
import os
import time

# Add project root to path
sys.path.insert(0, os.path.dirname(__file__))

from src.generate_synthetic import main as generate_synthetic_data
from src.simulation import SimulationRunner


def main():
    print("=" * 70)
    print("  SMART CITY TRAFFIC MANAGEMENT SYSTEM")
    print("  Multi-Agent Reinforcement Learning Simulation")
    print("=" * 70)

    # Step 1: Generate synthetic datasets
    print("\n[1/4] Generating synthetic datasets...")
    generate_synthetic_data()

    # Step 2: Run simulation experiments
    print("\n[2/4] Running RL simulation experiments...")
    print("  (Training Q-Learning, SARSA, and Fixed-Timer across 5 scenarios)")
    print("  This may take a few minutes...\n")

    runner = SimulationRunner(
        num_episodes=300,       # 300 episodes per agent-scenario pair
        steps_per_episode=200   # 200 time steps per episode
    )

    start_time = time.time()
    runner.run_all_experiments(verbose=True)
    elapsed = time.time() - start_time
    print(f"\n  Simulation completed in {elapsed:.1f} seconds")

    # Step 3: Export results for dashboard
    print("\n[3/4] Exporting results for dashboard...")
    dashboard_data_dir = os.path.join(os.path.dirname(__file__),
                                       "dashboard", "public", "data")
    runner.export_results(dashboard_data_dir)

    # Step 4: Print summary
    print("\n[4/4] Summary of Results")
    print("=" * 70)

    for scenario in runner.SCENARIOS:
        print(f"\n  Scenario: {runner.SCENARIO_LABELS[scenario]}")
        print(f"  {'Agent':<20} {'Throughput':>12} {'Wait Time':>12} {'Emissions':>12} {'Safety':>10}")
        print(f"  {'-'*66}")

        for agent_type in runner.AGENT_TYPES:
            metrics = runner.results[scenario][agent_type]["final_metrics"]
            print(f"  {runner.AGENT_LABELS[agent_type]:<20} "
                  f"{metrics['avg_throughput']:>12.1f} "
                  f"{metrics['avg_wait_time']:>12.1f} "
                  f"{metrics['avg_emissions']:>12.4f} "
                  f"{metrics['avg_safety_score']:>10.1f}")

    print(f"\n{'='*70}")
    print(f"  All results exported to: {dashboard_data_dir}")
    print(f"  Next: cd dashboard && npm install && npm run dev")
    print(f"{'='*70}")


if __name__ == "__main__":
    main()
