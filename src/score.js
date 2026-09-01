import { HIGH_SCORE_LIMIT, HIGH_SCORE_STORAGE_KEY } from "./const.js";

/** コンボレベルを1, 2, 3, 5, 8...のフィボナッチ倍率へ変換する。 */
export function calculateComboMultiplier(comboLevel) {
  let multiplier = 1;
  let nextMultiplier = 2;

  for (let level = 0; level < comboLevel; level += 1) {
    [multiplier, nextMultiplier] = [
      nextMultiplier,
      multiplier + nextMultiplier,
    ];
  }

  return multiplier;
}

/** localStorageから有効なスコアだけを読み込み、降順で返す。 */
export function loadHighScores() {
  try {
    const storedValue = localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
    const parsedScores = storedValue ? JSON.parse(storedValue) : [];

    if (!Array.isArray(parsedScores)) return [];

    return parsedScores
      .filter((score) => Number.isFinite(score) && score >= 0)
      .sort((first, second) => second - first)
      .slice(0, HIGH_SCORE_LIMIT);
  } catch {
    return [];
  }
}

/** 現在スコアをランキングへ追加し、上位スコアをlocalStorageへ保存する。 */
export function recordHighScore(score) {
  const highScores = loadHighScores();

  if (score > 0) {
    highScores.push(score);
    highScores.sort((first, second) => second - first);
    highScores.length = Math.min(highScores.length, HIGH_SCORE_LIMIT);
  }

  try {
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, JSON.stringify(highScores));
  } catch {
    // 保存できない環境でも、現在のセッション用ランキングは返す。
  }

  return highScores;
}
