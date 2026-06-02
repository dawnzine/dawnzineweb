(function () {
  const nav = document.querySelector(".site-nav");
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  const page = document.body.dataset.page;

  if (nav) {
    window.addEventListener(
      "scroll",
      () => {
        nav.classList.toggle("is-scrolled", window.scrollY > 40);
      },
      { passive: true }
    );
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
  }

  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = toggle.classList.toggle("is-open");
      links.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open);
    });

    links.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        toggle.classList.remove("is-open");
        links.classList.remove("is-open");
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  if (page && links) {
    links.querySelectorAll(`a[data-nav="${page}"]`).forEach((a) => {
      a.classList.add("is-active");
    });
  }
})();
