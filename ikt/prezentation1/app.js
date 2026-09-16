(() => {
  const $ = (selector) => document.querySelector(selector);
  const slides = [...document.querySelectorAll(".slide")];

  const progress = $("#progress");
  const counter = $("#counter");
  const hint = $("#hint");
  const stage = $("#stage");
  const fsBtn = $("#fsBtn");
  const searchBtn = $("#searchBtn");
  const searchOut = $("#searchOut");

  const total = slides.length;
  let index = 0;
  let lastIndex = 0;
  let touchX = null;

  const pad = (number) => String(number).padStart(2, "0");

  // Kiolvassa a dia számát az URL-ből, például: #slide-3.
  function readHash() {
    const match = location.hash.match(/slide-(\d+)/i);
    if (!match) return 0;

    const slide = Number(match[1]) - 1;
    return Number.isNaN(slide) ? 0 : Math.max(0, Math.min(total - 1, slide));
  }

  // Az aktuális dia megosztható és könyvjelzőzhető marad.
  function writeHash(slideIndex) {
    const hash = `#slide-${slideIndex + 1}`;
    if (location.hash !== hash) {
      history.replaceState(null, "", hash);
    }
  }

  // A 1920×1080-as bemutatót a böngészőablak méretéhez igazítja.
  function scaleStage() {
    const gutterX = 48;
    const gutterTop = 32;
    const chromeHeight = 84;

    const availableWidth = Math.max(320, innerWidth - gutterX * 2);
    const availableHeight = Math.max(320, innerHeight - gutterTop - chromeHeight);
    const scale = Math.min(availableWidth / 1920, availableHeight / 1080);

    stage.style.transform = `scale(${scale})`;
  }

  const isFullscreen = () => Boolean(document.fullscreenElement);

  // Frissíti a látható diát és az összes navigációs jelzőt.
  function render() {
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === index);
      slide.classList.toggle("is-exit", slideIndex === lastIndex && slideIndex !== index);
    });

    progress.style.width = `${((index + 1) / total) * 100}%`;
    counter.textContent = `${pad(index + 1)} / ${pad(total)}`;
    hint.textContent = index === total - 1
      ? "Vége · ← vissza"
      : "→ a folytatáshoz · F: teljes képernyő";

    fsBtn.textContent = isFullscreen() ? "Kilépés" : "Teljes képernyő";

    writeHash(index);
    lastIndex = index;
  }

  function go(delta) {
    const next = index + delta;
    if (next >= 0 && next < total) {
      index = next;
      render();
    }
  }

  function goTo(slideIndex) {
    index = Math.max(0, Math.min(total - 1, slideIndex));
    render();
  }

  // A böngésző teljes képernyős módjának be- és kikapcsolása.
  async function toggleFullscreen() {
    try {
      if (isFullscreen()) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // A böngésző letilthatja a teljes képernyőt; a bemutató ettől továbbra is használható marad.
      scaleStage();
    }
  }

  // Alsó navigációs gombok.
  $("#prevBtn").addEventListener("click", () => go(-1));
  $("#nextBtn").addEventListener("click", () => go(1));
  fsBtn.addEventListener("click", toggleFullscreen);

  // Billentyűzetes navigáció.
  document.addEventListener("keydown", (event) => {
    const tag = event.target?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    if (["ArrowRight", " ", "PageDown"].includes(event.key)) {
      event.preventDefault();
      go(1);
    } else if (["ArrowLeft", "PageUp"].includes(event.key)) {
      event.preventDefault();
      go(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(total - 1);
    } else if (event.key.toLowerCase() === "f") {
      event.preventDefault();
      toggleFullscreen();
    }
  });

  // Érintéses lapozás telefonokon és táblagépeken.
  document.addEventListener("touchstart", (event) => {
    if (event.touches.length === 1) {
      touchX = event.touches[0].clientX;
    }
  }, { passive: true });

  document.addEventListener("touchend", (event) => {
    if (touchX === null) return;

    const distance = event.changedTouches[0].clientX - touchX;
    if (Math.abs(distance) > 50) {
      go(distance < 0 ? 1 : -1);
    }

    touchX = null;
  }, { passive: true });

  // Közvetlen navigáció engedélyezése az URL-ben szereplő #slide-N segítségével.
  window.addEventListener("hashchange", () => {
    const slideFromHash = readHash();
    if (slideFromHash !== index) {
      index = slideFromHash;
      render();
    }
  });

  // Kis interaktív bemutató a 10. dián.
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      searchOut.textContent = "≈ 4 280 000 000 találat · 0,32 mp";
      searchOut.classList.add("flash");

      setTimeout(() => searchOut.classList.remove("flash"), 600);
    });
  }

  // Átméretezés vagy teljes képernyős mód változása után is illeszkedjen a bemutató.
  window.addEventListener("resize", scaleStage);
  document.addEventListener("fullscreenchange", () => {
    scaleStage();
    render();
  });

  // Kezdeti állapot.
  index = readHash();
  scaleStage();
  render();
})();
