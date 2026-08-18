import { TURN_HOLD_DELAY } from "./const.js";

/**
 * キーボードと画面タップを監視し、相対的な旋回入力へ変換する。
 * 旋回入力とリスタート入力は一度取得すると消費される。
 */
export function createInput() {
  const pendingTurns = [];
  const heldKeyboardTurns = new Map();
  const heldPointerTurns = new Map();
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
      const direction = getPointerDirection(event);
      pendingTurns.push(direction);
      heldPointerTurns.set(event.pointerId, {
        direction,
        startedAt: performance.now(),
      });
    }
  }

  /** 終了またはキャンセルされたポインターの連続旋回を解除する。 */
  function handlePointerEnd(event) {
    heldPointerTurns.delete(event.pointerId);
  }

  /** 左右キーを相対的な旋回方向へ変換する。 */
  function getKeyboardTurnDirection(key) {
    if (["ArrowLeft", "a", "A"].includes(key)) return -1;
    if (["ArrowRight", "d", "D"].includes(key)) return 1;
    return 0;
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

    const turnDirection = getKeyboardTurnDirection(event.key);
    if (!event.repeat && turnDirection !== 0) {
      pendingTurns.push(turnDirection);
      heldKeyboardTurns.set(event.key.toLowerCase(), {
        direction: turnDirection,
        startedAt: performance.now(),
      });
    }
  });

  addEventListener("keyup", (event) => {
    heldKeyboardTurns.delete(event.key.toLowerCase());
  });

  addEventListener("pointerdown", handlePointerDown);
  addEventListener("pointerup", handlePointerEnd);
  addEventListener("pointercancel", handlePointerEnd);
  addEventListener("blur", () => {
    heldKeyboardTurns.clear();
    heldPointerTurns.clear();
  });

  return {
    /** 最も古い旋回入力を返し、その入力をキューから取り除く。 */
    consumeTurnDirection() {
      return pendingTurns.shift() ?? 0;
    },

    /** 一定時間以上押されている入力を、-1から1の連続旋回方向で返す。 */
    getHeldTurnDirection() {
      const holdThreshold = TURN_HOLD_DELAY * 1000;
      const currentTime = performance.now();
      let direction = 0;

      for (const heldTurn of heldKeyboardTurns.values()) {
        if (currentTime - heldTurn.startedAt >= holdThreshold) {
          direction += heldTurn.direction;
        }
      }

      for (const heldTurn of heldPointerTurns.values()) {
        if (currentTime - heldTurn.startedAt >= holdThreshold) {
          direction += heldTurn.direction;
        }
      }

      return Math.max(-1, Math.min(1, direction));
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
      heldKeyboardTurns.clear();
      heldPointerTurns.clear();
      rainbowRequested = false;
    },
  };
}
