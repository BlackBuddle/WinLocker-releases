/* WinLocker 소개 페이지 모션.
   외부 라이브러리 없이 요소의 클래스만 바꾸고, 실제 움직임은 CSS 전환(transform·opacity 위주)이 맡는다.
   - 장면은 화면에 들어올 때만 돌고, 벗어나면 멈춰서 HTML에 적힌 처음 상태(최종 장면)로 돌아간다.
   - prefers-reduced-motion이면 아예 돌리지 않는다. 첫 화면의 폰 버튼은 누르면 곧바로 바뀐다. */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduced() { return !!(motionQuery && motionQuery.matches); }

  function $(root, sel) { return root.querySelector(sel); }
  function $$(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function on(el, name) { el.classList.add(name); }
  function off(el, name) { el.classList.remove(name); }
  function flip(el, name, state) { el.classList.toggle(name, state); }
  // 같은 이름의 CSS 애니메이션을 처음부터 다시 돌린다(다른 이름들도 함께 떼었다가 하나만 다시 붙인다).
  function replay(el, name, others) {
    el.classList.remove(name);
    if (others) others.forEach(function (o) { el.classList.remove(o); });
    void el.getBoundingClientRect();
    el.classList.add(name);
  }
  function pause(ms) { return [function () {}, ms]; }

  /* 단계 목록([할 일, 다음 단계까지 기다릴 ms])을 끝없이 되풀이한다. */
  function Loop(root, steps) {
    this.steps = steps;
    // 멈출 때 되돌릴 처음 클래스(HTML에 적힌 최종 장면)를 기억해 둔다.
    this.snapshot = [root].concat($$(root, '*')).map(function (el) {
      return [el, el.getAttribute('class')];
    });
    this.index = 0;
    this.timer = 0;
    this.running = false;
  }
  Loop.prototype.start = function () {
    if (this.running) return;
    this.running = true;
    this.index = 0;
    this.tick();
  };
  Loop.prototype.tick = function () {
    if (!this.running) return;
    var step = this.steps[this.index];
    this.index = (this.index + 1) % this.steps.length;
    step[0]();
    var self = this;
    this.timer = window.setTimeout(function () { self.tick(); }, step[1]);
  };
  Loop.prototype.stop = function () {
    this.running = false;
    window.clearTimeout(this.timer);
    this.snapshot.forEach(function (pair) {
      if (pair[1] === null) pair[0].removeAttribute('class');
      else pair[0].setAttribute('class', pair[1]);
    });
  };

  var scenes = {
    // 폰 앱 → Remote Host → WinLocker. 풀기와 잠그기를 번갈아 보낸다.
    relay: function (r) {
      var phone = $(r, '.node-phone');
      var net = $(r, '.link-net .wire');
      var local = $(r, '.link-local .wire');
      var host = $(r, '.node-host');
      var wl = $(r, '.node-wl');
      var screen = $(r, '.node-wl .mon');
      function send(unlock) {
        return [
          [function () {
            flip(r, 'msg-unlock', unlock);
            flip(net, 'is-green', unlock);
            replay(phone, 'is-hot');
            on(net, 'is-sending');
          }, 700],
          [function () { off(net, 'is-sending'); replay(host, 'is-hot'); on(local, 'is-sending'); }, 700],
          [function () { off(local, 'is-sending'); replay(wl, 'is-hot'); flip(screen, 'is-locked', !unlock); }, 2600]
        ];
      }
      return [pause(1000)].concat(send(true), send(false));
    },

    // 두 모니터를 함께 덮고, 세 번째 모니터를 꽂으면 1초 안팎에 덮는다.
    monitors: function (r) {
      var mons = $$(r, '.mon');
      var fresh = $(r, '.mon-new');
      var hp = $(r, '.hotplug');
      return [
        [function () {
          mons.forEach(function (m) { off(m, 'is-locked'); });
          on(fresh, 'is-out');
          off(hp, 'is-shown');
          off(hp, 'is-full');
          off(hp, 'is-filling');
        }, 1100],
        [function () { on(mons[0], 'is-locked'); on(mons[1], 'is-locked'); }, 1500],
        [function () { off(fresh, 'is-out'); on(hp, 'is-shown'); }, 550],
        [function () { on(hp, 'is-filling'); }, 1000],
        [function () { on(fresh, 'is-locked'); off(hp, 'is-filling'); on(hp, 'is-full'); }, 3200]
      ];
    },

    // 단축키를 하나씩 누르면 막히고, 비밀번호 점은 그대로 찍힌다.
    keys: function (r) {
      var combos = $$(r, '.combo');
      var dots = $$(r, '.pw .lk-dots i');
      var note = $(r, '.pw-note');
      var steps = [[function () {
        combos.forEach(function (c) { off(c, 'is-blocked'); off(c, 'is-down'); });
        dots.forEach(function (d) { off(d, 'on'); });
        off(note, 'is-on');
      }, 900]];
      combos.forEach(function (c) {
        steps.push([function () { on(c, 'is-down'); }, 190]);
        steps.push([function () { off(c, 'is-down'); on(c, 'is-blocked'); }, 380]);
      });
      steps.push(pause(300));
      dots.forEach(function (d, i) {
        steps.push([function () {
          on(d, 'on');
          if (i === dots.length - 1) on(note, 'is-on');
        }, 170]);
      });
      steps.push(pause(2800));
      return steps;
    },

    // 작업 관리자와 USB 저장장치 아이콘이 차례로 잠긴다.
    apps: function (r) {
      var apps = $$(r, '.app');
      return [
        [function () { apps.forEach(function (a) { off(a, 'is-locked'); }); }, 1500],
        [function () { on(apps[0], 'is-locked'); }, 700],
        [function () { on(apps[1], 'is-locked'); }, 3200]
      ];
    },

    // 30초 원형 타이머가 한 바퀴 돌 때마다 보호를 다시 적용한다.
    // 두 번째 바퀴에서 하나가 실패해 하단에 알림이 뜨고, 세 번째 바퀴에서 다시 성공해 지워진다.
    check: function (r) {
      var ring = $(r, '.ring');
      var items = $$(r, '.checks li');
      function spin() {
        off(ring, 'is-full');
        off(ring, 'is-running');
        void ring.getBoundingClientRect();
        on(ring, 'is-running');
      }
      function apply(failIndex) {
        off(ring, 'is-running');
        on(ring, 'is-full');
        items.forEach(function (li, i) {
          replay(li, 'is-flash');
          flip(li, 'is-bad', i === failIndex);
        });
        flip(r, 'has-fail', failIndex >= 0);
      }
      return [
        [function () {
          items.forEach(function (li) { off(li, 'is-bad'); });
          off(r, 'has-fail');
          spin();
        }, 2000],
        [function () { apply(-1); }, 900],
        [spin, 2000],
        [function () { apply(1); }, 2600],
        [spin, 2000],
        [function () { apply(-1); }, 1800]
      ];
    },

    // 세 가지 해제 방법(원격, 로컬 비밀번호, Google 재인증)을 차례로 보여 준다.
    ways: function (r) {
      var ways = $$(r, '.way');
      var remote = ways[0];
      var password = ways[1];
      var google = ways[2];
      var btn = $(remote, '.mini-btn');
      var wire = $(remote, '.wire');
      var dots = $$(password, '.lk-dots i');
      var enter = $(password, '.kc-enter');
      var qr = $(google, '.qr');
      var steps = [
        [function () {
          ways.forEach(function (w) { off(w, 'is-done'); off(w, 'is-active'); });
          dots.forEach(function (d) { off(d, 'on'); });
          off(qr, 'is-scanning');
        }, 800],
        [function () { on(remote, 'is-active'); replay(btn, 'is-tap'); }, 280],
        [function () { on(wire, 'is-sending'); }, 700],
        [function () { off(wire, 'is-sending'); on(remote, 'is-done'); }, 1300],
        [function () { off(remote, 'is-active'); on(password, 'is-active'); }, 300]
      ];
      dots.forEach(function (d) {
        steps.push([function () { on(d, 'on'); }, 150]);
      });
      steps.push([function () { on(enter, 'is-down'); }, 200]);
      steps.push([function () { off(enter, 'is-down'); on(password, 'is-done'); }, 1300]);
      steps.push([function () { off(password, 'is-active'); on(google, 'is-active'); replay(qr, 'is-scanning'); }, 1300]);
      steps.push([function () { on(google, 'is-done'); }, 1500]);
      steps.push([function () { off(google, 'is-active'); }, 2200]);
      return steps;
    },

    // 트레이 아이콘을 우클릭하면 카드가 올라오고, "지금 잠금하기"를 누르면 화면이 잠긴다.
    tray: function (r) {
      var cursor = $(r, '.cursor');
      var card = $(r, '.tcard');
      var row = $(r, '.tc-lock');
      function moveTo(where) {
        cursor.classList.remove('at-start', 'at-icon', 'at-row');
        cursor.classList.add('at-' + where);
      }
      return [
        [function () {
          off(r, 'is-locked');
          off(card, 'is-open');
          off(row, 'is-hover');
          cursor.classList.remove('is-click', 'is-rclick');
          moveTo('start');
        }, 1000],
        [function () { moveTo('icon'); }, 850],
        [function () { replay(cursor, 'is-rclick', ['is-click']); on(card, 'is-open'); }, 1500],
        [function () { moveTo('row'); }, 700],
        [function () { on(row, 'is-hover'); }, 600],
        [function () { replay(cursor, 'is-click', ['is-rclick']); }, 260],
        [function () { off(card, 'is-open'); off(row, 'is-hover'); on(r, 'is-locked'); }, 2600]
      ];
    },

    // 풀 때 새 버전을 받아 두고, 다음에 잠글 때 약 1초 틈을 두고 교체한다.
    // 재생 막대가 4초에 걸쳐 지나가며, 틈(전체의 약 11%)을 지나는 동안 틈을 강조한다.
    update: function (r) {
      var states = ['is-getting', 'is-verifying', 'is-got', 'is-sweeping', 'is-swept', 'in-gap'];
      return [
        [function () { states.forEach(function (s) { off(r, s); }); }, 800],
        [function () { on(r, 'is-getting'); }, 1900],
        [function () { off(r, 'is-getting'); on(r, 'is-verifying'); }, 1000],
        [function () { off(r, 'is-verifying'); on(r, 'is-got'); }, 1200],
        [function () { on(r, 'is-sweeping'); }, 1780],
        [function () { on(r, 'in-gap'); }, 440],
        [function () { off(r, 'in-gap'); }, 1780],
        [function () { off(r, 'is-sweeping'); on(r, 'is-swept'); }, 2400]
      ];
    }
  };

  /* 첫 화면: 폰 버튼을 누르면 신호가 PC로 가고 두 모니터가 잠김과 해제를 오간다.
     방문자가 직접 누르면 자동 재생을 멈추고, 그 뒤로는 누를 때만 바뀐다. */
  function Hero(root) {
    var btn = $(root, '.ph-btn');
    var label = $(root, '.ph-label');
    var wire = $(root, '.wire');
    var mons = $$(root, '.mon');
    var live = $(root, '.hero-live');
    var locked = true;          // HTML의 처음 상태
    var busy = false;
    var byUser = false;
    var announceNext = false;
    var running = false;
    var autoTimer = 0;
    var flightTimer = 0;
    var pressTimer = 0;

    function render() {
      mons.forEach(function (m) { flip(m, 'is-locked', locked); });
      label.textContent = locked ? '풀기' : '잠그기';
      btn.setAttribute('aria-label', locked ? '데모 PC 잠금 풀기' : '데모 PC 잠그기');
    }

    function press(fromUser) {
      if (busy) return;
      var next = !locked;
      replay(btn, 'is-ripple');
      on(btn, 'is-pressing');
      window.clearTimeout(pressTimer);
      pressTimer = window.setTimeout(function () { off(btn, 'is-pressing'); }, 150);

      function arrive() {
        busy = false;
        locked = next;
        render();
        if (fromUser || announceNext) {
          announceNext = false;
          live.textContent = locked ? '데모 PC가 잠겼습니다.' : '데모 PC의 잠금이 풀렸습니다.';
        }
      }

      if (reduced()) { arrive(); return; }
      busy = true;
      flip(wire, 'is-green', !next);   // 풀 때는 초록 신호
      on(wire, 'is-sending');
      flightTimer = window.setTimeout(function () { off(wire, 'is-sending'); arrive(); }, 650);
    }

    function halt() {
      running = false;
      window.clearTimeout(autoTimer);
    }

    function schedule(ms) {
      autoTimer = window.setTimeout(function () {
        if (!running) return;
        press(false);
        schedule(3300);
      }, ms);
    }

    btn.addEventListener('click', function () {
      byUser = true;
      halt();
      // 자동 재생 신호가 가는 중이면 그 결과를 이 누름의 결과로 알린다.
      if (busy) { announceNext = true; return; }
      press(true);
    });

    return {
      start: function () {
        if (running || byUser || reduced()) return;
        running = true;
        schedule(2000);
      },
      stop: function () {
        halt();
        if (byUser) return;
        // 자동 재생 중에 화면을 벗어나면 처음 상태(잠김)로 돌려 둔다.
        window.clearTimeout(flightTimer);
        off(wire, 'is-sending');
        busy = false;
        locked = true;
        render();
      }
    };
  }

  /* 화면에 보이는 장면만 돌린다. */
  var items = [];
  $$(document, '[data-scene]').forEach(function (el) {
    var build = scenes[el.getAttribute('data-scene')];
    if (build) items.push({ el: el, player: new Loop(el, build(el)), visible: false });
  });
  var heroEl = document.getElementById('hero-demo');
  if (heroEl) items.push({ el: heroEl, player: Hero(heroEl), visible: false });

  function findItem(el) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].el === el) return items[i];
    }
    return null;
  }

  var observer = null;
  function watch() {
    if (observer || !('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var item = findItem(entry.target);
        if (!item) return;
        item.visible = entry.isIntersecting;
        if (item.visible && !document.hidden) item.player.start();
        else item.player.stop();
      });
    }, { threshold: 0.3 });
    items.forEach(function (item) { observer.observe(item.el); });
  }
  function unwatch() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    items.forEach(function (item) {
      item.visible = false;
      item.player.stop();
    });
  }
  function applyPreference() {
    if (reduced()) unwatch();
    else watch();
  }

  document.addEventListener('visibilitychange', function () {
    items.forEach(function (item) {
      if (document.hidden) item.player.stop();
      else if (item.visible && !reduced()) item.player.start();
    });
  });

  if (motionQuery) {
    if (motionQuery.addEventListener) motionQuery.addEventListener('change', applyPreference);
    else if (motionQuery.addListener) motionQuery.addListener(applyPreference);
  }
  applyPreference();
})();
