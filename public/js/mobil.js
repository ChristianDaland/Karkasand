// Mobilkontrollen: oppsett i lobbyen, styrepute for å legge brikker og valg av vikingplass.

import { BRIKKE } from '/delt/brikker.js';
import { roterPunkt } from '/delt/motor.js';
import { lastBilder, brikkeUrl, vikingSvg, figurSvg, vareSvg, elementFra, PLASS_GRADER, FIGURNAVN } from './felles.js';
import { VARER } from '/delt/brikker.js';
import { brikkeTekst } from './brikkehjelp.js';

const $ = (id) => document.getElementById(id);
const kode = location.pathname.split('/')[2]?.toUpperCase();
const lagret = `karkasand:${kode}`;
// Bildelisten hentes før socketen lages. Ellers kan «connect» komme mens vi venter,
// før lytterne er satt opp, og siden blir stående uten å koble til.
await lastBilder();
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

// Navnet sendes mens spilleren skriver, så verten ser det før spillet startes
let navnTimer;
function sendNavn() {
  clearTimeout(navnTimer);
  const navn = $('navn').value.trim();
  if (!navn) return;
  lagre('karkasand:navn', navn);
  socket.emit('mobil:oppsett', { navn });
}
$('navn').addEventListener('input', () => {
  clearTimeout(navnTimer);
  navnTimer = setTimeout(sendNavn, 400);
});
$('navn').addEventListener('change', sendNavn);
$('navn').addEventListener('keydown', (e) => e.key === 'Enter' && $('navn').blur());

for (const knapp of document.querySelectorAll('[data-plass]')) {
  knapp.addEventListener('click', () => socket.emit('mobil:oppsett', { plass: knapp.dataset.plass }));
}

// Storvikingen: velges før man trykker «Sett ut viking». Tilbakestilles hver tur.
let brukStor = false;
$('storviking').addEventListener('click', () => {
  brukStor = !brukStor;
  $('storviking').classList.toggle('valgt', brukStor);
  $('storviking').textContent = brukStor ? 'Storvikingen er valgt' : 'Bruk storvikingen';
});

// Bare verten (den første spilleren) kan starte, og må bekrefte at alle er klare
$('start').addEventListener('click', () => {
  $('navn').blur();
  visBekreftListe();
  $('bekreft-start').showModal();
});
$('bekreft-nei').addEventListener('click', () => $('bekreft-start').close());
$('bekreft-ja').addEventListener('click', () => {
  $('bekreft-start').close();
  socket.emit('mobil:start');
});

function visBekreftListe() {
  $('bekreft-liste').replaceChildren(
    ...rom.spillere.map((s) => {
      const li = elementFra(`<li><span class="prikk" style="background:${s.farge}"></span><span></span><span class="hoyre"></span></li>`);
      li.children[1].textContent = s.navn;
      li.children[2].textContent = s.tilkoblet ? '' : 'frakoblet';
      return li;
    }),
  );
}

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
  // Farger som andre har valgt, er låst og viser hvem som har dem
  [...farger.children].forEach((b, i) => {
    const f = rom.farger[i];
    const eier = rom.spillere.find((s) => s.id !== meg.id && s.farge === f);
    b.classList.toggle('valgt', meg.farge === f);
    b.disabled = Boolean(eier);
    b.textContent = eier ? '🔒' : '';
    b.title = eier ? `Valgt av ${eier.navn}` : '';
    b.setAttribute('aria-label', eier ? `Opptatt, valgt av ${eier.navn}` : 'Velg farge');
  });

  $('plass-felt').hidden = rom.modus === 'tv'; // på bord og nettbrett sitter spillerne rundt brettet
  // Høyst to spillere per side av bordet
  for (const b of document.querySelectorAll('[data-plass]')) {
    b.classList.toggle('valgt', meg.plass === b.dataset.plass);
    b.disabled = rom.spillere.filter((s) => s.id !== meg.id && s.plass === b.dataset.plass).length >= 2;
  }

  $('spillerliste').replaceChildren(
    ...rom.spillere.map((s) => {
      const li = elementFra(`<li><span class="prikk" style="background:${s.farge}"></span><span></span><span class="hoyre"></span></li>`);
      li.children[1].textContent = s.navn;
      const merker = [s.id === rom.vertId ? 'starter' : '', s.id === meg.id ? 'deg' : '', s.tilkoblet ? '' : 'frakoblet'];
      li.children[2].textContent = merker.filter(Boolean).join(' · ');
      return li;
    }),
  );
  if ($('bekreft-start').open) visBekreftListe();

  visUtvidelser(meg);

  const erVert = meg.id === rom.vertId;
  const vert = rom.spillere.find((s) => s.id === rom.vertId);
  const nok = rom.spillere.length >= rom.minSpillere;
  const plass = rom.maksSpillere - rom.spillere.length;
  $('start').hidden = !erVert;
  $('start').disabled = !nok;
  if (!nok) $('start-hjelp').textContent = 'Venter på at minst én spiller til skal skanne QR-koden.';
  else if (erVert) $('start-hjelp').textContent = plass ? `Det er plass til ${plass} til. Start når alle som skal være med, er klare.` : 'Alle plassene er tatt.';
  else $('start-hjelp').textContent = `Skriv navnet ditt og velg farge. ${vert?.navn ?? 'Verten'} starter spillet når alle er klare.`;
}

// Verten krysser av for utvidelser. De andre ser hva som er valgt.
function visUtvidelser(meg) {
  const erVert = meg.id === rom.vertId;
  const liste = $('utvidelser');
  if (liste.children.length !== rom.katalog.utvidelser.length) {
    liste.replaceChildren(...rom.katalog.utvidelser.map((u) => {
      const rad = elementFra(`<label class="utvidelse"><input type="checkbox"><span><b></b> <small></small><br><em></em></span></label>`);
      rad.querySelector('input').value = u.id;
      rad.querySelector('b').textContent = u.navn;
      rad.querySelector('small').textContent = `+${u.antall} brikker`;
      rad.querySelector('em').textContent = u.om;
      rad.querySelector('input').addEventListener('change', () => {
        const valgt = [...liste.querySelectorAll('input:checked')].map((i) => i.value);
        socket.emit('mobil:utvidelser', valgt);
      });
      return rad;
    }));
  }
  for (const input of liste.querySelectorAll('input')) {
    input.checked = rom.utvidelser.includes(input.value);
    input.disabled = !erVert;
  }
  const valgte = rom.katalog.utvidelser.filter((u) => rom.utvidelser.includes(u.id));
  const sum = rom.katalog.grunn + valgte.reduce((a, u) => a + u.antall, 0);
  $('brikketall').textContent = valgte.length
    ? `${[rom.katalog.grunn, ...valgte.map((u) => u.antall)].join(' + ')} = ${sum} brikker`
    : `${sum} brikker (grunnspillet)${erVert ? '' : ' · verten velger utvidelser'}`;
}

// ---------- Spillet ----------

for (const knapp of document.querySelectorAll('[data-retning]')) {
  knapp.addEventListener('click', () => handling({ type: 'flytt', retning: knapp.dataset.retning }));
}
$('roter').addEventListener('click', () => handling({ type: 'roter' }));
$('neste').addEventListener('click', () => handling({ type: 'neste' }));
$('legg').addEventListener('click', () => handling({ type: 'legg' }));
$('ingen-viking').addEventListener('click', () => handling({ type: 'viking', del: null }));
for (const knapp of document.querySelectorAll('[data-figur]')) {
  knapp.addEventListener('click', () => handling({ type: 'figur', figur: knapp.dataset.figur }));
}
$('sett-viking').addEventListener('click', () => {
  const jeg = rom.spill.spillere.find((s) => s.id === spillerId);
  handling({ type: 'viking', del: rom.spill.aktiv?.valgtDel ?? null, stor: brukStor || jeg.vikinger === 0 });
});
$('nytt-spill').addEventListener('click', () => socket.emit('mobil:nytt-spill'));
$('angre-brikke').addEventListener('click', () => handling({ type: 'angre' }));
$('trekk').addEventListener('click', () => handling({ type: 'trekk' }));
// Hjelp om brikken: vises bare på mobilen. Brikken vises med nord øverst, så kantene
// i teksten stemmer med bildet.
$('hjelp').addEventListener('click', () => {
  const { id, nr } = rom.spill.aktiv.brikke;
  $('brikkehjelp-bilde').src = brikkeUrl(id, nr);
  $('brikkehjelp-innhold').innerHTML = brikkeTekst(id);
  $('brikkehjelp').dataset.brikke = id;
  $('brikkehjelp').showModal();
});
$('brikkehjelp-lukk').addEventListener('click', () => $('brikkehjelp').close());
$('angre-trekk').addEventListener('click', () => handling({ type: 'angre' }));
$('hopp-over').addEventListener('click', () => socket.emit('mobil:hopp-over'));
$('avslutt').addEventListener('click', () => $('bekreft-avslutt').showModal());
$('avslutt-nei').addEventListener('click', () => $('bekreft-avslutt').close());
$('avslutt-ja').addEventListener('click', () => {
  $('bekreft-avslutt').close();
  socket.emit('spill:avslutt');
});

// Tastatur, praktisk for testing på PC
const TASTER = { ArrowUp: 'opp', ArrowDown: 'ned', ArrowLeft: 'venstre', ArrowRight: 'hoyre' };
document.addEventListener('keydown', (e) => {
  if (!rom?.spill || document.activeElement === $('navn')) return;
  if (TASTER[e.key]) handling({ type: 'flytt', retning: TASTER[e.key] });
  else if (e.key === 'r' || e.key === ' ') handling({ type: 'roter' });
  else if (e.key === 'n') handling({ type: 'neste' });
  else if (e.key === 'Enter') ({ viking: $('sett-viking'), trekk: $('trekk') }[rom.spill.fase] ?? $('legg')).click();
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
  $('avslutt').hidden = meg.id !== rom.vertId;
  $('min-farge').style.background = jeg.farge;
  $('mitt-navn').textContent = jeg.navn;
  $('mine-poeng').textContent = jeg.poeng;
  const handel = spill.utvidelser?.includes('handel');
  $('mine-vikinger').innerHTML = `${vikingSvg(jeg.farge)} ${jeg.vikinger}` +
    (spill.utvidelser?.includes('gjestgiveri') ? ` <span class="stor">${vikingSvg(jeg.farge)}</span> ${jeg.storvikinger}` : '') +
    (handel ? ` ${figurSvg('bygg', jeg.farge)} ${jeg.byggmestere} ${figurSvg('hone', jeg.farge)} ${jeg.honer}` : '');
  $('mine-varer').hidden = !handel;
  if (handel) $('mine-varer').innerHTML = Object.keys(VARER).map((v) => `${vareSvg(v)}${jeg.varer[v]}`).join(' ');

  const aktiv = spill.aktiv;
  const navnPaaTur = spill.spillere[spill.tur].navn;
  const status = $('status');
  status.classList.toggle('din-tur', harTur);
  if (harTur && spill.fase === 'trekk' && spill.ekstraTur) status.textContent = 'Byggmesteren gir deg en ekstra tur! Trekk en brikke til.';
  else if (harTur && spill.fase === 'trekk') status.textContent = 'Din tur! Trekk en brikke.';
  else if (spill.fase === 'trekk') status.textContent = `${navnPaaTur} skal trekke …`;
  else if (harTur && spill.fase === 'legg') status.textContent = aktiv.passer ? 'Din tur! Brikken passer her.' : 'Din tur! Flytt eller roter brikken.';
  else if (harTur) status.textContent = handel ? 'Vil du sette ut en figur?' : 'Vil du sette ut en viking?';
  else status.textContent = `${navnPaaTur} sin tur …`;

  if (harTur && !haddeTur) navigator.vibrate?.([60, 40, 60]);
  if (!(harTur && spill.fase === 'viking') && brukStor) $('storviking').click(); // ny tur: vanlig viking igjen
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
        const b = elementFra(`<button class="${aktiv.valgtDel === d ? 'valgt' : ''}">${figurSvg(aktiv.figur, jeg.farge)}</button>`);
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

  // Den som la siste brikke, kan angre trekket til neste spiller har trukket sin
  $('trekk-kontroll').hidden = !(harTur && spill.fase === 'trekk');
  $('hjelp').hidden = !(harTur && aktiv);
  // Hjelpen lukkes av seg selv når turen går videre
  if ($('brikkehjelp').open && (!harTur || aktiv?.brikke.id !== $('brikkehjelp').dataset.brikke)) $('brikkehjelp').close();
  // På den ekstra turen fra byggmesteren kan spilleren også angre forrige brikke
  $('angre-trekk').hidden = !(spill.kanAngre === i && (!harTur || spill.fase === 'trekk'));
  $('legg-kontroll').hidden = !(harTur && spill.fase === 'legg');
  $('viking-kontroll').hidden = !(harTur && spill.fase === 'viking');
  $('legg').disabled = !aktiv?.passer;
  $('sett-viking').disabled = aktiv?.valgtDel == null;
  // Handel og håndverk: velg om du vil sette ut viking, byggmester eller høne
  const figur = aktiv?.figur ?? 'viking';
  // Knappene vises bare når byggmesteren eller høna kan stå et sted på brikken
  const kanVelge = spill.figurValg?.bygg || spill.figurValg?.hone;
  $('figurvalg').hidden = !(handel && harTur && spill.fase === 'viking' && kanVelge);
  for (const knapp of document.querySelectorAll('[data-figur]')) {
    const f = knapp.dataset.figur;
    knapp.classList.toggle('valgt', f === figur);
    knapp.disabled = !spill.figurValg?.[f];
    if (knapp.dataset.farge !== jeg.farge) {
      knapp.innerHTML = `${figurSvg(f, jeg.farge)}<span>${FIGURNAVN[f]}</span>`;
      knapp.dataset.farge = jeg.farge;
    }
  }
  $('sett-viking').textContent = { viking: 'Sett ut viking', bygg: 'Sett ut byggmesteren', hone: 'Sett ut høna' }[figur];
  $('ingen-viking').textContent = handel ? 'Ingen figur' : 'Ingen viking';
  $('viking-hjelp').textContent = {
    viking: 'Trykk på et punkt på brikken for å velge hvor vikingen skal stå.',
    bygg: 'Byggmesteren står i en vei eller borg der du har en viking. Legger du en brikke der senere, får du en ekstra tur.',
    hone: 'Høna går i en eng der du har en viking. Vinner du enga, får du 4 poeng per ferdig borg i stedet for 3.',
  }[figur];
  // Storvikingen kan velges når den er hjemme; har man bare den igjen, brukes den uansett
  $('storviking').hidden = !(harTur && spill.fase === 'viking' && figur === 'viking' && jeg.storvikinger > 0 && jeg.vikinger > 0);
}

function visSlutt(meg) {
  visSide('slutt');
  const spill = rom.spill;
  // Resultatet vises først når skjermen er ferdig med opptellingen; verten kan hoppe over
  const telles = rom.opptelling === 'pågår';
  $('telles').hidden = !telles;
  $('hopp-over').hidden = meg.id !== rom.vertId;
  $('sluttresultat').hidden = telles;
  const rangert = spill.spillere.map((s, i) => ({ ...s, i })).sort((a, b) => b.poeng - a.poeng);
  $('resultat').replaceChildren(
    ...rangert.map((s) => {
      const li = elementFra(`<li><span class="prikk" style="background:${s.farge}"></span><span></span><span class="hoyre"></span></li>`);
      li.children[1].textContent = (spill.resultat?.vinnere.includes(s.i) ? '👑 ' : '') + s.navn;
      const underveis = Object.values(s.underveis).reduce((a, b) => a + b, 0);
      li.children[2].textContent = `${s.poeng} poeng (${underveis} + ${s.poeng - underveis} på slutten)`;
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
  if (!rom.spill && $('bekreft-avslutt').open) $('bekreft-avslutt').close();
  if (!rom.spill) visOppsett(meg);
  else if (rom.spill.fase === 'slutt') visSlutt(meg);
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
