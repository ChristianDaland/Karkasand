// Brikketypene i Karkasand, tegnet med nord øverst.
//
// kanter: [nord, øst, sør, vest], hver av dem 'borg', 'vei' eller 'eng'.
//
// deler: de sammenhengende områdene på brikken. Hver kant er delt i tre
// porter, nummerert 0–2 med klokka rundt brikken:
//   N0 = vestre del av nordkanten,  N2 = østre del
//   Ø0 = nordre del av østkanten,   Ø2 = søndre del
//   S0 = østre del av sørkanten,    S2 = vestre del
//   V0 = søndre del av vestkanten,  V2 = nordre del
// En vei bruker alltid midtporten (1). En borg på en kant bruker alle tre.
//   punkt:     hvor en viking står på delen (0–1, kanonisk retning)
//   borger:    for eng: indeksene til borgdelene enga grenser til
//   runestein: borgdelen har en runestein (bonuspoeng)

const alle = (side) => [`${side}0`, `${side}1`, `${side}2`];

export const BRIKKER = [
  {
    id: 'A', navn: 'Hov ved veien', antall: 2, kanter: ['eng', 'eng', 'vei', 'eng'],
    deler: [
      { type: 'hov', porter: [], punkt: [0.5, 0.46] },
      { type: 'vei', porter: ['S1'], punkt: [0.5, 0.86] },
      { type: 'eng', porter: [...alle('N'), ...alle('Ø'), 'S0', 'S2', ...alle('V')], punkt: [0.17, 0.62], borger: [] },
    ],
  },
  {
    id: 'B', navn: 'Hovet i lunden', antall: 4, kanter: ['eng', 'eng', 'eng', 'eng'],
    deler: [
      { type: 'hov', porter: [], punkt: [0.5, 0.5] },
      { type: 'eng', porter: [...alle('N'), ...alle('Ø'), ...alle('S'), ...alle('V')], punkt: [0.5, 0.88], borger: [] },
    ],
  },
  {
    id: 'C', navn: 'Storborgen', antall: 1, kanter: ['borg', 'borg', 'borg', 'borg'],
    deler: [
      { type: 'borg', porter: [...alle('N'), ...alle('Ø'), ...alle('S'), ...alle('V')], punkt: [0.5, 0.33], runestein: true },
    ],
  },
  {
    id: 'D', navn: 'Borgveien', antall: 4, kanter: ['borg', 'vei', 'eng', 'vei'], start: true,
    deler: [
      { type: 'borg', porter: alle('N'), punkt: [0.5, 0.13] },
      { type: 'vei', porter: ['Ø1', 'V1'], punkt: [0.36, 0.5] },
      { type: 'eng', porter: ['Ø0', 'V2'], punkt: [0.66, 0.36], borger: [0] },
      { type: 'eng', porter: ['Ø2', ...alle('S'), 'V0'], punkt: [0.4, 0.8], borger: [] },
    ],
  },
  {
    id: 'E', navn: 'Palisaden', antall: 5, kanter: ['borg', 'eng', 'eng', 'eng'],
    deler: [
      { type: 'borg', porter: alle('N'), punkt: [0.5, 0.13] },
      { type: 'eng', porter: [...alle('Ø'), ...alle('S'), ...alle('V')], punkt: [0.5, 0.66], borger: [0] },
    ],
  },
  {
    id: 'F', navn: 'Runeborgen på tvers', antall: 2, kanter: ['eng', 'borg', 'eng', 'borg'],
    deler: [
      { type: 'borg', porter: [...alle('Ø'), ...alle('V')], punkt: [0.36, 0.5], runestein: true },
      { type: 'eng', porter: alle('N'), punkt: [0.5, 0.1], borger: [0] },
      { type: 'eng', porter: alle('S'), punkt: [0.5, 0.9], borger: [0] },
    ],
  },
  {
    id: 'G', navn: 'Borgen på tvers', antall: 1, kanter: ['borg', 'eng', 'borg', 'eng'],
    deler: [
      { type: 'borg', porter: [...alle('N'), ...alle('S')], punkt: [0.5, 0.5] },
      { type: 'eng', porter: alle('Ø'), punkt: [0.9, 0.5], borger: [0] },
      { type: 'eng', porter: alle('V'), punkt: [0.1, 0.5], borger: [0] },
    ],
  },
  {
    id: 'H', navn: 'To naboborger', antall: 3, kanter: ['borg', 'eng', 'borg', 'eng'],
    deler: [
      { type: 'borg', porter: alle('N'), punkt: [0.5, 0.12] },
      { type: 'borg', porter: alle('S'), punkt: [0.5, 0.88] },
      { type: 'eng', porter: [...alle('Ø'), ...alle('V')], punkt: [0.27, 0.5], borger: [0, 1] },
    ],
  },
  {
    id: 'I', navn: 'Hjørneborgene', antall: 2, kanter: ['borg', 'borg', 'eng', 'eng'],
    deler: [
      { type: 'borg', porter: alle('N'), punkt: [0.4, 0.12] },
      { type: 'borg', porter: alle('Ø'), punkt: [0.88, 0.6] },
      { type: 'eng', porter: [...alle('S'), ...alle('V')], punkt: [0.3, 0.62], borger: [0, 1] },
    ],
  },
  {
    id: 'J', navn: 'Borg og høyresving', antall: 3, kanter: ['borg', 'vei', 'vei', 'eng'],
    deler: [
      { type: 'borg', porter: alle('N'), punkt: [0.5, 0.13] },
      { type: 'vei', porter: ['Ø1', 'S1'], punkt: [0.625, 0.625] },
      { type: 'eng', porter: ['Ø2', 'S0'], punkt: [0.86, 0.86], borger: [] },
      { type: 'eng', porter: ['Ø0', 'S2', ...alle('V')], punkt: [0.3, 0.55], borger: [0] },
    ],
  },
  {
    id: 'K', navn: 'Borg og venstresving', antall: 3, kanter: ['borg', 'eng', 'vei', 'vei'],
    deler: [
      { type: 'borg', porter: alle('N'), punkt: [0.5, 0.13] },
      { type: 'vei', porter: ['S1', 'V1'], punkt: [0.375, 0.625] },
      { type: 'eng', porter: ['S2', 'V0'], punkt: [0.14, 0.86], borger: [] },
      { type: 'eng', porter: [...alle('Ø'), 'S0', 'V2'], punkt: [0.7, 0.55], borger: [0] },
    ],
  },
  {
    id: 'L', navn: 'Tunet under borgen', antall: 3, kanter: ['borg', 'vei', 'vei', 'vei'],
    deler: [
      { type: 'borg', porter: alle('N'), punkt: [0.5, 0.13] },
      { type: 'vei', porter: ['Ø1'], punkt: [0.82, 0.5] },
      { type: 'vei', porter: ['S1'], punkt: [0.5, 0.82] },
      { type: 'vei', porter: ['V1'], punkt: [0.18, 0.5] },
      { type: 'eng', porter: ['Ø0', 'V2'], punkt: [0.3, 0.36], borger: [0] },
      { type: 'eng', porter: ['Ø2', 'S0'], punkt: [0.78, 0.78], borger: [] },
      { type: 'eng', porter: ['S2', 'V0'], punkt: [0.22, 0.78], borger: [] },
    ],
  },
  {
    id: 'M', navn: 'Runeborgen i hjørnet', antall: 2, kanter: ['borg', 'eng', 'eng', 'borg'],
    deler: [
      { type: 'borg', porter: [...alle('N'), ...alle('V')], punkt: [0.44, 0.33], runestein: true },
      { type: 'eng', porter: [...alle('Ø'), ...alle('S')], punkt: [0.78, 0.72], borger: [0] },
    ],
  },
  {
    id: 'N', navn: 'Hjørneborgen', antall: 3, kanter: ['borg', 'eng', 'eng', 'borg'],
    deler: [
      { type: 'borg', porter: [...alle('N'), ...alle('V')], punkt: [0.25, 0.25] },
      { type: 'eng', porter: [...alle('Ø'), ...alle('S')], punkt: [0.78, 0.72], borger: [0] },
    ],
  },
  {
    id: 'O', navn: 'Runeborg med vei', antall: 2, kanter: ['borg', 'vei', 'vei', 'borg'],
    deler: [
      { type: 'borg', porter: [...alle('N'), ...alle('V')], punkt: [0.44, 0.33], runestein: true },
      { type: 'vei', porter: ['Ø1', 'S1'], punkt: [0.717, 0.717] },
      { type: 'eng', porter: ['Ø2', 'S0'], punkt: [0.9, 0.9], borger: [] },
      { type: 'eng', porter: ['Ø0', 'S2'], punkt: [0.9, 0.36], borger: [0] },
    ],
  },
  {
    id: 'P', navn: 'Hjørneborg med vei', antall: 3, kanter: ['borg', 'vei', 'vei', 'borg'],
    deler: [
      { type: 'borg', porter: [...alle('N'), ...alle('V')], punkt: [0.25, 0.25] },
      { type: 'vei', porter: ['Ø1', 'S1'], punkt: [0.717, 0.717] },
      { type: 'eng', porter: ['Ø2', 'S0'], punkt: [0.9, 0.9], borger: [] },
      { type: 'eng', porter: ['Ø0', 'S2'], punkt: [0.9, 0.36], borger: [0] },
    ],
  },
  {
    id: 'Q', navn: 'Runeborgen ved enga', antall: 1, kanter: ['borg', 'borg', 'eng', 'borg'],
    deler: [
      { type: 'borg', porter: [...alle('N'), ...alle('Ø'), ...alle('V')], punkt: [0.5, 0.56], runestein: true },
      { type: 'eng', porter: alle('S'), punkt: [0.5, 0.9], borger: [0] },
    ],
  },
  {
    id: 'R', navn: 'Storgården', antall: 3, kanter: ['borg', 'borg', 'eng', 'borg'],
    deler: [
      { type: 'borg', porter: [...alle('N'), ...alle('Ø'), ...alle('V')], punkt: [0.5, 0.56] },
      { type: 'eng', porter: alle('S'), punkt: [0.5, 0.9], borger: [0] },
    ],
  },
  {
    id: 'S', navn: 'Runeporten', antall: 2, kanter: ['borg', 'borg', 'vei', 'borg'],
    deler: [
      { type: 'borg', porter: [...alle('N'), ...alle('Ø'), ...alle('V')], punkt: [0.5, 0.56], runestein: true },
      { type: 'vei', porter: ['S1'], punkt: [0.5, 0.88] },
      { type: 'eng', porter: ['S0'], punkt: [0.8, 0.92], borger: [0] },
      { type: 'eng', porter: ['S2'], punkt: [0.2, 0.92], borger: [0] },
    ],
  },
  {
    id: 'T', navn: 'Borgporten', antall: 1, kanter: ['borg', 'borg', 'vei', 'borg'],
    deler: [
      { type: 'borg', porter: [...alle('N'), ...alle('Ø'), ...alle('V')], punkt: [0.5, 0.56] },
      { type: 'vei', porter: ['S1'], punkt: [0.5, 0.88] },
      { type: 'eng', porter: ['S0'], punkt: [0.8, 0.92], borger: [0] },
      { type: 'eng', porter: ['S2'], punkt: [0.2, 0.92], borger: [0] },
    ],
  },
  {
    id: 'U', navn: 'Ferdaveien', antall: 8, kanter: ['vei', 'eng', 'vei', 'eng'],
    deler: [
      { type: 'vei', porter: ['N1', 'S1'], punkt: [0.5, 0.5] },
      { type: 'eng', porter: ['N2', ...alle('Ø'), 'S0'], punkt: [0.78, 0.5], borger: [] },
      { type: 'eng', porter: ['S2', ...alle('V'), 'N0'], punkt: [0.22, 0.5], borger: [] },
    ],
  },
  {
    id: 'V', navn: 'Svingen', antall: 9, kanter: ['eng', 'eng', 'vei', 'vei'],
    deler: [
      { type: 'vei', porter: ['S1', 'V1'], punkt: [0.375, 0.625] },
      { type: 'eng', porter: ['S2', 'V0'], punkt: [0.14, 0.86], borger: [] },
      { type: 'eng', porter: [...alle('N'), ...alle('Ø'), 'S0', 'V2'], punkt: [0.66, 0.4], borger: [] },
    ],
  },
  {
    id: 'W', navn: 'Veidelet', antall: 4, kanter: ['eng', 'vei', 'vei', 'vei'],
    deler: [
      { type: 'vei', porter: ['Ø1'], punkt: [0.82, 0.5] },
      { type: 'vei', porter: ['S1'], punkt: [0.5, 0.82] },
      { type: 'vei', porter: ['V1'], punkt: [0.18, 0.5] },
      { type: 'eng', porter: ['V2', ...alle('N'), 'Ø0'], punkt: [0.5, 0.36], borger: [] },
      { type: 'eng', porter: ['Ø2', 'S0'], punkt: [0.78, 0.78], borger: [] },
      { type: 'eng', porter: ['S2', 'V0'], punkt: [0.22, 0.78], borger: [] },
    ],
  },
  {
    id: 'X', navn: 'Krysset ved brønnen', antall: 1, kanter: ['vei', 'vei', 'vei', 'vei'],
    deler: [
      { type: 'vei', porter: ['N1'], punkt: [0.5, 0.18] },
      { type: 'vei', porter: ['Ø1'], punkt: [0.82, 0.5] },
      { type: 'vei', porter: ['S1'], punkt: [0.5, 0.82] },
      { type: 'vei', porter: ['V1'], punkt: [0.18, 0.5] },
      { type: 'eng', porter: ['N2', 'Ø0'], punkt: [0.8, 0.2], borger: [] },
      { type: 'eng', porter: ['Ø2', 'S0'], punkt: [0.8, 0.8], borger: [] },
      { type: 'eng', porter: ['S2', 'V0'], punkt: [0.2, 0.8], borger: [] },
      { type: 'eng', porter: ['V2', 'N0'], punkt: [0.2, 0.2], borger: [] },
    ],
  },
];

export const BRIKKE = Object.fromEntries(BRIKKER.map((b) => [b.id, b]));

export const ANTALL_BRIKKER = BRIKKER.reduce((sum, b) => sum + b.antall, 0); // 72
