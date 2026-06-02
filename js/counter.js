(function () {
  const section = document.querySelector(".stats-section");
  if (!section) return;

  const items = section.querySelectorAll("[data-target]");
  let started = false;

  function animateValue(el, target, suffix, duration) {
    const start = performance.now();
    const from = 0;

    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.floor(from + (target - from) * eased);
      el.textContent = val.toLocaleString() + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString() + suffix;
    }

    requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting || started) return;
      started = true;
      items.forEach((el) => {
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || "";
        animateValue(el, target, suffix, 2000);
      });
    },
    { threshold: 0.3 }
  );

  observer.observe(section);
})();
