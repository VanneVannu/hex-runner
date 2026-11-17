/* ===================================================
   HEX RUNNER // MOTOR ARCADE + IA + AUDIO (SECTOR 2 LIMPIO)
   =================================================== */

const canvas = document.getElementById('lienzo-mainframe');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 30;
const COLS = 20;
const ROWS = 18;

canvas.width = COLS * TILE_SIZE;  // 600px
canvas.height = ROWS * TILE_SIZE; // 540px

let gameLoop = null;
let isPaused = false;
let isGameOver = false;
let score = 0;
let vidas = 3;
let nivelActual = 1;
let zeroDayTimer = 0;
let velocidadEnemigoActual = 2.0;

// 1 = Muro PCB, 0 = Camino vacío, 2 = Bit, 3 = Zero-Day Exploit, 4 = Portal lateral
const mapasBase = [
  // SECTOR 1
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,3,1],
    [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
    [1,2,1,1,2,1,1,1,2,2,2,2,1,1,1,2,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,2,1],
    [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
    [1,1,1,1,2,1,1,1,0,0,0,0,1,1,1,2,1,1,1,1],
    [4,0,0,0,2,0,0,0,0,0,0,0,0,0,0,2,0,0,0,4],
    [1,1,1,1,2,1,1,1,0,0,0,0,1,1,1,2,1,1,1,1],
    [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
    [1,2,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,0,2,2,1,1,1,2,1,1,2,1],
    [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
    [1,3,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,3,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ],
  // SECTOR 2 (100% Abierto y conectado, sin celdas aisladas)
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,1],
    [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,2,1],
    [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
    [1,1,1,1,2,1,1,1,0,0,0,0,1,1,1,2,1,1,1,1],
    [4,0,0,0,2,0,0,0,0,0,0,0,0,0,0,2,0,0,0,4],
    [1,1,1,1,2,1,1,1,0,0,0,0,1,1,1,2,1,1,1,1],
    [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
    [1,2,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,2,2,2,1,1,1,2,1,1,2,1],
    [1,2,1,1,2,1,1,1,2,0,2,2,1,1,1,2,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ]
];

let gridActual = [];
let bitsRestantes = 0;

let player = {
  x: 9 * TILE_SIZE,
  y: 13 * TILE_SIZE,
  vx: 0,
  vy: 0,
  nextVx: 0,
  nextVy: 0,
  speed: 2.5
};

let antivirus = [];

let audioCtx = null;

function iniciarAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function sonidoBit(esZeroDay = false) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = esZeroDay ? 'square' : 'sine';
  osc.frequency.setValueAtTime(esZeroDay ? 300 : 600, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(esZeroDay ? 900 : 1100, audioCtx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

function sonidoEliminarAntivirus() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(800, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.25);

  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.25);
}

function iniciarJuego() {
  iniciarAudio();
  if (document.activeElement) document.activeElement.blur();

  const diff = document.getElementById('select-diff').value;
  velocidadEnemigoActual = 2.0;
  if (diff === 'facil') velocidadEnemigoActual = 1.5;
  if (diff === 'dificil') velocidadEnemigoActual = 2.4;

  score = 0;
  vidas = 3;
  nivelActual = 1;
  isGameOver = false;
  isPaused = false;

  document.getElementById('btn-pause').innerText = '[ PAUSA ]';
  document.getElementById('menu-inicio').classList.add('oculto');
  document.getElementById('escenario-juego').classList.remove('oculto');

  cargarNivel(velocidadEnemigoActual);
  clearInterval(gameLoop);
  gameLoop = setInterval(actualizarJuego, 1000 / 60);
}

function cargarNivel(velBase = 2.0) {
  const plantilla = mapasBase[(nivelActual - 1) % mapasBase.length];
  gridActual = plantilla.map(fila => [...fila]);
  bitsRestantes = 0;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (gridActual[r][c] === 2 || gridActual[r][c] === 3) {
        bitsRestantes++;
      }
    }
  }

  reiniciarPosiciones(velBase);
  actualizarHUD();
}

function reiniciarPosiciones(velBase = 2.0) {
  player.x = 9 * TILE_SIZE;
  player.y = 13 * TILE_SIZE;
  player.vx = 0;
  player.vy = 0;
  player.nextVx = 0;
  player.nextVy = 0;
  zeroDayTimer = 0;

  antivirus = [
    { nombre: 'FIREWALL', x: 9 * TILE_SIZE, y: 7 * TILE_SIZE, vx: velBase, vy: 0, color: '#ff3355', speed: velBase, tipo: 'directo' },
    { nombre: 'SCANNER', x: 10 * TILE_SIZE, y: 7 * TILE_SIZE, vx: -velBase, vy: 0, color: '#d946ef', speed: velBase, tipo: 'emboscada' },
    { nombre: 'TRACER', x: 8 * TILE_SIZE, y: 8 * TILE_SIZE, vx: 0, vy: -velBase, color: '#00f3ff', speed: velBase * 0.95, tipo: 'aleatorio' },
    { nombre: 'QUARANTINE', x: 11 * TILE_SIZE, y: 8 * TILE_SIZE, vx: 0, vy: -velBase, color: '#f97316', speed: velBase * 0.9, tipo: 'timido' }
  ];
}

window.addEventListener('keydown', (e) => {
  const teclasJuego = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
  if (teclasJuego.includes(e.key)) {
    e.preventDefault();
  }

  if (isPaused || isGameOver) return;
  const s = player.speed;

  if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') { player.nextVx = 0; player.nextVy = -s; }
  if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') { player.nextVx = 0; player.nextVy = s; }
  if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') { player.nextVx = -s; player.nextVy = 0; }
  if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') { player.nextVx = s; player.nextVy = 0; }
});

function puedeMoverse(x, y) {
  const margen = 4;
  const esquinas = [
    { c: Math.floor((x + margen) / TILE_SIZE), r: Math.floor((y + margen) / TILE_SIZE) },
    { c: Math.floor((x + TILE_SIZE - margen) / TILE_SIZE), r: Math.floor((y + margen) / TILE_SIZE) },
    { c: Math.floor((x + margen) / TILE_SIZE), r: Math.floor((y + TILE_SIZE - margen) / TILE_SIZE) },
    { c: Math.floor((x + TILE_SIZE - margen) / TILE_SIZE), r: Math.floor((y + TILE_SIZE - margen) / TILE_SIZE) }
  ];

  for (let p of esquinas) {
    if (p.r < 0 || p.r >= ROWS) return false;
    if (p.c < 0 || p.c >= COLS) continue;
    if (gridActual[p.r][p.c] === 1) return false;
  }
  return true;
}

function actualizarJuego() {
  if (isPaused || isGameOver) return;

  if (zeroDayTimer > 0) zeroDayTimer--;

  if (player.nextVx !== 0 || player.nextVy !== 0) {
    let testX = player.x;
    let testY = player.y;

    if (player.nextVy !== 0) {
      const colCercana = Math.round(player.x / TILE_SIZE) * TILE_SIZE;
      if (Math.abs(player.x - colCercana) <= 8) testX = colCercana;
    }
    if (player.nextVx !== 0) {
      const filaCercana = Math.round(player.y / TILE_SIZE) * TILE_SIZE;
      if (Math.abs(player.y - filaCercana) <= 8) testY = filaCercana;
    }

    if (puedeMoverse(testX + player.nextVx, testY + player.nextVy)) {
      player.x = testX;
      player.y = testY;
      player.vx = player.nextVx;
      player.vy = player.nextVy;
    }
  }

  if (puedeMoverse(player.x + player.vx, player.y + player.vy)) {
    player.x += player.vx;
    player.y += player.vy;
  } else {
    player.x = Math.round(player.x / TILE_SIZE) * TILE_SIZE;
    player.y = Math.round(player.y / TILE_SIZE) * TILE_SIZE;
  }

  if (player.x < -TILE_SIZE / 2) player.x = canvas.width - TILE_SIZE / 2;
  if (player.x > canvas.width - TILE_SIZE / 2) player.x = -TILE_SIZE / 2;

  const col = Math.floor((player.x + TILE_SIZE / 2) / TILE_SIZE);
  const row = Math.floor((player.y + TILE_SIZE / 2) / TILE_SIZE);

  if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
    const celda = gridActual[row][col];
    if (celda === 2) {
      gridActual[row][col] = 0;
      score += 10;
      bitsRestantes--;
      sonidoBit(false);
    } else if (celda === 3) {
      gridActual[row][col] = 0;
      score += 50;
      bitsRestantes--;
      zeroDayTimer = 420;
      sonidoBit(true);
    }
  }

  if (bitsRestantes <= 0) {
    nivelActual++;
    if (nivelActual > mapasBase.length) {
      isGameOver = true;
      alert(`¡INFILTRACIÓN COMPLETADA! PUNTUACIÓN FINAL: ${score}`);
      volverAlMenu();
      return;
    }
    cargarNivel(velocidadEnemigoActual + 0.2);
  }

  moverAntivirus();
  verificarColisiones();
  actualizarHUD();
  renderizar();
}

function moverAntivirus() {
  const dirs = [
    { vx: 0, vy: -1 },
    { vx: 0, vy: 1 },
    { vx: -1, vy: 0 },
    { vx: 1, vy: 0 }
  ];

  for (let av of antivirus) {
    const velActual = zeroDayTimer > 0 ? av.speed * 0.6 : av.speed;

    const alineadoX = Math.abs(av.x % TILE_SIZE) < velActual;
    const alineadoY = Math.abs(av.y % TILE_SIZE) < velActual;

    if ((alineadoX && alineadoY) || !puedeMoverse(av.x + av.vx, av.y + av.vy)) {
      if (alineadoX && alineadoY) {
        av.x = Math.round(av.x / TILE_SIZE) * TILE_SIZE;
        av.y = Math.round(av.y / TILE_SIZE) * TILE_SIZE;
      }

      let targetX = player.x;
      let targetY = player.y;

      if (zeroDayTimer > 0) {
        targetX = canvas.width - player.x;
        targetY = canvas.height - player.y;
      } else if (av.tipo === 'emboscada') {
        targetX = player.x + player.vx * 20;
        targetY = player.y + player.vy * 20;
      } else if (av.tipo === 'timido' && Math.hypot(av.x - player.x, av.y - player.y) < 120) {
        targetX = 0;
        targetY = canvas.height;
      }

      let mejorDir = null;
      let mejorDist = Infinity;

      for (let d of dirs) {
        if (d.vx * velActual === -av.vx && d.vy * velActual === -av.vy) continue;

        const testX = av.x + d.vx * velActual;
        const testY = av.y + d.vy * velActual;

        if (puedeMoverse(testX, testY)) {
          let dist = Math.hypot(testX - targetX, testY - targetY);
          if (av.tipo === 'aleatorio') dist += (Math.random() - 0.5) * 150;

          if (dist < mejorDist) {
            mejorDist = dist;
            mejorDir = d;
          }
        }
      }

      if (mejorDir) {
        av.vx = mejorDir.vx * velActual;
        av.vy = mejorDir.vy * velActual;
      } else {
        av.vx = -av.vx;
        av.vy = -av.vy;
      }
    }

    av.x += av.vx;
    av.y += av.vy;

    if (av.x < -TILE_SIZE / 2) av.x = canvas.width - TILE_SIZE / 2;
    if (av.x > canvas.width - TILE_SIZE / 2) av.x = -TILE_SIZE / 2;
  }
}

function verificarColisiones() {
  for (let av of antivirus) {
    const dist = Math.hypot(player.x - av.x, player.y - av.y);
    if (dist < TILE_SIZE * 0.7) {
      if (zeroDayTimer > 0) {
        score += 200;
        sonidoEliminarAntivirus();
        av.x = 9 * TILE_SIZE;
        av.y = 7 * TILE_SIZE;
      } else {
        vidas--;
        if (vidas <= 0) {
          isGameOver = true;
          alert(`SISTEMA BLOQUEADO // GAME OVER\nPUNTUACIÓN: ${score}`);
          volverAlMenu();
          return;
        }
        reiniciarPosiciones(av.speed);
        break;
      }
    }
  }
}

function renderizar() {
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const val = gridActual[r][c];
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;

      if (val === 1) {
        ctx.fillStyle = '#064e3b';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      } else if (val === 2) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (val === 3) {
        const pulso = Math.sin(Date.now() * 0.01) * 2 + 7;
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, pulso, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  // Jugador
  ctx.fillStyle = zeroDayTimer > 0 ? '#34d399' : '#f8fafc';
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(player.x + TILE_SIZE / 2, player.y + TILE_SIZE / 2, TILE_SIZE / 2 - 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Antivirus
  for (let av of antivirus) {
    const esVulnerable = zeroDayTimer > 0;
    ctx.fillStyle = esVulnerable ? '#38bdf8' : av.color;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.arc(av.x + TILE_SIZE / 2, av.y + TILE_SIZE / 2 - 2, TILE_SIZE / 2 - 4, Math.PI, 0);
    ctx.lineTo(av.x + TILE_SIZE - 4, av.y + TILE_SIZE - 4);
    ctx.lineTo(av.x + 4, av.y + TILE_SIZE - 4);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(av.x + 8, av.y + 10, 4, 4);
    ctx.fillRect(av.x + 17, av.y + 10, 4, 4);
  }
}

function actualizarHUD() {
  document.getElementById('nivel-val').innerText = `SECTOR ${nivelActual}/${mapasBase.length}`;
  document.getElementById('score-val').innerText = score.toString().padStart(4, '0');
  document.getElementById('vidas-val').innerText = `${vidas} LIVES`;
}

function volverAlMenu() {
  clearInterval(gameLoop);
  document.getElementById('escenario-juego').classList.add('oculto');
  document.getElementById('menu-inicio').classList.remove('oculto');
}

window.onload = () => {
  document.getElementById('btn-start').addEventListener('click', iniciarJuego);
  document.getElementById('btn-pause').addEventListener('click', (e) => {
    e.target.blur();
    isPaused = !isPaused;
    document.getElementById('btn-pause').innerText = isPaused ? '[ REANUDAR ]' : '[ PAUSA ]';
  });
  document.getElementById('btn-restart').addEventListener('click', iniciarJuego);
  document.getElementById('btn-menu').addEventListener('click', volverAlMenu);
};
