/** 2本の線分が交差する座標を返す。交差しない場合はnullを返す。 */
export function findLineIntersection(firstStart, firstEnd, secondStart, secondEnd) {
  const firstX = firstEnd.x - firstStart.x;
  const firstY = firstEnd.y - firstStart.y;
  const secondX = secondEnd.x - secondStart.x;
  const secondY = secondEnd.y - secondStart.y;
  const denominator = firstX * secondY - firstY * secondX;

  if (Math.abs(denominator) < 0.001) return null;

  const offsetX = secondStart.x - firstStart.x;
  const offsetY = secondStart.y - firstStart.y;
  const firstPosition = (offsetX * secondY - offsetY * secondX) / denominator;
  const secondPosition = (offsetX * firstY - offsetY * firstX) / denominator;
  const intersects =
    firstPosition >= 0 && firstPosition <= 1 &&
    secondPosition >= 0 && secondPosition <= 1;

  if (!intersects) return null;

  return {
    x: firstStart.x + firstPosition * firstX,
    y: firstStart.y + firstPosition * firstY,
  };
}

/** 点から線分へ最も近い座標と、その距離を返す。 */
export function findClosestPointOnSegment(point, segmentStart, segmentEnd) {
  const segmentX = segmentEnd.x - segmentStart.x;
  const segmentY = segmentEnd.y - segmentStart.y;
  const segmentLengthSquared = segmentX ** 2 + segmentY ** 2;

  if (segmentLengthSquared === 0) {
    return {
      point: { x: segmentStart.x, y: segmentStart.y },
      distance: Math.hypot(
        point.x - segmentStart.x,
        point.y - segmentStart.y,
      ),
    };
  }

  const position = Math.max(
    0,
    Math.min(
      1,
      ((point.x - segmentStart.x) * segmentX +
        (point.y - segmentStart.y) * segmentY) /
        segmentLengthSquared,
    ),
  );
  const closestPoint = {
    x: segmentStart.x + segmentX * position,
    y: segmentStart.y + segmentY * position,
  };

  return {
    point: closestPoint,
    distance: Math.hypot(
      point.x - closestPoint.x,
      point.y - closestPoint.y,
    ),
  };
}

/** Ray casting法で点がポリゴンの内側にあるかを判定する。 */
export function isPointInsidePolygon(point, polygon) {
  let isInside = false;

  for (
    let currentIndex = 0, previousIndex = polygon.length - 1;
    currentIndex < polygon.length;
    previousIndex = currentIndex, currentIndex += 1
  ) {
    const current = polygon[currentIndex];
    const previous = polygon[previousIndex];
    const crossesPointY = (current.y > point.y) !== (previous.y > point.y);
    if (!crossesPointY) continue;

    const edgeXAtPointY =
      ((previous.x - current.x) * (point.y - current.y)) /
        (previous.y - current.y) + current.x;

    if (point.x < edgeXAtPointY) isInside = !isInside;
  }

  return isInside;
}

/** 靴紐公式を使ってポリゴンの面積を計算する。 */
export function calculatePolygonArea(polygon) {
  let doubleArea = 0;

  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    doubleArea += current.x * next.y - next.x * current.y;
  }

  return Math.abs(doubleArea) / 2;
}
