(function () {
  const mediaBlocks = Array.from(document.querySelectorAll("[data-service-media]"));
  if (!mediaBlocks.length) return;

  const IMAGE_DURATION = 0;
  const VIDEO_DURATION = 6000;

  mediaBlocks.forEach((block) => {
    const slides = Array.from(block.querySelectorAll(".service-story-visual"));
    if (slides.length < 2) return;

    const image = slides.find((slide) => slide.tagName.toLowerCase() === "img");
    const video = slides.find((slide) => slide.tagName.toLowerCase() === "video");
    if (!image || !video) return;

    let activeIndex = 0;
    let timer = 0;

    const activate = (index) => {
      activeIndex = index;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === activeIndex);
      });

      if (slides[activeIndex] === video) {
        video.currentTime = 0;
        video.muted = true;
        video.play().catch(() => undefined);
        timer = window.setTimeout(() => activate(slides.indexOf(image)), VIDEO_DURATION);
        return;
      }

      video.pause();
      timer = window.setTimeout(() => activate(slides.indexOf(video)), IMAGE_DURATION);
    };

    const stop = () => {
      window.clearTimeout(timer);
      video.pause();
    };

    const start = () => {
      stop();
      activate(activeIndex);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          start();
        } else {
          stop();
        }
      });
    }, { threshold: 0.24 });

    observer.observe(block);
  });
})();
