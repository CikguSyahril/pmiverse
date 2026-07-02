/* =========================================================
   PMIverse — script.js
   Vanilla JS + Three.js + GSAP/ScrollTrigger. No frameworks.
   ========================================================= */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  /* ---------------------------------------------------------
     0. PWA SERVICE WORKER
     Registered with a relative path so it also works when the
     site is served from a GitHub Pages subpath (e.g. /repo/).
  --------------------------------------------------------- */
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {
        /* Offline caching is a nice-to-have — never block the page on it. */
      });
    });
  }

  /* ---------------------------------------------------------
     1. PRELOADER
  --------------------------------------------------------- */
  function refreshScrollTrigger() {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  window.addEventListener("load", () => {
    const preloader = document.getElementById("preloader");
    setTimeout(() => {
      preloader.classList.add("is-hidden");
      document.body.style.overflow = "";
      initHeroTimeline();
      if (!reduceMotion) {
        gsap.from("#agentWidget .agent-widget__toggle", {
          scale: 0, opacity: 0, duration: 0.7, delay: 0.4, ease: "back.out(1.8)",
        });
      }
      // Layout keeps shifting after load (webfont swap, Three.js canvas sizing),
      // which silently invalidates ScrollTrigger's cached trigger positions —
      // refresh a few times as things settle so section reveals fire at the right spot.
      refreshScrollTrigger();
      setTimeout(refreshScrollTrigger, 1000);
      setTimeout(refreshScrollTrigger, 2200);
    }, 900);
  });
  document.body.style.overflow = "hidden";

  // Webfonts swapping in also change text height/wrap — refresh once they're ready.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(refreshScrollTrigger);
  }

  /* ---------------------------------------------------------
     2. CUSTOM CURSOR
  --------------------------------------------------------- */
  if (!isTouch) {
    const dot = document.getElementById("cursorDot");
    const ring = document.getElementById("cursorRing");
    const ringX = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3" });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });

    window.addEventListener("mousemove", (e) => {
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
    });

    document.querySelectorAll("a, button, .tilt-card, .flip-card, [data-tilt], .agent-widget__toggle").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-active"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-active"));
    });
  }

  /* ---------------------------------------------------------
     3. SCROLL PROGRESS + NAV STATE
  --------------------------------------------------------- */
  const progressBar = document.getElementById("scrollProgress");
  const nav = document.getElementById("siteNav");
  const navLinks = document.querySelectorAll("[data-nav]");
  const sections = document.querySelectorAll("main .section[id]");

  function onScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = `${(scrollTop / docHeight) * 100}%`;
    nav.classList.toggle("is-scrolled", scrollTop > 40);

    let current = "";
    sections.forEach((sec) => {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= 120 && rect.bottom >= 120) current = sec.id;
    });
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${current}`);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     4. MOBILE NAV TOGGLE
  --------------------------------------------------------- */
  const navToggle = document.getElementById("navToggle");
  const navLinksWrap = document.getElementById("navLinks");
  navToggle.addEventListener("click", () => {
    const open = navToggle.classList.toggle("is-open");
    navLinksWrap.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  });
  navLinksWrap.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      navToggle.classList.remove("is-open");
      navLinksWrap.classList.remove("is-open");
    })
  );

  /* ---------------------------------------------------------
     5. YEAR STAMP
  --------------------------------------------------------- */
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     6. SPLIT TITLE TEXT INTO WORDS/LETTERS FOR REVEAL
  --------------------------------------------------------- */
  document.querySelectorAll("[data-split]").forEach((el) => {
    // Treat <br> as a space so line-break markup doesn't glue words together
    const text = el.innerHTML.replace(/<br\s*\/?>/gi, " ").trim().replace(/\s+/g, " ");
    const words = text.split(" ");
    el.innerHTML = words
      .map((w) => `<span class="word"><span>${w}</span></span>`)
      .join(" ");
  });

  /* ---------------------------------------------------------
     7. GSAP + SCROLLTRIGGER SETUP
  --------------------------------------------------------- */
  gsap.registerPlugin(ScrollTrigger);

  function initHeroTimeline() {
    if (reduceMotion) {
      gsap.set("[data-reveal]", { opacity: 1, y: 0 });
      gsap.set("[data-split] .word > span", { y: 0 });
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.to(".hero__eyebrow", { opacity: 1, y: 0, duration: 0.8 })
      .to(".hero__title-line", { opacity: 1, y: 0, duration: 1 }, "-=0.55")
      .to(".hero__subtitle", { opacity: 1, y: 0, duration: 0.9 }, "-=0.6")
      .to("#ctaStart", { opacity: 1, y: 0, duration: 0.8 }, "-=0.55");
  }

  if (!reduceMotion) {
    // Generic fade-up reveal for any [data-reveal] outside hero
    document.querySelectorAll(".section:not(.hero) [data-reveal]").forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    });

    // Word-by-word title reveal
    document.querySelectorAll("[data-split]").forEach((el) => {
      gsap.to(el.querySelectorAll(".word > span"), {
        y: 0, duration: 0.9, ease: "power4.out", stagger: 0.06,
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    /* ---- Section 2: glass cards — stagger scale+fade ---- */
    gsap.from(".about__cards .glass-card", {
      opacity: 0, y: 60, scale: 0.9, duration: 0.9, stagger: 0.15, ease: "back.out(1.6)",
      scrollTrigger: { trigger: ".about__cards", start: "top 82%" },
    });
    gsap.to(".about__shape-1", { y: 60, ease: "none", scrollTrigger: { trigger: ".about", start: "top bottom", end: "bottom top", scrub: 1 } });
    gsap.to(".about__shape-2", { y: -60, ease: "none", scrollTrigger: { trigger: ".about", start: "top bottom", end: "bottom top", scrub: 1 } });

    /* ---- Section 3: flip cards — alternating slide + rotate ---- */
    document.querySelectorAll(".flip-card").forEach((card, i) => {
      gsap.from(card, {
        opacity: 0,
        x: i % 2 === 0 ? -70 : 70,
        rotateZ: i % 2 === 0 ? -6 : 6,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: card, start: "top 88%" },
      });
    });

    /* ---- Section 4: journey cards — zoom in stagger ---- */
    gsap.from(".journey-card", {
      opacity: 0, scale: 0.8, y: 40, duration: 0.8, stagger: { each: 0.1, from: "start" },
      ease: "power3.out",
      scrollTrigger: { trigger: ".journey-grid", start: "top 85%" },
    });

    /* ---- Footer gears reveal ---- */
    gsap.from(".site-footer__brand, .site-footer__tag, .site-footer__copy", {
      opacity: 0, y: 20, duration: 0.9, stagger: 0.12, ease: "power2.out",
      scrollTrigger: { trigger: ".site-footer", start: "top 90%" },
    });
  } else {
    document.querySelectorAll(".about__cards .glass-card, .flip-card, .journey-card").forEach((el) => {
      el.style.opacity = 1;
    });
  }

  /* ---------------------------------------------------------
     8. FLIP CARDS (tap / click / keyboard)
  --------------------------------------------------------- */
  document.querySelectorAll("[data-flip]").forEach((card) => {
    card.addEventListener("click", () => card.classList.toggle("is-flipped"));
    card.addEventListener("keypress", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); card.classList.toggle("is-flipped"); }
    });
  });

  /* ---------------------------------------------------------
     9. 3D TILT EFFECT (glass + journey cards)
  --------------------------------------------------------- */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      const strength = 12;
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(card, {
          rotateY: px * strength,
          rotateX: -py * strength,
          duration: 0.4,
          ease: "power2.out",
          transformPerspective: 900,
        });
      });
      card.addEventListener("mouseleave", () => {
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: "power3.out" });
      });
    });
  }

  /* ---------------------------------------------------------
     9b. TOPIC DETAIL MODAL (Section 4 journey cards)
  --------------------------------------------------------- */
  const topicModal = document.getElementById("topicModal");
  const topicModalScroll = document.getElementById("topicModalScroll");
  const topicPanels = Array.from(document.querySelectorAll("[data-topic-panel]"));
  const topicOrder = topicPanels.map((p) => p.dataset.topicPanel);
  const topicPrevBtn = document.getElementById("topicPrev");
  const topicNextBtn = document.getElementById("topicNext");
  const topicIndicator = document.getElementById("topicIndicator");
  let currentTopicIndex = 0;
  let lastFocusedCard = null;

  function showTopic(index) {
    currentTopicIndex = Math.max(0, Math.min(topicOrder.length - 1, index));
    topicPanels.forEach((panel, i) => panel.classList.toggle("is-active", i === currentTopicIndex));
    topicIndicator.textContent = `${currentTopicIndex + 1} / ${topicOrder.length}`;
    topicPrevBtn.disabled = currentTopicIndex === 0;
    topicNextBtn.disabled = currentTopicIndex === topicOrder.length - 1;
    topicModalScroll.scrollTop = 0;
  }

  function openTopicModal(topicId, triggerEl) {
    lastFocusedCard = triggerEl || document.activeElement;
    const index = topicOrder.indexOf(String(topicId));
    showTopic(index === -1 ? 0 : index);
    topicModal.classList.add("is-open");
    topicModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    topicModal.querySelector(".topic-modal__close").focus();
  }

  function closeTopicModal() {
    topicModal.classList.remove("is-open");
    topicModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocusedCard) lastFocusedCard.focus();
  }

  document.querySelectorAll("[data-topic]").forEach((card) => {
    card.addEventListener("click", () => openTopicModal(card.dataset.topic, card));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openTopicModal(card.dataset.topic, card);
      }
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", closeTopicModal);
  });
  topicPrevBtn.addEventListener("click", () => showTopic(currentTopicIndex - 1));
  topicNextBtn.addEventListener("click", () => showTopic(currentTopicIndex + 1));
  document.addEventListener("keydown", (e) => {
    if (!topicModal.classList.contains("is-open")) return;
    if (e.key === "Escape") closeTopicModal();
    if (e.key === "ArrowRight" && !topicNextBtn.disabled) showTopic(currentTopicIndex + 1);
    if (e.key === "ArrowLeft" && !topicPrevBtn.disabled) showTopic(currentTopicIndex - 1);
  });

  /* ---------------------------------------------------------
     10. FLOATING PMI AGENT CHAT WIDGET
     Toggle open/close, lazy-load the iframe only on first open
     (saves a network request for visitors who never click it),
     plus a one-time invite tooltip.
  --------------------------------------------------------- */
  const agentWidget = document.getElementById("agentWidget");
  const agentToggle = document.getElementById("agentToggle");
  const agentPanel = document.getElementById("agentPanel");
  const agentPanelClose = document.getElementById("agentPanelClose");
  const agentFrame = document.getElementById("pmiAgentFrame");
  const agentLoading = document.getElementById("agentLoading");
  const agentTooltip = document.getElementById("agentTooltip");
  const agentTooltipClose = document.getElementById("agentTooltipClose");

  let agentFrameLoaded = false;

  function openAgentWidget() {
    agentWidget.classList.add("is-open");
    agentToggle.setAttribute("aria-expanded", "true");
    agentPanel.setAttribute("aria-hidden", "false");
    hideAgentTooltip();

    if (!agentFrameLoaded && agentFrame) {
      agentFrameLoaded = true;
      agentFrame.src = agentFrame.dataset.src;
      agentFrame.addEventListener("load", () => agentLoading.classList.add("is-hidden"));
      // Fallback in case the load event is delayed by cross-origin restrictions
      setTimeout(() => agentLoading.classList.add("is-hidden"), 6000);
    }
  }

  function closeAgentWidget() {
    agentWidget.classList.remove("is-open");
    agentToggle.setAttribute("aria-expanded", "false");
    agentPanel.setAttribute("aria-hidden", "true");
  }

  function hideAgentTooltip() {
    agentTooltip.classList.remove("is-visible");
  }

  agentToggle.addEventListener("click", () => {
    agentWidget.classList.contains("is-open") ? closeAgentWidget() : openAgentWidget();
  });
  agentPanelClose.addEventListener("click", closeAgentWidget);
  agentTooltipClose.addEventListener("click", hideAgentTooltip);
  document.querySelectorAll("[data-open-agent]").forEach((btn) => {
    btn.addEventListener("click", () => {
      navToggle.classList.remove("is-open");
      navLinksWrap.classList.remove("is-open");
      openAgentWidget();
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && agentWidget.classList.contains("is-open")) closeAgentWidget();
  });

  // Invite the student to chat once, a few seconds after the page settles.
  if (!reduceMotion) {
    setTimeout(() => {
      if (!agentWidget.classList.contains("is-open")) agentTooltip.classList.add("is-visible");
    }, 3200);
    setTimeout(hideAgentTooltip, 10000);
  }

  /* ---------------------------------------------------------
     11. THREE.JS HERO SCENE
     Floating gears, light bulbs, a simple robot arm — with
     mouse-driven parallax depth.
  --------------------------------------------------------- */
  function initHeroScene() {
    const canvas = document.getElementById("hero-canvas");
    if (!canvas || typeof THREE === "undefined") return;

    const hero = document.getElementById("hero");
    let width = hero.clientWidth;
    let height = hero.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.PointLight(0x00d2ff, 1.4, 40);
    key.position.set(6, 6, 10);
    scene.add(key);
    const rim = new THREE.PointLight(0xfd79a8, 1.1, 40);
    rim.position.set(-8, -4, 6);
    scene.add(rim);

    const floaters = []; // { mesh, speed, offset, axis }

    /* ----- Helper: build an extruded gear mesh ----- */
    function createGear(radius, teeth, depth, color) {
      const shape = new THREE.Shape();
      const innerR = radius * 0.62;
      const toothH = radius * 0.24;
      const steps = teeth * 2;
      for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        const r = i % 2 === 0 ? radius + toothH : radius;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
      }
      shape.closePath();
      const holePath = new THREE.Path();
      holePath.absarc(0, 0, innerR * 0.4, 0, Math.PI * 2, true);
      shape.holes.push(holePath);

      const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2, curveSegments: 8 });
      const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.35, roughness: 0.4, emissive: color, emissiveIntensity: 0.08 });
      return new THREE.Mesh(geo, mat);
    }

    /* ----- Helper: build a glowing light-bulb group ----- */
    function createBulb(color) {
      const group = new THREE.Group();
      const bulbGeo = new THREE.SphereGeometry(0.9, 20, 20);
      const bulbMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.1, roughness: 0.2, transparent: true, opacity: 0.92 });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      group.add(bulb);

      const baseGeo = new THREE.CylinderGeometry(0.32, 0.4, 0.5, 12);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.7, roughness: 0.3 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = -1.05;
      group.add(base);

      const glow = new THREE.PointLight(color, 1.2, 6);
      group.add(glow);
      return group;
    }

    /* ----- Helper: build a simple stylised robot arm ----- */
    function createRobotArm() {
      const group = new THREE.Group();
      const matMain = new THREE.MeshStandardMaterial({ color: 0x0984e3, metalness: 0.5, roughness: 0.35 });
      const matJoint = new THREE.MeshStandardMaterial({ color: 0xfdcb6e, metalness: 0.4, roughness: 0.3 });

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.4, 16), matMain);
      group.add(base);

      const lowerArm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.6, 0.35), matMain);
      lowerArm.position.y = 1.0;
      group.add(lowerArm);

      const joint1 = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 14), matJoint);
      joint1.position.y = 1.8;
      group.add(joint1);

      const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.3, 0.3), matMain);
      upperArm.position.set(0, 2.5, 0);
      group.add(upperArm);

      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 8), matJoint);
      claw.position.set(0, 3.3, 0);
      claw.rotation.x = Math.PI;
      group.add(claw);

      // store parts for idle animation
      group.userData.upperArm = upperArm;
      group.userData.claw = claw;
      return group;
    }

    // --- Populate scene ---
    const gearColors = [0x6c5ce7, 0x00b894, 0xfd79a8];
    for (let i = 0; i < 3; i++) {
      const gear = createGear(1 + i * 0.15, 10, 0.35, gearColors[i]);
      gear.position.set(
        (i - 1) * 5.2 + (Math.random() - 0.5),
        Math.sin(i) * 2.2,
        -2 - i
      );
      gear.rotation.x = 0.3;
      scene.add(gear);
      floaters.push({ mesh: gear, speed: 0.2 + i * 0.08, offset: i * 1.7, floatAmp: 0.4, spin: true });
    }

    const bulbPositions = [
      { x: -5.5, y: 2.6, z: 1 },
      { x: 5.8, y: -2.2, z: 0.5 },
    ];
    bulbPositions.forEach((p, i) => {
      const bulb = createBulb(i === 0 ? 0xfdcb6e : 0x00d2ff);
      bulb.position.set(p.x, p.y, p.z);
      bulb.scale.setScalar(0.7);
      scene.add(bulb);
      floaters.push({ mesh: bulb, speed: 0.35 + i * 0.1, offset: i * 2.4, floatAmp: 0.5, spin: false });
    });

    const arm = createRobotArm();
    arm.position.set(4.2, -2.8, -1.5);
    arm.scale.setScalar(0.85);
    arm.rotation.y = -0.4;
    scene.add(arm);

    // --- Mouse parallax ---
    const mouse = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    window.addEventListener("mousemove", (e) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // --- Resize ---
    function handleResize() {
      width = hero.clientWidth;
      height = hero.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    window.addEventListener("resize", handleResize);

    // --- Animation loop ---
    const clock = new THREE.Clock();
    let rafId;
    function animate() {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      mouse.x += (target.x - mouse.x) * 0.05;
      mouse.y += (target.y - mouse.y) * 0.05;

      camera.position.x = mouse.x * 1.6;
      camera.position.y = -mouse.y * 1.2;
      camera.lookAt(0, 0, 0);

      scene.rotation.y = mouse.x * 0.08;
      scene.rotation.x = -mouse.y * 0.05;

      floaters.forEach((f) => {
        f.mesh.position.y += Math.sin(t * f.speed + f.offset) * 0.002;
        if (f.spin) {
          f.mesh.rotation.z += 0.0035 + f.speed * 0.004;
        } else {
          f.mesh.rotation.y = Math.sin(t * 0.3 + f.offset) * 0.4;
        }
      });

      // Robot arm idle sway
      arm.rotation.y = -0.4 + Math.sin(t * 0.25) * 0.15;
      if (arm.userData.upperArm) {
        arm.userData.upperArm.rotation.z = Math.sin(t * 0.4) * 0.12;
        arm.userData.claw.rotation.z = Math.sin(t * 0.6) * 0.2;
      }

      renderer.render(scene, camera);
    }

    if (!reduceMotion) {
      animate();
    } else {
      renderer.render(scene, camera);
    }

    // Pause rendering when hero is off-screen (perf)
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting && rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        } else if (entry.isIntersecting && !rafId && !reduceMotion) {
          animate();
        }
      });
    }, { threshold: 0.05 });
    io.observe(hero);
  }

  initHeroScene();

})();
