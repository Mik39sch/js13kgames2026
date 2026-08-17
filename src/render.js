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

/** 上から落下する、色を奪う黒い雫をしずく形で描画する。 */
function drawInkDrop(context, game, inkDrop) {
  const screenY = worldToScreenY(game, inkDrop.y);
  const radius = inkDrop.radius;
  const pulse = 1 + Math.sin(game.elapsedTime * 6 + inkDrop.phase) * 0.06;

  context.save();
  context.translate(inkDrop.x, screenY);
  context.scale(pulse, pulse);

  // 落下方向と速度が分かるよう、上側へ薄い残像を伸ばす。
  context.strokeStyle = "rgba(56, 31, 82, 0.28)";
  context.lineWidth = radius * 0.7;
  context.beginPath();
  context.moveTo(0, -radius);
  context.lineTo(0, -radius * 2.8);
  context.stroke();

  context.fillStyle = "#281a3b";
  context.strokeStyle = "#9a54ba";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(0, -radius * 1.5);
  context.bezierCurveTo(
    radius * 0.35,
    -radius * 0.7,
    radius,
    -radius * 0.15,
    radius,
    radius * 0.35,
  );
  context.bezierCurveTo(
    radius,
    radius,
    radius * 0.5,
    radius * 1.25,
    0,
    radius * 1.25,
  );
  context.bezierCurveTo(
    -radius * 0.5,
    radius * 1.25,
    -radius,
    radius,
    -radius,
    radius * 0.35,
  );
  context.bezierCurveTo(
    -radius,
    -radius * 0.15,
    -radius * 0.35,
    -radius * 0.7,
    0,
    -radius * 1.5,
  );
  context.fill();
  context.stroke();

  context.fillStyle = "rgba(255, 255, 255, 0.45)";
  context.beginPath();
  context.ellipse(
    -radius * 0.35,
    radius * 0.15,
    radius * 0.18,
    radius * 0.32,
    -0.5,
    0,
    Math.PI * 2,
  );
  context.fill();
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

/** 後方へなびく虹色の尾を線で描画する。 */
function drawUnicornTail(context) {
  RAINBOW_COLORS.forEach((color, index) => {
    context.strokeStyle = color;
    context.lineWidth = 2.5;
    context.beginPath();
    context.moveTo(-17, -2 + index * 0.8);
    context.quadraticCurveTo(-25, -9 + index * 1.6, -31, -2 + index * 1.8);
    context.stroke();
  });
}

/** 首の後ろへ虹色のたてがみを房状に描画する。 */
function drawUnicornMane(context) {
  RAINBOW_COLORS.forEach((color, index) => {
    context.fillStyle = color;
    context.beginPath();
    context.arc(5 + index * 1.7, -8 - index * 0.8, 3, 0, Math.PI * 2);
    context.fill();
  });
}

/** 真上・真下へ進む際に使う、前後方向が明確なトップダウン姿を描画する。 */
function drawVerticalUnicorn(context, isFacingDown) {
  if (isFacingDown) context.rotate(Math.PI);

  // 後方へ広がる虹色の尾。
  RAINBOW_COLORS.forEach((color, index) => {
    context.strokeStyle = color;
    context.lineWidth = 2.2;
    context.beginPath();
    context.moveTo((index - 2.5) * 0.7, 15);
    context.quadraticCurveTo(
      (index - 2.5) * 1.4,
      23,
      (index - 2.5) * 2,
      29,
    );
    context.stroke();
  });

  // 上から見える4本の脚を胴体の左右へ配置する。
  context.strokeStyle = "#e9dff5";
  context.lineWidth = 4.5;
  for (const legY of [-2, 9]) {
    for (const side of [-1, 1]) {
      context.beginPath();
      context.moveTo(side * 6, legY);
      context.lineTo(side * 13, legY + 2);
      context.stroke();
    }
  }

  // 縦長の胴体、首、頭、鼻先を進行方向へ一直線に置く。
  context.fillStyle = "#fff8ff";
  context.beginPath();
  context.ellipse(0, 3, 9, 16, 0, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.ellipse(0, -12, 7, 10, 0, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.ellipse(0, -21, 4.5, 7, 0, 0, Math.PI * 2);
  context.fill();

  // 真上・真下から見たたてがみを首と背中の中央線上に並べる。
  RAINBOW_COLORS.forEach((color, index) => {
    context.fillStyle = color;
    context.beginPath();
    context.arc(0, -9 + index * 3.2, 2.6, 0, Math.PI * 2);
    context.fill();
  });

  // 左右の耳と中央の角で、進行方向側を強調する。
  context.beginPath();
  context.moveTo(-5, -17);
  context.lineTo(-9, -25);
  context.lineTo(-2, -20);
  context.closePath();
  context.fill();
  context.beginPath();
  context.moveTo(5, -17);
  context.lineTo(9, -25);
  context.lineTo(2, -20);
  context.closePath();
  context.fill();

  context.fillStyle = "#ffd95a";
  context.beginPath();
  context.moveTo(-2.5, -23);
  context.lineTo(0, -38);
  context.lineTo(2.5, -23);
  context.closePath();
  context.fill();

  context.fillStyle = "#523b70";
  context.beginPath();
  context.arc(-2.8, -16, 1.3, 0, Math.PI * 2);
  context.arc(2.8, -16, 1.3, 0, Math.PI * 2);
  context.fill();
}

/** 横向きの馬らしさを保ち、左右反転と軽い傾きで進行方向を表現する。 */
function drawUnicorn(context, game) {
  const player = game.player;
  context.save();
  context.translate(player.x, worldToScreenY(game, player.y));

  const isVertical = Math.abs(Math.cos(player.angle)) < 0.01;
  if (isVertical) {
    drawVerticalUnicorn(context, Math.sin(player.angle) > 0);
    context.restore();
    return;
  }

  // 頭を進行方向へ正確に向けつつ、左向きでは絵を反転して逆さを防ぐ。
  const isFacingLeft = Math.cos(player.angle) < 0;
  const visualAngle = isFacingLeft
    ? player.angle - Math.PI
    : player.angle;
  context.rotate(visualAngle);
  context.scale(isFacingLeft ? -1 : 1, 1);
  context.lineCap = "round";

  drawUnicornTail(context);

  // 前後2組の脚を下へ伸ばし、蹄を濃い色で描く。
  context.strokeStyle = "#e9dff5";
  context.lineWidth = 5;
  for (const legX of [-10, -4, 7, 13]) {
    context.beginPath();
    context.moveTo(legX, 6);
    context.lineTo(legX + (legX < 0 ? -2 : 2), 15);
    context.stroke();
  }

  context.strokeStyle = "#8b68a6";
  context.lineWidth = 2.5;
  for (const hoofX of [-12, -6, 9, 15]) {
    context.beginPath();
    context.moveTo(hoofX, 15);
    context.lineTo(hoofX + 3, 15);
    context.stroke();
  }

  // 横長の胴体と斜めに立ち上がる首を組み合わせる。
  context.fillStyle = "#fff8ff";
  context.beginPath();
  context.ellipse(-3, 0, 17, 9, 0, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.moveTo(5, 1);
  context.lineTo(8, -13);
  context.lineTo(17, -9);
  context.lineTo(14, 5);
  context.closePath();
  context.fill();

  drawUnicornMane(context);

  // 額と突き出した鼻先で馬の横顔を作る。
  context.fillStyle = "#fff8ff";
  context.beginPath();
  context.ellipse(17, -10, 10, 7, -0.15, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.ellipse(25, -7, 7, 4.5, 0.1, 0, Math.PI * 2);
  context.fill();

  // 画面上側へ耳を立てる。
  context.beginPath();
  context.moveTo(12, -15);
  context.lineTo(11, -23);
  context.lineTo(18, -16);
  context.closePath();
  context.fill();

  // 額から斜め前方へ金色の角を伸ばす。
  context.fillStyle = "#ffd95a";
  context.beginPath();
  context.moveTo(20, -15);
  context.lineTo(30, -28);
  context.lineTo(24, -13);
  context.closePath();
  context.fill();

  // 横顔なので目と鼻孔は1つずつ見せる。
  context.fillStyle = "#523b70";
  context.beginPath();
  context.arc(20, -11, 1.7, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(29, -7, 1, 0, Math.PI * 2);
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
    `RAINBOW  ${game.rainbowTimeRemaining.toFixed(1)}s   ×${game.multiplier.toFixed(1)}`,
    20,
    56,
  );

  // キーボードとタッチの両方で認識できる虹発動ボタン。
  const buttonX = viewport.width / 2 - 58;
  const buttonY = viewport.height - 92;
  context.fillStyle = game.rainbowTimeRemaining > 0
    ? "rgba(255, 255, 255, 0.45)"
    : "rgba(91, 61, 130, 0.72)";
  context.fillRect(buttonX, buttonY, 116, 44);
  context.strokeStyle = "rgba(255, 255, 255, 0.8)";
  context.lineWidth = 2;
  context.strokeRect(buttonX, buttonY, 116, 44);
  context.fillStyle = game.rainbowTimeRemaining > 0 ? "#5b3d82" : "#fff";
  context.font = "700 14px system-ui";
  context.textAlign = "center";
  context.fillText("RAINBOW", viewport.width / 2, buttonY + 27);

  context.fillStyle = "rgba(25, 54, 92, 0.65)";
  context.font = "13px system-ui";
  context.fillText(
    "← → / A Dで旋回　SPACEで虹を発動",
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
    "SPACE / ENTER / 画面タップでリスタート",
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
  game.inkDrops.forEach((inkDrop) => drawInkDrop(context, game, inkDrop));
  drawRainbow(context, game);
  drawUnicorn(context, game);
  drawInterface(context, game, viewport);
  drawSuccessFlash(context, game, viewport);
  drawGameOver(context, game, viewport);
}
