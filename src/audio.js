import { BGM_TEMPO, BGM_VOLUME } from "./const.js";

/** Web Audio APIで、外部ファイルを使わないゲーム音声を生成する。 */
export function createAudio() {
  let audioContext;
  let musicGain;
  let nextMusicTime = 0;
  let musicStep = 0;

  /** ユーザー操作後にAudioContextを作成または再開する。 */
  function unlock() {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioContext = new AudioContextClass();
      musicGain = audioContext.createGain();
      musicGain.gain.value = 0.0001;
      musicGain.connect(audioContext.destination);
    }
    if (audioContext.state === "suspended") audioContext.resume();
  }

  /** BGM用の柔らかい単音を指定時刻へ予約する。 */
  function musicTone(frequency, startTime, duration, type, volume) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(gain).connect(musicGain);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  /** ゲーム中のアルペジオを先読み生成し、STAR TIMEでは明るく変化させる。 */
  function updateMusic(isPlaying, isStarTime) {
    if (!audioContext || audioContext.state !== "running") return;

    const currentTime = audioContext.currentTime;
    if (!isPlaying) {
      musicGain.gain.setTargetAtTime(0.0001, currentTime, 0.035);
      nextMusicTime = 0;
      return;
    }

    musicGain.gain.setTargetAtTime(BGM_VOLUME, currentTime, 0.08);
    if (nextMusicTime === 0) nextMusicTime = currentTime + 0.05;

    const stepDuration = 30 / BGM_TEMPO;
    const melody = [
      523, 659, 784, 659,
      587, 698, 880, 698,
      523, 659, 831, 659,
      494, 659, 784, 659,
    ];
    const bass = [131, 147, 165, 123];

    while (nextMusicTime < currentTime + 0.18) {
      const melodyFrequency = melody[musicStep % melody.length];
      const starPitch = isStarTime ? 1.25 : 1;
      musicTone(
        melodyFrequency * starPitch,
        nextMusicTime,
        stepDuration * 0.72,
        "triangle",
        isStarTime ? 0.11 : 0.085,
      );

      if (musicStep % 4 === 0) {
        musicTone(
          bass[Math.floor(musicStep / 4) % bass.length],
          nextMusicTime,
          stepDuration * 2.8,
          "sine",
          0.09,
        );
      }

      if (isStarTime && musicStep % 2 === 0) {
        musicTone(
          melodyFrequency * 2,
          nextMusicTime + 0.035,
          stepDuration * 0.45,
          "sine",
          0.045,
        );
      }

      musicStep = (musicStep + 1) % melody.length;
      nextMusicTime += stepDuration;
    }
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
        if (musicGain) {
          musicGain.gain.setTargetAtTime(
            0.0001,
            audioContext.currentTime,
            0.025,
          );
        }
        // 音程が崩れ落ちたあと、短調の低音が沈んで残る失敗音。
        tone(392, 0, 0.16, "triangle", 350);
        tone(330, 0.13, 0.18, "triangle", 290);
        tone(262, 0.27, 0.22, "triangle", 225);
        tone(196, 0.43, 0.75, "triangle", 105);
        tone(233, 0.43, 0.68, "sine", 125);
      }
    }
  }

  return { playEvents, updateMusic };
}
