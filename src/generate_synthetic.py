"""
Synthetic Dataset Generator for Smart Traffic Management System.
Generates realistic traffic data calibrated from actual Dubai transport datasets.
"""
import numpy as np
import pandas as pd
import os
from datetime import datetime, timedelta
import random

np.random.seed(42)
random.seed(42)

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "Datasets", "synthetic")

# Dubai intersection names (based on real Dubai locations)
INTERSECTION_NAMES = [
    "Al Rigga - Salahuddin", "Deira City Centre", "Al Maktoum Bridge",
    "Bur Dubai - Khalid Bin Waleed", "Sheikh Zayed Rd - Interchange 1",
    "DIFC - Gate Avenue", "Business Bay - Marasi Dr",
    "Dubai Mall Junction", "Al Quoz Industrial", "Jumeirah Beach Rd",
    "Palm Jumeirah Tunnel", "Marina Walk - JBR",
    "DIP - Al Asayel St", "Academic City Roundabout",
    "Hessa Street - Al Barsha", "Dubai Airport - Terminal 3"
]

INTERSECTION_IDS = [f"INT-{i+1:02d}" for i in range(16)]

# Vehicle types with Dubai-realistic proportions
VEHICLE_TYPES = {
    "sedan": 0.40,
    "suv": 0.25,
    "bus": 0.08,
    "truck": 0.10,
    "taxi": 0.12,
    "motorcycle": 0.03,
    "emergency": 0.02
}


def generate_hourly_traffic_pattern():
    """Generate realistic 24-hour traffic volume pattern for Dubai."""
    # Dubai traffic pattern: peaks at 7-9 AM and 5-8 PM, quiet 1-5 AM
    hours = np.arange(24)
    base_pattern = np.array([
        0.10, 0.08, 0.06, 0.05, 0.05, 0.08,   # 00-05: late night/early morning
        0.20, 0.55, 0.85, 0.70, 0.55, 0.50,     # 06-11: morning rush
        0.60, 0.65, 0.55, 0.50, 0.60, 0.80,     # 12-17: afternoon to evening rush
        0.90, 0.85, 0.70, 0.55, 0.35, 0.20      # 18-23: evening rush to night
    ])
    return base_pattern


def generate_intersection_traffic(days=90):
    """Generate hourly vehicle counts at 16 intersections over 90 days."""
    print("Generating intersection traffic data...")
    records = []
    base_pattern = generate_hourly_traffic_pattern()
    start_date = datetime(2025, 1, 1)

    for day_offset in range(days):
        current_date = start_date + timedelta(days=day_offset)
        day_of_week = current_date.weekday()
        is_weekend = day_of_week >= 4  # Friday-Saturday weekend in Dubai

        for int_idx, int_id in enumerate(INTERSECTION_IDS):
            # Each intersection has a base capacity factor
            capacity_factor = 800 + int_idx * 120 + np.random.randint(-50, 50)

            for hour in range(24):
                # Adjust pattern for weekends
                if is_weekend:
                    volume_factor = base_pattern[hour] * 0.7
                    if 10 <= hour <= 22:
                        volume_factor *= 1.3  # More leisure traffic
                else:
                    volume_factor = base_pattern[hour]

                # Add intersection-specific variation
                noise = np.random.normal(1.0, 0.15)
                vehicle_count = int(capacity_factor * volume_factor * noise)
                vehicle_count = max(10, vehicle_count)

                # Calculate derived metrics
                avg_speed = max(5, 60 - (vehicle_count / capacity_factor) * 45 + np.random.normal(0, 3))
                avg_wait_time = max(0, (vehicle_count / capacity_factor) * 120 + np.random.normal(0, 10))
                congestion_level = min(1.0, max(0.0, vehicle_count / (capacity_factor * 1.2)))

                # Queue length (vehicles waiting)
                queue_ns = max(0, int(vehicle_count * 0.3 * congestion_level + np.random.normal(0, 2)))
                queue_ew = max(0, int(vehicle_count * 0.3 * congestion_level + np.random.normal(0, 2)))

                records.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "hour": hour,
                    "day_of_week": current_date.strftime("%A"),
                    "is_weekend": is_weekend,
                    "intersection_id": int_id,
                    "intersection_name": INTERSECTION_NAMES[int_idx],
                    "vehicle_count": vehicle_count,
                    "avg_speed_kmh": round(avg_speed, 1),
                    "avg_wait_time_sec": round(avg_wait_time, 1),
                    "congestion_level": round(congestion_level, 3),
                    "queue_length_ns": queue_ns,
                    "queue_length_ew": queue_ew
                })

    df = pd.DataFrame(records)
    return df


def generate_vehicle_detections(days=30):
    """Generate IoT sensor vehicle detection records."""
    print("Generating vehicle detection data...")
    records = []
    start_date = datetime(2025, 1, 1)
    base_pattern = generate_hourly_traffic_pattern()

    for day_offset in range(days):
        current_date = start_date + timedelta(days=day_offset)

        for int_idx in range(16):
            for hour in range(24):
                num_detections = int(base_pattern[hour] * (300 + int_idx * 30) *
                                     np.random.normal(1.0, 0.1))
                num_detections = max(5, min(num_detections, 800))

                # Sample a subset of individual detections
                for _ in range(min(num_detections, 50)):  # Sample up to 50 per hour
                    vtype = np.random.choice(list(VEHICLE_TYPES.keys()),
                                              p=list(VEHICLE_TYPES.values()))

                    speed_limits = {
                        "sedan": (20, 80), "suv": (20, 75), "bus": (15, 50),
                        "truck": (15, 45), "taxi": (20, 70), "motorcycle": (25, 90),
                        "emergency": (30, 100)
                    }
                    spd_min, spd_max = speed_limits[vtype]
                    speed = np.random.uniform(spd_min, spd_max)

                    # Reduce speed during congestion
                    congestion_factor = base_pattern[hour]
                    if congestion_factor > 0.7:
                        speed *= (1 - congestion_factor * 0.4)

                    lane = np.random.choice(["Lane 1", "Lane 2", "Lane 3", "Lane 4"])
                    direction = np.random.choice(["North", "South", "East", "West"])

                    minute = np.random.randint(0, 60)
                    second = np.random.randint(0, 60)
                    timestamp = current_date.replace(hour=hour, minute=minute, second=second)

                    records.append({
                        "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                        "intersection_id": INTERSECTION_IDS[int_idx],
                        "vehicle_type": vtype,
                        "speed_kmh": round(max(5, speed), 1),
                        "lane": lane,
                        "direction": direction,
                        "is_emergency": vtype == "emergency"
                    })

    df = pd.DataFrame(records)
    return df


def generate_emergency_events(days=90):
    """Generate emergency vehicle event records."""
    print("Generating emergency event data...")
    records = []
    start_date = datetime(2025, 1, 1)

    for day_offset in range(days):
        current_date = start_date + timedelta(days=day_offset)
        # 3-8 emergency events per day
        num_events = np.random.randint(3, 9)

        for _ in range(num_events):
            hour = np.random.choice(24, p=generate_hourly_traffic_pattern() /
                                     generate_hourly_traffic_pattern().sum())
            minute = np.random.randint(0, 60)
            timestamp = current_date.replace(hour=int(hour), minute=minute)

            int_idx = np.random.randint(0, 16)
            event_type = np.random.choice(
                ["ambulance", "fire_truck", "police"],
                p=[0.50, 0.20, 0.30]
            )

            # Response time depends on congestion
            base_response = {"ambulance": 8, "fire_truck": 10, "police": 6}
            response_time = base_response[event_type] + np.random.exponential(3)

            # Signal preemption reduces response time
            preemption_saving = np.random.uniform(1.5, 4.0)

            records.append({
                "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "intersection_id": INTERSECTION_IDS[int_idx],
                "intersection_name": INTERSECTION_NAMES[int_idx],
                "event_type": event_type,
                "response_time_min": round(response_time, 1),
                "response_time_with_preemption_min": round(max(2, response_time - preemption_saving), 1),
                "congestion_at_event": round(np.random.uniform(0.2, 0.9), 2),
                "vehicles_cleared": np.random.randint(5, 30)
            })

    df = pd.DataFrame(records)
    return df


def generate_congestion_index(days=90):
    """Generate historical congestion index data by zone."""
    print("Generating congestion index data...")
    zones = ["Deira", "Bur Dubai", "Downtown", "Marina", "JBR",
             "Business Bay", "Al Quoz", "DIP", "Academic City",
             "Jumeirah", "Al Barsha", "Airport Area"]
    records = []
    start_date = datetime(2025, 1, 1)

    for day_offset in range(days):
        current_date = start_date + timedelta(days=day_offset)
        is_weekend = current_date.weekday() >= 4

        for zone in zones:
            for hour in range(24):
                base = generate_hourly_traffic_pattern()[hour]

                # Zone-specific adjustments
                zone_factors = {
                    "Deira": 1.2, "Bur Dubai": 1.1, "Downtown": 1.4,
                    "Marina": 1.0, "JBR": 0.9, "Business Bay": 1.3,
                    "Al Quoz": 0.8, "DIP": 0.7, "Academic City": 0.6,
                    "Jumeirah": 0.85, "Al Barsha": 0.95, "Airport Area": 1.15
                }

                congestion = base * zone_factors.get(zone, 1.0)
                if is_weekend:
                    congestion *= 0.75

                congestion = min(1.0, congestion + np.random.normal(0, 0.08))
                congestion = max(0.0, congestion)

                # CO2 emission estimate (kg/km based on congestion)
                co2_per_vehicle = 0.12 + congestion * 0.15  # Higher congestion = more idling
                est_vehicles = int(500 * (1 + congestion) + np.random.normal(0, 30))
                total_co2 = round(co2_per_vehicle * est_vehicles * 0.5, 2)  # per km

                records.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "hour": hour,
                    "zone": zone,
                    "congestion_index": round(congestion, 3),
                    "estimated_vehicles": max(50, est_vehicles),
                    "avg_speed_kmh": round(max(8, 65 * (1 - congestion * 0.7) +
                                                np.random.normal(0, 3)), 1),
                    "co2_emissions_kg": max(0, total_co2),
                    "fuel_waste_liters": round(max(0, congestion * 200 +
                                                    np.random.normal(0, 15)), 1),
                    "is_weekend": is_weekend
                })

    df = pd.DataFrame(records)
    return df


def generate_signal_timing(num_intersections=16):
    """Generate current fixed-timer signal configurations."""
    print("Generating signal timing data...")
    records = []

    for idx in range(num_intersections):
        # Fixed timer configurations for different time periods
        periods = [
            ("Off-Peak Night", "00:00-06:00", 30, 30, 5),
            ("Morning Pre-Rush", "06:00-07:00", 35, 25, 5),
            ("Morning Rush", "07:00-09:00", 45, 30, 5),
            ("Mid-Morning", "09:00-12:00", 35, 30, 5),
            ("Lunch", "12:00-14:00", 35, 35, 5),
            ("Afternoon", "14:00-17:00", 35, 30, 5),
            ("Evening Rush", "17:00-20:00", 45, 30, 5),
            ("Evening", "20:00-22:00", 35, 30, 5),
            ("Late Night", "22:00-00:00", 30, 30, 5),
        ]

        for period_name, time_range, ns_green, ew_green, yellow in periods:
            cycle_length = ns_green + ew_green + 2 * yellow
            records.append({
                "intersection_id": INTERSECTION_IDS[idx],
                "intersection_name": INTERSECTION_NAMES[idx],
                "time_period": period_name,
                "time_range": time_range,
                "ns_green_duration_sec": ns_green,
                "ew_green_duration_sec": ew_green,
                "yellow_duration_sec": yellow,
                "total_cycle_length_sec": cycle_length,
                "pedestrian_phase_sec": 15,
                "left_turn_phase_sec": 10
            })

    df = pd.DataFrame(records)
    return df


def main():
    """Generate all synthetic datasets."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Generate datasets
    intersection_traffic = generate_intersection_traffic(days=90)
    intersection_traffic.to_csv(os.path.join(OUTPUT_DIR, "intersection_traffic.csv"), index=False)
    print(f"  -> intersection_traffic.csv: {len(intersection_traffic)} records")

    vehicle_detections = generate_vehicle_detections(days=7)
    vehicle_detections.to_csv(os.path.join(OUTPUT_DIR, "vehicle_detections.csv"), index=False)
    print(f"  -> vehicle_detections.csv: {len(vehicle_detections)} records")

    emergency_events = generate_emergency_events(days=90)
    emergency_events.to_csv(os.path.join(OUTPUT_DIR, "emergency_events.csv"), index=False)
    print(f"  -> emergency_events.csv: {len(emergency_events)} records")

    congestion_index = generate_congestion_index(days=90)
    congestion_index.to_csv(os.path.join(OUTPUT_DIR, "congestion_index.csv"), index=False)
    print(f"  -> congestion_index.csv: {len(congestion_index)} records")

    signal_timing = generate_signal_timing()
    signal_timing.to_csv(os.path.join(OUTPUT_DIR, "signal_timing.csv"), index=False)
    print(f"  -> signal_timing.csv: {len(signal_timing)} records")

    print("\n✅ All synthetic datasets generated successfully!")
    print(f"Output directory: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
