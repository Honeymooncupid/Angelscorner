  const backdrop = document.getElementById('backdrop');
  const titleCard = document.getElementById('titleCard');
  const scene = document.getElementById('scene');

  // two music widgets (angel's bottom right, Jai's bottom left) share one player
  const players = Array.from(document.querySelectorAll('.music')).map(root => {
    const get = (role) => root.querySelector('[data-role="' + role + '"]');
    return {
      root, tab: get('tab'), title: get('title'), artist: get('artist'), bar: get('bar'),
      fill: get('fill'), prev: get('prev'), play: get('play'), next: get('next'), mute: get('mute')
    };
  });
  const scIframe = document.getElementById('scPlayer');
  const body = document.body;

  // only the songs you pick live here. add more links to grow the playlist
  // titles marked auto get filled in from SoundCloud once the song loads
  const PLAYLIST = [
    { url: 'https://soundcloud.com/mattalexanderreilly/yes-to-heaven-say-yes-to', title: 'Say Yes to Heaven', artist: 'Lana Del Rey' },
    { url: 'https://soundcloud.com/7nariq/angelsforeverforeverangels', title: 'Angels Forever', artist: 'Lana Del Rey' },
    { url: 'https://soundcloud.com/user-503161897/bbm-baby-lana-del-rey', title: 'BBM Baby', artist: 'Lana Del Rey' },
    { url: 'https://soundcloud.com/megan-budnick/prom-song-gone-wrong', title: 'Prom Song Gone Wrong', artist: '', auto: true }
  ];
  let current = 0;

  let revealed = false;
  let sceneReady = false;
  let view = 'home';
  let muted = false;
  let playing = false;
  let scReady = false;
  let wantsToPlay = false;

  // if SoundCloud is blocked or slow to load, the rest of the page still works
  const noop = () => {};
  let scWidget = { bind: noop, play: noop, pause: noop, setVolume: noop, load: noop, seekTo: noop, getDuration: noop, getCurrentSound: noop };
  try {
    if (window.SC && SC.Widget) scWidget = SC.Widget(scIframe);
  } catch (err) {
    console.warn('SoundCloud player unavailable', err);
  }

  function showTrack(){
    const t = PLAYLIST[current];
    players.forEach(p => {
      p.title.textContent = t.title;
      p.artist.textContent = t.artist;
      p.fill.style.width = '0%';
    });
  }

  function setPlayingUI(isPlaying){
    playing = isPlaying;
    players.forEach(p => {
      p.play.textContent = isPlaying ? '❚❚' : '▶';
      p.play.setAttribute('aria-label', isPlaying ? 'Pause music' : 'Play music');
    });
  }

  function fillFromSoundCloud(){
    const t = PLAYLIST[current];
    if (!t.auto) return;
    scWidget.getCurrentSound((snd) => {
      if (!snd || PLAYLIST[current] !== t) return;
      t.title = snd.title || t.title;
      t.artist = (snd.user && snd.user.username) || t.artist;
      showTrack();
    });
  }

  function loadTrack(i, autoplay){
    current = (i + PLAYLIST.length) % PLAYLIST.length;
    showTrack();
    scWidget.load(PLAYLIST[current].url, {
      auto_play: autoplay,
      hide_related: true,
      show_comments: false,
      show_user: false,
      show_reposts: false,
      show_teaser: false,
      visual: false
    });
  }

  scWidget.bind(SC.Widget.Events.READY, () => {
    scReady = true;
    scWidget.setVolume(muted ? 0 : 100);
    fillFromSoundCloud();
    if (wantsToPlay) scWidget.play();
  });
  scWidget.bind(SC.Widget.Events.PLAY, () => setPlayingUI(true));
  scWidget.bind(SC.Widget.Events.PAUSE, () => setPlayingUI(false));
  scWidget.bind(SC.Widget.Events.PLAY_PROGRESS, (e) => {
    players.forEach(p => { p.fill.style.width = (e.relativePosition * 100).toFixed(1) + '%'; });
  });
  scWidget.bind(SC.Widget.Events.FINISH, () => {
    if (PLAYLIST.length > 1){
      loadTrack(current + 1, true);
    } else {
      scWidget.seekTo(0);
      scWidget.play();
    }
  });

  if (PLAYLIST.length > 1){
    players.forEach(p => { p.prev.hidden = false; p.next.hidden = false; });
  }
  showTrack();

  function reveal(){
    if (revealed) return;
    revealed = true;

    backdrop.classList.add('hidden');
    body.classList.add('entered');
    players.forEach(p => p.root.classList.add('visible'));

    wantsToPlay = true;
    if (scReady) scWidget.play();

    setTimeout(() => titleCard.classList.add('visible'), 300);
    setTimeout(() => {
      sceneReady = true;
      if (view === 'home') scene.classList.add('visible');
    }, 300 + 3000);
  }

  players.forEach(pl => {
    pl.tab.addEventListener('click', () => {
      const open = pl.root.classList.toggle('open');
      pl.tab.setAttribute('aria-expanded', String(open));
      pl.tab.setAttribute('aria-label', open ? 'Close music player' : 'Open music player');
    });

    pl.play.addEventListener('click', () => {
      wantsToPlay = !playing;
      if (playing) scWidget.pause(); else scWidget.play();
    });

    pl.mute.addEventListener('click', () => {
      muted = !muted;
      scWidget.setVolume(muted ? 0 : 100);
      players.forEach(q => {
        q.mute.textContent = muted ? '🔇' : '🔊';
        q.mute.setAttribute('aria-pressed', String(muted));
        q.mute.setAttribute('aria-label', muted ? 'Unmute music' : 'Mute music');
      });
    });

    pl.prev.addEventListener('click', () => loadTrack(current - 1, true));
    pl.next.addEventListener('click', () => loadTrack(current + 1, true));

    pl.bar.addEventListener('click', (e) => {
      const r = pl.bar.getBoundingClientRect();
      const pct = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
      scWidget.getDuration((ms) => scWidget.seekTo(ms * pct));
    });
  });

  document.getElementById('btnOk').addEventListener('click', reveal);

  // flip the photo card
  const card = document.getElementById('card');

  function flipCard(){
    const flipped = card.classList.toggle('flipped');
    card.setAttribute('aria-pressed', String(flipped));
  }

  card.addEventListener('click', flipCard);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      flipCard();
    }
  });


  // ---------- letters (carousel) ----------
  // edit these! one object per letter card.
  //   name: what's written on the front   |  date: optional, bottom-right of the front
  //   text: the letter. leave a blank line (\n\n) between paragraphs
  //   to / from: optional greeting and sign-off
  // these are just placeholders - replace them with your real letters

  // angel's side (pink cards)
  const LETTERS = [
    {
      name: 'open when you miss me',
      date: '',
      to: 'Jai,',
      text: 'This is a placeholder letter. Replace this text with whatever you want to say.\n\nYou can write as many paragraphs as you like. If a letter gets long, the card scrolls.',
      from: '— Angel'
    },
    {
      name: 'open when you need a smile',
      date: '',
      to: 'Jai,',
      text: 'Another placeholder. Swap in a favorite memory, an inside joke, or a little reminder of how loved you are.',
      from: '— Angel'
    },
    {
      name: 'just because',
      date: '',
      to: 'Jai,',
      text: 'One more placeholder. Add or delete letters in the LETTERS list in script.js and the carousel updates on its own.',
      from: '— Angel'
    }
  ];

  // Jai's side (green cards)
  const JAI_LETTERS = [
    {
      name: 'open when you miss me',
      date: '',
      to: 'Angel,',
      text: 'This is a placeholder letter from Jai. Replace this text with whatever you want to say.\n\nYou can write as many paragraphs as you like. If a letter gets long, the card scrolls.',
      from: '— Jai'
    },
    {
      name: 'open when you need a smile',
      date: '',
      to: 'Angel,',
      text: 'Another placeholder. Swap in a favorite memory, an inside joke, or a little reminder of how loved you are.',
      from: '— Jai'
    },
    {
      name: 'just because',
      date: '',
      to: 'Angel,',
      text: 'One more placeholder. Add or delete letters in the JAI_LETTERS list in script.js and the carousel updates on its own.',
      from: '— Jai'
    }
  ];

  let world = 'angel';   // which side is showing: 'angel' or 'jai'
  let jaiView = 'home';  // which page is open on Jai's side

  // builds one carousel from a list of letters. used for both sides
  function createLetterCarousel(letters, ids){
    const viewport = document.getElementById(ids.viewport);
    const track = document.getElementById(ids.track);
    const dotsBox = document.getElementById(ids.dots);
    const prevLetter = document.getElementById(ids.prev);
    const nextLetter = document.getElementById(ids.next);

    const slides = [];
    const cards = [];
    const dots = [];
    let slideIndex = 0;
    let dragStartX = null;
    let dragDX = 0;
    let dragMoved = false;

    function setFlipped(i, flipped){
      const el = cards[i];
      if (!el) return;
      el.classList.toggle('flipped', flipped);
      el.setAttribute('aria-pressed', String(flipped));
      el.setAttribute('aria-label', (flipped ? 'Close letter: ' : 'Open letter: ') + letters[i].name);
      if (flipped) el.querySelector('.letter__body').scrollTop = 0;
    }

    function makeLetterCard(l, i){
      const el = document.createElement('div');
      el.className = 'card letter';
      el.setAttribute('role', 'button');
      el.setAttribute('aria-pressed', 'false');
      el.setAttribute('aria-label', 'Open letter: ' + l.name);

      const inner = document.createElement('div');
      inner.className = 'card__inner';

      const front = document.createElement('div');
      front.className = 'card__face card__front';
      const seal = document.createElement('div');
      seal.className = 'letter__seal';
      seal.setAttribute('aria-hidden', 'true');
      seal.textContent = '♡';
      const name = document.createElement('p');
      name.className = 'letter__name';
      name.textContent = l.name;
      front.append(seal, name);
      if (l.date){
        const d = document.createElement('p');
        d.className = 'letter__date';
        d.textContent = l.date;
        front.appendChild(d);
      }

      const back = document.createElement('div');
      back.className = 'card__face card__back';
      const body = document.createElement('div');
      body.className = 'letter__body';
      if (l.to){
        const p = document.createElement('p');
        p.className = 'letter__to';
        p.textContent = l.to;
        body.appendChild(p);
      }
      String(l.text || '').split(/\n\s*\n/).forEach(para => {
        const p = document.createElement('p');
        p.textContent = para.trim();
        body.appendChild(p);
      });
      if (l.from){
        const p = document.createElement('p');
        p.className = 'letter__sig';
        p.textContent = l.from;
        body.appendChild(p);
      }
      back.appendChild(body);

      inner.append(front, back);
      el.appendChild(inner);

      // tapping a side card brings it to the middle; tapping the middle card flips it
      el.addEventListener('click', () => {
        if (i !== slideIndex) goTo(i);
        else setFlipped(i, !el.classList.contains('flipped'));
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          el.click();
        }
      });
      return el;
    }

    // slide the track so the active card sits in the middle of the screen
    function layout(){
      const s = slides[slideIndex];
      if (!s) return;
      const x = viewport.clientWidth / 2 - (s.offsetLeft + s.offsetWidth / 2) + dragDX;
      track.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
    }

    function goTo(i){
      i = Math.max(0, Math.min(letters.length - 1, i));
      if (i !== slideIndex) setFlipped(slideIndex, false); // close the letter we're leaving
      slideIndex = i;
      slides.forEach((s, k) => {
        const on = k === i;
        s.classList.toggle('active', on);
        s.setAttribute('aria-hidden', String(!on));
        cards[k].tabIndex = on ? 0 : -1;
        dots[k].classList.toggle('is-active', on);
        if (on) dots[k].setAttribute('aria-current', 'true');
        else dots[k].removeAttribute('aria-current');
      });
      prevLetter.disabled = nextLetter.disabled = letters.length < 2;
      layout();
    }

    // move one letter forward (+1) or back (-1); wraps around at the ends
    function step(dir){
      if (!letters.length) return;
      goTo((slideIndex + dir + letters.length) % letters.length);
    }

    const noteEl = viewport.closest('.letters').querySelector('.letters__note');
    const defaultNote = noteEl ? noteEl.textContent : '';

    function build(){
      track.innerHTML = '';
      dotsBox.innerHTML = '';
      slides.length = 0; cards.length = 0; dots.length = 0;
      letters.forEach((l, i) => {
        const slide = document.createElement('div');
        slide.className = 'carousel__slide';
        const card = makeLetterCard(l, i);
        cards.push(card);
        slide.appendChild(card);
        track.appendChild(slide);
        slides.push(slide);

        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel__dot';
        dot.setAttribute('aria-label', 'Go to letter ' + (i + 1));
        dot.addEventListener('click', () => goTo(i));
        dotsBox.appendChild(dot);
        dots.push(dot);
      });
      if (noteEl) noteEl.textContent = letters.length ? defaultNote : 'no letters yet \u2661 add one in settings';
      goTo(slideIndex);
    }

    prevLetter.addEventListener('click', () => step(-1));
    nextLetter.addEventListener('click', () => step(1));
    window.addEventListener('resize', layout);

    // swipe / drag
    viewport.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragStartX = e.clientX;
      dragDX = 0;
      dragMoved = false;
    });

    window.addEventListener('pointermove', (e) => {
      if (dragStartX === null) return;
      const dx = e.clientX - dragStartX;
      if (!dragMoved && Math.abs(dx) < 10) return;
      dragMoved = true;
      track.classList.add('dragging');
      dragDX = dx;
      layout();
    });

    function endDrag(cancelled){
      if (dragStartX === null) return;
      const dx = dragDX;
      dragStartX = null;
      dragDX = 0;
      track.classList.remove('dragging');
      if (dragMoved && !cancelled && Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
      else layout();
      setTimeout(() => { dragMoved = false; }, 60);
    }

    window.addEventListener('pointerup', () => endDrag(false));
    window.addEventListener('pointercancel', () => endDrag(true));

    // a swipe shouldn't also count as a tap that flips a card
    viewport.addEventListener('click', (e) => {
      if (dragMoved){
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);

    // left / right arrow keys (only while this carousel is the one on screen)
    document.addEventListener('keydown', (e) => {
      if (!ids.isActive()) return;
      if (document.getElementById(ids.menu).classList.contains('open')) return;
      if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    });

    build();

    return {
      layout,
      close: () => setFlipped(slideIndex, false),
      setLetters: (list) => { letters = list; build(); },
      last: () => goTo(letters.length - 1)
    };
  }

  const angelCarousel = createLetterCarousel(LETTERS, {
    viewport: 'carouselViewport', track: 'carouselTrack', dots: 'carouselDots',
    prev: 'prevLetter', next: 'nextLetter', menu: 'menu',
    isActive: () => view === 'letters' && revealed && world === 'angel'
  });

  const jaiCarousel = createLetterCarousel(JAI_LETTERS, {
    viewport: 'carouselViewportJai', track: 'carouselTrackJai', dots: 'carouselDotsJai',
    prev: 'prevLetterJai', next: 'nextLetterJai', menu: 'menuJai',
    isActive: () => jaiView === 'letters' && world === 'jai'
  });

  // angel's side: switch between home (photo card) and letters
  const lettersView = document.getElementById('letters');

  function showView(name){
    if (!revealed) return;
    if (view === 'letters' && name !== 'letters') angelCarousel.close();
    if (view === 'uwu' && name !== 'uwu') angelFace.stop();
    view = name;
    scene.classList.toggle('visible', name === 'home' && sceneReady);
    lettersView.classList.toggle('visible', name === 'letters');
    lettersView.setAttribute('aria-hidden', String(name !== 'letters'));
    uwuView.classList.toggle('visible', name === 'uwu');
    uwuView.setAttribute('aria-hidden', String(name !== 'uwu'));
    if (name === 'letters'){
      lettersView.scrollTop = 0;
      angelCarousel.layout();
    }
    if (name === 'uwu') angelFace.start();
  }

  document.querySelectorAll('#menuPanel a[data-view]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      showView(a.dataset.view);
    });
  });

  // Jai's side: same thing
  const sceneJai = document.getElementById('sceneJai');
  const lettersViewJai = document.getElementById('lettersJai');

  function showJaiView(name){
    if (jaiView === 'letters' && name !== 'letters') jaiCarousel.close();
    if (jaiView === 'uwu' && name !== 'uwu') jaiFace.stop();
    jaiView = name;
    sceneJai.classList.toggle('visible', name === 'home');
    lettersViewJai.classList.toggle('visible', name === 'letters');
    lettersViewJai.setAttribute('aria-hidden', String(name !== 'letters'));
    uwuViewJai.classList.toggle('visible', name === 'uwu');
    uwuViewJai.setAttribute('aria-hidden', String(name !== 'uwu'));
    if (name === 'letters'){
      lettersViewJai.scrollTop = 0;
      jaiCarousel.layout();
    }
    if (name === 'uwu') jaiFace.start();
  }

  // floating background symbols
  function spawnFloaties(box, colors){
    const symbols = ['<3', ';)', ':3', ':)', '♡', 'xo', '^_^', '<3', ':3', ';)', '౨ৎ', '𐙚', '౨ৎ', '𐙚'];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const count = window.innerWidth < 600 ? 18 : 32;
    const rand = (a, b) => a + Math.random() * (b - a);

    for (let i = 0; i < count; i++){
      const el = document.createElement('span');
      el.className = 'float';
      el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      const dur = rand(14, 30);
      el.style.left = rand(0, 96) + '%';
      el.style.fontSize = rand(1.1, 2.6).toFixed(2) + 'rem';
      el.style.color = colors[Math.floor(Math.random() * colors.length)];
      el.style.setProperty('--dur', dur.toFixed(1) + 's');
      el.style.setProperty('--delay', (-rand(0, dur)).toFixed(1) + 's');
      el.style.setProperty('--dx', rand(-60, 60).toFixed(0) + 'px');
      el.style.setProperty('--r0', rand(-25, 0).toFixed(0) + 'deg');
      el.style.setProperty('--r1', rand(0, 25).toFixed(0) + 'deg');
      el.style.setProperty('--o', rand(0.18, 0.38).toFixed(2));
      if (reduce) el.style.transform = 'translateY(' + rand(10, 90).toFixed(0) + 'vh)';
      box.appendChild(el);
    }
  }

  spawnFloaties(document.getElementById('floaties'), ['#46603C', '#46603C', '#384E30', '#D9A94E']);
  spawnFloaties(document.getElementById('floatiesJai'), ['#AB5A72', '#D98CA3', '#8A4A5C', '#E3A0B3']);

  // hamburger menu
  const menu = document.getElementById('menu');
  const menuBtn = document.getElementById('menuBtn');

  function setMenu(open){
    menu.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  document.getElementById('menuScrim').addEventListener('click', () => setMenu(false));
  document.querySelectorAll('#menuPanel a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target)) setMenu(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });


  // ---------- Jai's corner (placeholder) ----------
  const jaiCard = document.getElementById('cardJai');

  function flipJaiCard(){
    const flipped = jaiCard.classList.toggle('flipped');
    jaiCard.setAttribute('aria-pressed', String(flipped));
  }

  jaiCard.addEventListener('click', flipJaiCard);
  jaiCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      flipJaiCard();
    }
  });

  const jaiMenu = document.getElementById('menuJai');
  const jaiMenuBtn = document.getElementById('menuBtnJai');

  function setJaiMenu(open){
    jaiMenu.classList.toggle('open', open);
    jaiMenuBtn.setAttribute('aria-expanded', String(open));
    jaiMenuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  jaiMenuBtn.addEventListener('click', () => setJaiMenu(!jaiMenu.classList.contains('open')));
  document.getElementById('menuScrimJai').addEventListener('click', () => setJaiMenu(false));
  document.querySelectorAll('#menuPanelJai a').forEach(a => a.addEventListener('click', (e) => {
    e.preventDefault();
    if (a.dataset.view) showJaiView(a.dataset.view);   // memories / our songs are still placeholders
    setJaiMenu(false);
  }));
  document.addEventListener('click', (e) => {
    if (!jaiMenu.contains(e.target)) setJaiMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setJaiMenu(false);
  });

  // ---------- slide between angel's corner and Jai's corner ----------
  const worldAngel = document.getElementById('worldAngel');
  const worldJai = document.getElementById('worldJai');
  const worldToggle = document.getElementById('worldToggle');

  function setWorld(name){
    world = name;
    const jai = name === 'jai';
    body.classList.toggle('jai-mode', jai);

    // the world that's off-screen can't be tabbed into or read out
    worldAngel.inert = jai;
    worldJai.inert = !jai;
    worldAngel.setAttribute('aria-hidden', String(jai));
    worldJai.setAttribute('aria-hidden', String(!jai));

    const label = jai ? "Go to Angel's corner" : "Go to Jai's corner";
    worldToggle.setAttribute('aria-pressed', String(jai));
    worldToggle.setAttribute('aria-label', label);
    worldToggle.title = label;
    document.title = jai ? "Jai's corner" : "angel's corner";

    setMenu(false);
    setJaiMenu(false);

    // only the face that's on screen keeps animating
    if (jai){
      if (view === 'uwu') angelFace.stop();
      if (jaiView === 'uwu') jaiFace.start();
    } else {
      if (jaiView === 'uwu') jaiFace.stop();
      if (view === 'uwu') angelFace.start();
    }
  }

  worldToggle.addEventListener('click', () => setWorld(world === 'angel' ? 'jai' : 'angel'));


  // ---------- tiny stick couple that strolls along the footer from time to time ----------
  (function(){
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const HEAD = ' o   o ';
    const BODY = '/|\\_/|\\';                                  // two people holding hands
    const LEGS = ['/ \\ / \\', ' |   | ', '\\ / \\ /', ' |   | '];  // walking cycle
    const SPEED = 60;        // pixels per second

    document.querySelectorAll('.footer .walker').forEach((walker) => {
      const footer = walker.parentElement;
      const world = footer.closest('.world');
      const figs = walker.querySelector('.walker__figs');
      let frame = 0;

      function draw(){
        figs.textContent = HEAD + '\n' + BODY + '\n' + LEGS[frame % LEGS.length];
      }
      draw();

      function walk(){
        const w = walker.offsetWidth;
        const W = footer.clientWidth;
        const leftToRight = Math.random() < 0.5;
        const from = leftToRight ? -w - 12 : W + 12;
        const to = leftToRight ? W + 12 : -w - 12;
        const duration = Math.abs(to - from) / SPEED * 1000;

        walker.classList.add('walker--on');
        const legTimer = setInterval(() => { frame++; draw(); }, 170);

        const anim = walker.animate(
          [{ transform: 'translateX(' + from + 'px)' }, { transform: 'translateX(' + to + 'px)' }],
          { duration: duration, easing: 'linear', fill: 'forwards' }
        );
        anim.onfinish = () => {
          clearInterval(legTimer);
          walker.classList.remove('walker--on');
          scheduleWalk(14000 + Math.random() * 16000);
        };
      }

      function tryWalk(){
        // wait until the page is open, this side is on screen, and the tab is visible
        if (!document.body.classList.contains('entered') || world.inert || document.hidden){
          scheduleWalk(3000);
          return;
        }
        walk();
      }

      function scheduleWalk(ms){ setTimeout(tryWalk, ms); }

      scheduleWalk(5000 + Math.random() * 5000);
    });
  })();


  // ---------- UwU: a face made of symbols that blinks, winks, sleeps and gets angry ----------
  function createFace(root){
    const art = root.querySelector('.face__art');
    const W = 25;                         // the whole face is 25 characters wide
    const blank = ' '.repeat(W);

    // drop little bits of text at given columns on an empty row
    function place(items){
      const a = blank.split('');
      items.forEach(([col, s]) => {
        for (let i = 0; i < s.length; i++) a[col + i] = s[i];
      });
      return a.join('');
    }

    // every eye is 5 characters wide and 3 rows tall
    const EYES = {
      open:  [' ,-. ', '( O )', " `-' "],
      small: [' ,-. ', '( . )', " `-' "],      // tiny angry pupils
      shut:  ['     ', '-----', '     '],
      arch:  ['  _  ', ' / \\ ', '     '],     // the winking eye
      bowl:  ['\\   /', ' \\_/ ', '     ']      // happy "U" eyes
    };

    const NOTHING = () => [blank, blank];

    // each state says which eyes, cheeks and mouth to draw, plus little floating extras
    const STATES = {
      idle:  { l: 'open',  r: 'open',  cheek: '///', mouth: () => '    w    ', extras: NOTHING },
      blink: { l: 'shut',  r: 'shut',  cheek: '///', mouth: () => '    w    ', extras: NOTHING },
      wink:  { l: 'open',  r: 'arch',  cheek: '///', mouth: () => '    w    ',
               extras: () => [blank, place([[22, '*']])] },
      uwu:   { l: 'bowl',  r: 'bowl',  cheek: '///', mouth: () => '    w    ',
               extras: (t) => t % 2
                 ? [place([[4, '<3'], [19, '<3']]), blank]
                 : [blank, place([[3, '<3'], [20, '<3']])] },
      sleep: { l: 'shut',  r: 'shut',  cheek: '   ',
               mouth: (t) => (t % 2 ? '    .    ' : '    o    '),
               extras: (t) => [
                 [blank, place([[21, 'z']])],
                 [place([[23, 'Z']]), place([[21, 'z']])],
                 [place([[22, 'z'], [24, 'Z']]), blank]
               ][t % 3] },
      angry: { l: 'small', r: 'small', brows: true, cheek: '###', mouth: () => '   /^\\   ',
               extras: (t) => t % 2
                 ? [place([[2, '#'], [22, '#']]), place([[3, '!'], [21, '!']])]
                 : [place([[3, '#'], [21, '#']]), place([[2, '!'], [22, '!']])] }
    };

    let state = 'idle';
    let tick = 0;
    let running = false;
    let timers = [];
    let ticker = null;
    const lastSeen = { sleep: 0, angry: 0, wink: 0 };

    function build(){
      const s = STATES[state];
      const L = EYES[s.l];
      const R = EYES[s.r];
      const eyeRow = (i) => '   ' + L[i] + '     ' + R[i] + '   ';
      const brows = s.brows
        ? '   ' + '\\\\\\\\' + ' '.repeat(7) + '////' + '   '
        : ' '.repeat(21);
      const mouthRow = '   ' + s.cheek + s.mouth(tick) + s.cheek + '   ';
      const extras = s.extras(tick);
      return [
        extras[0],
        extras[1],
        '   .-' + '"'.repeat(15) + '-.   ',
        '  /' + ' '.repeat(19) + '\\  ',
        ' |' + brows + '| ',
        ' |' + eyeRow(0) + '| ',
        ' |' + eyeRow(1) + '| ',
        ' |' + eyeRow(2) + '| ',
        ' |' + mouthRow + '| ',
        ' |' + ' '.repeat(21) + '| ',
        '  \\' + ' '.repeat(19) + '/  ',
        "   '-." + '_'.repeat(13) + ".-'   "
      ].join('\n');
    }

    function paint(){
      art.textContent = build();
      ['sleep', 'angry', 'uwu'].forEach(k => root.classList.toggle('face--' + k, state === k));
    }

    function set(next){
      state = next;
      tick = 0;
      paint();
    }

    function later(ms, fn){ timers.push(setTimeout(fn, ms)); }
    function clearTimers(){ timers.forEach(clearTimeout); timers = []; }

    const DURATION = { blink: 160, wink: 800, uwu: 2400, sleep: 6500, angry: 3200 };

    function play(kind){
      lastSeen[kind] = Date.now();
      set(kind);
      later(DURATION[kind], () => {
        set('idle');
        later(1400 + Math.random() * 2400, nextEvent);
      });
    }

    // blinks are the most common; winks, uwu, sleeping and angry come now and then
    function nextEvent(){
      if (!running) return;
      const now = Date.now();
      let kind;
      if (now - lastSeen.sleep > 38000) kind = 'sleep';        // make sure she sees these
      else if (now - lastSeen.angry > 48000) kind = 'angry';
      else if (now - lastSeen.wink > 15000) kind = 'wink';
      else {
        const r = Math.random();
        kind = r < 0.50 ? 'blink'
             : r < 0.72 ? 'wink'
             : r < 0.84 ? 'uwu'
             : r < 0.92 ? 'sleep'
             : 'angry';
      }
      play(kind);
    }

    // tapping the face makes it react (wake it up while it sleeps and it gets cross)
    function poke(){
      if (!running) return;
      clearTimers();
      const options = ['wink', 'uwu', 'wink', 'angry'];
      play(state === 'sleep' ? 'angry' : options[Math.floor(Math.random() * options.length)]);
    }

    function start(){
      if (running) return;
      running = true;
      lastSeen.sleep = lastSeen.angry = lastSeen.wink = Date.now();
      set('idle');
      ticker = setInterval(() => {
        tick++;
        if (state === 'sleep' || state === 'angry' || state === 'uwu') paint();
      }, 450);
      later(900, () => play('blink'));
    }

    function stop(){
      running = false;
      clearTimers();
      clearInterval(ticker);
      ticker = null;
      set('idle');
    }

    root.addEventListener('click', poke);
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        poke();
      }
    });

    paint();
    return { start, stop };
  }

  const uwuView = document.getElementById('uwu');
  const uwuViewJai = document.getElementById('uwuJai');
  const angelFace = createFace(document.getElementById('faceAngel'));
  const jaiFace = createFace(document.getElementById('faceJai'));


  // ---------- settings: add / delete letters from the website (saved to letters.json on GitHub) ----------
  (function(){
    const $ = (id) => document.getElementById(id);
    const KEY = 'cornerCfg';
    let cfg = null;
    try { cfg = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    let store = { angel: LETTERS, jai: JAI_LETTERS };

    const modal = $('settings');
    const DEFAULTS = {
      angel: { to: 'Jai,', from: '\u2014 Angel' },
      jai:   { to: 'Angel,', from: '\u2014 Jai' }
    };

    function applyStore(){
      angelCarousel.setLetters(store.angel);
      jaiCarousel.setLetters(store.jai);
    }

    // read the saved letters when the page opens
    fetch('letters.json?' + Date.now())
      .then(r => { if (!r.ok) throw 0; return r.json(); })
      .then(j => {
        store = { angel: Array.isArray(j.angel) ? j.angel : [], jai: Array.isArray(j.jai) ? j.jai : [] };
        applyStore();
        renderList();
      })
      .catch(() => {});   // no letters.json yet: keep the built-in letters

    function say(t, bad){
      const m = $('setMsg');
      m.textContent = t;
      m.className = 'settings__msg' + (bad ? ' is-bad' : '');
    }

    function fillDefaults(){
      const d = DEFAULTS[$('setSide').value];
      $('lTo').value = d.to;
      $('lFrom').value = d.from;
    }

    function renderList(){
      const list = $('setList');
      list.innerHTML = '';
      const items = store[$('setSide').value] || [];
      if (!items.length){
        const p = document.createElement('p');
        p.className = 'settings__empty';
        p.textContent = 'no letters on this side yet';
        list.appendChild(p);
        return;
      }
      items.forEach((l) => {
        const row = document.createElement('div');
        row.className = 'settings__row';
        const t = document.createElement('span');
        t.textContent = l.name || '(no title)';
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'settings__del';
        del.textContent = 'delete';
        del.addEventListener('click', () => {
          if (!confirm('Delete "' + (l.name || 'this letter') + '"?')) return;
          const side = $('setSide').value, sig = JSON.stringify(l);
          save((f) => { f[side] = f[side].filter(x => JSON.stringify(x) !== sig); return f; }, 'Deleted.');
        });
        row.append(t, del);
        list.appendChild(row);
      });
    }

    function showState(){
      $('setLogin').hidden = !!cfg;
      $('setMain').hidden = !cfg;
      if (cfg) renderList();
    }

    function open(){
      setMenu(false); setJaiMenu(false);
      $('setSide').value = world;
      fillDefaults();
      say('');
      if (!cfg && /github\.io$/.test(location.hostname)){
        if (!$('setUser').value) $('setUser').value = location.hostname.split('.')[0];
        if (!$('setRepo').value) $('setRepo').value = location.pathname.split('/')[1] || '';
      }
      showState();
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      setTimeout(() => (cfg ? $('lName') : $('setToken')).focus(), 50);
    }

    function close(){
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }

    document.querySelectorAll('[data-open-settings]').forEach(b => b.addEventListener('click', open));
    $('setClose').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    $('setSide').addEventListener('change', () => { fillDefaults(); renderList(); say(''); });

    // ----- talking to GitHub -----
    function b64(str){
      let r = '';
      new TextEncoder().encode(str).forEach(x => { r += String.fromCharCode(x); });
      return btoa(r);
    }
    function unb64(str){
      const r = atob(str.replace(/\s/g, '')), a = new Uint8Array(r.length);
      for (let i = 0; i < r.length; i++) a[i] = r.charCodeAt(i);
      return new TextDecoder().decode(a);
    }

    function save(mutate, okMsg){
      const url = 'https://api.github.com/repos/' + cfg.u + '/' + cfg.r + '/contents/letters.json';
      const H = { Authorization: 'Bearer ' + cfg.t, Accept: 'application/vnd.github+json' };
      say('saving...');
      return fetch(url, { headers: H }).then(r => {
        if (r.status === 404) return { file: { angel: store.angel.slice(), jai: store.jai.slice() }, sha: undefined };
        if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? 'wrong or expired token.' : 'GitHub error ' + r.status);
        return r.json().then(j => {
          let f = {};
          try { f = JSON.parse(unb64(j.content)); } catch (e) {}
          return { file: { angel: Array.isArray(f.angel) ? f.angel : [], jai: Array.isArray(f.jai) ? f.jai : [] }, sha: j.sha };
        });
      }).then(cur => {
        const next = mutate(cur.file);
        const body = { message: 'Update letters', content: b64(JSON.stringify(next, null, 2) + '\n') };
        if (cur.sha) body.sha = cur.sha;
        return fetch(url, { method: 'PUT', headers: H, body: JSON.stringify(body) }).then(r => {
          if (!r.ok) throw new Error('could not save (GitHub error ' + r.status + '). The token needs Contents: read and write.');
          store = next;
          applyStore();
          renderList();
          say(okMsg + ' it can take a minute to show up on other devices.');
          return true;
        });
      }).catch(e => { say(e.message, true); return false; });
    }

    $('setLoginBtn').addEventListener('click', () => {
      const u = $('setUser').value.trim(), r = $('setRepo').value.trim(), t = $('setToken').value.trim();
      const msg = $('setLoginMsg');
      if (!u || !r || !t){ msg.textContent = 'fill in all three boxes.'; return; }
      msg.textContent = 'checking...';
      fetch('https://api.github.com/repos/' + u + '/' + r, { headers: { Authorization: 'Bearer ' + t } })
        .then(x => { if (!x.ok) throw 0; return x.json(); })
        .then(j => {
          if (!j.permissions || !j.permissions.push) throw 0;
          cfg = { u: u, r: r, t: t };
          try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {}
          $('setToken').value = '';
          msg.textContent = '';
          showState();
          $('lName').focus();
        })
        .catch(() => { msg.textContent = 'login failed. check the username, repository and token.'; });
    });

    $('setOut').addEventListener('click', () => {
      cfg = null;
      try { localStorage.removeItem(KEY); } catch (e) {}
      showState();
    });

    $('lSave').addEventListener('click', () => {
      const side = $('setSide').value;
      const name = $('lName').value.trim(), text = $('lText').value.trim();
      if (!name || !text){ say('add a title and a letter.', true); return; }
      const letter = {
        name: name,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        to: $('lTo').value.trim(),
        text: text,
        from: $('lFrom').value.trim()
      };
      save((f) => { f[side].push(letter); return f; }, 'letter added.').then(ok => {
        if (!ok) return;
        $('lName').value = '';
        $('lText').value = '';
        (side === 'angel' ? angelCarousel : jaiCarousel).last();
      });
    });

    showState();
  })();
