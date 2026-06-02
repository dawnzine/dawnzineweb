(function () {
  const grid = document.getElementById("works-grid");
  const modal = document.getElementById("work-modal");
  if (!grid) return;

  const URL_CAT_MAP = {
    visual: "brand",
    short: "brand",
    brand: "brand",
    institution: "institution",
    design: "design",
    theater: "theater",
    film: "film",
  };

  let works = [];

  function getFilterFromUrl() {
    const cat = new URLSearchParams(window.location.search).get("cat");
    return cat && URL_CAT_MAP[cat] ? URL_CAT_MAP[cat] : "brand";
  }

  function render(items, cat = "brand") {
    const isPosterWall = cat === "film";
    grid.classList.toggle("poster-wall", isPosterWall);
    grid.innerHTML = items
      .map(
        (w) => `
      <article class="work-card ${w.featured ? "featured" : ""} ${w.poster ? "poster-card" : ""} ${w.aspectRatio ? "design-card" : ""} ${w.category === "theater" ? "theater-card" : ""}" data-id="${w.id}" data-poster="${w.poster ? "true" : "false"}" style="${w.aspectRatio ? `aspect-ratio: ${w.aspectRatio};` : ""}">
        <img class="work-card-img" src="${w.cover}" alt="" loading="lazy">
        <div class="work-card-overlay" style="${w.poster ? "display: none;" : ""}">
          <span class="case-label">${w.categoryLabel}｜</span>
          <h3>${w.title}</h3>
        </div>
      </article>`
      )
      .join("");

    grid.querySelectorAll(".work-card").forEach((card) => {
      if (card.dataset.poster !== "true") {
        card.addEventListener("click", () => openModal(card.dataset.id));
      }
    });
  }
  

  function openModal(id) {
    const w = works.find((x) => x.id === id);
    if (!w || !modal) return;

    const mediaEl = modal.querySelector(".modal-media");
    const titleEl = modal.querySelector("[data-modal-title]");
    const clientEl = modal.querySelector("[data-modal-client]");
    const descEl = modal.querySelector("[data-modal-desc]");

    if (w.video) {
      mediaEl.classList.add("has-video");
      mediaEl.style.backgroundImage = "";
      mediaEl.innerHTML = `<video controls poster="${w.cover}" preload="metadata"><source src="${w.video}" type="video/mp4"></video><button class="modal-play-button" type="button" aria-label="播放视频"><span></span></button>`;
      setupModalVideoPlayback(mediaEl.querySelector("video"));
    } else {
      mediaEl.classList.remove("has-video");
      mediaEl.innerHTML = "";
      mediaEl.style.backgroundImage = `url('${w.cover}')`;
    }

    titleEl.textContent = w.title;
    clientEl.textContent = w.client;
    descEl.textContent = w.description;
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    const v = modal.querySelector("video");
    if (v) v.pause();
  }

  function setupModalVideoPlayback(video) {
    if (!video) return;
    const mediaEl = video.closest(".modal-media");
    const playButton = mediaEl?.querySelector(".modal-play-button");

    const syncPlayState = () => {
      mediaEl?.classList.toggle("is-playing", !video.paused && !video.ended);
    };

    playButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      video.play().catch(() => undefined);
    });

    video.addEventListener("play", syncPlayState);
    video.addEventListener("pause", syncPlayState);
    video.addEventListener("ended", syncPlayState);

    video.addEventListener("click", (event) => {
      const rect = video.getBoundingClientRect();
      const controlsSafeZone = 48;
      const isControlsArea = event.clientY > rect.bottom - controlsSafeZone;
      if (isControlsArea) return;

      if (video.paused) {
        video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    });

    syncPlayState();
  }

  function setFilter(cat) {
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.filter === cat);
    });
    const filtered = works.filter((w) => w.category === cat);
    render(filtered, cat);
  }

  if (modal) {
    modal.querySelector(".modal-backdrop")?.addEventListener("click", closeModal);
    modal.querySelector(".modal-close")?.addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => setFilter(btn.dataset.filter));
  });

  function init(data) {
    works = data;
    const urlCat = getFilterFromUrl();
    setFilter(urlCat);
  }

  if (window.WORKS_DATA) {
    init(window.WORKS_DATA);
    return;
  }

  fetch("data/works.json")
    .then((r) => r.json())
    .then(init)
    .catch(() => {
      grid.innerHTML =
        '<p style="color:var(--muted);text-align:center;grid-column:1/-1">案例数据加载失败。请在项目目录运行：<code style="color:var(--gold)">python3 -m http.server 8080</code> 后访问。</p>';
    });
})();
