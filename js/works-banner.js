(function () {
  const root = document.querySelector("[data-works-banner]");
  if (!root) return;

  const slides = Array.from(root.querySelectorAll(".works-banner-slide"));
  const progressItems = Array.from(root.querySelectorAll(".works-banner-progress-track"));
  if (!slides.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let activeIndex = 0;
  let startTime = performance.now();
  let animationFrame = 0;
  let isDragging = false;
  let pointerStart = 0;
  let pointerCurrent = 0;

  activate(0, 1);
  setupDrag();
  startLoop();

  function startLoop() {
    if (prefersReducedMotion) return;
    cancelAnimationFrame(animationFrame);
    startTime = performance.now();
    animationFrame = requestAnimationFrame(tick);
  }

  function tick(now) {
    if (isDragging) {
      animationFrame = requestAnimationFrame(tick);
      return;
    }

    const duration = readTimeVar(root, "--works-banner-duration", 5200);
    const progress = Math.min((now - startTime) / duration, 1);
    setProgress(activeIndex, progress);

    if (progress >= 1) {
      activate(activeIndex + 1, 1);
      startTime = now;
    }

    animationFrame = requestAnimationFrame(tick);
  }

  function activate(index, direction) {
    const nextIndex = normalizeIndex(index);
    const previousIndex = activeIndex;
    activeIndex = nextIndex;

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeIndex;
      slide.classList.toggle("is-active", isActive);
      slide.classList.toggle("is-prev", direction < 0);

      const video = slide.querySelector("video");
      if (!video) return;

      if (isActive) {
        video.currentTime = 0;
        video.muted = true;
        video.play()
          .then(() => slide.classList.add("is-video-ready"))
          .catch(() => slide.classList.remove("is-video-ready"));
      } else {
        video.pause();
        slide.classList.remove("is-video-ready");
      }
    });

    progressItems.forEach((item, itemIndex) => {
      item.classList.toggle("is-active", itemIndex === activeIndex);
      item.classList.toggle("is-complete", itemIndex < activeIndex && direction > 0);
      item.style.setProperty("--banner-progress", itemIndex === activeIndex ? "0" : "0");
    });

    if (direction < 0 && previousIndex === 0 && activeIndex === slides.length - 1) {
      progressItems.forEach((item) => item.classList.remove("is-complete"));
    }
  }

  function setupDrag() {
    root.addEventListener("pointerdown", (event) => {
      isDragging = true;
      pointerStart = event.clientX;
      pointerCurrent = event.clientX;
      root.classList.add("is-dragging");
      root.setPointerCapture?.(event.pointerId);
    });

    root.addEventListener("pointermove", (event) => {
      if (!isDragging) return;
      pointerCurrent = event.clientX;
    });

    root.addEventListener("pointerup", (event) => endDrag(event));
    root.addEventListener("pointercancel", (event) => endDrag(event));
  }

  function endDrag(event) {
    if (!isDragging) return;
    isDragging = false;
    root.classList.remove("is-dragging");
    root.releasePointerCapture?.(event.pointerId);

    const delta = pointerCurrent - pointerStart;
    const threshold = Math.max(root.offsetWidth * 0.08, 48);

    if (Math.abs(delta) > threshold) {
      const direction = delta < 0 ? 1 : -1;
      activate(activeIndex + direction, direction);
    }

    startLoop();
  }

  function setProgress(index, value) {
    const item = progressItems[index];
    if (!item) return;
    item.classList.add("is-active");
    item.style.setProperty("--banner-progress", value.toFixed(4));
  }

  function normalizeIndex(index) {
    return (index + slides.length) % slides.length;
  }

  function readTimeVar(element, name, fallback) {
    const value = getComputedStyle(element).getPropertyValue(name).trim();
    if (!value) return fallback;
    if (value.endsWith("ms")) return Number.parseFloat(value);
    if (value.endsWith("s")) return Number.parseFloat(value) * 1000;
    return Number.parseFloat(value) || fallback;
  }
})();
