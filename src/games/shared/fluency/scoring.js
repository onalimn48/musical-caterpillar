function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export const FLUENCY_FORMULAS = {
  "fluency-v2": {
    id: "fluency-v2",
    weights: {
      accuracy: 0.7,
      flow: 0.2,
      rate: 0.1,
    },
    targetCorrectNotes: 30,
    advancedBonus: {
      maxRawBonus: 4,
      surplusMultiplier: 0.5,
      accuracyFloor: 85,
      flowFloor: 80,
      qualityRange: 15,
      flowRange: 20,
    },
  },
};

export const MIN_ATTEMPTS_FOR_SCORE = 15;

export function getMedian(values = []) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

export function getAccuracyPct(attemptedNotes, correctNotes) {
  if (!Number.isFinite(attemptedNotes) || attemptedNotes <= 0) return 0;
  const safeCorrect = Number.isFinite(correctNotes) ? correctNotes : 0;
  return clamp((safeCorrect / attemptedNotes) * 100, 0, 100);
}

export function getRateScore(correctNotes, targetCorrectNotes = 30) {
  if (!Number.isFinite(correctNotes) || correctNotes <= 0) return 0;
  if (!Number.isFinite(targetCorrectNotes) || targetCorrectNotes <= 0) return 0;
  return clamp((correctNotes / targetCorrectNotes) * 100, 0, 100);
}

export function getFlowPct({ attemptedNotes, hesitationCount }) {
  const safeAttempted = Number.isFinite(attemptedNotes) && attemptedNotes > 0 ? attemptedNotes : 0;
  if (safeAttempted === 0) return null;
  const safeHesitations = Number.isFinite(hesitationCount) && hesitationCount > 0 ? hesitationCount : 0;
  return clamp(100 * (1 - (safeHesitations / safeAttempted)), 0, 100);
}

export function getFlowConfidence(attemptedNotes) {
  if (!Number.isFinite(attemptedNotes) || attemptedNotes < MIN_ATTEMPTS_FOR_SCORE) return "none";
  return "full";
}

export function getFluencyBand(score) {
  if (score >= 95) return "Excellent";
  if (score >= 88) return "Strong";
  if (score >= 78) return "Secure";
  if (score >= 68) return "Developing";
  return "Emerging";
}

export function getAdvancedBonusLabel(bonus) {
  if (!Number.isFinite(bonus) || bonus <= 0) return null;
  if (bonus >= 3) return "Exceptional Fluency";
  if (bonus >= 1.5) return "Advanced Fluency";
  return "Bonus Fluency";
}

export function getAdvancedFluencyBonus({
  correctNotes,
  accuracyPct,
  flowPct,
  formulaVersion = "fluency-v2",
}) {
  const formula = FLUENCY_FORMULAS[formulaVersion] || FLUENCY_FORMULAS["fluency-v2"];
  const targetCorrectNotes = formula.targetCorrectNotes;
  const correctSurplus = Math.max(0, (correctNotes || 0) - targetCorrectNotes);
  const rawBonus = Math.min(
    formula.advancedBonus.maxRawBonus,
    formula.advancedBonus.surplusMultiplier * correctSurplus,
  );
  const accuracyQuality = clamp(
    ((accuracyPct || 0) - formula.advancedBonus.accuracyFloor) / formula.advancedBonus.qualityRange,
    0,
    1,
  );
  const flowQuality = clamp(
    ((flowPct || 0) - formula.advancedBonus.flowFloor) / formula.advancedBonus.flowRange,
    0,
    1,
  );
  const bonus = rawBonus * accuracyQuality * flowQuality;

  return {
    advancedFluencyBonus: round(bonus, 1),
    advancedBonusLabel: getAdvancedBonusLabel(bonus),
    breakdown: {
      correctSurplus,
      rawBonus: round(rawBonus, 1),
      accuracyQuality: round(accuracyQuality, 3),
      flowQuality: round(flowQuality, 3),
    },
  };
}

export function getFluencyScore({
  attemptedNotes,
  correctNotes,
  flowPct,
  formulaVersion = "fluency-v2",
}) {
  const formula = FLUENCY_FORMULAS[formulaVersion] || FLUENCY_FORMULAS["fluency-v2"];
  const accuracyPct = getAccuracyPct(attemptedNotes, correctNotes);
  const rateScore = getRateScore(correctNotes, formula.targetCorrectNotes);
  const fluencyScore = clamp(
    (
      (accuracyPct * formula.weights.accuracy) +
      ((flowPct || 0) * formula.weights.flow) +
      (rateScore * formula.weights.rate)
    ),
    0,
    100,
  );

  return {
    accuracyPct: round(accuracyPct, 1),
    flowPct: round(flowPct || 0, 1),
    rateScore: round(rateScore, 1),
    fluencyScore: round(fluencyScore, 1),
  };
}

export function scoreFluency({
  attemptedNotes,
  correctNotes,
  flowPct,
  formulaVersion = "fluency-v2",
}) {
  const formula = FLUENCY_FORMULAS[formulaVersion] || FLUENCY_FORMULAS["fluency-v2"];
  const score = getFluencyScore({
    attemptedNotes,
    correctNotes,
    flowPct,
    formulaVersion: formula.id,
  });
  const bonus = getAdvancedFluencyBonus({
    correctNotes,
    accuracyPct: score.accuracyPct,
    flowPct: score.flowPct,
    formulaVersion: formula.id,
  });

  return {
    formulaVersion: formula.id,
    fluencyScore: score.fluencyScore,
    band: getFluencyBand(score.fluencyScore),
    correctRateCount: Number.isFinite(correctNotes) ? correctNotes : 0,
    breakdown: {
      accuracyPct: score.accuracyPct,
      flowPct: score.flowPct,
      rateScore: score.rateScore,
    },
    advancedFluencyBonus: bonus.advancedFluencyBonus,
    advancedBonusLabel: bonus.advancedBonusLabel,
    advancedBonusBreakdown: bonus.breakdown,
  };
}
