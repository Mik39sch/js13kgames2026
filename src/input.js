/**
 * キーボード状態を監視し、ゲーム更新側から操作状態を取得できるようにする。
 * リスタート入力だけは一度取得すると消費される。
 */
export function createInput() {
  const pressedKeys = new Set();
  let restartRequested = false;

  addEventListener("keydown", (event) => {
    pressedKeys.add(event.key.toLowerCase());

    if (["ArrowLeft", "ArrowRight", " "].includes(event.key)) {
      event.preventDefault();
    }

    if (event.key === " " || event.key === "Enter") {
      restartRequested = true;
    }
  });

  addEventListener("keyup", (event) => {
    pressedKeys.delete(event.key.toLowerCase());
  });

  return {
    /** 左右キーの状態を-1から1の旋回方向として返す。 */
    getTurnDirection() {
      const left = pressedKeys.has("arrowleft") || pressedKeys.has("a");
      const right = pressedKeys.has("arrowright") || pressedKeys.has("d");
      return (right ? 1 : 0) - (left ? 1 : 0);
    },

    /** 保留中のリスタート入力を返し、その入力を消費する。 */
    consumeRestart() {
      const requested = restartRequested;
      restartRequested = false;
      return requested;
    },
  };
}
