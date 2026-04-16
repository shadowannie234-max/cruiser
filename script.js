/**
 * Resolves paths like "assets/x.png" for GitHub Pages project URLs (/repo or /repo/index.html).
 * Keeps plain relative paths for file:// so local open still works.
 */
function resolveAssetUrl(relativePath) {
  if (!relativePath || typeof relativePath !== "string") return relativePath;
  if (location.protocol === "file:") return relativePath;
  var path = location.pathname.replace(/\/index\.html?$/i, "");
  if (!path.endsWith("/")) path += "/";
  try {
    return new URL(relativePath.replace(/^\//, ""), location.origin + path).href;
  } catch {
    return relativePath;
  }
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    const id = anchor.getAttribute("href");
    if (!id || id === "#") return;
    const el = document.querySelector(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const heroVideo = document.querySelector(".hero__video");
if (heroVideo && prefersReducedMotion) {
  heroVideo.pause();
  heroVideo.removeAttribute("autoplay");
}

if (!prefersReducedMotion) {
  const revealEls = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      root: null,
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.12,
    }
  );

  revealEls.forEach((el) => observer.observe(el));
}

const BOTTLE_SLIDES = [
  {
    src: resolveAssetUrl("assets/bottle-slate-blue.png"),
    label: "Cruiser · Slate",
    alt: "Cruiser water bottle in slate blue-grey matte with Cruiser yacht logo",
    backdrop: "#4a5562",
  },
  {
    src: resolveAssetUrl("assets/bottle-sage-green.png"),
    label: "Cruiser · Sage",
    alt: "Cruiser water bottle in sage green matte with Cruiser yacht logo",
    backdrop: "#84a98c",
  },
  {
    src: resolveAssetUrl("assets/bottle-dusty-rose.png"),
    label: "Cruiser · Rose",
    alt: "Cruiser water bottle in dusty rose matte with Cruiser yacht logo",
    backdrop: "#c38e8e",
  },
  {
    src: resolveAssetUrl("assets/bottle-dark-teal.png"),
    label: "Cruiser · Teal",
    alt: "Cruiser water bottle in dark teal matte with Cruiser yacht logo",
    backdrop: "#205060",
  },
];

/**
 * One continuous 3D turn. MAX_YAW_DEG < 90 so the flat label never vanishes to zero width.
 * Crossfade: top layer (B) fades in over a full-opacity base (A) — avoids 50/50 dimming pop.
 */
const SPIN_MS = 820;
const BOTTLE_DEPTH_PX = 80;
const BOTTLE_TILT_X = -4;
/** Peak |Y| rotation — stay under 90° so the bottle silhouette stays visible. */
const MAX_YAW_DEG = 58;
const CROSSFADE_U0 = 0.43;
const CROSSFADE_U1 = 0.57;

function bottleTransform(angleY) {
  return `translate3d(0, 0, ${BOTTLE_DEPTH_PX}px) rotateX(${BOTTLE_TILT_X}deg) rotateY(${angleY}deg)`;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function rotationDegrees(u, forward) {
  if (u <= 0.5) {
    const k = u / 0.5;
    return forward ? k * MAX_YAW_DEG : k * -MAX_YAW_DEG;
  }
  const k = (u - 0.5) / 0.5;
  return forward ? -MAX_YAW_DEG + k * MAX_YAW_DEG : MAX_YAW_DEG - k * MAX_YAW_DEG;
}

function crossfadeBlend(u) {
  if (u <= CROSSFADE_U0) return 0;
  if (u >= CROSSFADE_U1) return 1;
  return (u - CROSSFADE_U0) / (CROSSFADE_U1 - CROSSFADE_U0);
}

function smoothstep01(t) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function preloadSlideTexture(slide) {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => {
      if (typeof im.decode === "function") {
        im.decode().then(resolve).catch(resolve);
      } else {
        resolve();
      }
    };
    im.onerror = resolve;
    im.src = slide.src;
  });
}

function prefetchAllBottleTextures() {
  BOTTLE_SLIDES.forEach((slide) => {
    const im = new Image();
    im.src = slide.src;
  });
}

function initBottleCarousel() {
  const root = document.querySelector("[data-bottle-carousel]");
  if (!root) return;

  const flip = root.querySelector("[data-bottle-flip]");
  const imgA = root.querySelector(".bottle-carousel__img--a");
  const imgB = root.querySelector(".bottle-carousel__img--b");
  const caption = root.querySelector(".bottle-carousel__caption");
  const backdrop = root.querySelector("[data-bottle-backdrop]");
  const prev = root.querySelector(".bottle-carousel__arrow--prev");
  const next = root.querySelector(".bottle-carousel__arrow--next");
  if (!flip || !imgA || !imgB || !caption || !backdrop || !prev || !next) return;

  const L = BOTTLE_SLIDES.length;
  let index = 0;
  let firstPaint = true;
  let rafId = 0;
  let spinGeneration = 0;

  function applyBothStatic(slide) {
    imgA.src = slide.src;
    imgA.alt = slide.alt;
    imgB.src = slide.src;
    imgB.alt = slide.alt;
    imgA.style.opacity = "1";
    imgB.style.opacity = "0";
    caption.textContent = slide.label;
    backdrop.style.backgroundColor = slide.backdrop;
  }

  function go(rawN) {
    const fromIndex = index;
    const targetIndex = ((rawN % L) + L) % L;
    const slide = BOTTLE_SLIDES[targetIndex];

    if (fromIndex === targetIndex && !firstPaint) return;

    if (firstPaint || prefersReducedMotion) {
      firstPaint = false;
      index = targetIndex;
      applyBothStatic(slide);
      return;
    }

    cancelAnimationFrame(rafId);
    flip.style.transition = "none";
    flip.style.transform = "";
    applyBothStatic(BOTTLE_SLIDES[fromIndex]);

    const forward = (fromIndex + 1) % L === targetIndex;
    const gen = ++spinGeneration;

    void (async () => {
      await preloadSlideTexture(slide);
      if (gen !== spinGeneration) return;

      cancelAnimationFrame(rafId);
      flip.style.transition = "none";
      flip.style.transform = "";

      const fromSlide = BOTTLE_SLIDES[fromIndex];
      imgA.src = fromSlide.src;
      imgA.alt = fromSlide.alt;
      imgB.src = slide.src;
      imgB.alt = slide.alt;
      imgA.style.opacity = "1";
      imgB.style.opacity = "0";

      let captionUpdated = false;
      const start = performance.now();

      function frame(now) {
        if (gen !== spinGeneration) return;

        const tLin = Math.min(1, (now - start) / SPIN_MS);
        const u = easeInOutCubic(tLin);
        const blend = smoothstep01(crossfadeBlend(u));

        imgA.style.opacity = "1";
        imgB.style.opacity = String(blend);

        if (!captionUpdated && blend >= 0.5) {
          caption.textContent = slide.label;
          backdrop.style.backgroundColor = slide.backdrop;
          captionUpdated = true;
        }

        const deg = rotationDegrees(u, forward);
        flip.style.transform = bottleTransform(deg);

        if (tLin < 1) {
          rafId = requestAnimationFrame(frame);
        } else {
          index = targetIndex;
          imgA.src = slide.src;
          imgA.alt = slide.alt;
          imgB.src = slide.src;
          imgB.alt = slide.alt;
          imgA.style.opacity = "1";
          imgB.style.opacity = "0";
          caption.textContent = slide.label;
          backdrop.style.backgroundColor = slide.backdrop;
          flip.style.removeProperty("transition");
          flip.style.removeProperty("transform");
        }
      }

      rafId = requestAnimationFrame(frame);
    })();
  }

  prev.addEventListener("click", () => go(index - 1));
  next.addEventListener("click", () => go(index + 1));

  root.tabIndex = 0;
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1);
    }
  });

  let touchStartX = null;
  root.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );
  root.addEventListener(
    "touchend",
    (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].screenX - touchStartX;
      touchStartX = null;
      if (Math.abs(dx) < 48) return;
      if (dx < 0) go(index + 1);
      else go(index - 1);
    },
    { passive: true }
  );

  go(0);
  prefetchAllBottleTextures();
}

initBottleCarousel();
