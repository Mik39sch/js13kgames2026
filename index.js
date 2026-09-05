import { MAX_DELTA_TIME } from "./src/const.js";
import { createGame } from "./src/world.js";
import { createInput } from "./src/input.js";
import { updateGame } from "./src/update.js";
import { drawGame } from "./src/render.js";
import { loadHighScores, recordHighScore } from "./src/score.js";
import { createAudio } from "./src/audio.js";
import {
  createTitle,
  skipTitleStory,
  toggleTitleLanguage,
  updateTitle,
} from "./src/title.js";
import { drawTitle } from "./src/render.js";

const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");
document.body.append(canvas);

const input = createInput();
const audio = createAudio();
const viewport = { width: 0, height: 0 };
let game;
let title;
let previousFrameTime = performance.now();

/** Canvasを画面サイズに合わせ、高DPI環境でも鮮明に描画できるようにする。 */
function resizeCanvas() {
  const deviceScale = Math.min(devicePixelRatio || 1, 2);
  viewport.width = innerWidth;
  viewport.height = innerHeight;
  canvas.width = viewport.width * deviceScale;
  canvas.height = viewport.height * deviceScale;
  context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);

  if (game) {
    game.player.x = Math.max(30, Math.min(viewport.width - 30, game.player.x));
  }
  if (title) {
    title.background.player.x = viewport.width / 2;
  }
}

/** 現在の画面サイズを使ってゲームを初期状態に戻す。 */
function startGame() {
  game = createGame(viewport);
  game.highScores = loadHighScores();
}

/** 更新と描画を行い、次のアニメーションフレームを予約する。 */
function runFrame(currentTime) {
  const elapsedSeconds = (currentTime - previousFrameTime) / 1000;
  const deltaTime = Math.min(MAX_DELTA_TIME, elapsedSeconds);
  previousFrameTime = currentTime;

  const restartRequested = input.consumeRestart();

  if (title) {
    if (input.consumeLanguageToggle()) {
      toggleTitleLanguage(title);
    }

    if (restartRequested) {
      if (title.phase === "story") {
        skipTitleStory(title);
      } else {
        startGame();
        title = null;
        input.setTitleActive(false);
      }
      input.clearPendingTurns();
    }

    if (title) {
      updateTitle(title, viewport, deltaTime);
      drawTitle(context, title, viewport);
      requestAnimationFrame(runFrame);
      return;
    }
  }

  if (game.isGameOver && restartRequested) {
    startGame();
    input.clearPendingTurns();
  }

  updateGame(game, input, viewport, deltaTime);
  audio.playEvents(game.soundEvents);
  audio.updateMusic(!game.isGameOver, game.starTimeRemaining > 0);

  if (game.isGameOver && !game.isScoreRecorded) {
    game.highScores = recordHighScore(game.score);
    game.isScoreRecorded = true;
  }

  drawGame(context, game, viewport);
  requestAnimationFrame(runFrame);
}

addEventListener("resize", resizeCanvas);
resizeCanvas();
title = createTitle(viewport);
input.setTitleActive(true);
requestAnimationFrame(runFrame);
