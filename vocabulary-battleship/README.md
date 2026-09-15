# ⚓ Vocab Battleship
### A multiplayer vocabulary speaking game for the classroom

---

## What it does

Students can play Battleship against a classmate in real time or practise alone against Captain Lexi. The twist:
**every attack requires speaking a sentence out loud.**

When a student selects a square, a popup shows them:
> *"Is there something at **Mango** and **Jump**?"*

They must say this to their partner. The partner (the defender) then clicks **Hit** or **Miss** based on their own grid. This forces students to produce vocabulary in spoken form on every single turn.

---

## Quick Start

### 1. Install dependencies
```bash
cd vocab-battleship
npm install
```

### 2. Start the server
```bash
node server.js
```

### 3. Open in browser
| Who | URL |
|-----|-----|
| Students | `http://localhost:3000` |
| Teacher | `http://localhost:3000/teacher.html` |

---

## Classroom Setup

### Step 1 — Teacher opens the dashboard
Go to `http://YOUR_IP:3000/teacher.html`  
(Replace `YOUR_IP` with your computer's IP address on the school network)

### Step 2 — Paste your vocabulary
In the **Vocabulary Setup** section, paste your word lists:
- **X-Axis** (columns): at least 10 words, one per line
- **Y-Axis** (rows): at least 10 different words, one per line
- Click **Apply Vocabulary to All Games**

### Step 3 — Students log in
Students go to `http://YOUR_IP:3000` on their devices (phones, tablets, or computers).  
They enter their **name**, **student ID**, and **class**.

### Step 4 — Students are paired automatically
As soon as 2 students choose **Play a classmate**, they are placed in an isolated two-player room.  
If an odd number joins, the final student waits for the next classmate. Solo players begin immediately.  
You can also click **Pair Students Now** at any time.

### Step 5 — Students place ships
Each student places their 5 ships on their own grid (or uses Auto-Place).  
When both partners click **Ready**, the game begins.

### Step 6 — Play!
The speaking mechanic runs automatically:
1. Attacker clicks a square → popup shows sentence to say
2. Attacker says *"Is there something at [X] and [Y]?"* out loud
3. Defender sees the popup and clicks Hit or Miss
4. Result flashes on both screens

---

## The Ships

| Ship | Size | Count |
|------|------|-------|
| ⚔ Battleship | 5 squares | 1 |
| 🛥 Destroyer | 4 squares | 1 |
| ⛵ Cruiser | 3 squares | 1 |
| 🤿 Submarine | 2 squares | 2 |

---

## Teacher Controls

From the dashboard at `/teacher.html` you can:

- **Paste vocabulary** — updates all active games live
- **Pause All** — freezes every game (e.g. for class instructions)
- **Resume** — unpauses all games
- **Broadcast** — sends an announcement banner to every student screen
- **Pair Students Now** — manually trigger pairing at any time
- **Export Log** — downloads a CSV of every sentence spoken (attacker, words, hit/miss, timestamp)
- **Game Settings** — toggle timer, sentence prompt, hard mode, power-ups

---

## Game Settings

| Setting | Description |
|---------|-------------|
| 30-second timer | Each turn has a countdown; runs out = skip turn |
| Show sentence prompt | Displays the full sentence for students to read |
| Hard mode | Hides the prompt — students must say it from memory |
| Power-ups | Enables Radar (reveal area), Torpedo (whole row), Sonar (nearby hint) |

---

## Deploying to a Real Server (optional)

To host online so students can play from home:

1. Deploy to any Node.js host: **Railway**, **Render**, **Fly.io**, **Heroku**
2. Set the `PORT` environment variable (most platforms do this automatically)
3. Share the URL with students

## Lingual Planet integration

The game can run as its own Node service and be linked or embedded from Lingual Planet. Configure the same long random value as `LINGUAL_PLANET_GAME_SECRET` in both applications and restrict `ALLOWED_ORIGINS` to the real Lingual Planet domains.

Set `TEACHER_ADMIN_PASSWORD` in production. The teacher dashboard and its privileged Socket.io commands then use browser Basic authentication. Leaving it empty is convenient for local development but must not be used on a public server.

From the Lingual Planet server, create a short-lived launch link by sending an authenticated request:

```http
POST https://games.lingualplanet.com/vocab-battleship/api/integration/token
Content-Type: application/json
X-Game-Secret: YOUR_SHARED_SECRET

{"userId":"1234","name":"Yuki","role":"student","classroomId":"class-88","teacherId":"teacher-9","className":"2B"}
```

The response contains `launchUrl`. Redirect the learner there or use it as the source of an iframe. The signed launch token expires after five minutes and prevents learners from impersonating another Lingual Planet account. Keep the shared secret on the server; never place it in browser JavaScript.

### Account and matchmaking rules

- `individual`: may play the computer or join the public individual-user pool.
- `student`: must include a `classroomId`; may play the computer or join only that classroom's waiting pool.
- `teacher`: manages learners and games through a classroom dashboard and cannot enter through the student game screen.
- A classroom identifier comes from Lingual Planet's database, not from a field the learner can edit.
- The server signs the role and classroom identifier, so changing browser fields cannot move a student into another class.
- Teacher reassignment controls refuse to pair users from different matchmaking pools.

Recommended production layout:

- Mount the game at a dedicated HTTPS subdomain or reverse-proxy path.
- Pass the signed Lingual Planet user ID, display name, and class name through the launch endpoint.
- Open the game in a full-page view on phones; use an iframe only on wider screens.
- Use `/healthz` for hosting checks and `/api/status` for a lightweight classroom count.
- Run one Node process unless room state is moved to a shared store. Socket.io connections and game rooms currently live in memory.

The server-authoritative board determines every hit and miss. The defender's button is retained as a speaking/listening classroom step, but cannot falsify the result.

## Responsive board

The play grid is now 10×10. On phones, vocabulary words appear through stable A–J and 1–10 coordinates so every square remains a usable tap target without horizontal scrolling. Tapping a header or square reveals the full vocabulary pair. Desktop layouts retain word labels and truncate only unusually long terms, with the full term available on hover.

## Capacity

Rooms are isolated and lightweight, and each classroom can run as many simultaneous pairs as its connected learners require. Capacity must be load-tested on the intended production infrastructure before worldwide launch.

For worldwide traffic, do not treat one Node process as the final architecture. Put the game behind a load balancer, use sticky WebSocket sessions initially, and move presence, queues, room snapshots, turn locks, and activity events into Redis before adding multiple game processes. Store durable lesson presets and completed-game summaries in Lingual Planet's database. This separation allows many game processes to serve different rooms without ever mixing classroom queues.

**Railway (easiest):**
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

---

## File Structure

```
vocab-battleship/
├── server.js          ← Node.js + Socket.io server (game logic + pairing)
├── package.json
└── public/
    ├── index.html     ← Student game page
    └── teacher.html   ← Teacher admin dashboard
```

---

## Vocabulary Tips

- Use **theme-based word sets** for X and Y axes (e.g. nouns × verbs, adjectives × nouns)
- The sentence template *"Is there something at [X] and [Y]?"* works for any pair of words
- After class, export the activity log to see which word pairs came up most — great for vocabulary review

---

*Built for ESL/EFL classrooms. Designed to maximize speaking practice through game mechanics.*
