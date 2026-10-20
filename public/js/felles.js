// Felles hjelpere for storskjermen, mobilen og galleriet.

import { tegnBrikke, vareSymbol } from '/delt/tegning.js';
import { VARER } from '/delt/brikker.js';

let bilder = {};
const plassholdere = {};

// Henter listen over malte brikkebilder fra serveren
export async function lastBilder() {
  try {
    bilder = await (await fetch('/api/bilder')).json();
  } catch {
    bilder = {};
  }
  return bilder;
}

export function harMalt(id) {
  return Boolean(bilder[id]?.length);
}

// Bilde-URL for en brikke. Malt bilde hvis det finnes, ellers plassholder-SVG.
// Varianter (A_2.jpg …) fordeles etter brikkens nummer.
export function brikkeUrl(id, nr = 0) {
  const varianter = bilder[id];
  if (varianter?.length) return `/kunst/brikker/${varianter[nr % varianter.length]}`;
  plassholdere[id] ??= `data:image/svg+xml;charset=utf-8,${encodeURIComponent(tegnBrikke(id, 'plassholder'))}`;
  return plassholdere[id];
}

// Vikingfigur (spillebrikke) i spillerens farge. Liggende viking står i enga.
export function vikingSvg(farge, liggende = false) {
  const kropp =
    'M50 6C58 6 64 12 64 20C64 26 61 30 57 32L80 38C92 41 96 50 92 56C90 59 86 59 80 57L68 54L80 92C81 95 79 97 76 97L60 97L50 76L40 97L24 97C21 97 19 95 20 92L32 54L20 57C14 59 10 59 8 56C4 50 8 41 20 38L43 32C39 30 36 26 36 20C36 12 42 6 50 6Z';
  const hjelm = 'M35 20C35 10 42 4 50 4C58 4 65 10 65 20Z';
  return (
    `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">` +
    `<g transform="${liggende ? 'rotate(-90 50 50)' : ''}">` +
    `<path d="${kropp}" fill="none" stroke="#fff" stroke-width="10" stroke-linejoin="round"/>` +
    `<path d="${kropp}" fill="${farge}" stroke="#111" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="${hjelm}" fill="#9aa1a8" stroke="#111" stroke-width="3"/>` +
    `<rect x="48" y="16" width="4" height="12" fill="#5d6368"/>` +
    `</g></svg>`
  );
}

// Byggmesteren (Handel og håndverk): en figur i spillerens farge med en stor hammer
export function byggmesterSvg(farge) {
  const kropp = 'M50 8C58 8 63 14 63 21C63 27 60 31 56 33L70 38C78 41 80 48 78 56L74 96H26L22 56C20 48 22 41 30 38L44 33C40 31 37 27 37 21C37 14 42 8 50 8Z';
  return (
    `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">` +
    `<g transform="translate(-9 0)">` +
    `<path d="${kropp}" fill="none" stroke="#fff" stroke-width="10" stroke-linejoin="round"/>` +
    `<path d="${kropp}" fill="${farge}" stroke="#111" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M37 19C37 11 43 6 50 6C57 6 63 11 63 19C56 16 44 16 37 19Z" fill="#7a5a3a" stroke="#111" stroke-width="3"/></g>` +
    `<rect x="78" y="22" width="8" height="70" rx="3" fill="#8a5a2a" stroke="#fff" stroke-width="7"/>` +
    `<rect x="66" y="10" width="30" height="18" rx="3" fill="#9aa1a8" stroke="#fff" stroke-width="7"/>` +
    `<rect x="78" y="22" width="8" height="70" rx="3" fill="#8a5a2a" stroke="#111" stroke-width="3"/>` +
    `<rect x="66" y="10" width="30" height="18" rx="3" fill="#9aa1a8" stroke="#111" stroke-width="3.5"/>` +
    `</svg>`
  );
}

// Høna (Handel og håndverk): en liten, sort og luftig dvergkochin med fjær på føttene.
// Ringen rundt føttene viser hvem som eier henne.
export function honeSvg(farge) {
  return (
    `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">` +
    `<ellipse cx="50" cy="88" rx="34" ry="9" fill="${farge}" stroke="#fff" stroke-width="4"/>` +
    `<path d="M20 58C14 40 26 24 44 26C46 16 56 10 66 14C76 18 78 30 72 36C84 40 88 56 80 68C74 80 56 84 42 82C30 80 22 70 20 58Z" fill="none" stroke="#fff" stroke-width="9" stroke-linejoin="round"/>` +
    `<path d="M20 58C14 40 26 24 44 26C46 16 56 10 66 14C76 18 78 30 72 36C84 40 88 56 80 68C74 80 56 84 42 82C30 80 22 70 20 58Z" fill="#17171b" stroke="#000" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M24 44C20 34 26 26 34 28" fill="none" stroke="#3a3f52" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M40 56C50 50 62 52 66 62" fill="none" stroke="#33384a" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M58 12C60 4 66 6 66 10C68 4 74 6 72 12C76 10 78 16 72 18Z" fill="#d32f2f" stroke="#000" stroke-width="2"/>` +
    `<path d="M74 22L84 25L74 28Z" fill="#e8b84a" stroke="#000" stroke-width="2"/>` +
    `<path d="M73 30C76 34 74 38 70 36Z" fill="#d32f2f"/>` +
    `<circle cx="68" cy="21" r="2.6" fill="#f2c94c"/>` +
    `<path d="M40 82L36 90M60 82L64 90" stroke="#17171b" stroke-width="8" stroke-linecap="round"/>` +
    `</svg>`
  );
}

// Vareikonet til spillerpanelene og mobilen
export function vareSvg(vare) {
  return `<svg viewBox="-55 -55 110 110" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${VARER[vare]}">${vareSymbol(vare)}</svg>`;
}

// Figuren som tegnes for en viking, byggmester eller høne
export function figurSvg(figur, farge, liggende = false) {
  if (figur === 'bygg') return byggmesterSvg(farge);
  if (figur === 'hone') return honeSvg(farge);
  return vikingSvg(farge, liggende);
}

export const FIGURNAVN = { viking: 'Viking', bygg: 'Byggmester', hone: 'Høne' };

// Hvor mange grader brettet må snus for å se riktig ut fra en side av bordet
export const PLASS_GRADER = { S: 0, V: -90, N: 180, Ø: 90 };

export const PLASS_NAVN = { S: 'Sør', N: 'Nord', V: 'Vest', Ø: 'Øst' };

export const GRUNN = { borg: 'Borg', vei: 'Vei', hov: 'Hov', eng: 'Eng', varer: 'Varer' };

export function elementFra(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
