const KEY = "td_progress_v1";

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return { unlocked: 1, bestWaves: [0, 0, 0] };
    }
    const data = JSON.parse(raw);
    return {
      unlocked: Math.max(1, Math.min(3, data.unlocked || 1)),
      bestWaves: Array.isArray(data.bestWaves)
        ? [data.bestWaves[0] || 0, data.bestWaves[1] || 0, data.bestWaves[2] || 0]
        : [0, 0, 0]
    };
  } catch (err) {
    return { unlocked: 1, bestWaves: [0, 0, 0] };
  }
}

export function saveProgress(progress) {
  localStorage.setItem(KEY, JSON.stringify(progress));
}
