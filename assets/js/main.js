(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Navigasi dock: home / works / quests / profile ---------- */
  var views = {};
  document.querySelectorAll("[data-view]").forEach(function (el) {
    views[el.getAttribute("data-view")] = el;
  });
  var dockLinks = document.querySelectorAll("[data-dock]");
  var baseTitle = document.title;
  var current = null;

  function viewFromHash() {
    var name = location.hash.replace("#", "");
    return views[name] ? name : null;
  }

  function show(name, initial) {
    if (!views[name]) name = "home";
    if (name === current) return;
    current = name;
    Object.keys(views).forEach(function (key) {
      var el = views[key];
      var on = key === name;
      el.hidden = !on;
      el.classList.remove("is-entering");
      if (on && !initial) {
        void el.offsetWidth;
        el.classList.add("is-entering");
      }
    });
    dockLinks.forEach(function (link) {
      if (link.getAttribute("data-dock") === name) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    document.title = name === "home" ? baseTitle : name.charAt(0).toUpperCase() + name.slice(1) + " - " + baseTitle.split(" - ")[0];
    if (!initial) window.scrollTo(0, 0);
    document.dispatchEvent(new CustomEvent("viewchange", { detail: name }));
  }

  if (Object.keys(views).length) {
    show(viewFromHash() || "home", true);
    window.addEventListener("hashchange", function () {
      var name = viewFromHash();
      if (name) show(name);
      else if (!location.hash) show("home");
    });
  }

  dockLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      link.classList.remove("is-bouncing");
      void link.offsetWidth;
      link.classList.add("is-bouncing");
    });
    link.addEventListener("animationend", function () {
      link.classList.remove("is-bouncing");
    });
  });

  /* ---------- Efek mengetik di kartu proyek ---------- */
  document.querySelectorAll("[data-type]").forEach(function (el, index) {
    var phrases = el.getAttribute("data-type").split("|");
    if (reduceMotion || phrases.length < 2) return;
    var p = 0;
    var text = phrases[0];
    var deleting = true;

    function step() {
      // berhenti sementara kalau kartunya tidak terlihat
      if (el.offsetParent === null) {
        setTimeout(step, 600);
        return;
      }
      var target = phrases[p];
      if (deleting) {
        text = text.slice(0, -1);
        el.textContent = text;
        if (!text) {
          deleting = false;
          p = (p + 1) % phrases.length;
        }
        setTimeout(step, 28);
      } else {
        target = phrases[p];
        text = target.slice(0, text.length + 1);
        el.textContent = text;
        if (text === target) {
          deleting = true;
          setTimeout(step, 2200);
        } else {
          setTimeout(step, 60);
        }
      }
    }
    setTimeout(step, 2400 + index * 700);
  });

  /* ---------- Stiker yang bisa di-drag ---------- */
  var stickers = document.querySelectorAll(".sticker");
  stickers.forEach(function (sticker) {
    var startX = 0;
    var startY = 0;
    var baseX = 0;
    var baseY = 0;
    var pointer = null;

    function pos() {
      return {
        x: parseFloat(sticker.style.getPropertyValue("--x")) || 0,
        y: parseFloat(sticker.style.getPropertyValue("--y")) || 0
      };
    }

    sticker.addEventListener("pointerdown", function (e) {
      pointer = e.pointerId;
      sticker.setPointerCapture(pointer);
      var p = pos();
      baseX = p.x;
      baseY = p.y;
      startX = e.clientX;
      startY = e.clientY;
      sticker.classList.add("is-dragging");
    });

    sticker.addEventListener("pointermove", function (e) {
      if (e.pointerId !== pointer) return;
      sticker.style.setProperty("--x", baseX + e.clientX - startX + "px");
      sticker.style.setProperty("--y", baseY + e.clientY - startY + "px");
    });

    function drop(e) {
      if (e.pointerId !== pointer) return;
      pointer = null;
      sticker.classList.remove("is-dragging");
      sticker.style.setProperty("--r", Math.round(Math.random() * 24 - 12) + "deg");
    }
    sticker.addEventListener("pointerup", drop);
    sticker.addEventListener("pointercancel", drop);

    // keyboard: panah untuk menggeser stiker
    sticker.addEventListener("keydown", function (e) {
      var moves = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -12], ArrowDown: [0, 12] };
      var m = moves[e.key];
      if (!m) return;
      e.preventDefault();
      var p = pos();
      sticker.style.setProperty("--x", p.x + m[0] + "px");
      sticker.style.setProperty("--y", p.y + m[1] + "px");
    });
  });

  var resetBtn = document.querySelector("[data-sticker-reset]");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      stickers.forEach(function (s) {
        s.style.removeProperty("--x");
        s.style.removeProperty("--y");
        s.style.removeProperty("--r");
      });
    });
  }

  /* ---------- Daftar isi studi kasus (penanda bagian aktif) ---------- */
  var tocLinks = document.querySelectorAll(".toc a[href^='#']");
  if (tocLinks.length && "IntersectionObserver" in window) {
    var linkById = {};
    tocLinks.forEach(function (link) {
      linkById[link.getAttribute("href").slice(1)] = link;
    });
    var visible = {};
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          visible[entry.target.id] = entry.isIntersecting;
        });
        for (var i = 0; i < tocLinks.length; i++) {
          var id = tocLinks[i].getAttribute("href").slice(1);
          if (visible[id]) {
            tocLinks.forEach(function (l) {
              l.removeAttribute("aria-current");
            });
            tocLinks[i].setAttribute("aria-current", "true");
            break;
          }
        }
      },
      { rootMargin: "-15% 0px -60% 0px" }
    );
    Object.keys(linkById).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }
})();
