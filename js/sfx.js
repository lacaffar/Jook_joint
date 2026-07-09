/* =====================================================================
   sfx.js - tiny WebAudio synth for Swifty's Jook Joint.
   No audio files: every effect is an oscillator or noise buffer.
   Audio context is created lazily on the first user gesture (autoplay
   rules), and a mute toggle (persisted) is injected into the topbar.
   ===================================================================== */
window.SFX = (function () {
  'use strict';

  var ctx = null;
  var muted = false;
  try { muted = localStorage.getItem('sjj_mute') === '1'; } catch (e) {}

  function ac() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume().catch(function () {});
    return ctx;
  }

  /* one enveloped oscillator note */
  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    var c = ac(); if (!c) return;
    var t = c.currentTime;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }

  /* white-noise burst through a filter (static, crashes, jumpscares) */
  function noise(dur, vol, filterFreq, filterType) {
    if (muted) return;
    var c = ac(); if (!c) return;
    var t = c.currentTime;
    var len = Math.max(1, (dur * c.sampleRate) | 0);
    var buf = c.createBuffer(1, len, c.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = c.createBufferSource(); src.buffer = buf;
    var f = c.createBiquadFilter();
    f.type = filterType || 'lowpass';
    f.frequency.setValueAtTime(filterFreq || 1200, t);
    var g = c.createGain();
    g.gain.setValueAtTime(vol || 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(c.destination);
    src.start(t); src.stop(t + dur + 0.05);
  }

  var api = {
    /* dialogue / UI */
    blip:   function () { tone(430, 0.045, 'square', 0.06); },
    click:  function () { tone(1200, 0.03, 'square', 0.045); },
    deny:   function () { tone(140, 0.18, 'square', 0.09); },
    /* rewards */
    coin:   function () { tone(988, 0.09, 'square', 0.08); setTimeout(function () { tone(1319, 0.22, 'square', 0.08); }, 80); },
    cap:    function () { tone(660, 0.08, 'square', 0.08); setTimeout(function () { tone(880, 0.08, 'square', 0.08); }, 90); setTimeout(function () { tone(1175, 0.25, 'square', 0.09); }, 180); },
    save:   function () { [523, 659, 784, 1047].forEach(function (f, i) { setTimeout(function () { tone(f, 0.12, 'square', 0.07); }, i * 90); }); },
    /* combat-ish */
    hurt:   function () { tone(300, 0.2, 'sawtooth', 0.1, 90); },
    slash:  function () { noise(0.12, 0.1, 2500, 'highpass'); },
    buzz:   function () { tone(110, 0.35, 'sawtooth', 0.12); },
    parry:  function () { tone(1800, 0.06, 'triangle', 0.1); noise(0.08, 0.06, 4000, 'highpass'); },
    /* fnaf */
    static: function () { noise(0.25, 0.05, 1800, 'bandpass'); },
    hum:    function () { tone(60, 0.5, 'sine', 0.03); },
    scare:  function () { noise(0.9, 0.35, 900); tone(180, 0.9, 'sawtooth', 0.22, 60); },
    chime:  function () { [660, 880, 660, 1047].forEach(function (f, i) { setTimeout(function () { tone(f, 0.4, 'sine', 0.09); }, i * 350); }); },
    /* misc */
    ding:   function () { tone(1568, 0.3, 'triangle', 0.09); },
    step:   function () { tone(220, 0.03, 'square', 0.025); },

    muted:  function () { return muted; },
    setMuted: function (m) {
      muted = !!m;
      try { localStorage.setItem('sjj_mute', muted ? '1' : '0'); } catch (e) {}
      var b = document.querySelector('#mute-btn');
      if (b) { b.textContent = muted ? '🔇' : '🔊'; b.setAttribute('aria-pressed', String(muted)); }
    }
  };

  /* inject the mute toggle next to the jukebox button */
  function addButton() {
    var bar = document.querySelector('.topbar .wrap');
    if (!bar || document.querySelector('#mute-btn')) return;
    var b = document.createElement('button');
    b.id = 'mute-btn';
    b.className = 'mute-btn';
    b.type = 'button';
    b.title = 'sound effects on/off';
    b.setAttribute('aria-label', 'toggle sound effects');
    b.setAttribute('aria-pressed', String(muted));
    b.textContent = muted ? '🔇' : '🔊';
    b.addEventListener('click', function () { api.setMuted(!muted); if (!muted) api.click(); });
    bar.appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButton);
  else addButton();

  return api;
})();
