# backend/ai_logic/readiness.py
from typing import Dict, Any

def calculate_readiness_score(sleep_hours: float, soreness_level: int, energy_level: int) -> Dict[str, Any]:
    """
    Computes a score from 0-100 indicating a user's readiness to train.
    soreness_level: 1 (none) to 10 (extremely sore)
    energy_level: 1 (exhausted) to 10 (fully charged)
    """
    # 1. Sleep component (30% weight)
    # 8 hours is optimal
    if sleep_hours >= 8.0:
        sleep_score = 100.0
    else:
        # Deduct 15 points per hour under 8
        sleep_score = max(0.0, 100.0 - (8.0 - sleep_hours) * 15.0)

    # 2. Soreness component (35% weight)
    # Low soreness is better, so we invert it
    soreness_score = (11.0 - soreness_level) * 10.0
    soreness_score = max(0.0, min(100.0, soreness_score))

    # 3. Energy component (35% weight)
    energy_score = energy_level * 10.0
    energy_score = max(0.0, min(100.0, energy_score))

    # Combined Score
    raw_score = (0.30 * sleep_score) + (0.35 * soreness_score) + (0.35 * energy_score)
    readiness_score = round(max(0.0, min(100.0, raw_score)), 1)

    # Determine advice and intensity recommendations
    if readiness_score >= 80.0:
        intensity_multiplier = 1.0
        advice = "🚀 Excellent Readiness! You are fully primed to train. Push hard and aim for progressive overload."
        action = "Train Normally"
    elif readiness_score >= 50.0:
        intensity_multiplier = 0.8
        advice = "⚠️ Moderate Readiness. You can train, but reduce workout intensity by 15-20% (use lighter weights or do fewer sets) and prioritize joint warmups."
        action = "Reduce Intensity"
    else:
        intensity_multiplier = 0.0
        advice = "🛑 Low Readiness. Your body needs recovery. We highly recommend taking a rest day, doing light stretching, and focusing on sleep and nutrition."
        action = "Recovery / Rest Day"

    return {
        "score": readiness_score,
        "intensity_multiplier": intensity_multiplier,
        "action": action,
        "advice": advice
    }
