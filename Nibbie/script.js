const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');
const feedBtn = document.getElementById('feedBtn');
const playBtn = document.getElementById('playBtn');
const hungerMeter = document.getElementById('hunger');
const hungerPixel = document.getElementById('hungerPixel');

const SPRITE = new Image();
SPRITE.src = 'assets/sprites.png'; // sprite sheet: frames across

let state = {
  hunger: 80,
  mood: 60,
  energy: 90,
  frame: 0,
  lastFrameTime: 0,
  animSpeed: 150, // ms per frame
  mode: 'idle' // idle, eat, play, sleep
};

function update(dt) {
  // decay values over time
  state.hunger = Math.max(0, state.hunger - dt * 0.005);
  state.mood = Math.max(0, state.mood - dt * 0.003);
  state.energy = Math.max(0, state.energy - dt * 0.002);

  // simple auto-mode selection
  if (state.hunger < 30) state.mode = 'hungry';
  else state.mode = 'idle';

  if (hungerMeter) hungerMeter.value = Math.round(state.hunger);
  if (typeof moodMeter !== 'undefined' && moodMeter) moodMeter.value = Math.round(state.mood);
  if (typeof energyMeter !== 'undefined' && energyMeter) energyMeter.value = Math.round(state.energy);
  // update pixelated hunger bar
  updateHungerPixel(state.hunger);
}

function initPixelHunger(){
  if(!hungerPixel) return;
  hungerPixel.innerHTML = '';
  for(let i=0;i<10;i++){
    const s = document.createElement('span');
    s.className = 'step';
    hungerPixel.appendChild(s);
  }
  updateHungerPixel(state.hunger);
}

function updateHungerPixel(value){
  if(!hungerPixel) return;
  const steps = hungerPixel.querySelectorAll('.step');
  const filled = Math.round((value/100) * 10);
  steps.forEach((el, idx) => el.classList.toggle('filled', idx < filled));
}

function draw(ts) {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // draw background ground
  ctx.fillStyle = '#8ad35b';
  ctx.fillRect(0,240,320,80);

  // sprite rendering (example: 64x64 frames)
  const fw = 64, fh = 64;
  const sx = (state.frame % 4) * fw; // 4 frames per row
  const sy = 0; // row 0 = idle
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(SPRITE, sx, sy, fw, fh, 128, 128, fw*2, fh*2);
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
  state.hunger = Math.min(100, state.hunger + 20);
  state.mood = Math.min(100, state.mood + 5);
  state.mode = 'eat';
  setTimeout(()=> state.mode='idle', 1000);
  updateHungerPixel(state.hunger);
});

playBtn.addEventListener('click', () => {
  state.mood = Math.min(100, state.mood + 20);
  state.energy = Math.max(0, state.energy - 10);
  state.mode = 'play';
  setTimeout(()=> state.mode='idle', 1200);
});

// start when sprite loaded
SPRITE.onload = () => requestAnimationFrame(loop);

// initialize pixel hunger UI
initPixelHunger();

