(function () {
  const video = document.querySelector(".hero-video");
  if (!video) return;

  const prefersReduced =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  if (prefersReduced || isMobile) {
    video.removeAttribute("autoplay");
    video.pause();
    return;
  }

  video.muted = true;
  video.playsInline = true;

  const play = () => {
    video.play().catch(() => {
      /* poster fallback */
    });
  };

  if (video.readyState >= 2) play();
  else video.addEventListener("loadeddata", play, { once: true });
})();
