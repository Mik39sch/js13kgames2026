import {
  CAMERA_PLAYER_POSITION,
  COLLISION_IGNORE_POINTS,
  MINIMUM_LOOP_LENGTH,
  PLAYER_SPEED,
  PLAYER_COLLISION_RADIUS,
  RAINBOW_CLOSURE_DISTANCE,
  RAINBOW_DURATION,
  SCREEN_EDGE_PADDING,
  TRAIL_POINT_DISTANCE,
  TURN_ANGLE,
} from "./const.js";
import {
  calculatePolygonArea,
  findClosestPointOnSegment,
  findLineIntersection,
  isPointInsidePolygon,
} from "./geometry.js";
import { updateWorld } from "./world.js";

/** プレイヤーを入力方向へ旋回させ、自動で前進させる。 */
function updatePlayer(game, input, viewport, deltaTime) {
  const player = game.player;
  player.angle += input.consumeTurnDirection() * TURN_ANGLE;
  player.x += Math.cos(player.angle) * PLAYER_SPEED * deltaTime;
  player.y += Math.sin(player.angle) * PLAYER_SPEED * deltaTime;

  const cameraTarget = player.y - viewport.height * CAMERA_PLAYER_POSITION;
  const cameraFollowAmount = Math.min(1, deltaTime * 5);
  const nextCameraY =
    game.cameraY + (cameraTarget - game.cameraY) * cameraFollowAmount;

  // ワールドの進行方向はY座標が小さくなる方向なので、カメラもその方向にだけ進める。
  game.cameraY = Math.min(game.cameraY, nextCameraY);

  const leftEdge = SCREEN_EDGE_PADDING;
  const rightEdge = viewport.width - SCREEN_EDGE_PADDING;
  const bottomEdge = viewport.height - SCREEN_EDGE_PADDING;
  const playerScreenY = player.y - game.cameraY;
  const isOutsideHorizontalEdge = player.x < leftEdge || player.x > rightEdge;
  const hasHitBottomEdge = playerScreenY > bottomEdge;

  if (isOutsideHorizontalEdge || hasHitBottomEdge) {
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

  // 空の輪は得点なしで虹を終了し、ゲームは続行する。
  if (capturedClouds.length === 0) {
    game.rainbowTimeRemaining = 0;
    game.trail = [];
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
  game.rainbowTimeRemaining = 0;
  game.trail = [];
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

  // 見た目の虹同士が接していれば、中心線に隙間があっても輪として扱う。
  let closestMatch = null;

  for (let index = 0; index < lastCollisionIndex; index += 1) {
    const match = findClosestPointOnSegment(
      currentPoint,
      game.trail[index],
      game.trail[index + 1],
    );

    if (
      match.distance <= RAINBOW_CLOSURE_DISTANCE &&
      (!closestMatch || match.distance < closestMatch.distance)
    ) {
      closestMatch = { ...match, trailIndex: index };
    }
  }

  if (closestMatch) {
    completeLoop(game, closestMatch.point, closestMatch.trailIndex);
    return true;
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

/** 虹の発動入力と残り時間を更新し、終了時に軌跡を消去する。 */
function updateRainbow(game, input, deltaTime) {
  const activationRequested = input.consumeRainbowActivation();

  if (activationRequested && game.rainbowTimeRemaining <= 0) {
    game.rainbowTimeRemaining = RAINBOW_DURATION;
    game.trail = [{ x: game.player.x, y: game.player.y }];
  }

  if (game.rainbowTimeRemaining <= 0) return;

  game.rainbowTimeRemaining = Math.max(
    0,
    game.rainbowTimeRemaining - deltaTime,
  );

  if (game.rainbowTimeRemaining === 0) {
    game.trail = [];
  }
}

/** ユニコーンと黒い雫の円形当たり判定を行う。 */
function checkInkDropCollision(game) {
  for (const inkDrop of game.inkDrops) {
    const distance = Math.hypot(
      game.player.x - inkDrop.x,
      game.player.y - inkDrop.y,
    );

    if (distance < PLAYER_COLLISION_RADIUS + inkDrop.radius) {
      game.isGameOver = true;
      return;
    }
  }
}

/** 1フレーム分のゲームロジックを順番に更新する。 */
export function updateGame(game, input, viewport, deltaTime) {
  game.elapsedTime += deltaTime;
  if (game.isGameOver) return;

  updateRainbow(game, input, deltaTime);
  updatePlayer(game, input, viewport, deltaTime);
  if (game.isGameOver) return;

  if (game.rainbowTimeRemaining > 0) {
    updateTrail(game);
  }
  updateWorld(game, viewport, deltaTime);
  checkInkDropCollision(game);
}
