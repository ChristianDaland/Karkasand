// Spillveiledningen: bygger brikkelisten fra brikkedataene, slik at antall, kanter
// og områder alltid stemmer med spillet. Tekstene om brikkene står i brikkehjelp.js.

import { BRIKKER, UTVIDELSER } from '/delt/brikker.js';
import { lastBilder, brikkeUrl, vikingSvg, elementFra } from './felles.js';
import { brikkeTekst } from './brikkehjelp.js';

await lastBilder();
document.getElementById('viking-bilde').innerHTML = vikingSvg('#1e88e5');

// Grunnspillet først, så én seksjon per utvidelse
const seksjoner = [{ id: 'grunn', navn: 'Grunnspillet', om: '' }, ...UTVIDELSER];
for (const seksjon of seksjoner) {
  const brikker = BRIKKER.filter((b) => (b.utvidelse ?? 'grunn') === seksjon.id);
  const antall = brikker.reduce((a, b) => a + b.antall, 0);
  const overskrift = elementFra(`<div class="seksjon" id="seksjon-${seksjon.id}"><h3></h3><p class="dempet"></p></div>`);
  overskrift.querySelector('h3').textContent = `${seksjon.navn} · ${antall} brikker`;
  overskrift.querySelector('p').textContent = seksjon.om;
  document.getElementById('brikker').append(overskrift);
  for (const b of brikker) visBrikke(b);
}

function visBrikke(b) {
  const kort = elementFra(`
    <article class="brikke" id="brikke-${b.id}">
      <img alt="" loading="lazy" src="${brikkeUrl(b.id)}">
      <div>${brikkeTekst(b.id)}</div>
    </article>`);
  kort.querySelector('img').alt = b.navn;
  document.getElementById('brikker').append(kort);
}
