/** Web Audio APIで、外部ファイルを使わないゲーム効果音を生成する。 */
export function createAudio() {
  let audioContext;

  /** ユーザー操作後にAudioContextを作成または再開する。 */
  function unlock() {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioContext = new AudioContextClass();
    }
    if (audioContext.state === "suspended") audioContext.resume();
  }

  addEventListener("pointerdown", unlock);
  addEventListener("keydown", unlock);

  /** 指定した周波数変化を持つ短い音を予約する。 */
  function tone(
    frequency,
    delay,
    duration,
    type = "sine",
    endFrequency = frequency,
  ) {
    if (!audioContext || audioContext.state !== "running") return;

    const startTime = audioContext.currentTime + delay;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      endFrequency,
      startTime + duration,
    );
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.13, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  /** ゲームロジックから届いた効果音イベントを再生する。 */
  function playEvents(events) {
    for (const event of events.splice(0)) {
      if (event.type === "rainbowStart") {
        tone(360, 0, 0.18, "sine", 720);
      } else if (event.type === "rainbowEnd") {
        tone(330, 0, 0.16, "sine", 220);
      } else if (event.type === "capture") {
        const noteCount = event.multiplier === 1
          ? 3
          : event.multiplier === 2
            ? 4
            : 6;
        const rollingNotes = [520, 760, 880, 760, 880, 1040];

        for (let index = 0; index < noteCount; index += 1) {
          const isLastNote = index === noteCount - 1;
          const pitch = isLastNote ? 1040 : rollingNotes[index];
          tone(
            pitch,
            index * 0.055,
            isLastNote ? 0.24 : 0.1,
            "triangle",
          );
        }
      } else if (event.type === "star") {
        [660, 825, 990, 1320].forEach((pitch, index) => {
          tone(pitch, index * 0.07, 0.24, "triangle");
        });
      } else if (event.type === "gameOver") {
        // 音程が崩れ落ちたあと、短調の低音が沈んで残る失敗音。
        tone(392, 0, 0.16, "triangle", 350);
        tone(330, 0.13, 0.18, "triangle", 290);
        tone(262, 0.27, 0.22, "triangle", 225);
        tone(196, 0.43, 0.75, "triangle", 105);
        tone(233, 0.43, 0.68, "sine", 125);
      }
    }
  }

  return { playEvents };
}
