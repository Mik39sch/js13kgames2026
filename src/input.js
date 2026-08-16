/**
 * キーボード状態を監視し、ゲーム更新側から操作状態を取得できるようにする。
 * リスタート入力だけは一度取得すると消費される。
 */
export function createInput() {
  const pressedKeys = new Set();
  const activePointers = new Map();
  let restartRequested = false;

  /** ポインターの画面位置を左右どちらの旋回入力として扱うか判定する。 */
  function getPointerDirection(event) {
    return event.clientX < innerWidth / 2 ? -1 : 1;
  }

  /** タッチまたはペンの入力を開始し、押した画面側の旋回を有効にする。 */
  function handlePointerDown(event) {
    if (event.pointerType === "mouse") return;
    activePointers.set(event.pointerId, getPointerDirection(event));
    restartRequested = true;
  }

  /** 指を滑らせた場合に、現在触れている画面側へ旋回方向を切り替える。 */
  function handlePointerMove(event) {
    if (!activePointers.has(event.pointerId)) return;
    activePointers.set(event.pointerId, getPointerDirection(event));
  }

  /** 終了またはキャンセルされたポインターの旋回入力を解除する。 */
  function handlePointerEnd(event) {
    activePointers.delete(event.pointerId);
  }

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

  addEventListener("pointerdown", handlePointerDown);
  addEventListener("pointermove", handlePointerMove);
  addEventListener("pointerup", handlePointerEnd);
  addEventListener("pointercancel", handlePointerEnd);

  return {
    /** 左右キーの状態を-1から1の旋回方向として返す。 */
    getTurnDirection() {
      const left = pressedKeys.has("arrowleft") || pressedKeys.has("a");
      const right = pressedKeys.has("arrowright") || pressedKeys.has("d");
      let direction = (right ? 1 : 0) - (left ? 1 : 0);

      for (const pointerDirection of activePointers.values()) {
        direction += pointerDirection;
      }

      return Math.max(-1, Math.min(1, direction));
    },

  /** 保留中のリスタート入力を返し、その入力を消費する。 */
    consumeRestart() {
      const requested = restartRequested;
      restartRequested = false;
      return requested;
    },
  };
}
