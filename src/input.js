/**
 * キーボードと画面タップを監視し、相対的な旋回入力へ変換する。
 * 旋回入力とリスタート入力は一度取得すると消費される。
 */
export function createInput() {
  const pendingTurns = [];
  let restartRequested = false;

  /** ポインターの画面位置を左右どちらの旋回入力として扱うか判定する。 */
  function getPointerDirection(event) {
    return event.clientX < innerWidth / 2 ? -1 : 1;
  }

  /** タッチまたはクリックした画面側への旋回を1回予約する。 */
  function handlePointerDown(event) {
    pendingTurns.push(getPointerDirection(event));
    restartRequested = true;
  }

  addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", " "].includes(event.key)) {
      event.preventDefault();
    }

    if (event.key === " " || event.key === "Enter") {
      restartRequested = true;
    }

    if (!event.repeat && ["ArrowLeft", "a", "A"].includes(event.key)) {
      pendingTurns.push(-1);
    }

    if (!event.repeat && ["ArrowRight", "d", "D"].includes(event.key)) {
      pendingTurns.push(1);
    }
  });

  addEventListener("pointerdown", handlePointerDown);

  return {
    /** 最も古い旋回入力を返し、その入力をキューから取り除く。 */
    consumeTurnDirection() {
      return pendingTurns.shift() ?? 0;
    },

    /** 保留中のリスタート入力を返し、その入力を消費する。 */
    consumeRestart() {
      const requested = restartRequested;
      restartRequested = false;
      return requested;
    },

    /** リスタート前などに、まだ処理していない旋回入力を破棄する。 */
    clearPendingTurns() {
      pendingTurns.length = 0;
    },
  };
}
