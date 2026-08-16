import {
  CAMERA_PLAYER_POSITION,
  INITIAL_CLOUD_COUNT,
  INITIAL_STAR_COUNT,
  WORLD_GENERATION_DISTANCE,
} from "./const.js";

/** 指定範囲からランダムな数値を返す。 */
function randomBetween(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum);
}

/** 新しいゲーム状態を生成し、初期オブジェクトを配置する。 */
export function createGame(viewport) {
  const game = {
    player: { x: viewport.width / 2, y: 0, angle: -Math.PI / 2 },
    trail: [],
    clouds: [],
    stars: [],
    score: 0,
    multiplier: 1,
    cameraY: -viewport.height * CAMERA_PLAYER_POSITION,
    nextCloudY: -180,
    nextStarY: -50,
    isGameOver: false,
    elapsedTime: 0,
    successFlash: 0,
  };

  for (let index = 0; index < INITIAL_STAR_COUNT; index += 1) {
    spawnStar(game, viewport);
  }
  for (let index = 0; index < INITIAL_CLOUD_COUNT; index += 1) {
    spawnCloud(game, viewport);
  }
  return game;
}

/** プレイヤーより先の空に星を1つ生成する。 */
export function spawnStar(game, viewport) {
  const y = game.nextStarY - randomBetween(35, 100);
  game.nextStarY = y;
  game.stars.push({
    x: randomBetween(18, viewport.width - 18),
    y,
    radius: randomBetween(1, 3),
    twinklePhase: randomBetween(0, 7),
  });
}

/** プレイヤーより先の空に灰色の雲を1つ生成する。 */
export function spawnCloud(game, viewport) {
  const y = game.nextCloudY - randomBetween(130, 240);
  game.nextCloudY = y;
  game.clouds.push({
    x: randomBetween(55, viewport.width - 55),
    y,
    radius: randomBetween(17, 27),
    isColorful: false,
    hue: randomBetween(0, 360),
    burst: 0,
  });
}

/** スクロール位置に応じてオブジェクトを生成・破棄し、演出を更新する。 */
export function updateWorld(game, viewport, deltaTime) {
  const generationBoundary =
    game.cameraY - viewport.height * WORLD_GENERATION_DISTANCE;

  while (game.nextCloudY > generationBoundary) spawnCloud(game, viewport);
  while (game.nextStarY > generationBoundary) spawnStar(game, viewport);

  game.clouds = game.clouds.filter(
    (cloud) => cloud.y < game.cameraY + viewport.height + 100,
  );
  game.stars = game.stars.filter(
    (star) => star.y < game.cameraY + viewport.height + 40,
  );

  for (const cloud of game.clouds) {
    cloud.burst = Math.max(0, cloud.burst - deltaTime * 2);
  }
  game.successFlash = Math.max(0, game.successFlash - deltaTime * 2.5);
}
