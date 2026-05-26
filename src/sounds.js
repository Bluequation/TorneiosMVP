let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  return audioContext;
}

function playTone({
  frequency = 440,
  duration = 0.12,
  type = "square",
  volume = 0.08
}) {
  const context = getAudioContext();

  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;

  gain.gain.setValueAtTime(volume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    context.currentTime + duration
  );

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

export function playClickSound() {
  playTone({
    frequency: 520,
    duration: 0.08,
    type: "square",
    volume: 0.05
  });
}

export function playMenuSound() {
  playTone({
    frequency: 420,
    duration: 0.08,
    type: "triangle",
    volume: 0.06
  });

  setTimeout(() => {
    playTone({
      frequency: 620,
      duration: 0.1,
      type: "triangle",
      volume: 0.06
    });
  }, 70);
}

export function playTabSound() {
  playTone({
    frequency: 360,
    duration: 0.06,
    type: "sine",
    volume: 0.05
  });

  setTimeout(() => {
    playTone({
      frequency: 480,
      duration: 0.06,
      type: "sine",
      volume: 0.05
    });
  }, 55);
}

export function playWinSound() {
  playTone({
    frequency: 523,
    duration: 0.1,
    type: "square",
    volume: 0.07
  });

  setTimeout(() => {
    playTone({
      frequency: 659,
      duration: 0.1,
      type: "square",
      volume: 0.07
    });
  }, 100);

  setTimeout(() => {
    playTone({
      frequency: 784,
      duration: 0.16,
      type: "square",
      volume: 0.07
    });
  }, 200);
}

export function playFinishSound() {
  playTone({
    frequency: 392,
    duration: 0.12,
    type: "triangle",
    volume: 0.07
  });

  setTimeout(() => {
    playTone({
      frequency: 523,
      duration: 0.12,
      type: "triangle",
      volume: 0.07
    });
  }, 120);

  setTimeout(() => {
    playTone({
      frequency: 659,
      duration: 0.12,
      type: "triangle",
      volume: 0.07
    });
  }, 240);

  setTimeout(() => {
    playTone({
      frequency: 1046,
      duration: 0.22,
      type: "triangle",
      volume: 0.07
    });
  }, 360);
}