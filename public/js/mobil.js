// Mobilkontrollen: oppsett i lobbyen, styrepute for å legge brikker og valg av vikingplass.

import { BRIKKE } from '/delt/brikker.js';
import { roterPunkt } from '/delt/motor.js';
import { lastBilder, brikkeUrl, vikingSvg, elementFra, PLASS_GRADER } from './felles.js';

const $ = (id) => document.getElementById(id);
const kode = location.pathname.split('/')[2]?.toUpperCase();
const lagret = `karkasand:${kode}`;
const socket = io();

let spillerId = hent(lagret);
let rom = null;
let haddeTur = false;
let kobler = false;

function hent(nokkel) {
  try {
    return localStorage.getItem(nokkel);
  } catch {
    return null;
  }
}
function lagre(nokkel, verdi) {
  try {
    localStorage.setItem(nokkel, verdi);
  } catch {
    // privat modus o.l.
  }
}

await lastBilder();

function visSide(id) {
  for (const s of document.querySelectorAll('.side')) s.hidden = s.id !== id;
}

function koble() {
  if (kobler) return;
  kobler = true;
  socket.emit('mobil:koble', { kode, spillerId }, (svar) => {
    kobler = false;
    if (svar.feil) {
      $('feiltekst').textContent = svar.feil;
      visSide('feil');
      return;
    }
    const ny = svar.spillerId !== spillerId;
    spillerId = svar.spillerId;
    lagre(lagret, spillerId);
    // Husk navnet fra forrige gang
    const navn = hent('karkasand:navn');
    if (ny && navn) socket.emit('mobil:oppsett', { navn });
  });
}

socket.on('connect', koble);
socket.on('disconnect', () => visSide('kobler'));
socket.on('tilstand', (r) => {
  rom = r;
  vis();
});
$('prov-igjen').addEventListener('click', () => {
  spillerId = null;
  koble();
});

// ---------- Oppsett ----------

$('navn').addEventListener('change', () => {
  const navn = $('navn').value.trim();
  if (!navn) return;
  lagre('karkasand:navn', navn);
  socket.emit('mobil:oppsett', { navn });
});
$('navn').addEventListener('keydown', (e) => e.key === 'Enter' && $('navn').blur());

for (const knapp of document.querySelectorAll('[data-plass]')) {
  knapp.addEventListener('click', () => socket.emit('mobil:oppsett', { plass: knapp.dataset.plass }));
}

$('start').addEventListener('click', () => {
  $('navn').blur();
  socket.emit('mobil:start');
});

function visOppsett(meg) {
  visSide('oppsett');
  if (document.activeElement !== $('navn')) $('navn').value = meg.navn;

  const farger = $('farger');
  if (!farger.children.length) {
    for (const f of rom.farger) {
      const b = elementFra(`<button style="background:${f}" aria-label="Velg farge"></button>`);
      b.addEventListener('click', () => socket.emit('mobil:oppsett', { farge: f }));
      farger.append(b);
    }
  }
  [...farger.children].forEach((b, i) => {
    const f = rom.farger[i];
    b.classList.toggle('valgt', meg.farge === f);
    b.disabled = rom.spillere.some((s) => s.id !== meg.id && s.farge === f);
  });

  $('plass-felt').hidden = rom.modus !== 'bord';
  for (const b of document.querySelectorAll('[data-plass]')) {
    b.classList.toggle('valgt', meg.plass === b.dataset.plass);
    b.disabled = rom.spillere.some((s) => s.id !== meg.id && s.plass === b.dataset.plass);
  }

  $('spillerliste').replaceChildren(
    ...rom.spillere.map((s) => {
      const li = elementFra(`<li><span class="prikk" style="background:${s.farge}"></span><span></span><span class="hoyre"></span></li>`);
      li.children[1].textContent = s.navn;
      li.children[2].textContent = s.id === meg.id ? 'deg' : s.tilkoblet ? '' : 'frakoblet';
      return li;
    }),
  );
  const klare = rom.spillere.length >= rom.minSpillere;
  $('start').disabled = !klare;
  $('start-hjelp').textContent = klare ? '' : 'Venter på at en spiller til skal skanne QR-koden.';
}

// ---------- Spillet ----------

for (const knapp of document.querySelectorAll('[data-retning]')) {
  knapp.addEventListener('click', () => handling({ type: 'flytt', retning: knapp.dataset.retning }));
}
$('roter').addEventListener('click', () => handling({ type: 'roter' }));
$('neste').addEventListener('click', () => handling({ type: 'neste' }));
$('legg').addEventListener('click', () => handling({ type: 'legg' }));
$('ingen-viking').addEventListener('click', () => handling({ type: 'viking', del: null }));
$('sett-viking').addEventListener('click', () => handling({ type: 'viking', del: rom.spill.aktiv?.valgtDel ?? null }));
$('nytt-spill').addEventListener('click', () => socket.emit('mobil:nytt-spill'));

// Tastatur, praktisk for testing på PC
const TASTER = { ArrowUp: 'opp', ArrowDown: 'ned', ArrowLeft: 'venstre', ArrowRight: 'hoyre' };
document.addEventListener('keydown', (e) => {
  if (!rom?.spill || document.activeElement === $('navn')) return;
  if (TASTER[e.key]) handling({ type: 'flytt', retning: TASTER[e.key] });
  else if (e.key === 'r' || e.key === ' ') handling({ type: 'roter' });
  else if (e.key === 'n') handling({ type: 'neste' });
  else if (e.key === 'Enter') (rom.spill.fase === 'viking' ? $('sett-viking') : $('legg')).click();
  else return;
  e.preventDefault();
});

function handling(h) {
  socket.emit('mobil:handling', h);
  navigator.vibrate?.(8);
}

function visSpill(meg) {
  const spill = rom.spill;
  const i = spill.spillere.findIndex((s) => s.id === spillerId);
  const jeg = spill.spillere[i];
  const harTur = spill.tur === i;

  visSide('spill');
  $('min-farge').style.background = jeg.farge;
  $('mitt-navn').textContent = jeg.navn;
  $('mine-poeng').textContent = jeg.poeng;
  $('mine-vikinger').innerHTML = `${vikingSvg(jeg.farge)} ${jeg.vikinger}`;

  const aktiv = spill.aktiv;
  const navnPaaTur = spill.spillere[spill.tur].navn;
  const status = $('status');
  status.classList.toggle('din-tur', harTur);
  if (harTur && spill.fase === 'legg') status.textContent = aktiv.passer ? 'Din tur! Brikken passer her.' : 'Din tur! Flytt eller roter brikken.';
  else if (harTur) status.textContent = 'Vil du sette ut en viking?';
  else status.textContent = `${navnPaaTur} sin tur …`;

  if (harTur && !haddeTur) navigator.vibrate?.([60, 40, 60]);
  haddeTur = harTur;

  // Forhåndsvisning, snudd slik spilleren ser brettet fra sin plass
  const forhand = $('forhand');
  forhand.style.transform = `rotate(${PLASS_GRADER[meg.plass] ?? 0}deg)`;
  forhand.classList.toggle('venter', !harTur);
  forhand.style.setProperty('--farge', jeg.farge);
  const bilde = $('forhand-bilde');
  const prikker = $('prikker');
  prikker.replaceChildren();

  let vis = aktiv ? { id: aktiv.brikke.id, nr: aktiv.brikke.nr, rot: aktiv.rot } : null;
  if (spill.fase === 'viking' && spill.sistLagt) {
    const lagt = spill.brett.find((b) => b.x === spill.sistLagt.x && b.y === spill.sistLagt.y);
    vis = lagt;
    if (harTur) {
      for (const d of spill.vikingDeler) {
        const [px, py] = roterPunkt(BRIKKE[lagt.id].deler[d].punkt, lagt.rot);
        const b = elementFra(`<button class="${aktiv.valgtDel === d ? 'valgt' : ''}">${vikingSvg(jeg.farge)}</button>`);
        b.style.left = `${px * 100}%`;
        b.style.top = `${py * 100}%`;
        // Hold vikingen oppreist selv om brikken er snudd
        b.style.transform = `rotate(${-(PLASS_GRADER[meg.plass] ?? 0)}deg)`;
        b.addEventListener('click', () => handling({ type: 'velg', del: d }));
        prikker.append(b);
      }
    }
  }
  bilde.hidden = !vis;
  if (vis) {
    const url = brikkeUrl(vis.id, vis.nr);
    if (bilde.getAttribute('src') !== url) bilde.src = url;
    bilde.style.transform = `rotate(${vis.rot * 90}deg)`;
  }

  $('legg-kontroll').hidden = !(harTur && spill.fase === 'legg');
  $('viking-kontroll').hidden = !(harTur && spill.fase === 'viking');
  $('legg').disabled = !aktiv?.passer;
  $('sett-viking').disabled = aktiv?.valgtDel == null;
}

function visSlutt() {
  visSide('slutt');
  const spill = rom.spill;
  const rangert = spill.spillere.map((s, i) => ({ ...s, i })).sort((a, b) => b.poeng - a.poeng);
  $('resultat').replaceChildren(
    ...rangert.map((s) => {
      const li = elementFra(`<li><span class="prikk" style="background:${s.farge}"></span><span></span><span class="hoyre"></span></li>`);
      li.children[1].textContent = (spill.resultat?.vinnere.includes(s.i) ? '👑 ' : '') + s.navn;
      li.children[2].textContent = `${s.poeng} poeng`;
      return li;
    }),
  );
}

function vis() {
  const meg = rom.spillere.find((s) => s.id === spillerId);
  if (!meg) {
    // Vi er ikke med i rommet lenger (f.eks. tatt over av en annen); prøv å bli med på nytt
    spillerId = null;
    if (!rom.spill) koble();
    else {
      $('feiltekst').textContent = 'Spillet er allerede i gang.';
      visSide('feil');
    }
    return;
  }
  if (!rom.spill) visOppsett(meg);
  else if (rom.spill.fase === 'slutt') visSlutt();
  else visSpill(meg);
}

// Hold mobilskjermen våken under spillet
async function holdVaaken() {
  try {
    await navigator.wakeLock?.request('screen');
  } catch {
    // ikke støttet
  }
}
holdVaaken();
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && holdVaaken());
