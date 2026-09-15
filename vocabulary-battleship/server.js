/**
 * Vocab Battleship — Server
 */
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://lingualplanet.com,http://localhost:3000').split(',').map(v => v.trim());
const io = new Server(server, { cors: { origin: allowedOrigins, credentials: true } });
app.use(express.json());
const ADMIN_PASSWORD = process.env.TEACHER_ADMIN_PASSWORD || '';
function adminAuthorized(header = '') {
  if (!ADMIN_PASSWORD) return true;
  if (!header.startsWith('Basic ')) return false;
  try { const [,password] = Buffer.from(header.slice(6),'base64').toString().split(':'); return password === ADMIN_PASSWORD; } catch (_) { return false; }
}
app.get('/teacher.html',(req,res,next)=>{
  if (adminAuthorized(req.get('authorization'))) return next();
  res.set('WWW-Authenticate','Basic realm="Vocab Battleship Teacher"').status(401).send('Teacher sign-in required');
});
app.use(express.static(path.join(__dirname, 'public')));

// ── State ─────────────────────────────────────────────────────────────────────
let gameSettings = {
  vocabX: ['cardiology','dermatitis','gastritis','neuralgia','hematology',
           'bronchitis','arthroscopy','myalgia','thoracotomy','carcinoma',
           'adenectomy','otoscopy','optometry','pulmonary','histology'],
  vocabY: ['bradycardia','hyperemia','bilateral','neuroma','macrocyte',
           'adenoma','arthritis','dermatosis','anemia','lymphoma',
           'myopathy','encephalitis','gynecology','adenitis','bursitis'],
  defsX: ['study of the heart and its diseases','inflammation of the skin','inflammation of the stomach lining','sharp pain along a nerve','study of blood and blood disorders','inflammation of the bronchial tubes','joint examination using a small camera','muscle pain or tenderness','surgical incision into the chest cavity','cancer arising from epithelial tissue','surgical removal of a gland','examination of the ear canal','eye examination and vision care','relating to the lungs','study of tissues under a microscope'],
  defsY: ['abnormally slow heart rate','excess blood in a body part','affecting both sides of the body','benign tumor of nerve tissue','abnormally large red blood cell','benign tumor of glandular tissue','inflammation of one or more joints','any non-inflammatory skin disease','deficiency of red blood cells','cancer of the lymphatic system','disease affecting muscle tissue','inflammation of the brain','study of the female reproductive system','inflammation of a gland or lymph node','inflammation of a fluid-filled sac near a joint'],
  timerEnabled: false, showPrompt: true, hardMode: false, timerSeconds: 60,
  speechEnabled: true, preferredVoice: 'Google US English', showDefs: true,
};

const students = {}; // id → { id, name, className, socketId, roomId }
const rooms = {};    // id → room object
let waitingQueue = [];
const activityLog = [];
const BOARD_SIZE = 10;
const BOT_PREFIX = 'bot_';
const INTEGRATION_SECRET = process.env.LINGUAL_PLANET_GAME_SECRET || '';

function signLaunch(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', INTEGRATION_SECRET).update(body).digest('base64url');
  return body + '.' + signature;
}

function verifyLaunch(token) {
  if (!INTEGRATION_SECRET || !token) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  const expected = crypto.createHmac('sha256', INTEGRATION_SECRET).update(body).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (!payload.exp || Date.now() > payload.exp) return null;
  return payload;
}

// ── Room factory ──────────────────────────────────────────────────────────────
function matchmakingScope(student) {
  if (student?.role === 'student' && student.classroomId) return `classroom:${student.classroomId}`;
  return 'individual:public';
}

function makeRoom(pair, mode = 'multiplayer', scope = null) {
  const roomId = 'room_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
  const room = {
    id: roomId, players: pair, mode, matchmakingScope:scope || matchmakingScope(students[pair[0]]),
    phase: 'paired',
    beginClicked: {},
    placingDone: {},
    grids: {},
    shipPositions: {},
    shipHealth: {},
    attackGrid: {},
    currentAttackerIdx: 0,
    pendingAttack: null,
    scores: {},
    powerups: {},
    ...(() => {
      const rx = pickWords(gameSettings.vocabX, gameSettings.defsX);
      const ry = pickWords(gameSettings.vocabY, gameSettings.defsY);
      return { vocabX: rx.terms, defsX: rx.defs, vocabY: ry.terms, defsY: ry.defs };
    })(),
  };
  pair.forEach(pid => {
    room.beginClicked[pid] = false;
    room.placingDone[pid] = false;
    room.grids[pid] = Array.from({length:BOARD_SIZE},()=>Array(BOARD_SIZE).fill(0));
    room.shipPositions[pid] = {};
    room.shipHealth[pid] = {battleship:5,destroyer:4,cruiser:3,sub1:2,sub2:2};
    room.attackGrid[pid] = Array.from({length:BOARD_SIZE},()=>Array(BOARD_SIZE).fill(0));
    room.scores[pid] = {hits:0,misses:0,sunk:0};
    room.powerups[pid] = {radar:0,torpedo:0};
    if (students[pid]) students[pid].roomId = roomId;
  });
  rooms[roomId] = room;
  return room;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickWords(pool, defs) {
  if (pool.length <= BOARD_SIZE) return { terms: [...pool], defs: defs ? [...defs] : pool.map(()=>'') };
  const indices = shuffle([...Array(pool.length).keys()]).slice(0, BOARD_SIZE);
  return {
    terms: indices.map(i => pool[i]),
    defs: defs ? indices.map(i => defs[i] || '') : indices.map(()=>'')
  };
}

function deleteRoom(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  if (room.vocabRefreshInterval) clearInterval(room.vocabRefreshInterval);
  delete rooms[roomId];
}

function autoFleet() {
  const grid = Array.from({length:BOARD_SIZE},()=>Array(BOARD_SIZE).fill(0));
  const positions = {};
  const ships = [['battleship',5],['destroyer',4],['cruiser',3],['sub1',2],['sub2',2]];
  for (const [name,size] of ships) {
    let placed = false;
    while (!placed) {
      const horizontal = Math.random() > .5;
      const row = Math.floor(Math.random() * (horizontal ? BOARD_SIZE : BOARD_SIZE-size+1));
      const col = Math.floor(Math.random() * (horizontal ? BOARD_SIZE-size+1 : BOARD_SIZE));
      const cells = Array.from({length:size},(_,i)=>horizontal?[row,col+i]:[row+i,col]);
      if (cells.every(([r,c])=>grid[r][c]===0)) {
        cells.forEach(([r,c])=>grid[r][c]=1);
        positions[name] = new Set(cells.map(([r,c])=>r+','+c));
        placed = true;
      }
    }
  }
  return { grid, positions };
}

function createSoloRoom(studentId) {
  const botId = BOT_PREFIX + crypto.randomBytes(4).toString('hex');
  students[botId] = { id:botId, name:'Captain Lexi', className:'Solo practice', socketId:null, roomId:null, isBot:true };
  const room = makeRoom([studentId, botId], 'solo');
  const fleet = autoFleet();
  room.grids[botId] = fleet.grid;
  room.shipPositions[botId] = fleet.positions;
  room.beginClicked[botId] = true;
  room.placingDone[botId] = true;
  return room;
}

function getSock(pid) {
  const s = students[pid];
  if (!s?.socketId) return null;
  return io.sockets.sockets.get(s.socketId) || null;
}

function identifyShip(room, defenderId, row, col) {
  const positions = room.shipPositions[defenderId];
  if (positions) {
    const key = row+','+col;
    for (const [name, cells] of Object.entries(positions)) {
      if (cells.has(key)) return name;
    }
  }
  const order = ['battleship','destroyer','cruiser','sub1','sub2'];
  return order.find(s => (room.shipHealth[defenderId][s]||0) > 0) || null;
}

function awardPowerup(room, attackerId, sunkCount) {
  room.powerups[attackerId].radar++;
  const sock = getSock(attackerId);
  if (sock) {
    sock.emit('powerupEarned', {reason:`Ship sunk! +1 Radar 📡 (×${room.powerups[attackerId].radar})`});
    if (sunkCount === 3) {
      room.powerups[attackerId].torpedo = 1;
      sock.emit('powerupEarned', {reason:'3 ships sunk — Torpedo unlocked! 🚀'});
    }
  }
}

// Send each player a personalised view of the room
function sendRoomState(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  room.players.forEach(pid => {
    const sock = getSock(pid);
    if (!sock) return;
    const oppIds = room.players.filter(p => p !== pid);
    const oppId  = oppIds[0];
    sock.emit('roomState', {
      roomId,
      phase: room.phase,
      players: room.players.map(p => ({
        id: p, name: students[p]?.name||p,
        className: students[p]?.className||'',
        isYou: p === pid,
        score: room.scores[p],
        powerups: room.powerups[p],
      })),
      myGrid: room.grids[pid],
      attackGrid: room.attackGrid[pid],
      opponentAttackGrid: oppId ? room.attackGrid[oppId] : null,
      currentAttackerId: room.players[room.currentAttackerIdx],
      pendingAttack: room.pendingAttack,
      vocabX: room.vocabX,
      vocabY: room.vocabY,
      defsX: room.defsX || [],
      defsY: room.defsY || [],
      showDefs: gameSettings.showDefs !== false,
      settings: gameSettings,
    });
  });
}

function dashboardUpdate() {
  io.to('teacher').emit('dashboardUpdate', {
    rooms: Object.values(rooms).map(r => ({
      id: r.id, phase: r.phase,
      players: r.players.map(p=>({id:p,name:students[p]?.name||p,score:r.scores[p]})),
      totalShips: 5 * r.players.length,
      sunkShips: r.players.reduce((a,p)=>a+Object.values(r.shipHealth[p]||{}).filter(v=>v<=0).length,0),
    })),
    waiting: waitingQueue.map(id=>({id,name:students[id]?.name||id})),
    activityLog: activityLog.slice(-50),
    settings: gameSettings,
    studentCount: Object.keys(students).length,
  });
}

function doPairing(scope) {
  const queue = waitingQueue.filter(id=>matchmakingScope(students[id])===scope);
  const otherWaiting = waitingQueue.filter(id=>matchmakingScope(students[id])!==scope);
  const newRooms = [];
  while (queue.length >= 2) {
    const pair = queue.splice(0, 2);
    const room = makeRoom(pair);
    newRooms.push(room.id);
  }
  waitingQueue = [...otherWaiting, ...queue];
  return newRooms;
}

function resolveAttack(room, attackerId, defenderId, row, col) {
  if (!room || !room.pendingAttack) return;
  const result = room.grids[defenderId][row][col] === 1;
  room.attackGrid[attackerId][row][col] = result ? 2 : 1;
  if (result) {
    room.scores[attackerId].hits++;
    const ship = identifyShip(room, defenderId, row, col);
    if (ship) {
      room.shipHealth[defenderId][ship]--;
      if (room.shipHealth[defenderId][ship] <= 0) {
        room.scores[attackerId].sunk++;
        awardPowerup(room, attackerId, room.scores[attackerId].sunk);
        io.to(room.id).emit('shipSunk', { attackerId, defenderId, shipName:ship });
      }
    }
  } else room.scores[attackerId].misses++;

  activityLog.push({ time:new Date().toISOString(), attackerName:students[attackerId]?.name, wordX:room.vocabX[col], wordY:room.vocabY[row], result:result?'hit':'miss', room:room.id });
  room.pendingAttack = null;
  io.to(room.id).emit('clearPrompts');
  if (Object.values(room.shipHealth[defenderId]).every(v=>v<=0)) {
    room.phase = 'finished';
    io.to(room.id).emit('gameOver', { winnerId:attackerId, winnerName:students[attackerId]?.name, loserName:students[defenderId]?.name });
    dashboardUpdate(); sendRoomState(room.id); return;
  }
  room.currentAttackerIdx = (room.currentAttackerIdx + 1) % room.players.length;
  const nextAttackerId = room.players[room.currentAttackerIdx];
  const nextDefenderId = room.players[(room.currentAttackerIdx + 1) % room.players.length];
  io.to(room.id).emit('attackResult', { attackerId, defenderId, row, col, result, nextAttackerId, nextDefenderId });
  sendRoomState(room.id); dashboardUpdate();
  if (students[nextAttackerId]?.isBot) setTimeout(()=>runBotTurn(room.id), 900);
}

function runBotTurn(roomId) {
  const room = rooms[roomId];
  if (!room || room.phase !== 'playing') return;
  const attackerId = room.players[room.currentAttackerIdx];
  if (!students[attackerId]?.isBot) return;
  const defenderId = room.players.find(id=>id!==attackerId);
  const options = [];
  for (let r=0;r<BOARD_SIZE;r++) for (let c=0;c<BOARD_SIZE;c++) if (room.attackGrid[attackerId][r][c]===0) options.push([r,c]);
  if (!options.length) return;
  const [row,col] = options[Math.floor(Math.random()*options.length)];
  room.pendingAttack = { attackerId, defenderId, row, col };
  getSock(defenderId)?.emit('botThinking', { wordX:room.vocabX[col], wordY:room.vocabY[row] });
  setTimeout(()=>resolveAttack(room, attackerId, defenderId, row, col), 900);
}

// ── Socket events ─────────────────────────────────────────────────────────────
io.on('connection', socket => {

  const adminEvents = new Set(['teacherJoin','updateSettings','triggerPairing','pauseAll','resumeAll','announce','forceReconnectStudent','moveStudent','manualPair','resetAll','resetRoom','endRoom','endAll']);
  socket.use(([event],next)=>{
    if (!adminEvents.has(event) || adminAuthorized(socket.handshake.headers.authorization || '')) return next();
    next(new Error('Teacher authorization required'));
  });

  // Teacher
  socket.on('teacherJoin', () => { socket.join('teacher'); socket.emit('settings', gameSettings); dashboardUpdate(); });
  socket.on('updateSettings', data => { Object.assign(gameSettings, data); Object.keys(rooms).forEach(rid=>io.to(rid).emit('settingsUpdated',gameSettings)); dashboardUpdate(); socket.emit('settingsSaved'); });
  socket.on('triggerPairing', () => {
    const scopes = [...new Set(waitingQueue.map(id=>matchmakingScope(students[id])))];
    scopes.flatMap(scope=>doPairing(scope)).forEach(rid => {
      const room = rooms[rid];
      room.players.forEach(pid => {
        const s = students[pid]; if (!s?.socketId) return;
        const ps = getSock(pid); if (!ps) return;
        ps.join(rid);
        ps.emit('paired', { roomId:rid, opponents: room.players.filter(p=>p!==pid).map(p=>({name:students[p]?.name,id:p,className:students[p]?.className})) });
      });
      sendRoomState(rid);
    });
    dashboardUpdate();
  });
  socket.on('pauseAll', () => io.emit('gamePaused'));
  socket.on('resumeAll', () => io.emit('gameResumed'));
  socket.on('announce', msg => io.emit('announcement', msg));

  // ── Teacher forces a student back into their original room ──
  socket.on('forceReconnectStudent', ({ studentId }) => {
    const student = students[studentId];
    if (!student) { socket.emit('teacherMsg', `❌ Student ID "${studentId}" not found`); return; }
    const rid = student.roomId;
    if (!rid || !rooms[rid]) { socket.emit('teacherMsg', `❌ ${student.name} has no active room — use Manual Pair instead`); return; }
    const sock = getSock(studentId);
    if (!sock) { socket.emit('teacherMsg', `❌ ${student.name} is not connected yet — ask them to reload the page`); return; }
    sock.join(rid);
    rooms[rid].beginClicked[studentId] = true;
    sendRoomState(rid);
    const partners = rooms[rid].players.filter(p=>p!==studentId).map(p=>students[p]?.name).join(' & ');
    socket.emit('teacherMsg', `✅ ${student.name} reconnected with ${partners}`);
  });

  // ── Teacher moves one student out of a trio into a new pair ──
  socket.on('moveStudent', ({ fromStudentId, toStudentId }) => {
    const fromStudent = students[fromStudentId];
    const toStudent = students[toStudentId];
    if (!fromStudent) { socket.emit('teacherMsg', `❌ Student ${fromStudentId} not found`); return; }
    if (!toStudent) { socket.emit('teacherMsg', `❌ Student ${toStudentId} not found`); return; }
    if (matchmakingScope(fromStudent) !== matchmakingScope(toStudent)) { socket.emit('teacherMsg', '❌ Students must belong to the same classroom matchmaking pool'); return; }

    // Remove fromStudent from their current room
    const oldRid = fromStudent.roomId;
    if (oldRid && rooms[oldRid]) {
      const oldRoom = rooms[oldRid];
      // Notify remaining players
      io.to(oldRid).emit('playerMoved', { name: fromStudent.name, reason: 'Teacher moved this player to another game' });
      // Remove from room players list
      oldRoom.players = oldRoom.players.filter(p => p !== fromStudentId);
      // Clean up their data from the room
      delete oldRoom.grids[fromStudentId];
      delete oldRoom.shipPositions[fromStudentId];
      delete oldRoom.shipHealth[fromStudentId];
      delete oldRoom.attackGrid[fromStudentId];
      delete oldRoom.scores[fromStudentId];
      delete oldRoom.powerups[fromStudentId];
      delete oldRoom.beginClicked[fromStudentId];
      delete oldRoom.placingDone[fromStudentId];
      // Reset attacker index to be safe
      oldRoom.currentAttackerIdx = 0;
      oldRoom.pendingAttack = null;
      sendRoomState(oldRid);
    }
    fromStudent.roomId = null;

    // Remove toStudent from their current room if any
    const toRid = toStudent.roomId;
    if (toRid && rooms[toRid]) {
      io.to(toRid).emit('gameReset', { reason: 'Teacher reassigned this game' });
      rooms[toRid].players.forEach(pid => { if (students[pid]) students[pid].roomId = null; });
      deleteRoom(toRid);
    }
    toStudent.roomId = null;

    // Pair the two together
    const newRoom = makeRoom([fromStudentId, toStudentId]);
    [fromStudentId, toStudentId].forEach(pid => {
      const sock = getSock(pid);
      if (sock) {
        sock.join(newRoom.id);
        const opponents = [fromStudentId, toStudentId].filter(p=>p!==pid).map(p=>({
          name: students[p]?.name, id: p, className: students[p]?.className
        }));
        sock.emit('paired', { roomId: newRoom.id, opponents });
      }
    });
    sendRoomState(newRoom.id);
    socket.emit('teacherMsg', `✅ ${fromStudent.name} moved and paired with ${toStudent.name}`);
    dashboardUpdate();
  });

  // ── Teacher manually pairs two specific students ──
  socket.on('manualPair', ({ studentIds }) => {
    if (!studentIds || studentIds.length !== 2) {
      socket.emit('teacherMsg', '❌ Choose exactly 2 student IDs to pair');
      return;
    }
    // Validate all students exist and are connected
    const missing = studentIds.filter(id => !students[id]);
    if (missing.length > 0) {
      socket.emit('teacherMsg', `❌ Not found: ${missing.join(', ')}`);
      return;
    }
    if (matchmakingScope(students[studentIds[0]]) !== matchmakingScope(students[studentIds[1]])) {
      socket.emit('teacherMsg', '❌ Students must belong to the same classroom matchmaking pool');
      return;
    }
    // Remove students from any existing rooms
    studentIds.forEach(id => {
      const oldRid = students[id].roomId;
      if (oldRid && rooms[oldRid]) {
        io.to(oldRid).emit('gameReset', { reason: 'Teacher reassigned this game' });
        rooms[oldRid].players.forEach(pid => {
          if (!studentIds.includes(pid) && students[pid]) {
            students[pid].roomId = null;
            waitingQueue.push(pid);
          }
        });
        deleteRoom(oldRid);
      }
      students[id].roomId = null;
      // Remove from waiting queue if there
      waitingQueue = waitingQueue.filter(q => q !== id);
    });

    // Create new room for these specific students
    const room = makeRoom(studentIds);
    const names = studentIds.map(id => students[id]?.name).join(' & ');

    // Notify each student
    studentIds.forEach(pid => {
      const sock = getSock(pid);
      if (sock) {
        sock.join(room.id);
        const opponents = studentIds.filter(p=>p!==pid).map(p=>({
          name: students[p]?.name, id: p, className: students[p]?.className
        }));
        sock.emit('paired', { roomId: room.id, opponents });
        sendRoomState(room.id);
      }
    });

    socket.emit('teacherMsg', `✅ Manually paired: ${names}`);
    dashboardUpdate();
  });

  // ── Reset all games (teacher) ──
  socket.on('resetAll', () => {
    // Notify all students their game was reset
    io.emit('gameReset', { reason: 'Teacher reset all games' });
    // Clear all rooms and re-queue students
    Object.keys(rooms).forEach(rid => deleteRoom(rid));
    waitingQueue = [];
    // Clear student room assignments
    Object.values(students).forEach(s => { s.roomId = null; });
    dashboardUpdate();
    socket.emit('resetAllDone');
  });

  // ── Reset individual room ──
  socket.on('resetRoom', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    io.to(roomId).emit('gameReset', { reason: 'Teacher reset this game' });
    room.players.forEach(pid => { if (students[pid]) students[pid].roomId = null; });
    deleteRoom(roomId);
    dashboardUpdate();
  });

  // ── End game (declare no winner, return to login) ──
  socket.on('endGame', ({ roomId, studentId }) => {
    const room = rooms[roomId];
    if (!room) return;
    const name = students[studentId]?.name || 'A player';
    io.to(roomId).emit('gameEnded', { reason: `${name} ended the game` });
    room.players.forEach(pid => { if (students[pid]) students[pid].roomId = null; });
    deleteRoom(roomId);
    dashboardUpdate();
  });

  // ── Teacher end individual room ──
  socket.on('endRoom', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    io.to(roomId).emit('gameEnded', { reason: 'Teacher ended this game' });
    room.players.forEach(pid => { if (students[pid]) students[pid].roomId = null; });
    deleteRoom(roomId);
    dashboardUpdate();
  });

  // ── Teacher end ALL rooms ──
  socket.on('endAll', () => {
    io.emit('gameEnded', { reason: 'Teacher ended all games' });
    Object.keys(rooms).forEach(rid => {
      Object.values(students).forEach(s => { if (s.roomId === rid) s.roomId = null; });
      deleteRoom(rid);
    });
    waitingQueue = [];
    dashboardUpdate();
    socket.emit('endAllDone');
  });

  // ── Student requests reset of their own game ──
  socket.on('studentReset', ({ roomId, studentId }) => {
    const room = rooms[roomId];
    if (!room) return;
    io.to(roomId).emit('gameReset', { reason: `${students[studentId]?.name || 'A player'} reset the game` });
    room.players.forEach(pid => { if (students[pid]) students[pid].roomId = null; });
    deleteRoom(roomId);
    dashboardUpdate();
  });

  // ── Login / Reconnect ──
  socket.on('studentLogin', ({ studentId, name, className, mode = 'multiplayer', integrationToken }) => {
    let role = 'individual', classroomId = null, teacherId = null;
    if (integrationToken) {
      let launch;
      try { launch = verifyLaunch(integrationToken); } catch (_) { launch = null; }
      if (!launch) { socket.emit('loginError', { message:'This Lingual Planet game link has expired. Please launch the game again.' }); return; }
      studentId = String(launch.userId);
      name = launch.name || name;
      className = launch.className || className;
      role = launch.role || role;
      classroomId = launch.classroomId ? String(launch.classroomId) : null;
      teacherId = launch.teacherId ? String(launch.teacherId) : null;
      if (role === 'student' && !classroomId) { socket.emit('loginError', {message:'This student account is not connected to a classroom.'}); return; }
      // A teacher (or the platform owner/admin, who arrives with this role) is
      // never dropped into a class's student queue — but may still play, as an
      // individual: solo against Captain Lexi, or in the worldwide pool.
      if (role === 'teacher') { role = 'individual'; classroomId = null; teacherId = null; }
    }
    // Name is all that is required. A learner without a student number (any
    // individual) gets a generated id so they can still play.
    if (!name) { socket.emit('loginError', { message:'Please enter your name.' }); return; }
    if (!studentId) studentId = 'guest_' + Math.random().toString(36).slice(2, 10);
    const existing = students[studentId];

    if (existing) {
      // ── RECONNECT ──
      existing.socketId = socket.id;
      socket.emit('loginSuccess', { studentId, name: existing.name, className: existing.className });

      const rid = existing.roomId;
      const room = rid && rooms[rid];

      if (room) {
        socket.join(rid);
        // If game is already in placing or playing, mark them as beginClicked
        // so they don't get stuck on the partner screen
        if (room.phase !== 'paired') {
          room.beginClicked[studentId] = true;
        }
        // Send current state — client handles showing right screen based on phase
        sendRoomState(rid);

        // If there's a pending attack where this player is the defender, re-prompt
        if (room.pendingAttack && room.pendingAttack.defenderId === studentId) {
          const pa = room.pendingAttack;
          socket.emit('defendPrompt', {
            attackerName: students[pa.attackerId]?.name || pa.attackerId,
            wordX: rooms[rid]?.vocabX[pa.col] || gameSettings.vocabX[pa.col],
            wordY: rooms[rid]?.vocabY[pa.row] || gameSettings.vocabY[pa.row],
            row: pa.row, col: pa.col,
          });
        }
        // If this player was the attacker mid-turn, re-show their speak prompt
        if (room.pendingAttack && room.pendingAttack.attackerId === studentId) {
          const pa = room.pendingAttack;
          socket.emit('speakPrompt', {
            wordX: rooms[rid]?.vocabX[pa.col] || gameSettings.vocabX[pa.col],
            wordY: rooms[rid]?.vocabY[pa.row] || gameSettings.vocabY[pa.row],
            row: pa.row, col: pa.col,
          });
        }
        console.log(`[RECONNECT] ${name} (${studentId}) room:${rid} phase:${room.phase}`);
      } else {
        // Was waiting, re-queue
        if (!waitingQueue.includes(studentId)) waitingQueue.push(studentId);
        socket.emit('waitingForPair');
      }
    } else {
      // ── NEW LOGIN ──
      students[studentId] = { id:studentId, name, className, socketId:socket.id, roomId:null, mode, role, classroomId, teacherId };
      socket.emit('loginSuccess', { studentId, name, className });
      if (mode === 'solo') {
        const room = createSoloRoom(studentId);
        socket.join(room.id);
        socket.emit('paired', { roomId:room.id, opponents:[{id:room.players[1],name:'Captain Lexi',className:'Solo practice'}] });
        sendRoomState(room.id);
      } else {
        waitingQueue.push(studentId);
        socket.emit('waitingForPair');
      }

      const scope = matchmakingScope(students[studentId]);
      if (mode !== 'solo' && waitingQueue.filter(id=>matchmakingScope(students[id])===scope).length >= 2) {
        doPairing(scope).forEach(rid => {
          const room = rooms[rid];
          room.players.forEach(pid => {
            const ps = getSock(pid); if (!ps) return;
            ps.join(rid);
            ps.emit('paired', { roomId:rid, opponents: room.players.filter(p=>p!==pid).map(p=>({name:students[p]?.name,id:p,className:students[p]?.className})) });
          });
          sendRoomState(rid);
        });
      }
    }
    dashboardUpdate();
  });

  // ── Begin button ──
  socket.on('playerReady', ({ roomId, studentId }) => {
    const room = rooms[roomId]; if (!room) return;
    room.beginClicked[studentId] = true;
    if (room.players.every(p => room.beginClicked[p])) {
      room.phase = 'placing';
      sendRoomState(roomId);
    } else {
      socket.emit('waitingForPartnerReady');
    }
  });

  // ── Place ships ──
  socket.on('placeShips', ({ roomId, studentId, grid, shipData }) => {
    const room = rooms[roomId]; if (!room) return;
    room.grids[studentId] = grid;
    room.placingDone[studentId] = true;
    if (shipData) {
      room.shipPositions[studentId] = {};
      for (const [name, cells] of Object.entries(shipData)) {
        room.shipPositions[studentId][name] = new Set(cells.map(([r,c])=>r+','+c));
      }
    }
    if (room.players.every(p => room.placingDone[p])) {
      room.phase = 'playing';
      io.to(roomId).emit('gameStart', { firstAttackerId: room.players[0] });

      // ── Vocabulary refresh every 10 minutes ──
      room.vocabRefreshInterval = setInterval(() => {
        if (!rooms[roomId] || rooms[roomId].phase !== 'playing') {
          clearInterval(room.vocabRefreshInterval);
          return;
        }
        const rx = pickWords(gameSettings.vocabX, gameSettings.defsX);
        const ry = pickWords(gameSettings.vocabY, gameSettings.defsY);
        room.vocabX = rx.terms; room.defsX = rx.defs;
        room.vocabY = ry.terms; room.defsY = ry.defs;
        io.to(roomId).emit('vocabRefresh', { vocabX: room.vocabX, defsX: room.defsX, vocabY: room.vocabY, defsY: room.defsY });
      }, 10 * 60 * 1000);

      dashboardUpdate();
    }
    sendRoomState(roomId);
  });

  // ── Select square ──
  socket.on('selectSquare', ({ roomId, studentId, row, col }) => {
    const room = rooms[roomId];
    if (!room || room.phase !== 'playing') return;
    if (studentId !== room.players[room.currentAttackerIdx]) return;
    const defIdx = (room.currentAttackerIdx + 1) % room.players.length;
    const defenderId = room.players[defIdx];
    room.pendingAttack = { attackerId:studentId, defenderId, row, col };
    sendRoomState(roomId);
    const attackerIdx = room.currentAttackerIdx;
    if (students[defenderId]?.isBot) {
      setTimeout(()=>resolveAttack(room, studentId, defenderId, row, col), 850);
    } else {
      getSock(defenderId)?.emit('defendPrompt', { attackerName:students[studentId]?.name, wordX:room.vocabX[col], wordY:room.vocabY[row], row, col, attackerIdx });
    }
    getSock(studentId)?.emit('speakPrompt', { wordX:room.vocabX[col], wordY:room.vocabY[row], row, col, attackerIdx });
  });

  // ── Repeat sentence (defender tapped "Hear again") ──
  socket.on('repeatSentence', ({ roomId, studentId }) => {
    const room = rooms[roomId];
    if (!room || !room.pendingAttack) return;
    const { attackerId, defenderId, row, col } = room.pendingAttack;
    const attackerIdx = room.currentAttackerIdx;
    const wordX = room.vocabX[col];
    const wordY = room.vocabY[row];
    // Send repeat audio to BOTH players
    [attackerId, defenderId].forEach(pid => {
      getSock(pid)?.emit('repeatSentenceAudio', { wordX, wordY, attackerIdx });
    });
  });

  // ── Skip turn (timer expired) ──
  socket.on('skipTurn', ({ roomId, studentId }) => {
    const room = rooms[roomId];
    if (!room || room.phase !== 'playing') return;
    // Only the current attacker can skip their own turn
    if (studentId !== room.players[room.currentAttackerIdx]) return;

    // Cancel any pending attack
    room.pendingAttack = null;
    io.to(roomId).emit('clearPrompts');

    // Advance to next player
    room.currentAttackerIdx = (room.currentAttackerIdx + 1) % room.players.length;
    const nextAttackerId = room.players[room.currentAttackerIdx];

    io.to(roomId).emit('turnSkipped', {
      skippedName: students[studentId]?.name || studentId,
      nextAttackerId,
    });

    sendRoomState(roomId);
    console.log(`[SKIP] ${students[studentId]?.name} ran out of time — turn skipped`);
  });

  // ── Defend answer ──
  socket.on('defendAnswer', ({ roomId, studentId, isHit }) => {
    const room = rooms[roomId];
    if (!room || !room.pendingAttack) return;
    const { attackerId, defenderId, row, col } = room.pendingAttack;
    if (studentId !== defenderId) return;

    resolveAttack(room, attackerId, defenderId, row, col);
  });

  // ── Power-ups ──
  socket.on('usePowerup', ({ roomId, studentId, type, row, col }) => {
    const room = rooms[roomId];
    if (!room || room.phase !== 'playing') return;
    const pu = room.powerups[studentId];
    if (!pu || (pu[type]||0) <= 0) return;
    const defIdx = (room.players.indexOf(studentId)+1) % room.players.length;
    const defId = room.players[defIdx];

    if (type === 'radar') {
      if (row===undefined||col===undefined) { socket.emit('radarNeedTarget'); return; }
      pu.radar--;
      const shipCells=[];
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
        const rr=row+dr,cc=col+dc;
        if(rr>=0&&rr<BOARD_SIZE&&cc>=0&&cc<BOARD_SIZE&&room.grids[defId][rr][cc]===1) shipCells.push([rr,cc]);
      }
      socket.emit('radarResult',{centerRow:row,centerCol:col,shipCells,found:shipCells.length>0});
      sendRoomState(roomId);

    } else if (type === 'torpedo') {
      if (row===undefined) { socket.emit('torpedoNeedTarget'); return; }
      pu.torpedo--;
      const results=[];
      for(let c=0;c<BOARD_SIZE;c++){
        if(room.attackGrid[studentId][row][c]===0){
          const hit=room.grids[defId][row][c]===1;
          room.attackGrid[studentId][row][c]=hit?2:1;
          if(hit){
            room.scores[studentId].hits++;
            const sh=identifyShip(room,defId,row,c);
            if(sh){room.shipHealth[defId][sh]--;
              if(room.shipHealth[defId][sh]<=0){room.scores[studentId].sunk++;awardPowerup(room,studentId,room.scores[studentId].sunk);io.to(roomId).emit('shipSunk',{attackerId:studentId,defenderId:defId,shipName:sh});}
            }
          } else {room.scores[studentId].misses++;}
          results.push({row,col:c,hit});
        }
      }
      socket.emit('torpedoResult',{row,results});
      if(Object.values(room.shipHealth[defId]).every(v=>v<=0)){room.phase='finished';io.to(roomId).emit('gameOver',{winnerId:studentId,winnerName:students[studentId]?.name});}
      sendRoomState(roomId); dashboardUpdate();
    }
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    const student = Object.values(students).find(s=>s.socketId===socket.id);
    if (student) {
      student.socketId = null;
      // Wait 8 seconds before notifying — gives time for accidental refresh to reconnect
      setTimeout(() => {
        // Only notify if they haven't reconnected
        if (!student.socketId && student.roomId) {
          io.to(student.roomId).emit('opponentDisconnected', { name: student.name });
          dashboardUpdate();
        }
      }, 8000);
    }
  });
});

app.get('/healthz',(req,res)=>res.json({ok:true,service:'vocab-battleship',boardSize:BOARD_SIZE}));
app.get('/api/status',(req,res)=>res.json({students:Object.keys(students).length,rooms:Object.keys(rooms).length,waiting:waitingQueue.length}));
app.post('/api/integration/token',(req,res)=>{
  if (!INTEGRATION_SECRET) return res.status(503).json({error:'Lingual Planet integration is not configured'});
  if (req.get('x-game-secret') !== INTEGRATION_SECRET) return res.status(401).json({error:'Unauthorized'});
  const { userId, name, role = 'individual', classroomId = null, teacherId = null, className = '' } = req.body || {};
  if (!userId || !name) return res.status(400).json({error:'userId and name are required'});
  if (!['individual','student','teacher'].includes(role)) return res.status(400).json({error:'role must be individual, student, or teacher'});
  if (role === 'student' && !classroomId) return res.status(400).json({error:'classroomId is required for students'});
  const token = signLaunch({userId:String(userId),name:String(name),role,classroomId:classroomId?String(classroomId):null,teacherId:teacherId?String(teacherId):null,className:String(className),exp:Date.now()+5*60*1000});
  res.json({token,launchUrl:`/?lpToken=${encodeURIComponent(token)}`});
});

// ── AI Definitions ────────────────────────────────────────────────────────
app.post('/api/define', async (req, res) => {
  const { wordX, wordY } = req.body;
  if (!wordX || !wordY) return res.status(400).json({ error: 'Missing words' });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        messages: [{
          role: 'user',
          content: `Define these two medical terms in plain English. Each definition must be 8 words or fewer. Return only valid JSON in this exact format with no other text: {"wordX":"definition here","wordY":"definition here"}. Terms: wordX="${wordX}", wordY="${wordY}"`
        }]
      })
    });
    const data = await response.json();
    const text = data.content[0].text.trim();
    const defs = JSON.parse(text);
    res.json({ wordX: defs.wordX, wordY: defs.wordY });
  } catch (e) {
    console.error('Define error:', e);
    res.status(500).json({ error: 'Definition lookup failed' });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=>{
  console.log(`\n🚢 Vocab Battleship running!`);
  console.log(`   Students:  http://localhost:${PORT}`);
  console.log(`   Teacher:   http://localhost:${PORT}/teacher.html\n`);
});
