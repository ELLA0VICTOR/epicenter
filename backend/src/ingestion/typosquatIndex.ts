export interface TyposquatMatch {
  sourceName: string;
  similarName: string;
  distance: number;
}

export function levenshteinDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (left.length === 0) return right.length;
  if (right.length === 0) return left.length;

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  let current = new Array<number>(right.length + 1);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost =
        left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        (previous[rightIndex] ?? 0) + 1,
        (current[rightIndex - 1] ?? 0) + 1,
        (previous[rightIndex - 1] ?? 0) + substitutionCost,
      );
    }
    [previous, current] = [current, previous];
  }

  return previous[right.length] ?? 0;
}

export function buildTyposquatIndex(
  seededPackageNames: readonly string[],
  popularPackageNames: readonly string[],
  maximumDistance = 2,
): TyposquatMatch[] {
  const matches: TyposquatMatch[] = [];
  const popularNames = Array.from(
    new Set(popularPackageNames.map((name) => name.trim()).filter(Boolean)),
  );

  for (const sourceName of new Set(seededPackageNames)) {
    for (const similarName of popularNames) {
      if (
        sourceName === similarName ||
        Math.abs(sourceName.length - similarName.length) > maximumDistance
      ) {
        continue;
      }
      const distance = levenshteinDistance(sourceName, similarName);
      if (distance <= maximumDistance) {
        matches.push({ sourceName, similarName, distance });
      }
    }
  }

  return matches.sort(
    (left, right) =>
      left.sourceName.localeCompare(right.sourceName) ||
      left.distance - right.distance ||
      left.similarName.localeCompare(right.similarName),
  );
}
