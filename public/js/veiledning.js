// Spillveiledningen: bygger brikkelisten fra brikkedataene, slik at antall, kanter
// og områder alltid stemmer med spillet. Beskrivelsene av motivene står her.

import { BRIKKER } from '/delt/brikker.js';
import { lastBilder, brikkeUrl, vikingSvg, elementFra } from './felles.js';

const OM = {
  A: 'Et hov – gudehuset – med dragehoder på gavlene, en stor ask og et offeralter. Veien fra sør ender ved døra.',
  B: 'Et hov i en lund av bjørk og ask, omgitt av en steinsetting. Ingen vei, bare eng rundt.',
  C: 'Midt inne i en stor borg. Langhus med torvtak står tett rundt en runestein. Borgen fortsetter på alle fire kanter.',
  D: 'En borgkappe med palisade i nord og en rett vei tvers over brikken. Spillet starter alltid med denne brikken.',
  E: 'En borgkappe med palisade i nord. Resten er eng, gjerne med sauer og en steingard.',
  F: 'En borg som går tvers over brikken fra vest til øst, med en runestein i midten. Palisadene buer inn mot nord og sør.',
  G: 'En borg som går tvers over brikken fra nord til sør. Palisadene buer inn mot øst og vest.',
  H: 'To små borger, én i nord og én i sør, hver med sin palisade. Mellom dem ligger en åker. De to borgene henger ikke sammen.',
  I: 'To små borger i nord og øst som møtes i hjørnet uten å henge sammen. Resten er eng.',
  J: 'En borgkappe i nord og en vei som svinger fra øst til sør.',
  K: 'En borgkappe i nord og en vei som svinger fra vest til sør.',
  L: 'En borgkappe i nord. Tre veier møtes i et tun med brønn midt på brikken.',
  M: 'En borg som dekker den nordvestlige halvdelen, med en runestein. Palisaden går på skrå fra hjørne til hjørne.',
  N: 'Samme som M, men uten runestein.',
  O: 'Som M, med runestein, og i tillegg en vei som svinger gjennom enga i sørøst.',
  P: 'Samme som O, men uten runestein.',
  Q: 'En stor borg som dekker nord, øst og vest, med en runestein på tunet. Palisaden buer inn mot enga i sør.',
  R: 'Samme som Q, men uten runestein.',
  S: 'En stor borg med runestein. Veien fra sør går gjennom en port i palisaden og ender inne i borgen.',
  T: 'Samme som S, men uten runestein.',
  U: 'En rett ferdavei fra nord til sør gjennom lyngkledd eng.',
  V: 'En vei som svinger fra vest til sør. Det finnes flest av denne brikken.',
  W: 'Tre veier møtes ved et lite tun. Hver vei ender her.',
  X: 'Fire veier møtes ved en brønn midt på brikken. Hver vei ender her.',
};

const KANT = { borg: 'borg', vei: 'vei', eng: 'eng' };

// Det spilleren må vite om områdene på brikken, utledet fra brikkedataene
function egenskaper(b) {
  const borger = b.deler.filter((d) => d.type === 'borg');
  const veier = b.deler.filter((d) => d.type === 'vei');
  const linjer = [];
  if (borger.length) {
    const rune = borger.some((d) => d.runestein);
    linjer.push(`<span class="type borg">Borg</span> ${borger.length > 1 ? 'To adskilte borger som hver er et eget område. ' : ''}Ferdig borg: 2 p per brikke. Uferdig ved slutt: 1 p per brikke.`);
    if (rune) linjer.push('<span class="type rune">Runestein</span> Borgen gir 2 ekstra poeng når den er ferdig (1 hvis den er uferdig ved slutt).');
  }
  if (veier.length) {
    // En veidel med bare én port går inn fra kanten og stopper på brikken
    const ender = veier.filter((d) => d.porter.length === 1).length;
    const tekst = ender > 1 ? ` ${ender} veier ender her.` : ender === 1 ? ' Veien ender på denne brikken.' : '';
    linjer.push(`<span class="type vei">Vei</span> 1 p per brikke.${tekst}`);
  }
  if (b.deler.some((d) => d.type === 'hov')) {
    linjer.push('<span class="type hov">Hov</span> 9 p når alle de 8 rutene rundt er fylt. Ellers 1 p + 1 per nabo ved slutt.');
  }
  const enger = b.deler.filter((d) => d.type === 'eng');
  if (enger.length) {
    const grenser = enger.some((d) => d.borger.length);
    linjer.push(`<span class="type eng">Eng</span> Ved slutt: 3 p per ferdig borg enga grenser til.${grenser ? ' Enga her grenser til borgen på brikken.' : ''}`);
  }
  return linjer;
}

await lastBilder();
document.getElementById('viking-bilde').innerHTML = vikingSvg('#1e88e5');

for (const b of BRIKKER) {
  const kort = elementFra(`
    <article class="brikke" id="brikke-${b.id}">
      <img alt="" loading="lazy" src="${brikkeUrl(b.id)}">
      <div>
        <h3>${b.id} – ${b.navn}</h3>
        <p class="fakta">${b.antall} stk · kanter: ${b.kanter.map((k) => KANT[k]).join(' / ')}${b.start ? ' · startbrikke' : ''}</p>
        <p>${OM[b.id]}</p>
        <ul>${egenskaper(b).map((l) => `<li>${l}</li>`).join('')}</ul>
      </div>
    </article>`);
  kort.querySelector('img').alt = `${b.navn}`;
  document.getElementById('brikker').append(kort);
}
