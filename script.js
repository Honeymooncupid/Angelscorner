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
    { url: 'https://soundcloud.com/user-382783752-296073631/lana-del-rey-yes-to-heaven-long-long-time-linda-ronstadt-instrumental-super-raw-concept', title: 'Yes to Heaven', artist: 'Lana Del Rey' }
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
      text: 'Kung miss mo ko, mas miss kita tanga.',
      from: '— Angel'
    },
    {
      name: 'Open when ur sad',
      date: '',
      to: 'Jai,',
      text: 'Call mo ko dali.',
      from: '— Angel'
    },
    {
      name: 'Wala lang',
      date: '',
      to: 'Jai,',
      text: 'Sakin ka lang. haha.',
      from: '— Angel'
    },
    {
      name: 'If galit ka',
      date: '13/10/2026',
      to: 'Jai,',
      text: 'Wag ka na magalit. UwU',
      from: '— Angel'
    },
  ];

  // Jai's side (green cards)
  const JAI_LETTERS = [
    {
      name: 'open when you miss me',
      date: '',
      to: 'Angel,',
      text: 'Placeholder.' ,
      from: '— Jai'
    },
    {
      name: 'open when you need a smile',
      date: '',
      to: 'Angel,',
      text: 'Another placeholder.',
      from: '— Jai'
    },
    {
      name: 'just because',
      date: '',
      to: 'Angel,',
      text: 'One more placeholder.',
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

    goTo(0);

    return { layout, close: () => setFlipped(slideIndex, false) };
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



  // ---------- cute beeps for everything the faces do (Web Audio, no files needed) ----------
  const sfx = (function(){
    let ctx = null;
    function ensure(){
      if (!ctx){
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        try { ctx = new AC(); } catch (e) { return null; }
      }
      if (ctx.state === 'suspended') ctx.resume().catch(noop);
      return ctx;
    }
    // browsers only allow sound after a tap, so wake the audio up on the first touch
    ['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, ensure, { passive: true }));

    // one beep: freq (Hz), optionally sliding to freq2, starting `at` seconds from now
    function beep(freq, dur, o){
      o = o || {};
      const c = ctx;
      if (!c || c.state !== 'running') return;
      const t0 = c.currentTime + (o.at || 0);
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = o.type || 'square';
      osc.frequency.setValueAtTime(freq, t0);
      if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
      const v = o.vol || 0.05;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(v, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    }

    // a voice is a pitch multiplier, so Angel's beeps are a bit higher and Jai's a bit lower
    function voice(p){
      const f = (x) => x * p;
      const cute = (notes, gap, o) => notes.forEach((n, i) => beep(f(n), 0.09, Object.assign({ at: i * gap }, o)));
      const buzz = (at) => {                       // an angry little BZZT
        beep(f(190), 0.16, { type: 'sawtooth', to: f(150), vol: 0.07, at: at });
        beep(f(197), 0.16, { type: 'square',   to: f(155), vol: 0.04, at: at });
      };
      return {
        // a sung note: semitones above middle-C-ish (C5), no voice pitch so duets stay in tune
        note:   (semi, dur, wave) => beep(523.25 * Math.pow(2, semi / 12), dur, { type: wave || 'triangle', vol: 0.075 }),
        back:   (semi, dur) => beep(523.25 * Math.pow(2, semi / 12), dur, { type: 'sine', vol: 0.045 }),   // soft background note
        blink:  () => beep(f(1500), 0.035, { type: 'sine', vol: 0.035 }),
        wink:   () => cute([880, 1320], 0.09, { type: 'triangle', vol: 0.07 }),
        uwu:    () => cute([660, 880, 1100, 1320, 1760], 0.085, { type: 'triangle', vol: 0.07 }),
        heart:  () => beep(f(1568), 0.07, { type: 'sine', vol: 0.04 }),
        sleep:  (t) => beep(f(t % 2 ? 300 : 250), 0.5, { type: 'sine', to: f(t % 2 ? 230 : 200), vol: 0.05 }),
        sad:    () => cute([520, 440, 370], 0.2, { type: 'sine', vol: 0.07 }),
        drip:   () => beep(f(1900), 0.05, { type: 'sine', to: f(1400), vol: 0.03 }),
        angry:  () => { buzz(0); buzz(0.2); buzz(0.4); },
        grr:    () => buzz(0),
        kiss:   () => {
          beep(f(500), 0.12, { type: 'sine', to: f(1700), vol: 0.07 });
          cute([1320, 1760, 2093], 0.09, { type: 'triangle', vol: 0.055, at: 0.14 });
        },
        step:   (n) => beep(f(n % 2 ? 520 : 620), 0.06, { type: 'triangle', to: f(n % 2 ? 640 : 760), vol: 0.045 }),
        arrive: () => cute([784, 1046, 1318], 0.09, { type: 'triangle', vol: 0.07 }),
        bye:    () => cute([1318, 1046, 784, 1046, 1318], 0.075, { type: 'triangle', vol: 0.055 }),
        pop:    () => beep(f(300), 0.09, { type: 'sine', to: f(900), vol: 0.07 }),
        chime:  () => cute([988, 1318], 0.14, { type: 'sine', vol: 0.05 }),
        night:  () => cute([1318, 988], 0.14, { type: 'sine', vol: 0.05 })
      };
    }
    return {
      voice: (p) => {
        const v = voice(p);
        const out = {};
        Object.keys(v).forEach(k => { out[k] = function(){ if (!muted) v[k].apply(null, arguments); }; });
        return out;
      }
    };
  })();

  // ---------- UwU: a face made of symbols that blinks, winks, sleeps and gets angry ----------
  function createFace(root, pitch, friendPitch){
    const snd = sfx.voice(pitch || 1);              // this face's own beeps
    const buddySnd = sfx.voice(friendPitch || 1);   // the visitor has the other person's beeps
    const art = root.querySelector('.face__art');

    // wrap the face in a "stage" so a little visitor can walk in beside it
    const stage = document.createElement('div');
    stage.className = 'face__stage';
    root.parentNode.insertBefore(stage, root);
    stage.appendChild(root);
    const buddy = document.createElement('pre');
    buddy.className = 'buddy';
    buddy.setAttribute('aria-hidden', 'true');
    stage.appendChild(buddy);
    const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const W = 31;                         // the whole face is 31 characters wide
    const blank = ' '.repeat(W);
    const sp = (n) => ' '.repeat(n);
    const rev = (s) => s.split('').reverse().join('');

    // ---------- the world behind the face: sky, sun/moon, clouds, rain, forest ----------
    const section = root.closest('.uwu');
    const fx = document.createElement('div');
    fx.className = 'fx';
    fx.setAttribute('aria-hidden', 'true');
    fx.innerHTML = [
      '<div class="fx-sky fx-sky--dawn"></div>',
      '<div class="fx-sky fx-sky--sunset"></div>',
      '<div class="fx-sky fx-sky--night"></div>',
      '<div class="fx-stars"></div>',
      '<pre class="fx-orb"></pre>',
      '<div class="fx-clouds"></div>',
      '<div class="fx-sky fx-sky--storm"></div>',
      '<div class="fx-forest fx-forest--far"><pre></pre></div>',
      '<div class="fx-ground"><pre></pre></div>',
      '<div class="fx-forest fx-forest--near"><pre></pre></div>',
      '<div class="fx-story"><pre class="st st-sea"></pre><pre class="st st-post"></pre><pre class="st st-ship"></pre><pre class="st st-wind"></pre><pre class="st st-bird"></pre><i class="st st-seed">●</i><pre class="st st-sprout"></pre><div class="st st-q"></div><div class="st st-glow"></div><div class="st st-hearts"></div></div>',
      '<div class="fx-rain"></div>'
    ].join('');
    section.insertBefore(fx, section.firstChild);

    const rnd = (a, b) => a + Math.random() * (b - a);

    // pine trees made of block symbols: 3 tiers of triangle + a trunk
    function pineRows(tiers){
      const rows = [];
      for (let k = 0; k < tiers; k++){
        for (let r = 0; r < 3; r++){
          const w = 1 + 2 * r + 2 * k;
          rows.push(w === 1 ? '▄' : '█'.repeat(w));
        }
      }
      rows.push('█', '█');
      return rows;
    }
    // one seamless tile of forest: trees = [[centre column, tiers], ...]
    function forestTile(TW, H, trees){
      const grid = Array.from({ length: H }, () => Array(TW).fill(' '));
      trees.forEach(([c, tiers]) => {
        const rows = pineRows(tiers);
        rows.forEach((row, i) => {
          const y = H - rows.length + i;
          const x0 = c - (row.length - 1) / 2;
          for (let j = 0; j < row.length; j++) grid[y][x0 + j] = row[j];
        });
      });
      return grid.map(r => r.join(''));
    }
    const tileText = (rows, n) => rows.map(r => r.repeat(n)).join('\n');

    const farPre = fx.querySelector('.fx-forest--far pre');
    farPre.textContent = tileText(forestTile(40, 12, [[5, 2], [15, 3], [27, 2], [35, 3]]), 8);
    farPre.style.setProperty('--tw', 40);
    const nearPre = fx.querySelector('.fx-forest--near pre');
    nearPre.textContent = tileText(forestTile(48, 18, [[7, 4], [22, 5], [38, 3]]), 6);
    nearPre.style.setProperty('--tw', 48);

    // the ground: a row of little flowers, grass on top, then soft earth made of shade blocks
    const GW = 16;
    const groundRows = ['    ✿       *   ', '▄▀▄▄▀▄▄▀▄▀▄▄▀▄▄▀', '▓▒▓▓▒▓▓▒▓▒▓▓▒▓▓▒', '▒░▒▒░▒▒░▒░▒▒░▒▒░'];
    const EARTH = '▓▒▓▓▒▓▓▒▓▒▓▓▒▓▓▒';
    while (groundRows.length < 40) groundRows.push(groundRows.length % 2 ? EARTH : EARTH.slice(5) + EARTH.slice(0, 5));
    const groundPre = fx.querySelector('.fx-ground pre');
    groundPre.innerHTML = groundRows.map((r, i) => {
      const row = r.repeat(12);
      if (i === 0) return row.replace(/✿/g, '<span class="fx-flower">✿</span>').replace(/\*/g, '<span class="fx-daisy">*</span>');
      if (i === 1) return '<span class="fx-grass">' + row + '</span>';
      return row;
    }).join('\n');
    groundPre.style.setProperty('--tw', GW);

    // clouds, sun and moon drawn with block symbols too
    const CLOUDS = [
      ['    ▄██▄    ', '  ▄██████▄▄ ', '▄██████████▄', '▀▀▀▀▀▀▀▀▀▀▀▀'].join('\n'),
      ['   ▄▄██▄▄   ', '▄▄████████▄▄', '▀▀▀▀▀▀▀▀▀▀▀▀'].join('\n')
    ];
    const SUN = [' \\  |  / ', '  ▄███▄  ', ' ─█████─ ', '  ▀███▀  ', ' /  |  \\ '].join('\n');
    const MOON = ['  ▄██▄ ', ' ██▀   ', '██     ', ' ██▄   ', '  ▀██▀ '].join('\n');
    const orb = fx.querySelector('.fx-orb');
    let orbArt = '';

    const starsBox = fx.querySelector('.fx-stars');
    const STARS = ['✦', '·', '*', '+', '✦'];
    for (let i = 0; i < 44; i++){
      const st = document.createElement('span');
      st.textContent = STARS[Math.floor(Math.random() * STARS.length)];
      st.style.left = rnd(0, 100) + '%';
      st.style.top = rnd(0, 55) + '%';
      st.style.fontSize = rnd(9, 16).toFixed(0) + 'px';
      st.style.animationDelay = (-rnd(0, 3)).toFixed(2) + 's';
      starsBox.appendChild(st);
    }
    const cloudsBox = fx.querySelector('.fx-clouds');
    for (let i = 0; i < 5; i++){
      const c = document.createElement('pre');
      const dur = rnd(55, 105);
      c.className = 'fx-cloud';
      c.textContent = CLOUDS[i % CLOUDS.length];
      c.style.fontSize = rnd(0.9, 1.7).toFixed(2) + 'em';
      c.style.top = rnd(3, 34).toFixed(0) + '%';
      c.style.animationDuration = dur.toFixed(0) + 's';
      c.style.animationDelay = (-rnd(0, dur)).toFixed(1) + 's';
      cloudsBox.appendChild(c);
    }
    const rainBox = fx.querySelector('.fx-rain');
    const DROPS = ['¦', '╎', '╷', '¦', '\''];
    for (let i = 0; i < 70; i++){
      const d = document.createElement('i');
      d.textContent = DROPS[Math.floor(Math.random() * DROPS.length)];
      d.style.left = rnd(0, 100).toFixed(1) + '%';
      d.style.fontSize = rnd(12, 20).toFixed(0) + 'px';
      d.style.opacity = rnd(0.4, 0.85).toFixed(2);
      d.style.animationDuration = rnd(0.55, 1.05).toFixed(2) + 's';
      d.style.animationDelay = (-rnd(0, 1.1)).toFixed(2) + 's';
      rainBox.appendChild(d);
    }

    // the story layer: pictures for what the song is singing about
    const story = fx.querySelector('.fx-story');
    const q = (c) => story.querySelector('.' + c);
    const WAVE = ['~≈~~≈~~≈~≈~~≈~', '≈~~≈~≈~~≈~~≈~'];
    q('st-sea').textContent = WAVE.map(r => r.repeat(40)).concat(WAVE.map(r => r.repeat(40)).reverse()).join('\n');
    q('st-sea').style.setProperty('--tw', WAVE[0].length);
    q('st-post').textContent = ' ▄█▄\n  █\n  █\n  █';
    q('st-ship').textContent = '     |◣\n     |█◣\n ▄▄▄▄▄█▄▄▄▄▄▄\n  ▀████████▀';
    q('st-wind').textContent = '~~~~~~    ≈≈≈≈≈≈≈       ~~~~~\n\n    ≈≈≈≈≈    ~~~~~~~~\n\n~~~~    ≈≈≈≈≈≈      ≈≈≈';
    q('st-bird').textContent = '\\v/';
    q('st-sprout').textContent = '  ▲\n ▲█▲\n▲███▲\n  █';
    for (let i = 0; i < 4; i++){ const e = document.createElement('i'); e.textContent = i % 2 ? '✦' : '?'; e.style.left = (14 + i * 22) + '%'; e.style.animationDelay = (-i * 1.3) + 's'; q('st-q').appendChild(e); }
    for (let i = 0; i < 16; i++){ const e = document.createElement('i'); e.textContent = ['♥', '♡', '✦'][i % 3]; e.style.left = rnd(4, 94).toFixed(0) + '%'; e.style.fontSize = rnd(14, 28).toFixed(0) + 'px'; e.style.animationDuration = rnd(4, 7).toFixed(1) + 's'; e.style.animationDelay = (-rnd(0, 7)).toFixed(1) + 's'; q('st-hearts').appendChild(e); }

    // what the world looks like right now
    const TIMES = ['day', 'sunset', 'night', 'dawn'];
    const scn = { time: 'day', weather: 'clear', env: 'meadow', walking: false, dir: 1, story: '' };
    function applyScene(){
      TIMES.forEach(t => section.classList.toggle('t-' + t, scn.time === t));
      ['clear', 'cloudy', 'rain'].forEach(w => section.classList.toggle('w-' + w, scn.weather === w));
      section.classList.toggle('e-forest', scn.env === 'forest');
      section.classList.toggle('e-field', scn.env === 'field');
      ['sea', 'bird', 'wood', 'who', 'good'].forEach(s => section.classList.toggle('s-' + s, scn.story === s));
      section.classList.toggle('s-on', !!scn.story);
      section.classList.toggle('e-walking', scn.walking);
      section.classList.toggle('walk-l', scn.dir === -1);
      const art = scn.time === 'night' ? MOON : SUN;      // sun by day, moon at night
      if (art !== orbArt){ orbArt = art; orb.textContent = art; }
    }
    applyScene();

    // the ground line sits right under the face's feet
    function placeGround(){
      const a = fx.getBoundingClientRect();
      const b = stage.getBoundingClientRect();
      if (!a.height) return;
      fx.style.setProperty('--ground', Math.round(b.bottom - a.top + 2) + 'px');
    }
    window.addEventListener('resize', placeGround);

    // little feet that only appear when the face stands outside with the visitor
    const fs = { legs: 'none' };
    const FSTAND = sp(6) + '▄█▄' + sp(13) + '▄█▄' + sp(6);
    const FWALK = [
      sp(5) + '▄█▄' + sp(15) + '▄█▄' + sp(5),
      sp(7) + '▄█▄' + sp(11) + '▄█▄' + sp(7)
    ];
    function faceLegs(){
      if (fs.legs === 'walk') return FWALK[bs.n % 2];
      if (fs.legs === 'stand') return FSTAND;
      return blank;
    }

    // drop little bits of text at given columns on an empty row
    function place(items){
      const a = blank.split('');
      items.forEach(([col, s]) => {
        for (let i = 0; i < s.length; i++) a[col + i] = s[i];
      });
      return a.join('');
    }

    // every eye is 5 characters wide and 3 rows tall (░ = the shiny sparkle in the eye)
    const EYES = {
      open:  ['▄███▄', '█░███', '▀███▀'],
      small: ['     ', '▄███▄', '▀███▀'],      // flat-topped angry eyes
      shut:  ['     ', '▄▄▄▄▄', '     '],
      arch:  [' ▄█▄ ', '█▀ ▀█', '     ']       // happy ^ ^ eyes (and the winking eye)
    };

    const MOUTH = {
      cat:   '▀▄▀▄▀',                           // little "w" cat mouth
      sleepA:'  ▄  ',
      sleepB:'  █  ',
      grr:   '▄▀▀▀▄',
      sad:   ' ▄▀▄ ',
      sing:  [' ▄█▄ ', ' ▀▄▀ ']             // open singing mouth, wobbles
    };

    const NOTHING = () => [blank, blank];

    // each state says which eyes, cheeks and mouth to draw, plus little floating extras
    const STATES = {
      idle:  { l: 'open',  r: 'open',  cheek: '▒▒▒▒', mouth: () => MOUTH.cat, extras: NOTHING },
      blink: { l: 'shut',  r: 'shut',  cheek: '▒▒▒▒', mouth: () => MOUTH.cat, extras: NOTHING },
      wink:  { l: 'open',  r: 'arch',  cheek: '▒▒▒▒', mouth: () => MOUTH.cat,
               extras: (t) => [blank, place([[t % 2 ? 27 : 28, '✦']])] },
      uwu:   { l: 'arch',  r: 'arch',  cheek: '▒▒▒▒', mouth: () => MOUTH.cat,
               extras: (t) => t % 2
                 ? [place([[3, '♥'], [27, '♥'], [14, '✦']]), place([[0, '✦'], [30, '✦']])]
                 : [place([[5, '♥'], [25, '♥'], [16, '✦']]), place([[1, '♥'], [29, '♥']])] },
      sleep: { l: 'shut',  r: 'shut',  cheek: '    ',
               mouth: (t) => (t % 2 ? MOUTH.sleepA : MOUTH.sleepB),
               extras: (t) => [
                 [blank, place([[26, 'z']])],
                 [place([[28, 'Z']]), place([[26, 'z']])],
                 [place([[27, 'z'], [29, 'Z']]), blank]
               ][t % 3] },
      angry: { l: 'small', r: 'small', brows: true, cheek: '▓▓▓▓', mouth: () => MOUTH.grr,
               extras: (t) => t % 2
                 ? [place([[2, '#'], [28, '#']]), place([[3, '!'], [27, '!']])]
                 : [place([[3, '#'], [27, '#']]), place([[2, '!'], [28, '!']])] }
    };

    // singing: happy eyes, open mouth and music notes floating up
    STATES.sing = { l: 'arch', r: 'arch', cheek: '▒▒▒▒', mouth: (t) => MOUTH.sing[t % 2],
      extras: (t) => t % 2
        ? [place([[4, '♪'], [26, '♫']]), place([[1, '♫'], [29, '♪']])]
        : [place([[2, '♫'], [28, '♪']]), place([[5, '♪'], [25, '♫']])] };

    // a little sad in the rain: round eyes, no blush, tiny frown and drips
    STATES.sad = { l: 'open', r: 'open', cheek: '    ', mouth: () => MOUTH.sad,
      extras: (t) => t % 2
        ? [place([[3, '.'], [27, '.']]), place([[2, ','], [28, ',']])]
        : [place([[2, ','], [28, ',']]), place([[3, '.'], [27, '.']])] };

    // the face after it gets kissed: happy eyes, hearts, and a deeper blush on the kissed cheek
    let kissSide = 1;                       // 1 = visitor on the right, -1 = on the left
    STATES.kissed = Object.assign({}, STATES.uwu, {
      cheekL: () => (kissSide === -1 ? '▓▓▓▓' : '▒▒▒▒'),
      cheekR: () => (kissSide === 1 ? '▓▓▓▓' : '▒▒▒▒')
    });

    let state = 'idle';
    let tick = 0;
    let running = false;
    let timers = [];
    let ticker = null;
    const lastSeen = { sleep: 0, angry: 0, wink: 0, sad: 0 };

    // thick outline: kitty ears + a chunky rounded head, all drawn with block symbols
    const EAR0 = '   ▄█▄';
    const EAR1 = '  ▄███▄';
    const EARS = [
      EAR0 + sp(W - 2 * EAR0.length) + rev(EAR0),
      EAR1 + sp(W - 2 * EAR1.length) + rev(EAR1)
    ];
    const wall = (inner) => '██' + inner + '██';
    const INNER = W - 4;                    // 27 characters inside the walls

    function build(){
      const s = STATES[state];
      const L = EYES[s.l];
      const R = EYES[s.r];
      const eyeRow = (i) => sp(5) + L[i] + sp(7) + R[i] + sp(5);
      const brows = s.brows
        ? sp(5) + '▀▀▀▄▄' + sp(7) + '▄▄▀▀▀' + sp(5)
        : sp(INNER);
      const cl = s.cheekL ? s.cheekL() : s.cheek;
      const cr = s.cheekR ? s.cheekR() : s.cheek;
      const mouthRow = sp(2) + cl + sp(5) + s.mouth(tick) + sp(5) + cr + sp(2);
      const extras = s.extras(tick);
      return [
        extras[0],
        extras[1],
        EARS[0],
        EARS[1],
        sp(3) + '▄'.repeat(W - 6) + sp(3),
        ' ▄' + '█'.repeat(W - 4) + '▄ ',
        wall(sp(INNER)),
        wall(brows),
        wall(eyeRow(0)),
        wall(eyeRow(1)),
        wall(eyeRow(2)),
        wall(sp(INNER)),
        wall(mouthRow),
        wall(sp(INNER)),
        ' ▀' + '█'.repeat(W - 4) + '▀ ',
        sp(3) + '▀'.repeat(W - 6) + sp(3),
        faceLegs()
      ].join('\n');
    }

    // colour the little parts: blush, eye sparkles and floating hearts/stars
    function colourise(text){
      return text
        .replace(/[▒▓]+/g, (m) => '<span class="fx-blush">' + m + '</span>')
        .replace(/░+/g,    (m) => '<span class="fx-shine">' + m + '</span>')
        .replace(/[♥✦♪♫]+/g, (m) => '<span class="fx-sparkle">' + m + '</span>');
    }


    // ---------- a bouncy visitor, almost as big as the face, who comes to give it a kiss ----------
    const BW = 27;                          // the visitor is 27 characters wide (the face is 31)
    const BINNER = BW - 4;
    const EXT = 18;                         // an umbrella is wider than the visitor: it sticks out toward the face
    const CW = BW + EXT;
    const LEGS = [
      sp(5) + '▄█▄' + sp(9) + '▄█▄' + sp(7),
      sp(7) + '▄█▄' + sp(9) + '▄█▄' + sp(5)
    ];
    const STAND = sp(7) + '▄█▄' + sp(7) + '▄█▄' + sp(7);
    const bs = { mood: 'walk', n: 0, dir: 1, umbrella: false };
    let visiting = false;
    let singing = false;                    // while true the song owns the speakers
    let vTimers = [];
    let vTicker = null;
    let nextVisitAt = 0;
    let nextShiftAt = 0;
    let visitRain = false;

    function buddyBuild(){
      const sing = bs.mood === 'sing';
      const kiss = bs.mood === 'kiss' || sing;   // singing uses the same happy ^ ^ eyes
      const none = sp(BW);
      const put = (items) => {
        const a = none.split('');
        items.forEach(([col, s]) => { for (let i = 0; i < s.length; i++) a[col + i] = s[i]; });
        return a.join('');
      };
      const L = kiss ? EYES.arch : EYES.open;
      const eyeRow = (i) => sp(3) + L[i] + sp(7) + L[i] + sp(3);
      const mouth = sing ? MOUTH.sing[bs.n % 2] : kiss ? MOUTH.sleepA : MOUTH.cat;
      const cheek = kiss ? '▓▓▓▓' : '▒▒▒▒';
      const mouthRow = sp(2) + cheek + sp(3) + mouth + sp(3) + cheek + sp(2);
      const top = sing
        ? [
            [put([[8, '♪'], [18, '♫']]), put([[12, '♫']])],
            [put([[10, '♫'], [16, '♪']]), put([[7, '♪'], [19, '♫']])]
          ][bs.n % 2]
        : kiss
        ? [
            [none, put([[13, '♥']])],
            [put([[13, '♥']]), put([[9, '♥'], [17, '♥']])],
            [put([[9, '♥'], [17, '♥']]), none]
          ][Math.floor(bs.n / 2) % 3]
        : [none, none];
      const e0 = '   ▄█▄', e1 = '  ▄███▄';
      const rows = [
        top[0],
        top[1],
        e0 + sp(BW - 2 * e0.length) + rev(e0),
        e1 + sp(BW - 2 * e1.length) + rev(e1),
        sp(3) + '▄'.repeat(BW - 6) + sp(3),
        ' ▄' + '█'.repeat(BW - 4) + '▄ ',
        wall(sp(BINNER)),
        wall(eyeRow(0)),
        wall(eyeRow(1)),
        wall(eyeRow(2)),
        wall(sp(BINNER)),
        wall(mouthRow),
        ' ▀' + '█'.repeat(BW - 4) + '▀ ',
        sp(3) + '▀'.repeat(BW - 6) + sp(3),
        bs.mood === 'walk' ? LEGS[bs.n % 2] : STAND
      ];
      if (!bs.umbrella) return rows.join('\n');
      const bodyCol = bs.dir === 1 ? EXT : 0;
      const padded = rows.map(r => sp(bodyCol) + r + sp(CW - bodyCol - BW));
      const pole = bodyCol + 13;
      const umb = (t) => '<span class="fx-umb">' + t + '</span>';
      const poleRow = sp(pole) + umb('█') + sp(CW - pole - 1);
      return [
        umb(sp(6) + '▄'.repeat(CW - 12) + sp(6)),
        umb(sp(2) + '█'.repeat(CW - 4) + sp(2)),
        umb('▀▄'.repeat(CW).slice(0, CW)),
        poleRow,
        poleRow
      ].concat(padded).join('\n');
    }

    function buddyPaint(){ buddy.innerHTML = colourise(buddyBuild()); }
    function vlater(ms, fn){ vTimers.push(setTimeout(fn, ms)); }

    function bounce(kind){                  // 'run' = big happy bounces, 'kiss' = little bounces
      buddy.classList.toggle('buddy--bounce', kind === 'run');
      buddy.classList.toggle('buddy--kiss', kind === 'kiss');
    }

    // ---------- original sunny, sing-along-style music-box tune ----------
    // Bright major-key chords and a lilting folk-pop rhythm evoke a warm sunshine song,
    // without transcribing the released melody. Both characters sing and move as a duet.
    const BEAT = 480;
    const TRANSPOSE = 0;
    // plain letters + octave number. ':2' = hold for two beats.
    // Both sing each phrase and share the same dance move for a synchronized duet.
    const SONG = [
      { chords: [['C3','G3','E4']], who: 'both', scene: 'good', dance: ['sway', 'sway'],   notes: 'E4 G4 C5:2 B4 G4:2' },
      { chords: [['F2','C3','A3']], who: 'both', scene: 'good', dance: ['hop', 'hop'],     notes: 'F4 A4 C5:2 A4 G4 F4:2' },
      { chords: [['C3','G3','E4']], who: 'both', scene: 'good', dance: ['sway', 'sway'],   notes: 'E4 G4 C5:2 D5 C5 G4:2' },
      { chords: [['G2','D3','B3']], who: 'both', scene: 'good', dance: ['twirl', 'twirl'], notes: 'D5 B4 G4:2 A4 G4 D4:2' },
      { chords: [['C3','G3','E4']], who: 'both', scene: 'good', dance: ['hop', 'hop'],     notes: 'E4 G4 C5:2 G4 E4 C4:4' }
    ];
    // 'C#4' -> semitones above C5; then parse the 'name:beats' strings
    const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    function noteToSemi(name){
      const m = /^([A-G])([#b]?)(\d)$/.exec(name);
      return PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12 * (Number(m[3]) - 5);
    }
    const MAJOR = [0, 2, 4, 5, 7, 9, 11];
    function thirdBelow(semi){                 // a harmony note two steps down the C major scale
      const oct = Math.floor(semi / 12), pc = ((semi % 12) + 12) % 12;
      let i = MAJOR.indexOf(pc);
      if (i < 0) return semi - 4;
      i -= 2;
      return i >= 0 ? oct * 12 + MAJOR[i] : (oct - 1) * 12 + MAJOR[i + 7];
    }
    SONG.forEach(p => {
      p.notes = p.notes.split(/\s+/).reduce((out, tok) => {
        const [names, hold] = tok.split(':');
        const subs = names.split('/');
        subs.forEach((n, i) => out.push([noteToSemi(n), i < subs.length - 1 ? 0.5 : (hold ? parseFloat(hold) : 1)]));
        return out;
      }, []);
    });
    const SONG_MS = SONG.reduce((a, p) => a + p.notes.reduce((b, n) => b + n[1], 0), 0) * BEAT;

    // ---------- dancing: each of them can sway, hop or twirl, or just stand still ----------
    const DANCES = ['sway', 'hop', 'twirl'];
    function danceTo(faceMove, buddyMove){
      DANCES.forEach(m => {
        art.classList.toggle('dance-' + m, faceMove === m && !reduceMotion);
        buddy.classList.toggle('dance-' + m, buddyMove === m && !reduceMotion);
      });
      // while the visitor dances it doesn't also do its kissing bounce
      buddy.classList.toggle('buddy--kiss', false);
      buddy.classList.toggle('buddy--bounce', false);
    }
    function stopDance(){
      DANCES.forEach(m => { art.classList.remove('dance-' + m); buddy.classList.remove('dance-' + m); });
    }

    function singSong(){
      singing = true;
      let at = 0;
      SONG.forEach(part => {
        const start = at;
        vlater(start, () => {                                   // who is singing this phrase
          const faceSings = part.who !== 'buddy';
          const buddySings = part.who !== 'face';
          scn.story = part.scene;                                // the background shows what's being sung
          scn.env = part.scene === 'wood' ? 'forest' : 'meadow';
          applyScene();
          set(faceSings ? 'sing' : 'uwu');
          if (part.dance) danceTo(part.dance[0], part.dance[1]);
          bs.mood = buddySings ? 'sing' : 'stand';
          buddyPaint();
        });
        part.notes.forEach(([semi, beats]) => {
          vlater(at, () => {
            const d = beats * BEAT / 1000 * 0.9;
            if (part.who === 'face') snd.note(semi + TRANSPOSE, d, 'triangle');
            else if (part.who === 'buddy') buddySnd.note(semi + TRANSPOSE, d, 'square');
            else { snd.note(semi + TRANSPOSE, d, 'triangle'); buddySnd.note(thirdBelow(semi) + TRANSPOSE, d, 'square'); }  // a third below
          });
          at += beats * BEAT;
        });
        const len = at - start;
        part.chords.forEach((ch, ci) => {               // the background notes under this phrase
          const s0 = start + len * ci / part.chords.length, span = len / part.chords.length;
          const semis = ch.map(n => noteToSemi(n) + TRANSPOSE);
          vlater(s0, () => snd.back(semis[0], span / 1000 * 0.95));
          for (let k = 1; k * BEAT < span; k++) vlater(s0 + k * BEAT, () => snd.back(semis[[0, 1, 2, 1][k % 4]], 0.5));
        });
      });
    }

    function tellVisit(on){ root.dispatchEvent(new CustomEvent('visit', { detail: on })); }

    function endVisit(){
      visiting = false;
      singing = false;
      tellVisit(false);
      vTimers.forEach(clearTimeout);
      vTimers = [];
      clearInterval(vTicker);
      vTicker = null;
      buddy.classList.remove('on', 'buddy--bounce', 'buddy--kiss');
      stopDance();
      buddy.style.transition = 'none';
      stage.style.transform = '';
      stage.classList.remove('face__stage--visit', 'face__stage--stroll');
      bs.umbrella = false;
      fs.legs = 'none';
      scn.env = 'meadow';
      scn.story = '';
      scn.walking = false;
      if (visitRain){ scn.weather = 'clear'; visitRain = false; }
      applyScene();
      paint();
    }

    function scheduleNextVisit(){
      nextVisitAt = Date.now() + 20000 + Math.random() * 16000;
    }

    function scheduleNextShift(){
      nextShiftAt = Date.now() + 20000 + Math.random() * 16000;
    }

    // every now and then the world changes by itself: time moves on, clouds come and go, it rains
    function shiftScene(){
      if (visiting) return;
      if (Math.random() < 0.5){
        scn.time = TIMES[(TIMES.indexOf(scn.time) + 1) % TIMES.length];
      } else if (scn.weather === 'clear'){
        scn.weather = 'cloudy';
      } else if (scn.weather === 'cloudy'){
        scn.weather = Math.random() < 0.55 ? 'rain' : 'clear';
      } else {
        scn.weather = 'cloudy';
      }
      applyScene();
      if (scn.time === 'night') snd.night(); else snd.chime();
      scheduleNextShift();
    }

    // which visit comes next: if it's already raining the visitor brings an umbrella
    function pickVisit(){
      if (scn.weather === 'rain') return 'umbrella';
      const r = Math.random();
      return r < 0.4 ? 'forest' : r < 0.72 ? 'umbrella' : 'kiss';
    }

    // kind: 'kiss' (just the kiss), 'forest' (the world turns into a forest and they walk together),
    //       'umbrella' (it clouds over and rains, the face is sad, the visitor shows up with an umbrella)
    function startVisit(kind){
      if (!running || visiting) return;
      visiting = true;
      tellVisit(true);
      clearTimers();
      set('idle');

      const forest = kind === 'forest';
      const umbrella = kind === 'umbrella';
      const dir = Math.random() < 0.5 ? 1 : -1;      // which side the visitor comes from
      kissSide = dir;
      scn.dir = dir;
      bs.dir = dir;
      bs.umbrella = umbrella;
      const song = kind === 'song';
      fs.legs = (forest || umbrella || song) ? 'stand' : 'none';

      // first the world changes, then the visitor shows up
      let pre = 0;
      if (forest){
        scn.env = 'forest';
        pre = 2400;
      } else if (umbrella){
        scn.env = 'field';
        if (scn.weather === 'rain'){
          set('sad');
          pre = 1800;
        } else {
          scn.weather = 'cloudy';
          vlater(3600, () => { scn.weather = 'rain'; applyScene(); snd.drip(); set('sad'); });
          pre = 7200;
        }
        visitRain = true;
      }
      placeGround();
      applyScene();
      paint();

      const chPx = art.getBoundingClientRect().width / W || 8;
      const sr = stage.getBoundingClientRect();
      const shift = BW / 2;                          // the face slides over so the pair ends up centred
      const lead = umbrella ? EXT : 0;               // the umbrella arrives first, so it must start off-screen too
      const startBody = (dir === 1
        ? (window.innerWidth - sr.left) / chPx + shift + 2
        : -(sr.left / chPx) - BW - shift - 2) + dir * lead;
      const kissX = dir === 1 ? W : -BW;             // standing right beside the face
      const off = (umbrella && dir === 1) ? EXT : 0; // canopy sticks out on the face's side
      const walkMs = Math.min(8000, Math.max(2200, Math.abs(startBody - kissX) * 75));

      if (forest) snd.chime();
      if (umbrella && scn.weather !== 'rain') snd.drip();
      const walkIn = () => {
        if (umbrella) buddySnd.pop();                // the umbrella pops open
        bs.mood = 'walk';
        bs.n = 0;
        stage.classList.add('face__stage--visit');
        buddy.style.transition = 'none';
        buddy.style.left = (startBody - off) + 'ch';
        buddyPaint();
        buddy.classList.add('on');
        bounce('run');
        void buddy.offsetWidth;                      // let the start position settle
        stage.style.transform = 'translateX(' + (-dir * shift) + 'ch)';
        buddy.style.transition = 'left ' + walkMs + 'ms linear';
        buddy.style.left = (kissX - off) + 'ch';
        vTicker = setInterval(() => {
          bs.n++;
          if (bs.mood === 'walk') buddySnd.step(bs.n);
          buddyPaint();
          if (fs.legs === 'walk') paint();           // the face's feet walk too
        }, 220);
      };

      let t = pre;
      vlater(t, walkIn);
      t += walkMs;
      vlater(t, () => { bs.mood = 'stand'; buddySnd.arrive(); });       // arrive and bounce in place
      t += 500;

      if (forest){                                   // they stroll through the forest together
        vlater(t, () => {
          bs.mood = 'walk';
          fs.legs = 'walk';
          scn.walking = true;
          applyScene();
          snd.chime();
          bounce('');
          stage.classList.add('face__stage--stroll');
        });
        vlater(t + 3500, () => set('uwu'));
        vlater(t + 5900, () => set('idle'));
        t += 9500;
        vlater(t, () => {
          bs.mood = 'stand';
          fs.legs = 'stand';
          scn.walking = false;
          applyScene();
          stage.classList.remove('face__stage--stroll');
          paint();
        });
        t += 700;
      }

      if (song){                                     // they sing together first, then the kiss
        vlater(t, () => { bounce('kiss'); singSong(); });
        t += SONG_MS + 700;
      }

      vlater(t, () => { singing = false; stopDance(); bs.mood = 'kiss'; bounce('kiss'); set('kissed'); });
      // after the kiss it bounces happily back home while the face winks goodbye
      const leaveAt = t + 3200;
      vlater(leaveAt, () => { bs.mood = 'walk'; bounce('run'); buddySnd.bye(); });
      vlater(leaveAt + 100, () => {
        stage.style.transform = '';
        buddy.style.transition = 'left ' + walkMs + 'ms linear';
        buddy.style.left = (startBody - off) + 'ch';
        if (umbrella){ scn.weather = 'cloudy'; applyScene(); }
      });
      if (umbrella){
        vlater(leaveAt + 100 + Math.min(4000, walkMs * 0.6), () => {
          scn.weather = 'clear';
          visitRain = false;
          applyScene();
        });
      }
      vlater(leaveAt + 600, () => set('wink'));
      vlater(leaveAt + 1400, () => set('idle'));
      vlater(leaveAt + 100 + walkMs + 100, () => {
        endVisit();
        scheduleNextVisit();
        later(1200 + Math.random() * 1500, nextEvent);
      });
    }

    function paint(){
      art.innerHTML = colourise(build());
      ['sleep', 'angry', 'sad'].forEach(k => root.classList.toggle('face--' + k, state === k));
      root.classList.toggle('face--uwu', state === 'uwu' || state === 'kissed' || state === 'sing');
    }

    // which beep goes with which mood
    function stateSound(next){
      if (!running || singing) return;
      if (next === 'blink') snd.blink();
      else if (next === 'wink') snd.wink();
      else if (next === 'uwu') snd.uwu();
      else if (next === 'sleep') snd.sleep(1);
      else if (next === 'angry') snd.angry();
      else if (next === 'sad') snd.sad();
      else if (next === 'kissed') snd.kiss();
    }

    function set(next){
      const changed = next !== state;
      state = next;
      tick = 0;
      paint();
      if (changed || next === 'blink') stateSound(next);
    }

    function later(ms, fn){ timers.push(setTimeout(fn, ms)); }
    function clearTimers(){ timers.forEach(clearTimeout); timers = []; }

    const DURATION = { blink: 160, wink: 800, uwu: 2400, sleep: 6500, angry: 3200, sad: 3600 };

    function play(kind){
      lastSeen[kind] = Date.now();
      set(kind);
      later(DURATION[kind], () => {
        set('idle');
        later(1400 + Math.random() * 2400, nextEvent);
      });
    }

    // blinks are the most common; winks, uwu, sleeping and angry come now and then
    // (it sleeps more at night, and gets sad when it rains)
    function nextEvent(){
      if (!running) return;
      const now = Date.now();
      if (!reduceMotion && now >= nextVisitAt){ startVisit(pickVisit()); return; }
      if (!reduceMotion && now >= nextShiftAt) shiftScene();
      let kind;
      if (scn.time === 'night' && now - lastSeen.sleep > 16000) kind = 'sleep';
      else if (scn.weather === 'rain' && now - lastSeen.sad > 11000) kind = 'sad';
      else if (now - lastSeen.sleep > 38000) kind = 'sleep';        // make sure she sees these
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
      if (!running || visiting) return;
      clearTimers();
      const options = ['wink', 'uwu', 'wink', 'angry'];
      play(state === 'sleep' ? 'angry' : options[Math.floor(Math.random() * options.length)]);
    }

    function start(){
      if (running) return;
      running = true;
      lastSeen.sleep = lastSeen.angry = lastSeen.wink = lastSeen.sad = Date.now();
      nextVisitAt = Date.now() + 9000 + Math.random() * 4000;    // first visit comes soon
      nextShiftAt = Date.now() + 16000 + Math.random() * 8000;   // first change of weather / time
      applyScene();
      placeGround();
      setTimeout(placeGround, 900);
      set('idle');
      ticker = setInterval(() => {
        tick++;
        if (running && !singing){
          if (state === 'sleep' && tick % 3 === 0) snd.sleep(tick / 3);
          else if (state === 'angry') snd.grr();
          else if (state === 'sad' && tick % 2 === 0) snd.drip();
          else if ((state === 'uwu' || state === 'kissed') && tick % 2 === 0) snd.heart();
        }
        if (state === 'sleep' || state === 'angry' || state === 'uwu' || state === 'kissed' || state === 'sad' || state === 'sing') paint();
      }, 450);
      later(900, () => play('blink'));
    }

    function stop(){
      running = false;
      endVisit();
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
    // the music box button: the visitor comes and they sing
    function sing(){
      if (!running || visiting) return false;
      startVisit('song');
      return true;
    }

    return { start, stop, sing };
  }

  const uwuView = document.getElementById('uwu');
  const uwuViewJai = document.getElementById('uwuJai');
  const angelFace = createFace(document.getElementById('faceAngel'), 1.15, 0.85);
  const jaiFace = createFace(document.getElementById('faceJai'), 0.85, 1.15);

  // ---------- music box buttons (one per corner): tap and the visitor comes to sing ----------
  [[uwuView, angelFace, document.getElementById('faceAngel')],
   [uwuViewJai, jaiFace, document.getElementById('faceJai')]].forEach(([section, face, faceEl]) => {
    const b = section.querySelector('.musicbox');
    if (!b) return;
    b.addEventListener('click', () => {
      // The music box runs its own synthesized tune and dance, independently of the music player.
      face.sing();
    });
    faceEl.addEventListener('visit', (e) => {          // can't start a second song while one is playing
      b.disabled = !!e.detail;
      b.classList.toggle('musicbox--busy', !!e.detail);
    });
  });
