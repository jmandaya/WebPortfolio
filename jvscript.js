
  document.addEventListener("DOMContentLoaded", () => {
    // Grab all the sections you want animated
    const sections = document.querySelectorAll(
      ".home, .about-section, .workxp-section, .projects-section, .skills-section"
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          } else {
            entry.target.classList.remove("active"); 
            // ❌ remove this line if you want the animation to run only once
          }
        });
      },
      { threshold: 0.2 } // 20% visible before triggering
    );

    sections.forEach((section) => observer.observe(section));
  });


const texts = ["B.S. Information Technology Graduate", "Aspiring Software Developer", "IoT Enthusiast"];
    let count = 0;
    let index = 0;
    let currentText = "";
    let isDeleting = false;
    const speed = 100; // typing speed in ms
    const eraseSpeed = 50; // erasing speed

    function type() {
      currentText = texts[count];
      let displayed = document.getElementById("typing");

      if (!isDeleting) {
        displayed.textContent = currentText.slice(0, ++index);
        if (index === currentText.length) {
          isDeleting = true;
          setTimeout(type, 1000); // pause before deleting
          return;
        }
      } else {
        displayed.textContent = currentText.slice(0, --index);
        if (index === 0) {
          isDeleting = false;
          count = (count + 1) % texts.length;
        }
      }
      setTimeout(type, isDeleting ? eraseSpeed : speed);
    }

    document.addEventListener("DOMContentLoaded", type);


const tabs = document.querySelectorAll(".tab");
    const contents = document.querySelectorAll(".tab-content");

    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        // Remove active from tabs
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        // Show correct content
        contents.forEach(c => c.classList.remove("active"));
        document.getElementById(tab.dataset.tab).classList.add("active");
      });
    });


// Combined script updated to sync card carousel state with modal and vice-versa.
    (function () {
      /* ---------- Per-card carousel ---------- */
      const cardStates = new Map(); // projectId -> { index }
      const projectCards = Array.from(document.querySelectorAll('.project-card'));

      projectCards.forEach(card => {
        const id = card.dataset.projectId || Math.random().toString(36).slice(2);
        card.dataset.projectId = id;
        const slides = Array.from(card.querySelectorAll('.slides .slide'));
        cardStates.set(id, { index: 0 });

        // initial active
        slides.forEach((s, i) => s.classList.toggle('active', i === 0));

        const prev = card.querySelector('.project-media .carousel-btn.prev');
        const next = card.querySelector('.project-media .carousel-btn.next');

        if (prev) prev.addEventListener('click', (e) => {
          e.stopPropagation();
          changeCardSlide(card, -1);
        });
        if (next) next.addEventListener('click', (e) => {
          e.stopPropagation();
          changeCardSlide(card, 1);
        });

        // touch/swipe for cards
        let touchStartX = 0;
        const slidesContainer = card.querySelector('.slides');
        if (slidesContainer) {
          slidesContainer.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
          slidesContainer.addEventListener('touchend', e => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(dx) > 40) changeCardSlide(card, dx < 0 ? 1 : -1);
          });
        }
      });

      function changeCardSlide(card, dir) {
        const id = card.dataset.projectId;
        const slides = Array.from(card.querySelectorAll('.slides .slide'));
        if (!slides.length) return;
        const st = cardStates.get(id);
        st.index = (st.index + dir + slides.length) % slides.length;
        slides.forEach((s, i) => s.classList.toggle('active', i === st.index));

        // If modal is open for this card, sync modal slides as well
        if (currentModalOpenId && currentModalOpenId === id && modalSlidesContainer) {
          modalIndex = st.index;
          updateModalSlides();
        }
      }

      /* ---------- Modal logic (open modal when clicking card) ---------- */
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
      const modalCloseButtons = Array.from(document.querySelectorAll('[data-modal-close]'));

      let modalIndex = 0;
      let currentModalOpenId = null;

      projectCards.forEach(card => {
        card.addEventListener('click', () => openModalFromCard(card));
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openModalFromCard(card);
          }
        });
      });

      function openModalFromCard(card) {
        const id = card.dataset.projectId;
        currentModalOpenId = id;

        const title = card.querySelector('.project-title')?.textContent || '';
        const fullDesc = card.querySelector('.project-desc-full')?.textContent || card.querySelector('.project-desc-short')?.textContent || '';
        const features = Array.from(card.querySelectorAll('.key-features li')).map(li => li.textContent);
        const techs = Array.from(card.querySelectorAll('.tech-list .tech')).map(t => t.textContent);
        const imgs = Array.from(card.querySelectorAll('.slides .slide')).map(img => img.src);

        // populate modal
        modalTitle.textContent = title;
        modalDesc.textContent = fullDesc;

        modalFeatures.innerHTML = '';
        features.forEach(f => {
          const li = document.createElement('li');
          li.textContent = f;
          modalFeatures.appendChild(li);
        });

        modalTech.innerHTML = '';
        techs.forEach(t => {
          const span = document.createElement('span');
          span.className = 'tech';
          span.textContent = t;
          modalTech.appendChild(span);
        });

        // slides: build from card images and set initial index to card's current index
        modalSlidesContainer.innerHTML = '';
        imgs.forEach((src, i) => {
          const img = document.createElement('img');
          img.src = src;
          img.alt = `${title} — image ${i + 1}`;
          img.className = i === 0 ? 'active' : '';
          modalSlidesContainer.appendChild(img);
        });

        // set modalIndex to card's current slide
        const st = cardStates.get(id);
        modalIndex = st ? st.index : 0;
        updateModalSlides();

        openModal();
      }

      function updateModalSlides() {
        const slides = Array.from(modalSlidesContainer.querySelectorAll('img'));
        if (!slides.length) return;
        slides.forEach((s, i) => s.classList.toggle('active', i === modalIndex));
      }

      function openModal() {
        modal.setAttribute('aria-hidden', 'false');
        body.classList.add('no-scroll');
        // focus for accessibility
        modalPanel.focus();
      }

      function closeModal() {
        modal.setAttribute('aria-hidden', 'true');
        body.classList.remove('no-scroll');
        modalSlidesContainer.innerHTML = '';
        modalTitle.textContent = '';
        modalDesc.textContent = '';
        modalFeatures.innerHTML = '';
        modalTech.innerHTML = '';
        currentModalOpenId = null;
        modalIndex = 0;
      }

      // modal controls
      modalPrev && modalPrev.addEventListener('click', (e) => { e.stopPropagation(); modalMove(-1); });
      modalNext && modalNext.addEventListener('click', (e) => { e.stopPropagation(); modalMove(1); });
      modalCloseButtons.forEach(btn => btn.addEventListener('click', () => closeModal()));
      modal.querySelector('.modal-overlay').addEventListener('click', closeModal);

      function modalMove(dir) {
        const slides = Array.from(modalSlidesContainer.querySelectorAll('img'));
        if (!slides.length) return;
        modalIndex = (modalIndex + dir + slides.length) % slides.length;
        updateModalSlides();

        // sync back to card's displayed slide for opened project (so card matches modal)
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
      let touchStartX = 0;
      modalSlidesContainer.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
      modalSlidesContainer.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) modalMove(dx < 0 ? 1 : -1);
      });

      // prevent focus leaving modal while open (basic)
      document.addEventListener('focus', function (e) {
        if (modal.getAttribute('aria-hidden') === 'false' && !modal.contains(e.target)) {
          e.stopPropagation();
          modalPanel.focus();
        }
      }, true);
      
      /* ---------- Nav detach on scroll using user's nav markup ---------- */
      const nav = document.querySelector('nav');
      let lastScroll = window.scrollY;
      const THRESHOLD = 120;
      let ticking = false;

      function onScroll() {
        lastScroll = window.scrollY;
        if (!ticking) {
          window.requestAnimationFrame(() => {
            updateNav();
            ticking = false;
          });
          ticking = true;
        }
      }

      function updateNav() {
        if (!nav) return;
        if (lastScroll > THRESHOLD) {
          if (!nav.classList.contains('detached')) {
            nav.classList.add('detached');
            document.body.classList.add('nav-detached');
            // set padding-top to reserve space for fixed nav
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

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('load', updateNav);
      window.addEventListener('resize', () => setTimeout(updateNav, 100));

      /* ---------- Cert modal: open image in modal on click ---------- */
      document.addEventListener('DOMContentLoaded', () => {
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
            e.preventDefault(); // keep href as fallback but open modal instead
            const img = link.querySelector('.cert-photo');
            const src = img ? img.src : link.href;
            const card = link.closest('.cert-card');
            const title = card ? (card.querySelector('.cert-name')?.textContent || '') : '';
            const desc = card ? (card.querySelector('.cert-desc')?.textContent || '') : '';
            openCertModal(src, title, desc);
          });
    
          // keyboard accessibility: Enter on link also opens modal (anchor handles it)
        });
    
        certModalClose.addEventListener('click', closeCertModal);
        certOverlay.addEventListener('click', closeCertModal);
    
        document.addEventListener('keydown', (e) => {
          if (certModal.getAttribute('aria-hidden') === 'false') {
            if (e.key === 'Escape') closeCertModal();
          }
        });
      });
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll("nav .navbarcontent a");

    window.addEventListener("scroll", () => {
      let current = "";
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 80; // adjust offset for nav height
        const sectionHeight = section.clientHeight;
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
          current = section.getAttribute("id");
        }
      });

      navLinks.forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${current}`) {
          link.classList.add("active");
        }
      });
    });

    // Close mobile menu when a nav link is clicked (mobile-friendly)
      const menuToggle = document.getElementById('menu-toggle');
      document.querySelectorAll('nav .navbarcontent a').forEach(a => {
        a.addEventListener('click', () => {
          if (menuToggle && menuToggle.checked) menuToggle.checked = false;
        });
      });

      
    })();


    
    /* ----------------------------
       Advanced Section animation behavior
       - Adds animated classes to each visible child and staggers them (PowerPoint-like)
       - Assigns varied animation presets per child for a presentation feel
       - Uses IntersectionObserver and respects prefers-reduced-motion
    */
    (function sectionAnimations() {
      function pickAnimationForIndex(i, total) {
        // Cycle through a pleasing set of animations for variety
        const list = ['fly-left', 'fly-right', 'fly-up', 'zoom', 'fade', 'flip', 'wipe'];
        // weight so first few items more likely to be fly-in or fade
        return list[i % list.length];
      }
    
      function init() {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          // If user prefers reduced motion, do not set animations
          return;
        }
    
        const allSections = Array.from(document.querySelectorAll('main > section, #home, .about-section, #work, #projects, #skills, .skills-section, .contact-section'));
        if (!allSections.length) return;
    
        allSections.forEach(sec => {
          // avoid reprocessing if already prepared
          if (sec.dataset.animPrepared === 'true') return;
          sec.dataset.animPrepared = 'true';
    
          sec.classList.add('section-anim'); // baseline
    
          // gather only element children (skip text nodes)
          const children = Array.from(sec.children).filter(ch => ch.nodeType === 1);
    
          // If section has very many children, limit to first 12 to keep performance good
          const maxAnimate = 12;
          const animChildren = children.slice(0, maxAnimate);
    
          animChildren.forEach((ch, i) => {
            // add generic anim-child class
            ch.classList.add('anim-child');
    
            // pick animation type and add anim-... class
            const animType = pickAnimationForIndex(i, animChildren.length);
            ch.classList.add(`anim-${animType}`);
    
            // Set stagger delay so things appear sequentially like a slide build
            // Use larger base delay for sections lower on page to create cadence
            const baseDelay = 80; // ms
            const sectionDepthOffset = Math.min(Math.floor(sec.getBoundingClientRect().top / 300), 8); // small offset
            const delay = (i * baseDelay) + (sectionDepthOffset * 20);
            ch.style.transitionDelay = `${delay}ms`;
    
            // optional: slightly vary duration for a nicer effect
            const durBase = 520;
            const extra = (i % 3) * 60;
            ch.style.transitionDuration = `${durBase + extra}ms`;
    
            // ensure elements that are large (images) get a bit more zoom time
            if (ch.tagName.toLowerCase() === 'img' || ch.querySelector('img')) {
              ch.style.transitionDuration = `${durBase + 120}ms`;
            }
          });
        });
    
        const observer = new IntersectionObserver((entries, obs) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const sec = entry.target;
    
              // add in-view to parent section which triggers child transitions
              sec.classList.add('in-view');
    
              // Unobserve to play only once per section (PowerPoint-like one-time build)
              obs.unobserve(sec);
            }
          });
        }, {
          root: null,
          rootMargin: '0px 0px -12% 0px', // trigger slightly before fully visible
          threshold: 0.12
        });
    
        allSections.forEach(s => observer.observe(s));
      }
    
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    })();