// Program session toggles + speaker shuffle, home photo rotation, report side-nav scroll spy.
(function () {
  // Program: expand/collapse session descriptions
  document.querySelectorAll('.session-toggle').forEach(function (button) {
    button.addEventListener('click', function () {
      // Leave the session as it is when the click ends a text selection inside it (e.g. copying a title)
      var selection = window.getSelection();
      if (selection && !selection.isCollapsed && button.contains(selection.anchorNode)) return;
      var description = button.parentElement.querySelector('.session-desc');
      var sign = button.querySelector('.session-sign');
      if (!description) return;
      var isOpen = !description.hidden;
      description.hidden = isOpen;
      sign.textContent = isOpen ? '+' : '−';
      button.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  // Program: switch every time between 24-hour ("13:15 - 17:30") and AM/PM ("1:15 - 5:30 pm").
  // The page is built with 24-hour times; the original text is kept in data-time-24.
  var timeSwitch = document.querySelector('.time-format');
  if (timeSwitch) {
    var timeCells = document.querySelectorAll('.session-time, .break-time, .block-time');
    var toTwelveHour = function (range) {
      var parts = range.split(' - ').map(function (time) {
        var match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
        if (!match) return null;
        var hour = parseInt(match[1], 10);
        return { text: ((hour + 11) % 12 + 1) + ':' + match[2], period: hour < 12 ? 'am' : 'pm' };
      });
      if (parts.some(function (part) { return !part; })) return range;
      // non-breaking spaces keep "7:00 pm" together, so a range only wraps after the dash
      var nbsp = '\u00a0';
      if (parts.length === 1) return parts[0].text + nbsp + parts[0].period;
      if (parts[0].period === parts[1].period) return parts[0].text + nbsp + '- ' + parts[1].text + nbsp + parts[1].period;
      return parts[0].text + nbsp + parts[0].period + nbsp + '- ' + parts[1].text + nbsp + parts[1].period;
    };
    var applyTimeFormat = function (format) {
      timeCells.forEach(function (cell) {
        if (!cell.hasAttribute('data-time-24')) cell.setAttribute('data-time-24', cell.textContent);
        var original = cell.getAttribute('data-time-24');
        cell.textContent = format === '12h' && original ? toTwelveHour(original) : original;
      });
      document.documentElement.classList.toggle('times-12h', format === '12h');
      timeSwitch.querySelectorAll('button').forEach(function (button) {
        button.setAttribute('aria-pressed', String(button.getAttribute('data-time-format') === format));
      });
    };
    var savedFormat = null;
    try { savedFormat = localStorage.getItem('timeFormat'); } catch (error) {}
    applyTimeFormat(savedFormat === '12h' ? '12h' : '24h');
    timeSwitch.hidden = false;
    timeSwitch.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-time-format]');
      if (!button) return;
      var format = button.getAttribute('data-time-format');
      applyTimeFormat(format);
      try { localStorage.setItem('timeFormat', format); } catch (error) {}
    });
  }

  // Program: shuffle the full speaker grid, seeded by the current hour so the
  // order holds steady within an hour and changes on the next one.
  var speakerGrid = document.querySelector('.program-speakers .speakers');
  if (speakerGrid) {
    var seed = Math.floor(Date.now() / 3600000);
    var nextRandom = function () { // mulberry32
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    var cards = Array.prototype.slice.call(speakerGrid.children);
    for (var i = cards.length - 1; i > 0; i--) {
      var j = Math.floor(nextRandom() * (i + 1));
      var swap = cards[i]; cards[i] = cards[j]; cards[j] = swap;
    }
    cards.forEach(function (card) { speakerGrid.appendChild(card); });
  }

  // Home: show a different band photo on each page load, never repeating the last one seen.
  var bandSlides = document.querySelectorAll('[data-rotate] .photo-band-slide');
  if (bandSlides.length > 1) {
    var lastShown = -1;
    try { lastShown = parseInt(localStorage.getItem('bandPhoto'), 10); } catch (error) {}
    var hasLast = lastShown >= 0 && lastShown < bandSlides.length;
    // pick among all photos on a first visit, otherwise among the others so it never repeats
    var showing = Math.floor(Math.random() * (hasLast ? bandSlides.length - 1 : bandSlides.length));
    if (hasLast && showing >= lastShown) showing += 1;
    bandSlides.forEach(function (slide, index) { slide.classList.toggle('active', index === showing); });
    try { localStorage.setItem('bandPhoto', String(showing)); } catch (error) {}
  }

  // Report: side nav active state tracks scroll; click scrolls to section
  var sideNav = document.querySelector('.side-nav');
  if (!sideNav) return;
  var links = Array.prototype.slice.call(sideNav.querySelectorAll('a'));
  var sections = links
    .map(function (link) { return document.getElementById(link.getAttribute('href').slice(1)); })
    .filter(Boolean);

  function setActive(id) {
    links.forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('href') === '#' + id);
    });
  }

  function onScroll() {
    var fromTop = window.scrollY + 140;
    var current = sections[0];
    sections.forEach(function (section) {
      if (section.offsetTop <= fromTop) current = section;
    });
    if (current) setActive(current.id);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  links.forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      var target = document.getElementById(link.getAttribute('href').slice(1));
      if (target) window.scrollTo({ top: target.offsetTop - 120, behavior: 'smooth' });
    });
  });
})();
