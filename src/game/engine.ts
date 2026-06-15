import { GameState, FighterState, nextProjId } from './GameState';
import { GAME_WIDTH, GROUND_Y, FIGHTER_WIDTH, FIGHTER_HEIGHT, Particle } from './constants';

// ─── Movement ──────────────────────────────────────────────
export function handleMovement(fighter: FighterState, keys: Set<string>, isPlayer1: boolean) {
  if (fighter.isStunned) return;

  const speed = fighter.character.moveSpeed;
  const leftKey = isPlayer1 ? 'KeyA' : 'ArrowLeft';
  const rightKey = isPlayer1 ? 'KeyD' : 'ArrowRight';
  const jumpKey = isPlayer1 ? 'KeyW' : 'ArrowUp';

  const leftHeld = keys.has(leftKey);
  const rightHeld = keys.has(rightKey);
  let dx = 0;
  let facingRight = fighter.facingRight;
  if (leftHeld && !rightHeld) {
    dx = -speed;
    facingRight = false;
  } else if (rightHeld && !leftHeld) {
    dx = speed;
    facingRight = true;
  }

  let newX = fighter.x + dx;
  newX = Math.max(FIGHTER_WIDTH / 2, Math.min(GAME_WIDTH - FIGHTER_WIDTH / 2, newX));

  let newY = fighter.y;
  let velocityY = fighter.velocityY;
  let isJumping = fighter.isJumping;

  if (keys.has(jumpKey) && !isJumping) {
    velocityY = -15;
    isJumping = true;
  }

  velocityY += 0.8;
  newY += velocityY;

  if (newY >= GROUND_Y) {
    newY = GROUND_Y;
    velocityY = 0;
    isJumping = false;
  }

  const isBlocking = false;

  return { x: newX, y: newY, velocityY, isJumping, isBlocking, facingRight };
}

export function checkCollision(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean {
  return ax - aw / 2 < bx + bw / 2 && ax + aw / 2 > bx - bw / 2 &&
         ay - ah / 2 < by + bh / 2 && ay + ah / 2 > by - bh / 2;
}

// ─── Particle spawners ────────────────────────────────────
function spawnHitSparks(x: number, y: number, color: string, count = 12): Particle[] {
  const ps: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    ps.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2, life: 15 + Math.random() * 20, maxLife: 35, size: 3 + Math.random() * 4, color, type: 'spark', gravity: true });
  }
  return ps;
}

function spawnRing(x: number, y: number, color: string, radius = 40): Particle[] {
  const ps: Particle[] = [];
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    ps.push({ x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius * 0.3, vx: Math.cos(angle) * 2, vy: Math.sin(angle) * 1, life: 20, maxLife: 20, size: 4, color, type: 'ring' });
  }
  return ps;
}

function spawnSkillBurst(x: number, y: number, color: string, count = 24): Particle[] {
  const ps: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 8;
    ps.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 20 + Math.random() * 30, maxLife: 50, size: 4 + Math.random() * 6, color: i % 3 === 0 ? '#ffffff' : color, type: 'star' });
  }
  return ps;
}

function spawnHealParticles(x: number, y: number): Particle[] {
  const ps: Particle[] = [];
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    ps.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 3, life: 25 + Math.random() * 15, maxLife: 40, size: 4 + Math.random() * 4, color: '#2ecc71', type: 'circle', gravity: false });
  }
  return ps;
}

function spawnShieldParticles(x: number, y: number, color: string): Particle[] {
  const ps: Particle[] = [];
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    ps.push({ x: x + Math.cos(angle) * 50, y: y + Math.sin(angle) * 50, vx: Math.cos(angle) * 0.5, vy: Math.sin(angle) * 0.5, life: 30, maxLife: 30, size: 3, color, type: 'ring' });
  }
  return ps;
}

function spawnUltimateBurst(x: number, y: number, c1: string, c2: string): Particle[] {
  const ps: Particle[] = [];
  for (let i = 0; i < 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    const speed = 5 + Math.random() * 5;
    ps.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 30 + Math.random() * 20, maxLife: 50, size: 6 + Math.random() * 8, color: i % 2 === 0 ? c1 : c2, type: 'star' });
  }
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    ps.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 10 + Math.random() * 15, maxLife: 25, size: 2 + Math.random() * 3, color: '#ffffff', type: 'circle' });
  }
  return ps;
}

// ─── Combo helpers ────────────────────────────────────────
function incrementCombo(fighter: FighterState) {
  fighter.combo += 1;
  fighter.comboTimer = 120;
  return fighter.combo;
}

function getComboMultiplier(combo: number): number {
  if (combo >= 15) return 2.0;
  if (combo >= 10) return 1.6;
  if (combo >= 7) return 1.4;
  if (combo >= 5) return 1.25;
  if (combo >= 3) return 1.1;
  return 1;
}

// ─── Projectile helpers ───────────────────────────────────
function getProjColor(name: string, charColor: string): string {
  if (name.includes('代码') || name.includes('键盘')) return '#00ff88';
  if (name.includes('绩效') || name.includes('裁员')) return '#ff69b4';
  if (name.includes('报销') || name.includes('审计')) return '#4169e1';
  if (name.includes('名片') || name.includes('签单')) return '#ff4500';
  if (name.includes('会议室') || name.includes('团建')) return '#9370db';
  if (name.includes('系统')) return '#ff0000';
  return charColor;
}

// ─── Attack ───────────────────────────────────────────────
export function performAttack(state: GameState, attacker: FighterState, defender: FighterState, isPlayer1: boolean): boolean {
  const skill = attacker.character.skills.attack;
  const range = skill.type === 'melee' ? 100 : 300;
  const direction = attacker.facingRight ? 1 : -1;
  const attackX = attacker.x + direction * 50;

  if (checkCollision(attackX, attacker.y, range, 80, defender.x, defender.y, FIGHTER_WIDTH, FIGHTER_HEIGHT)) {
    const combo = incrementCombo(attacker);
    const mult = getComboMultiplier(combo);
    let damage = skill.damage * attacker.damageMultiplier * mult;

    if (defender.isShielded) damage *= 0.3;
    if (defender.isBlocking) damage *= 0.3;

    if (skill.effect === 'crit' && Math.random() < 0.4) {
      damage *= 2;
      state.addDamageText(defender.x, defender.y - 70, Math.round(damage), '#ffd700', { size: 32, isCrit: true });
      state.addParticles(spawnRing(defender.x, defender.y - 40, '#ffd700', 50));
      state.addParticles(spawnHitSparks(defender.x, defender.y - 40, '#ffd700', 20));
      state.screenShake = { intensity: 8, duration: 8, elapsed: 0 };
    } else {
      state.addDamageText(defender.x, defender.y - 60, Math.round(damage), '#ff4757');
      state.addParticles(spawnHitSparks(defender.x, defender.y - 40, attacker.character.color));
    }

    defender.hp = Math.max(0, defender.hp - damage);
    defender.hitFlash = 10;

    if (skill.effect === 'knockback') {
      defender.x = Math.max(FIGHTER_WIDTH / 2, Math.min(GAME_WIDTH - FIGHTER_WIDTH / 2, defender.x + direction * 50));
    }
    return true;
  } else {
    state.addParticles([{
      x: attackX, y: attacker.y - 40, vx: direction * 2, vy: -1, life: 10, maxLife: 10, size: 3, color: '#666688', type: 'spark',
    }]);
  }
  return false;
}

// ─── Skill ────────────────────────────────────────────────
export function performSkill(
  state: GameState, attacker: FighterState, defender: FighterState,
  skillIndex: number, isPlayer1: boolean,
) {
  const keys = ['skill1', 'skill2', 'ultimate'] as const;
  const sk = keys[skillIndex];
  const skill = attacker.character.skills[sk];
  if (!skill || attacker.mp < skill.mpCost) return;
  if ((attacker.cooldowns[sk] || 0) > 0) return;

  const direction = attacker.facingRight ? 1 : -1;
  attacker.mp -= skill.mpCost;
  attacker.currentSkill = skillIndex;
  attacker.skillFrame = 30;
  attacker.cooldowns = { ...attacker.cooldowns, [sk]: skill.cooldown };

  const popupX = attacker.x;
  state.addSkillPopup(skill.name, popupX, attacker.y - 90, attacker.character.color);

  // Taunt from defender's list
  const taunts = defender.character.taunts;
  const taunt = taunts[Math.floor(Math.random() * taunts.length)];
  state.addSkillPopup('「' + taunt + '」', popupX, attacker.y - 130, '#ff6b6b');

  state.screenShake = { intensity: skillIndex === 2 ? 12 : 4, duration: skillIndex === 2 ? 15 : 6, elapsed: 0 };

  const pColor = getProjColor(skill.name, attacker.character.color);

  if (skill.type === 'ranged') {
    state.addParticles(spawnSkillBurst(attacker.x + direction * 40, attacker.y - 30, pColor, 12));
    state.addProjectile({
      id: nextProjId(), owner: isPlayer1 ? 1 : 2,
      x: attacker.x + direction * 40, y: attacker.y - 30,
      vx: direction * (skillIndex === 2 ? 10 : 7), vy: 0,
      damage: skill.damage, type: skill.name,
      width: 40, height: 30, life: skillIndex === 2 ? 150 : 90, trailColor: pColor,
    });
  } else if (skill.type === 'melee') {
    const ax = attacker.x + direction * 80;
    state.addParticles(spawnSkillBurst(attacker.x + direction * 60, attacker.y - 40, pColor, 15));

    if (checkCollision(ax, attacker.y, 120, 100, defender.x, defender.y, FIGHTER_WIDTH, FIGHTER_HEIGHT)) {
      const combo = incrementCombo(attacker);
      const mult = getComboMultiplier(combo);
      let damage = skill.damage * attacker.damageMultiplier * mult;
      if (defender.isShielded) damage *= 0.3;
      if (defender.isBlocking) damage *= 0.3;

      if (skill.effect === 'crit' && Math.random() < 0.5) {
        damage *= 2;
        state.addDamageText(defender.x, defender.y - 70, Math.round(damage), '#ffd700', { size: 36, isCrit: true });
        state.addParticles(spawnRing(defender.x, defender.y - 40, '#ffd700', 60));
        state.screenShake = { intensity: 10, duration: 10, elapsed: 0 };
      } else {
        state.addDamageText(defender.x, defender.y - 60, Math.round(damage), skill.effect === 'crit' ? '#ffd700' : '#ff4757', { size: 28 });
      }

      state.addParticles(spawnHitSparks(defender.x, defender.y - 40, pColor, 20));
      if (skillIndex === 2) {
        state.addParticles(spawnUltimateBurst(defender.x, defender.y - 40, pColor, '#ffffff'));
        state.screenShake = { intensity: 15, duration: 20, elapsed: 0 };
      }

      defender.hp = Math.max(0, defender.hp - damage);
      defender.hitFlash = 20;

      if (skill.effect === 'knockback' || skillIndex === 2) {
        defender.x = Math.max(FIGHTER_WIDTH / 2, Math.min(GAME_WIDTH - FIGHTER_WIDTH / 2, defender.x + direction * (skillIndex === 2 ? 150 : 100)));
      }
      if (skill.effect === 'stun') {
        defender.isStunned = true;
        setTimeout(() => { defender.isStunned = false; }, 1500);
      }
    }
  } else if (skill.type === 'buff') {
    if (skill.effect === 'shield') {
      state.addParticles(spawnShieldParticles(attacker.x, attacker.y - 40, attacker.character.color));
      attacker.isShielded = true;
      setTimeout(() => { attacker.isShielded = false; }, 3000);
    }
  } else if (skill.type === 'heal') {
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + 30);
    state.addDamageText(attacker.x, attacker.y - 60, 30, '#2ecc71');
    state.addParticles(spawnHealParticles(attacker.x, attacker.y - 40));
  } else if (skill.type === 'debuff') {
    state.addParticles(spawnRing(attacker.x, attacker.y - 40, '#9b59b6', 40));
    defender.damageMultiplier = 0.6;
    setTimeout(() => { defender.damageMultiplier = 1; }, 4000);
  }
}

// ─── Per-frame updates (mutates gameState directly) ──────
export function tickProjectiles(state: GameState) {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const proj = state.projectiles[i];
    proj.x += proj.vx;
    proj.y += proj.vy;
    proj.life--;

    if (proj.life <= 0) {
      state.projectiles.splice(i, 1);
      continue;
    }

    // trail
    state.addParticles([{
      x: proj.x, y: proj.y, vx: (Math.random() - 0.5) * 1, vy: (Math.random() - 0.5) * 1,
      life: 15, maxLife: 15, size: 3 + Math.random() * 3, color: proj.trailColor, type: 'circle',
    }]);

    // hit check
    const target = proj.owner === 1 ? state.p2 : state.p1;
    const attacker = proj.owner === 1 ? state.p1 : state.p2;
    // Jump dodge: projectiles pass over jumping targets
    if (target.isJumping) continue;
    if (checkCollision(proj.x, proj.y, proj.width, proj.height, target.x, target.y, FIGHTER_WIDTH, FIGHTER_HEIGHT)) {
      attacker.combo += 1;
      attacker.comboTimer = 120;
      const mult = getComboMultiplier(attacker.combo);
      let damage = proj.damage * attacker.damageMultiplier * mult;
      if (target.isShielded) damage *= 0.3;
      if (target.isBlocking) damage *= 0.3;
      target.hp = Math.max(0, target.hp - damage);
      target.hitFlash = 10;
      state.addDamageText(target.x, target.y - 60, Math.round(damage), '#ff4757');
      state.addParticles(spawnHitSparks(proj.x, proj.y, proj.trailColor));
      state.addParticles(spawnRing(proj.x, proj.y, proj.trailColor, 30));
      state.screenShake = state.screenShake || { intensity: 5, duration: 5, elapsed: 0 };
      state.projectiles.splice(i, 1);
    }
  }
}

export function tickParticles(state: GameState) {
  const arr = state.particles;
  for (let i = arr.length - 1; i >= 0; i--) {
    const p = arr[i];
    const newVy = p.vy + (p.gravity ? 0.3 : 0);
    p.x += p.vx;
    p.y += newVy;
    p.vy = newVy;
    p.life--;
    p.size *= 0.97;
    if (p.life <= 0 || p.size < 0.5) {
      arr.splice(i, 1);
    }
  }
}

export function tickDamageTexts(state: GameState) {
  for (let i = state.damageTexts.length - 1; i >= 0; i--) {
    state.damageTexts[i].y -= 1.5;
    if (i > 30) { state.damageTexts.splice(i, 1); }
  }
  if (state.damageTexts.length > 40) {
    state.damageTexts = state.damageTexts.slice(-40);
  }
}

export function tickSkillPopups(state: GameState) {
  for (let i = state.skillPopups.length - 1; i >= 0; i--) {
    const sp = state.skillPopups[i];
    sp.y -= 1.5;
    sp.life--;
    if (sp.life <= 0) state.skillPopups.splice(i, 1);
  }
}

export function tickScreenShake(state: GameState) {
  if (state.screenShake) {
    state.screenShake.elapsed++;
    if (state.screenShake.elapsed >= state.screenShake.duration) {
      state.screenShake = null;
    }
  }
}

export function tickCooldowns(state: GameState) {
  [state.p1, state.p2].forEach((f) => {
    for (const k of Object.keys(f.cooldowns)) {
      if ((f.cooldowns[k] || 0) > 0) {
        f.cooldowns[k] = f.cooldowns[k] - 1;
      }
    }
    // combo timer
    if (f.comboTimer > 0) {
      f.comboTimer--;
      if (f.comboTimer <= 0) { f.combo = 0; }
    }
  });
}

export function tickRegenMp(state: GameState) {
  [state.p1, state.p2].forEach((f) => {
    if (f.mp < f.maxMp) f.mp = Math.min(f.maxMp, f.mp + 0.5);
  });
}

export function tickAttackFrames(state: GameState) {
  [state.p1, state.p2].forEach((f) => {
    if (f.isAttacking) {
      f.attackFrame--;
      if (f.attackFrame <= 0) { f.isAttacking = false; }
    }
    if (f.skillFrame > 0) {
      f.skillFrame--;
      if (f.skillFrame <= 0) { f.currentSkill = null; }
    }
    if (f.hitFlash > 0) f.hitFlash--;
  });
}

export function tickWinnerCheck(state: GameState) {
  if (state.p1.hp <= 0) {
    state.winner = 2;
    state.winnerTimer++;
  } else if (state.p2.hp <= 0) {
    state.winner = 1;
    state.winnerTimer++;
  }
}

// ─── Main tick ────────────────────────────────────────────
export function tick(state: GameState, keys: Set<string>, justPressed: Set<string>) {
  // Movement
  const m1 = handleMovement(state.p1, keys, true);
  if (m1) { Object.assign(state.p1, m1); }
  const m2 = handleMovement(state.p2, keys, false);
  if (m2) { Object.assign(state.p2, m2); }

  // Attacks
  if (keys.has('KeyJ') && !state.p1.isAttacking) {
    performAttack(state, state.p1, state.p2, true);
    state.p1.isAttacking = true; state.p1.attackFrame = 10;
  }
  if (keys.has('Digit1') && !state.p2.isAttacking) {
    performAttack(state, state.p2, state.p1, false);
    state.p2.isAttacking = true; state.p2.attackFrame = 10;
  }

  // Skills (just-pressed only)
  const s1 = justPressed.has('KeyK'); const s2 = justPressed.has('KeyL'); const s3 = justPressed.has('KeyI');
  const t1 = justPressed.has('Digit2'); const t2 = justPressed.has('Digit3'); const t3 = justPressed.has('Digit0');
  if (s1) performSkill(state, state.p1, state.p2, 0, true);
  if (s2) performSkill(state, state.p1, state.p2, 1, true);
  if (s3) performSkill(state, state.p1, state.p2, 2, true);
  if (t1) performSkill(state, state.p2, state.p1, 0, false);
  if (t2) performSkill(state, state.p2, state.p1, 1, false);
  if (t3) performSkill(state, state.p2, state.p1, 2, false);

  // Per-frame ticks
  tickProjectiles(state);
  tickParticles(state);
  tickDamageTexts(state);
  tickSkillPopups(state);
  tickScreenShake(state);
  tickCooldowns(state);
  tickRegenMp(state);
  tickAttackFrames(state);
  tickWinnerCheck(state);
  state.frameCount++;
}
