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
!function(d,w){var k='',q=[],Y,m=w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches,c='var(--offblack)',o='var(--offwhite)',
P='<svg viewBox="0 0 60 48" width="50" height="40" style="overflow:visible"><path d="M24 12.5C31 10.5 39 14.5 45 20.5L52.5 28.5 47.5 30.5C43.5 34.5 38 36.8 32 36.8 26 36.8 21 33 21 27 21 21 21 15 24 12.5Z" style="fill:'+c+'"/><path d="M22 21C26 22.5 31 25 35 28 39 31 42 32.5 45.5 32.4 41.5 35.5 37 36.8 32 36.8 26 36.8 21.5 33 21 27Z" style="fill:'+o+';stroke:'+c+';stroke-width:1"/><path d="M18 7C12.5 6.6 7.6 10 4.2 15.2 8.2 17.8 12.6 19.9 18 20.6Z" style="fill:'+o+';stroke:'+c+';stroke-width:1.1;stroke-linejoin:round"/><path d="M12.4 8.6Q11.2 14 12.6 19.3M9.3 10.6Q8.4 14.6 9.6 17.9" style="fill:none;stroke:'+c+';stroke-width:.9"/><circle cx="21" cy="14" r="8" style="fill:'+c+'"/><ellipse cx="19.2" cy="14.4" rx="5.4" ry="6.2" style="fill:'+o+';stroke:'+c+';stroke-width:.7"/><circle cx="17.6" cy="12.6" r="1.1" style="fill:'+c+'"/><path d="M16 11.3 15.2 10.3M19.2 14.1 20.2 14.9" style="stroke:'+c+';stroke-width:.6"/><path class="w" d="M29 19.5Q40 20.5 47.5 28.5 38.5 28.8 29 25Z" style="fill:'+c+';stroke:'+o+';stroke-width:.7"/><g class="l" style="stroke:'+c+';fill:'+c+';stroke-linejoin:round"><path d="M31 36.5 30.6 43" style="stroke-width:1.4;stroke-linecap:round"/><path d="M30.6 42.6 25.4 45.6H31.4Z" style="stroke-width:.6"/></g><g class="l" style="stroke:'+c+';fill:'+c+';stroke-linejoin:round"><path d="M36 36.2 35.6 43" style="stroke-width:1.4;stroke-linecap:round"/><path d="M35.6 42.6 30.4 45.6H36.4Z" style="stroke-width:.6"/></g></svg>',
B='<svg viewBox="0 0 100 60" width="60" height="36" style="overflow:visible"><g style="fill:'+c+'"><path class="g" d="M82 38h7l-1.5 20h-4z"/><path class="g" d="M68 39h7l-2 19h-4z"/><path class="g" d="M36 39h7l-1 19h-5z"/><path class="g" d="M26 39h7l-1 19h-5z"/><path d="M8 41Q5 37 6 31 7 24 12 20 15 17 19 16 23 10 30 6 37 4 44 8 55 13 70 15 82 16 88 21 90 25 89 30L88 38 88 46Q84 47 80 45 76 44 74 45 60 44 52 43 44 44 42 45 37 48 33 48 29 48 26 48 23 49 21 50 19 53 17 51 15 48 14 45 11 44 8 41Z"/></g><path d="M89 23Q91.6 25.5 91.6 30" style="fill:none;stroke:'+c+';stroke-width:1.5"/><path d="M90.4 29.5 92.9 29.5 92.6 34 90.6 34Z" style="fill:'+c+'"/><path d="M17 22Q12 21 12 15" style="fill:none;stroke:'+o+';stroke-width:1.6;stroke-linecap:round"/><circle cx="12.5" cy="27" r="1" style="fill:'+o+'"/></svg>';
function e(h,s){var x=d.createElement('div');x.setAttribute('aria-hidden','true');x.style.cssText='position:fixed;z-index:999;pointer-events:none;'+s;x.innerHTML=h;d.body.appendChild(x);return x}
function f(x,t){x.animate([{opacity:0},{opacity:1,offset:.2},{opacity:1,offset:.8},{opacity:0}],{duration:t}).onfinish=function(){x.remove()}}
function p(){var H=w.innerHeight,W=w.innerWidth,Y=w.pageYOffset,y=H-44,r=[].slice.call(d.querySelectorAll('section,.session,.break-row,.day,footer')).map(function(n){return n.getBoundingClientRect().top}).filter(function(t){return t>H*.3&&t<H*.85});if(r.length)y=r[0]-38;
var a=Math.round(W*(.25+Math.random()*.5)-25),x=e(P,'position:absolute;z-index:10;pointer-events:auto;cursor:pointer;left:'+a+'px;top:'+(y+Y)+'px'),s=x.firstChild,g=x.querySelector('.w'),L=x.querySelectorAll('.l');
if(m){x.animate([{opacity:0},{opacity:1}],{duration:600});x.onclick=function(){x.onclick=null;x.animate([{opacity:1},{opacity:0}],{duration:600}).onfinish=function(){x.remove()}};return}
g.style.transformBox='fill-box';g.style.transformOrigin='0 100%';s.style.transformOrigin='50% 100%';
var Q=function(m,n){return m+Math.random()*(n-m)},P0=[],Z=0,M=0,X=W-a+40,R=30,E=500,G=200,j,u,v,h,L0,H0,lo=-1e9,Y0=Q(110,170),Wa=Q(8,20),Wf=Q(2.5,4.5),Wp=Q(-.6,.6),Sa=Q(15,22.5),S0=Q(.45,.58),Sp=Q(.1,.14),Fr=Q(100,140),Tm=Q(6,10);for(j=0;j<=160;j++){u=j/160;v=R+(X-R)*(1-u);h=-Y0*Math.pow(1-u,2)-24+Math.sin(u*Math.PI*Wf+Wp)*Wa*Math.pow(1-u,2)+(u>S0?Sa*Math.pow(Math.sin(Math.PI*(u-S0)/(1-S0)),2):0);if(j)Z+=Math.hypot(v-L0,h-H0);if(u>S0&&h>lo){lo=h;M=j}L0=v;H0=h;P0.push([v,h,Z])}
var F=Z/Sp,T=F+E+G,K=P0.map(function(c){return{transform:'translate('+c[0].toFixed(1)+'px,'+c[1].toFixed(1)+'px)',offset:c[2]/Z*F/T}});for(j=1;j<=24;j++){u=j/24;K.push({transform:'translate('+(R*Math.pow(1-u,2)).toFixed(1)+'px,'+(-24+25.5*(3*u*u-2*u*u*u)).toFixed(1)+'px)',offset:(F+E*u)/T})}K.push({transform:'translate(0,0)',offset:1,easing:'ease-out'});K[K.length-2].easing='ease-out';
g.animate([{transform:'rotate(0)'},{transform:'rotate(-35deg)'}],{duration:Fr,iterations:Math.ceil(F/Fr),direction:'alternate'});g.animate([{transform:'rotate(0)'},{transform:'rotate(-40deg)'}],{duration:70,delay:F,iterations:Math.ceil(E/70),direction:'alternate'});
var q=P0[M][2]/Z*F/T;s.animate([{transform:'rotate(0)'},{transform:'rotate(0)',offset:q,easing:'ease-in'},{transform:'rotate('+Tm.toFixed(1)+'deg)',offset:F/T,easing:'ease-in-out'},{transform:'rotate(0)',offset:(F+E)/T},{transform:'rotate(0)'}],{duration:T});
x.animate(K,{duration:T});
var i=s.animate([{transform:'translateY(0)'},{transform:'translateY(-2px)',offset:.04},{transform:'translateY(0)',offset:.08},{transform:'translateY(-2px)',offset:.12},{transform:'translateY(0)',offset:.16},{transform:'translateY(0)'}],{duration:5e3,delay:T+300,iterations:Infinity});
x.onclick=function(){x.onclick=null;x.style.cursor='';i.cancel();var D=a+80,Ws=Q(50,70),T=D/Ws*1e3,C=240*70/Ws;
[].forEach.call(L,function(l,n){l.style.transformBox='fill-box';l.style.transformOrigin='50% 0';l.animate([{transform:'rotate('+(n?22:-22)+'deg)'},{transform:'rotate('+(n?-22:22)+'deg)'}],{duration:C,iterations:Infinity,direction:'alternate',easing:'ease-in-out'})});
s.animate([{transform:'rotate(-5deg) translateY(0)'},{transform:'rotate(0) translateY(-1.5px)',offset:.5},{transform:'rotate(5deg) translateY(0)'}],{duration:C,iterations:Infinity,direction:'alternate',easing:'ease-in-out'});
x.animate([{transform:'translateX(0)'},{transform:'translateX('+(-D)+'px)'}],{duration:T,fill:'forwards'}).onfinish=function(){x.remove()}}}
function b(){var W=w.innerWidth,N=30+Math.floor(Math.random()*15),h=e('','left:0;right:0;bottom:4px;height:72px'),R=function(m,n){return m+Math.random()*(n-m)},E=0;
for(var i=0;i<N;i++){var r=i%3,k=[1,.88,.76][r]*R(.9,1.1),V=R(160,230),s=d.createElement('div');s.style.cssText='position:absolute;left:0;bottom:'+r*12+'px;z-index:'+(3-r);s.innerHTML=B;s.firstChild.setAttribute('width',60*k);s.firstChild.setAttribute('height',36*k);h.appendChild(s);
if(m){s.style.left=(i*56)%Math.max(W-60,60)+'px';continue}
var t=(W+150)/V*1e3,l=i*9e3/N+R(0,450);E=Math.max(E,t+l);s.animate([{transform:'translateX('+(W+20)+'px)'},{transform:'translateX(-90px)'}],{duration:t,delay:l,fill:'both'});
s.firstChild.animate([{transform:'translateY(0)'},{transform:'translateY(-3px)'}],{duration:160,iterations:Infinity,direction:'alternate'});
[].forEach.call(s.querySelectorAll('.g'),function(g,n){g.style.transformBox='fill-box';g.style.transformOrigin='50% 0';g.animate([{transform:'rotate(-26deg)'},{transform:'rotate(26deg)'}],{duration:320*195/V,iterations:Infinity,direction:'alternate',easing:'ease-in-out',delay:-[0,70,160,230][n]*195/V})})}
if(m)return f(h,4e3);setTimeout(function(){h.remove()},E+300)}
d.addEventListener('keydown',function(v){var t=v.target;if(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable||v.key.length>1)return;k=(k+v.key.toLowerCase()).slice(-7);var y=String.fromCharCode(112,117,102,102,105,110);clearTimeout(Y);if(k.slice(-7)==y+'s'){k='';for(var n=6+Math.floor(Math.random()*15),i=0;i<n;i++)setTimeout(p,i*230+Math.random()*350)}else if(k.slice(-6)==y)Y=setTimeout(function(){k='';p()},450)});
d.addEventListener('click',function(v){if(!(v.target.closest&&v.target.closest('.time-format button')))return;var t=Date.now();q=q.filter(function(n){return t-n<3e3});q.push(t);if(q.length>6){q=[];b()}});
try{console.log(atob('ICAgLF8KICAobyA+CiAgLy9cCiAgVl8vXwoKU29tZSBiaXJkcyBvbmx5IGNvbWUgd2hlbiBjYWxsZWQgYnkgbmFtZS4='))}catch(z){}}(document,window);
