(function () {
  const root = document.querySelector("[data-client-radial]");
  if (!root) return;
  root.classList.add("is-enhanced");

  const items = Array.from(root.querySelectorAll(".client-radial-item"));
  if (!items.length) return;

  const core = root.querySelector(".client-radial-core");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const angleOffsets = [0, 11, 5, 19, -25, 5, 24, -10, 30, -18, 7, 7, -5, 16, -21, 9];
  const radiusPattern = [1, 1.12, 0.94, 0.9, 1.2, 1.1, 1.1, 0.9, 1.1, 0.82, 1.10, 0.98, 1.1, 0.78, 1.13, 0.7];

  let resizeTimer = 0;
  let rotation = 0;
  let velocity = 0;
  let isDragging = false;
  let lastAngle = 0;
  let lastTime = 0;
  let inertiaFrame = 0;
  let autoFrame = 0;
  let lastAutoTime = performance.now();

  layoutClients();
  setupHoverFeedback();
  setupDragRotation();
  startAutoRotation();

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(layoutClients, 120);
  });

  // Layout module: distributes items with uneven angular offsets and mixed radii for a less mechanical constellation.
  function layoutClients() {
    const rect = root.getBoundingClientRect();
    const isMobileList = window.matchMedia("(max-width: 700px)").matches;
    root.classList.toggle("is-mobile-list", isMobileList);
    if (isMobileList) return;

    const isCompact = window.matchMedia("(max-width: 900px)").matches;
    const centerX = rect.width / 2;
    const centerY = isCompact ? rect.height * 0.92 : rect.height / 2;
    const radiusScale = readNumber("--client-radius-scale", 0.82);
    const radiusX = rect.width * readPercent(isCompact ? "--client-mobile-radius-x" : "--client-radius-x", 0.42) * radiusScale;
    const radiusY = rect.height * readPercent(isCompact ? "--client-mobile-radius-y" : "--client-radius-y", 0.41) * radiusScale;
    const startAngle = isCompact ? 202 : -92;
    const endAngle = isCompact ? 338 : 268;
    const totalArc = endAngle - startAngle;
    const count = items.length;

    items.forEach((item, index) => {
      const ratio = count === 1 ? 0.5 : index / (count - 1);
      const unevenOffset = isCompact ? angleOffsets[index % angleOffsets.length] * 0.36 : angleOffsets[index % angleOffsets.length];
      const radiusJitter = isCompact ? 0.92 + (radiusPattern[index % radiusPattern.length] - 1) * 0.42 : radiusPattern[index % radiusPattern.length];
      const angle = startAngle + totalArc * ratio + unevenOffset + rotation;
      const radians = (angle * Math.PI) / 180;
      const x = centerX + Math.cos(radians) * radiusX * radiusJitter;
      const y = centerY + Math.sin(radians) * radiusY * radiusJitter;
      const dx = centerX - x;
      const dy = centerY - y;
      const lineLength = Math.max(18, Math.hypot(dx, dy) - item.offsetWidth * 0.44 - getCoreRadius());
      const lineAngle = Math.atan2(dy, dx) * 180 / Math.PI;
      const delay = prefersReducedMotion ? 0 : index * readTimeVar("--client-motion-stagger", 58);

      item.style.setProperty("--item-x", `${x}px`);
      item.style.setProperty("--item-y", `${y}px`);
      item.style.setProperty("--item-line-length", `${lineLength}px`);
      item.style.setProperty("--item-line-angle", `${lineAngle}deg`);
      item.style.setProperty("--item-delay", `${delay}ms`);
    });
  }

  // Interaction module: keeps line, item and center logo in one connected hover state.
  function setupHoverFeedback() {
    items.forEach((item) => {
      item.addEventListener("mouseenter", () => {
        root.classList.add("is-hovering");
        item.classList.add("is-active");
      });

      item.addEventListener("mouseleave", () => {
        item.classList.remove("is-active");
        if (!items.some((entry) => entry.matches(":hover"))) {
          root.classList.remove("is-hovering");
        }
      });

      item.addEventListener("focusin", () => {
        root.classList.add("is-hovering");
        item.classList.add("is-active");
      });

      item.addEventListener("focusout", () => {
        item.classList.remove("is-active");
        root.classList.remove("is-hovering");
      });
    });
  }

  // Drag module: dragging any client rotates the full constellation, then inertia eases it to rest.
  function setupDragRotation() {
    root.addEventListener("pointerdown", (event) => {
      if (root.classList.contains("is-mobile-list")) return;
      if (!event.target.closest(".client-radial-item")) return;
      isDragging = true;
      velocity = 0;
      lastAngle = getPointerAngle(event);
      lastTime = performance.now();
      root.classList.add("is-dragging");
      root.setPointerCapture?.(event.pointerId);
      cancelAnimationFrame(inertiaFrame);
    });

    root.addEventListener("pointermove", (event) => {
      if (!isDragging) return;
      const now = performance.now();
      const currentAngle = getPointerAngle(event);
      const delta = normalizeAngle(currentAngle - lastAngle);
      const elapsed = Math.max(now - lastTime, 16);

      rotation += delta;
      velocity = delta / elapsed;
      lastAngle = currentAngle;
      lastTime = now;
      layoutClients();
    });

    root.addEventListener("pointerup", endDragRotation);
    root.addEventListener("pointercancel", endDragRotation);
  }

  function endDragRotation(event) {
    if (!isDragging) return;
    isDragging = false;
    root.classList.remove("is-dragging");
    root.releasePointerCapture?.(event.pointerId);
    startInertia();
  }

  function startInertia() {
    if (prefersReducedMotion) return;
    const step = () => {
      if (Math.abs(velocity) < 0.002) return;
      rotation += velocity * 16;
      velocity *= 0.94;
      layoutClients();
      inertiaFrame = requestAnimationFrame(step);
    };
    inertiaFrame = requestAnimationFrame(step);
  }

  function startAutoRotation() {
    if (prefersReducedMotion) return;

    const step = (now) => {
      const elapsed = Math.min(now - lastAutoTime, 80);
      lastAutoTime = now;
      const speed = readNumber("--client-auto-rotate-speed", 2.2);

      if (!isDragging && !root.classList.contains("is-mobile-list") && speed !== 0) {
        rotation += speed * (elapsed / 1000);
        layoutClients();
      }

      autoFrame = requestAnimationFrame(step);
    };

    autoFrame = requestAnimationFrame(step);
  }

  function getPointerAngle(event) {
    const rect = root.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + (window.matchMedia("(max-width: 900px)").matches ? rect.height * 0.92 : rect.height / 2);
    return Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI;
  }

  function normalizeAngle(angle) {
    if (angle > 180) return angle - 360;
    if (angle < -180) return angle + 360;
    return angle;
  }

  function getCoreRadius() {
    if (!core) return 0;
    return core.getBoundingClientRect().width / 2;
  }

  function readPercent(name, fallback) {
    const value = getComputedStyle(root).getPropertyValue(name).trim();
    if (!value) return fallback;
    if (value.endsWith("%")) return Number.parseFloat(value) / 100;
    return Number.parseFloat(value) || fallback;
  }

  function readTimeVar(name, fallback) {
    const value = getComputedStyle(root).getPropertyValue(name).trim();
    if (!value) return fallback;
    if (value.endsWith("ms")) return Number.parseFloat(value);
    if (value.endsWith("s")) return Number.parseFloat(value) * 1000;
    return Number.parseFloat(value) || fallback;
  }

  function readNumber(name, fallback) {
    const value = getComputedStyle(root).getPropertyValue(name).trim();
    return Number.parseFloat(value) || fallback;
  }
})();
