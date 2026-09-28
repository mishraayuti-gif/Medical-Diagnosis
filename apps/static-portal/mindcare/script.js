document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 18);
  }, { passive: true });

  navToggle.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!open));
    navToggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    navLinks.classList.toggle('open', !open);
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
    });
  });

  const revealItems = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });
  revealItems.forEach((item) => revealObserver.observe(item));

  const moodMessages = {
    Happy: 'Let that warmth have its moment. You are allowed to enjoy how you feel.',
    Okay: 'Okay is a real place to be. You do not need to turn it into anything else.',
    Neutral: 'Neutral is welcome here too. Notice what your body might need next.',
    Sad: 'That sounds heavy. You deserve gentleness and someone safe to share it with.',
    Anxious: 'You are not in trouble for feeling anxious. Let us take this one breath at a time.'
  };
  const moodResponse = document.querySelector('#mood-response span');
  document.querySelectorAll('.mood-option').forEach((option) => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.mood-option').forEach((item) => item.classList.remove('selected'));
      option.classList.add('selected');
      moodResponse.textContent = moodMessages[option.dataset.mood];
      moodResponse.parentElement.classList.remove('response-pop');
      void moodResponse.parentElement.offsetWidth;
      moodResponse.parentElement.classList.add('response-pop');
    });
  });

  document.querySelectorAll('.topic-more').forEach((button) => {
    button.addEventListener('click', () => {
      const card = button.closest('.topic-card');
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      button.firstChild.textContent = expanded ? 'Learn gently ' : 'Close gently ';
      card.classList.toggle('expanded', !expanded);
    });
  });

  const breathingButton = document.querySelector('#breathing-button');
  const breathingOrb = document.querySelector('#breathing-orb');
  const breathingLabel = document.querySelector('#breathing-label');
  const breathingCount = document.querySelector('#breathing-count');
  let breathingTimer;
  let breathingRunning = false;
  let breathingPhase = 0;
  const phases = [
    { label: 'Breathe in', className: 'inhale', seconds: 4 },
    { label: 'Hold', className: 'hold', seconds: 4 },
    { label: 'Breathe out', className: 'exhale', seconds: 6 },
    { label: 'Rest', className: 'exhale', seconds: 2 }
  ];

  const updateBreathing = () => {
    const phase = phases[breathingPhase];
    breathingOrb.className = `breathing-orb ${phase.className}`;
    breathingLabel.textContent = phase.label;
    let remaining = phase.seconds;
    breathingCount.textContent = `${remaining}s · follow the circle`;
    clearInterval(breathingTimer);
    breathingTimer = setInterval(() => {
      remaining -= 1;
      breathingCount.textContent = `${Math.max(remaining, 0)}s · follow the circle`;
      if (remaining <= 0) {
        breathingPhase = (breathingPhase + 1) % phases.length;
        updateBreathing();
      }
    }, 1000);
  };

  breathingButton.addEventListener('click', () => {
    breathingRunning = !breathingRunning;
    if (breathingRunning) {
      breathingButton.innerHTML = '<i data-lucide="pause"></i> Pause exercise';
      breathingPhase = 0;
      updateBreathing();
    } else {
      clearInterval(breathingTimer);
      breathingOrb.className = 'breathing-orb';
      breathingLabel.textContent = 'Ready when you are';
      breathingCount.textContent = 'Paused · take your time';
      breathingButton.innerHTML = '<i data-lucide="play"></i> Start breathing exercise';
    }
    if (window.lucide) lucide.createIcons();
  });

  const testimonials = [...document.querySelectorAll('.testimonial')];
  const dots = [...document.querySelectorAll('.carousel-dots button')];
  let currentStory = 0;
  let carouselTimer;
  const showStory = (index) => {
    currentStory = (index + testimonials.length) % testimonials.length;
    testimonials.forEach((story, storyIndex) => story.classList.toggle('active', storyIndex === currentStory));
    dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === currentStory));
  };
  const restartCarousel = () => {
    clearInterval(carouselTimer);
    if (!reducedMotion) carouselTimer = setInterval(() => showStory(currentStory + 1), 6500);
  };
  document.querySelector('.previous').addEventListener('click', () => { showStory(currentStory - 1); restartCarousel(); });
  document.querySelector('.next').addEventListener('click', () => { showStory(currentStory + 1); restartCarousel(); });
  dots.forEach((dot, index) => dot.addEventListener('click', () => { showStory(index); restartCarousel(); }));
  restartCarousel();

  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const counter = entry.target;
      const target = Number(counter.dataset.counter);
      const suffix = counter.dataset.suffix || '';
      if (reducedMotion) {
        counter.textContent = `${target}${suffix}`;
        observer.unobserve(counter);
        return;
      }
      const duration = 1100;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        counter.textContent = `${Math.floor(eased * target)}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      observer.unobserve(counter);
    });
  }, { threshold: .7 });
  document.querySelectorAll('[data-counter]').forEach((counter) => counterObserver.observe(counter));
});
