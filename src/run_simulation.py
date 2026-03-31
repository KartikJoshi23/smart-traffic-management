"""
Run Simulation - Standalone script to run experiments and export results.
Can be run independently of main.py for re-running specific experiments.
"""
import sys
import os
import time
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.simulation import SimulationRunner


def main():
    parser = argparse.ArgumentParser(description="Run traffic RL experiments")
    parser.add_argument("--episodes", type=int, default=300,
                        help="Number of training episodes (default: 300)")
    parser.add_argument("--steps", type=int, default=200,
                        help="Steps per episode (default: 200)")
    parser.add_argument("--output", type=str,
                        default=os.path.join(os.path.dirname(os.path.dirname(__file__)),
                                             "dashboard", "public", "data"),
                        help="Output directory for JSON results")
    parser.add_argument("--quiet", action="store_true",
                        help="Suppress training progress output")
    args = parser.parse_args()

    print("=" * 60)
    print("  Smart Traffic Management - Simulation Runner")
    print("=" * 60)
    print(f"  Episodes: {args.episodes}")
    print(f"  Steps/episode: {args.steps}")
    print(f"  Output: {args.output}")
    print("=" * 60)

    runner = SimulationRunner(
        num_episodes=args.episodes,
        steps_per_episode=args.steps
    )

    start = time.time()
    runner.run_all_experiments(verbose=not args.quiet)
    elapsed = time.time() - start

    print(f"\nTraining completed in {elapsed:.1f}s")
    print(f"\nExporting results to {args.output}...")
    runner.export_results(args.output)
    print("Done.")


if __name__ == "__main__":
    main()
