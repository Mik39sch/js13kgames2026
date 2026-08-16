import { RAINBOW_COLORS } from "./const.js";

/** ワールド座標のY値を現在のカメラに対応する画面座標へ変換する。 */
function worldToScreenY(game, worldY) {
  return worldY - game.cameraY;
}

/** 空の背景グラデーションを描画する。 */
function drawSky(context, viewport) {
  const gradient = context.createLinearGradient(0, 0, 0, viewport.height);
  gradient.addColorStop(0, "#83d7ff");
  gradient.addColorStop(1, "#dff8ff");
  context.fillStyle = gradient;
  context.fillRect(0, 0, viewport.width, viewport.height);
}

/** 点滅する背景の星を描画する。 */
function drawStars(context, game, viewport) {
  for (const star of game.stars) {
    const screenY = worldToScreenY(game, star.y);
    if (screenY < -10 || screenY > viewport.height + 10) continue;

    context.globalAlpha =
      0.35 + 0.35 * Math.sin(game.elapsedTime * 2 + star.twinklePhase);
    context.fillStyle = "#fff";
    context.beginPath();
    context.arc(star.x, screenY, star.radius, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
}

/** 灰色または取得済みのカラフルな雲を描画する。 */
function drawCloud(context, game, cloud) {
  const fillColor = cloud.isColorful
    ? `hsl(${cloud.hue} 85% 72%)`
    : "#aeb7c5";

  context.save();
  context.translate(cloud.x, worldToScreenY(game, cloud.y));
  if (cloud.burst > 0) {
    const burstScale = 1 + cloud.burst * 0.25;
    context.scale(burstScale, burstScale);
  }

  context.fillStyle = fillColor;
  context.beginPath();
  context.arc(-cloud.radius * 0.55, 2, cloud.radius * 0.55, 0, Math.PI * 2);
  context.arc(0, -cloud.radius * 0.3, cloud.radius * 0.7, 0, Math.PI * 2);
  context.arc(cloud.radius * 0.6, 2, cloud.radius * 0.5, 0, Math.PI * 2);
  context.rect(-cloud.radius * 0.95, 0, cloud.radius * 1.9, cloud.radius * 0.65);
  context.fill();

  if (cloud.isColorful) {
    context.fillStyle = "rgba(255, 255, 255, 0.65)";
    context.beginPath();
    context.arc(
      -cloud.radius * 0.15,
      -cloud.radius * 0.55,
      cloud.radius * 0.18,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.restore();
}

/** 指定した太さと色で軌跡を1本の線として描画する。 */
function drawTrailLine(context, game, width, color) {
  if (game.trail.length < 2) return;

  context.beginPath();
  context.moveTo(
    game.trail[0].x,
    worldToScreenY(game, game.trail[0].y),
  );
  for (let index = 1; index < game.trail.length; index += 1) {
    context.lineTo(
      game.trail[index].x,
      worldToScreenY(game, game.trail[index].y),
    );
  }
  context.strokeStyle = color;
  context.lineWidth = width;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.stroke();
}

/** 同じ軌跡を異なる太さで重ね、6色の虹として描画する。 */
function drawRainbow(context, game) {
  RAINBOW_COLORS.forEach((color, colorIndex) => {
    drawTrailLine(context, game, 22 - colorIndex * 3.1, color);
  });
}

/** 基本図形を組み合わせてプレイヤーのユニコーンを描画する。 */
function drawUnicorn(context, game) {
  const player = game.player;
  context.save();
  context.translate(player.x, worldToScreenY(game, player.y));
  context.rotate(player.angle + Math.PI / 2);

  context.fillStyle = "#fff7ff";
  context.beginPath();
  context.ellipse(0, 4, 12, 18, 0, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(0, -13, 10, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#ffe05c";
  context.beginPath();
  context.moveTo(0, -31);
  context.lineTo(-4, -17);
  context.lineTo(4, -17);
  context.fill();

  context.fillStyle = "#8055ad";
  context.beginPath();
  context.arc(-4, -14, 1.8, 0, Math.PI * 2);
  context.arc(4, -14, 1.8, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

/** スコア、倍率、操作説明を画面上に描画する。 */
function drawInterface(context, game, viewport) {
  context.fillStyle = "rgba(25, 54, 92, 0.78)";
  context.font = "700 20px system-ui";
  context.fillText(`SCORE  ${game.score}`, 20, 34);
  context.font = "600 13px system-ui";
  context.fillText(
    `RAINBOW  ${game.trail.length}   ×${game.multiplier.toFixed(1)}`,
    20,
    56,
  );

  context.textAlign = "center";
  context.fillStyle = "rgba(25, 54, 92, 0.65)";
  context.font = "14px system-ui";
  context.fillText(
    "← → / A D で旋回　灰色の雲を虹で囲もう",
    viewport.width / 2,
    viewport.height - 22,
  );
  context.textAlign = "left";
}

/** 囲み成功時の短い白色フラッシュを描画する。 */
function drawSuccessFlash(context, game, viewport) {
  if (game.successFlash <= 0) return;
  context.fillStyle = `rgba(255, 255, 255, ${game.successFlash * 0.28})`;
  context.fillRect(0, 0, viewport.width, viewport.height);
}

/** ゲーム終了時の暗幕、スコア、リスタート案内を描画する。 */
function drawGameOver(context, game, viewport) {
  if (!game.isGameOver) return;

  context.fillStyle = "rgba(31, 34, 61, 0.62)";
  context.fillRect(0, 0, viewport.width, viewport.height);
  context.textAlign = "center";
  context.fillStyle = "#fff";
  context.font = "800 42px system-ui";
  context.fillText("RAINBOW BROKEN!", viewport.width / 2, viewport.height * 0.43);
  context.font = "600 20px system-ui";
  context.fillText(`SCORE  ${game.score}`, viewport.width / 2, viewport.height * 0.5);
  context.font = "16px system-ui";
  context.fillText(
    "SPACE / ENTER でリスタート",
    viewport.width / 2,
    viewport.height * 0.57,
  );
  context.textAlign = "left";
}

/** 現在のゲーム状態を背景からUIまで正しい順番で描画する。 */
export function drawGame(context, game, viewport) {
  drawSky(context, viewport);
  drawStars(context, game, viewport);
  game.clouds.forEach((cloud) => drawCloud(context, game, cloud));
  drawRainbow(context, game);
  drawUnicorn(context, game);
  drawInterface(context, game, viewport);
  drawSuccessFlash(context, game, viewport);
  drawGameOver(context, game, viewport);
}
