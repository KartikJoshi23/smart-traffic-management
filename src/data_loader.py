"""
Data Loader - Load and preprocess original and synthetic datasets.
"""
import pandas as pd
import os

DATASETS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "Datasets")
SYNTHETIC_DIR = os.path.join(DATASETS_DIR, "synthetic")


def load_synthetic(name):
    """Load a synthetic dataset by name (without .csv extension)."""
    path = os.path.join(SYNTHETIC_DIR, f"{name}.csv")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Synthetic dataset not found: {path}")
    return pd.read_csv(path)


def load_original(name):
    """Load an original dataset by filename."""
    path = os.path.join(DATASETS_DIR, name)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Dataset not found: {path}")
    return pd.read_csv(path)


def load_intersection_traffic():
    """Load and return intersection traffic data with parsed dates."""
    df = load_synthetic("intersection_traffic")
    df["date"] = pd.to_datetime(df["date"])
    return df


def load_vehicle_detections():
    """Load vehicle detection sensor data with parsed timestamps."""
    df = load_synthetic("vehicle_detections")
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    return df


def load_emergency_events():
    """Load emergency event data with parsed timestamps."""
    df = load_synthetic("emergency_events")
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    return df


def load_congestion_index():
    """Load congestion index data with parsed dates."""
    df = load_synthetic("congestion_index")
    df["date"] = pd.to_datetime(df["date"])
    return df


def load_signal_timing():
    """Load fixed-timer signal timing configurations."""
    return load_synthetic("signal_timing")


def load_bus_routes():
    """Load original bus routes dataset."""
    return load_original("Bus_Routes.csv")


def load_public_transport_trips():
    """Load public transport trip data."""
    return load_original("Public_Transport_Trips_by_Type_of_Transport.csv")


def get_dataset_summary():
    """Return a summary of all available datasets."""
    summary = {}

    # Synthetic datasets
    synthetic_files = [
        "intersection_traffic", "vehicle_detections",
        "emergency_events", "congestion_index", "signal_timing"
    ]
    for name in synthetic_files:
        try:
            df = load_synthetic(name)
            summary[f"synthetic/{name}"] = {
                "rows": len(df),
                "columns": list(df.columns),
                "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()}
            }
        except FileNotFoundError:
            summary[f"synthetic/{name}"] = {"status": "not generated"}

    # Original datasets
    if os.path.exists(DATASETS_DIR):
        for f in os.listdir(DATASETS_DIR):
            if f.endswith(".csv"):
                try:
                    df = pd.read_csv(os.path.join(DATASETS_DIR, f))
                    summary[f"original/{f}"] = {
                        "rows": len(df),
                        "columns": list(df.columns)
                    }
                except Exception:
                    summary[f"original/{f}"] = {"status": "error reading"}

    return summary
