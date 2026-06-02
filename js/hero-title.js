(() => {
  const title = document.querySelector('.hero-wave-title');
  if (!title || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const chars = Array.from(title.querySelectorAll('span'));
  const states = chars.map(() => ({ x: 0, y: 0, targetX: 0, targetY: 0 }));
  let frame = null;
  let isActive = false;

  const setTargetsFromPointer = (event) => {
    const pointerX = event.clientX;
    const pointerY = event.clientY;

    chars.forEach((char, index) => {
      const bounds = char.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      const deltaX = centerX - pointerX;
      const deltaY = centerY - pointerY;
      const distance = Math.hypot(deltaX, deltaY);
      const radius = Math.max(bounds.width, 68) * 1.95;
      const force = Math.max(0, 1 - distance / radius);
      const easedForce = force * force * (3 - 2 * force);
      const angle = Math.atan2(deltaY, deltaX);

      states[index].targetX = Math.cos(angle) * 11 * easedForce;
      states[index].targetY = Math.sin(angle) * 7 * easedForce;
    });
  };

  const animate = () => {
    let shouldContinue = isActive;

    chars.forEach((char, index) => {
      const state = states[index];
      state.x += (state.targetX - state.x) * 0.1;
      state.y += (state.targetY - state.y) * 0.1;

      if (Math.abs(state.x) > 0.01 || Math.abs(state.y) > 0.01) {
        shouldContinue = true;
      }

      char.style.setProperty('--char-x', `${state.x.toFixed(2)}px`);
      char.style.setProperty('--char-y', `${state.y.toFixed(2)}px`);
    });

    if (shouldContinue) {
      frame = requestAnimationFrame(animate);
    } else {
      frame = null;
    }
  };

  const startAnimation = () => {
    if (!frame) frame = requestAnimationFrame(animate);
  };

  title.addEventListener('pointermove', (event) => {
    isActive = true;
    setTargetsFromPointer(event);
    startAnimation();
  });

  title.addEventListener('pointerleave', () => {
    isActive = false;
    states.forEach((state) => {
      state.targetX = 0;
      state.targetY = 0;
    });
    startAnimation();
  });
})();
