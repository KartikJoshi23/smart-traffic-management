"""
Multi-Agent Traffic Grid Environment for Reinforcement Learning.
Models a 4x4 grid of intersections where traffic light agents learn
to coordinate signal timing to optimize traffic flow.
"""
import numpy as np
from collections import defaultdict
import json

INTERSECTION_NAMES = [
    "Al Rigga", "Deira City Centre", "Al Maktoum Bridge", "Bur Dubai",
    "Sheikh Zayed Rd", "DIFC", "Business Bay", "Dubai Mall",
    "Al Quoz", "Jumeirah Beach", "Palm Tunnel", "Marina JBR",
    "DIP", "Academic City", "Al Barsha", "Airport T3"
]


class Intersection:
    """Represents a single intersection with traffic light control."""

    def __init__(self, intersection_id, row, col, base_traffic_volume=500):
        self.id = intersection_id
        self.row = row
        self.col = col
        self.base_traffic_volume = base_traffic_volume

        # Traffic light state: 0 = NS green, 1 = EW green
        self.phase = 0
        self.phase_timer = 0
        self.yellow_timer = 0
        self.is_yellow = False
        self.min_green = 10
        self.max_green = 60
        self.yellow_duration = 3

        # Queue lengths for each direction
        self.queue_ns = 0  # North-South queue
        self.queue_ew = 0  # East-West queue

        # Metrics tracking
        self.total_wait_time = 0
        self.total_vehicles_passed = 0
        self.total_stops = 0
        self.total_emissions = 0
        self.emergency_delays = 0
        self.near_misses = 0

    def get_state(self):
        """Return discretized state representation."""
        # Discretize queue lengths into buckets
        q_ns = min(4, self.queue_ns // 5)  # 0-4 buckets
        q_ew = min(4, self.queue_ew // 5)
        phase = self.phase
        return (q_ns, q_ew, phase)

    def get_state_vector(self):
        """Return full state vector for detailed analysis."""
        return {
            "queue_ns": self.queue_ns,
            "queue_ew": self.queue_ew,
            "phase": self.phase,
            "phase_timer": self.phase_timer,
            "is_yellow": self.is_yellow,
            "total_wait": self.total_wait_time,
            "vehicles_passed": self.total_vehicles_passed
        }

    def reset(self):
        """Reset intersection to initial state."""
        self.phase = 0
        self.phase_timer = 0
        self.yellow_timer = 0
        self.is_yellow = False
        self.queue_ns = 0
        self.queue_ew = 0
        self.total_wait_time = 0
        self.total_vehicles_passed = 0
        self.total_stops = 0
        self.total_emissions = 0
        self.emergency_delays = 0
        self.near_misses = 0


class TrafficEnvironment:
    """
    4x4 Grid Traffic Environment for Multi-Agent RL.

    Each intersection is controlled by a traffic light agent.
    Vehicles flow between intersections based on traffic demand patterns.
    """

    GRID_SIZE = 4
    NUM_INTERSECTIONS = 16

    # Actions
    ACTION_KEEP = 0      # Keep current phase
    ACTION_SWITCH = 1    # Switch to other phase
    ACTION_EXTEND = 2    # Extend current phase by 5 seconds
    NUM_ACTIONS = 3

    def __init__(self, scenario="normal", time_steps_per_episode=200):
        self.scenario = scenario
        self.time_steps_per_episode = time_steps_per_episode
        self.current_step = 0
        self.current_hour = 8  # Start at 8 AM

        # Create 4x4 grid of intersections
        self.intersections = []
        for row in range(self.GRID_SIZE):
            for col in range(self.GRID_SIZE):
                idx = row * self.GRID_SIZE + col
                # Vary base traffic volume by location
                base_volume = 400 + (row + col) * 50 + np.random.randint(-30, 30)
                intersection = Intersection(f"INT-{idx+1:02d}", row, col, base_volume)
                self.intersections.append(intersection)

        # Scenario configuration
        self.scenario_config = self._get_scenario_config(scenario)

        # Emergency vehicle tracking
        self.active_emergencies = []
        self.emergency_probability = 0.02

        # Bus routes (predefined paths through the grid)
        self.bus_routes = self._create_bus_routes()

        # Metrics history
        self.episode_metrics = {
            "avg_wait_time": [],
            "throughput": [],
            "avg_queue": [],
            "emissions": [],
            "emergency_response": [],
            "safety_score": []
        }

    def _get_scenario_config(self, scenario):
        """Get configuration for different traffic scenarios."""
        configs = {
            "normal": {
                "traffic_multiplier": 1.0,
                "incident_intersection": None,
                "event_intersections": [],
                "bus_priority": False,
                "description": "Normal traffic conditions"
            },
            "rush_hour": {
                "traffic_multiplier": 2.5,
                "incident_intersection": None,
                "event_intersections": [],
                "bus_priority": False,
                "description": "Peak hour heavy traffic (2.5x volume)"
            },
            "incident": {
                "traffic_multiplier": 1.5,
                "incident_intersection": 5,  # INT-06 blocked
                "event_intersections": [],
                "bus_priority": False,
                "description": "Lane closure at INT-06 with rerouting"
            },
            "event": {
                "traffic_multiplier": 1.3,
                "incident_intersection": None,
                "event_intersections": [7, 11],  # Dubai Mall & Marina
                "bus_priority": False,
                "description": "Event traffic near Dubai Mall and Marina"
            },
            "bus_priority": {
                "traffic_multiplier": 1.2,
                "incident_intersection": None,
                "event_intersections": [],
                "bus_priority": True,
                "description": "Public transport signal priority enabled"
            }
        }
        return configs.get(scenario, configs["normal"])

    def _create_bus_routes(self):
        """Create bus routes as paths through the grid."""
        routes = [
            {"name": "Route-A", "path": [0, 1, 2, 3], "frequency": 0.3},
            {"name": "Route-B", "path": [0, 4, 8, 12], "frequency": 0.25},
            {"name": "Route-C", "path": [3, 7, 11, 15], "frequency": 0.25},
            {"name": "Route-D", "path": [12, 13, 14, 15], "frequency": 0.2},
            {"name": "Route-E", "path": [5, 6, 9, 10], "frequency": 0.15},
            {"name": "Route-F", "path": [0, 5, 10, 15], "frequency": 0.2},
        ]
        return routes

    def reset(self):
        """Reset environment to initial state."""
        self.current_step = 0
        self.current_hour = 8
        self.active_emergencies = []

        for intersection in self.intersections:
            intersection.reset()
            # Initial random queues
            intersection.queue_ns = np.random.randint(0, 10)
            intersection.queue_ew = np.random.randint(0, 10)

        return self._get_all_states()

    def _get_all_states(self):
        """Get states for all intersections."""
        return [inter.get_state() for inter in self.intersections]

    def _get_traffic_volume(self, intersection_idx):
        """Calculate traffic arrival rate for an intersection."""
        base = self.intersections[intersection_idx].base_traffic_volume
        multiplier = self.scenario_config["traffic_multiplier"]

        # Time-of-day pattern
        hour_pattern = self._get_hourly_pattern()
        time_factor = hour_pattern[self.current_hour % 24]

        # Event traffic boost
        if intersection_idx in self.scenario_config.get("event_intersections", []):
            multiplier *= 2.0

        # Incident rerouting
        incident_idx = self.scenario_config.get("incident_intersection")
        if incident_idx is not None:
            if intersection_idx == incident_idx:
                multiplier *= 0.3  # Reduced capacity
            # Neighboring intersections get more traffic
            row_i, col_i = incident_idx // 4, incident_idx % 4
            row_j, col_j = intersection_idx // 4, intersection_idx % 4
            if abs(row_i - row_j) + abs(col_i - col_j) == 1:
                multiplier *= 1.4

        # Vehicles arriving per time step (Poisson process)
        rate = base * multiplier * time_factor / 200  # Scale to per-step
        arrivals = np.random.poisson(max(1, rate))
        return arrivals

    def _get_hourly_pattern(self):
        """Dubai 24-hour traffic pattern."""
        return np.array([
            0.10, 0.08, 0.06, 0.05, 0.05, 0.08,
            0.20, 0.55, 0.85, 0.70, 0.55, 0.50,
            0.60, 0.65, 0.55, 0.50, 0.60, 0.80,
            0.90, 0.85, 0.70, 0.55, 0.35, 0.20
        ])

    def step(self, actions):
        """
        Execute one time step with given actions for all intersections.

        Args:
            actions: list of 16 actions (one per intersection)

        Returns:
            states: new states for all intersections
            rewards: rewards for all intersections
            done: whether episode is finished
            info: additional metrics
        """
        self.current_step += 1
        self.current_hour = 8 + (self.current_step * 30) // 3600  # 30 sec per step
        self.current_hour = self.current_hour % 24

        rewards = []
        total_vehicles_passed = 0
        total_wait = 0
        total_emissions = 0
        total_safety = 0

        # Process each intersection
        for idx, intersection in enumerate(self.intersections):
            action = actions[idx]
            reward = self._process_intersection(idx, intersection, action)
            rewards.append(reward)
            total_vehicles_passed += intersection.total_vehicles_passed
            total_wait += intersection.total_wait_time

        # Handle emergency vehicles
        self._process_emergencies()

        # Handle bus priority
        if self.scenario_config["bus_priority"]:
            self._process_bus_priority()

        done = self.current_step >= self.time_steps_per_episode

        # Collect metrics
        avg_queue = np.mean([i.queue_ns + i.queue_ew for i in self.intersections])
        avg_wait = np.mean([i.total_wait_time for i in self.intersections])
        throughput = sum([i.total_vehicles_passed for i in self.intersections])

        info = {
            "step": int(self.current_step),
            "avg_queue_length": round(float(avg_queue), 2),
            "avg_wait_time": round(float(avg_wait), 2),
            "total_throughput": int(throughput),
            "hour": int(self.current_hour)
        }

        return self._get_all_states(), rewards, done, info

    def _process_intersection(self, idx, intersection, action):
        """Process a single intersection for one time step."""
        # Apply action
        if intersection.is_yellow:
            intersection.yellow_timer += 1
            if intersection.yellow_timer >= intersection.yellow_duration:
                intersection.is_yellow = False
                intersection.phase = 1 - intersection.phase
                intersection.phase_timer = 0
                intersection.yellow_timer = 0
        else:
            intersection.phase_timer += 1

            if action == self.ACTION_SWITCH:
                if intersection.phase_timer >= intersection.min_green:
                    intersection.is_yellow = True
                    intersection.yellow_timer = 0
            elif action == self.ACTION_EXTEND:
                pass  # Just continue current phase
            # ACTION_KEEP: do nothing

        # Traffic arrivals
        ns_arrivals = self._get_traffic_volume(idx) // 2
        ew_arrivals = self._get_traffic_volume(idx) // 2
        intersection.queue_ns += ns_arrivals
        intersection.queue_ew += ew_arrivals

        # Traffic departures (green phase serves vehicles)
        if not intersection.is_yellow:
            if intersection.phase == 0:  # NS green
                served_ns = min(intersection.queue_ns, np.random.randint(2, 6))
                intersection.queue_ns -= served_ns
                intersection.total_vehicles_passed += served_ns
                # EW queue grows (red)
                intersection.total_stops += min(ew_arrivals, 3)
            else:  # EW green
                served_ew = min(intersection.queue_ew, np.random.randint(2, 6))
                intersection.queue_ew -= served_ew
                intersection.total_vehicles_passed += served_ew
                intersection.total_stops += min(ns_arrivals, 3)

        # Update wait time
        wait_penalty = intersection.queue_ns + intersection.queue_ew
        intersection.total_wait_time += wait_penalty

        # Emission model: more idling = more emissions
        idle_vehicles = intersection.queue_ns + intersection.queue_ew
        emission_rate = 0.002  # kg CO2 per idle vehicle per step
        step_emissions = idle_vehicles * emission_rate
        intersection.total_emissions += step_emissions

        # Safety: near-misses from phase changes
        if intersection.is_yellow:
            intersection.near_misses += np.random.binomial(1, 0.05)

        # Calculate reward
        reward = self._calculate_reward(intersection)

        # Cap queues to prevent explosion
        intersection.queue_ns = min(intersection.queue_ns, 100)
        intersection.queue_ew = min(intersection.queue_ew, 100)

        return reward

    def _calculate_reward(self, intersection):
        """Calculate reward for an intersection agent."""
        # Negative reward for waiting vehicles
        queue_penalty = -(intersection.queue_ns + intersection.queue_ew) * 0.1

        # Positive reward for throughput
        throughput_reward = intersection.total_vehicles_passed * 0.05

        # Emission penalty
        emission_penalty = -intersection.total_emissions * 0.5

        # Safety penalty
        safety_penalty = -intersection.near_misses * 2.0

        # Balance penalty (prefer balanced queues)
        imbalance = abs(intersection.queue_ns - intersection.queue_ew)
        balance_penalty = -imbalance * 0.05

        reward = queue_penalty + throughput_reward + emission_penalty + safety_penalty + balance_penalty
        return reward

    def _process_emergencies(self):
        """Simulate emergency vehicle events."""
        # Random emergency with low probability
        if np.random.random() < self.emergency_probability:
            idx = np.random.randint(0, 16)
            self.active_emergencies.append({
                "intersection": idx,
                "remaining_steps": 5,
                "type": np.random.choice(["ambulance", "fire_truck", "police"])
            })

        # Process active emergencies
        for emergency in self.active_emergencies:
            idx = emergency["intersection"]
            # Emergency preemption: give green to emergency direction
            self.intersections[idx].phase = 0  # Force NS green for emergency
            emergency["remaining_steps"] -= 1

        # Remove completed emergencies
        self.active_emergencies = [e for e in self.active_emergencies
                                    if e["remaining_steps"] > 0]

    def _process_bus_priority(self):
        """Give signal priority to bus routes."""
        for route in self.bus_routes:
            if np.random.random() < route["frequency"]:
                # Bus is at a random intersection on its route
                bus_at = np.random.choice(route["path"])
                intersection = self.intersections[bus_at]
                # Extend green for bus direction (reduce bus delay)
                if intersection.queue_ns > intersection.queue_ew:
                    if intersection.phase != 0:
                        intersection.phase = 0
                        intersection.phase_timer = 0

    def get_episode_summary(self):
        """Get summary metrics for the current episode."""
        total_throughput = sum(i.total_vehicles_passed for i in self.intersections)
        avg_wait = np.mean([i.total_wait_time for i in self.intersections])
        avg_queue = np.mean([i.queue_ns + i.queue_ew for i in self.intersections])
        total_emissions = sum(i.total_emissions for i in self.intersections)
        total_near_misses = sum(i.near_misses for i in self.intersections)
        total_stops = sum(i.total_stops for i in self.intersections)

        # Normalize safety score: near-misses per intersection, stops per 100 vehicles
        near_miss_rate = total_near_misses / max(1, self.NUM_INTERSECTIONS)
        stop_rate = total_stops / max(1, total_throughput) * 100  # stops per 100 vehicles

        return {
            "total_throughput": int(total_throughput),
            "avg_wait_time": round(float(avg_wait), 2),
            "avg_queue_length": round(float(avg_queue), 2),
            "total_emissions_kg": round(float(total_emissions), 4),
            "total_near_misses": int(total_near_misses),
            "total_stops": int(total_stops),
            "safety_score": round(float(max(0, min(100, 100 - near_miss_rate * 2 - stop_rate * 0.35))), 2)
        }

    def get_grid_state(self):
        """Get current grid state for visualization."""
        grid = []
        for i, intersection in enumerate(self.intersections):
            total_q = intersection.queue_ns + intersection.queue_ew
            congestion = round(min(1.0, total_q / 50.0), 3)
            grid.append({
                "id": intersection.id,
                "name": INTERSECTION_NAMES[i],
                "row": int(intersection.row),
                "col": int(intersection.col),
                "phase": int(intersection.phase),
                "is_yellow": bool(intersection.is_yellow),
                "queue_ns": int(intersection.queue_ns),
                "queue_ew": int(intersection.queue_ew),
                "congestion": congestion,
                "vehicles_passed": int(intersection.total_vehicles_passed),
                "emissions": round(float(intersection.total_emissions), 4)
            })
        return grid
