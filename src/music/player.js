import { AMBIENT_TRACKS } from './playlist.js';

const STORAGE_KEY = 'resonance-music';

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function savePrefs(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

function findTrack(id) {
  return AMBIENT_TRACKS.find((track) => track.id === id) ?? AMBIENT_TRACKS[0] ?? null;
}

export function mountMusicPlayer() {
  if (!AMBIENT_TRACKS.length) return { destroy() {} };

  const prefs = loadPrefs();
  let activeTrack = findTrack(prefs.trackId);
  let isPlaying = false;
  let isOpen = false;
  let autoplayRetryBound = false;

  const audio = new Audio();
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = typeof prefs.volume === 'number' ? prefs.volume : 0.45;

  const root = document.createElement('div');
  root.className = 'music';
  root.innerHTML = `
    <div class="music__bar">
      <button type="button" class="music__toggle" aria-expanded="false" aria-label="Open music player">
        <span class="music__eyebrow">Now playing</span>
        <span class="music__track-scroll">
          <span class="music__track-inner">
            <span class="music__track-text" data-track-text></span>
            <span class="music__track-text" data-track-text-duplicate aria-hidden="true"></span>
          </span>
        </span>
      </button>
      <button type="button" class="music__play" aria-label="Play music" data-play>▶</button>
    </div>
    <div class="music__panel" hidden>
      <p class="music__panel-title">Ambient</p>
      <ul class="music__list" role="listbox" aria-label="Ambient tracks"></ul>
      <label class="music__volume">
        <span>Volume</span>
        <input type="range" min="0" max="1" step="0.01" data-volume />
      </label>
    </div>
  `;
  document.body.appendChild(root);

  const toggle = root.querySelector('.music__toggle');
  const panel = root.querySelector('.music__panel');
  const trackScroll = root.querySelector('.music__track-scroll');
  const trackInner = root.querySelector('.music__track-inner');
  const trackTexts = root.querySelectorAll('[data-track-text], [data-track-text-duplicate]');
  const playButton = root.querySelector('[data-play]');
  const list = root.querySelector('.music__list');
  const volumeInput = root.querySelector('[data-volume]');

  volumeInput.value = String(audio.volume);

  function getLabelText() {
    return activeTrack ? `${activeTrack.title} — ${activeTrack.artist}` : 'Select a track';
  }

  function renderList() {
    list.innerHTML = AMBIENT_TRACKS.map((track) => {
      const isActive = activeTrack?.id === track.id;
      return `
        <li>
          <button
            type="button"
            class="music__option${isActive ? ' is-active' : ''}"
            role="option"
            aria-selected="${isActive}"
            data-track-id="${track.id}"
          >
            <span class="music__option-title">${track.title}</span>
            <span class="music__option-artist">${track.artist}</span>
          </button>
        </li>
      `;
    }).join('');
  }

  function updateLabel() {
    const label = getLabelText();
    trackTexts.forEach((el) => {
      el.textContent = label;
    });
    toggle.setAttribute('aria-label', `Open music player — ${label}`);

    root.classList.remove('is-scrolling');
    trackInner.style.removeProperty('--marquee-duration');

    const overflow = trackTexts[0].scrollWidth > trackScroll.clientWidth;
    if (overflow) {
      const duration = Math.max(8, trackTexts[0].scrollWidth / 28);
      trackInner.style.setProperty('--marquee-duration', `${duration}s`);
      root.classList.add('is-scrolling');
    }
  }

  function updatePlayButton() {
    playButton.textContent = isPlaying ? '❚❚' : '▶';
    playButton.setAttribute('aria-label', isPlaying ? 'Pause music' : 'Play music');
    root.classList.toggle('is-playing', isPlaying);
  }

  function persist() {
    savePrefs({
      trackId: activeTrack?.id ?? null,
      volume: audio.volume,
    });
  }

  function unbindAutoplayRetry() {
    if (!autoplayRetryBound) return;
    document.removeEventListener('pointerdown', onFirstInteraction);
    document.removeEventListener('keydown', onFirstInteraction);
    document.removeEventListener('wheel', onFirstInteraction);
    autoplayRetryBound = false;
  }

  function onFirstInteraction() {
    if (isPlaying) {
      unbindAutoplayRetry();
      return;
    }

    play().then((started) => {
      if (started) unbindAutoplayRetry();
    });
  }

  function bindAutoplayRetry() {
    if (autoplayRetryBound || isPlaying) return;
    autoplayRetryBound = true;
    document.addEventListener('pointerdown', onFirstInteraction);
    document.addEventListener('keydown', onFirstInteraction);
    document.addEventListener('wheel', onFirstInteraction, { passive: true });
  }

  async function tryAutoplay() {
    const started = await play();
    if (!started) bindAutoplayRetry();
  }

  function setTrack(track, { autoplay = false } = {}) {
    if (!track || track.id === activeTrack?.id) return;

    activeTrack = track;
    audio.src = track.src;
    renderList();
    updateLabel();
    persist();

    if (autoplay) {
      tryAutoplay();
    }
  }

  async function play() {
    if (!activeTrack) return false;

    if (!audio.src) {
      audio.src = activeTrack.src;
    }

    try {
      await audio.play();
      isPlaying = true;
      updatePlayButton();
      return true;
    } catch {
      isPlaying = false;
      updatePlayButton();
      return false;
    }
  }

  function pause() {
    audio.pause();
    isPlaying = false;
    updatePlayButton();
  }

  function togglePlay() {
    if (isPlaying) {
      pause();
      return;
    }
    play();
  }

  function setOpen(open) {
    isOpen = open;
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    root.classList.toggle('is-open', open);
  }

  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-track-id]');
    if (!button) return;

    const track = findTrack(button.dataset.trackId);
    if (!track) return;

    const wasPlaying = isPlaying;
    if (wasPlaying) pause();
    setTrack(track);
    if (wasPlaying) play();
  });

  playButton.addEventListener('click', togglePlay);

  toggle.addEventListener('click', () => setOpen(!isOpen));

  volumeInput.addEventListener('input', () => {
    audio.volume = Number(volumeInput.value);
    persist();
  });

  document.addEventListener('click', (event) => {
    if (!isOpen || root.contains(event.target)) return;
    setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) setOpen(false);
  });

  const resizeObserver = new ResizeObserver(() => updateLabel());
  resizeObserver.observe(trackScroll);

  if (activeTrack) {
    audio.src = activeTrack.src;
  }

  renderList();
  updateLabel();
  updatePlayButton();
  tryAutoplay();

  return {
    destroy() {
      unbindAutoplayRetry();
      resizeObserver.disconnect();
      pause();
      audio.removeAttribute('src');
      root.remove();
    },
  };
}
