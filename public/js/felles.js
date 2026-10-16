// Felles hjelpere for storskjermen, mobilen og galleriet.

import { tegnBrikke } from '/delt/tegning.js';

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

// Hvor mange grader brettet må snus for å se riktig ut fra en side av bordet
export const PLASS_GRADER = { S: 0, V: -90, N: 180, Ø: 90 };

export const PLASS_NAVN = { S: 'Sør', N: 'Nord', V: 'Vest', Ø: 'Øst' };

export const GRUNN = { borg: 'Borg', vei: 'Vei', hov: 'Hov', eng: 'Eng' };

export function elementFra(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
