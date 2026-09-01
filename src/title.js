import {
  CAMERA_PLAYER_POSITION,
  PLAYER_SPEED,
  TITLE_STORY_LINE_GAP,
  TITLE_STORY_SCROLL_SPEED,
  TRAIL_POINT_DISTANCE,
} from "./const.js";
import { createGame, updateWorld } from "./world.js";

export const TITLE_STORIES = {
  en: [
    "Long ago, the world was filled with color.",
    "",
    "The green trees whispered,",
    "the blue sky stretched endlessly,",
    "and birds sang happily.",
    "",
    "But one day,",
    "black rain began to fall.",
    "",
    "The black rain stole color from everything it touched,",
    "slowly darkening the world.",
    "",
    "The trees fell silent,",
    "and the birds' songs could no longer be heard.",
    "",
    "The world had become a dark and sorrowful place.",
    "",
    "Then,",
    "beyond the gray clouds,",
    "a tiny horn began to shine.",
    "",
    "To bring back the colors that had been lost,",
    "a unicorn took flight into the sky.",
  ],
  ja: [
    "むかし、色にあふれた世界が広がっていた。",
    "",
    "緑の木々はささやき、",
    "青い空がどこまでも広がり、",
    "鳥たちは楽しそうに歌っていた。",
    "",
    "しかし、ある日。",
    "黒い雨が降り始めた。",
    "",
    "黒い雨は、触れたものから色を奪い、",
    "少しずつ世界を暗くしていった。",
    "",
    "木々はささやくのをやめ、",
    "鳥たちの歌も聞こえなくなった。",
    "",
    "世界は、暗く悲しい場所になってしまった。",
    "",
    "そんなとき、",
    "灰色の雲の向こうで、",
    "小さな角が輝いた。",
    "",
    "虹で失われた色を取り戻すため、",
    "ユニコーンは空へ飛び立った。",
  ],
};

/** 動く空を持つプロローグ画面の状態を生成する。 */
export function createTitle(viewport) {
  const background = createGame(viewport);
  background.rainbowTimeRemaining = Infinity;
  background.trail = [{ x: background.player.x, y: background.player.y }];

  return {
    background,
    phase: "story",
    storyOffset: 0,
    language: "en",
  };
}

/** 英語と日本語を切り替え、物語の途中なら冒頭へ戻す。 */
export function toggleTitleLanguage(title) {
  title.language = title.language === "en" ? "ja" : "en";
  if (title.phase === "story") title.storyOffset = 0;
}

/** プロローグを終了し、タイトルと操作説明を表示する。 */
export function skipTitleStory(title) {
  title.phase = "menu";
}

/** 黒い雨のない空でユニコーンを蛇行させ、物語を進行する。 */
export function updateTitle(title, viewport, deltaTime) {
  const game = title.background;
  const player = game.player;
  const previousX = player.x;
  const previousY = player.y;

  game.elapsedTime += deltaTime;
  player.y -= PLAYER_SPEED * deltaTime;
  player.x =
    viewport.width / 2 +
    Math.sin(game.elapsedTime * 0.85) * Math.min(100, viewport.width * 0.22);
  player.angle = Math.atan2(player.y - previousY, player.x - previousX);
  game.cameraY = player.y - viewport.height * CAMERA_PLAYER_POSITION;

  const lastPoint = game.trail.at(-1);
  if (
    !lastPoint ||
    Math.hypot(player.x - lastPoint.x, player.y - lastPoint.y) >=
      TRAIL_POINT_DISTANCE
  ) {
    game.trail.push({ x: player.x, y: player.y });
  }
  game.trail = game.trail.filter(
    (point) => point.y < game.cameraY + viewport.height + 80,
  );

  updateWorld(game, viewport, deltaTime, false);
  game.inkDrops = [];

  if (title.phase === "story") {
    title.storyOffset += TITLE_STORY_SCROLL_SPEED * deltaTime;
    const storyEnd =
      viewport.height * 0.82 +
      TITLE_STORIES[title.language].length * TITLE_STORY_LINE_GAP +
      80;
    if (title.storyOffset >= storyEnd) title.phase = "menu";
  }
}
