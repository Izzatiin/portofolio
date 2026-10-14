/* Pixel pet: akuarium kecil dengan ikan cupang.
   Tombol kiri = FEED, tengah = PLAY (tebak-tebakan), kanan = SLEEP.
   Semua digambar di canvas 80 x 64 piksel lalu diperbesar dengan CSS. */
(function () {
  "use strict";

  var stage = document.querySelector("[data-pet-stage]");
  if (!stage) return;

  var canvas = stage.querySelector("canvas");
  var ctx = canvas.getContext("2d");
  var screenEl = stage.querySelector("[data-pet-screen]");
  var openBtn = stage.querySelector("[data-pet-open]");
  var closeBtn = document.querySelector("[data-pet-close]");
  var live = document.querySelector("[data-pet-live]");
  var buttons = {
    a: stage.querySelector('[data-pet-btn="a"]'),
    b: stage.querySelector('[data-pet-btn="b"]'),
    c: stage.querySelector('[data-pet-btn="c"]')
  };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var W = 80;
  var H = 64;
  var SAND_Y = 52;
  var TICK = 50; // ms per frame (20 fps terasa "retro")

  var COLORS = {
    water: ["#a8e0f1", "#96d6eb", "#84cbe3", "#73c0dc"],
    sand: "#ecd59f",
    sand2: "#d9bd82",
    sand3: "#f7e8c0",
    weed: "#45a556",
    weed2: "#2f7f3c",
    coral: "#f27fab",
    coral2: "#d65b8a",
    rock: "#5d656f",
    rock2: "#7c858f",
    rock3: "#40464e",
    bubble: "#effbff",
    food: "#8a5a2b",
    ink: "#1d2433",
    white: "#ffffff",
    coin: "#f5c518",
    coin2: "#c4940c",
    heart: "#ef4b5f"
  };

  /* Sprite ikan cupang menghadap kanan (2 frame untuk ekor). */
  var FISH = [
    [
      "......ggg.........",
      "g...gffffg........",
      "gg.gffffffgg......",
      "gfggfrrrrrrrrr....",
      "gfffrrrhhrrrrrrr..",
      "gfffrrhhrrrrrrkrr.",
      "gfffrrrrrrrrrrrrrr",
      "gfffrrrrrrrrrrrr..",
      "gfggfrrrrrrrrr....",
      "gg.gffffffgg......",
      "g...gffffg........",
      "......ggg........."
    ],
    [
      ".......gg.........",
      ".g..gffffg........",
      "gfg.gffffffgg.....",
      "gffgfrrrrrrrrr....",
      ".gffrrrhhrrrrrrr..",
      ".gffrrhhrrrrrrkrr.",
      ".gffrrrrrrrrrrrrrr",
      "gfffrrrrrrrrrrrr..",
      "gfggfrrrrrrrrr....",
      "g..gffffffgg......",
      "....gffffg........",
      ".......gg........."
    ]
  ];
  var FISH_W = 18;
  var FISH_H = 12;
  var FISH_COLORS = { r: "#e8434a", h: "#ff9282", f: "#c7306c", g: "#7b52d9", k: "#14141c" };

  var CORAL = [
    "..p...p..",
    "..p.p.p..",
    "p.ppp.p.p",
    "pp.p.ppp.",
    ".ppp..p..",
    "..ppppp..",
    "....p....",
    "....p...."
  ];
  var HEART = ["01010", "11111", "01110", "00100"];
  var COIN = ["0110", "1221", "1221", "0110"];

  /* Font piksel 3 x 5 */
  var FONT = {
    A: "010101111101101", C: "011100100100011", D: "110101101101110", E: "111100110100111",
    F: "111100110100100", G: "011100101101011", I: "111010010010111", K: "101101110101101",
    M: "101111111101101", N: "110101101101101", O: "010101101101010", P: "110101110100100",
    R: "110101110101101", S: "011100010001110", U: "101101101101111", V: "101101101101010",
    W: "101101111111101", Y: "101101010010010", Z: "111001010100111", X: "101101010101101",
    "!": "010010010000010", "<": "001010100010001", ">": "100010001010100", " ": "000000000000000",
    0: "111101101101111", 1: "010110010010111", 2: "110001010100111", 3: "110001010001110",
    4: "101101111001001", 5: "111100110001110", 6: "011100111101111", 7: "111001010010010",
    8: "111101111101111", 9: "111101111001110"
  };

  /* ---------- state ---------- */
  var state = {
    mode: "tank", // tank | game
    asleep: false,
    hunger: 72,
    tick: 0,
    fish: { x: 30, y: 24, dir: 1, tx: 50, ty: 22, speed: 0.55 },
    food: [],
    bubbles: [],
    particles: [],
    zs: [],
    game: null,
    open: false,
    lastInteraction: 0
  };

  /* Bintik pasir tetap (pseudo-random supaya tidak berkedip) */
  var speckles = [];
  (function () {
    var seed = 11;
    function rnd() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    }
    for (var i = 0; i < 34; i++) {
      speckles.push({ x: Math.floor(rnd() * W), y: SAND_Y + 2 + Math.floor(rnd() * (H - SAND_Y - 2)), c: rnd() > 0.5 ? COLORS.sand2 : COLORS.sand3 });
    }
  })();

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  /* ---------- drawing helpers ---------- */
  function px(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }
  function sprite(rows, x, y, palette, flip) {
    var w = rows[0].length;
    for (var r = 0; r < rows.length; r++) {
      for (var c = 0; c < w; c++) {
        var ch = rows[r][flip ? w - 1 - c : c];
        if (ch === "." || ch === "0") continue;
        px(x + c, y + r, palette[ch]);
      }
    }
  }
  function textWidth(str) {
    return str.length * 4 - 1;
  }
  function text(str, x, y, color) {
    str = String(str).toUpperCase();
    for (var i = 0; i < str.length; i++) {
      var g = FONT[str[i]];
      if (!g) continue;
      for (var j = 0; j < 15; j++) {
        if (g[j] === "1") px(x + i * 4 + (j % 3), y + Math.floor(j / 3), color);
      }
    }
  }
  function textCenter(str, y, color) {
    text(str, Math.round((W - textWidth(str)) / 2), y, color);
  }
  function banner(str, y) {
    var w = textWidth(str) + 6;
    var x = Math.round((W - w) / 2);
    ctx.globalAlpha = 0.85;
    rect(x, y, w, 9, COLORS.ink);
    ctx.globalAlpha = 1;
    text(str, x + 3, y + 2, COLORS.white);
  }

  /* ---------- scene ---------- */
  function drawWater() {
    var bands = COLORS.water;
    var h = Math.ceil(SAND_Y / bands.length);
    for (var i = 0; i < bands.length; i++) rect(0, i * h, W, h, bands[i]);
    // light shimmer on the surface
    var off = Math.floor(state.tick / 6) % 8;
    for (var x = -8; x < W; x += 8) rect(x + off, 1, 3, 1, "#c5ecf8");
  }

  function drawSand() {
    for (var x = 0; x < W; x++) {
      var top = SAND_Y + (Math.sin(x * 0.33) > 0.55 ? -1 : 0);
      rect(x, top, 1, H - top, COLORS.sand);
    }
    for (var i = 0; i < speckles.length; i++) px(speckles[i].x, speckles[i].y, speckles[i].c);
  }

  function drawWeed(x, height, phase) {
    for (var i = 0; i < height; i++) {
      var y = SAND_Y - 1 - i;
      var sway = reduceMotion && !state.open ? 0 : Math.round(Math.sin(state.tick / 9 + i * 0.45 + phase) * (i / height) * 1.6);
      px(x + sway, y, i % 3 === 0 ? COLORS.weed2 : COLORS.weed);
      if (i % 4 === 2) px(x + sway + (i % 8 === 2 ? 1 : -1), y, COLORS.weed);
    }
  }

  function drawSmallRocks() {
    rect(52, SAND_Y - 3, 7, 3, COLORS.rock);
    rect(53, SAND_Y - 4, 5, 1, COLORS.rock);
    rect(54, SAND_Y - 4, 2, 1, COLORS.rock2);
    rect(60, SAND_Y - 2, 5, 2, COLORS.rock3);
    rect(61, SAND_Y - 3, 3, 1, COLORS.rock);
  }

  function drawBigRock() {
    var cx = 40;
    var half = 16;
    for (var dx = -half; dx <= half; dx++) {
      var h = Math.round(17 * Math.sqrt(1 - (dx / (half + 0.5)) * (dx / (half + 0.5))));
      for (var y = 0; y < h; y++) {
        var shade = y === h - 1 ? COLORS.rock3 : ((dx + 20) * 7 + y * 13) % 11 === 0 ? COLORS.rock2 : COLORS.rock;
        if (dx < -half + 3 && y === h - 1) shade = COLORS.rock3;
        px(cx + dx, SAND_Y + 1 - y, shade);
      }
    }
    rect(cx - 6, SAND_Y - 12, 3, 1, COLORS.rock2);
    rect(cx - 9, SAND_Y - 9, 2, 1, COLORS.rock2);
  }

  function drawFish() {
    var f = state.fish;
    var frame = state.asleep ? 0 : Math.floor(state.tick / 5) % 2;
    var palette = FISH_COLORS;
    if (state.asleep) palette = { r: FISH_COLORS.r, h: FISH_COLORS.h, f: FISH_COLORS.f, g: FISH_COLORS.g, k: "#8b2230" };
    var still = state.asleep || (state.mode === "game" && state.game.phase !== "reveal");
    var bob = still ? 0 : Math.round(Math.sin(state.tick / 7) * 0.6);
    sprite(FISH[frame], Math.round(f.x - FISH_W / 2), Math.round(f.y - FISH_H / 2) + bob, palette, f.dir < 0);
  }

  function drawFood() {
    for (var i = 0; i < state.food.length; i++) {
      var p = state.food[i];
      rect(p.x, p.y, 2, 1, COLORS.food);
    }
  }

  function drawBubbles() {
    for (var i = 0; i < state.bubbles.length; i++) {
      var b = state.bubbles[i];
      if (b.big) {
        px(b.x, b.y - 1, COLORS.bubble);
        px(b.x - 1, b.y, COLORS.bubble);
        px(b.x + 1, b.y, COLORS.bubble);
        px(b.x, b.y + 1, COLORS.bubble);
      } else {
        px(b.x, b.y, COLORS.bubble);
      }
    }
  }

  function drawParticles() {
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      if (p.kind === "heart") sprite(HEART, p.x, p.y, { 1: COLORS.heart }, false);
      else if (p.kind === "x") text("X", p.x, p.y, COLORS.heart);
      ctx.globalAlpha = 1;
    }
  }

  function drawZs() {
    for (var i = 0; i < state.zs.length; i++) {
      var z = state.zs[i];
      ctx.globalAlpha = Math.max(0, z.life / 60);
      text("Z", z.x, z.y, COLORS.white);
      ctx.globalAlpha = 1;
    }
  }

  function drawHud() {
    var g = state.game;
    sprite(COIN, 2, 2, { 1: COLORS.coin2, 2: COLORS.coin }, false);
    text(g.coins, 8, 2, COLORS.ink);
    sprite(HEART, W - 7, 2, { 1: COLORS.heart }, false);
    text(g.hearts, W - 11, 2, COLORS.ink);
  }

  function render() {
    drawWater();
    drawSand();

    if (state.mode === "tank") {
      drawWeed(6, 18, 0);
      drawWeed(9, 13, 1.5);
      sprite(CORAL, 20, SAND_Y - 8, { p: COLORS.coral }, false);
      drawSmallRocks();
      drawWeed(71, 16, 2.4);
      drawWeed(74, 11, 0.8);
      drawFood();
      drawFish();
      drawBubbles();
      drawParticles();
      if (state.asleep) {
        ctx.globalAlpha = 0.55;
        rect(0, 0, W, H, "#141c3c");
        ctx.globalAlpha = 1;
        drawZs();
      } else if (state.hunger >= 70 && Math.floor(state.tick / 14) % 4 !== 3) {
        banner("FEED ME", H - 10);
      }
    } else {
      var g = state.game;
      drawWeed(5, 14, 0);
      drawWeed(75, 12, 2);
      drawFish();
      drawBigRock();
      drawParticles();
      drawHud();
      if (g.phase === "ask") {
        textCenter("GUESS", 12, COLORS.ink);
        if (Math.floor(state.tick / 8) % 2 === 0) {
          text("<", 4, 30, COLORS.ink);
          text(">", W - 7, 30, COLORS.ink);
        }
      } else if (g.phase === "reveal") {
        textCenter(g.correct ? "NICE!" : "OOPS", 12, COLORS.ink);
      } else if (g.phase === "over") {
        banner("GAME OVER", 14);
      }
    }
    for (var i = 0; i < renderHooks.length; i++) renderHooks[i]();
  }

  /* ---------- behaviour ---------- */
  function pickTarget() {
    var f = state.fish;
    f.tx = rand(12, W - 12);
    f.ty = rand(10, SAND_Y - 10);
  }

  function moveFish(speed) {
    var f = state.fish;
    var dx = f.tx - f.x;
    var dy = f.ty - f.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d < 0.8) return true;
    var s = Math.min(speed, d);
    f.x += (dx / d) * s;
    f.y += (dy / d) * s;
    if (Math.abs(dx) > 0.6) f.dir = dx > 0 ? 1 : -1;
    return false;
  }

  function spawnBubble(x, y) {
    state.bubbles.push({ x: x, y: y, big: Math.random() > 0.6, wobble: Math.random() * 6 });
  }

  function spawnHeart(x, y) {
    state.particles.push({ kind: "heart", x: x, y: y, life: 26, max: 26 });
  }

  function updateTank() {
    var f = state.fish;
    state.hunger = Math.min(100, state.hunger + (state.tick % 60 === 0 ? 1 : 0));

    if (state.asleep) {
      f.tx = 30;
      f.ty = SAND_Y - 8;
      moveFish(0.25);
      if (state.tick % 22 === 0) state.zs.push({ x: f.x + 6 * f.dir, y: f.y - 8, life: 60 });
    } else if (state.food.length) {
      var target = state.food[0];
      var best = Infinity;
      for (var i = 0; i < state.food.length; i++) {
        var p = state.food[i];
        var dd = Math.abs(p.x - f.x) + Math.abs(p.y - f.y);
        if (dd < best) {
          best = dd;
          target = p;
        }
      }
      f.tx = target.x - f.dir * 6;
      f.ty = target.y;
      moveFish(0.9);
      var mouthX = f.x + f.dir * 8;
      if (Math.abs(mouthX - target.x) < 3 && Math.abs(f.y - target.y) < 3) {
        state.food.splice(state.food.indexOf(target), 1);
        state.hunger = Math.max(0, state.hunger - 14);
        spawnHeart(Math.round(target.x - 2), Math.round(target.y - 8));
        emit("eat", { x: target.x, y: target.y });
      }
    } else {
      if (moveFish(f.speed) || state.tick % 140 === 0) pickTarget();
    }

    for (var j = state.food.length - 1; j >= 0; j--) {
      var food = state.food[j];
      if (food.y < SAND_Y - 1) {
        food.y += 0.3;
        food.x += Math.sin((state.tick + j * 10) / 6) * 0.08;
      } else if (++food.rest > 300) {
        state.food.splice(j, 1);
      }
    }

    if (!state.asleep && state.tick % 48 === 0) spawnBubble(f.x + f.dir * 9, f.y - 1);
    if (state.tick % 70 === 35) spawnBubble(Math.round(rand(14, 66)), SAND_Y - 2);

    for (var k = state.zs.length - 1; k >= 0; k--) {
      var z = state.zs[k];
      z.y -= 0.25;
      z.x += 0.1;
      if (--z.life <= 0) state.zs.splice(k, 1);
    }
  }

  function updateCommon() {
    for (var i = state.bubbles.length - 1; i >= 0; i--) {
      var b = state.bubbles[i];
      b.y -= 0.35;
      b.x += Math.sin((state.tick + b.wobble * 10) / 5) * 0.12;
      if (b.y < 2) state.bubbles.splice(i, 1);
    }
    for (var j = state.particles.length - 1; j >= 0; j--) {
      var p = state.particles[j];
      p.y -= 0.25;
      if (--p.life <= 0) state.particles.splice(j, 1);
    }
  }

  /* ---------- guessing game ---------- */
  var HIDE_X = 40;
  var HIDE_Y = SAND_Y - 7;

  function startGame() {
    state.asleep = false;
    state.food = [];
    state.zs = [];
    state.mode = "game";
    state.game = { phase: "hide", side: 1, guess: 0, correct: false, timer: 0, coins: 0, hearts: 3 };
    state.fish.tx = HIDE_X;
    state.fish.ty = HIDE_Y;
    setLabels();
    emit("play");
    say("Game started. The fish hides behind the rock. Guess left or right.");
  }

  function exitGame() {
    state.mode = "tank";
    state.game = null;
    pickTarget();
    setLabels();
    emit("exit");
    say("Back to the aquarium.");
  }

  function guess(side) {
    var g = state.game;
    if (!g || g.phase !== "ask") return;
    g.guess = side;
    g.correct = side === g.side;
    g.phase = "reveal";
    g.timer = 0;
    state.fish.tx = HIDE_X + g.side * 26;
    state.fish.ty = HIDE_Y - 6;
    if (g.correct) {
      g.coins += 1;
      spawnHeart(HIDE_X + g.side * 26 - 2, HIDE_Y - 20);
      emit("correct", { x: HIDE_X + g.side * 26, y: HIDE_Y - 10, coins: g.coins });
      say("Correct! Coins: " + g.coins + ".");
    } else {
      g.hearts -= 1;
      state.particles.push({ kind: "x", x: HIDE_X + side * 26 - 1, y: HIDE_Y - 4, life: 30, max: 30 });
      emit("wrong", { x: HIDE_X + side * 26, y: HIDE_Y - 4, hearts: g.hearts });
      say("Not there. Hearts left: " + g.hearts + ".");
    }
  }

  function updateGame() {
    var g = state.game;
    var f = state.fish;
    g.timer++;
    if (g.phase === "hide") {
      f.tx = HIDE_X;
      f.ty = HIDE_Y;
      if (moveFish(1.1) && g.timer > 24) {
        g.phase = "ask";
        g.side = Math.random() < 0.5 ? -1 : 1;
        g.timer = 0;
      }
    } else if (g.phase === "ask") {
      f.x = HIDE_X;
      f.y = HIDE_Y;
    } else if (g.phase === "reveal") {
      moveFish(1.3);
      if (g.timer > 40) {
        if (g.hearts <= 0) {
          g.phase = "over";
          g.timer = 0;
          emit("over", { coins: g.coins });
          say("Game over. You collected " + g.coins + " coins.");
        } else {
          g.phase = "hide";
          g.timer = 0;
        }
      }
    } else if (g.phase === "over") {
      f.tx = 40;
      f.ty = 26;
      moveFish(0.6);
      if (g.timer > 60) exitGame();
    }
  }

  /* ---------- actions ---------- */
  function feed() {
    if (state.asleep) wake();
    for (var i = 0; i < 3; i++) state.food.push({ x: rand(16, W - 18), y: 3 + i * 2, rest: 0 });
    emit("feed");
    say("You dropped some food in the water.");
  }

  function sleep() {
    state.asleep = true;
    state.food = [];
    setLabels();
    emit("sleep");
    say("The fish is asleep.");
  }

  function wake() {
    state.asleep = false;
    state.zs = [];
    pickTarget();
    setLabels();
    emit("wake");
    say("The fish is awake.");
  }

  function press(key) {
    var el = buttons[key];
    if (el) {
      el.classList.add("is-pressed");
      setTimeout(function () {
        el.classList.remove("is-pressed");
      }, 120);
    }
    touch();
    emit("press", { key: key });
    if (state.mode === "game") {
      if (key === "a") guess(-1);
      else if (key === "b") exitGame();
      else if (key === "c") guess(1);
      return;
    }
    if (key === "a") feed();
    else if (key === "b") startGame();
    else if (key === "c") state.asleep ? wake() : sleep();
  }

  function setLabels() {
    var labels;
    if (state.mode === "game") {
      labels = { a: ["LEFT", "Guess left"], b: ["EXIT", "Exit the game"], c: ["RIGHT", "Guess right"] };
    } else {
      labels = {
        a: ["FEED", "Feed the fish"],
        b: ["PLAY", "Play a guessing game"],
        c: state.asleep ? ["WAKE", "Wake the fish up"] : ["SLEEP", "Put the fish to sleep"]
      };
    }
    Object.keys(labels).forEach(function (k) {
      if (!buttons[k]) return;
      buttons[k].setAttribute("data-label", labels[k][0]);
      buttons[k].setAttribute("aria-label", labels[k][1]);
    });
    emit("labels", { a: labels.a[0], b: labels.b[0], c: labels.c[0] });
  }

  function say(msg) {
    if (live) live.textContent = msg;
  }

  /* Event untuk efek suara, partikel, dan model 3D (lihat pet-fx.js & pet3d.js) */
  var renderHooks = [];
  function emit(name, detail) {
    document.dispatchEvent(new CustomEvent("pet:" + name, { detail: detail || {} }));
  }

  /* ---------- full screen mode ---------- */
  function fit() {
    var prev = stage.style.transition;
    stage.style.transition = "none";
    stage.style.transform = "none";
    var r = stage.getBoundingClientRect();
    var s = Math.min((window.innerHeight * 0.74) / r.height, (window.innerWidth * 0.86) / r.width, 2.6);
    var dx = window.innerWidth / 2 - (r.left + r.width / 2);
    var dy = window.innerHeight / 2 - (r.top + r.height / 2) + r.height * s * 0.06;
    void stage.offsetWidth;
    stage.style.transition = prev;
    return "translate(" + dx + "px, " + dy + "px) scale(" + s + ")";
  }

  function openPet() {
    if (state.open) return;
    state.open = true;
    document.body.classList.add("pet-open");
    stage.style.transform = fit();
    touch();
    emit("open");
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function closePet() {
    if (!state.open) return;
    state.open = false;
    document.body.classList.remove("pet-open");
    stage.style.transform = "";
    emit("close");
    if (openBtn) openBtn.focus({ preventScroll: true });
    schedule();
  }

  /* ---------- loop ---------- */
  var visible = true;
  var rafId = 0;
  var last = 0;
  var acc = 0;

  function touch() {
    state.lastInteraction = performance.now();
    schedule();
  }

  function shouldRun() {
    if (document.hidden || !visible) return false;
    if (!reduceMotion) return true;
    return state.open || state.mode === "game" || performance.now() - state.lastInteraction < 8000;
  }

  function frame(now) {
    rafId = 0;
    if (!shouldRun()) {
      render();
      return;
    }
    if (!last) last = now;
    acc += Math.min(250, now - last);
    last = now;
    while (acc >= TICK) {
      state.tick++;
      if (state.mode === "game") updateGame();
      else updateTank();
      updateCommon();
      acc -= TICK;
    }
    render();
    rafId = requestAnimationFrame(frame);
  }

  function schedule() {
    if (!rafId) {
      last = 0;
      rafId = requestAnimationFrame(frame);
    }
  }

  /* ---------- events ---------- */
  Object.keys(buttons).forEach(function (k) {
    if (buttons[k]) {
      buttons[k].addEventListener("click", function () {
        press(k);
      });
    }
  });

  /* u, v = posisi tap di layar (0..1) */
  function tap(u, v) {
    var x = u * W;
    var y = v * H;
    touch();
    if (state.mode === "game") {
      guess(x < W / 2 ? -1 : 1);
    } else if (!state.asleep) {
      state.fish.tx = Math.max(10, Math.min(W - 10, x));
      state.fish.ty = Math.max(8, Math.min(SAND_Y - 8, y));
      spawnBubble(Math.round(x), Math.round(y));
      emit("tap", { x: x, y: y });
    }
  }

  screenEl.addEventListener("click", function (e) {
    if (!state.open) {
      openPet();
      return;
    }
    var r = canvas.getBoundingClientRect();
    tap((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  });

  if (openBtn) openBtn.addEventListener("click", openPet);
  if (closeBtn) closeBtn.addEventListener("click", closePet);

  document.addEventListener("keydown", function (e) {
    if (!state.open || e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key.toLowerCase();
    if (k === "escape") closePet();
    else if (k === "f" && state.mode === "tank") press("a");
    else if (k === "p") press("b");
    else if (k === "s" && state.mode === "tank") press("c");
    else if (k === "arrowleft" && state.mode === "game") press("a");
    else if (k === "arrowright" && state.mode === "game") press("c");
    else return;
    e.preventDefault();
  });

  window.addEventListener("resize", function () {
    if (state.open) stage.style.transform = fit();
  });

  document.addEventListener("visibilitychange", schedule);
  document.addEventListener("viewchange", function (e) {
    if (e.detail !== "home") closePet();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      schedule();
    }).observe(canvas);
  }

  window.PixelPet = {
    canvas: canvas,
    width: W,
    height: H,
    press: press,
    tap: tap,
    open: openPet,
    close: closePet,
    isOpen: function () {
      return state.open;
    },
    label: function (k) {
      return buttons[k] ? buttons[k].getAttribute("data-label") : "";
    },
    onRender: function (fn) {
      renderHooks.push(fn);
    },
    refit: function () {
      if (state.open) stage.style.transform = fit();
    }
  };

  pickTarget();
  setLabels();
  render();
  schedule();
})();
