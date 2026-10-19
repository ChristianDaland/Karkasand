// Galleriet: viser alle brikketypene og et tilfeldig ferdigspilt brett for å sjekke kantene.

import { BRIKKER, UTVIDELSER } from '/delt/brikker.js';
import { Spill } from '/delt/motor.js';
import { BrettVisning } from './brett.js';
import { lastBilder, brikkeUrl, harMalt, elementFra } from './felles.js';

const $ = (id) => document.getElementById(id);

await lastBilder();

for (const b of BRIKKER) {
  const fig = elementFra(`
    <figure>
      <img alt="" src="${brikkeUrl(b.id)}">
      <figcaption><span class="merke ${harMalt(b.id) ? 'malt' : ''}">${harMalt(b.id) ? 'malt' : 'plassholder'}</span>
        <b>${b.id}</b> <span></span><br><small>${b.antall} stk</small></figcaption>
    </figure>`);
  fig.querySelector('figcaption span:not(.merke)').textContent = b.navn;
  $('liste').append(fig);
}

const visning = new BrettVisning($('test-brett'), { maksSkala: 1.6 });
const spillere = [{ navn: 'Rød', farge: '#e53935' }, { navn: 'Blå', farge: '#1e88e5' }];

// Spill et parti med tilfeldige trekk, med alle utvidelsene. Vi stopper før sluttellingen, så vikingene blir stående.
function tilfeldigBrett() {
  const spill = new Spill(spillere, { utvidelser: UTVIDELSER.map((u) => u.id) });
  const medVikinger = $('vis-vikinger').checked;
  while (spill.fase !== 'slutt' && spill.bunke.length > 0) {
    if (spill.fase === 'trekk') spill.trekkBrikke();
    if (spill.fase !== 'legg') break;
    const plasser = spill.gyldigePlasser(spill.aktiv.brikke.id);
    const p = plasser[Math.floor(Math.random() * plasser.length)];
    Object.assign(spill.aktiv, { x: p.x, y: p.y, rot: p.rot[Math.floor(Math.random() * p.rot.length)] });
    spill.legg();
    if (spill.fase === 'viking') {
      const deler = spill.vikingDeler();
      const del = medVikinger && deler.length && Math.random() < 0.4 ? deler[Math.floor(Math.random() * deler.length)] : null;
      spill.settViking(del);
    }
  }
  visning.oppdater({ ...spill.tilstand(), aktiv: null, hint: [] }, spillere, { animer: false });
}

$('nytt-brett').addEventListener('click', tilfeldigBrett);
$('vis-vikinger').addEventListener('change', tilfeldigBrett);
tilfeldigBrett();
