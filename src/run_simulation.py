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
from src.data_loader import load_vehicle_detections, load_intersection_traffic, load_emergency_events


def validate_datasets():
    """
    Validate synthetic datasets and compute summary statistics.
    Uses vehicle_detections.csv to verify vehicle type distributions
    match the simulation's assumptions.
    """
    print("\n--- Dataset Validation ---")

    # 1. Vehicle type distribution from IoT sensor data
    try:
        vd = load_vehicle_detections()
        total = len(vd)
        dist = vd["vehicle_type"].value_counts(normalize=True)
        print(f"\nVehicle Detections: {total:,} records")
        print("  Vehicle type distribution (from sensor data):")
        expected = {"sedan": 0.40, "suv": 0.25, "taxi": 0.12, "truck": 0.10,
                    "bus": 0.08, "motorcycle": 0.03, "emergency": 0.02}
        for vtype, pct in dist.items():
            exp = expected.get(vtype, 0)
            drift = abs(pct - exp)
            status = "OK" if drift < 0.02 else "DRIFT"
            print(f"    {vtype:12s}: {pct:.1%} (expected {exp:.0%}) [{status}]")

        # Emergency detection rate
        emg_rate = vd["is_emergency"].mean()
        print(f"  Emergency vehicle rate: {emg_rate:.2%}")

        # Peak hour speed reduction
        vd["hour"] = vd["timestamp"].dt.hour
        peak_speed = vd[vd["hour"].isin([8, 9, 17, 18])]["speed_kmh"].mean()
        offpeak_speed = vd[vd["hour"].isin([2, 3, 4, 5])]["speed_kmh"].mean()
        print(f"  Peak hour avg speed: {peak_speed:.1f} km/h")
        print(f"  Off-peak avg speed:  {offpeak_speed:.1f} km/h")
        print(f"  Congestion speed reduction: {((offpeak_speed - peak_speed) / offpeak_speed * 100):.1f}%")
    except Exception as e:
        print(f"  [WARN] vehicle_detections.csv: {e}")

    # 2. Intersection traffic patterns
    try:
        it = load_intersection_traffic()
        print(f"\nIntersection Traffic: {len(it):,} records")
        print(f"  Intersections: {it['intersection_id'].nunique()}")
        print(f"  Date range: {it['date'].min().date()} to {it['date'].max().date()}")
        peak_vol = it[it["hour"].isin([8, 18])]["vehicle_count"].mean()
        total_avg = it["vehicle_count"].mean()
        print(f"  Avg hourly volume: {total_avg:.0f} vehicles")
        print(f"  Peak hour volume:  {peak_vol:.0f} vehicles")
    except Exception as e:
        print(f"  [WARN] intersection_traffic.csv: {e}")

    # 3. Emergency events
    try:
        ee = load_emergency_events()
        print(f"\nEmergency Events: {len(ee):,} records")
        avg_resp = ee["response_time_min"].mean()
        avg_preempt = ee["response_time_with_preemption_min"].mean()
        print(f"  Avg response time: {avg_resp:.1f} min")
        print(f"  Avg with preemption: {avg_preempt:.1f} min")
        print(f"  Preemption savings: {avg_resp - avg_preempt:.1f} min ({(avg_resp - avg_preempt) / avg_resp * 100:.0f}%)")
    except Exception as e:
        print(f"  [WARN] emergency_events.csv: {e}")

    print("\n--- Validation Complete ---\n")


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

    # Validate synthetic datasets before training
    validate_datasets()

    runner.run_all_experiments(verbose=not args.quiet)
    elapsed = time.time() - start

    print(f"\nTraining completed in {elapsed:.1f}s")
    print(f"\nExporting results to {args.output}...")
    runner.export_results(args.output)
    print("Done.")


if __name__ == "__main__":
    main()
