/* Pure game state and physics. Runs in a browser or Node without a build. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NightEngine = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const WORLD = { width: 2160, ground: 280, height: 336 };
  const HOUSE_X = 1940;
  const BIRTHDAY_DELAY = 1.8;
  const ROOM = { width: 480, ground: 280, height: 336, spawn: 100, door: 52, candle: 306, computer: 418 };
  const PLATFORMS = [
    { x: 750, y: 239, w: 100, h: 12 },
    { x: 890, y: 204, w: 100, h: 12 },
    { x: 1580, y: 239, w: 112, h: 12 }
  ];
  const OBJECTS = [
    { id: 'sign', x: 200, y: 280, reach: 40 },
    { id: 'bench', x: 460, y: 280, reach: 49 },
    { id: 'box', x: 1220, y: 280, reach: 42 },
    { id: 'house', x: HOUSE_X, y: 280, reach: 44 },
    { id: 'hkTerminal', x: 1015, y: 280, reach: 40 },
    { id: 'roundOne', x: 1510, y: 280, reach: 38 },
    { id: 'filmBoard', x: HOUSE_X + 164, y: WORLD.ground, reach: 40 }
  ];
  const ROOM_OBJECTS = [
    { id: 'exit', x: ROOM.door, y: 280, reach: 35 },
    { id: 'candle', x: ROOM.candle, y: 280, reach: 55 },
    { id: 'archive', x: ROOM.computer, y: 280, reach: 32 }
  ];
  const STAR_POSITIONS = [[235, 255], [610, 255], [800, 218], [940, 183], [1632, 218]];
  const clamp = (n, min, max) => Math.max(min, Math.min(n, max));
  function createGame() {
    return {
      mode: 'title', scene: 'night', time: 0, camera: 0, cooldown: 0, jumpBuffer: 0, coyote: 0,
      player: { x: 145, y: 256, w: 14, h: 24, vx: 0, vy: 0, grounded: true, facing: 1, sitting: false },
      stars: STAR_POSITIONS.map(([x, y], id) => ({ id, x, y, collected: false })),
      boxOpen: false, target: null, events: [],
      house: { candleLit: false, light: 0, outsideX: HOUSE_X, outsideFacing: 1 },
      reveal: { source: null, status: 'idle', elapsed: 0, wait: 0 }
    };
  }
  const countStars = state => state.stars.filter(star => star.collected).length;
  const emit = (state, type, data = {}) => state.events.push({ type, ...data });
  const worldFor = state => state.scene === 'house' ? ROOM : WORLD;
  const screenOffset = (state, width) => state.scene === 'house' ? Math.max(0, Math.floor((width - ROOM.width) / 2)) : 0;
  function placePlayer(state, x) {
    Object.assign(state.player, { x, y: 256, vx: 0, vy: 0, grounded: true, sitting: false });
    state.target = null; state.jumpBuffer = 0; state.coyote = 0; state.cooldown = 0.4; state.camera = 0;
  }
  function enterHouse(state) {
    state.house.outsideX = state.player.x; state.house.outsideFacing = state.player.facing;
    state.scene = 'house'; placePlayer(state, ROOM.spawn);
    emit(state, 'enterHouse', { lit: state.house.candleLit });
  }
  function leaveHouse(state) {
    if (state.scene !== 'house') return;
    state.scene = 'night'; state.mode = 'playing';
    placePlayer(state, clamp(state.house.outsideX, HOUSE_X - 44, HOUSE_X + 44)); state.player.facing = state.house.outsideFacing;
    state.reveal = { source: null, status: 'idle', elapsed: 0, wait: 0 };
    emit(state, 'leaveHouse');
  }
  // Audio adapter starts this clock only once playback has started, or when muted/unavailable.
  function beginBirthday(state, source) {
    if (state.reveal.source !== source || !['waiting', 'audioBlocked'].includes(state.reveal.status)) return false;
    state.reveal.status = 'counting'; state.reveal.elapsed = 0; return true;
  }
  function requestBirthday(state, source) {
    if (['waiting', 'counting', 'audioBlocked'].includes(state.reveal.status)) return;
    state.reveal = { source, status: 'waiting', elapsed: 0, wait: 0 };
    emit(state, 'ignite', { source });
  }
  function advanceReveal(state, dt) {
    if (state.reveal.status === 'waiting') {
      state.reveal.wait += dt;
      // The adapter falls back to the note if mobile playback never starts.
      if (state.reveal.wait >= 2) { state.reveal.status = 'audioBlocked'; emit(state, 'audioTimeout'); }
    } else if (state.reveal.status === 'counting') {
      state.reveal.elapsed += dt;
      if (state.reveal.elapsed >= BIRTHDAY_DELAY) {
        state.reveal.status = 'shown'; state.mode = 'birthday'; state.player.vx = 0;
        emit(state, 'birthday', { source: state.reveal.source });
      }
    }
  }
  function nearest(state) {
    const p = state.player;
    if (!p.grounded || Math.abs(p.y + p.h - WORLD.ground) > 4) return null;
    return (state.scene === 'house' ? ROOM_OBJECTS : OBJECTS).filter(o => Math.abs(p.x + p.w / 2 - o.x) < o.reach)
      .sort((a, b) => Math.abs(p.x - a.x) - Math.abs(p.x - b.x))[0] || null;
  }
  function start(state) {
    state.mode = 'playing';
    state.player.sitting = false;
    state.cooldown = 0.25;
    emit(state, 'start');
  }
  function pause(state) {
    if (state.mode === 'playing') { state.mode = 'paused'; state.player.vx = 0; }
  }
  function resume(state) {
    if (state.mode === 'paused' || state.mode === 'birthday') {
      state.mode = 'playing'; state.cooldown = 0.3; state.jumpBuffer = 0;
    }
  }
  function backToNight(state) {
    state.scene = 'night'; state.mode = 'title'; state.player.x = 145; state.player.y = 256;
    state.player.vx = 0; state.player.vy = 0; state.player.sitting = false;
    state.player.grounded = true; state.camera = 0; state.target = null;
    state.jumpBuffer = 0; state.coyote = 0; state.cooldown = 0;
    state.reveal = { source: null, status: 'idle', elapsed: 0, wait: 0 };
  }
  function interact(state) {
    if (state.mode !== 'playing' || state.cooldown > 0) return false;
    state.cooldown = 0.35;
    const p = state.player;
    if (p.sitting) { p.sitting = false; emit(state, 'stand'); emit(state, 'benchMemory'); return true; }
    const object = nearest(state);
    if (!object) return false;
    if (object.id === 'sign') emit(state, 'sign');
    if (object.id === 'hkTerminal' || object.id === 'roundOne' || object.id === 'filmBoard') emit(state, object.id);
    if (object.id === 'bench') {
      p.sitting = true; p.vx = 0; p.x = object.x - p.w / 2;
      emit(state, 'bench');
    }
    if (object.id === 'box') {
      if (state.boxOpen) emit(state, 'boxAgain');
      else if (countStars(state) >= 2) {
        state.boxOpen = true; emit(state, 'boxOpen', { x: object.x, y: 250 });
      } else emit(state, 'boxLocked', { needed: 2 - countStars(state) });
    }
    if (object.id === 'house') enterHouse(state);
    if (object.id === 'exit') leaveHouse(state);
    if (object.id === 'archive') emit(state, 'archive');
    if (object.id === 'candle') {
      if (!state.house.candleLit) {
        state.house.candleLit = true; state.house.light = 0; requestBirthday(state, 'candle');
      } else if (!['waiting', 'counting', 'audioBlocked'].includes(state.reveal.status)) {
        p.vx = 0; state.mode = 'birthday'; emit(state, 'birthday', { source: 'candle' });
      }
    }
    return true;
  }
  function step(state, input, dt) {
    // Caller uses a fixed 1/60 step. Clamp defensively against tab-switch spikes.
    dt = clamp(dt, 0, 1 / 30);
    // Candle reveal continues while the birthday note is being read, never while paused.
    if (state.mode === 'birthday' && state.scene === 'house') {
      state.time += dt; state.house.light = Math.min(1, state.house.light + dt / 1.6); return;
    }
    if (state.mode !== 'playing') return;
    state.time += dt; state.cooldown = Math.max(0, state.cooldown - dt);
    if (state.house.candleLit && state.scene === 'house') state.house.light = Math.min(1, state.house.light + dt / 1.6);
    advanceReveal(state, dt);
    if (state.mode !== 'playing') return;
    const p = state.player;
    const axis = Number(!!input.right) - Number(!!input.left);
    if (input.jumpPressed) state.jumpBuffer = 0.13;
    else state.jumpBuffer = Math.max(0, state.jumpBuffer - dt);
    if (p.sitting && (axis || input.jumpPressed)) { p.sitting = false; emit(state, 'stand'); }
    state.coyote = p.grounded ? 0.09 : Math.max(0, state.coyote - dt);
    if (!p.sitting && state.jumpBuffer > 0 && state.coyote > 0) {
      p.vy = -305; p.grounded = false; state.coyote = 0; state.jumpBuffer = 0;
      emit(state, 'jump');
    }
    p.vx = p.sitting ? 0 : axis * 105;
    if (axis) p.facing = axis;
    const world = worldFor(state);
    p.x = clamp(p.x + p.vx * dt, 4, world.width - p.w - 4);
    const oldBottom = p.y + p.h;
    p.vy = Math.min(p.vy + 850 * dt, 480);
    p.y += p.vy * dt; p.grounded = false;
    for (const platform of [...(state.scene === 'house' ? [] : PLATFORMS), { x: 0, y: world.ground, w: world.width }]) {
      if (p.vy >= 0 && oldBottom <= platform.y + 0.5 && p.y + p.h >= platform.y &&
          p.x + p.w > platform.x && p.x < platform.x + platform.w) {
        p.y = platform.y - p.h; p.vy = 0; p.grounded = true;
      }
    }
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || p.y > WORLD.height + 50) {
      p.x = state.scene === 'house' ? ROOM.spawn : 145; p.y = 256; p.vx = 0; p.vy = 0; p.grounded = true; p.sitting = false;
    }
    for (const star of state.scene === 'house' ? [] : state.stars) {
      if (!star.collected && Math.abs(p.x + p.w / 2 - star.x) < 18 &&
          Math.abs(p.y + p.h / 2 - star.y) < 25) {
        star.collected = true; emit(state, 'star', { x: star.x, y: star.y, count: countStars(state) });
      }
    }
    state.target = nearest(state);
    if (input.interactPressed) interact(state);
  }
  function updateCamera(state, viewportWidth, dt, snap = false) {
    const width = worldFor(state).width;
    const target = clamp(state.player.x + state.player.w / 2 - viewportWidth * 0.42, 0, Math.max(0, width - viewportWidth));
    state.camera = snap ? target : state.camera + (target - state.camera) * (1 - Math.exp(-7 * dt));
    state.camera = clamp(state.camera, 0, Math.max(0, width - viewportWidth));
  }
  function drainEvents(state) { return state.events.splice(0); }
  return { WORLD, ROOM, HOUSE_X, BIRTHDAY_DELAY, PLATFORMS, OBJECTS, ROOM_OBJECTS, createGame, countStars, nearest, start, pause, resume, backToNight, enterHouse, leaveHouse, beginBirthday, worldFor, screenOffset, interact, step, updateCamera, drainEvents, clamp };
});
