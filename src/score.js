import { HIGH_SCORE_LIMIT, HIGH_SCORE_STORAGE_KEY } from "./const.js";

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
