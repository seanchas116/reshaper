export function clamp(value: number, min: number, max: number) {
  return Math.max(Math.min(value, max), min);
}

export function lerp(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t;
}
