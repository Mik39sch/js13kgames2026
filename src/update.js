import {
  CAMERA_PLAYER_POSITION,
  BONUS_STAR_SCORE,
  COLLISION_IGNORE_POINTS,
  COMBO_RAINBOW_DURATION,
  MINIMUM_RAINBOW_DURATION,
  MINIMUM_LOOP_LENGTH,
  PLAYER_COLLISION_RADIUS,
  PLAYER_MAX_SPEED,
  PLAYER_SPEED,
  RAINBOW_CLOSURE_DISTANCE,
  RAINBOW_DURATION,
  SCREEN_EDGE_PADDING,
  SCORE_PER_SPEED_INCREASE,
  STAR_TIME_DURATION,
  STAR_TIME_SPEED_MULTIPLIER,
  TRAIL_POINT_DISTANCE,
  TURN_ANGLE,
  TURN_SPEED,
} from "./const.js";
import {
  calculatePolygonArea,
  findClosestPointOnSegment,
  findLineIntersection,
  isPointInsidePolygon,
} from "./geometry.js";
import { updateWorld } from "./world.js";

/** 現在スコアから、上限を考慮したプレイヤー速度を計算する。 */
function calculatePlayerSpeed(score) {
  return Math.min(
    PLAYER_MAX_SPEED,
    PLAYER_SPEED + score / SCORE_PER_SPEED_INCREASE,
  );
}

/** STAR TIME中だけ速度を65%に下げ、初速112を下限として保つ。 */
function calculateEffectivePlayerSpeed(game) {
  const normalSpeed = calculatePlayerSpeed(game.score);

  if (game.starTimeRemaining <= 0) return normalSpeed;
  return Math.max(PLAYER_SPEED, normalSpeed * STAR_TIME_SPEED_MULTIPLIER);
}

/** 速度が上がっても虹で描ける距離がほぼ一定になる表示時間を計算する。 */
function calculateRainbowDuration(baseDuration, playerSpeed) {
  return Math.max(
    MINIMUM_RAINBOW_DURATION,
    baseDuration * PLAYER_SPEED / playerSpeed,
  );
}

/** プレイヤーを入力方向へ旋回させ、自動で前進させる。 */
function updatePlayer(game, input, viewport, deltaTime) {
  const player = game.player;
  player.speed = calculateEffectivePlayerSpeed(game);
  const tappedTurn = input.consumeTurnDirection() * TURN_ANGLE;
  // 移動速度と同じ割合で旋回速度も上げ、長押し時の旋回半径を一定に保つ。
  const speedRatio = player.speed / PLAYER_SPEED;
  const heldTurn =
    input.getHeldTurnDirection() * TURN_SPEED * speedRatio * deltaTime;
  player.angle += tappedTurn + heldTurn;
  player.x += Math.cos(player.angle) * player.speed * deltaTime;
  player.y += Math.sin(player.angle) * player.speed * deltaTime;

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
  const capturedBonusStars = game.bonusStars.filter(
    (star) => !star.isCollected && isPointInsidePolygon(star, loop),
  );

  // 空の輪は得点なし。STAR TIME中だけ、新しい軌跡へ切り替えて継続する。
  if (capturedClouds.length === 0 && capturedBonusStars.length === 0) {
    if (game.starTimeRemaining > 0) {
      game.trail = [{ x: game.player.x, y: game.player.y }];
      return;
    }

    game.rainbowTimeRemaining = 0;
    game.comboLevel = 0;
    game.trail = [];
    return;
  }

  const loopArea = calculatePolygonArea(loop);
  const multiplier = 1 + Math.min(4, loop.length / 90);
  const comboMultiplier = 2 ** game.comboLevel;
  const cloudScore = capturedClouds.length * Math.sqrt(loopArea);
  const bonusStarScore = capturedBonusStars.length * BONUS_STAR_SCORE;
  const earnedScore = Math.round(
    (cloudScore + bonusStarScore) * multiplier * comboMultiplier,
  );

  for (const cloud of capturedClouds) {
    cloud.isColorful = true;
    cloud.burst = 1;
  }

  for (const star of capturedBonusStars) {
    star.isCollected = true;
  }

  game.score += earnedScore;
  game.player.speed = calculatePlayerSpeed(game.score);
  game.multiplier = multiplier;
  game.comboLevel += 1;
  game.successFlash = 1;
  if (capturedBonusStars.length > 0) {
    game.starTimeRemaining = STAR_TIME_DURATION;
    game.player.speed = calculateEffectivePlayerSpeed(game);
    game.starTimeComboSucceeded = true;
    game.rainbowTimeRemaining = 0;
  } else if (game.starTimeRemaining > 0) {
    game.starTimeComboSucceeded = true;
    game.rainbowTimeRemaining = 0;
  } else {
    game.rainbowTimeRemaining = calculateRainbowDuration(
      COMBO_RAINBOW_DURATION,
      game.player.speed,
    );
  }
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

  if (
    activationRequested &&
    game.rainbowTimeRemaining <= 0 &&
    game.starTimeRemaining <= 0
  ) {
    game.rainbowTimeRemaining = calculateRainbowDuration(
      RAINBOW_DURATION,
      game.player.speed,
    );
    game.comboLevel = 0;
    game.trail = [{ x: game.player.x, y: game.player.y }];
  }

  if (game.starTimeRemaining > 0) {
    game.starTimeRemaining = Math.max(
      0,
      game.starTimeRemaining - deltaTime,
    );

    if (game.starTimeRemaining === 0) {
      game.player.speed = calculatePlayerSpeed(game.score);

      if (game.starTimeComboSucceeded) {
        game.rainbowTimeRemaining = calculateRainbowDuration(
          COMBO_RAINBOW_DURATION,
          game.player.speed,
        );
        game.trail = [{ x: game.player.x, y: game.player.y }];
      } else {
        game.rainbowTimeRemaining = 0;
        game.comboLevel = 0;
        game.trail = [];
      }

      game.starTimeComboSucceeded = false;
    }

    return;
  }

  if (game.rainbowTimeRemaining <= 0) return;

  game.rainbowTimeRemaining = Math.max(
    0,
    game.rainbowTimeRemaining - deltaTime,
  );

  if (game.rainbowTimeRemaining === 0) {
    game.comboLevel = 0;
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

  if (game.rainbowTimeRemaining > 0 || game.starTimeRemaining > 0) {
    updateTrail(game);
  }
  updateWorld(game, viewport, deltaTime);
  checkInkDropCollision(game);
}
