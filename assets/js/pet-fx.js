/* Efek untuk virtual pet: suara chiptune (Web Audio) + partikel piksel.
   Bereaksi ke event "pet:*" yang dikirim pet.js. */
(function () {
  "use strict";

  if (!window.PixelPet) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var stage = document.querySelector("[data-pet-stage]");
  var soundBtn = document.querySelector("[data-pet-sound]");

  /* ================= SOUND ================= */
  var audio = null;
  var master = null;
  var muted = false;
  try {
    muted = localStorage.getItem("pet-sound") === "off";
  } catch (e) {}

  function ac() {
    // browser hanya mengizinkan suara setelah pengunjung berinteraksi
    if (!audio && navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
    if (!audio) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audio = new Ctx();
      master = audio.createGain();
      master.gain.value = 0.16;
      master.connect(audio.destination);
    }
    if (audio.state === "suspended") audio.resume();
    return audio;
  }

  function tone(type, f0, f1, dur, vol, delay) {
    var ctx = ac();
    if (!ctx || muted) return;
    var t = ctx.currentTime + (delay || 0);
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.6, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noise(dur, freq, vol, delay) {
    var ctx = ac();
    if (!ctx || muted) return;
    var t = ctx.currentTime + (delay || 0);
    var len = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = 1.2;
    var g = ctx.createGain();
    g.gain.value = vol || 0.4;
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t);
  }

  var notes = { C4: 261.6, E4: 329.6, G4: 392, A4: 440, B4: 493.9, C5: 523.3, D5: 587.3, E5: 659.3, G5: 784, A5: 880, B5: 987.8, C6: 1046.5, E6: 1318.5 };

  var SOUNDS = {
    click: function () {
      tone("square", 1900, 1500, 0.025, 0.25);
      tone("sine", 190, 80, 0.09, 0.7);
    },
    feed: function () {
      tone("sine", 1100, 320, 0.11, 0.55, 0.05);
      tone("sine", 1250, 360, 0.11, 0.5, 0.17);
      tone("sine", 1000, 300, 0.11, 0.45, 0.29);
    },
    eat: function () {
      tone("triangle", 520, 780, 0.07, 0.6);
      tone("triangle", 780, 1040, 0.07, 0.5, 0.07);
    },
    play: function () {
      ["C5", "E5", "G5", "C6"].forEach(function (n, i) {
        tone("square", notes[n], notes[n], 0.08, 0.3, 0.06 + i * 0.075);
      });
    },
    exit: function () {
      tone("square", notes.G5, notes.C5, 0.14, 0.25, 0.04);
    },
    coin: function () {
      tone("square", notes.B5, notes.B5, 0.07, 0.3);
      tone("square", notes.E6, notes.E6, 0.28, 0.3, 0.07);
    },
    wrong: function () {
      tone("square", 220, 110, 0.22, 0.3);
      noise(0.12, 300, 0.25);
    },
    over: function () {
      ["G4", "E4", "C4"].forEach(function (n, i) {
        tone("triangle", notes[n], notes[n] * 0.98, 0.22, 0.5, i * 0.2);
      });
    },
    sleep: function () {
      ["E5", "C5", "A4"].forEach(function (n, i) {
        tone("sine", notes[n], notes[n], 0.32, 0.45, 0.05 + i * 0.22);
      });
    },
    wake: function () {
      ["A4", "C5", "E5", "A5"].forEach(function (n, i) {
        tone("sine", notes[n], notes[n], 0.14, 0.4, 0.04 + i * 0.09);
      });
    },
    bubble: function () {
      tone("sine", 600, 1400, 0.08, 0.4);
    },
    whoosh: function () {
      noise(0.22, 900, 0.35);
      tone("sine", 300, 700, 0.18, 0.25);
    }
  };

  function sound(name) {
    if (muted || !SOUNDS[name]) return;
    try {
      SOUNDS[name]();
    } catch (e) {}
  }

  function setMuted(m) {
    muted = m;
    try {
      localStorage.setItem("pet-sound", m ? "off" : "on");
    } catch (e) {}
    if (soundBtn) {
      soundBtn.setAttribute("aria-pressed", String(!m));
      soundBtn.setAttribute("aria-label", m ? "Turn sound on" : "Turn sound off");
      soundBtn.classList.toggle("is-muted", m);
    }
    if (!m) sound("click");
  }
  if (soundBtn) {
    soundBtn.setAttribute("aria-pressed", String(!muted));
    soundBtn.setAttribute("aria-label", muted ? "Turn sound on" : "Turn sound off");
    soundBtn.classList.toggle("is-muted", muted);
    soundBtn.addEventListener("click", function () {
      setMuted(!muted);
    });
  }

  /* ================= PARTICLES ================= */
  var layer = document.createElement("canvas");
  layer.className = "fx-layer";
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);
  var ctx = layer.getContext("2d");
  var particles = [];
  var running = false;
  var dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    layer.width = Math.round(window.innerWidth * dpr);
    layer.height = Math.round(window.innerHeight * dpr);
  }
  resize();
  window.addEventListener("resize", resize);

  var HEART = ["01010", "11111", "11111", "01110", "00100"];
  var STAR = ["00100", "01110", "11111", "01110", "00100"];

  function px(pattern, x, y, cell, color) {
    ctx.fillStyle = color;
    var w = pattern[0].length;
    var h = pattern.length;
    for (var r = 0; r < h; r++) {
      for (var c = 0; c < w; c++) {
        if (pattern[r][c] === "1") ctx.fillRect(x + (c - w / 2) * cell, y + (r - h / 2) * cell, cell, cell);
      }
    }
  }

  function add(p) {
    p.life = p.max = p.life || 60;
    p.vr = p.vr || 0;
    p.rot = p.rot || 0;
    particles.push(p);
    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  }

  function rnd(a, b) {
    return a + Math.random() * (b - a);
  }

  var PALETTES = {
    press: ["#ffffff", "#ffd1df", "#ffb3c9"],
    food: ["#8a5a2b", "#b07a3e", "#d9a35b"],
    stars: ["#ffd23f", "#ff9ecb", "#7cc4ff", "#ffffff"],
    confetti: ["#ff7a59", "#ffd23f", "#4ade80", "#60a5fa", "#f472b6", "#a78bfa"],
    sun: ["#ffd23f", "#ffb347", "#fff3b0"]
  };

  function burst(x, y, kind) {
    if (reduceMotion) return;
    var i;
    if (kind === "press") {
      add({ shape: "ring", x: x, y: y, size: 6, grow: 1.6, color: "rgba(255,255,255,0.9)", life: 18 });
      for (i = 0; i < 8; i++) {
        var a = (i / 8) * Math.PI * 2;
        add({ shape: "sq", x: x, y: y, vx: Math.cos(a) * rnd(1.8, 3), vy: Math.sin(a) * rnd(1.8, 3), g: 0.05, drag: 0.9, size: 4, color: PALETTES.press[i % 3], life: 22 });
      }
    } else if (kind === "food") {
      for (i = 0; i < 12; i++) {
        add({ shape: "sq", x: x, y: y, vx: rnd(-2.6, 2.6), vy: rnd(-7, -3.5), g: 0.28, drag: 0.99, size: rnd(4, 7), color: PALETTES.food[i % 3], life: rnd(40, 60) });
      }
    } else if (kind === "hearts") {
      for (i = 0; i < 4; i++) {
        add({ shape: "heart", x: x + rnd(-14, 14), y: y, vx: rnd(-0.7, 0.7), vy: rnd(-2.6, -1.4), g: -0.01, drag: 0.98, cell: rnd(3, 4.5), color: i % 2 ? "#ff6b81" : "#ef4b5f", life: rnd(45, 65) });
      }
    } else if (kind === "stars") {
      for (i = 0; i < 14; i++) {
        var b = rnd(0, Math.PI * 2);
        var s = rnd(2.5, 6);
        add({ shape: "star", x: x, y: y, vx: Math.cos(b) * s, vy: Math.sin(b) * s - 2, g: 0.15, drag: 0.97, cell: rnd(2.5, 4), color: PALETTES.stars[i % 4], life: rnd(35, 55) });
      }
    } else if (kind === "coins") {
      for (i = 0; i < 8; i++) {
        add({ shape: "coin", x: x, y: y, vx: rnd(-3.5, 3.5), vy: rnd(-8, -4.5), g: 0.32, drag: 0.99, size: rnd(7, 10), vr: rnd(-0.3, 0.3), life: rnd(45, 60) });
      }
    } else if (kind === "smoke") {
      for (i = 0; i < 7; i++) {
        add({ shape: "puff", x: x + rnd(-8, 8), y: y, vx: rnd(-1.2, 1.2), vy: rnd(-1.6, -0.6), g: -0.01, drag: 0.96, size: rnd(6, 11), grow: 0.25, color: "rgba(120,124,135,0.55)", life: rnd(30, 45) });
      }
    } else if (kind === "confetti") {
      for (i = 0; i < 46; i++) {
        var c = rnd(0, Math.PI * 2);
        var sp = rnd(4, 11);
        add({ shape: "rect", x: x, y: y, vx: Math.cos(c) * sp, vy: Math.sin(c) * sp - 4, g: 0.25, drag: 0.975, w: rnd(5, 9), h: rnd(9, 14), rot: rnd(0, 6), vr: rnd(-0.3, 0.3), color: PALETTES.confetti[i % 6], life: rnd(70, 100) });
      }
    } else if (kind === "zzz") {
      for (i = 0; i < 3; i++) {
        add({ shape: "text", text: "z", x: x + i * 10, y: y - i * 6, vx: rnd(0.4, 0.9), vy: rnd(-1.6, -1.1), g: 0, drag: 0.995, size: 16 + i * 6, color: "#6b7bd0", life: 70 + i * 10 });
      }
    } else if (kind === "sun") {
      add({ shape: "ring", x: x, y: y, size: 8, grow: 2.2, color: "rgba(255,210,63,0.9)", life: 22 });
      for (i = 0; i < 10; i++) {
        var d = (i / 10) * Math.PI * 2;
        add({ shape: "star", x: x, y: y, vx: Math.cos(d) * 3.4, vy: Math.sin(d) * 3.4, g: 0.02, drag: 0.93, cell: 2.6, color: PALETTES.sun[i % 3], life: 34 });
      }
    } else if (kind === "bubbles") {
      for (i = 0; i < 5; i++) {
        add({ shape: "bubble", x: x + rnd(-10, 10), y: y + rnd(-4, 4), vx: rnd(-0.4, 0.4), vy: rnd(-2.2, -1.2), g: -0.02, drag: 0.98, size: rnd(3, 6), color: "rgba(255,255,255,0.95)", life: rnd(30, 45) });
      }
    }
  }

  function tick() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, layer.width, layer.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.vx = (p.vx || 0) * (p.drag || 1);
      p.vy = (p.vy || 0) * (p.drag || 1) + (p.g || 0);
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.grow) p.size += p.grow;
      p.life--;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      var alpha = Math.min(1, p.life / (p.max * 0.4));
      ctx.globalAlpha = alpha;
      if (p.shape === "sq") {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.shape === "heart") {
        px(HEART, p.x, p.y, p.cell, p.color);
      } else if (p.shape === "star") {
        px(STAR, p.x, p.y, p.cell, p.color);
      } else if (p.shape === "coin") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(Math.cos(p.rot * 3), 1);
        ctx.fillStyle = "#c4940c";
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f5c518";
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.72, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff3b0";
        ctx.fillRect(-p.size * 0.15, -p.size * 0.45, p.size * 0.3, p.size * 0.9);
        ctx.restore();
      } else if (p.shape === "rect") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.rot * 2));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      } else if (p.shape === "ring" || p.shape === "bubble") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.shape === "ring" ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === "puff") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === "text") {
        ctx.fillStyle = p.color;
        ctx.font = "500 " + p.size + "px 'DM Mono', monospace";
        ctx.fillText(p.text, p.x, p.y);
      }
    }
    ctx.globalAlpha = 1;
    if (particles.length) {
      requestAnimationFrame(tick);
    } else {
      running = false;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, layer.width, layer.height);
    }
  }

  /* ============ posisi asal efek ============
     Versi CSS: pakai posisi tombol & layar HTML. pet3d.js menggantinya
     dengan posisi dari model 3D. */
  var locate = {
    button: function (key) {
      var el = stage.querySelector('[data-pet-btn="' + key + '"]');
      var r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    },
    screen: function (x, y) {
      var r = window.PixelPet.canvas.getBoundingClientRect();
      return { x: r.left + (x / window.PixelPet.width) * r.width, y: r.top + (y / window.PixelPet.height) * r.height };
    }
  };

  window.PetFX = { sound: sound, burst: burst, locate: locate };

  function at(kind, p) {
    if (p) burst(p.x, p.y, kind);
  }

  document.addEventListener("pet:press", function (e) {
    sound("click");
    at("press", locate.button(e.detail.key));
  });
  document.addEventListener("pet:feed", function () {
    sound("feed");
    at("food", locate.button("a"));
  });
  document.addEventListener("pet:eat", function (e) {
    sound("eat");
    at("hearts", locate.screen(e.detail.x, e.detail.y - 6));
  });
  document.addEventListener("pet:play", function () {
    sound("play");
    at("stars", locate.button("b"));
  });
  document.addEventListener("pet:exit", function () {
    sound("exit");
  });
  document.addEventListener("pet:correct", function (e) {
    sound("coin");
    at("coins", locate.screen(e.detail.x, e.detail.y));
  });
  document.addEventListener("pet:wrong", function (e) {
    sound("wrong");
    at("smoke", locate.screen(e.detail.x, e.detail.y));
  });
  document.addEventListener("pet:over", function () {
    sound("over");
    at("confetti", locate.screen(40, 24));
  });
  document.addEventListener("pet:sleep", function () {
    sound("sleep");
    at("zzz", locate.button("c"));
  });
  document.addEventListener("pet:wake", function () {
    sound("wake");
    at("sun", locate.button("c"));
  });
  document.addEventListener("pet:tap", function (e) {
    sound("bubble");
    at("bubbles", locate.screen(e.detail.x, e.detail.y));
  });
  document.addEventListener("pet:open", function () {
    sound("whoosh");
  });
  document.addEventListener("pet:close", function () {
    sound("whoosh");
  });
})();
