const KEY = "td_progress_v1";
const ACHIEVEMENT_KEY = "td_achievements_v1";

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return { unlocked: 1, bestWaves: [0, 0, 0, 0] };
    }
    const data = JSON.parse(raw);
    const bw = Array.isArray(data.bestWaves) ? data.bestWaves : [0, 0, 0, 0];
    while (bw.length < 4) bw.push(0);
    return {
      unlocked: Math.max(1, Math.min(4, data.unlocked || 1)),
      bestWaves: bw
    };
  } catch (err) {
    return { unlocked: 1, bestWaves: [0, 0, 0, 0] };
  }
}

export function saveProgress(progress) {
  localStorage.setItem(KEY, JSON.stringify(progress));
}

// 成就系统
const ACHIEVEMENTS = [
  { id: 'first_win', name: '初战告捷', desc: '通关任意地图', icon: '🏆' },
  { id: 'all_maps', name: '征服四方', desc: '通关所有地图', icon: '🌟' },
  { id: 'no_damage', name: '铜墙铁壁', desc: '任意地图无伤通关', icon: '🛡️' },
  { id: 'wave_10', name: '坚守十波', desc: '在任意地图达到第10波', icon: '⚔️' },
  { id: 'tower_master', name: '建筑大师', desc: '同时拥有5种防御塔', icon: '🏗️' }
];

export function loadAchievements() {
  try {
    const raw = localStorage.getItem(ACHIEVEMENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveAchievement(id) {
  const list = loadAchievements();
  if (!list.includes(id)) {
    list.push(id);
    localStorage.setItem(ACHIEVEMENT_KEY, JSON.stringify(list));
    return true; // 新解锁
  }
  return false;
}

export function getAchievementList() {
  return ACHIEVEMENTS;
}

export { ACHIEVEMENTS };
