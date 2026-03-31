"""
Multi-Criteria Decision Making (MCDM) Methods.
Implements WSM (Weighted Sum Model) and TOPSIS for evaluating traffic control policies.
"""
import numpy as np


class DecisionMatrix:
    """
    Manages the decision matrix for MCDM evaluation.

    Criteria:
    - Efficiency (throughput): MAXIMIZE
    - Safety (near misses): MINIMIZE
    - Emissions (CO2 kg): MINIMIZE
    - Public Transport Priority (bus delay): MINIMIZE
    """

    CRITERIA = ["efficiency", "safety", "emissions", "public_transport"]
    CRITERIA_LABELS = [
        "Efficiency\n(Throughput)",
        "Safety\n(Score 0-100)",
        "Emissions\n(CO2 kg, lower better)",
        "Public Transport\n(Bus Delay, lower better)"
    ]

    # Direction: True = maximize, False = minimize
    CRITERIA_DIRECTION = [True, True, False, False]

    # Default weights (sum to 1.0)
    DEFAULT_WEIGHTS = [0.35, 0.25, 0.25, 0.15]

    def __init__(self, alternatives, criteria_values, weights=None):
        """
        Args:
            alternatives: list of alternative names
            criteria_values: 2D array [num_alternatives x num_criteria]
            weights: criteria weights (default: [0.35, 0.25, 0.25, 0.15])
        """
        self.alternatives = alternatives
        self.matrix = np.array(criteria_values, dtype=float)
        self.weights = np.array(weights if weights else self.DEFAULT_WEIGHTS)
        self.num_alternatives = len(alternatives)
        self.num_criteria = len(self.CRITERIA)

        assert self.matrix.shape == (self.num_alternatives, self.num_criteria), \
            f"Matrix shape mismatch: {self.matrix.shape} != ({self.num_alternatives}, {self.num_criteria})"
        assert abs(self.weights.sum() - 1.0) < 0.001, "Weights must sum to 1.0"

    def normalize_matrix(self, method="minmax"):
        """Normalize the decision matrix."""
        normalized = np.zeros_like(self.matrix)

        for j in range(self.num_criteria):
            col = self.matrix[:, j]
            col_min, col_max = col.min(), col.max()

            if col_max - col_min == 0:
                normalized[:, j] = 1.0
            elif self.CRITERIA_DIRECTION[j]:  # Maximize
                normalized[:, j] = (col - col_min) / (col_max - col_min)
            else:  # Minimize
                normalized[:, j] = (col_max - col) / (col_max - col_min)

        return normalized

    def vector_normalize(self):
        """Vector normalization for TOPSIS."""
        norms = np.sqrt((self.matrix ** 2).sum(axis=0))
        norms[norms == 0] = 1  # Avoid division by zero
        return self.matrix / norms


def wsm(decision_matrix):
    """
    Weighted Sum Model (WSM).

    Calculates weighted sum of normalized criteria values.
    Higher score = better alternative.

    Returns:
        scores: array of WSM scores
        ranking: sorted indices (best first)
        details: dict with normalized matrix and weighted scores
    """
    dm = decision_matrix
    normalized = dm.normalize_matrix()
    weighted = normalized * dm.weights
    scores = weighted.sum(axis=1)

    ranking = np.argsort(-scores)  # Descending order

    return {
        "scores": scores.tolist(),
        "ranking": ranking.tolist(),
        "ranked_alternatives": [dm.alternatives[i] for i in ranking],
        "ranked_scores": [round(scores[i], 4) for i in ranking],
        "normalized_matrix": normalized.tolist(),
        "weighted_matrix": weighted.tolist(),
        "criteria_contributions": {
            dm.alternatives[i]: {
                dm.CRITERIA[j]: round(weighted[i, j], 4)
                for j in range(dm.num_criteria)
            }
            for i in range(dm.num_alternatives)
        }
    }


def topsis(decision_matrix):
    """
    TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution).

    Steps:
    1. Vector normalize the decision matrix
    2. Apply weights
    3. Find ideal (best) and anti-ideal (worst) solutions
    4. Calculate distances to ideal and anti-ideal
    5. Calculate closeness coefficient

    Returns:
        scores: closeness coefficients (0-1, higher = better)
        ranking: sorted indices (best first)
        details: intermediate calculations
    """
    dm = decision_matrix

    # Step 1: Vector normalization
    normalized = dm.vector_normalize()

    # Step 2: Weighted normalized matrix
    weighted = normalized * dm.weights

    # Step 3: Ideal and Anti-Ideal solutions
    ideal = np.zeros(dm.num_criteria)
    anti_ideal = np.zeros(dm.num_criteria)

    for j in range(dm.num_criteria):
        if dm.CRITERIA_DIRECTION[j]:  # Maximize
            ideal[j] = weighted[:, j].max()
            anti_ideal[j] = weighted[:, j].min()
        else:  # Minimize
            ideal[j] = weighted[:, j].min()
            anti_ideal[j] = weighted[:, j].max()

    # Step 4: Distances
    dist_ideal = np.sqrt(((weighted - ideal) ** 2).sum(axis=1))
    dist_anti_ideal = np.sqrt(((weighted - anti_ideal) ** 2).sum(axis=1))

    # Step 5: Closeness coefficient
    denom = dist_ideal + dist_anti_ideal
    denom[denom == 0] = 1  # Avoid division by zero
    closeness = dist_anti_ideal / denom

    ranking = np.argsort(-closeness)  # Descending

    return {
        "scores": closeness.tolist(),
        "ranking": ranking.tolist(),
        "ranked_alternatives": [dm.alternatives[i] for i in ranking],
        "ranked_scores": [round(closeness[i], 4) for i in ranking],
        "ideal_solution": ideal.tolist(),
        "anti_ideal_solution": anti_ideal.tolist(),
        "distance_to_ideal": dist_ideal.tolist(),
        "distance_to_anti_ideal": dist_anti_ideal.tolist(),
        "normalized_matrix": normalized.tolist(),
        "weighted_matrix": weighted.tolist()
    }


def sensitivity_analysis(decision_matrix, weight_variations=5):
    """
    Perform sensitivity analysis by varying weights.

    Tests how ranking changes when each criterion's weight is varied.
    """
    results = []
    base_weights = decision_matrix.weights.copy()

    for criterion_idx in range(decision_matrix.num_criteria):
        criterion_results = []

        for delta in np.linspace(-0.15, 0.15, weight_variations):
            modified_weights = base_weights.copy()
            modified_weights[criterion_idx] += delta

            # Redistribute the delta across other criteria
            remaining_indices = [i for i in range(decision_matrix.num_criteria)
                                  if i != criterion_idx]
            adjustment = -delta / len(remaining_indices)
            for ri in remaining_indices:
                modified_weights[ri] += adjustment

            # Ensure all weights are positive and sum to 1
            modified_weights = np.maximum(modified_weights, 0.05)
            modified_weights /= modified_weights.sum()

            # Create new decision matrix with modified weights
            dm_mod = DecisionMatrix(
                decision_matrix.alternatives,
                decision_matrix.matrix,
                weights=modified_weights.tolist()
            )

            topsis_result = topsis(dm_mod)
            wsm_result = wsm(dm_mod)

            criterion_results.append({
                "weight_delta": round(delta, 3),
                "modified_weight": round(modified_weights[criterion_idx], 4),
                "topsis_ranking": topsis_result["ranking"],
                "wsm_ranking": wsm_result["ranking"],
                "topsis_scores": topsis_result["scores"],
                "wsm_scores": wsm_result["scores"]
            })

        results.append({
            "criterion": decision_matrix.CRITERIA[criterion_idx],
            "variations": criterion_results
        })

    return results


def evaluate_policies(policy_results):
    """
    Evaluate traffic control policies using both WSM and TOPSIS.

    Args:
        policy_results: dict with policy names as keys, each containing:
            - throughput, safety_score, emissions, bus_delay

    Returns:
        Complete evaluation results
    """
    alternatives = list(policy_results.keys())
    criteria_values = []

    for policy_name in alternatives:
        result = policy_results[policy_name]
        criteria_values.append([
            result["throughput"],
            result["safety_score"],
            result["emissions"],
            result["bus_delay"]
        ])

    dm = DecisionMatrix(alternatives, criteria_values)

    wsm_result = wsm(dm)
    topsis_result = topsis(dm)
    sensitivity = sensitivity_analysis(dm)

    return {
        "alternatives": alternatives,
        "raw_matrix": criteria_values,
        "criteria": DecisionMatrix.CRITERIA,
        "criteria_labels": DecisionMatrix.CRITERIA_LABELS,
        "weights": DecisionMatrix.DEFAULT_WEIGHTS,
        "wsm": wsm_result,
        "topsis": topsis_result,
        "sensitivity_analysis": sensitivity
    }
