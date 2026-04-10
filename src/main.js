import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import confetti from "canvas-confetti";

gsap.registerPlugin(ScrollTrigger);

    const isTouch = "ontouchstart" in window;

    // Loader sequence
    const loader = document.getElementById("loader");
    const progressBar = document.querySelector(".progress-bar");
    const loaderStory = document.getElementById("loader-story");
    const loaderTitle = document.getElementById("loader-title");

    const storyLines = [
      "INITIALIZING FIELD PROTOCOLS",
      "LINKING OPERATIVE NETWORK",
      "CALIBRATING SIGNAL ARRAY",
      "ACCESS GRANTED"
    ];

    const storyStart = 200;
    const lineHold = 900;
    const lineFade = 320;
    const lineGap = 120;
    const lineSpan = lineHold + lineFade + lineGap;
    const totalStoryTime = storyLines.length * lineSpan;

    storyLines.forEach((line, index) => {
      const startAt = storyStart + index * lineSpan;
      setTimeout(() => {
        loaderStory.textContent = line;
        loaderStory.classList.add("show");
      }, startAt);
      setTimeout(() => {
        loaderStory.classList.remove("show");
      }, startAt + lineHold);
    });

    progressBar.style.transition = `width ${Math.max(2, totalStoryTime / 1000)}s ease`;
    setTimeout(() => {
      progressBar.style.width = "100%";
    }, 80);

    const titleRevealAt = storyStart + totalStoryTime - 200;
    setTimeout(() => {
      loaderTitle.classList.add("show");
    }, titleRevealAt);

    let flicker;
    setTimeout(() => {
      flicker = setInterval(() => {
        loaderTitle.style.opacity = "0.7";
        setTimeout(() => { loaderTitle.style.opacity = "1"; }, 150);
      }, Math.random() * 1000 + 500);
    }, titleRevealAt + 400);

    const exitAt = titleRevealAt + 1000;
    setTimeout(() => {
      loader.classList.add("exit");
    }, exitAt);

    loader.addEventListener("animationend", (event) => {
      if (event.animationName !== "loader-exit") {
        return;
      }
      loader.style.display = "none";
      if (flicker) {
        clearInterval(flicker);
      }
      document.body.style.opacity = "1";
      initScrollAnimations();
    });

    // Cursor: lagging comet chain
    const cursor = document.getElementById("cursor");
    const TRAIL_N = 14;
    const trails = [];

    if (isTouch && cursor) {
      cursor.style.display = "none";
    }

    if (!isTouch) {
      for (let i = 0; i < TRAIL_N; i += 1) {
        const dot = document.createElement("div");
        dot.className = "trail";
        const size = 1 + (TRAIL_N - i) * 0.55;
        dot.style.width = size + "px";
        dot.style.height = size + "px";
        dot.style.opacity = 0.55 * (i / TRAIL_N);
        document.body.appendChild(dot);
        trails.push({ el: dot, x: window.innerWidth / 2, y: window.innerHeight / 2 });
      }
    }

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;

    if (!isTouch) {
      document.addEventListener("mousemove", (e) => {
        mx = e.clientX;
        my = e.clientY;
        cursor.style.left = mx + "px";
        cursor.style.top = my + "px";
      });
    }

    function animateTrails() {
      let px = mx;
      let py = my;
      trails.forEach((t) => {
        t.x = px + (t.x - px) * 0.62;
        t.y = py + (t.y - py) * 0.62;
        t.el.style.left = t.x + "px";
        t.el.style.top = t.y + "px";
        px = t.x;
        py = t.y;
      });
      requestAnimationFrame(animateTrails);
    }

    if (!isTouch) {
      animateTrails();
    }

    // Typing effect
    const typedText = document.getElementById("typed-text");
    const message = "> In source, we trust.";
    let i = 0;
    function typeChar() {
      if (i < message.length) {
        typedText.textContent += message.charAt(i);
        i += 1;
        setTimeout(typeChar, 50);
      } else {
        const cursorSpan = document.createElement("span");
        cursorSpan.className = "blink";
        cursorSpan.textContent = "|";
        typedText.appendChild(cursorSpan);
      }
    }
    typeChar();

    // Glitch trigger
    const title = document.getElementById("cipher-title");

    function initCipherCursorJelly(target) {
      const text = (target.textContent || "").trim();
      if (!text) {
        return;
      }

      target.setAttribute("aria-label", text);
      target.textContent = "";

      const chars = [];
      const fragment = document.createDocumentFragment();
      for (const ch of text) {
        const span = document.createElement("span");
        span.className = "cipher-char";
        span.setAttribute("aria-hidden", "true");
        span.textContent = ch === " " ? "\u00A0" : ch;
        fragment.appendChild(span);
        chars.push({ el: span, x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0 });
      }
      target.appendChild(fragment);

      if (isTouch) {
        return;
      }

      const radius = 260;
      const repelForce = 4.6;
      const swirlForce = 2.2;
      const spring = 0.075;
      const rotateSpring = 0.085;
      const damping = 0.84;
      const chainCouplingX = 0.06;
      const chainCouplingY = 0.045;
      const maxOffset = 280;
      const ultraMode = true;

      const ultra = {
        speedThreshold: 28,
        triggerRadiusFactor: 0.85,
        scatterHoldMs: 360,
        snapMs: 620,
        cooldownMs: 950
      };

      let prevMx = mx;
      let prevMy = my;
      let ultraState = "normal";
      let ultraUntil = 0;
      let ultraCooldownUntil = 0;

      function animateCipherJelly() {
        const rect = target.getBoundingClientRect();
        const now = performance.now();
        const cursorVx = mx - prevMx;
        const cursorVy = my - prevMy;
        const cursorSpeed = Math.hypot(cursorVx, cursorVy);
        const centerIndex = (chars.length - 1) / 2;
        const titleCx = rect.left + (rect.width * 0.5);
        const titleCy = rect.top + (rect.height * 0.55);
        const titleCursorDist = Math.hypot(mx - titleCx, my - titleCy);

        if (ultraMode && ultraState === "scatter" && now >= ultraUntil) {
          ultraState = "snap";
          ultraUntil = now + ultra.snapMs;
        } else if (ultraMode && ultraState === "snap" && now >= ultraUntil) {
          ultraState = "normal";
        }

        if (
          ultraMode
          && ultraState === "normal"
          && now >= ultraCooldownUntil
          && cursorSpeed > ultra.speedThreshold
          && titleCursorDist < radius * ultra.triggerRadiusFactor
        ) {
          ultraState = "scatter";
          ultraUntil = now + ultra.scatterHoldMs;
          ultraCooldownUntil = now + ultra.cooldownMs;

          chars.forEach((charState, idx) => {
            const charCx = rect.left + charState.el.offsetLeft + (charState.el.offsetWidth * 0.5);
            const charCy = rect.top + (rect.height * 0.55);
            const baseAngle = Math.atan2(charCy - my, charCx - mx);
            const spread = (idx - centerIndex) * 0.18;
            const burst = 8 + Math.random() * 7;

            charState.vx += Math.cos(baseAngle + spread) * burst + (Math.random() - 0.5) * 6;
            charState.vy += Math.sin(baseAngle + spread) * burst + (Math.random() - 0.5) * 6;
            charState.vr += (Math.random() - 0.5) * 14;
          });
        }

        prevMx = mx;
        prevMy = my;

        const scatterPhase = ultraState === "scatter";
        const snapPhase = ultraState === "snap";
        const activeSpring = scatterPhase ? spring * 0.2 : (snapPhase ? spring * 2.5 : spring);
        const activeRotateSpring = scatterPhase ? rotateSpring * 0.18 : (snapPhase ? rotateSpring * 2.4 : rotateSpring);
        const activeDamping = scatterPhase ? 0.9 : (snapPhase ? 0.74 : damping);
        const activeChainX = scatterPhase ? chainCouplingX * 0.18 : (snapPhase ? chainCouplingX * 1.9 : chainCouplingX);
        const activeChainY = scatterPhase ? chainCouplingY * 0.16 : (snapPhase ? chainCouplingY * 1.7 : chainCouplingY);
        const activeMaxOffset = scatterPhase ? 420 : (snapPhase ? 320 : maxOffset);

        chars.forEach((charState, idx) => {
          const cx = rect.left + charState.el.offsetLeft + (charState.el.offsetWidth * 0.5);
          const cy = rect.top + (rect.height * 0.55);

          const dx = cx - mx;
          const dy = cy - my;
          const dist = Math.hypot(dx, dy) || 1;
          const speedBoost = Math.min(cursorSpeed / 10, 3.2);
          const horizontalInfluence = 1 - Math.min(Math.abs(mx - cx) / 260, 1);

          if (dist < radius) {
            const proximity = 1 - (dist / radius);
            const push = proximity * (repelForce + speedBoost);

            const nx = dx / dist;
            const ny = dy / dist;
            const tx = -ny;
            const ty = nx;

            // Radial push plus tangential swirl gives the "jelly scatter" feel.
            charState.vx += nx * push;
            charState.vy += ny * push * 0.95;
            charState.vx += tx * swirlForce * proximity * (idx % 2 === 0 ? 1 : -1);
            charState.vy += ty * swirlForce * proximity * (idx % 2 === 0 ? 1 : -1);

            // Fast cursor flicks inject extra momentum for a crazier jump.
            charState.vx += cursorVx * 0.16 * proximity;
            charState.vy += cursorVy * 0.16 * proximity;
            charState.vr += (idx - centerIndex) * push * 0.35;

            // Extreme-mode micro chaos keeps the word in a lively broken state.
            const chaos = proximity * proximity * (0.55 + speedBoost * 0.25);
            const noiseX = Math.sin(now * 0.02 + idx * 3.1);
            const noiseY = Math.cos(now * 0.018 + idx * 2.7);
            charState.vx += noiseX * chaos;
            charState.vy += noiseY * chaos;

            // Hard flick near the word center triggers a brief shatter burst.
            if (cursorSpeed > 18 && dist < radius * 0.55) {
              charState.vx += nx * 3.6 + tx * 1.4;
              charState.vy += ny * 3.2 + ty * 1.2;
              charState.vr += (Math.random() - 0.5) * 4.8;
            }
          }

          // Cursor-proximity wave to keep letters alive between direct hits.
          charState.vy += Math.sin(now * 0.012 + idx * 0.9) * 0.3 * horizontalInfluence;

          if (snapPhase) {
            // Magnetic reassembly snap after scatter hold.
            charState.vx += -charState.x * 0.32;
            charState.vy += -charState.y * 0.32;
            charState.vr += -charState.r * 0.26;
          }

          charState.vx += (-charState.x) * activeSpring;
          charState.vy += (-charState.y) * activeSpring;
          charState.vr += (-charState.r) * activeRotateSpring;
        });

        // Neighbor coupling makes the word behave like connected jelly pieces.
        for (let i = 1; i < chars.length; i += 1) {
          const left = chars[i - 1];
          const right = chars[i];
          const linkX = right.x - left.x;
          const linkY = right.y - left.y;

          right.vx += -linkX * activeChainX;
          left.vx += linkX * activeChainX;
          right.vy += -linkY * activeChainY;
          left.vy += linkY * activeChainY;
        }

        chars.forEach((charState) => {
          charState.vx *= activeDamping;
          charState.vy *= activeDamping;
          charState.vr *= activeDamping;

          charState.x += charState.vx;
          charState.y += charState.vy;
          charState.r += charState.vr;

          // Allow dramatic separation, but keep letters recoverable.
          charState.x = Math.max(-activeMaxOffset, Math.min(activeMaxOffset, charState.x));
          charState.y = Math.max(-activeMaxOffset, Math.min(activeMaxOffset, charState.y));
          charState.r = Math.max(-75, Math.min(75, charState.r));

          const velocity = Math.hypot(charState.vx, charState.vy);
          const stretch = Math.min(velocity * 0.075, 0.34);
          const sx = 1 + stretch;
          const sy = 1 - (stretch * 0.85);

          charState.el.style.transform = `translate(${charState.x.toFixed(2)}px, ${charState.y.toFixed(2)}px) rotate(${charState.r.toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
        });

        requestAnimationFrame(animateCipherJelly);
      }

      requestAnimationFrame(animateCipherJelly);
    }

    initCipherCursorJelly(title);

    function triggerGlitch() {
      title.classList.add("glitching");
      setTimeout(() => title.classList.remove("glitching"), 400);
      setTimeout(triggerGlitch, Math.random() * 4000 + 3000);
    }
    setTimeout(triggerGlitch, 2000);

    // Navbar shrink
    window.addEventListener("scroll", () => {
      const navbar = document.getElementById("navbar");
      if (!navbar) {
        return;
      }
      // Prevent jumpy layout shifts on mobile while browser chrome expands/collapses.
      if (isTouch) {
        navbar.classList.remove("shrink");
        return;
      }
      if (window.scrollY > 50) {
        navbar.classList.add("shrink");
      } else {
        navbar.classList.remove("shrink");
      }
    });

    // Mobile menu
    const hamburger = document.getElementById("hamburger");
    const mobileMenu = document.getElementById("mobile-menu");
    hamburger.addEventListener("click", () => {
      mobileMenu.classList.toggle("open");
    });
    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => mobileMenu.classList.remove("open"));
    });

    // Better navigation UX: fixed-header aware smooth jump + active section highlight
    const allNavLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');
    const desktopNavLinks = document.querySelectorAll('.nav-links a');

    function scrollToSection(targetSection, withReveal = false) {
      if (!targetSection) {
        return;
      }
      const navbar = document.getElementById("navbar");
      const offset = (navbar ? navbar.offsetHeight : 0) + 18;
      const targetTop = targetSection.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: targetTop, behavior: "smooth" });

      if (!withReveal) {
        return;
      }

      const sectionHeading = targetSection.querySelector(".section-heading");
      if (!sectionHeading) {
        return;
      }

      gsap.fromTo(sectionHeading, {
        y: 18,
        opacity: 0.45,
        filter: "drop-shadow(0 0 0 rgba(201, 151, 42, 0))"
      }, {
        y: 0,
        opacity: 1,
        filter: "drop-shadow(0 0 12px rgba(201, 151, 42, 0.35))",
        duration: 0.65,
        ease: "power2.out",
        delay: 0.12,
        clearProps: "filter"
      });
    }

    const exploreBtn = document.getElementById("explore-btn");
    const joinBtn = document.getElementById("join-btn");

    if (exploreBtn) {
      exploreBtn.addEventListener("click", () => {
        scrollToSection(document.getElementById("about"), true);
      });
    }

    if (joinBtn) {
      joinBtn.addEventListener("click", () => {
        scrollToSection(document.querySelector("footer"), true);
      });
    }

    allNavLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href") || "";
        if (!href.startsWith("#")) {
          return;
        }
        const targetSection = document.querySelector(href);
        if (!targetSection) {
          return;
        }

        e.preventDefault();
        scrollToSection(targetSection);
      });
    });

    const sectionIds = ["about", "events", "achievements", "team", "gallery", "join"];
    const sectionObservers = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (sectionObservers.length) {
      const navObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          const id = entry.target.getAttribute("id");
          desktopNavLinks.forEach((navLink) => {
            const isActive = navLink.getAttribute("href") === `#${id}`;
            navLink.classList.toggle("active", isActive);
          });
        });
      }, { root: null, rootMargin: "-35% 0px -55% 0px", threshold: 0 });

      sectionObservers.forEach((section) => navObserver.observe(section));
    }

    // Spark effect on buttons
    document.querySelectorAll(".btn").forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        const rect = btn.getBoundingClientRect();
        for (let s = 0; s < 10; s += 1) {
          const spark = document.createElement("div");
          spark.style.position = "fixed";
          spark.style.width = "3px";
          spark.style.height = "3px";
          spark.style.borderRadius = "50%";
          spark.style.background = ["#C9972A", "#FFD700", "#1B5FAA"][Math.floor(Math.random() * 3)];
          spark.style.left = rect.left + rect.width / 2 + "px";
          spark.style.top = rect.top + rect.height / 2 + "px";
          spark.style.pointerEvents = "none";
          spark.style.zIndex = "99998";
          document.body.appendChild(spark);
          gsap.to(spark, {
            x: (Math.random() - 0.5) * 120,
            y: (Math.random() - 0.5) * 120,
            opacity: 0,
            duration: 0.5,
            ease: "power2.out",
            onComplete: () => spark.remove()
          });
        }
      });
    });

    // Countdown
    const targetDate = new Date("2026-04-11T00:00:00+05:30").getTime();
    const countdownEl = document.getElementById("countdown");
    function updateCountdown() {
      const now = Date.now();
      const diff = targetDate - now;
      if (diff <= 0) {
        countdownEl.innerHTML = "<div class=\"card-badge\">VELORA 1.0 IS LIVE</div>";
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      document.getElementById("days").textContent = String(days).padStart(2, "0");
      document.getElementById("hours").textContent = String(hours).padStart(2, "0");
      document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
      document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // Tilt effect for cards
    function attachTilt(selector) {
      document.querySelectorAll(selector).forEach((card) => {
        card.addEventListener("mousemove", (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = ((y - centerY) / centerY) * -12;
          const rotateY = ((x - centerX) / centerX) * 12;
          card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
          const shine = card.querySelector(".shine");
          if (shine) {
            shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(201, 151, 42, 0.12), transparent 65%)`;
          }
        });
        card.addEventListener("mouseleave", () => {
          card.style.transform = "perspective(700px) rotateX(0) rotateY(0) translateZ(0)";
          card.style.transition = "transform 0.5s ease";
          const shine = card.querySelector(".shine");
          if (shine) {
            shine.style.background = "none";
          }
        });
      });
    }

    attachTilt(".card");

    function initTeamCarousel() {
      const carousel = document.getElementById("team-carousel");
      if (!carousel) {
        return;
      }

      const track = carousel.querySelector(".team-track");
      if (!track) {
        return;
      }

      const teams = [
        {
          key: "core",
          name: "CORE TEAM",
          lead: "MAYANK DANTRE",
          members: [
            { name: "MAYANK DANTRE", role: "PRESIDENT", lead: true },
            { name: "NEHA HIDDUGGI", role: "SECRETARY" },
            { name: "ASHITOSH WAGHMARE", role: "TREASURER" }
          ]
        },
        {
          key: "tech",
          name: "TECH TEAM",
          lead: "ZAKI SHAHPURE",
          members: [
            { name: "ZAKI SHAHPURE", role: "TEAM LEAD", lead: true },
            { name: "VEDANT DESAI", role: "MEMBER" },
            { name: "KHUSHI ROONGTA", role: "MEMBER" },
            { name: "UMESH KUYATE", role: "MEMBER" },
            { name: "OMKAR DESHMUKH", role: "MEMBER" },
            { name: "ANUSHKA SHAW", role: "MEMBER" }
          ]
        },
        {
          key: "design",
          name: "DESIGN TEAM",
          lead: "SHREYA DHAMANKAR",
          members: [
            { name: "SHREYA DHAMANKAR", role: "TEAM LEAD", lead: true },
            { name: "SHREYASH NICHIT", role: "MEMBER" },
            { name: "KIRTEE PIMPALSHENDE", role: "MEMBER" },
            { name: "NUTAN WARKE", role: "MEMBER" },
            { name: "SYED WASAM AHMAD IRSHAD AHMAD", role: "MEMBER" }
          ]
        },
        {
          key: "pr",
          name: "PR TEAM",
          lead: "PAYAL DESALE",
          members: [
            { name: "PAYAL DESALE", role: "TEAM LEAD", lead: true },
            { name: "DHANASHRI MANE", role: "MEMBER" },
            { name: "PRATHAMESH TIRPUDE", role: "MEMBER" },
            { name: "SHIVSHREE SHINDE", role: "MEMBER" },
            { name: "PREETISH KHANDELWAL", role: "MEMBER" }
          ]
        },
        {
          key: "social",
          name: "SOCIAL MEDIA TEAM",
          lead: "YASH DESHPANDE",
          members: [
            { name: "YASH DESHPANDE", role: "TEAM LEAD", lead: true },
            { name: "TEJAS NAIR", role: "MEMBER" },
            { name: "SAHIL TADAVI", role: "MEMBER" },
            { name: "HIMANSHU RATHI", role: "MEMBER" }
          ]
        },
        {
          key: "sports",
          name: "SPORTS TEAM",
          lead: "KARUNYA BHATWALKAR",
          members: [
            { name: "KARUNYA BHATWALKAR", role: "TEAM LEAD", lead: true },
            { name: "SHREYASH KADAM", role: "MEMBER" },
            { name: "ANJALI BEHARE", role: "MEMBER" },
            { name: "TEJASKUMAR WAGHMODE", role: "MEMBER" },
            { name: "SAYALI SANDUR", role: "MEMBER" }
          ]
        },
        {
          key: "management",
          name: "MANAGEMENT TEAM",
          lead: "HARDAVI MANGAR",
          members: [
            { name: "HARDAVI MANGAR", role: "TEAM LEAD", lead: true },
            { name: "ASMITA SHIRKE", role: "MEMBER" },
            { name: "YASH SALUNKE", role: "MEMBER" },
            { name: "TEJASWINI VAIDYA", role: "MEMBER" },
            { name: "SIYA SINGHANIYA", role: "MEMBER" },
            { name: "VEDANT KINDRE", role: "MEMBER" },
            { name: "LOKESH DHAKAD", role: "MEMBER" }
          ]
        }
      ];

      function getInitials(name) {
        return name
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0])
          .join("");
      }

      function teamSigil(name) {
        return name
          .split(" ")
          .filter((part) => part && part !== "TEAM")
          .map((part) => part[0])
          .join("")
          .slice(0, 3);
      }

      function renderTeamCard(team) {
        const card = document.createElement("article");
        card.className = `team-card team-summary-card${team.key === "core" ? " president-card" : ""}`;
        card.innerHTML = `
          <div class="corner-burst left" aria-hidden="true"></div>
          <div class="corner-burst right" aria-hidden="true"></div>
          <div class="team-card-face">
            ${team.key === "core" ? '<div class="president-ribbon">CORE TEAM</div>' : ""}
            <div class="avatar">${teamSigil(team.name)}</div>
            <h4>${team.name}</h4>
            <p>&gt; ${team.lead} · LEAD</p>
            <span class="team-size">${team.members.length} MEMBERS</span>
          </div>
        `;
        return card;
      }

      track.innerHTML = "";
      const cards = teams.map((team) => {
        const card = renderTeamCard(team);
        track.appendChild(card);
        return card;
      });

      const membersStage = document.createElement("div");
      membersStage.className = "team-members-stage";
      track.appendChild(membersStage);

      const spacing = () => (window.innerWidth <= 768 ? 132 : 190);
      let activeIndex = 0;
      let touchStartX = 0;
      let touchStartY = 0;
      let isDragging = false;
      let dragStartX = 0;
      let lastManualRotateAt = 0;
      let cycleTimerId;
      let isBusy = false;
      const MANUAL_COOLDOWN_MS = 60;
      const VISIBLE_DEPTH = 1;

      function applyLayout() {
        const total = cards.length;
        cards.forEach((card, index) => {
          let relative = index - activeIndex;
          if (relative > total / 2) {
            relative -= total;
          }
          if (relative < -total / 2) {
            relative += total;
          }

          const distance = Math.abs(relative);
          const mobile = window.innerWidth <= 768;
          const sideX = mobile ? spacing() : 265;
          const sideY = mobile ? 36 : 44;
          const hiddenX = mobile ? 290 : 430;

          if (distance > VISIBLE_DEPTH) {
            card.style.transform = `translate3d(calc(-50% + ${relative < 0 ? -hiddenX : hiddenX}px), calc(-50% + ${sideY + 28}px), -250px) rotateY(${relative < 0 ? 22 : -22}deg) scale(0.56)`;
            card.style.opacity = "0";
            card.style.zIndex = "1";
            card.style.pointerEvents = "none";
            card.classList.remove("is-active");
            return;
          }

          const x = relative === 0 ? 0 : (relative < 0 ? -sideX : sideX);
          const y = relative === 0 ? (mobile ? -10 : -14) : sideY;
          const z = relative === 0 ? 30 : -120;
          const scale = relative === 0 ? (mobile ? 1.1 : 1.18) : (mobile ? 0.74 : 0.79);
          const rotateY = relative === 0 ? 0 : (relative < 0 ? 17 : -17);
          const opacity = relative === 0 ? 1 : 0.36;

          card.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${z}px) rotateY(${rotateY}deg) scale(${scale})`;
          card.style.opacity = String(opacity);
          card.style.zIndex = String(relative === 0 ? 120 : 70 - distance);
          card.style.pointerEvents = distance <= VISIBLE_DEPTH ? "auto" : "none";
          card.classList.toggle("is-active", relative === 0);
        });
      }

      function rotateNext() {
        activeIndex = (activeIndex + 1) % cards.length;
        applyLayout();
      }

      function rotatePrev() {
        activeIndex = (activeIndex - 1 + cards.length) % cards.length;
        applyLayout();
      }

      function canManualRotate() {
        const now = Date.now();
        if (now - lastManualRotateAt < MANUAL_COOLDOWN_MS) {
          return false;
        }
        lastManualRotateAt = now;
        return true;
      }

      function queueCycle(delay = 520) {
        clearTimeout(cycleTimerId);
        cycleTimerId = setTimeout(runTeamCycle, delay);
      }

      function wait(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }

      function memberTargets(memberCount, teamKey = "") {
        const others = Math.max(0, memberCount - 1);
        const mobile = window.innerWidth <= 768;
        const stepX = mobile ? 108 : 210;
        const stepY = mobile ? 24 : 34;
        const leadY = mobile ? -10 : -18;
        const baseY = mobile ? 24 : 34;
        const targets = [{ x: 0, y: leadY }];
        if (!others) {
          return targets;
        }

        if (memberCount === 4 && teamKey === "social") {
          const leadX = -(stepX * (mobile ? 0.1 : 0.14));
          const topX = stepX * (mobile ? 0.88 : 1.04);
          const topY = leadY + (mobile ? 2 : 4);
          const bottomLeftX = stepX * (mobile ? 1.1 : 1.42);
          const bottomRightX = stepX * (mobile ? 1.52 : 1.9);
          const bottomY = baseY + stepY * (mobile ? 2.35 : 4.1);
          return [
            { x: leadX, y: leadY },
            { x: topX, y: topY },
            { x: -bottomLeftX, y: bottomY },
            { x: bottomRightX, y: bottomY + (mobile ? 6 : 10) }
          ];
        }

        if (memberCount === 6) {
          const topX = stepX * (mobile ? 1.02 : 1.32);
          const topY = leadY - (mobile ? 16 : 22);
          const bottomX = stepX * (mobile ? 1.75 : 2.45);
          const bottomY = baseY + stepY * (mobile ? 1.85 : 2.25);
          const midY = bottomY + (mobile ? 68 : 88);
          return [
            { x: 0, y: leadY },
            { x: topX, y: topY },
            { x: -topX, y: topY },
            { x: -bottomX, y: bottomY },
            { x: 0, y: midY },
            { x: bottomX, y: bottomY }
          ];
        }

        for (let i = 1; i <= others; i += 1) {
          const tier = Math.ceil(i / 2);
          const isLeft = i % 2 === 1;
          const direction = isLeft ? -1 : 1;
          targets.push({
            x: direction * tier * stepX,
            y: baseY + tier * stepY + (isLeft ? 0 : 5)
          });
        }

        return targets;
      }

      function createMemberCard(member, isLead) {
        const card = document.createElement("article");
        card.className = `team-card member-card${isLead ? " lead" : ""}`;
        card.innerHTML = `
          <div class="team-card-face">
            ${isLead ? '<div class="president-ribbon">TEAM LEAD</div>' : ""}
            <div class="avatar">${getInitials(member.name)}</div>
            <h4>${member.name}</h4>
            <p>&gt; ${member.role}</p>
          </div>
        `;
        return card;
      }

      async function revealMembersForActiveTeam() {
        const team = teams[activeIndex];
        const activeCard = cards[activeIndex];
        if (!team || !activeCard) {
          return;
        }

        const leadMember = team.members.find((member) => member.lead) || team.members[0];
        const otherMembers = team.members.filter((member) => member !== leadMember);
        const orderedMembers = [leadMember, ...otherMembers];

        const stageRect = membersStage.getBoundingClientRect();
        const cardRect = activeCard.getBoundingClientRect();
        const centerX = (cardRect.left - stageRect.left) + (cardRect.width * 0.5);
        const centerY = (cardRect.top - stageRect.top) + (cardRect.height * 0.5);
        const targets = memberTargets(orderedMembers.length, team.key);

        membersStage.innerHTML = "";
        const memberCards = orderedMembers.map((member, idx) => {
          const memberCard = createMemberCard(member, idx === 0);
          memberCard.style.left = `${centerX}px`;
          memberCard.style.top = `${centerY}px`;
          memberCard.style.zIndex = String(idx === 0 ? 140 : 120);
          membersStage.appendChild(memberCard);
          return memberCard;
        });

        activeCard.classList.add("is-flipped");
        await wait(140);

        cards.forEach((card) => card.classList.add("is-suppressed"));
        carousel.classList.add("members-open");

        await new Promise((resolve) => {
          gsap.fromTo(memberCards, {
            x: 0,
            y: 0,
            scale: 0.28,
            opacity: 0,
            rotateY: -90
          }, {
            x: (idx) => targets[idx].x,
            y: (idx) => targets[idx].y,
            scale: (idx) => (idx === 0 ? 1.04 : 0.92),
            opacity: 1,
            rotateY: 0,
            duration: 0.72,
            stagger: 0.06,
            ease: "power3.out",
            onComplete: resolve
          });
        });

        await wait(1700);

        await new Promise((resolve) => {
          gsap.to(memberCards, {
            x: 0,
            y: 0,
            scale: 0.24,
            opacity: 0,
            rotateY: 95,
            duration: 0.56,
            stagger: { each: 0.035, from: "end" },
            ease: "power2.in",
            onComplete: resolve
          });
        });

        membersStage.innerHTML = "";
        carousel.classList.remove("members-open");
        cards.forEach((card) => card.classList.remove("is-suppressed"));
        activeCard.classList.remove("is-flipped");
        applyLayout();
        await wait(360);
      }

      async function runTeamCycle() {
        if (isBusy || isDragging) {
          queueCycle(280);
          return;
        }

        isBusy = true;
        await revealMembersForActiveTeam();
        rotateNext();
        isBusy = false;
        queueCycle(740);
      }

      carousel.addEventListener("mousedown", (e) => {
        if (isBusy) {
          return;
        }
        isDragging = true;
        dragStartX = e.clientX;
        carousel.classList.add("is-dragging");
      });

      window.addEventListener("mouseup", (e) => {
        if (!isDragging) {
          return;
        }
        const dx = e.clientX - dragStartX;
        if (Math.abs(dx) >= 30 && canManualRotate()) {
          if (dx < 0) {
            rotateNext();
          } else {
            rotatePrev();
          }
        }
        isDragging = false;
        carousel.classList.remove("is-dragging");
        queueCycle(680);
      });

      carousel.addEventListener("wheel", (e) => {
        const horizontalIntent = Math.abs(e.deltaX) > Math.abs(e.deltaY);
        if (!horizontalIntent || isBusy) {
          return;
        }
        e.preventDefault();
        if (!canManualRotate()) {
          return;
        }
        if (e.deltaX > 0) {
          rotateNext();
        } else {
          rotatePrev();
        }
        queueCycle(680);
      }, { passive: false });

      carousel.addEventListener("touchstart", (e) => {
        const t = e.touches[0];
        if (!t || isBusy) {
          return;
        }
        touchStartX = t.clientX;
        touchStartY = t.clientY;
      }, { passive: true });

      carousel.addEventListener("touchend", (e) => {
        const t = e.changedTouches[0];
        if (!t || isBusy) {
          return;
        }
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;
        if (Math.abs(dx) < 26 || Math.abs(dx) < Math.abs(dy) || !canManualRotate()) {
          return;
        }
        if (dx < 0) {
          rotateNext();
        } else {
          rotatePrev();
        }
        queueCycle(680);
      }, { passive: true });

      window.addEventListener("resize", applyLayout);

      applyLayout();
      queueCycle(1200);
    }

    initTeamCarousel();

    // Form particle burst and success
    const joinForm = document.getElementById("join-form");
    const successMessage = document.getElementById("success-message");
    if (joinForm && successMessage) {
      joinForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const button = joinForm.querySelector(".submit-btn");
        if (!button) {
          return;
        }
        const rect = button.getBoundingClientRect();
        for (let p = 0; p < 20; p += 1) {
          const particle = document.createElement("div");
          particle.style.position = "fixed";
          particle.style.width = "4px";
          particle.style.height = "4px";
          particle.style.borderRadius = "50%";
          particle.style.pointerEvents = "none";
          particle.style.background = ["#C9972A", "#FFD700", "#1B5FAA", "#F0E6D3"][Math.floor(Math.random() * 4)];
          particle.style.left = rect.left + rect.width / 2 + "px";
          particle.style.top = rect.top + rect.height / 2 + "px";
          document.body.appendChild(particle);
          gsap.to(particle, {
            x: (Math.random() - 0.5) * 300,
            y: (Math.random() - 0.5) * 300,
            opacity: 0,
            duration: 0.6 + Math.random() * 0.2,
            ease: "power2.out",
            onComplete: () => particle.remove()
          });
        }

        setTimeout(() => {
          joinForm.style.display = "none";
          successMessage.style.opacity = "1";
        }, 800);
      });
    }

    // FAQ behaves like an accordion: keep only one answer open.
    const faqItems = Array.from(document.querySelectorAll("#join .faq-item"));
    faqItems.forEach((item) => {
      item.addEventListener("toggle", () => {
        if (!item.open) {
          return;
        }
        faqItems.forEach((other) => {
          if (other !== item) {
            other.removeAttribute("open");
          }
        });
      });
    });

    // Scroll animations
    function initVeloraSpideySequence() {
      if (isTouch) {
        return;
      }

      const featured = document.querySelector("#events .velora-featured");
      const registerBtn = document.querySelector("#events .event-link");
      const spidey = document.querySelector("#events .velora-spidey");
      const webShot = document.querySelector("#events .velora-web-shot");
      const screenWeb = document.getElementById("screen-web-overlay");

      if (!featured || !registerBtn || !spidey || !webShot || !screenWeb) {
        return;
      }

      let busy = false;
      let lastRunAt = 0;

      function playSpideySequence() {
        const now = Date.now();
        if (busy || now - lastRunAt < 2200) {
          return;
        }
        busy = true;
        lastRunAt = now;

        const featuredRect = featured.getBoundingClientRect();
        const btnRect = registerBtn.getBoundingClientRect();
        const perchX = btnRect.left - featuredRect.left + (btnRect.width * 0.1);
        const perchY = btnRect.top - featuredRect.top - 78;
        const shotY = btnRect.top - featuredRect.top + (btnRect.height * 0.5);
        const shotWidth = Math.max(160, featuredRect.width - perchX - 42);
        const handX = perchX + 70;
        const handY = perchY + 55;
        const handViewportX = featuredRect.left + handX;
        const handViewportY = featuredRect.top + handY;

        gsap.killTweensOf([spidey, webShot, registerBtn, screenWeb]);
        gsap.set(spidey, {
          x: -280,
          y: -260,
          scale: 0.42,
          rotation: -52,
          autoAlpha: 0
        });
        gsap.set(webShot, {
          x: handX,
          y: handY,
          width: shotWidth,
          rotate: -6,
          scaleX: 0,
          autoAlpha: 0
        });
        gsap.set(screenWeb, {
          autoAlpha: 0,
          scale: 0.3,
          transformOrigin: `${(handViewportX / window.innerWidth) * 100}% ${(handViewportY / window.innerHeight) * 100}%`
        });

        const tl = gsap.timeline();
        tl.to(spidey, {
          x: perchX,
          y: perchY,
          scale: 1,
          rotation: 8,
          autoAlpha: 1,
          duration: 0.94,
          ease: "power3.out"
        });
        tl.to(spidey, {
          x: perchX + 12,
          y: perchY - 10,
          rotation: -14,
          duration: 0.18,
          yoyo: true,
          repeat: 1,
          ease: "power1.inOut"
        });
        tl.to(spidey, {
          rotation: -4,
          y: perchY + 3,
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut"
        });
        tl.to(webShot, {
          autoAlpha: 1,
          scaleX: 1,
          duration: 0.16,
          ease: "power2.out"
        });
        tl.to(registerBtn, {
          y: -4,
          boxShadow: "0 8px 20px rgba(0, 224, 255, 0.3)",
          duration: 0.16,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut"
        }, "<");
        tl.to(screenWeb, {
          autoAlpha: 0.66,
          scale: 1.06,
          duration: 0.18,
          ease: "power3.out"
        }, "<");
        tl.to(webShot, {
          scaleX: 0,
          autoAlpha: 0,
          duration: 0.22,
          ease: "power2.in"
        }, ">-0.02");
        tl.to(screenWeb, {
          autoAlpha: 0,
          scale: 1.18,
          duration: 0.45,
          ease: "power2.in"
        }, "<");
        tl.to(spidey, {
          x: perchX + 220,
          y: perchY - 280,
          scale: 0.46,
          rotation: 44,
          autoAlpha: 0,
          duration: 0.66,
          ease: "power3.in"
        }, "<");
        tl.call(() => {
          busy = false;
        });
      }

      featured.addEventListener("mouseenter", playSpideySequence);
      featured.addEventListener("focusin", playSpideySequence);
    }

    function initScrollAnimations() {
      const headings = document.querySelectorAll(".section-heading");
      headings.forEach((heading) => {
        gsap.from(heading, {
          opacity: 0,
          y: 40,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: heading, start: "top 78%" }
        });
      });

      gsap.from("#about .about-text", {
        opacity: 0,
        x: -60,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: "#about", start: "top 75%" }
      });

      gsap.from("#about .stat-card", {
        opacity: 0,
        y: 50,
        stagger: 0.15,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: "#about", start: "top 75%" }
      });

      gsap.from("#achievements .card", {
        opacity: 0,
        y: 60,
        stagger: 0.15,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: "#achievements", start: "top 75%" }
      });

      gsap.from("#events .featured", {
        opacity: 0,
        x: -80,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: "#events", start: "top 75%" }
      });

      gsap.from("#events .event-card", {
        opacity: 0,
        y: 60,
        stagger: 0.12,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: "#events", start: "top 75%" }
      });

      gsap.from("#team .team-carousel", {
        opacity: 0,
        y: 50,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: "#team", start: "top 75%" }
      });

      gsap.from("#gallery .gallery-item", {
        opacity: 0,
        scale: 0.9,
        stagger: 0.1,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: "#gallery", start: "top 75%" }
      });

      ScrollTrigger.refresh();

      if (!isTouch) {
        gsap.to("#events .velora-headline", {
          x: 1.5,
          y: -1.5,
          duration: 2.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });

        gsap.to("#events .count-box", {
          y: -2,
          duration: 2,
          repeat: -1,
          yoyo: true,
          stagger: 0.12,
          ease: "sine.inOut"
        });
      }

      gsap.from("#events .velora-chip", {
        y: 16,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: { trigger: "#events", start: "top 75%" }
      });

      initVeloraSpideySequence();

      // Stat counters
      document.querySelectorAll(".stat-card").forEach((card) => {
        const numberEl = card.querySelector(".stat-number");
        const target = parseInt(card.getAttribute("data-count"), 10);
        const suffix = card.getAttribute("data-suffix") || "";
        gsap.fromTo(numberEl, { innerText: 0 }, {
          innerText: target,
          duration: 2,
          snap: { innerText: 1 },
          ease: "power2.out",
          scrollTrigger: { trigger: card, start: "top 80%" },
          onUpdate: () => {
            if (suffix === "∞") {
              numberEl.textContent = "∞";
            } else {
              numberEl.textContent = Math.floor(numberEl.innerText) + suffix;
            }
          },
          onComplete: () => {
            numberEl.textContent = suffix === "∞" ? "∞" : target + suffix;
          }
        });
      });
    }

    // Three.js particles
    let particleScene;
    let particleCamera;
    let particleRenderer;
    let particlePositions;
    let particleVelocities;
    let particleGeometry;
    let particleMaterial;
    let particlePoints;
    const bounds = { x: 800, y: 600, z: 500 };
    const mouse = { x: 0, y: 0 };

    function initParticles() {
      if (isTouch) return;
      const canvas = document.getElementById("particle-canvas");
      particleScene = new THREE.Scene();
      particleCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
      particleCamera.position.z = 400;
      particleRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      particleRenderer.setClearColor(0x000000, 0);
      particleRenderer.setSize(window.innerWidth, window.innerHeight);

      const count = 2500;
      particlePositions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      particleVelocities = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        const i3 = i * 3;
        particlePositions[i3] = (Math.random() * 1600) - 800;
        particlePositions[i3 + 1] = (Math.random() * 1200) - 600;
        particlePositions[i3 + 2] = (Math.random() * 700) - 500;
        particleVelocities[i3] = (Math.random() * 0.06) - 0.03;
        particleVelocities[i3 + 1] = (Math.random() * 0.06) - 0.03;
        particleVelocities[i3 + 2] = (Math.random() * 0.06) - 0.03;

        const useGold = Math.random() < 0.7;
        const color = useGold ? new THREE.Color("#C9972A") : new THREE.Color("#F0E6D3");
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
      }

      particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
      particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      particleMaterial = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true
      });
      particlePoints = new THREE.Points(particleGeometry, particleMaterial);
      particleScene.add(particlePoints);

      window.addEventListener("mousemove", (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
      });

      animateParticles();
    }

    function animateParticles() {
      if (!particleRenderer) return;
      const positions = particleGeometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += particleVelocities[i];
        positions[i + 1] += particleVelocities[i + 1];
        positions[i + 2] += particleVelocities[i + 2];

        if (positions[i] > bounds.x) positions[i] = -bounds.x;
        if (positions[i] < -bounds.x) positions[i] = bounds.x;
        if (positions[i + 1] > bounds.y) positions[i + 1] = -bounds.y;
        if (positions[i + 1] < -bounds.y) positions[i + 1] = bounds.y;
        if (positions[i + 2] > 200) positions[i + 2] = -bounds.z;
        if (positions[i + 2] < -bounds.z) positions[i + 2] = 200;
      }
      particleGeometry.attributes.position.needsUpdate = true;

      const targetX = mouse.x * 80;
      const targetY = -mouse.y * 60;
      particleCamera.position.x += (targetX - particleCamera.position.x) * 0.05;
      particleCamera.position.y += (targetY - particleCamera.position.y) * 0.05;
      particleCamera.lookAt(0, 0, 0);

      particleRenderer.render(particleScene, particleCamera);
      requestAnimationFrame(animateParticles);
    }

    // Antelope emblem (meaningful hero form)
    let torusScene;
    let torusCamera;
    let torusRenderer;
    let torusGroup;
    let emblemStart = 0;
    let emblemPhase = "intro";
    function initTorus() {
      if (isTouch) return;
      const canvas = document.getElementById("torus-canvas");
      torusScene = new THREE.Scene();
      torusCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      torusCamera.position.z = 7;
      torusRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      torusRenderer.setClearColor(0x000000, 0);
      torusRenderer.setSize(window.innerWidth, window.innerHeight);

      const textureLoader = new THREE.TextureLoader();
      textureLoader.load("/assets/antelope.svg", (texture) => {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        torusGroup = new THREE.Group();
        const geometry = new THREE.PlaneGeometry(5.2, 5.2);
        const baseMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.55,
          color: new THREE.Color("#F0E6D3"),
          depthWrite: false,
          depthTest: false,
          side: THREE.DoubleSide
        });
        const glowMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.22,
          color: new THREE.Color("#1B5FAA"),
          depthWrite: false,
          depthTest: false,
          side: THREE.DoubleSide
        });

        const glow = new THREE.Mesh(geometry.clone(), glowMaterial);
        glow.scale.set(1.08, 1.08, 1);
        const emblem = new THREE.Mesh(geometry, baseMaterial);
        glow.renderOrder = 0;
        emblem.renderOrder = 1;
        torusGroup.add(glow, emblem);
        torusGroup.scale.set(0.2, 0.2, 0.2);
        torusGroup.position.z = -4.2;
        emblemStart = performance.now();
        torusScene.add(torusGroup);
      });

      animateTorus();
    }

    function animateTorus() {
      if (!torusRenderer) return;
      if (torusGroup) {
        const now = performance.now();
        const elapsed = now - emblemStart;

        if (emblemPhase === "intro") {
          const t = Math.min(elapsed / 2600, 1);
          const easeOut = 1 - Math.pow(1 - t, 4);
          const scale = 1.85 - easeOut * 0.55;
          torusGroup.scale.set(scale, scale, scale);
          torusGroup.position.z = -0.9 + easeOut * 0.7;
          if (t >= 1) {
            emblemPhase = "hold";
            emblemStart = now;
          }
        } else if (emblemPhase === "hold") {
          torusGroup.scale.set(1.3, 1.3, 1.3);
          torusGroup.position.z = -0.2;
          if (elapsed > 900) {
            emblemPhase = "idle";
          }
        } else if (emblemPhase === "idle") {
          torusGroup.scale.set(1.3, 1.3, 1.3);
          torusGroup.position.z = -0.2;
        }

        torusGroup.rotation.y += 0.002;
        torusGroup.rotation.z += 0.001;
        torusGroup.rotation.x = 0.08 + mouse.y * 0.1;
        torusGroup.position.x = mouse.x * 0.35;
        torusGroup.position.y = -mouse.y * 0.35;
      }
      torusRenderer.render(torusScene, torusCamera);
      requestAnimationFrame(animateTorus);
    }

    // Resize handling
    window.addEventListener("resize", () => {
      if (particleRenderer) {
        particleCamera.aspect = window.innerWidth / window.innerHeight;
        particleCamera.updateProjectionMatrix();
        particleRenderer.setSize(window.innerWidth, window.innerHeight);
      }
      if (torusRenderer) {
        torusCamera.aspect = window.innerWidth / window.innerHeight;
        torusCamera.updateProjectionMatrix();
        torusRenderer.setSize(window.innerWidth, window.innerHeight);
      }
    });

    initParticles();
  // Antelope background effect removed as requested.

  // --- INAUGURATION AUDIO EFFECT (Web Audio API) ---
  let audioCtx = null;
  function playBalloonBurst(loudness = 1.0) {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const now = audioCtx.currentTime;
    
    // Create white noise for the sharp "pop/burst" texture
    const bufferSize = audioCtx.sampleRate * 0.15; // 0.15 seconds
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(loudness * 2.0, now + 0.01);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    
    noise.start(now);
    noise.stop(now + 0.15);
    
    // Add the deep "thud/punch" body of the balloon bursting
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'sine';
    
    // Pitch drops from mid to sub very fast
    osc.frequency.setValueAtTime(250 + Math.random() * 100, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
    
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(loudness * 2.5, now + 0.01);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.15);
  }

  function playTickSound() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }

  // --- INAUGURATION SECRET PROTOCOL ---
  function initInauguration() {
    const launchDate = new Date("2026-04-11T17:00:00+05:30").getTime();
    let overrideTime = null;
    let hasRevealed = false;
    let inClimax = false;
    let lastSecond = -1;

    const timerNumbers  = document.getElementById("timer-numbers");
    const panelLeft     = document.getElementById("panel-left");
    const panelRight    = document.getElementById("panel-right");
    const revealContent = document.getElementById("reveal-content");
    const timerDisplay  = document.getElementById("inauguration-timer");
    const climaxOverlay = document.getElementById("climax-overlay");
    const climaxNumber  = document.getElementById("climax-number");
    const inauSection   = document.getElementById("inauguration");

    if (!timerNumbers || !panelLeft || !panelRight || !revealContent) return;

    function formatTime(t) {
      if (t < 0) return "00:00:00:00";
      const d = Math.floor(t / 86400000);
      const h = Math.floor((t / 3600000) % 24);
      const m = Math.floor((t / 60000) % 60);
      const s = Math.floor((t / 1000) % 60);
      return `${String(d).padStart(2,"0")}:${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
    }

    function beatNumber(n) {
      if (!climaxNumber) return;
      
      // Play a tick for every number in the countdown climax (1 to 10)
      if (n > 0 && n <= 10) {
        playTickSound();
      }

      climaxNumber.textContent = String(n);
      climaxNumber.classList.remove("beat");
      void climaxNumber.offsetWidth;
      climaxNumber.classList.add("beat");
    }

    function startClimax() {
      if (inClimax) return;
      inClimax = true;
      gsap.to(timerDisplay, { opacity: 0, duration: 0.45, ease: "power2.inOut" });
      if (inauSection) gsap.to(inauSection, { backgroundColor: "rgba(2,6,14,0.95)", duration: 1.2, ease: "power2.inOut" });
      if (climaxOverlay) climaxOverlay.classList.add("active");
    }

    function triggerReveal() {
      if (hasRevealed) return;
      hasRevealed = true;

      beatNumber(0);
      playBalloonBurst(1.5); // A loud burst directly on 0

      setTimeout(() => {
        if (climaxOverlay) climaxOverlay.classList.remove("active");

        const tl = gsap.timeline();

        if (inauSection) tl.to(inauSection, { backgroundColor: "transparent", duration: 1.5, ease: "power2.inOut" }, 0);

        tl.to(panelLeft,  { x: "-100%", duration: 2.4, ease: "power3.inOut" }, 0.3);
        tl.to(panelRight, { x:  "100%", duration: 2.4, ease: "power3.inOut" }, 0.3);

        tl.to(revealContent, { opacity: 1, scale: 1, duration: 1.8, ease: "expo.out" }, 1.2);

        tl.fromTo(".reveal-subtitle",
          { opacity: 0, letterSpacing: "12px" },
          { opacity: 1, letterSpacing: "5px", duration: 1, ease: "power2.out" },
          2.2
        );
        tl.fromTo(".reveal-tagline",
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
          2.8
        );

        tl.add(fireConfetti, 0.8);

      }, 1200);
    }

    function fireConfetti() {
      const GOLD_COLORS  = ["#FFD700", "#C9972A", "#FFFFFF", "#FFF8DC"];
      const PARTY_COLORS = ["#FF3B3B", "#FF9F00", "#FFD700", "#00C851", "#007BFF", "#C200FB", "#FF6B9D"];

      // ── PHASE 1: Colorful party confetti burst for 9 seconds ──
      const phase1End = Date.now() + 9000;
      
      // We use setInterval for the popping sound during phase 1, so it pops periodically 
      // without overwhelming the user or browser
      const burstingInterval = setInterval(() => {
        if (Date.now() >= phase1End) {
          clearInterval(burstingInterval);
          return;
        }
        playBalloonBurst(0.4 + Math.random() * 0.4); // Randomize slight volume for natural effect
      }, 350); // a burst every 350ms

      (function phase1() {
        if (Date.now() >= phase1End) {

          // ── PHASE 2: Massive gold volley from both sides (the big WOW moment) ──
          playBalloonBurst(2.0); // Big explosion sound here
          confetti({ particleCount: 100, angle: 60,  spread: 75, origin: { x: 0,   y: 0.85 }, colors: GOLD_COLORS, scalar: 1.3 });
          confetti({ particleCount: 100, angle: 120, spread: 75, origin: { x: 1,   y: 0.85 }, colors: GOLD_COLORS, scalar: 1.3 });
          confetti({ particleCount: 60,  angle: 90,  spread: 60, origin: { x: 0.5, y: 1    }, colors: GOLD_COLORS, scalar: 1.5 });

          // Sustained gold shower after the big volley for 7 more seconds
          const phase2End = Date.now() + 7000;
          (function phase2Sustain() {
            if (Date.now() >= phase2End) return;
            confetti({ particleCount: 6, angle: 60,  spread: 60, origin: { x: 0,   y: 0.85 }, colors: GOLD_COLORS });
            confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1,   y: 0.85 }, colors: GOLD_COLORS });
            confetti({ particleCount: 4, angle: 90,  spread: 50, origin: { x: 0.5, y: 1    }, colors: GOLD_COLORS });
            requestAnimationFrame(phase2Sustain);
          }());

          return;
        }

        // Phase 1: Colorful party confetti pieces from both sides
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: PARTY_COLORS,
          shapes: ["circle", "square"],
          scalar: 0.9
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: PARTY_COLORS,
          shapes: ["circle", "square"],
          scalar: 0.9
        });
        requestAnimationFrame(phase1);
      }());
    }



    const interval = setInterval(() => {
      if (hasRevealed) { clearInterval(interval); return; }
      const diff    = (overrideTime !== null ? overrideTime : launchDate) - Date.now();
      const secLeft = Math.ceil(diff / 1000);

      if (diff <= 10000 && diff > 0) {
        if (!inClimax) startClimax();
        if (secLeft !== lastSecond) { lastSecond = secLeft; beatNumber(secLeft); }
      } else {
        timerNumbers.textContent = formatTime(diff);
      }

      if (diff <= 0) triggerReveal();
    }, 200);

    timerNumbers.textContent = formatTime((overrideTime !== null ? overrideTime : launchDate) - Date.now());

    window.addEventListener("keydown", (e) => {
      if (e.shiftKey && (e.key === "I" || e.key === "i")) {
        hasRevealed = false;
        inClimax    = false;
        lastSecond  = -1;
        if (climaxOverlay) climaxOverlay.classList.remove("active");
        gsap.set(panelLeft,     { x: "0%" });
        gsap.set(panelRight,    { x: "0%" });
        gsap.set(revealContent, { opacity: 0, scale: 0.88 });
        gsap.set(timerDisplay,  { opacity: 1 });

        const targetSection = document.getElementById("inauguration");
        if (targetSection) {
          const navH = document.getElementById("navbar")?.offsetHeight || 0;
          window.scrollTo({ top: targetSection.getBoundingClientRect().top + window.scrollY - navH - 18, behavior: "smooth" });
        }
        overrideTime = Date.now() + 13500;
      }
    });
  }

  initInauguration();
