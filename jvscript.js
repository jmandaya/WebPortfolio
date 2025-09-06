// jvscript.js - modularized and updated to sync card/video state with modal

    // Utility helpers
    const isVideoElement = (el) => el && el.tagName && el.tagName.toLowerCase() === 'video';
    const isImgElement = (el) => el && el.tagName && el.tagName.toLowerCase() === 'img';
    const videoIsPlaying = (v) => {
      try {
        return isVideoElement(v) && !v.paused && !v.ended && v.readyState > 2;
      } catch (e) {
        return false;
      }
    };

    document.addEventListener('DOMContentLoaded', () => {
      initTyping();
      initSectionObserver();
      initSectionBuildAnimations();
      initNavHighlight();
      initNavDetach();
      initProjectCarouselsAndModal();
      initCertModal();
    });

    // ---------- Typing ----------
    function initTyping() {
      const texts = ["B.S. Information Technology Graduate", "Aspiring Software Engineer", "IoT Enthusiast"];
      let count = 0;
      let index = 0;
      let isDeleting = false;
      const speed = 100;
      const eraseSpeed = 50;
      const el = document.getElementById('typing');
      if (!el) return;

      function type() {
        const currentText = texts[count];
        if (!isDeleting) {
          el.textContent = currentText.slice(0, ++index);
          if (index === currentText.length) {
            isDeleting = true;
            setTimeout(type, 1000);
            return;
          }
        } else {
          el.textContent = currentText.slice(0, --index);
          if (index === 0) {
            isDeleting = false;
            count = (count + 1) % texts.length;
          }
        }
        setTimeout(type, isDeleting ? eraseSpeed : speed);
      }
      type();
    }

    // ---------- Simple Intersection observer to toggle .active ----------
    function initSectionObserver() {
      const sections = document.querySelectorAll(".home, .about-section, .workxp-section, .projects-section, .skills-section");
      if (!sections.length) return;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('active');
          else entry.target.classList.remove('active');
        });
      }, { threshold: 0.2 });
      sections.forEach(s => observer.observe(s));
    }

    // ---------- Section "build" animations (one-time staggered) ----------
    function initSectionBuildAnimations() {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const allSections = Array.from(document.querySelectorAll('main > section, #home, .about-section, #work, #projects, #skills, .skills-section, .contact-section'));
      if (!allSections.length) return;

      function pickAnimationForIndex(i) {
        const list = ['fly-left', 'fly-right', 'fly-up', 'zoom', 'fade', 'flip', 'wipe'];
        return list[i % list.length];
      }

      allSections.forEach(sec => {
        if (sec.dataset.animPrepared === 'true') return;
        sec.dataset.animPrepared = 'true';
        sec.classList.add('section-anim');
        const children = Array.from(sec.children).filter(ch => ch.nodeType === 1);
        const animChildren = children.slice(0, 12);
        animChildren.forEach((ch, i) => {
          ch.classList.add('anim-child', `anim-${pickAnimationForIndex(i)}`);
          const baseDelay = 80;
          const sectionDepthOffset = Math.min(Math.floor(sec.getBoundingClientRect().top / 300), 8);
          const delay = (i * baseDelay) + (sectionDepthOffset * 20);
          ch.style.transitionDelay = `${delay}ms`;
          const durBase = 520;
          const extra = (i % 3) * 60;
          ch.style.transitionDuration = `${durBase + extra}ms`;
          if (ch.tagName.toLowerCase() === 'img' || ch.querySelector('img')) {
            ch.style.transitionDuration = `${durBase + 120}ms`;
          }
        });
      });

      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            obs.unobserve(entry.target);
          }
        });
      }, { root: null, rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
      allSections.forEach(s => observer.observe(s));
    }

    // ---------- Nav highlight ----------
    function initNavHighlight() {
      const sections = document.querySelectorAll("section");
      const navLinks = document.querySelectorAll("nav .navbarcontent a");
      window.addEventListener("scroll", () => {
        let current = "";
        sections.forEach(section => {
          const sectionTop = section.offsetTop - 80;
          const sectionHeight = section.clientHeight;
          if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            current = section.getAttribute("id");
          }
        });
        navLinks.forEach(link => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${current}`) link.classList.add("active");
        });
      }, { passive: true });

      // Close mobile menu on nav click
      const menuToggle = document.getElementById('menu-toggle');
      document.querySelectorAll('nav .navbarcontent a').forEach(a => {
        a.addEventListener('click', () => { if (menuToggle && menuToggle.checked) menuToggle.checked = false; });
      });
    }

    // ---------- Nav detach on scroll ----------
    function initNavDetach() {
      const nav = document.querySelector('nav');
      if (!nav) return;
      let lastScroll = window.scrollY;
      const THRESHOLD = 120;
      let ticking = false;

      function updateNav() {
        if (!nav) return;
        if (lastScroll > THRESHOLD) {
          if (!nav.classList.contains('detached')) {
            nav.classList.add('detached');
            document.body.classList.add('nav-detached');
            const navHeight = nav.getBoundingClientRect().height;
            document.body.style.paddingTop = `${navHeight + 16}px`;
          }
        } else {
          if (nav.classList.contains('detached')) {
            nav.classList.remove('detached');
            document.body.classList.remove('nav-detached');
            document.body.style.paddingTop = '';
          }
        }
      }

      function onScroll() {
        lastScroll = window.scrollY;
        if (!ticking) {
          window.requestAnimationFrame(() => { updateNav(); ticking = false; });
          ticking = true;
        }
      }

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('load', updateNav);
      window.addEventListener('resize', () => setTimeout(updateNav, 100));
    }

    // ---------- Projects carousel + modal with video sync ----------
    function initProjectCarouselsAndModal() {
      const projectCards = Array.from(document.querySelectorAll('.project-card'));
      if (!projectCards.length) return;

      // store per card state
      const cardStates = new Map(); // id -> { index }
      projectCards.forEach(card => {
        const id = card.dataset.projectId || Math.random().toString(36).slice(2);
        card.dataset.projectId = id;
        const slides = Array.from(card.querySelectorAll('.slides .slide'));
        cardStates.set(id, { index: 0, slidesCount: slides.length });
        slides.forEach((s, i) => s.classList.toggle('active', i === 0));
        // previous/next on card
        const prev = card.querySelector('.project-media .carousel-btn.prev');
        const next = card.querySelector('.project-media .carousel-btn.next');
        if (prev) prev.addEventListener('click', (e) => { e.stopPropagation(); changeCardSlide(card, -1); });
        if (next) next.addEventListener('click', (e) => { e.stopPropagation(); changeCardSlide(card, 1); });

        // touch swipe
        let touchStartX = 0;
        const slidesContainer = card.querySelector('.slides');
        if (slidesContainer) {
          slidesContainer.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
          slidesContainer.addEventListener('touchend', e => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(dx) > 40) changeCardSlide(card, dx < 0 ? 1 : -1);
          });
        }

        // If there are video slides, attach listeners to pause others when a card video plays
        slides.forEach((slide) => {
          if (isVideoElement(slide)) {
            // ensure playsinline for mobile
            slide.setAttribute('playsinline', '');
            // when user plays a card video, pause other card videos
            slide.addEventListener('play', () => {
              // pause videos in other cards
              projectCards.forEach(other => {
                if (other === card) return;
                const vids = Array.from(other.querySelectorAll('video'));
                vids.forEach(v => {
                  try { v.pause(); } catch (e) {}
                });
              });
            });
          }
        });
      });

      function changeCardSlide(card, dir) {
        const id = card.dataset.projectId;
        const slides = Array.from(card.querySelectorAll('.slides .slide'));
        if (!slides.length) return;
        const st = cardStates.get(id);
        st.index = (st.index + dir + slides.length) % slides.length;
        slides.forEach((s, i) => s.classList.toggle('active', i === st.index));
        // pause any non-active video in the same card
        slides.forEach((s, i) => {
          if (isVideoElement(s)) {
            if (i === st.index) {
              // keep previous state
            } else {
              try { s.pause(); } catch (e) {}
            }
          }
        });

        // If modal open for this project, sync modal
        if (currentModalOpenId && currentModalOpenId === id && modalSlidesContainer) {
          modalIndex = st.index;
          updateModalSlides();
        }
      }

      // Modal references
      const body = document.body;
      const modal = document.getElementById('project-modal');
      const modalPanel = modal.querySelector('.modal-panel');
      const modalTitle = modal.querySelector('.modal-title');
      const modalDesc = modal.querySelector('.modal-desc');
      const modalFeatures = modal.querySelector('.modal-features');
      const modalTech = modal.querySelector('.modal-tech');
      const modalSlidesContainer = modal.querySelector('.modal-slides');
      const modalPrev = modal.querySelector('.modal-media .carousel-btn.prev');
      const modalNext = modal.querySelector('.modal-media .carousel-btn.next');
      const modalOverlay = modal.querySelector('.modal-overlay');
      const modalCloseButtons = Array.from(document.querySelectorAll('[data-modal-close]'));

      let modalIndex = 0;
      let currentModalOpenId = null;

      projectCards.forEach(card => {
        card.addEventListener('click', () => openModalFromCard(card));
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModalFromCard(card); }
        });
      });

      function openModalFromCard(card) {
        const id = card.dataset.projectId;
        currentModalOpenId = id;
        const title = card.querySelector('.project-title')?.textContent || '';
        const fullDesc = card.querySelector('.project-desc-full')?.textContent || card.querySelector('.project-desc-short')?.textContent || '';
        const features = Array.from(card.querySelectorAll('.key-features li')).map(li => li.textContent);
        const techs = Array.from(card.querySelectorAll('.tech-list .tech')).map(t => t.textContent);
        const slides = Array.from(card.querySelectorAll('.slides .slide'));

        // populate modal meta
        modalTitle.textContent = title;
        modalDesc.textContent = fullDesc;
        modalFeatures.innerHTML = '';
        features.forEach(f => {
          const li = document.createElement('li'); li.textContent = f; modalFeatures.appendChild(li);
        });
        modalTech.innerHTML = '';
        techs.forEach(t => {
          const span = document.createElement('span'); span.className = 'tech'; span.textContent = t; modalTech.appendChild(span);
        });

        // Build modal slides by cloning type and copying playback state for videos
        modalSlidesContainer.innerHTML = '';
        slides.forEach((s, i) => {
          if (isImgElement(s)) {
            const img = document.createElement('img');
            img.src = s.src;
            img.alt = `${title} — image ${i + 1}`;
            img.className = (i === 0 ? 'active' : '');
            modalSlidesContainer.appendChild(img);
          } else if (isVideoElement(s)) {
            // try to find source URL
            const src = s.currentSrc || (s.querySelector('source') ? s.querySelector('source').src : s.src || '');
            const mv = document.createElement('video');
            mv.src = src;
            mv.controls = true;
            mv.muted = s.muted;
            mv.playsInline = true;
            mv.setAttribute('playsinline', '');
            mv.className = (i === 0 ? 'active' : '');
            // mirror dimensions via CSS (modal-styles handle fit)
            // copy playback/time state
            try {
              mv.currentTime = Math.min(s.currentTime || 0, s.duration || Infinity);
            } catch (e) {}
            // If card video is playing, play modal video (muted helps autoplay)
            if (videoIsPlaying(s)) {
              // pause card video to avoid double audio
              try { s.pause(); } catch (e) {}
              mv.muted = true; // keep muted for autoplay policies
              mv.play().catch(() => {});
            }
            // When modal video plays, ensure corresponding card video is paused
            mv.addEventListener('play', () => {
              // pause the card video (if present)
              try {
                const cardSlide = slides[i];
                if (isVideoElement(cardSlide)) cardSlide.pause();
              } catch (e) {}
            });

            // When modal video pauses or time updates, don't immediately sync to card until modal closes
            modalSlidesContainer.appendChild(mv);
          } else {
            // fallback: cloneNode
            const clone = s.cloneNode(true);
            clone.classList.toggle('active', i === 0);
            modalSlidesContainer.appendChild(clone);
          }
        });

        // set modalIndex to card current index
        const st = cardStates.get(id);
        modalIndex = st ? st.index : 0;
        updateModalSlides();

        openModal();
      }

      function updateModalSlides() {
        const slides = Array.from(modalSlidesContainer.children);
        if (!slides.length) return;
        slides.forEach((s, i) => {
          s.classList.toggle('active', i === modalIndex);
          // If it's a video, pause/play according to active only if it was active before
          if (isVideoElement(s)) {
            if (i === modalIndex) {
              // nothing: don't autoplay unless it was playing on card or previously started
            } else {
              try { s.pause(); } catch (e) {}
            }
          }
        });
      }

      function openModal() {
        modal.setAttribute('aria-hidden', 'false');
        body.classList.add('no-scroll');
        // focus for accessibility
        modalPanel.focus();
      }

      function closeModal() {
        // If modal had a video playing, sync time & play state back to card slide (if card has corresponding video)
        try {
          if (currentModalOpenId) {
            const card = document.querySelector(`.project-card[data-project-id="${currentModalOpenId}"]`);
            if (card) {
              const cardSlides = Array.from(card.querySelectorAll('.slides .slide'));
              const modalSlides = Array.from(modalSlidesContainer.children);
              modalSlides.forEach((ms, idx) => {
                if (isVideoElement(ms) && cardSlides[idx] && isVideoElement(cardSlides[idx])) {
                  try {
                    // copy currentTime
                    cardSlides[idx].currentTime = ms.currentTime || 0;
                    // if modal video playing, resume on card (unmute if needed)
                    if (videoIsPlaying(ms)) {
                      cardSlides[idx].muted = ms.muted;
                      cardSlides[idx].play().catch(() => {});
                    }
                  } catch (e) {}
                }
              });
            }
          }
        } catch (e) {}

        modal.setAttribute('aria-hidden', 'true');
        body.classList.remove('no-scroll');
        modalSlidesContainer.innerHTML = '';
        modalTitle.textContent = '';
        modalDesc.textContent = '';
        modalFeatures.innerHTML = '';
        modalTech.innerHTML = '';
        // reset states
        if (currentModalOpenId) {
          // ensure card slides reflect modalIndex if changed inside modal
          const card = document.querySelector(`.project-card[data-project-id="${currentModalOpenId}"]`);
          if (card) {
            const slidesCard = Array.from(card.querySelectorAll('.slides .slide'));
            slidesCard.forEach((s, i) => s.classList.toggle('active', i === modalIndex));
            const st = cardStates.get(currentModalOpenId);
            if (st) st.index = modalIndex;
          }
        }
        currentModalOpenId = null;
        modalIndex = 0;
      }

      // modal controls
      modalPrev && modalPrev.addEventListener('click', (e) => { e.stopPropagation(); modalMove(-1); });
      modalNext && modalNext.addEventListener('click', (e) => { e.stopPropagation(); modalMove(1); });
      modalCloseButtons.forEach(btn => btn.addEventListener('click', () => closeModal()));
      modalOverlay.addEventListener('click', closeModal);

      function modalMove(dir) {
        const slides = Array.from(modalSlidesContainer.children);
        if (!slides.length) return;
        // if current slide is video and playing, pause it before move
        const currentSlide = slides[modalIndex];
        if (isVideoElement(currentSlide)) {
          try { currentSlide.pause(); } catch (e) {}
        }
        modalIndex = (modalIndex + dir + slides.length) % slides.length;
        updateModalSlides();

        // sync back to opened card (so card slides show current modal slide)
        if (currentModalOpenId) {
          const card = document.querySelector(`.project-card[data-project-id="${currentModalOpenId}"]`);
          if (card) {
            const slidesCard = Array.from(card.querySelectorAll('.slides .slide'));
            slidesCard.forEach((s, i) => s.classList.toggle('active', i === modalIndex));
            const st = cardStates.get(currentModalOpenId);
            if (st) st.index = modalIndex;
          }
        }
      }

      document.addEventListener('keydown', (e) => {
        if (modal.getAttribute('aria-hidden') === 'false') {
          if (e.key === 'Escape') closeModal();
          if (e.key === 'ArrowLeft') modalMove(-1);
          if (e.key === 'ArrowRight') modalMove(1);
        }
      });

      // swipe support on modal slides
      let modalTouchStartX = 0;
      modalSlidesContainer.addEventListener('touchstart', (e) => { modalTouchStartX = e.changedTouches[0].clientX; }, { passive: true });
      modalSlidesContainer.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - modalTouchStartX;
        if (Math.abs(dx) > 40) modalMove(dx < 0 ? 1 : -1);
      });

      // Keep focus inside modal while open (basic)
      document.addEventListener('focus', function (e) {
        if (modal.getAttribute('aria-hidden') === 'false' && !modal.contains(e.target)) {
          e.stopPropagation();
          modalPanel.focus();
        }
      }, true);
    }

    // ---------- Certificate modal ----------
    function initCertModal() {
      const certModal = document.getElementById('cert-modal');
      if (!certModal) return;
      const certModalImg = certModal.querySelector('.cert-modal-img');
      const certModalCaption = certModal.querySelector('.cert-modal-caption');
      const certModalClose = certModal.querySelector('.cert-modal-close');
      const certOverlay = certModal.querySelector('.cert-modal-overlay');
      const certLinks = Array.from(document.querySelectorAll('.cert-link'));

      function openCertModal(src, title, desc) {
        certModalImg.src = src;
        certModalImg.alt = title || 'Certificate';
        certModalCaption.innerHTML = `<strong>${title || ''}</strong>${desc ? '<div style="margin-top:6px; font-weight:400;">' + desc + '</div>' : ''}`;
        certModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');
        certModalClose.focus();
      }

      function closeCertModal() {
        certModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');
        certModalImg.src = '';
        certModalCaption.textContent = '';
      }

      certLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const img = link.querySelector('.cert-photo');
          const src = img ? img.src : link.href;
          const card = link.closest('.cert-card');
          const title = card ? (card.querySelector('.cert-name')?.textContent || '') : '';
          const desc = card ? (card.querySelector('.cert-desc')?.textContent || '') : '';
          openCertModal(src, title, desc);
        });
      });

      certModalClose.addEventListener('click', closeCertModal);
      certOverlay.addEventListener('click', closeCertModal);
      document.addEventListener('keydown', (e) => {
        if (certModal.getAttribute('aria-hidden') === 'false') {
          if (e.key === 'Escape') closeCertModal();
        }
      });
    }
const capstonevid = document.getElementById('capstonevid');
  capstonevid.volume = 0;
  capstonevid.muted = true;

  capstonevid.onvolumechange = () => {
    capstonevid.muted = true;
    capstonevid.volume = 0;

  };
