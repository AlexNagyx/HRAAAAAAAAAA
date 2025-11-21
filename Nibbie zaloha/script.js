const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');
const feedBtn = document.getElementById('feedBtn');
const playBtn = document.getElementById('playBtn');
const itemSelect = document.getElementById('itemSelect');
const useBtn = document.getElementById('useBtn');
const hungerMeter = document.getElementById('hunger');
const hungerPixel = document.getElementById('hungerPixel');
const energyMeter = document.getElementById('energy');
const energyPixel = document.getElementById('energyPixel');
const cyberMeter = document.getElementById('cyberpsychosis');
const cyberPixel = document.getElementById('cyberPixel');
const boredomMeter = document.getElementById('boredom');
const boredomPixel = document.getElementById('boredomPixel');
const moodMeter = document.getElementById('mood');
const moodPixel = document.getElementById('moodPixel');

const SPRITE = new Image();
const NIBBIE = new Image();
const FRIES = new Image();
const giveUpBtn = document.getElementById('giveUpBtn');
const danceBtn = document.getElementById('danceBtn');
const turnOffBtn = document.getElementById('turnOffBtn');
const gangstaBtn = document.getElementById('gangstaBtn');

// sprite sheet: frames across
SPRITE.src = 'Nibbie (player)-1.png (1).png';
// place your pixel-art PNG for the character at this path
NIBBIE.src = 'Nibbie (player)-1.png (1).png';

// simple asset loader to start the loop after NIBBIE is ready (FRIES is optional)
let _assetsToLoad = 1;  // only wait for NIBBIE
function _onAssetLoad(){
  _assetsToLoad -= 1;
  if(_assetsToLoad <= 0) requestAnimationFrame(loop);
}
NIBBIE.onload = _onAssetLoad;
FRIES.onload = () => console.log('FRIES loaded:', FRIES.src);
FRIES.onerror = () => console.warn('FRIES failed to load from:', FRIES.src);

let state = {
  hunger:0,
  mood: 60,
  energy: 100,
  cyberpsychosis: 0,
  boredom: 50,
  // feed picker removed: no food items state
  frame: 0,
  lastFrameTime: 0,
  animSpeed: 150, // ms per frame
  mode: 'idle', // idle, eat, play, sleep
  chargeLastUsed: -Infinity // timestamp of last charge button use (starts at -Infinity so first use is ready)
};

// transient feed effect (e.g., draw fries over for a short time)
state.feedEffect = null;

// additional persistent / game systems
state.coins = state.coins || 50;
state.inventory = state.inventory || {};
state.playCount = state.playCount || 0;
state.achievements = state.achievements || {};
state.quests = state.quests || [];
state.settings = state.settings || { sound: true, animations: true };
// equipped accessories
state.accessory = state.accessory || null; // e.g., golden chain
state.shoes = state.shoes || null; // 'cheap' | 'expensive'
state.headAccessory = state.headAccessory || null; // 'mafia' | 'pan'
// gangsta glasses state: { falling:bool, start:number, duration:number, yOffset:number, equipped:bool }
state.gangsta = state.gangsta || { falling:false, equipped:false, yOffset:null };

const itemThumbEl = document.getElementById('itemThumb');

// load fries texture (place file at assets/fries.png)
FRIES.src = 'assets/fries.png';

// update thumbnail when selection changes
if (itemSelect){
  function updateThumb(){
    if(!itemThumbEl) return;
    const v = itemSelect.value;
    if(v === 'food'){
      itemThumbEl.src = FRIES.src;
      itemThumbEl.classList.remove('hidden');
    } else {
      itemThumbEl.classList.add('hidden');
      itemThumbEl.src = '';
    }
  }
  itemSelect.addEventListener('change', updateThumb);
  // initialize
  updateThumb();
}

function update(dt) {
  // If powered off, freeze all status changes — no decay or growth.
  if (state.poweredOff) {
    // Do not change any stats while powered off. Keep UI frozen (styles applied via CSS).
    return;
  }

  // decay values over time
  // hunger increases over time now (clamped to 100)
  state.hunger = Math.min(100, state.hunger + dt * 0.005);
  // slower mood decay: reduce drain rate by half
  state.mood = Math.max(0, state.mood - dt * 0.0015);
  // slow down energy decay
  state.energy = Math.max(0, state.energy - dt * 0.0005);
  // keep cyberpsychosis steady (no automatic change)
  // state.cyberpsychosis stays as-is
  // boredom slowly increases over time (very gradual)
  state.boredom = Math.min(100, state.boredom + dt * 0.0005);

  // simple auto-mode selection
  if (state.hunger < 30) state.mode = 'hungry';
  else state.mode = 'idle';

  if (hungerMeter) hungerMeter.value = Math.round(state.hunger);
  if (moodMeter) moodMeter.value = Math.round(state.mood);
  if (energyMeter) energyMeter.value = Math.round(state.energy);
  if (cyberMeter) cyberMeter.value = Math.round(state.cyberpsychosis);
  if (boredomMeter) boredomMeter.value = Math.round(state.boredom);
  // update pixelated bars
  updatePixelBar(hungerPixel, state.hunger);
  updatePixelBar(moodPixel, state.mood);
  updatePixelBar(energyPixel, state.energy);
  updatePixelBar(cyberPixel, state.cyberpsychosis);
  updatePixelBar(boredomPixel, state.boredom);
}
function initPixelBar(pixelEl, initialValue){
  if(!pixelEl) return;
  pixelEl.innerHTML = '';
  for(let i=0;i<10;i++){
    const s = document.createElement('span');
    s.className = 'step';
    pixelEl.appendChild(s);
  }
  updatePixelBar(pixelEl, initialValue);
}

function updatePixelBar(pixelEl, value){
  if(!pixelEl) return;
  const steps = pixelEl.querySelectorAll('.step');
  const filled = Math.round((value/100) * 10);
  steps.forEach((el, idx) => el.classList.toggle('filled', idx < filled));
}

function draw(ts) {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // background ground removed (was drawing an unwanted rectangle)

  // sprite rendering (example: 64x64 frames)
  const fw = 64, fh = 64;
  const sx = (state.frame % 4) * fw; // 4 frames per row
  const sy = 0; // row 0 = idle
  ctx.imageSmoothingEnabled = false;
  // draw spritesheet frame (if present)
  ctx.drawImage(SPRITE, sx, sy, fw, fh, 128, 128, fw*2, fh*2);

  // draw the standalone pixel-art PNG `NIBBIE` centered above the ground
  if (NIBBIE.complete && NIBBIE.naturalWidth) {
    // draw Nibbie at the fixed size requested by the user
    const w = 400; // fixed width in pixels
    const h = 400; // fixed height in pixels
      const baseX = (canvas.width - w) / 2;
      // place character at the bottom of the canvas (flush to bottom)
      const baseY = canvas.height - h;

      // dance offsets (horizontal wiggle, vertical jumps, and spin)
      let dx = 0, dy = 0, angle = 0;
      if (state.dance && typeof state.dance.start === 'number'){
        const elapsedD = ts - state.dance.start;
        const durD = state.dance.duration || 4000; // longer dance by default
        const t = Math.min(1, Math.max(0, elapsedD / durD));
        // envelope (fade in/out) for smoother start/end
        const envelope = Math.sin(t * Math.PI);
        const ampX = state.dance.amplitudeX || state.dance.amplitude || 30;
        const ampY = state.dance.amplitudeY || 90;
        // horizontal sway: faster wobble
        dx = Math.sin(t * Math.PI * 4) * ampX * envelope;
        // vertical bouncing (peaks in rhythm) - negative moves up
        dy = -Math.abs(Math.sin(t * Math.PI * 6)) * ampY * envelope;
        // spinning: spin rate in revolutions per second (apply envelope)
        const spinRate = state.dance.spinRate || 2.0; // revs per second
        angle = (elapsedD / 1000) * spinRate * Math.PI * 2 * envelope;
        if (t >= 1) state.dance = null;
      }

      // shutdown sequence: prioritized over dance visually
      if (state.shutdownSequence && typeof state.shutdownSequence.start === 'number'){
        const elapsedS = ts - state.shutdownSequence.start;
        const durS = state.shutdownSequence.duration || 1200;
        const ps = Math.min(1, Math.max(0, elapsedS / durS));
        const env = Math.sin(ps * Math.PI);
        // short lean/press motion before falling
        const lean = 18 * env;
        const rot = 0.35 * env;
        dx += Math.sin(ps * Math.PI * 2) * 6 * (1 - ps);
        dy += lean;
        angle += rot;
        if (ps >= 1){
          state.shutdownSequence = null;
          // start fall animation (will call performPowerOff when complete)
          state.fall = { start: ts, duration: 1000, targetAngle: Math.PI/2, drop: 140 };
        }
      }

      // falling animation: rotate and drop to ground, then mark as fallen
      if (state.fall && typeof state.fall.start === 'number'){
        const elapsedF = ts - state.fall.start;
        const df = state.fall.duration || 1000;
        const pf = Math.min(1, Math.max(0, elapsedF / df));
        // ease (fast then settle)
        const ease = Math.sin(pf * Math.PI * 0.5);
        const targetA = state.fall.targetAngle || (Math.PI/2);
        const fallAngle = targetA * ease;
        const fallDy = (state.fall.drop || 140) * ease;
        // apply to current offsets
        angle += fallAngle;
        dy += fallDy;
        if (pf >= 1){
          // finish fall
          state.fall = null;
          state.fallen = true;
          // ensure final pose matches lying down
          // perform the actual power-off overlay and button disable
          performPowerOff();
        }
      }

      // jump animation (added on feed/use). If present, add on top of dance vertical offset
      let jumpOffset = 0;
      if (state.jump && typeof state.jump.start === 'number'){
        const elapsed = ts - state.jump.start;
        const dur = state.jump.duration || 600;
        const prog = Math.min(1, Math.max(0, elapsed / dur));
        // smooth arc: sin(pi * t) gives a nice jump curve
        jumpOffset = Math.sin(prog * Math.PI) * (state.jump.height || 120);
        // upward movement is negative, so invert
        jumpOffset = -jumpOffset;
        if (prog >= 1){
          state.jump = null;
        }
      }

      // final draw position
      const finalX = baseX + dx;
      const finalY = baseY + dy + jumpOffset;
      // get-up animation: animate from lying (fallen) to upright
      if (state.getUp && typeof state.getUp.start === 'number'){
        const elapsedG = ts - state.getUp.start;
        const dg = state.getUp.duration || 1200;
        const pg = Math.min(1, Math.max(0, elapsedG / dg));
        // ease-out for smooth recover
        const easeG = 1 - Math.pow(1 - pg, 3);
        // starting from fallen pose: angle PI/2, drop distance ~140
        const startAngle = Math.PI/2;
        const startDrop = 140;
        const currAngle = startAngle * (1 - easeG);
        const currDrop = startDrop * (1 - easeG);
        // draw at interpolated pose
        const drawXg = finalX;
        const drawYg = baseY + currDrop;
        ctx.save();
        ctx.translate(drawXg + w/2, drawYg + h/2);
        if (currAngle) ctx.rotate(currAngle);
        ctx.drawImage(NIBBIE, -w/2, -h/2, w, h);
        // draw christmas hat if equipped (rotates with sprite)
        if (state.skin === 'christmas'){
          const hatW = w * 0.5;
          const hatH = h * 0.22;
          const topY = -h/2 + 12;
          const leftX = -hatW/2;
          const rightX = hatW/2;
          // red triangle
          ctx.fillStyle = '#c21a1a';
          ctx.beginPath();
          ctx.moveTo(leftX, topY + hatH);
          ctx.lineTo(0, topY);
          ctx.lineTo(rightX, topY + hatH);
          ctx.closePath();
          ctx.fill();
          // white brim
          ctx.fillStyle = '#fff';
          ctx.fillRect(leftX, topY + hatH - 8, hatW, 10);
          // pompom
          ctx.beginPath();
          ctx.arc(0, topY, 8, 0, Math.PI*2);
          ctx.fill();
        }
        // draw golden chain if equipped
        if (state.accessory === 'chain'){
          drawPixelChain(ctx, w, h);
        }
        // gangsta glasses: handle falling animation and final position
        if(state.gangsta){
          const g = state.gangsta;
          const now = ts || Date.now();
          let yOff;
          const startY = -h * 0.70; // start above head
          const endY = -h * 0.22; // land near eyes (moved higher to align with sprite's eyes)
          if(g.falling){
            const elapsed = now - g.start;
            const dur = g.duration || 800;
            const t = Math.min(1, elapsed / dur);
            const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
            yOff = startY + (endY - startY) * ease;
            if(t >= 1){
              g.falling = false;
              g.equipped = true;
              g.yOffset = endY;
            }
          } else if(g.equipped){
            yOff = g.yOffset !== undefined ? g.yOffset : endY;
          }
          if(typeof yOff !== 'undefined') drawGangstaGlasses(ctx, w, h, yOff);
        }
        // head accessories
        if (state.headAccessory === 'mafia') drawPixelMafiaHat(ctx, w, h);
        else if (state.headAccessory === 'pan') drawPixelPan(ctx, w, h);
        // shoes
        if (state.shoes) drawPixelShoes(ctx, w, h, state.shoes);
        ctx.restore();
        if (pg >= 1){
          // finish get-up
          state.getUp = null;
          state.fallen = false;
          // fully power on now
          state.poweredOff = false;
          setHudButtonsEnabled(true);
          const hudEl = document.getElementById('hud'); if (hudEl) hudEl.classList.remove('powered-off');
          showToast('Powered on', 'ok');
        }
      } else {
        // if fallen, lock pose: lying on its side (90deg) and stay
        let drawAngle = angle;
        let drawX = finalX;
        let drawY = finalY;
        if (state.fallen){
          // override to lying pose
          drawAngle = Math.PI/2; // 90 degrees
          // lower slightly so sprite looks on ground
          drawY = baseY + (state.fall && state.fall.drop ? state.fall.drop : 140);
        }

        // draw with rotation around the sprite center
        ctx.save();
        ctx.translate(drawX + w/2, drawY + h/2);
        if (drawAngle) ctx.rotate(drawAngle);
        ctx.drawImage(NIBBIE, -w/2, -h/2, w, h);
        // draw christmas hat if equipped (rotates with sprite)
        if (state.skin === 'christmas'){
          const hatW = w * 0.5;
          const hatH = h * 0.22;
          const topY = -h/2 + 12;
          const leftX = -hatW/2;
          const rightX = hatW/2;
          // red triangle
          ctx.fillStyle = '#c21a1a';
          ctx.beginPath();
          ctx.moveTo(leftX, topY + hatH);
          ctx.lineTo(0, topY);
          ctx.lineTo(rightX, topY + hatH);
          ctx.closePath();
          ctx.fill();
          // white brim
          ctx.fillStyle = '#fff';
          ctx.fillRect(leftX, topY + hatH - 8, hatW, 10);
          // pompom
          ctx.beginPath();
          ctx.arc(0, topY, 8, 0, Math.PI*2);
          ctx.fill();
        }
        // draw golden chain if equipped
        if (state.accessory === 'chain'){
          drawPixelChain(ctx, w, h);
        }
        // gangsta glasses: handle falling animation and final position
        if(state.gangsta){
          const g = state.gangsta;
          const now = ts || Date.now();
          let yOff;
          const startY = -h * 0.55; // start above head
          const endY = -h * 0.22; // land near eyes (moved higher to align with sprite's eyes)
          if(g.falling){
            const elapsed = now - g.start;
            const dur = g.duration || 800;
            const t = Math.min(1, elapsed / dur);
            const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
            yOff = startY + (endY - startY) * ease;
            if(t >= 1){
              g.falling = false;
              g.equipped = true;
              g.yOffset = endY;
            }
          } else if(g.equipped){
            yOff = g.yOffset !== undefined ? g.yOffset : endY;
          }
          if(typeof yOff !== 'undefined') drawGangstaGlasses(ctx, w, h, yOff);
        }
        // head accessories
        if (state.headAccessory === 'mafia') drawPixelMafiaHat(ctx, w, h);
        else if (state.headAccessory === 'pan') drawPixelPan(ctx, w, h);
        // shoes
        if (state.shoes) drawPixelShoes(ctx, w, h, state.shoes);
        ctx.restore();
      }

      // draw feed effect (e.g., fries) if active -- position relative to final (non-rotated) top-left
      if (state.feedEffect && state.feedEffect.type === 'fries'){
        const elapsed = ts - state.feedEffect.start;
        if (elapsed < state.feedEffect.duration){
          if (FRIES.complete && FRIES.naturalWidth){
            const fw = 96, fh = 96;
            const fx = finalX + (w - fw) / 2;
            const fy = finalY - fh - 8;
            ctx.drawImage(FRIES, fx, fy, fw, fh);
          }
        } else {
          state.feedEffect = null;
        }
      }
  }
}

let last = performance.now();
function loop(ts) {
  const dt = ts - last;
  update(dt);
  // frame animation
  if (ts - state.lastFrameTime > state.animSpeed) {
    state.frame = (state.frame + 1) % 4;
    state.lastFrameTime = ts;
  }
  draw(ts);
  last = ts;
  requestAnimationFrame(loop);
}

// interactions
feedBtn.addEventListener('click', () => {
  // feeding reduces hunger (hunger grows over time now)
  state.hunger = Math.max(0, state.hunger - 20);
  state.mood = Math.min(100, state.mood + 15);
  state.mode = 'eat';
  // trigger a short jump animation on feed
  state.jump = { start: performance.now(), duration: 700, height: 140 };
  setTimeout(()=> state.mode='idle', 1000);
  updatePixelBar(hungerPixel, state.hunger);
  checkAchievements && checkAchievements('fed');
});

// use selected item (simple behavior: if 'food' is selected, reduce hunger)
if (useBtn){
  useBtn.addEventListener('click', ()=>{
    const val = itemSelect ? itemSelect.value : 'none';
    if (val === 'food'){
      state.hunger = Math.max(0, state.hunger - 20);
      updatePixelBar(hungerPixel, state.hunger);
      state.mood = Math.min(100, state.mood + 15);
      // show a short fries feed effect on the canvas
      state.feedEffect = { type: 'fries', start: performance.now(), duration: 900 };
      // small jump when using food
      state.jump = { start: performance.now(), duration: 700, height: 140 };
      checkAchievements && checkAchievements('fed');
    } else {
      console.log('Use clicked, item:', val);
    }
  });
}

// new HUD buttons: give up, dance, turn off
if (giveUpBtn){
  giveUpBtn.addEventListener('click', ()=>{
    // start a short shutdown sequence animation, then power off
    state.shutdownSequence = { start: performance.now(), duration: 1400 };
    showToast('Nibbie is powering down...', '');
  });
}
if (danceBtn){
  danceBtn.addEventListener('click', ()=>{
    // trigger an extended dance animation: spinning + jumping + sway
    state.dance = { start: performance.now(), duration: 4000, amplitudeX: 36, amplitudeY: 110, spinRate: 2.4 };
    showToast('Nibbie starts a big dance!', 'ok');
  });
}
if (gangstaBtn){
  gangstaBtn.addEventListener('click', ()=>{
    // if already falling, ignore; if equipped -> unequip; otherwise start falling animation
    if (!state.gangsta) state.gangsta = { falling:false, equipped:false, yOffset:null };
    const g = state.gangsta;
    if (g.falling) return;
    if (g.equipped){
      // unequip: remove glasses
      g.equipped = false;
      g.yOffset = null;
      showToast('Glasses removed', '');
      return;
    }
    g.falling = true;
    g.start = performance.now();
    g.duration = 900;
    g.equipped = false;
    g.yOffset = null;
    showToast('Gangsta paradise!', 'ok');
  });
}
// helper: enable/disable HUD controls (keep turnOffBtn always available)
function setHudButtonsEnabled(enabled){
  const btns = document.querySelectorAll('#hud .controls button');
  btns.forEach(b => {
    if (b.id === 'turnOffBtn') return;
    b.disabled = !enabled;
  });
}

// poweredOff flag in state (defaults false)
state.poweredOff = state.poweredOff || false;

// helper functions to power off / on (used by button and shutdown sequence)
function performPowerOff(){
  // already off?
  if (state.poweredOff) return;
  const o = document.createElement('div');
  o.id = 'powerOverlay';
  o.style.position = 'fixed';
  o.style.inset = '0';
  o.style.background = 'rgba(0,0,0,0.85)';
  o.style.zIndex = 40000;
  o.style.display = 'flex';
  o.style.alignItems = 'center';
  o.style.justifyContent = 'center';
  o.style.color = '#fff';
  o.style.fontFamily = 'inherit';
  o.style.fontSize = '18px';
  o.textContent = 'Powered off — click to turn on';
  o.addEventListener('click', ()=>{ 
    performPowerOn();
  });
  document.body.appendChild(o);
  state.poweredOff = true;
  setHudButtonsEnabled(false);
  // add HUD visual class
  const hudEl = document.getElementById('hud'); if (hudEl) hudEl.classList.add('powered-off');
  showToast('Turning off...', '');
}

function performPowerOn(){
  const existing = document.getElementById('powerOverlay');
  if (existing) existing.remove();
  // If the robot is currently fallen, play a get-up animation first,
  // then fully power on and re-enable the HUD when it finishes.
  if (state.fallen){
    // keep poweredOff true during get-up so stats remain frozen
    state.poweredOff = true;
    setHudButtonsEnabled(false);
    const hudEl = document.getElementById('hud'); if (hudEl) hudEl.classList.add('powered-off');
    // start get-up animation
    state.getUp = { start: performance.now(), duration: 1200 };
    showToast('Nibbie is getting up...', 'ok');
    return;
  }

  state.poweredOff = false;
  setHudButtonsEnabled(true);
  const hudEl = document.getElementById('hud'); if (hudEl) hudEl.classList.remove('powered-off');
  showToast('Turning on...', 'ok');
}

if (turnOffBtn){
  turnOffBtn.addEventListener('click', ()=>{
    if (state.poweredOff) performPowerOn(); else performPowerOff();
  });
}

// feed picker removed: no picker behavior

// minigame modal elements
const minigameModal = document.getElementById('minigameModal');
const minigameSelect = document.getElementById('minigameSelect');
const startMini = document.getElementById('startMini');
const closeMini = document.getElementById('closeMini');

playBtn.addEventListener('click', () => {
  // keep mood increase but do not change energy
  state.mood = Math.min(100, state.mood + 30);
  state.mode = 'play';
  setTimeout(()=> state.mode='idle', 1200);

  // show minigame selector modal
  if (!minigameModal){
    console.warn('minigameModal not found; creating fallback modal');
    // create a simple fallback modal and append to body
    const fallback = document.createElement('div');
    fallback.className = 'minigame-modal';
    fallback.style.position = 'absolute';
    fallback.style.left = '50%';
    fallback.style.top = '50%';
    fallback.style.transform = 'translate(-50%,-50%)';
    fallback.style.background = 'rgba(0,0,0,0.85)';
    fallback.style.border = '3px solid var(--accent)';
    fallback.style.padding = '16px';
    fallback.style.borderRadius = '8px';
    fallback.innerHTML = '<div style="color:var(--accent);font-weight:800;margin-bottom:8px">Select Minigame</div><div><button id="closeMiniFallback">Close</button></div>';
    document.body.appendChild(fallback);
    const btn = document.getElementById('closeMiniFallback');
    if (btn) btn.addEventListener('click', ()=> fallback.remove());
  } else {
    console.log('showing existing modal');
    minigameModal.classList.remove('hidden');
    minigameModal.setAttribute('aria-hidden','false');
    minigameModal.style.display = 'block';
    // attempt to anchor the panel above the HUD if present
    const hudEl = document.getElementById('hud');
    const panel = minigameModal.querySelector('.minigame-panel');
    if (hudEl && panel){
      const hudRect = hudEl.getBoundingClientRect();
      const x = hudRect.left + hudRect.width / 2;
      const y = hudRect.top - 60;
      // mark modal as HUD-anchored (CSS uses this class to allow absolute placement)
      minigameModal.classList.add('hud');
      // place panel higher above the HUD (panel positioned absolutely inside overlay)
      panel.style.left = x + 'px';
      panel.style.top = y + 'px';
      panel.style.transform = 'translate(-50%,-100%)';
    } else if (panel) {
      // fallback: clear any previous inline placement so the panel centers normally
      panel.style.left = '';
      panel.style.top = '';
      panel.style.transform = '';
      minigameModal.classList.remove('hud');
    }
    if (minigameSelect) minigameSelect.focus();
  }
});

// ---------- New feature: Save / Load / Reset ----------
const SAVE_KEY = 'nibbie.save.v1';
function saveState(){
  try{
    const copy = {
      hunger: state.hunger,
      mood: state.mood,
      energy: state.energy,
      cyberpsychosis: state.cyberpsychosis,
      boredom: state.boredom,
      coins: state.coins,
      inventory: state.inventory,
      achievements: state.achievements,
      quests: state.quests,
      settings: state.settings,
      skin: state.skin,
      accessory: state.accessory,
      shoes: state.shoes,
      headAccessory: state.headAccessory,
      playCount: state.playCount
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(copy));
  }catch(e){ console.warn('Save failed', e); }
}
function loadState(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (!s) return;
    state.hunger = s.hunger ?? state.hunger;
    state.mood = s.mood ?? state.mood;
    state.energy = s.energy ?? state.energy;
    state.cyberpsychosis = s.cyberpsychosis ?? state.cyberpsychosis;
    state.boredom = s.boredom ?? state.boredom;
    state.coins = s.coins ?? state.coins;
    state.inventory = s.inventory || state.inventory;
    state.achievements = s.achievements || state.achievements;
    state.quests = s.quests || state.quests;
    state.settings = s.settings || state.settings;
    state.skin = s.skin || state.skin;
    state.accessory = s.accessory || state.accessory;
    state.shoes = s.shoes || state.shoes;
    state.headAccessory = s.headAccessory || state.headAccessory;
    state.playCount = s.playCount || state.playCount;
    // update UI
    updatePixelBar(hungerPixel, state.hunger);
    updatePixelBar(energyPixel, state.energy);
    updatePixelBar(cyberPixel, state.cyberpsychosis);
    updatePixelBar(boredomPixel, state.boredom);
    updatePixelBar(moodPixel, state.mood);
  }catch(e){ console.warn('Load failed', e); }
}
function resetState(){
  localStorage.removeItem(SAVE_KEY);
  location.reload();
}

window.addEventListener('beforeunload', ()=> saveState());
// try to load on start
loadState();

// initialize pixel-progress bars (create steps)
initPixelBar(hungerPixel, state.hunger);
initPixelBar(moodPixel, state.mood);
initPixelBar(energyPixel, state.energy);
initPixelBar(cyberPixel, state.cyberpsychosis);
initPixelBar(boredomPixel, state.boredom);

// modal controls
// refactored starter for minigames (used by delegated handlers)
function startSelectedMinigame(){
  const sel = minigameSelect ? minigameSelect.value : 'none';
  // record start for achievements/quests
  if (typeof onMiniStarted === 'function') onMiniStarted();
  const panel = minigameModal ? minigameModal.querySelector('.minigame-panel') : null;
  if (!panel) return;
  // save original panel HTML so we can restore later
  if (!panel._originalHTML) panel._originalHTML = panel.innerHTML;
  // stop any previously running mini
  stopActiveMini();
  // prepare play area
  const label = (minigameSelect && minigameSelect.options && minigameSelect.selectedIndex >= 0) ? minigameSelect.options[minigameSelect.selectedIndex].text : sel;
  panel.innerHTML = '<div class="minigame-header">Playing: '+label+'</div><div id="miniBody"></div><div style="margin-top:10px"><button id="miniClose">Exit</button></div>';
  const miniBody = panel.querySelector('#miniBody');
  const closeBtn = panel.querySelector('#miniClose');
  if (closeBtn) closeBtn.addEventListener('click', ()=>{ stopActiveMini(); restorePanel(); });
  if (minigameModal){ minigameModal.classList.remove('hidden'); minigameModal.setAttribute('aria-hidden','false'); }
  // Start chosen minigame
  if (sel === 'guess') startGuess(miniBody);
  else if (sel === 'snake') startSnake(miniBody);
  else if (sel === 'color') startColorGuess(miniBody);
  else if (sel === 'walk') startWalk(miniBody);
  else if (sel === 'trampoline') startTrampoline(miniBody);
  else miniBody.textContent = 'No minigame selected.';
}
// close modal when clicking outside panel
window.addEventListener('click', (e)=>{
  if (!minigameModal || minigameModal.classList.contains('hidden')) return;
  const panel = document.querySelector('.minigame-panel');
  if (panel && !panel.contains(e.target)){
    minigameModal.classList.add('hidden');
    minigameModal.setAttribute('aria-hidden','true');
    minigameModal.classList.remove('hud');
    if (panel){ panel.style.left=''; panel.style.top=''; panel.style.transform=''; }
  }
});

// Ensure the selection modal's Close button always works (delegated)
if (minigameModal){
  minigameModal.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.id === 'closeMini'){
      // stop any running minigame and hide the selector
      stopActiveMini();
      minigameModal.classList.add('hidden');
      minigameModal.setAttribute('aria-hidden','true');
      minigameModal.classList.remove('hud');
      const panel = minigameModal.querySelector('.minigame-panel');
      if (panel){ panel.style.left=''; panel.style.top=''; panel.style.transform=''; }
    }
    else if (btn.id === 'startMini'){
      // start the selected minigame via the shared starter
      startSelectedMinigame();
    }
  });
}

// --- Minigame framework helpers ---
let _activeMini = { id: null, interval: null, keyHandler: null };
function stopActiveMini(){
  if (_activeMini.interval) { clearInterval(_activeMini.interval); _activeMini.interval = null; }
  if (_activeMini.id === 'snake' && _activeMini.keyHandler) { window.removeEventListener('keydown', _activeMini.keyHandler); }
  _activeMini.id = null;
}
function restorePanel(){
  if (!minigameModal) return;
  const panel = minigameModal.querySelector('.minigame-panel');
  if (!panel) return;
  if (panel._originalHTML) panel.innerHTML = panel._originalHTML;
  minigameModal.classList.add('hidden');
  minigameModal.setAttribute('aria-hidden','true');
  minigameModal.classList.remove('hud');
}

// --- Minigame implementations ---
function startGuess(container){
  _activeMini.id = 'guess';
  const secret = Math.floor(Math.random()*100)+1;
  let attempts = 0;
  container.innerHTML = `\n    <div style="margin-bottom:8px">I'm thinking of a number between 1 and 100.</div>\n    <input id="gInput" type="number" min="1" max="100" style="width:80px;padding:6px" />\n    <button id="gBtn">Guess</button>\n    <div id="gMsg" style="margin-top:8px"></div>\n  `;
  const input = container.querySelector('#gInput');
  const btn = container.querySelector('#gBtn');
  const msg = container.querySelector('#gMsg');
  function doGuess(){
    const v = parseInt(input.value,10);
    if (!v || v < 1 || v > 100){ msg.textContent = 'Enter a number 1-100'; return; }
    attempts++;
    if (v === secret){ msg.textContent = `Correct! Attempts: ${attempts}. Reward +20 mood.`; state.mood = Math.min(100, state.mood + 20); setTimeout(restorePanel,800); }
    else if (v < secret) msg.textContent = 'Higher!';
    else msg.textContent = 'Lower!';
  }
  btn.addEventListener('click', doGuess);
  input.addEventListener('keydown', (e)=>{ if (e.key === 'Enter') doGuess(); });
}

// New minigame: Guess Red or Blue. Correct guess awards 100 coins.
function startColorGuess(container){
  _activeMini.id = 'color';
  container.innerHTML = '';
  const info = document.createElement('div');
  info.style.marginBottom = '8px';
  info.textContent = "Guess which color: Red or Blue. Win 100 coins for a correct guess.";
  container.appendChild(info);

  const btnWrap = document.createElement('div');
  btnWrap.style.display = 'flex';
  btnWrap.style.justifyContent = 'center';
  btnWrap.style.gap = '12px';

  const redBtn = document.createElement('button');
  redBtn.textContent = 'Red';
  redBtn.style.background = '#b33';
  redBtn.style.color = '#fff';
  redBtn.style.padding = '10px 16px';
  redBtn.style.fontSize = '16px';

  const blueBtn = document.createElement('button');
  blueBtn.textContent = 'Blue';
  blueBtn.style.background = '#146';
  blueBtn.style.color = '#fff';
  blueBtn.style.padding = '10px 16px';
  blueBtn.style.fontSize = '16px';

  btnWrap.appendChild(redBtn);
  btnWrap.appendChild(blueBtn);
  container.appendChild(btnWrap);

  const result = document.createElement('div');
  result.style.marginTop = '10px';
  result.style.textAlign = 'center';
  container.appendChild(result);

  // generate random color: 'red' or 'blue'
  const secret = Math.random() < 0.5 ? 'red' : 'blue';

  function handleGuess(choice){
    if (choice === secret){
      result.textContent = 'Correct! You earned 100 coins.';
      state.coins = (state.coins || 0) + 100;
      if (coinBadge) coinBadge.textContent = state.coins;
      animateCoinChange(100);
      saveState();
      // finish mini after short delay
      setTimeout(()=>{ stopActiveMini(); restorePanel(); }, 900);
    } else {
      result.textContent = 'Wrong — it was ' + secret.toUpperCase() + '. Better luck next time.';
      // small delay then restore
      setTimeout(()=>{ stopActiveMini(); restorePanel(); }, 1200);
    }
  }

  redBtn.addEventListener('click', ()=> handleGuess('red'));
  blueBtn.addEventListener('click', ()=> handleGuess('blue'));
}
function startSnake(container){
  _activeMini.id = 'snake';
  const c = document.createElement('canvas');
  // smaller/more HUD-friendly snake canvas: 12x12 grid with 8px cells -> 96x96
  const cols = 12, rows = 12, cell = 8;
  c.width = cols * cell; c.height = rows * cell;
  c.style.background = '#111'; c.style.imageRendering = 'pixelated'; c.style.border = '2px solid var(--accent)'; c.style.display = 'block'; c.style.margin = '6px auto';
  container.appendChild(c);
  const sctx = c.getContext('2d');
  let snake = [{x:9,y:9}];
  let dir = {x:1,y:0};
  let nextDir = {x:1,y:0};
  let apple = placeApple();
  let score = 0;
  let running = true;
  let gameOver = false;
  
  const scoreDiv = document.createElement('div');
  scoreDiv.style.textAlign = 'center';
  scoreDiv.style.marginTop = '8px';
  scoreDiv.style.fontSize = '16px';
  scoreDiv.style.color = 'var(--accent)';
  container.appendChild(scoreDiv);
  
  const ctrlDiv = document.createElement('div');
  ctrlDiv.style.textAlign = 'center';
  ctrlDiv.style.marginTop = '8px';
  const restartBtn = document.createElement('button');
  restartBtn.textContent = 'Restart';
  restartBtn.style.marginRight = '8px';
  const quitBtn = document.createElement('button');
  quitBtn.textContent = 'Quit';
  ctrlDiv.appendChild(restartBtn);
  ctrlDiv.appendChild(quitBtn);
  container.appendChild(ctrlDiv);
  
  function placeApple(){ while(true){ const ax = Math.floor(Math.random()*cols); const ay = Math.floor(Math.random()*rows); if (!snake.some(s=>s.x===ax && s.y===ay)) return {x:ax,y:ay}; } }
  
  function draw(){ 
    sctx.fillStyle='#000'; sctx.fillRect(0,0,c.width,c.height); 
    sctx.fillStyle='#0f0'; 
    for (const s of snake) { sctx.fillRect(s.x*cell+1, s.y*cell+1, cell-2, cell-2); }
    sctx.fillStyle='#f00'; 
    sctx.fillRect(apple.x*cell+1, apple.y*cell+1, cell-2, cell-2);
    scoreDiv.textContent = 'Score: ' + score;
  }
  
  function step(){ 
    if (!running) return;
    dir = nextDir;
    const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y}; 
    head.x = (head.x + cols) % cols; 
    head.y = (head.y + rows) % rows; 
    if (snake.some(s=>s.x===head.x && s.y===head.y)){ 
      running = false;
      gameOver = true;
      state.mood = Math.min(100, state.mood + 10);
      scoreDiv.textContent = 'Game Over! Score: ' + score + ' (+10 mood)';
      return; 
    } 
    snake.unshift(head); 
    if (head.x === apple.x && head.y === apple.y){ 
      score++; 
      apple = placeApple(); 
    } else { 
      snake.pop(); 
    } 
    draw(); 
  }
  
  _activeMini.keyHandler = function(e){ 
    if (e.key === 'ArrowUp' && dir.y===0) nextDir = {x:0,y:-1}; 
    if (e.key === 'ArrowDown' && dir.y===0) nextDir = {x:0,y:1}; 
    if (e.key === 'ArrowLeft' && dir.x===0) nextDir = {x:-1,y:0}; 
    if (e.key === 'ArrowRight' && dir.x===0) nextDir = {x:1,y:0}; 
  };
  window.addEventListener('keydown', _activeMini.keyHandler);
  
  restartBtn.addEventListener('click', ()=>{
    snake = [{x:9,y:9}];
    dir = {x:1,y:0};
    nextDir = {x:1,y:0};
    score = 0;
    running = true;
    gameOver = false;
    apple = placeApple();
    draw();
  });
  
  quitBtn.addEventListener('click', ()=>{
    stopActiveMini();
    restorePanel();
  });
  
  // slightly slower step interval for the smaller canvas
  _activeMini.interval = setInterval(step, 160);
  draw();
}
function startWalk(container){
  _activeMini.id = 'walk';
  container.innerHTML = '<div style="margin-bottom:8px">Take a short walk to calm Nibbie.</div><div id="walkBar" style="width:220px;height:14px;background:#222;border:2px solid #000;border-radius:6px;overflow:hidden"><div id="walkFill" style="height:100%;width:0;background:var(--accent)"></div></div><div style="margin-top:8px"><button id="walkStart">Start Walk</button></div>';
  const start = container.querySelector('#walkStart'); const fill = container.querySelector('#walkFill');
  start.addEventListener('click', ()=>{ start.disabled = true; let pct = 0; const t = 3000; const stepMS = 50; const stepAmt = (stepMS / t) * 100; _activeMini.interval = setInterval(()=>{ pct += stepAmt; fill.style.width = pct + '%'; if (pct >= 100){ clearInterval(_activeMini.interval); _activeMini.interval = null; state.mood = Math.min(100, state.mood + 12); state.boredom = Math.max(0, state.boredom - 10); const done = document.createElement('div'); done.textContent = 'Walk finished! +12 mood -10 boredom'; container.appendChild(done); } }, stepMS); });
}
function startTrampoline(container){
  _activeMini.id = 'trampoline';
  container.innerHTML = '<div style="margin-bottom:8px">Tap to bounce! Score increases with each successful bounce.</div><div id="bounceArea" style="width:220px;height:120px;background:#081;padding:8px;display:flex;align-items:flex-end;justify-content:center;position:relative"><div id="tib" style="width:40px;height:40px;background:#fff;border-radius:50%"></div></div><div style="margin-top:8px">Score: <span id="score">0</span></div>';
  const ball = container.querySelector('#tib'); const scoreEl = container.querySelector('#score'); let score = 0; let vy = 0; let y = 0; let running = true;
  function render(){ if (!running) return; y += vy; vy += 1.2; if (y > 60){ y = 60; vy = -12; score++; scoreEl.textContent = score; } ball.style.transform = `translateY(${-y}px)`; }
  const iv = setInterval(render, 30); _activeMini.interval = iv;
  container.querySelector('#bounceArea').addEventListener('click', ()=>{ vy = Math.max(-18, vy - 8); });
  setTimeout(()=>{ running = false; clearInterval(iv); const d = document.createElement('div'); d.textContent = 'Time! Score: ' + score; container.appendChild(d); state.mood = Math.min(100, state.mood + Math.min(20, Math.floor(score/2))); }, 8000);
}

// charge button: click to instantly restore energy to 100 (with 30s cooldown)
const chargeBtn = document.getElementById('chargeBtn');
const chargeCooldown = document.getElementById('chargeCooldown');
const CHARGE_COOLDOWN_MS = 30000; // 30 seconds
let chargeCooldownInterval = null;

if (chargeBtn){
  chargeBtn.addEventListener('click', ()=>{
    const now = performance.now();
    const timeSinceLastUse = now - state.chargeLastUsed;
    
    if (timeSinceLastUse >= CHARGE_COOLDOWN_MS){
      // charge is ready
      state.energy = 100;
      updatePixelBar(energyPixel, state.energy);
      state.mode = 'charge';
      state.chargeLastUsed = now;
      chargeBtn.disabled = true;
      
      // show and start cooldown timer
      startChargeCooldown();
      setTimeout(()=> state.mode='idle', 800);
    } else {
      // still on cooldown
      console.log('Charge still on cooldown');
    }
  });
}

function startChargeCooldown(){
  if (!chargeCooldown) return;
  
  // clear any existing interval
  if (chargeCooldownInterval) { clearInterval(chargeCooldownInterval); chargeCooldownInterval = null; }
  
  chargeCooldown.classList.remove('hidden');
  
  // update immediately, then every 100ms
  updateCooldownDisplay();
  
  chargeCooldownInterval = setInterval(()=>{
    updateCooldownDisplay();
  }, 100);
}

function updateCooldownDisplay(){
  if (!chargeCooldown) return;
  const elapsed = performance.now() - state.chargeLastUsed;
  const remaining = Math.ceil((CHARGE_COOLDOWN_MS - elapsed) / 1000);
  
  if (remaining <= 0){
    if (chargeCooldownInterval) { clearInterval(chargeCooldownInterval); chargeCooldownInterval = null; }
    chargeCooldown.classList.add('hidden');
    chargeBtn.disabled = false;
  } else {
    chargeCooldown.textContent = remaining + 's';
  }
}

// if assets were already cached and loaded synchronously, ensure loop starts
// if assets were already cached and loaded synchronously, ensure loop starts
if (NIBBIE.complete) requestAnimationFrame(loop);

// initialize pixel hunger UI (already initialized earlier after load)

// ---------- Shop, Achievements, Settings handlers ----------
const shopBtn = document.getElementById('shopBtn');
const shopModal = document.getElementById('shopModal');
const closeShop = document.getElementById('closeShop');
const achieveBtn = document.getElementById('achieveBtn');
const achieveModal = document.getElementById('achieveModal');
const closeAchieve = document.getElementById('closeAchieve');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const soundToggle = document.getElementById('soundToggle');
const animToggle = document.getElementById('animToggle');
const coinBadge = document.getElementById('coinBadge');

function openModal(modal){ if (!modal) return; modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false'); }
function closeModal(modal){ if (!modal) return; modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); }

if (shopBtn){ shopBtn.addEventListener('click', ()=> openModal(shopModal)); }
if (closeShop){ closeShop.addEventListener('click', ()=> closeModal(shopModal)); }
if (achieveBtn){ achieveBtn.addEventListener('click', ()=> { renderAchievements(); openModal(achieveModal); }); }
if (closeAchieve){ closeAchieve.addEventListener('click', ()=> closeModal(achieveModal)); }
if (settingsBtn){ settingsBtn.addEventListener('click', ()=> { soundToggle.checked = !!state.settings.sound; animToggle.checked = !!state.settings.animations; openModal(settingsModal); }); }
if (closeSettings){ closeSettings.addEventListener('click', ()=> { state.settings.sound = !!soundToggle.checked; state.settings.animations = !!animToggle.checked; saveState(); closeModal(settingsModal); }); }

// delegated shop clicks
const shopBody = document.getElementById('shopBody');
if (shopBody){
  shopBody.addEventListener('click', (e)=>{
    const btn = e.target.closest('.buyBtn');
    if (!btn) return;
    const item = btn.getAttribute('data-item');
    const itemEl = btn.parentElement;
    const cost = parseInt(itemEl.getAttribute('data-cost') || '0', 10);
    if (state.coins >= cost){
      state.coins -= cost;
      state.inventory[item] = (state.inventory[item] || 0) + 1;
      saveState();
      // give simple immediate effect for some items
      if (item === 'food') { state.hunger = Math.max(0, state.hunger - 25); updatePixelBar(hungerPixel, state.hunger); }
      if (item === 'toy') { state.mood = Math.min(100, state.mood + 10); }
      if (item === 'skin') { state.skin = 'christmas'; showToast('Equipped: Christmas Hat', 'ok'); }
      if (item === 'chain') { state.accessory = 'chain'; showToast('Equipped: Golden Chain', 'ok'); }
      if (item === 'shoesCheap') { state.shoes = 'cheap'; showToast('Equipped: Cheap Shoes', 'ok'); }
      if (item === 'shoesExpensive') { state.shoes = 'expensive'; showToast('Equipped: Expensive Shoes', 'ok'); }
      if (item === 'mafiaHat') { state.headAccessory = 'mafia'; showToast('Equipped: Mafia Hat', 'ok'); }
      if (item === 'pan') { state.headAccessory = 'pan'; showToast('Equipped: Pan (on head)', 'ok'); }
      checkAchievements && checkAchievements('bought');
      btn.textContent = 'Bought'; btn.disabled = true;
      if (coinBadge) coinBadge.textContent = state.coins;
      animateCoinChange(-cost);
      showToast('Purchased '+item+' for '+cost+' coins', 'ok');
    } else {
      btn.textContent = 'No coins'; setTimeout(()=> btn.textContent = 'Buy', 800);
    }
  });
}

// Clear cosmetics button handler
const clearCosBtn = document.getElementById('clearCosmeticsBtn');
if (clearCosBtn){
  clearCosBtn.addEventListener('click', ()=>{
    state.skin = null;
    state.accessory = null;
    state.shoes = null;
    state.headAccessory = null;
    saveState();
    showToast('Cleared cosmetics', 'ok');
  });
}

// Achievements system
const ACHIEVEMENT_DEFS = [
  { id: 'mood100', title: 'Happy Nibbie', desc: 'Reach mood 100', check: s=> s.mood >= 100, reward: 20 },
  { id: 'feed5', title: 'Feed Friend', desc: 'Feed 5 times', check: s=> (s.achCounts && s.achCounts.fed >= 5) , reward: 10 },
  { id: 'play10', title: 'Mini Master', desc: 'Play 10 minigames', check: s=> (s.playCount || 0) >= 10, reward: 30 },
  { id: 'rich', title: 'Collector', desc: 'Accumulate 200 coins', check: s=> (s.coins || 0) >= 200, reward: 50 }
];

function checkAchievements(trigger){
  // track counters
  state.achCounts = state.achCounts || {};
  state.achCounts[trigger] = (state.achCounts[trigger] || 0) + 1;
  for (const def of ACHIEVEMENT_DEFS){
    if (state.achievements[def.id]) continue;
    try{
      if (def.check(state)){
        state.achievements[def.id] = { unlocked: Date.now() };
        state.coins = (state.coins || 0) + (def.reward || 0);
        if (coinBadge) coinBadge.textContent = state.coins;
        animateAchievementUnlock(def.title);
        animateCoinChange(def.reward || 0);
      }
    }catch(e){ }
  }
  saveState();
}

function renderAchievements(){
  const el = document.getElementById('achieveBody');
  if (!el) return;
  el.innerHTML = '';
  for (const def of ACHIEVEMENT_DEFS){
    const got = !!state.achievements[def.id];
    const div = document.createElement('div');
    div.className = 'achievement' + (got? ' unlocked':' locked');
    div.innerHTML = `<strong>${def.title}</strong> — ${def.desc} ${got? '<span style="float:right;color:var(--accent)">UNLOCKED</span>':''}`;
    el.appendChild(div);
  }
}

// render inventory UI
function renderInventory(){
  const inv = document.getElementById('inventory');
  if (!inv) return;
  inv.innerHTML = '';
  for (const k of Object.keys(state.inventory || {})){
    const count = state.inventory[k] || 0;
    const div = document.createElement('div');
    div.className = 'inv-item';
    div.innerHTML = `<span>${k}</span> <span class="count">${count}</span>`;
    inv.appendChild(div);
  }
}
renderInventory();

// Quests (simple daily-like tasks)
function ensureQuests(){
  if (!state.quests || state.quests.length === 0){
    state.quests = [
      { id:'q_play2', text:'Play 2 minigames', progress:0, target:2, reward:10 },
      { id:'q_feed1', text:'Feed 1 time', progress:0, target:1, reward:5 }
    ];
    saveState();
  }
}
ensureQuests();

function progressQuest(what, amt=1){
  for (const q of state.quests){
    if (q.id.includes(what)){
      q.progress = Math.min(q.target, (q.progress||0) + amt);
      if (q.progress >= q.target){ state.coins = (state.coins||0) + (q.reward||0); if (coinBadge) coinBadge.textContent = state.coins; }
    }
  }
  saveState();
}

// hook into events
function onMiniStarted(){ state.playCount = (state.playCount||0) + 1; checkAchievements('played'); progressQuest('play', 1); if (coinBadge) coinBadge.textContent = state.coins; saveState(); }

// ensure badge display is current
if (coinBadge) coinBadge.textContent = state.coins;

// ---------- Visual helpers: toasts, coin animation, achievement banner ----------
const toastsEl = document.getElementById('toasts');
function showToast(text, type=''){
  if (!toastsEl) return;
  const t = document.createElement('div');
  t.className = 'toast ' + (type||'');
  t.textContent = text;
  toastsEl.appendChild(t);
  // force reflow then show
  requestAnimationFrame(()=> t.classList.add('show'));
  setTimeout(()=>{ t.classList.remove('show'); t.addEventListener('transitionend', ()=> t.remove()); setTimeout(()=> t.remove(), 900); }, 3000);
}

function animateCoinChange(delta){
  if (coinBadge){
    coinBadge.classList.add('pulse');
    coinBadge.textContent = state.coins;
    setTimeout(()=> coinBadge.classList.remove('pulse'), 800);
  }
  if (delta > 0) showToast('+'+delta+' coins', 'ok');
  else if (delta < 0) showToast(String(delta)+' coins');
}

function animateAchievementUnlock(title){
  // small banner
  const b = document.createElement('div');
  b.className = 'ach-banner';
  b.textContent = 'Achievement: ' + title;
  document.body.appendChild(b);
  requestAnimationFrame(()=> b.classList.add('show'));
  setTimeout(()=>{ b.classList.remove('show'); b.addEventListener('animationend', ()=> b.remove()); setTimeout(()=> b.remove(), 1400); }, 2600);
  showToast('Unlocked: ' + title, 'ok');
}

// draw a simple pixel-style golden chain around the neck
function drawPixelChain(ctx, w, h){
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // position relative to sprite center: place chain near upper chest / neck
  const chainY = -h/2 + (h * 0.36);
  const startX = -w * 0.20;
  const endX = w * 0.20;
  const segments = 9;
  // small rectangular links
  ctx.fillStyle = '#d4af37'; // gold
  for (let i=0;i<segments;i++){
    const t = i/(segments-1);
    const x = startX + (endX - startX) * t;
    const arc = Math.sin(t * Math.PI) * (h * 0.02);
    const y = chainY + arc;
    ctx.fillRect(x - 6, y - 4, 12, 8);
  }
  // central medallion
  ctx.beginPath();
  ctx.fillStyle = '#ffd66b';
  ctx.ellipse(0, chainY + 14, Math.max(8, w*0.035), Math.max(6, h*0.022), 0, 0, Math.PI*2);
  ctx.fill();
  // small inner shine
  ctx.beginPath(); ctx.fillStyle = '#fff3b8'; ctx.ellipse(-3, chainY + 12, Math.max(2, w*0.008), Math.max(1.5, h*0.006), 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

// draw a simple mafia fedora
function drawPixelMafiaHat(ctx, w, h){
  ctx.save(); ctx.imageSmoothingEnabled = false;
  const topY = -h/2 + 12;
  const hatW = w * 0.6;
  // brim
  ctx.fillStyle = '#111';
  ctx.fillRect(-hatW/2, topY + 6, hatW, 8);
  // crown
  ctx.fillStyle = '#222';
  ctx.fillRect(-hatW*0.35, topY - 6, hatW*0.7, 18);
  // red ribbon
  ctx.fillStyle = '#8a1313';
  ctx.fillRect(-hatW*0.35, topY + 2, hatW*0.7, 4);
  ctx.restore();
}

// draw a simple pan worn on head (upside-down)
function drawPixelPan(ctx, w, h){
  ctx.save(); ctx.imageSmoothingEnabled = false;
  const topY = -h/2 + 8;
  // pan body
  ctx.fillStyle = '#444';
  ctx.beginPath(); ctx.ellipse(0, topY + 12, w*0.28, h*0.12, 0, 0, Math.PI*2); ctx.fill();
  // inner darker
  ctx.fillStyle = '#2d2d2d'; ctx.beginPath(); ctx.ellipse(0, topY + 12, w*0.22, h*0.09, 0, 0, Math.PI*2); ctx.fill();
  // handle (slanted)
  ctx.fillStyle = '#333'; ctx.fillRect(w*0.18, topY + 18, w*0.18, 6);
  ctx.restore();
}

// draw shoes at the bottom of the sprite
function drawPixelShoes(ctx, w, h, type){
  ctx.save(); ctx.imageSmoothingEnabled = false;
  const shoeY = h/2 - (h * 0.12);
  const leftX = -w*0.22;
  const rightX = w*0.06;
  if (type === 'cheap'){
    ctx.fillStyle = '#cc0a6bff';
    ctx.fillRect(leftX, shoeY, w*0.18, h*0.10);
    ctx.fillRect(rightX, shoeY, w*0.18, h*0.10);
  } else {
    // expensive: black with gold trim
    ctx.fillStyle = '#0b0b0b';
    ctx.fillRect(leftX, shoeY, w*0.18, h*0.11);
    ctx.fillRect(rightX, shoeY, w*0.18, h*0.11);
    ctx.fillStyle = '#e5c06b';
    ctx.fillRect(leftX+2, shoeY+2, w*0.05, h*0.03);
    ctx.fillRect(rightX+2, shoeY+2, w*0.05, h*0.03);
  }
  ctx.restore();
}

// draw gangsta-style glasses at given yOffset (relative to sprite center)
function drawGangstaGlasses(ctx, w, h, yOffset){
  ctx.save(); ctx.imageSmoothingEnabled = false;
  const lensW = Math.max(12, w * 0.14);
  const lensH = Math.max(6, h * 0.06);
  const gap = Math.max(6, w * 0.04);
  const leftX = -lensW - gap/2;
  const rightX = gap/2;
  // main frame
  ctx.fillStyle = '#000';
  ctx.fillRect(leftX, yOffset - lensH/2, lensW, lensH);
  ctx.fillRect(rightX, yOffset - lensH/2, lensW, lensH);
  // bridge
  ctx.fillRect(-gap/2, yOffset - lensH*0.12, gap, lensH*0.24);
  // top bar for style
  ctx.fillRect(leftX - 2, yOffset - lensH/2 - 4, (lensW*2) + gap + 4, 4);
  // small highlight on lenses
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(leftX + 4, yOffset - lensH/2 + 3, Math.min(6, lensW*0.25), Math.max(2, lensH*0.18));
  ctx.fillRect(rightX + 4, yOffset - lensH/2 + 3, Math.min(6, lensW*0.25), Math.max(2, lensH*0.18));
  ctx.restore();
}

      
