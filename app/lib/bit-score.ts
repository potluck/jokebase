interface ScoredLine {
  rating: number | null;
  lineVersion: {
    line: {
      type: string;
    };
  };
}

export function calculateBitScore(lines: readonly ScoredLine[]) {
  const ratings = lines
    .filter((line) => line.lineVersion.line.type !== "SETUP")
    .map((line) => line.rating ?? 0);

  if (ratings.length === 0) return null;
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
}

export function averageScores(scores: readonly number[]) {
  if (scores.length === 0) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

export function formatBitScore(score: number) {
  return score.toFixed(1);
}
