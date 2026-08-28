/* 运行时错误可视化（写入标题，便于诊断） */
window.addEventListener('error', ev => {
  document.title = 'ERR ' + (ev.message || 'unknown') + ' @line' + (ev.lineno || '?');
});
window.addEventListener('unhandledrejection', () => { document.title = 'ERR promise'; });
/* ================= 基础常量 ================= */
const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d');
const W = 1040, H = 650;
const COLS = 9, ROWS = 5, CELL_W = 90, CELL_H = 100;
const LAWN_X = 150, LAWN_Y = 92, LAWN_W = COLS*CELL_W, LAWN_H = ROWS*CELL_H;
const HUD_H = LAWN_Y;
const DPR = Math.min(2, window.devicePixelRatio || 1);
cvs.width = W * DPR; cvs.height = H * DPR;

const cellX = c => LAWN_X + c*CELL_W;
const rowY  = r => LAWN_Y + r*CELL_H;
const cellCX = c => cellX(c) + CELL_W/2;
const cellCY = r => rowY(r) + CELL_H/2;

/* ================= 植物配置 ================= */
const PDEFS = {
  sunflower:  { name:'向日葵',   cost:50,  hp:120, cd:7.5, desc:'定期生产阳光' },
  peashooter: { name:'豌豆射手', cost:100, hp:120, cd:7.5, desc:'发射豌豆攻击' },
  wallnut:    { name:'坚果墙',   cost:50,  hp:900, cd:30,  desc:'抵挡僵尸的墙' },
  snowpea:    { name:'寒冰射手', cost:175, hp:120, cd:7.5, desc:'冰豌豆可减速' },
  repeater:   { name:'双发射手', cost:200, hp:120, cd:7.5, desc:'一次发射两颗' },
  cherry:     { name:'樱桃炸弹', cost:150, hp:300, cd:35,  desc:'炸掉 3×3 僵尸' },
};
const CARD_ORDER = ['sunflower','peashooter','wallnut','snowpea','repeater','cherry'];

/* ================= 僵尸配置 ================= */
const ZDEFS = {
  normal: { hp:200, speed:13,   hat:null },
  cone:   { hp:420, speed:13,   hat:'cone' },
  bucket: { hp:760, speed:11.5, hat:'bucket' },
};

/* ================= 游戏状态 ================= */
let state = 'menu';        // menu | playing | paused | over | win
let game = null;
let mouse = { x:-1, y:-1, down:false };
let hoverCell = null;
let now = 0;

function newGame(){
  return {
    sun: 150, sunPop: 0,
    grid: Array.from({length:ROWS}, () => Array(COLS).fill(null)),
    zombies: [], peas: [], suns: [], parts: [],
    mowers: Array.from({length:ROWS}, (_,r) => ({ row:r, x:LAWN_X-48, active:false, gone:false, spin:0 })),
    schedule: buildSchedule(), spawnIdx: 0, finalWaveT: -1, bannerT: -9,
    skySunT: 6, groanT: 5, shakeT: 0, time: 0,
    cards: CARD_ORDER.map(t => ({ type:t, cd:0 })),
    sel: -1, shovel: false,
    introT: 3.2, winDelay: 0,
  };
}
let rowBag = [];
function nextRow(){
  if(!rowBag.length){ rowBag = [0,1,2,3,4]; for(let i=rowBag.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [rowBag[i],rowBag[j]]=[rowBag[j],rowBag[i]]; } }
  return rowBag.pop();
}
function buildSchedule(){
  const list = []; let t = 16;
  const main = 24;
  for(let i=0;i<main;i++){
    const p = i/main; let type = 'normal'; const r = Math.random();
    if(p >= 0.5 && r < 0.20) type = 'bucket';
    else if(p >= 0.2 && r < 0.2 + 0.4*p) type = 'cone';
    list.push({ time:t, type });
    t += 11 - 6.5*p;           // 11s → 4.5s
  }
  const tf = t + 5;
  const finals = ['cone','normal','cone','bucket','normal','cone','bucket'];
  finals.forEach((type,i) => list.push({ time:tf + i*0.35, type, final:true }));
  return list;
}

/* ================= 音效（WebAudio 合成） ================= */
/* 静音状态与全站公共键 gameAudioMuted 保持同步 */
const BEST_KEY = 'miniGames.v1.plants-vs-zombies.best';
function loadMuted(){ try{ return localStorage.getItem('gameAudioMuted') === '1'; }catch(e){ return false; } }
function saveMuted(v){ try{ localStorage.setItem('gameAudioMuted', v ? '1' : '0'); }catch(e){} }
function saveBest(sec){ try{ localStorage.setItem(BEST_KEY, String(sec)); }catch(e){} }
let AC = null, muted = loadMuted();
function ac(){
  if(!AC){ try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
  if(AC && AC.state === 'suspended') AC.resume();   // 移动端需在手势内激活
  return AC;
}
function tone(f, d, type='square', v=0.12, slide=0){
  if(muted || !ac()) return;
  const a = AC, o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime;
  o.type = type; o.frequency.setValueAtTime(f, t0);
  if(slide) o.frequency.linearRampToValueAtTime(Math.max(30, f+slide), t0+d);
  g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.001, t0+d);
  o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0+d+0.02);
}
function noiseS(d, v=0.2){
  if(muted || !ac()) return;
  const a = AC, n = (a.sampleRate*d)|0, buf = a.createBuffer(1, n, a.sampleRate), ch = buf.getChannelData(0);
  for(let i=0;i<n;i++) ch[i] = (Math.random()*2-1) * (1-i/n);
  const s = a.createBufferSource(), g = a.createGain();
  s.buffer = buf; g.gain.value = v; s.connect(g); g.connect(a.destination); s.start();
}
const SFX = {
  plant: () => tone(190, .12, 'triangle', .25, -70),
  shoot: () => tone(560, .07, 'square', .06, -260),
  hit:   () => tone(230, .05, 'square', .09, -100),
  sun:   () => { tone(784, .09, 'sine', .14); setTimeout(()=>tone(1175, .12, 'sine', .14), 70); },
  boom:  () => { noiseS(.55, .4); tone(70, .45, 'sawtooth', .3, -40); },
  groan: () => tone(85, .45, 'sawtooth', .07, 25),
  chomp: () => tone(140, .08, 'sawtooth', .08, -50),
  shovel:() => tone(300, .1, 'triangle', .15, -150),
  mower: () => { noiseS(.9, .22); tone(110, .7, 'sawtooth', .12, 60); },
  card:  () => tone(660, .06, 'sine', .1),
  deny:  () => tone(160, .12, 'square', .1, -60),
  lose:  () => { tone(300,.3,'sawtooth',.15,-120); setTimeout(()=>tone(200,.5,'sawtooth',.15,-120), 280); },
  win:   () => [523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,.18,'triangle',.16), i*140)),
};

/* ================= 粒子 ================= */
function burst(x, y, color, n=10, spd=120, grav=260, life=0.6, r=4){
  for(let i=0;i<n;i++){
    const a = Math.random()*Math.PI*2, s = spd*(0.3+Math.random()*0.7);
    game.parts.push({ x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s - spd*0.4, grav, life:life*(0.6+Math.random()*0.8), maxLife:life, color, r:r*(0.5+Math.random()) });
  }
}

/* ================= 阳光 ================= */
function spawnSun(x, y, targetY, fromFlower){
  game.suns.push({ x, y, ty:targetY, r:26, t:0, life:10, fly:false, value:25, wob:Math.random()*6.28, fromFlower });
}

/* ================= 种植 / 交互动作 ================= */
function plantAt(c, r, type){
  const d = PDEFS[type];
  const p = { type, c, r, x:cellCX(c), y:cellCY(r), hp:d.hp, maxHp:d.hp, age:Math.random()*10,
              timer: type==='sunflower' ? 7+Math.random()*3 : 0,
              shootT: 0.4, second: null, recoil: 0, fuse: type==='cherry' ? 1.1 : 0, phase: Math.random()*6.28 };
  game.grid[r][c] = p;
  SFX.plant();
  burst(p.x, p.y+30, '#7bc043', 8, 80, 200, .5, 3);
}
function removePlant(p){
  if(game.grid[p.r][p.c] === p) game.grid[p.r][p.c] = null;
}
function explodeCherry(p){
  removePlant(p);
  const cx = p.x, cy = p.y;
  for(const z of game.zombies){
    if(!z.dying && Math.abs(z.row - p.r) <= 1 && Math.abs(z.x - cx) <= CELL_W*1.6){
      z.hp -= 1800; z.hitT = .2;
      if(z.hp <= 0) killZombie(z);
    }
  }
  burst(cx, cy, '#ff9d2e', 42, 320, 150, .9, 7);
  burst(cx, cy, '#ffd93b', 26, 240, 100, .8, 5);
  burst(cx, cy, '#5a5a5a', 18, 140, 40, 1.3, 8);
  game.shakeT = 0.45; SFX.boom();
}
function killZombie(z){
  if(z.dying) return;
  z.dying = true; z.dieT = 0;
  game._kills = (game._kills || 0) + 1;
  burst(z.x, rowY(z.row)+60, '#7d8a6e', 10, 100, 300, .7, 4);
}
function shootPea(p){
  const snow = p.type === 'snowpea';
  game.peas.push({ x:p.x+34, y:p.y-24, row:p.r, type:p.type, snow });
  p.recoil = 1; SFX.shoot();
}

/* ================= 更新逻辑 ================= */
function zombieInRow(r, fromX){
  return game.zombies.some(z => z.row === r && !z.dying && z.x > fromX - 12 && z.x < W + 20);
}
function update(dt){
  const g = game;
  g.time += dt;
  if(g.introT > 0) g.introT -= dt;
  g.sunPop = Math.max(0, g.sunPop - dt*3);
  g.shakeT = Math.max(0, g.shakeT - dt);

  /* --- 刷怪 --- */
  const sched = g.schedule;
  while(g.spawnIdx < sched.length && g.time >= sched[g.spawnIdx].time){
    const s = sched[g.spawnIdx];
    const d = ZDEFS[s.type];
    g.zombies.push({ type:s.type, row:nextRow(), x: W + 24 + Math.random()*36,
      hp:d.hp, maxHp:d.hp, speed:d.speed*(0.92+Math.random()*0.16),
      walk:Math.random()*10, slowT:0, hitT:0, dying:false, dieT:0, eating:false, chompT:0 });
    if(s.final && g.finalWaveT < 0){ g.finalWaveT = g.time; g.bannerT = g.time; }
    g.spawnIdx++;
  }
  if(sched.length && g.spawnIdx === sched.length && g.zombies.length === 0){
    g.winDelay += dt;
    if(g.winDelay > 1.2){
      state = 'win'; SFX.win();
      /* 记录最佳通关用时 */
      const t = Math.floor(g.time);
      const prev = parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0;
      if(!prev || t < prev){ saveBest(t); g.best = t; g.newBest = true; }
      else g.best = prev;
      if(window.GameCelebration) window.GameCelebration.show({ duration: 3000 });
      return;
    }
  }

  /* --- 天降阳光 --- */
  g.skySunT -= dt;
  if(g.skySunT <= 0){
    g.skySunT = 8 + Math.random()*3;
    spawnSun(LAWN_X + 30 + Math.random()*(LAWN_W-60), -30, rowY(((Math.random()*ROWS)|0)) + 40 + Math.random()*30, false);
  }

  /* --- 僵尸低吼 --- */
  g.groanT -= dt;
  if(g.groanT <= 0){ g.groanT = 4 + Math.random()*5; if(g.zombies.some(z=>!z.dying)) SFX.groan(); }

  /* --- 植物 --- */
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
    const p = g.grid[r][c]; if(!p) continue;
    p.age += dt; p.recoil = Math.max(0, p.recoil - dt*4);
    if(p.type === 'sunflower'){
      p.timer -= dt;
      if(p.timer <= 0){ p.timer = 14 + Math.random()*3;
        spawnSun(p.x + (Math.random()*44-22), p.y - 10, p.y + 26, true); }
    } else if(p.type === 'peashooter' || p.type === 'snowpea' || p.type === 'repeater'){
      if(zombieInRow(r, p.x)){
        p.shootT -= dt;
        if(p.shootT <= 0){ p.shootT = 1.4; shootPea(p); if(p.type==='repeater') p.second = 0.16; }
      }
      if(p.second !== null){ p.second -= dt; if(p.second <= 0){ p.second = null; shootPea(p); } }
    } else if(p.type === 'cherry'){
      p.fuse -= dt; if(p.fuse <= 0){ explodeCherry(p); continue; }
    }
    if(p.hp <= 0){ burst(p.x, p.y, '#8aa15a', 10, 90, 250, .6, 3); removePlant(p); }
  }

  /* --- 豌豆 --- */
  for(const pea of g.peas){
    pea.x += 340*dt;
    for(const z of g.zombies){
      if(z.row !== pea.row || z.dying) continue;
      if(pea.x > z.x - 22 && pea.x < z.x + 22){
        z.hp -= 20; z.hitT = .12;
        if(pea.snow) z.slowT = 4;
        burst(pea.x+6, pea.y, pea.snow ? '#bfe9ff' : '#9adf5a', 5, 70, 200, .35, 3);
        SFX.hit();
        if(z.hp <= 0) killZombie(z);
        pea.dead = true; break;
      }
    }
    if(pea.x > W + 20) pea.dead = true;
  }
  g.peas = g.peas.filter(p => !p.dead);

  /* --- 僵尸 --- */
  for(const z of g.zombies){
    if(z.dying){ z.dieT += dt; continue; }
    z.hitT = Math.max(0, z.hitT - dt);
    z.slowT = Math.max(0, z.slowT - dt);
    const frontX = z.x - 22;
    const col = Math.floor((frontX - LAWN_X) / CELL_W);
    let eating = false;
    if(col >= 0 && col < COLS){
      const p = g.grid[z.row][col];
      if(p && frontX < cellCX(col) + 26){
        eating = true;
        p.hp -= 30*dt;
        z.chompT -= dt;
        if(z.chompT <= 0){ z.chompT = 0.55; SFX.chomp(); }
      }
    }
    z.eating = eating;
    if(!eating){
      const sp = z.speed * (z.slowT > 0 ? 0.45 : 1);
      z.x -= sp*dt;
      z.walk += dt * (z.slowT > 0 ? 4 : 8);
    }
    // 触发小推车 / 进屋判定
    if(z.x < LAWN_X - 8){
      const m = g.mowers[z.row];
      if(m && !m.gone && !m.active){ m.active = true; SFX.mower(); }
      if((!m || m.gone) && z.x < LAWN_X - 66){
        state = 'over'; SFX.lose(); return;
      }
    }
  }
  g.zombies = g.zombies.filter(z => !(z.dying && z.dieT > 0.9));

  /* --- 小推车 --- */
  for(const m of g.mowers){
    if(m.gone || !m.active) continue;
    m.x += 460*dt; m.spin += dt*30;
    for(const z of g.zombies){
      if(z.row === m.row && !z.dying && z.x < m.x + 38){ z.hp = 0; killZombie(z); }
    }
    if(m.x > W + 60) m.gone = true;
  }

  /* --- 阳光 --- */
  for(const s of g.suns){
    s.t += dt;
    if(s.fly){
      const tx = 74, ty = 46, k = Math.min(1, dt*7);
      s.x += (tx - s.x)*k; s.y += (ty - s.y)*k;
      if(Math.abs(s.x-tx) < 22 && Math.abs(s.y-ty) < 22){
        s.dead = true; g.sun += s.value; g.sunPop = 1;
      }
    } else {
      if(s.y < s.ty) s.y = Math.min(s.ty, s.y + 55*dt);
      else { s.life -= dt; if(s.life <= 0) s.dead = true; }
    }
  }
  g.suns = g.suns.filter(s => !s.dead);

  /* --- 粒子 --- */
  for(const p of g.parts){ p.life -= dt; p.vy += p.grav*dt; p.x += p.vx*dt; p.y += p.vy*dt; }
  g.parts = g.parts.filter(p => p.life > 0);

  /* --- 卡片冷却 --- */
  for(const card of g.cards) card.cd = Math.max(0, card.cd - dt);
}

/* ================= 绘制：植物 ================= */
function drawPlantType(type, x, y, scale, t, opt = {}){
  const sway = Math.sin(t*2 + (opt.phase||0)) * 0.05;
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  const stem = (h=40) => {
    ctx.strokeStyle = '#3a8f2f'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, h); ctx.quadraticCurveTo(4, h*0.5, 0, 2); ctx.stroke();
    ctx.fillStyle = '#4caf3c';
    ctx.beginPath(); ctx.ellipse(-9, h-4, 10, 5, -0.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(9, h-2, 10, 5, 0.5, 0, 7); ctx.fill();
  };
  if(type === 'sunflower'){
    ctx.rotate(sway); stem();
    for(let i=0;i<12;i++){
      const a = i/12*Math.PI*2 + t*0.3;
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath(); ctx.ellipse(Math.cos(a)*24, Math.sin(a)*24 - 8, 11, 5.5, a, 0, 7); ctx.fill();
    }
    ctx.fillStyle = '#c68a2e'; ctx.beginPath(); ctx.arc(0, -8, 17, 0, 7); ctx.fill();
    ctx.fillStyle = '#a86f22'; ctx.beginPath(); ctx.arc(0, -8, 12.5, 0, 7); ctx.fill();
    face(0, -8, false);
  } else if(type === 'peashooter' || type === 'snowpea' || type === 'repeater'){
    const head = type === 'snowpea' ? '#6cc7f0' : '#4caf3c';
    const dark = type === 'snowpea' ? '#3e9cd0' : '#3a8f2f';
    ctx.rotate(sway*0.7); stem();
    ctx.translate(-(opt.recoil||0)*6, 0);
    if(type === 'repeater'){
      ctx.fillStyle = head; ctx.strokeStyle = dark; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(-16, -8, 13, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = dark; ctx.fillRect(-34, -13, 12, 10);
    }
    // 炮管
    ctx.fillStyle = head; ctx.strokeStyle = dark; ctx.lineWidth = 3;
    roundRect(6, -18, 30, 17, 8); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(36, -9.5, 6, 8.5, 0, 0, 7); ctx.fillStyle = dark; ctx.fill();
    // 头
    ctx.fillStyle = head; ctx.beginPath(); ctx.arc(-2, -8, 20, 0, 7); ctx.fill(); ctx.stroke();
    if(type === 'snowpea'){
      ctx.fillStyle = '#eaf9ff';
      for(let i=0;i<3;i++){ const a = -2.2 + i*0.5;
        ctx.beginPath(); ctx.moveTo(Math.cos(a)*20-2, Math.sin(a)*20-8); ctx.lineTo(Math.cos(a)*30-2, Math.sin(a)*30-8);
        ctx.strokeStyle='#eaf9ff'; ctx.lineWidth=2.5; ctx.stroke(); }
    }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(4, -16, 4.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(5.5, -16, 2.2, 0, 7); ctx.fill();
  } else if(type === 'wallnut'){
    const ratio = opt.hp == null ? 1 : opt.hp/opt.maxHp;
    ctx.rotate(sway*0.5);
    ctx.fillStyle = '#b5803c'; ctx.strokeStyle = '#8a5a24'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.ellipse(0, 2, 30, 38, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.beginPath(); ctx.ellipse(-9, -14, 11, 16, -0.4, 0, 7); ctx.fill();
    face(0, 4, true);
    if(ratio < 0.66){ ctx.strokeStyle = '#5b3a14'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(14,-28); ctx.lineTo(8,-16); ctx.lineTo(16,-8); ctx.stroke(); }
    if(ratio < 0.33){ ctx.beginPath(); ctx.moveTo(-20,10); ctx.lineTo(-10,18); ctx.lineTo(-18,28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6,20); ctx.lineTo(12,30); ctx.stroke(); }
  } else if(type === 'cherry'){
    const pulse = 1 + Math.max(0, Math.sin(t*22)) * 0.09;
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = '#3a8f2f'; ctx.lineWidth = 4; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-10, -6); ctx.quadraticCurveTo(-4, -30, 2, -34); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(14, -10); ctx.quadraticCurveTo(8, -28, 2, -34); ctx.stroke();
    for(const [cx, cy, r] of [[-12, 6, 16], [14, 2, 18]]){
      ctx.fillStyle = '#d3312f'; ctx.strokeStyle = '#9c1f1e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.3)';
      ctx.beginPath(); ctx.ellipse(cx - r*0.35, cy - r*0.4, r*0.28, r*0.18, -0.6, 0, 7); ctx.fill();
    }
    face(-12, 6, false); face(14, 2, false);
  }
  ctx.restore();

  function face(fx, fy, worried){
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(fx-5, fy-3, 3.4, 0, 7); ctx.arc(fx+5, fy-3, 3.4, 0, 7); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(fx-4, fy-3, 1.7, 0, 7); ctx.arc(fx+6, fy-3, 1.7, 0, 7); ctx.fill();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.lineCap='round';
    ctx.beginPath();
    if(worried){ ctx.arc(fx, fy+9, 4, Math.PI*1.15, Math.PI*1.85); }
    else { ctx.arc(fx, fy+2, 5, 0.35, Math.PI-0.35); }
    ctx.stroke();
  }
}
function drawPlantFull(p){
  drawPlantType(p.type, p.x, p.y + 6, 1, now, { phase:p.phase, recoil:p.recoil, hp:p.hp, maxHp:p.maxHp, fuse:p.fuse });
  if(p.hp < p.maxHp && p.type !== 'cherry'){
    const w = 44, r = p.hp/p.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(p.x-w/2, p.y+42, w, 5);
    ctx.fillStyle = r > 0.4 ? '#7ec850' : '#e05252'; ctx.fillRect(p.x-w/2, p.y+42, w*r, 5);
  }
}

/* ================= 绘制：僵尸 / 小推车 ================= */
function drawZombie(z){
  const fy = rowY(z.row) + 84;
  ctx.save();
  ctx.translate(z.x, fy);
  if(z.dying){
    const k = z.dieT/0.9;
    ctx.globalAlpha = 1 - k;
    ctx.rotate(-k*1.6); ctx.translate(0, k*10);   // 向前行进方向倒下
  }
  const walk = z.walk;
  const bob = Math.sin(walk)*2;
  const skin = z.slowT > 0 ? '#8fb6c9' : '#a3b58c';
  const skinD = z.slowT > 0 ? '#6f95a9' : '#7d8a6e';
  // 腿
  ctx.strokeStyle = '#4a4438'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  const ls = Math.sin(walk)*6, rs = Math.sin(walk+Math.PI)*6;
  ctx.beginPath(); ctx.moveTo(-5, -24); ctx.lineTo(-5+ls, -2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6, -24); ctx.lineTo(6+rs, -2); ctx.stroke();
  // 身体
  ctx.fillStyle = skinD; ctx.strokeStyle = '#565e4b'; ctx.lineWidth = 2.5;
  roundRect(-14, -54+bob, 28, 32, 7); ctx.fill(); ctx.stroke();
  // 领带
  ctx.fillStyle = '#7a2d2d';
  ctx.beginPath(); ctx.moveTo(0,-52+bob); ctx.lineTo(4,-44+bob); ctx.lineTo(0,-32+bob); ctx.lineTo(-4,-44+bob); ctx.closePath(); ctx.fill();
  // 手臂（前伸，指向行进方向：左）
  ctx.strokeStyle = skin; ctx.lineWidth = 7;
  const armY = -44 + bob + Math.sin(walk*1.7)*2 + (z.eating ? Math.sin(now*18)*3 : 0);
  ctx.beginPath(); ctx.moveTo(-2, armY); ctx.lineTo(-26, armY+6); ctx.stroke();
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(-28, armY+6, 4.5, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(4, armY+8); ctx.lineTo(-14, armY+14); ctx.stroke();
  // 头（向行进方向前倾）
  const hx = -3 + (z.eating ? Math.sin(now*18)*1.5 : 0), hy = -64 + bob*0.6;
  ctx.fillStyle = skin; ctx.strokeStyle = skinD; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(hx, hy, 15, 0, 7); ctx.fill(); ctx.stroke();
  // 眼/嘴（视线朝左）
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(hx-6, hy-3, 4, 0, 7); ctx.arc(hx+4, hy-3, 3.4, 0, 7); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(hx-7, hy-3, 1.8, 0, 7); ctx.arc(hx+3, hy-3, 1.6, 0, 7); ctx.fill();
  ctx.fillStyle = '#3c3327';
  ctx.beginPath(); ctx.ellipse(hx-1, hy+7, 4.5, z.eating ? 4+Math.abs(Math.sin(now*10))*2 : 2.5, 0, 0, 7); ctx.fill();
  // 帽子（掉血越多歪得越厉害）
  ctx.save();
  ctx.translate(hx, hy); ctx.rotate((1 - z.hp/z.maxHp) * 0.5); ctx.translate(-hx, -hy);
  if(z.type === 'cone'){
    ctx.fillStyle = '#e8862e'; ctx.strokeStyle = '#b56618'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(hx-13, hy-9); ctx.lineTo(hx, hy-34); ctx.lineTo(hx+13, hy-9); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.5)';
    ctx.beginPath(); ctx.moveTo(hx-5, hy-14); ctx.lineTo(hx-1, hy-26); ctx.stroke();
  } else if(z.type === 'bucket'){
    ctx.fillStyle = '#9aa2ab'; ctx.strokeStyle = '#6f767e'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(hx-13, hy-8); ctx.lineTo(hx-10, hy-30); ctx.lineTo(hx+10, hy-30); ctx.lineTo(hx+13, hy-8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c3cad1'; roundRect(hx-11, hy-33, 22, 5, 2); ctx.fill();
  }
  ctx.restore();
  // 受击 / 减速 染色
  if(z.hitT > 0){ ctx.fillStyle = `rgba(255,255,255,${0.55*z.hitT/0.12})`; ctx.beginPath(); ctx.arc(0, -40, 30, 0, 7); ctx.fill(); }
  if(z.slowT > 0 && !z.dying){ ctx.fillStyle = 'rgba(90,170,255,.22)'; ctx.beginPath(); ctx.arc(0, -40, 30, 0, 7); ctx.fill(); }
  ctx.restore();
}
function drawMower(m){
  ctx.save(); ctx.translate(m.x, rowY(m.row) + 66);
  if(m.active){ ctx.fillStyle = 'rgba(200,200,200,.35)';
    for(let i=0;i<3;i++){ ctx.fillRect(-26 - i*12, -12, 7, 14); } }
  ctx.fillStyle = '#4a7c3f'; ctx.strokeStyle = '#2f5429'; ctx.lineWidth = 2.5;
  roundRect(-22, -22, 40, 20, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2f5429'; roundRect(-30, -30, 14, 10, 3); ctx.fill();
  ctx.strokeStyle = '#333'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-26, -26); ctx.lineTo(-40, -6); ctx.stroke();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(-12, 2, 7, m.spin, m.spin+7); ctx.fill();
  ctx.beginPath(); ctx.arc(10, 2, 7, m.spin, m.spin+7); ctx.fill();
  ctx.fillStyle = '#777';
  ctx.beginPath(); ctx.arc(-12, 2, 2.5, 0, 7); ctx.arc(10, 2, 2.5, 0, 7); ctx.fill();
  ctx.restore();
}

/* ================= 绘制：场景 ================= */
function roundRect(x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.arcTo(x+w, y, x+w, y+h, r); ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r); ctx.arcTo(x, y, x+w, y, r); ctx.closePath();
}
function drawBackground(){
  // 房子门廊
  const grad = ctx.createLinearGradient(0, 0, 120, 0);
  grad.addColorStop(0, '#8a4b2d'); grad.addColorStop(1, '#a35f39');
  ctx.fillStyle = grad; ctx.fillRect(0, HUD_H, LAWN_X, H - HUD_H);
  ctx.fillStyle = 'rgba(0,0,0,.08)';
  for(let y = HUD_H; y < H; y += 26) ctx.fillRect(0, y, LAWN_X, 2);
  ctx.fillStyle = '#6d3a20'; ctx.fillRect(LAWN_X - 8, HUD_H, 8, H - HUD_H);
  // 草地
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
    ctx.fillStyle = (r + c) % 2 ? '#7ac74f' : '#8fd960';
    ctx.fillRect(cellX(c), rowY(r), CELL_W, CELL_H);
  }
  // 右侧僵尸入口
  const g2 = ctx.createLinearGradient(LAWN_X+LAWN_W, 0, W, 0);
  g2.addColorStop(0, '#4d3a26'); g2.addColorStop(1, '#38291a');
  ctx.fillStyle = g2; ctx.fillRect(LAWN_X+LAWN_W, HUD_H, W-LAWN_X-LAWN_W, H-HUD_H);
  ctx.strokeStyle = 'rgba(0,0,0,.25)';
  for(let r=0;r<=ROWS;r++){ ctx.beginPath(); ctx.moveTo(LAWN_X+LAWN_W, rowY(r)); ctx.lineTo(W, rowY(r)); ctx.stroke(); }
  // 草地边框
  ctx.strokeStyle = '#5b8f3c'; ctx.lineWidth = 3;
  ctx.strokeRect(LAWN_X, HUD_H, LAWN_W, LAWN_H);
}
function drawSun(s){
  ctx.save(); ctx.translate(s.x, s.y);
  const k = s.fly ? 0.8 : 1;
  const fade = (!s.fly && s.life < 2) ? (0.35 + 0.65*Math.abs(Math.sin(s.life*5))) : 1;
  ctx.globalAlpha = fade;
  ctx.rotate(now*1.2 + s.wob);
  ctx.fillStyle = 'rgba(255,210,60,.85)';
  for(let i=0;i<8;i++){
    const a = i/8*Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a)*12*k, Math.sin(a)*12*k);
    ctx.lineTo(Math.cos(a+0.25)*24*k, Math.sin(a+0.25)*24*k);
    ctx.lineTo(Math.cos(a+0.5)*12*k, Math.sin(a+0.5)*12*k);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#ffd93b'; ctx.beginPath(); ctx.arc(0, 0, 14*k, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffe98a'; ctx.beginPath(); ctx.arc(0, 0, 8*k, 0, 7); ctx.fill();
  ctx.restore();
}
function drawHUD(){
  // 顶栏
  const g = ctx.createLinearGradient(0, 0, 0, HUD_H);
  g.addColorStop(0, '#5a3d1e'); g.addColorStop(1, '#7a5427');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, HUD_H);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, HUD_H-4, W, 4);
  // 阳光计数
  ctx.fillStyle = '#f7ecd4'; roundRect(8, 8, 134, 76, 10); ctx.fill();
  ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 3; roundRect(8, 8, 134, 76, 10); ctx.stroke();
  const pop = 1 + game.sunPop*0.25;
  ctx.save(); ctx.translate(46, 40); ctx.scale(pop, pop);
  drawSun({ x:0, y:0, r:22, t:0, fly:true, life:9, wob:0 }); ctx.restore();
  ctx.fillStyle = '#4a3418'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(String(game.sun), 84, 42);
  // 卡片
  game.cards.forEach((card, i) => {
    const d = PDEFS[card.type];
    const x = 150 + i*76, y = 8, w = 72, h = 76;
    const afford = game.sun >= d.cost, ready = card.cd <= 0;
    ctx.fillStyle = '#f7ecd4'; roundRect(x, y, w, h, 9); ctx.fill();
    ctx.save();
    ctx.translate(x + w/2, y + 40); ctx.scale(0.52, 0.52);
    drawPlantType(card.type, 0, 6, 1, 0, {});
    ctx.restore();
    ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = afford ? '#4a3418' : '#c0392b';
    ctx.fillText('☀ ' + d.cost, x + w/2, y + h - 11);
    if(!ready){
      const k = card.cd / d.cd;
      ctx.fillStyle = 'rgba(20,20,20,.55)';
      roundRect(x, y, w, h, 9); ctx.fill();
      ctx.fillStyle = 'rgba(247,236,212,.9)';
      ctx.fillRect(x, y, w, h*k);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif';
      ctx.fillText(Math.ceil(card.cd) + 's', x + w/2, y + h/2);
    } else if(!afford){
      ctx.fillStyle = 'rgba(20,20,20,.35)'; roundRect(x, y, w, h, 9); ctx.fill();
    }
    if(game.sel === i){ ctx.strokeStyle = '#ffe23f'; ctx.lineWidth = 4; roundRect(x-2, y-2, w+4, h+4, 10); ctx.stroke(); }
  });
  // 铲子
  const sb = { x: 150 + 6*76 + 6, y: 8, w: 56, h: 76 };
  ctx.fillStyle = game.shovel ? '#ffe08a' : '#8a6a3a'; roundRect(sb.x, sb.y, sb.w, sb.h, 9); ctx.fill();
  ctx.strokeStyle = '#5a431f'; ctx.lineWidth = 3; roundRect(sb.x, sb.y, sb.w, sb.h, 9); ctx.stroke();
  ctx.save(); ctx.translate(sb.x + sb.w/2, sb.y + sb.h/2); ctx.rotate(-0.6);
  ctx.strokeStyle = '#7a4a1e'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(0, 6); ctx.stroke();
  ctx.strokeStyle = '#5a3a16'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-7, -24); ctx.lineTo(7, -24); ctx.stroke();
  ctx.fillStyle = '#b9c2c9'; ctx.strokeStyle = '#7f8a92'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-9, 6); ctx.lineTo(9, 6); ctx.lineTo(6, 24); ctx.quadraticCurveTo(0, 30, -6, 24); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
  // 暂停 / 静音 / 全屏
  button(900, 10, 40, 40, '', '#6b4a22');
  ctx.fillStyle = '#f7ecd4'; ctx.fillRect(909, 20, 7, 20); ctx.fillRect(922, 20, 7, 20);
  button(948, 10, 40, 40, '', '#6b4a22');
  ctx.fillStyle = '#f7ecd4';
  ctx.beginPath(); ctx.moveTo(956, 24); ctx.lineTo(964, 24); ctx.lineTo(972, 16); ctx.lineTo(972, 44); ctx.lineTo(964, 36); ctx.lineTo(956, 36); ctx.closePath(); ctx.fill();
  if(muted){ ctx.strokeStyle = '#e05252'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(954, 16); ctx.lineTo(970, 44); ctx.stroke(); }
  button(996, 10, 40, 40, '', '#6b4a22');
  ctx.strokeStyle = '#f7ecd4'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(1004, 26); ctx.lineTo(1004, 19); ctx.lineTo(1011, 19);
  ctx.moveTo(1021, 19); ctx.lineTo(1028, 19); ctx.lineTo(1028, 26);
  ctx.moveTo(1028, 34); ctx.lineTo(1028, 41); ctx.lineTo(1021, 41);
  ctx.moveTo(1011, 41); ctx.lineTo(1004, 41); ctx.lineTo(1004, 34);
  ctx.stroke();
  // 进度条
  const total = game.schedule.length;
  const frac = Math.min(1, game.spawnIdx / total);
  const px = W - 336, py = H - 34, pw = 300, ph = 16;
  ctx.fillStyle = 'rgba(0,0,0,.45)'; roundRect(px, py, pw, ph, 8); ctx.fill();
  ctx.fillStyle = '#7ec850'; roundRect(px+2, py+2, Math.max(6, (pw-4)*frac), ph-4, 6); ctx.fill();
  // 旗子
  ctx.fillStyle = '#e05252';
  ctx.beginPath(); ctx.moveTo(px+pw-6, py-12); ctx.lineTo(px+pw-6, py+ph); ctx.lineTo(px+pw-22, py-7); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ddd'; ctx.fillRect(px+pw-7, py-12, 2.5, ph+12);
  if(frac > 0.5){ ctx.fillStyle = '#ddd'; ctx.fillRect(px+pw/2, py-8, 2, ph+8);
    ctx.fillStyle = '#c9c9c9'; ctx.beginPath(); ctx.moveTo(px+pw/2+2, py-8); ctx.lineTo(px+pw/2+14, py-4); ctx.lineTo(px+pw/2+2, py); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = '#e8f5d0'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'right';
  ctx.fillText('关卡进度', px - 12, py + ph/2 + 1);
  ctx.textAlign = 'left';
  // 僵尸头图标
  const zx = px + 2 + Math.max(6, (pw-4)*frac) - 4, zy = py + ph/2;
  ctx.fillStyle = '#a3b58c'; ctx.beginPath(); ctx.arc(Math.min(zx, px+pw-10), zy, 9, 0, 7); ctx.fill();
  ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(Math.min(zx, px+pw-10)-3, zy-2, 1.6, 0, 7); ctx.arc(Math.min(zx, px+pw-10)+3, zy-2, 1.6, 0, 7); ctx.fill();
}
const buttons = {};
function button(x, y, w, h, label, color){
  buttons[label || (x+'_'+y)] = { x, y, w, h };
  ctx.fillStyle = color || '#5a8f3c'; roundRect(x, y, w, h, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2.5; roundRect(x, y, w, h, 10); ctx.stroke();
  if(label){
    ctx.fillStyle = '#fff'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w/2, y + h/2 + 2);
  }
}
function bigButton(label, cy, color){
  const w = 240, h = 62, x = W/2 - w/2;
  const k = 1 + Math.sin(now*3)*0.02;
  ctx.save(); ctx.translate(W/2, cy); ctx.scale(k, k); ctx.translate(-W/2, -cy);
  button(x, cy - h/2, w, h, label, color);
  ctx.restore();
  buttons[label] = { x, y: cy - h/2, w, h };
}
function drawWorld(){
  ctx.save();
  if(game.shakeT > 0){ ctx.translate((Math.random()-0.5)*10*game.shakeT*2, (Math.random()-0.5)*8*game.shakeT*2); }
  drawBackground();
  // 悬停高亮 + 种植预览
  if(state === 'playing' && hoverCell){
    const [r, c] = hoverCell;
    if(r >= 0 && c >= 0){
      if(game.sel >= 0 && !game.grid[r][c]){
        ctx.fillStyle = 'rgba(255,255,150,.25)'; ctx.fillRect(cellX(c), rowY(r), CELL_W, CELL_H);
        ctx.globalAlpha = 0.5;
        drawPlantType(game.cards[game.sel].type, cellCX(c), cellCY(r)+6, 1, now, {});
        ctx.globalAlpha = 1;
      } else if(game.shovel && game.grid[r][c]){
        ctx.fillStyle = 'rgba(255,80,80,.3)'; ctx.fillRect(cellX(c), rowY(r), CELL_W, CELL_H);
      }
    }
  }
  // 按行绘制（小推车 → 植物 → 僵尸 → 豌豆），保证遮挡关系正确
  for(let r=0;r<ROWS;r++){
    const m = game.mowers[r];
    if(!m.gone) drawMower(m);
    for(let c=0;c<COLS;c++) if(game.grid[r][c]) drawPlantFull(game.grid[r][c]);
    for(const z of game.zombies) if(z.row === r) drawZombie(z);
    for(const pea of game.peas) if(pea.row === r){
      ctx.fillStyle = pea.snow ? '#bfe9ff' : '#67c33a';
      ctx.strokeStyle = pea.snow ? '#7cc3e8' : '#3f8f1f'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(pea.x, pea.y, 8, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      ctx.beginPath(); ctx.arc(pea.x-3, pea.y-3, 2.5, 0, 7); ctx.fill();
    }
  }
  // 粒子
  for(const p of game.parts){
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  // 阳光（不受抖动影响，可点击优先）
  for(const s of game.suns) drawSun(s);
}
function drawOverlays(){
  const centerText = (txt, y, size, color, stroke) => {
    ctx.font = `bold ${size}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if(stroke){ ctx.lineWidth = size/7; ctx.strokeStyle = stroke; ctx.strokeText(txt, W/2, y); }
    ctx.fillStyle = color; ctx.fillText(txt, W/2, y);
  };
  // 开场提示
  if(game.introT > 0 && state === 'playing'){
    const a = Math.min(1, game.introT);
    ctx.globalAlpha = a;
    centerText('僵尸即将来袭，快种植物防守！', H/2 - 40, 40, '#fff', '#3a6b1f');
    ctx.globalAlpha = 1;
  }
  // 最后一波横幅
  if(game.time - game.bannerT < 3){
    const k = Math.min(1, (game.time - game.bannerT)*3);
    ctx.save(); ctx.translate(W/2, H/2 - 60); ctx.scale(0.6+0.4*k, 0.6+0.4*k);
    ctx.globalAlpha = k;
    centerText('最后一波！！', 0, 64, '#ff5340', '#5a100a');
    ctx.restore(); ctx.globalAlpha = 1;
  }
  if(state === 'menu'){
    ctx.fillStyle = 'rgba(10,20,8,.72)'; ctx.fillRect(0, 0, W, H);
    centerText('植 物 大 战 僵 尸', H*0.24, 72, '#8fe05a', '#1e3d0e');
    centerText('—— Canvas 迷你版 ——', H*0.24 + 52, 24, '#d8e8c0');
    const lines = [
      '☀ 点击收集阳光，阳光够数后点击植物卡片，再点草地种植',
      '🌻 向日葵产阳光 · 🌱 豌豆射手攻击 · 🌰 坚果墙抵挡',
      '❄ 寒冰减速 · 🌿双发火力翻倍 · 🍒 樱桃炸弹清场',
      '🧟 普通僵尸 / 路障僵尸 / 铁桶僵尸，撑住最后一波就胜利！',
      '小技巧：铲子可移除植物；电脑按数字键 1-6 选卡、P 暂停；手机直接点按即可',
    ];
    ctx.font = '20px sans-serif'; ctx.fillStyle = '#eef7e0'; ctx.textAlign = 'center';
    lines.forEach((l, i) => ctx.fillText(l, W/2, H*0.42 + i*34));
    bigButton('开 始 游 戏', H*0.78, '#5a9f2f');
    centerText('（电脑鼠标 / 手机触屏均可；手机竖屏会自动转屏，横持手机游玩）', H*0.78 + 56, 16, '#b8cfa0');
  } else if(state === 'paused'){
    ctx.fillStyle = 'rgba(10,20,8,.6)'; ctx.fillRect(0, 0, W, H);
    centerText('已 暂 停', H*0.4, 56, '#fff', '#333');
    bigButton('继 续 游 戏', H*0.6, '#5a9f2f');
    bigButton('返 回 菜 单', H*0.6 + 92, '#6b4a22');
  } else if(state === 'over'){
    ctx.fillStyle = 'rgba(30,5,5,.7)'; ctx.fillRect(0, 0, W, H);
    centerText('僵尸吃掉了你的脑子！', H*0.36, 54, '#ff6a5a', '#3a0d08');
    centerText(`坚持了 ${Math.floor(game.time)} 秒，消灭 ${kills()} 只僵尸`, H*0.36 + 52, 24, '#f0d0c8');
    bigButton('再 试 一 次', H*0.62, '#b34a2a');
    bigButton('返 回 菜 单', H*0.62 + 92, '#6b4a22');
  } else if(state === 'win'){
    // 胜利烟花
    if(Math.random() < 0.15){
      burst(Math.random()*W, Math.random()*H*0.6,
        ['#ffd93b','#ff6a5a','#8fe05a','#6cc7f0'][(Math.random()*4)|0], 24, 260, 200, 1.2, 5);
    }
    for(const p of game.parts){ p.life -= 1/60; p.vy += p.grav/60; p.x += p.vx/60; p.y += p.vy/60; }
    game.parts = game.parts.filter(p => p.life > 0);
    for(const p of game.parts){
      ctx.globalAlpha = Math.max(0, p.life/p.maxLife); ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(8,20,6,.55)'; ctx.fillRect(0, 0, W, H);
    centerText('你 胜 利 了 ！', H*0.36, 64, '#ffe23f', '#5a4a08');
    centerText(`用时 ${Math.floor(game.time)} 秒，消灭 ${kills()} 只僵尸`, H*0.36 + 58, 24, '#eaf7d8');
    if(game.best){
      centerText(game.newBest ? '🏆 新纪录！' : `最佳纪录 ${game.best} 秒`, H*0.36 + 94, 22, game.newBest ? '#ffe23f' : '#c9dfae');
    }
    bigButton('再 玩 一 局', H*0.62, '#5a9f2f');
    bigButton('返 回 菜 单', H*0.62 + 92, '#6b4a22');
  }
}
function kills(){ return game._kills || 0; }

/* ================= 输入 ================= */
let rotated = false;   // 手机竖屏时把画布旋转 90°，横持手机即可全屏游玩
function fitScreen(){
  const vw = window.innerWidth, vh = window.innerHeight;
  rotated = vh > vw;
  if(rotated){
    const s = Math.min(vh / W, vw / H), dispW = W * s, dispH = H * s;
    cvs.style.position = 'fixed';
    cvs.style.transformOrigin = '0 0';
    cvs.style.transform = 'rotate(90deg)';
    cvs.style.left = ((vw + dispH) / 2) + 'px';
    cvs.style.top = ((vh - dispW) / 2) + 'px';
    cvs.style.width = dispW + 'px';
    cvs.style.height = dispH + 'px';
  } else {
    const s = Math.min(vw / W, vh / H);
    cvs.style.position = '';
    cvs.style.transform = '';
    cvs.style.left = cvs.style.top = '';
    cvs.style.width = W * s + 'px';
    cvs.style.height = H * s + 'px';
  }
}
fitScreen();
window.addEventListener('resize', fitScreen);
window.addEventListener('orientationchange', () => setTimeout(fitScreen, 120));

function canvasPos(e){
  const rect = cvs.getBoundingClientRect();
  if(rotated){
    // 画布顺时针旋转 90°：游戏 x 轴指向屏幕下方，y 轴指向屏幕左方
    const s = rect.height / W;
    return { x: (e.clientY - rect.top) / s, y: (rect.right - e.clientX) / s };
  }
  const s = rect.width / W;
  return { x: (e.clientX - rect.left) / s, y: (e.clientY - rect.top) / s };
}
function toggleFullscreen(){
  const el = document.documentElement;
  if(!document.fullscreenElement && !document.webkitFullscreenElement){
    (el.requestFullscreen || el.webkitRequestFullscreen || function(){}).call(el);
  } else {
    (document.exitFullscreen || document.webkitExitFullscreen || function(){}).call(document);
  }
}
function hitButton(list, x, y){
  for(const k in list){ const b = list[k];
    if(x >= b.x && x <= b.x+b.w && y >= b.y && y <= b.y+b.h) return k; }
  return null;
}
cvs.addEventListener('pointermove', e => {
  const p = canvasPos(e); mouse = { ...p, down: mouse.down };
  hoverCell = null;
  if(p.x >= LAWN_X && p.x < LAWN_X + LAWN_W && p.y >= LAWN_Y && p.y < LAWN_Y + LAWN_H){
    hoverCell = [Math.floor((p.y - LAWN_Y)/CELL_H), Math.floor((p.x - LAWN_X)/CELL_W)];
  }
  cvs.style.cursor = (game && (game.sel >= 0 || game.shovel) && hoverCell) ? 'pointer'
    : (hitButton(buttons, p.x, p.y) ? 'pointer' : 'default');
});
// 触摸抬起后清除悬停格子，避免残留种植预览高亮
cvs.addEventListener('pointerup', e => { if(e.pointerType !== 'mouse') hoverCell = null; });
// 阻止移动端双击缩放 / 长按菜单 / 滚动
cvs.addEventListener('touchstart', e => e.preventDefault(), { passive:false });
cvs.addEventListener('contextmenu', e => {
  e.preventDefault();
  if(game){ game.sel = -1; game.shovel = false; }
});
cvs.addEventListener('pointerdown', e => {
  if(e.pointerType === 'mouse' && e.button !== 0) return;
  ac(); // 解锁音频（移动端必须在用户手势内）
  const p = canvasPos(e);
  const btn = hitButton(buttons, p.x, p.y);

  if(state === 'menu'){
    if(btn === '开 始 游 戏'){ game = newGame(); state = 'playing'; SFX.card(); }
    return;
  }
  if(state === 'paused'){
    if(btn === '继 续 游 戏'){ state = 'playing'; }
    if(btn === '返 回 菜 单'){ game = newGame(); state = 'menu'; SFX.card(); }
    return;
  }
  if(state === 'over' || state === 'win'){
    if(btn === '再 试 一 次' || btn === '再 玩 一 局'){ game = newGame(); state = 'playing'; SFX.card(); }
    if(btn === '返 回 菜 单'){ game = newGame(); state = 'menu'; SFX.card(); }
    return;
  }
  if(state !== 'playing') return;

  // 优先：点击阳光收集
  for(let i = game.suns.length - 1; i >= 0; i--){
    const s = game.suns[i];
    if(!s.fly && Math.hypot(p.x - s.x, p.y - s.y) < s.r + 12){ s.fly = true; SFX.sun(); return; }
  }
  // 暂停 / 静音 / 全屏按钮（由 button() 注册的矩形命中）
  if(btn === '900_10'){ state = 'paused'; return; }
  if(btn === '948_10'){ muted = !muted; saveMuted(muted); return; }
  if(btn === '996_10'){ toggleFullscreen(); return; }
  // 卡片
  if(p.y >= 8 && p.y <= 84){
    const idx = Math.floor((p.x - 150) / 76);
    if(idx >= 0 && idx < game.cards.length){
      const card = game.cards[idx], d = PDEFS[card.type];
      if(game.sel === idx){ game.sel = -1; return; }
      if(card.cd > 0 || game.sun < d.cost){ SFX.deny(); return; }
      game.sel = idx; game.shovel = false; SFX.card(); return;
    }
    // 铲子
    if(p.x >= 150 + 6*76 + 6 && p.x <= 150 + 6*76 + 62){
      game.shovel = !game.shovel; game.sel = -1; SFX.shovel(); return;
    }
  }
  // 草地：种植 / 铲除（直接由点击坐标算格子，触摸设备没有 hover）
  let cell = null;
  if(p.x >= LAWN_X && p.x < LAWN_X + LAWN_W && p.y >= LAWN_Y && p.y < LAWN_Y + LAWN_H)
    cell = [Math.floor((p.y - LAWN_Y)/CELL_H), Math.floor((p.x - LAWN_X)/CELL_W)];
  if(cell){
    const [r, c] = cell;
    if(game.shovel){
      const pl = game.grid[r][c];
      if(pl){ removePlant(pl); burst(pl.x, pl.y, '#9a7a4a', 10, 90, 250, .5, 4); SFX.shovel(); }
      game.shovel = false; return;
    }
    if(game.sel >= 0){
      const card = game.cards[game.sel], d = PDEFS[card.type];
      if(game.grid[r][c]){ SFX.deny(); return; }
      if(game.sun < d.cost){ SFX.deny(); return; }
      game.sun -= d.cost; card.cd = d.cd;
      plantAt(c, r, card.type);
      game.sel = -1;
    }
  }
});
window.addEventListener('keydown', e => {
  if(!game) return;
  if(e.key === 'Escape'){ game.sel = -1; game.shovel = false; }
  if(e.key === 'p' || e.key === 'P'){
    if(state === 'playing') state = 'paused';
    else if(state === 'paused') state = 'playing';
  }
  const n = parseInt(e.key, 10);
  if(state === 'playing' && n >= 1 && n <= game.cards.length){
    const card = game.cards[n-1], d = PDEFS[card.type];
    if(game.sel === n-1){ game.sel = -1; }
    else if(card.cd <= 0 && game.sun >= d.cost){ game.sel = n-1; game.shovel = false; SFX.card(); }
    else SFX.deny();
  }
});
// 切后台自动暂停（手机切应用 / 锁屏时不会被动挨打）
document.addEventListener('visibilitychange', () => {
  if(document.hidden && state === 'playing') state = 'paused';
});

/* ================= 主循环 ================= */
let last = performance.now();
function frame(ts){
  now = ts/1000;
  const dt = Math.min(0.05, (ts - last)/1000);
  last = ts;
  // 帧开头清空按钮注册表，绘制过程中重新注册，保证帧间点击可命中
  for(const k in buttons) delete buttons[k];
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if(state === 'menu'){
    // 菜单背景：画一块草地
    game = game || newGame();
    drawBackground();
  } else {
    if(state === 'playing') update(dt);
    drawWorld();
    drawHUD();
  }
  if(game) drawOverlays();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
