/**
 * キーボードと画面タップを監視し、相対的な旋回入力へ変換する。
 * 旋回入力とリスタート入力は一度取得すると消費される。
 */
export function createInput() {
  const pendingTurns = [];
  let restartRequested = false;
  let rainbowRequested = false;

  /** ポインターが画面下部のRAINBOWボタン内にあるか判定する。 */
  function isRainbowButton(event) {
    const isInsideHorizontally =
      Math.abs(event.clientX - innerWidth / 2) <= 58;
    const isInsideVertically =
      event.clientY >= innerHeight - 92 && event.clientY <= innerHeight - 48;
    return isInsideHorizontally && isInsideVertically;
  }

  /** ポインターの画面位置を左右どちらの旋回入力として扱うか判定する。 */
  function getPointerDirection(event) {
    return event.clientX < innerWidth / 2 ? -1 : 1;
  }

  /** タッチまたはクリックした画面側への旋回を1回予約する。 */
  function handlePointerDown(event) {
    restartRequested = true;

    if (isRainbowButton(event)) {
      rainbowRequested = true;
    } else {
      pendingTurns.push(getPointerDirection(event));
    }
  }

  addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", " "].includes(event.key)) {
      event.preventDefault();
    }

    if (event.key === " " || event.key === "Enter") {
      restartRequested = true;
    }

    if (!event.repeat && event.key === " ") {
      rainbowRequested = true;
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

    /** 保留中の虹発動入力を返し、その入力を消費する。 */
    consumeRainbowActivation() {
      const requested = rainbowRequested;
      rainbowRequested = false;
      return requested;
    },

    /** リスタート前などに、まだ処理していない旋回入力を破棄する。 */
    clearPendingTurns() {
      pendingTurns.length = 0;
      rainbowRequested = false;
    },
  };
}
