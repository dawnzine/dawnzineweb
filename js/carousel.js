(function () {
  const root = document.querySelector("[data-presentation-carousel]");
  if (!root) return;

  const viewport = root.querySelector(".presentation-viewport");
  const track = root.querySelector(".presentation-track");
  if (!viewport || !track) return;

  // Config is read from CSS variables so visual timing and motion can be maintained in one place.
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hoverDelay = readTimeVar(root, "--presentation-hover-delay", 1000);
  const infoVisibleTime = readTimeVar(root, "--presentation-overlay-visible-time", 2600);
  const loopFadeTime = readTimeVar(root, "--presentation-loop-fade-time", 520);
  const wheelSpeed = Number.parseFloat(getComputedStyle(root).getPropertyValue("--presentation-wheel-speed")) || 1;
  const damping = Number.parseFloat(getComputedStyle(root).getPropertyValue("--presentation-drag-damping")) || 0.12;

  let position = 0;
  let target = 0;
  let cycleWidth = 0;
  let isDragging = false;
  let pointerStart = 0;
  let targetStart = 0;
  let lastPointer = 0;
  let lastTime = 0;
  let velocity = 0;
  let animationFrame = 0;
  let isHoveringCard = false;

  const playCursor = document.createElement("span");
  playCursor.className = "presentation-play-cursor";
  playCursor.setAttribute("aria-hidden", "true");
  document.body.appendChild(playCursor);
  copyCursorVariables();

  buildCards(Array.from(track.children));
  createLoopClones();
  setupCardInteractions();
  setupDrag();
  setupWheel();
  measure();
  startLoop();

  window.addEventListener("resize", () => {
    copyCursorVariables();
    measure();
  });

  // Cards stay declarative in HTML through data attributes; JS only expands them into media markup.
  function buildCards(cards) {
    cards.forEach((card) => {
      const title = card.dataset.title || "CASE";
      const category = card.dataset.category || "PRESENTATION";
      const cover = card.dataset.cover || "";
      const video = card.dataset.video || "";

      card.innerHTML = `
        <img src="${cover}" alt="${title}" loading="eager" decoding="async">
        <video class="presentation-main-video" muted playsinline preload="auto" poster="${cover}" aria-hidden="true">
          <source src="${video}" type="video/mp4">
        </video>
        <video class="presentation-loop-video" muted playsinline preload="auto" aria-hidden="true">
          <source src="${video}" type="video/mp4">
        </video>
        <div class="presentation-info">
          <span>${category}</span>
          <h3>${title}</h3>
        </div>
      `;
    });
  }

  // One cloned set on each side allows seamless wrapping without visible jumps.
  function createLoopClones() {
    const originals = Array.from(track.children);
    const before = originals.map((card) => cloneCard(card));
    const after = originals.map((card) => cloneCard(card));

    before.reverse().forEach((card) => track.insertBefore(card, track.firstChild));
    after.forEach((card) => track.appendChild(card));
  }

  function cloneCard(card) {
    const clone = card.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    return clone;
  }

  // Hover waits before video playback, while text fades out automatically after the configured window.
  function setupCardInteractions() {
    track.querySelectorAll(".presentation-card").forEach((card) => {
      const video = card.querySelector(".presentation-main-video");
      const loopVideo = card.querySelector(".presentation-loop-video");
      const loopState = { active: video, idle: loopVideo, fadeTimer: 0, isFading: false };
      card._presentationLoop = loopState;
      let playTimer = 0;
      let infoTimer = 0;

      card.addEventListener("pointerenter", (event) => {
        playCursor.classList.add("is-visible");
        updatePlayCursor(event, true);
      });

      card.addEventListener("mouseenter", (event) => {
        isHoveringCard = true;
        velocity = 0;
        playCursor.classList.add("is-visible");
        updatePlayCursor(event, true);
        root.classList.add("is-card-hovered");
        showInfo(card);
        infoTimer = window.setTimeout(() => hideInfo(card), infoVisibleTime);

        if (!video || prefersReducedMotion) return;
        video.load();
        card.classList.add("is-loading");
        playTimer = window.setTimeout(() => playVideo(card, video, loopVideo), hoverDelay);
      });

      card.addEventListener("mouseleave", () => {
        isHoveringCard = false;
        root.classList.remove("is-card-hovered");
        playCursor.classList.remove("is-visible", "is-positioned");
        window.clearTimeout(playTimer);
        window.clearTimeout(infoTimer);
        hideInfo(card);
        resetVideo(card, video, loopVideo);
      });

      card.addEventListener("mousemove", (event) => {
        updatePlayCursor(event);
      });

      video?.addEventListener("loadeddata", () => {
        card.classList.remove("is-loading");
      });

      video?.addEventListener("waiting", () => {
        if (card.classList.contains("is-playing")) card.classList.add("is-loading");
      });

      video?.addEventListener("playing", () => {
        card.classList.remove("is-loading");
      });

      [video, loopVideo].forEach((media) => {
        media?.addEventListener("timeupdate", () => {
          applyLoopFade(card);
        });

        media?.addEventListener("ended", () => {
          applyLoopFade(card, true);
        });
      });
    });
  }

  function showInfo(card) {
    card.classList.add("is-info-visible");
  }

  function hideInfo(card) {
    card.classList.remove("is-info-visible");
  }

  function playVideo(card, video, loopVideo) {
    if (!video) return;

    const state = card._presentationLoop;
    if (state) {
      window.clearTimeout(state.fadeTimer);
      state.active = video;
      state.idle = loopVideo;
      state.isFading = false;
    }

    card.classList.remove("is-loop-fading", "is-using-loop-video");

    if (loopVideo) {
      loopVideo.pause();
      setVideoTime(loopVideo, 0);
    }

    const revealWhenReady = () => {
      if (video.readyState >= 2 && !video.paused) {
        requestAnimationFrame(() => {
          card.classList.add("is-playing");
          card.classList.remove("is-loading");
        });
        return true;
      }
      return false;
    };

    const attempt = video.play();

    if (revealWhenReady()) return;

    const onReady = () => {
      revealWhenReady();
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("playing", onReady);
    };

    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("playing", onReady);

    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => {
        video.removeEventListener("loadeddata", onReady);
        video.removeEventListener("canplay", onReady);
        video.removeEventListener("playing", onReady);
        card.classList.remove("is-playing", "is-loading");
      });
    }
  }

  function resetVideo(card, video, loopVideo) {
    card.classList.remove("is-playing", "is-loading", "is-loop-fading", "is-using-loop-video");
    const state = card._presentationLoop;
    if (state) {
      window.clearTimeout(state.fadeTimer);
      state.active = video;
      state.idle = loopVideo;
      state.isFading = false;
    }
    if (loopVideo) {
      loopVideo.pause();
      setVideoTime(loopVideo, 0);
    }
    if (!video) return;
    video.pause();
    window.setTimeout(() => {
      if (!card.matches(":hover")) setVideoTime(video, 0);
    }, 180);
  }

  function updatePlayCursor(event, immediate = false) {
    const cursorSize = playCursor.offsetWidth || 24;
    const scale = playCursor.classList.contains("is-visible") ? 1 : 0.92;
    playCursor.style.transform = `translate3d(${event.clientX - cursorSize / 2}px, ${event.clientY - cursorSize / 2}px, 0) scale(${scale})`;

    if (immediate) {
      playCursor.classList.add("is-positioned");
    }
  }

  function copyCursorVariables() {
    const styles = getComputedStyle(root);
    ["--presentation-play-size", "--presentation-play-bg", "--presentation-play-border"].forEach((name) => {
      playCursor.style.setProperty(name, styles.getPropertyValue(name));
    });
  }

  function applyLoopFade(card, force = false) {
    const state = card._presentationLoop;
    if (!state?.active || !state.idle || !card.classList.contains("is-playing")) return;
    if (state.isFading) return;

    const active = state.active;
    if (!active.duration) return;

    const fadeWindow = loopFadeTime / 1000;
    const remaining = active.duration - active.currentTime;

    if (!force && (remaining > fadeWindow || active.currentTime <= fadeWindow)) return;

    state.isFading = true;
    window.clearTimeout(state.fadeTimer);
    setVideoTime(state.idle, 0);

    const attempt = state.idle.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => {
        state.isFading = false;
        card.classList.remove("is-loop-fading");
      });
    }

    card.classList.add("is-loop-fading");

    state.fadeTimer = window.setTimeout(() => {
      const previous = state.active;
      state.active = state.idle;
      state.idle = previous;
      previous.pause();
      setVideoTime(previous, 0);

      card.classList.toggle("is-using-loop-video", state.active.classList.contains("presentation-loop-video"));
      card.classList.remove("is-loop-fading");
      state.isFading = false;
    }, loopFadeTime);
  }

  function setVideoTime(video, time) {
    try {
      video.currentTime = time;
    } catch {
      // Safari can reject currentTime writes before metadata is ready; the next playback cycle will retry.
    }
  }

  // Pointer events support mouse and touch dragging while preserving vertical page scroll on mobile.
  function setupDrag() {
    viewport.addEventListener("pointerdown", (event) => {
      isDragging = true;
      pointerStart = event.clientX;
      targetStart = target;
      lastPointer = event.clientX;
      lastTime = performance.now();
      velocity = 0;
      viewport.classList.add("is-dragging");
      viewport.setPointerCapture?.(event.pointerId);
    });

    viewport.addEventListener("pointermove", (event) => {
      if (!isDragging) return;
      const now = performance.now();
      const delta = event.clientX - pointerStart;
      const frameDelta = event.clientX - lastPointer;
      const frameTime = Math.max(now - lastTime, 16);

      target = targetStart + delta;
      velocity = frameDelta / frameTime;
      lastPointer = event.clientX;
      lastTime = now;
    });

    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    viewport.addEventListener("pointerleave", () => {
      if (isDragging) endDrag();
    });
  }

  function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    viewport.classList.remove("is-dragging");
    target += velocity * 420;
  }

  function setupWheel() {
    viewport.addEventListener("wheel", (event) => {
      if (Math.abs(event.deltaX) < 1 || Math.abs(event.deltaX) < Math.abs(event.deltaY)) return;

      event.preventDefault();
      velocity = 0;
      target -= event.deltaX * wheelSpeed;
    }, { passive: false });
  }

  function measure() {
    const cards = Array.from(track.querySelectorAll(".presentation-card"));
    if (cards.length < 3) return;

    const originalCount = cards.length / 3;
    const firstOriginal = cards[originalCount];
    const lastOriginal = cards[originalCount * 2 - 1];
    const firstOriginalLeft = firstOriginal.offsetLeft;
    const lastOriginalRight = lastOriginal.offsetLeft + lastOriginal.offsetWidth;

    cycleWidth = lastOriginalRight - firstOriginalLeft + getGap();
    position = viewport.clientWidth / 2 - firstOriginalLeft - firstOriginal.offsetWidth / 2;
    target = position;
    applyTransform();
  }

  function getGap() {
    const styles = getComputedStyle(track);
    return Number.parseFloat(styles.columnGap || styles.gap) || 0;
  }

  function startLoop() {
    cancelAnimationFrame(animationFrame);
    tick();
  }

  // The render loop applies damping and inertia, then wraps inside the cloned carousel range.
  function tick() {
    if (!isDragging && !isHoveringCard) target -= 0.18;
    if (!isDragging && !isHoveringCard && Math.abs(velocity) > 0.001) {
      target += velocity * 16;
      velocity *= 0.94;
    }

    position += (target - position) * damping;
    wrapPosition();
    applyTransform();
    animationFrame = requestAnimationFrame(tick);
  }

  function wrapPosition() {
    if (!cycleWidth) return;

    if (position <= -cycleWidth * 2) {
      position += cycleWidth;
      target += cycleWidth;
    }

    if (position >= 0) {
      position -= cycleWidth;
      target -= cycleWidth;
    }
  }

  function applyTransform() {
    track.style.transform = `translate3d(${position}px, 0, 0)`;
  }

  function readTimeVar(element, name, fallback) {
    const value = getComputedStyle(element).getPropertyValue(name).trim();
    if (!value) return fallback;
    if (value.endsWith("ms")) return Number.parseFloat(value);
    if (value.endsWith("s")) return Number.parseFloat(value) * 1000;
    return Number.parseFloat(value) || fallback;
  }
})();
