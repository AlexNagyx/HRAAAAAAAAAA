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
  // decay values over time
  // hunger increases over time now (clamped to 100)
  state.hunger = Math.min(100, state.hunger + dt * 0.005);
  state.mood = Math.max(0, state.mood - dt * 0.003);
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
    const x = (canvas.width - w) / 2;
    // place character at the bottom of the canvas (flush to bottom)
    const y = canvas.height - h;
    ctx.drawImage(NIBBIE, x, y, w, h);
    // draw feed effect (e.g., fries) if active
    if (state.feedEffect && state.feedEffect.type === 'fries'){
      const elapsed = ts - state.feedEffect.start;
      if (elapsed < state.feedEffect.duration){
        if (FRIES.complete && FRIES.naturalWidth){
          const fw = 96, fh = 96;
          const fx = x + (w - fw) / 2;
          const fy = y - fh - 8;
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
  state.mood = Math.min(100, state.mood + 5);
  state.mode = 'eat';
  setTimeout(()=> state.mode='idle', 1000);
  updatePixelBar(hungerPixel, state.hunger);
});

// use selected item (simple behavior: if 'food' is selected, reduce hunger)
if (useBtn){
  useBtn.addEventListener('click', ()=>{
    const val = itemSelect ? itemSelect.value : 'none';
    if (val === 'food'){
      state.hunger = Math.max(0, state.hunger - 20);
      updatePixelBar(hungerPixel, state.hunger);
      state.mood = Math.min(100, state.mood + 5);
      // show a short fries feed effect on the canvas
      state.feedEffect = { type: 'fries', start: performance.now(), duration: 900 };
    } else {
      console.log('Use clicked, item:', val);
    }
  });
}

// feed picker removed: no picker behavior

// minigame modal elements
const minigameModal = document.getElementById('minigameModal');
const minigameSelect = document.getElementById('minigameSelect');
const startMini = document.getElementById('startMini');
const closeMini = document.getElementById('closeMini');

playBtn.addEventListener('click', () => {
  console.log('play button clicked');
  // keep mood increase but do not change energy
  state.mood = Math.min(100, state.mood + 20);
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

// modal controls
if (closeMini){
  closeMini.addEventListener('click', ()=>{
    if (minigameModal){ 
      minigameModal.classList.add('hidden'); 
      minigameModal.setAttribute('aria-hidden','true'); 
      minigameModal.classList.remove('hud');
      const panel = minigameModal.querySelector('.minigame-panel');
      if (panel){ panel.style.left=''; panel.style.top=''; panel.style.transform=''; }
    }
  });
}
if (startMini){
  startMini.addEventListener('click', ()=>{
    const sel = minigameSelect ? minigameSelect.value : 'none';
    console.log('Start minigame:', sel);
    const panel = minigameModal ? minigameModal.querySelector('.minigame-panel') : null;
    if (!panel) return;
    // save original panel HTML so we can restore later
    if (!panel._originalHTML) panel._originalHTML = panel.innerHTML;
    // stop any previously running mini
    stopActiveMini();
    // prepare play area
    panel.innerHTML = '<div class="minigame-header">Playing: '+(minigameSelect.options[minigameSelect.selectedIndex].text||sel)+'</div><div id="miniBody"></div><div style="margin-top:10px"><button id="miniClose">Exit</button></div>';
    const miniBody = panel.querySelector('#miniBody');
    const closeBtn = panel.querySelector('#miniClose');
    if (closeBtn) closeBtn.addEventListener('click', ()=>{ stopActiveMini(); restorePanel(); });
    if (minigameModal){ minigameModal.classList.remove('hidden'); minigameModal.setAttribute('aria-hidden','false'); }
    // Start chosen minigame
    if (sel === 'guess') startGuess(miniBody);
    else if (sel === 'snake') startSnake(miniBody);
    else if (sel === 'walk') startWalk(miniBody);
    else if (sel === 'trampoline') startTrampoline(miniBody);
    else miniBody.textContent = 'No minigame selected.';
  });
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
    if (v === secret){ msg.textContent = `Correct! Attempts: ${attempts}. Reward +10 mood.`; state.mood = Math.min(100, state.mood + 10); setTimeout(restorePanel,800); }
    else if (v < secret) msg.textContent = 'Higher!';
    else msg.textContent = 'Lower!';
  }
  btn.addEventListener('click', doGuess);
  input.addEventListener('keydown', (e)=>{ if (e.key === 'Enter') doGuess(); });
}
function startSnake(container){
  _activeMini.id = 'snake';
  const c = document.createElement('canvas');
  c.width = 120; c.height = 120; c.style.background = '#111'; c.style.imageRendering = 'pixelated'; c.style.border = '2px solid var(--accent)'; c.style.display = 'block'; c.style.margin = '6px auto';
  container.appendChild(c);
  const sctx = c.getContext('2d');
  const cols = 12, rows = 12, cell = 10;
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
      state.mood = Math.min(100, state.mood + 5);
      scoreDiv.textContent = 'Game Over! Score: ' + score + ' (+5 mood)';
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
  
  _activeMini.interval = setInterval(step, 140);
  draw();
}
function startWalk(container){
  _activeMini.id = 'walk';
  container.innerHTML = '<div style="margin-bottom:8px">Take a short walk to calm Nibbie.</div><div id="walkBar" style="width:220px;height:14px;background:#222;border:2px solid #000;border-radius:6px;overflow:hidden"><div id="walkFill" style="height:100%;width:0;background:var(--accent)"></div></div><div style="margin-top:8px"><button id="walkStart">Start Walk</button></div>';
  const start = container.querySelector('#walkStart'); const fill = container.querySelector('#walkFill');
  start.addEventListener('click', ()=>{ start.disabled = true; let pct = 0; const t = 3000; const stepMS = 50; const stepAmt = (stepMS / t) * 100; _activeMini.interval = setInterval(()=>{ pct += stepAmt; fill.style.width = pct + '%'; if (pct >= 100){ clearInterval(_activeMini.interval); _activeMini.interval = null; state.mood = Math.min(100, state.mood + 8); state.boredom = Math.max(0, state.boredom - 10); const done = document.createElement('div'); done.textContent = 'Walk finished! +8 mood -10 boredom'; container.appendChild(done); } }, stepMS); });
}
function startTrampoline(container){
  _activeMini.id = 'trampoline';
  container.innerHTML = '<div style="margin-bottom:8px">Tap to bounce! Score increases with each successful bounce.</div><div id="bounceArea" style="width:220px;height:120px;background:#081;padding:8px;display:flex;align-items:flex-end;justify-content:center;position:relative"><div id="tib" style="width:40px;height:40px;background:#fff;border-radius:50%"></div></div><div style="margin-top:8px">Score: <span id="score">0</span></div>';
  const ball = container.querySelector('#tib'); const scoreEl = container.querySelector('#score'); let score = 0; let vy = 0; let y = 0; let running = true;
  function render(){ if (!running) return; y += vy; vy += 1.2; if (y > 60){ y = 60; vy = -12; score++; scoreEl.textContent = score; } ball.style.transform = `translateY(${-y}px)`; }
  const iv = setInterval(render, 30); _activeMini.interval = iv;
  container.querySelector('#bounceArea').addEventListener('click', ()=>{ vy = Math.max(-18, vy - 8); });
  setTimeout(()=>{ running = false; clearInterval(iv); const d = document.createElement('div'); d.textContent = 'Time! Score: ' + score; container.appendChild(d); state.mood = Math.min(100, state.mood + Math.min(10, Math.floor(score/2))); }, 8000);
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
  if (chargeCooldownInterval) clearInterval(chargeCooldownInterval);
  
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
    if (chargeCooldownInterval) clearInterval(chargeCooldownInterval);
    chargeCooldown.classList.add('hidden');
    chargeBtn.disabled = false;
  } else {
    chargeCooldown.textContent = remaining + 's';
  }
}

// if assets were already cached and loaded synchronously, ensure loop starts
// if assets were already cached and loaded synchronously, ensure loop starts
if (NIBBIE.complete) requestAnimationFrame(loop);

// initialize pixel hunger UI
initPixelBar(hungerPixel, state.hunger);
initPixelBar(energyPixel, state.energy);
initPixelBar(cyberPixel, state.cyberpsychosis);
initPixelBar(boredomPixel, state.boredom);

