export const maps = [
  {
    id: "verdant",
    name: "翠岭小道",
    description: "丘陵间蜿蜒的要道。",
    grid: { cols: 12, rows: 8 },
    path: [
      { x: 0, y: 3 },
      { x: 4, y: 3 },
      { x: 4, y: 5 },
      { x: 8, y: 5 },
      { x: 8, y: 2 },
      { x: 11, y: 2 }
    ],
    decor: [
      { x: 2, y: 1, type: "tree" },
      { x: 6, y: 1, type: "rock" },
      { x: 9, y: 6, type: "tree" },
      { x: 1, y: 6, type: "tree" }
    ]
  },
  {
    id: "river",
    name: "河湾关隘",
    description: "河道弯曲，防线更短。",
    grid: { cols: 12, rows: 8 },
    path: [
      { x: 0, y: 6 },
      { x: 3, y: 6 },
      { x: 3, y: 2 },
      { x: 7, y: 2 },
      { x: 7, y: 7 },
      { x: 11, y: 7 }
    ],
    decor: [
      { x: 1, y: 1, type: "tree" },
      { x: 5, y: 4, type: "tree" },
      { x: 9, y: 1, type: "rock" },
      { x: 10, y: 4, type: "tree" }
    ]
  },
  {
    id: "ruins",
    name: "遗迹之门",
    description: "残垣断壁，转角密集。",
    grid: { cols: 12, rows: 8 },
    path: [
      { x: 0, y: 1 },
      { x: 5, y: 1 },
      { x: 5, y: 4 },
      { x: 2, y: 4 },
      { x: 2, y: 7 },
      { x: 10, y: 7 },
      { x: 10, y: 3 },
      { x: 11, y: 3 }
    ],
    decor: [
      { x: 6, y: 6, type: "rock" },
      { x: 8, y: 5, type: "tree" },
      { x: 9, y: 2, type: "tree" },
      { x: 3, y: 2, type: "rock" }
    ]
  },
  {
    id: "fortress",
    name: "王城堡垒",
    description: "漫长的绕城之路，终极防线。",
    grid: { cols: 12, rows: 8 },
    path: [
      { x: 0, y: 0 },
      { x: 0, y: 7 },
      { x: 5, y: 7 },
      { x: 5, y: 1 },
      { x: 9, y: 1 },
      { x: 9, y: 6 },
      { x: 11, y: 6 }
    ],
    decor: [
      { x: 2, y: 3, type: "rock" },
      { x: 3, y: 5, type: "tree" },
      { x: 7, y: 4, type: "rock" },
      { x: 10, y: 3, type: "tree" },
      { x: 8, y: 7, type: "rock" }
    ]
  }
];

export const towerTypes = {
  gun: {
    name: "弩炮塔",
    cost: 70,
    range: 2.4,
    fireRate: 0.9,
    damage: 10,
    projectileSpeed: 6.5,
    color: "#d8a66d",
    desc: "射速快，稳定单体伤害。"
  },
  slow: {
    name: "寒霜塔",
    cost: 90,
    range: 2.1,
    fireRate: 1.2,
    damage: 6,
    slowFactor: 0.55,
    slowDuration: 1.6,
    projectileSpeed: 5.2,
    color: "#7fb3c4",
    desc: "减速敌人，拖延行进速度。"
  },
  blast: {
    name: "爆裂塔",
    cost: 120,
    range: 2.6,
    fireRate: 1.6,
    damage: 14,
    splashRadius: 0.65,
    projectileSpeed: 5.4,
    color: "#d6975a",
    desc: "范围伤害，擅长清群。"
  },
  lightning: {
    name: "闪电塔",
    cost: 150,
    range: 2.8,
    fireRate: 1.8,
    damage: 18,
    chainCount: 3,
    chainRange: 1.5,
    projectileSpeed: 12,
    color: "#e8c840",
    desc: "闪电链击，连锁打击多个敌人。"
  },
  poison: {
    name: "瘴毒塔",
    cost: 100,
    range: 2.2,
    fireRate: 1.4,
    damage: 4,
    poisonDamage: 3,
    poisonDuration: 3.0,
    projectileSpeed: 5.0,
    color: "#7bb86f",
    desc: "持续中毒，慢性消耗敌人。"
  }
};

export const waves = Array.from({ length: 20 }, (_, i) => {
  const index = i + 1;
  return {
    count: 6 + index * 2,
    hp: 28 + index * 9,
    speed: 0.55 + index * 0.05,
    reward: 8 + index * 2,
    spawnInterval: Math.max(0.55, 1.2 - index * 0.05)
  };
});

export function expandPath(path) {
  const tiles = [];
  for (let i = 0; i < path.length - 1; i += 1) {
    const start = path[i];
    const end = path[i + 1];
    const dx = Math.sign(end.x - start.x);
    const dy = Math.sign(end.y - start.y);
    let x = start.x;
    let y = start.y;
    tiles.push({ x, y });
    while (x !== end.x || y !== end.y) {
      if (x !== end.x) x += dx;
      else if (y !== end.y) y += dy;
      tiles.push({ x, y });
    }
  }
  return tiles;
}
