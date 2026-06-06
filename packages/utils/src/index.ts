export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function scoreRatio(value: number, weak: number, strong: number): number {
  if (strong === weak) {
    return 50;
  }

  return clamp(((value - weak) / (strong - weak)) * 100, 0, 100);
}

export function scoreInverseGap(value: number, benchmark: number, maxGapPercent: number): number {
  if (benchmark <= 0) {
    return 50;
  }

  const gap = Math.abs(value - benchmark) / benchmark;
  return clamp(100 - (gap / maxGapPercent) * 100, 0, 100);
}
