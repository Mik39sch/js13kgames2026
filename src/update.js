import {
  CAMERA_PLAYER_POSITION,
  COLLISION_IGNORE_POINTS,
  MINIMUM_LOOP_LENGTH,
  PLAYER_SPEED,
  SCREEN_EDGE_PADDING,
  TRAIL_POINT_DISTANCE,
  TURN_SPEED,
} from "./const.js";
import {
  calculatePolygonArea,
  findLineIntersection,
  isPointInsidePolygon,
} from "./geometry.js";
import { updateWorld } from "./world.js";

/** プレイヤーを入力方向へ旋回させ、自動で前進させる。 */
function updatePlayer(game, input, viewport, deltaTime) {
  const player = game.player;
  player.angle += input.getTurnDirection() * TURN_SPEED * deltaTime;
  player.x += Math.cos(player.angle) * PLAYER_SPEED * deltaTime;
  player.y += Math.sin(player.angle) * PLAYER_SPEED * deltaTime;

  const cameraTarget = player.y - viewport.height * CAMERA_PLAYER_POSITION;
  const cameraFollowAmount = Math.min(1, deltaTime * 5);
  game.cameraY += (cameraTarget - game.cameraY) * cameraFollowAmount;

  const leftEdge = SCREEN_EDGE_PADDING;
  const rightEdge = viewport.width - SCREEN_EDGE_PADDING;
  if (player.x < leftEdge || player.x > rightEdge) {
    game.isGameOver = true;
  }
}

/** 完成した虹の輪を評価し、雲の取得またはゲームオーバーを処理する。 */
function completeLoop(game, intersection, trailIntersectionIndex) {
  const loop = [
    intersection,
    ...game.trail.slice(trailIntersectionIndex + 1),
    intersection,
  ];
  const capturedClouds = game.clouds.filter(
    (cloud) => !cloud.isColorful && isPointInsidePolygon(cloud, loop),
  );

  // 雲を囲まずに虹へ触れた場合は、通常の自己衝突として扱う。
  if (capturedClouds.length === 0) {
    game.isGameOver = true;
    return;
  }

  const loopArea = calculatePolygonArea(loop);
  const multiplier = 1 + Math.min(4, loop.length / 90);
  const earnedScore = Math.round(
    capturedClouds.length * Math.sqrt(loopArea) * multiplier,
  );

  for (const cloud of capturedClouds) {
    cloud.isColorful = true;
    cloud.burst = 1;
  }

  game.score += earnedScore;
  game.multiplier = multiplier;
  game.successFlash = 1;
  game.trail = [{ x: game.player.x, y: game.player.y }];
}

/** 新しい軌跡の線分が過去の虹と交差したか調べる。 */
function checkForTrailIntersection(game, previousPoint, currentPoint) {
  if (game.trail.length <= MINIMUM_LOOP_LENGTH) return false;

  // 直近の点は現在描画中の線分なので、衝突対象から除外する。
  const lastCollisionIndex = game.trail.length - COLLISION_IGNORE_POINTS;

  for (let index = 0; index < lastCollisionIndex; index += 1) {
    const intersection = findLineIntersection(
      previousPoint,
      currentPoint,
      game.trail[index],
      game.trail[index + 1],
    );

    if (intersection) {
      completeLoop(game, intersection, index);
      return true;
    }
  }

  return false;
}

/** プレイヤーの位置を虹の軌跡へ追加し、輪の完成を検出する。 */
function updateTrail(game) {
  const previousPoint = game.trail.at(-1);
  const currentPoint = { x: game.player.x, y: game.player.y };

  if (previousPoint) {
    const distance = Math.hypot(
      currentPoint.x - previousPoint.x,
      currentPoint.y - previousPoint.y,
    );
    if (distance <= TRAIL_POINT_DISTANCE) return;
    if (checkForTrailIntersection(game, previousPoint, currentPoint)) return;
  }

  game.trail.push(currentPoint);
}

/** 1フレーム分のゲームロジックを順番に更新する。 */
export function updateGame(game, input, viewport, deltaTime) {
  game.elapsedTime += deltaTime;
  if (game.isGameOver) return;

  updatePlayer(game, input, viewport, deltaTime);
  if (game.isGameOver) return;

  updateTrail(game);
  updateWorld(game, viewport, deltaTime);
}
