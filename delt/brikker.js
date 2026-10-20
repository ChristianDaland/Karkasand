// Brikketypene i Karkasand, tegnet med nord øverst.
//
// kanter: [nord, øst, sør, vest], hver av dem 'borg', 'vei', 'eng' eller 'elv'.
// utvidelse: 'elva', 'gjestgiveri' eller 'handel' for brikkene fra utvidelsene (se UTVIDELSER).
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
//   gjestgiveri: veien har et gjestgiveri (dobbelt for ferdig vei, ingenting for uferdig)
//   storhov:   borgen har et storhov (3 per brikke og runestein for ferdig borg, ingenting for uferdig)
//   vare:      borgen har en vare ('fisk', 'jern' eller 'korn'), se VARER
// En elv bruker midtporten som en vei, men er ikke et område man kan sette vikinger i.

const alle = (side) => [`${side}0`, `${side}1`, `${side}2`];

const GRUNNFORMER = [
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

  // ---------- Utvidelse: Elva ----------
  // Elvebrikkene legges først, fra kilden til vatnet. Elv møter bare elv.
  {
    id: 'R1', navn: 'Kilden', antall: 1, utvidelse: 'elva', kilde: true, kanter: ['eng', 'eng', 'eng', 'elv'],
    deler: [
      { type: 'elv', porter: ['V1'], punkt: [0.3, 0.5] },
      { type: 'eng', porter: [...alle('N'), ...alle('Ø'), ...alle('S'), 'V0', 'V2'], punkt: [0.66, 0.3], borger: [] },
    ],
  },
  {
    id: 'R2', navn: 'Vatnet', antall: 1, utvidelse: 'elva', innsjo: true, kanter: ['eng', 'eng', 'eng', 'elv'],
    deler: [
      { type: 'elv', porter: ['V1'], punkt: [0.4, 0.5] },
      { type: 'eng', porter: [...alle('N'), ...alle('Ø'), ...alle('S'), 'V0', 'V2'], punkt: [0.8, 0.2], borger: [] },
    ],
  },
  {
    id: 'R3', navn: 'Elva', antall: 2, utvidelse: 'elva', kanter: ['eng', 'elv', 'eng', 'elv'],
    deler: [
      { type: 'elv', porter: ['Ø1', 'V1'], punkt: [0.5, 0.5] },
      { type: 'eng', porter: ['V2', ...alle('N'), 'Ø0'], punkt: [0.5, 0.18], borger: [] },
      { type: 'eng', porter: ['Ø2', ...alle('S'), 'V0'], punkt: [0.5, 0.82], borger: [] },
    ],
  },
  {
    id: 'R4', navn: 'Elvekroken', antall: 2, utvidelse: 'elva', kanter: ['eng', 'eng', 'elv', 'elv'],
    deler: [
      { type: 'elv', porter: ['S1', 'V1'], punkt: [0.375, 0.625] },
      { type: 'eng', porter: [...alle('N'), ...alle('Ø'), 'S0', 'V2'], punkt: [0.66, 0.36], borger: [] },
      { type: 'eng', porter: ['S2', 'V0'], punkt: [0.14, 0.86], borger: [] },
    ],
  },
  {
    id: 'R5', navn: 'Borgene ved elva', antall: 1, utvidelse: 'elva', kanter: ['borg', 'elv', 'borg', 'elv'],
    deler: [
      { type: 'borg', porter: alle('N'), punkt: [0.5, 0.12] },
      { type: 'borg', porter: alle('S'), punkt: [0.5, 0.88] },
      { type: 'elv', porter: ['Ø1', 'V1'], punkt: [0.5, 0.5] },
      { type: 'eng', porter: ['V2', 'Ø0'], punkt: [0.15, 0.37], borger: [0] },
      { type: 'eng', porter: ['Ø2', 'V0'], punkt: [0.85, 0.63], borger: [1] },
    ],
  },
  {
    id: 'R6', navn: 'Hjørneborgen ved elva', antall: 1, utvidelse: 'elva', kanter: ['borg', 'borg', 'elv', 'elv'],
    deler: [
      { type: 'borg', porter: [...alle('N'), ...alle('Ø')], punkt: [0.72, 0.28] },
      { type: 'elv', porter: ['S1', 'V1'], punkt: [0.3, 0.7] },
      { type: 'eng', porter: ['S0', 'V2'], punkt: [0.6, 0.78], borger: [0] },
      { type: 'eng', porter: ['S2', 'V0'], punkt: [0.12, 0.88], borger: [] },
    ],
  },
  {
    id: 'R7', navn: 'Vadestedet', antall: 1, utvidelse: 'elva', kanter: ['borg', 'elv', 'vei', 'elv'],
    deler: [
      { type: 'borg', porter: alle('N'), punkt: [0.5, 0.12] },
      { type: 'elv', porter: ['Ø1', 'V1'], punkt: [0.5, 0.5] },
      { type: 'vei', porter: ['S1'], punkt: [0.5, 0.8] },
      { type: 'eng', porter: ['V2', 'Ø0'], punkt: [0.15, 0.37], borger: [0] },
      { type: 'eng', porter: ['Ø2', 'S0'], punkt: [0.8, 0.8], borger: [] },
      { type: 'eng', porter: ['S2', 'V0'], punkt: [0.2, 0.8], borger: [] },
    ],
  },
  {
    id: 'R8', navn: 'Hovet ved brua', antall: 1, utvidelse: 'elva', kanter: ['eng', 'elv', 'vei', 'elv'],
    deler: [
      { type: 'hov', porter: [], punkt: [0.5, 0.24] },
      { type: 'elv', porter: ['Ø1', 'V1'], punkt: [0.5, 0.55] },
      { type: 'vei', porter: ['S1'], punkt: [0.5, 0.84] },
      { type: 'eng', porter: ['V2', ...alle('N'), 'Ø0'], punkt: [0.16, 0.2], borger: [] },
      { type: 'eng', porter: ['Ø2', 'S0'], punkt: [0.8, 0.84], borger: [] },
      { type: 'eng', porter: ['S2', 'V0'], punkt: [0.2, 0.84], borger: [] },
    ],
  },
  {
    id: 'R9', navn: 'Vei og elv i sving', antall: 1, utvidelse: 'elva', kanter: ['vei', 'vei', 'elv', 'elv'],
    deler: [
      { type: 'vei', porter: ['N1', 'Ø1'], punkt: [0.66, 0.34] },
      { type: 'elv', porter: ['S1', 'V1'], punkt: [0.34, 0.66] },
      { type: 'eng', porter: ['N2', 'Ø0'], punkt: [0.88, 0.12], borger: [] },
      { type: 'eng', porter: ['N0', 'V2', 'Ø2', 'S0'], punkt: [0.5, 0.5], borger: [] },
      { type: 'eng', porter: ['S2', 'V0'], punkt: [0.12, 0.88], borger: [] },
    ],
  },
  {
    id: 'R10', navn: 'Brua', antall: 1, utvidelse: 'elva', kanter: ['vei', 'elv', 'vei', 'elv'],
    deler: [
      { type: 'vei', porter: ['N1', 'S1'], punkt: [0.5, 0.24] },
      { type: 'elv', porter: ['Ø1', 'V1'], punkt: [0.5, 0.5] },
      { type: 'eng', porter: ['V2', 'N0'], punkt: [0.2, 0.2], borger: [] },
      { type: 'eng', porter: ['N2', 'Ø0'], punkt: [0.8, 0.2], borger: [] },
      { type: 'eng', porter: ['Ø2', 'S0'], punkt: [0.8, 0.8], borger: [] },
      { type: 'eng', porter: ['S2', 'V0'], punkt: [0.2, 0.8], borger: [] },
    ],
  },

  // ---------- Utvidelse: Gjestgiveri og storhov ----------
  {
    id: 'G1', navn: 'Storhovet', antall: 2, utvidelse: 'gjestgiveri', kanter: ['borg', 'borg', 'borg', 'borg'],
    deler: [
      { type: 'borg', porter: [...alle('N'), ...alle('Ø'), ...alle('S'), ...alle('V')], punkt: [0.5, 0.84], storhov: true },
    ],
  },
  {
    id: 'G2', navn: 'Firborgen', antall: 1, utvidelse: 'gjestgiveri', kanter: ['borg', 'borg', 'borg', 'borg'],
    deler: [
      { type: 'borg', porter: alle('N'), punkt: [0.5, 0.1] },
      { type: 'borg', porter: alle('Ø'), punkt: [0.9, 0.5] },
      { type: 'borg', porter: alle('S'), punkt: [0.5, 0.9] },
      { type: 'borg', porter: alle('V'), punkt: [0.1, 0.5] },
      { type: 'eng', porter: [], punkt: [0.5, 0.5], borger: [0, 1, 2, 3] },
    ],
  },
  {
    id: 'G3', navn: 'Treborgen', antall: 1, utvidelse: 'gjestgiveri', kanter: ['borg', 'borg', 'borg', 'eng'],
    deler: [
      { type: 'borg', porter: alle('N'), punkt: [0.5, 0.1] },
      { type: 'borg', porter: alle('Ø'), punkt: [0.9, 0.5] },
      { type: 'borg', porter: alle('S'), punkt: [0.5, 0.9] },
      { type: 'eng', porter: alle('V'), punkt: [0.35, 0.5], borger: [0, 1, 2] },
    ],
  },
  {
    id: 'G4', navn: 'Runehjørnet', antall: 1, utvidelse: 'gjestgiveri', kanter: ['borg', 'borg', 'borg', 'eng'],
    deler: [
      { type: 'borg', porter: alle('N'), punkt: [0.4, 0.1] },
      { type: 'borg', porter: [...alle('Ø'), ...alle('S')], punkt: [0.72, 0.72], runestein: true },
      { type: 'eng', porter: alle('V'), punkt: [0.25, 0.5], borger: [0, 1] },
    ],
  },
  {
    id: 'G5', navn: 'Gjestgiveriet ved muren', antall: 1, utvidelse: 'gjestgiveri', kanter: ['borg', 'borg', 'eng', 'vei'],
    deler: [
      { type: 'borg', porter: [...alle('N'), ...alle('Ø')], punkt: [0.75, 0.25] },
      { type: 'vei', porter: ['V1'], punkt: [0.22, 0.47], gjestgiveri: true },
      { type: 'eng', porter: ['V2'], punkt: [0.1, 0.2], borger: [0] },
      { type: 'eng', porter: ['V0', ...alle('S')], punkt: [0.4, 0.8], borger: [0] },
    ],
  },
  {
    id: 'G6', navn: 'Porten i hjørnet', antall: 1, utvidelse: 'gjestgiveri', kanter: ['borg', 'borg', 'vei', 'eng'],
    deler: [
      { type: 'borg', porter: [...alle('N'), ...alle('Ø')], punkt: [0.75, 0.25] },
      { type: 'vei', porter: ['S1'], punkt: [0.5, 0.78] },
      { type: 'eng', porter: ['S0'], punkt: [0.78, 0.88], borger: [0] },
      { type: 'eng', porter: ['S2', ...alle('V')], punkt: [0.25, 0.6], borger: [0] },
    ],
  },
  {
    id: 'G7', navn: 'Runeborgen ved gjestgiveriet', antall: 1, utvidelse: 'gjestgiveri', kanter: ['borg', 'borg', 'vei', 'vei'],
    deler: [
      { type: 'borg', porter: [...alle('N'), ...alle('Ø')], punkt: [0.75, 0.25], runestein: true },
      { type: 'vei', porter: ['S1', 'V1'], punkt: [0.375, 0.625], gjestgiveri: true },
      { type: 'eng', porter: ['S0', 'V2'], punkt: [0.6, 0.72], borger: [0] },
      { type: 'eng', porter: ['S2', 'V0'], punkt: [0.14, 0.86], borger: [] },
    ],
  },
  {
    id: 'G8', navn: 'Storkappa', antall: 1, utvidelse: 'gjestgiveri', kanter: ['borg', 'eng', 'eng', 'eng'],
    deler: [
      { type: 'borg', porter: alle('N'), punkt: [0.5, 0.16] },
      { type: 'eng', porter: [...alle('Ø'), ...alle('S'), ...alle('V')], punkt: [0.5, 0.72], borger: [0] },
    ],
  },
  {
    id: 'G9', navn: 'Veien til borgen', antall: 1, utvidelse: 'gjestgiveri', kanter: ['borg', 'eng', 'vei', 'eng'],
    deler: [
      { type: 'borg', porter: alle('N'), punkt: [0.5, 0.12] },
      { type: 'vei', porter: ['S1'], punkt: [0.5, 0.72] },
      { type: 'eng', porter: [...alle('Ø'), 'S0'], punkt: [0.78, 0.6], borger: [0] },
      { type: 'eng', porter: ['S2', ...alle('V')], punkt: [0.22, 0.6], borger: [0] },
    ],
  },
  {
    id: 'G10', navn: 'Gjestgiveriet under borgen', antall: 1, utvidelse: 'gjestgiveri', kanter: ['borg', 'eng', 'vei', 'vei'],
    deler: [
      { type: 'borg', porter: alle('N'), punkt: [0.5, 0.13] },
      { type: 'vei', porter: ['S1', 'V1'], punkt: [0.375, 0.625], gjestgiveri: true },
      { type: 'eng', porter: ['S2', 'V0'], punkt: [0.14, 0.86], borger: [] },
      { type: 'eng', porter: [...alle('Ø'), 'S0', 'V2'], punkt: [0.7, 0.55], borger: [0] },
    ],
  },
  {
    id: 'G11', navn: 'Tvillingportene', antall: 1, utvidelse: 'gjestgiveri', kanter: ['borg', 'vei', 'borg', 'vei'],
    deler: [
      { type: 'borg', porter: [...alle('N'), ...alle('S')], punkt: [0.5, 0.25], runestein: true },
      { type: 'vei', porter: ['Ø1'], punkt: [0.86, 0.5] },
      { type: 'vei', porter: ['V1'], punkt: [0.14, 0.5] },
      { type: 'eng', porter: ['Ø0'], punkt: [0.9, 0.3], borger: [0] },
      { type: 'eng', porter: ['Ø2'], punkt: [0.9, 0.7], borger: [0] },
      { type: 'eng', porter: ['V0'], punkt: [0.1, 0.7], borger: [0] },
      { type: 'eng', porter: ['V2'], punkt: [0.1, 0.3], borger: [0] },
    ],
  },
  {
    id: 'G12', navn: 'Krysset mellom borgene', antall: 1, utvidelse: 'gjestgiveri', kanter: ['borg', 'vei', 'borg', 'vei'],
    deler: [
      { type: 'borg', porter: alle('N'), punkt: [0.5, 0.1] },
      { type: 'borg', porter: alle('S'), punkt: [0.5, 0.9] },
      { type: 'vei', porter: ['Ø1'], punkt: [0.8, 0.5] },
      { type: 'vei', porter: ['V1'], punkt: [0.2, 0.5] },
      { type: 'eng', porter: ['V2'], punkt: [0.2, 0.32], borger: [0] },
      { type: 'eng', porter: ['Ø0'], punkt: [0.8, 0.32], borger: [0] },
      { type: 'eng', porter: ['Ø2'], punkt: [0.8, 0.68], borger: [1] },
      { type: 'eng', porter: ['V0'], punkt: [0.2, 0.68], borger: [1] },
    ],
  },
  {
    id: 'G13', navn: 'Gjestgiveriet i svingen', antall: 1, utvidelse: 'gjestgiveri', kanter: ['eng', 'eng', 'vei', 'vei'],
    deler: [
      { type: 'vei', porter: ['S1', 'V1'], punkt: [0.375, 0.625], gjestgiveri: true },
      { type: 'eng', porter: ['S2', 'V0'], punkt: [0.14, 0.86], borger: [] },
      { type: 'eng', porter: [...alle('N'), ...alle('Ø'), 'S0', 'V2'], punkt: [0.66, 0.4], borger: [] },
    ],
  },
  {
    id: 'G14', navn: 'Gjestgiveriet', antall: 1, utvidelse: 'gjestgiveri', kanter: ['eng', 'vei', 'eng', 'vei'],
    deler: [
      { type: 'vei', porter: ['Ø1', 'V1'], punkt: [0.5, 0.5], gjestgiveri: true },
      { type: 'eng', porter: ['V2', ...alle('N'), 'Ø0'], punkt: [0.5, 0.18], borger: [] },
      { type: 'eng', porter: ['Ø2', ...alle('S'), 'V0'], punkt: [0.5, 0.82], borger: [] },
    ],
  },
  {
    id: 'G15', navn: 'Hovet på veien', antall: 1, utvidelse: 'gjestgiveri', kanter: ['eng', 'vei', 'eng', 'vei'],
    deler: [
      { type: 'hov', porter: [], punkt: [0.5, 0.42] },
      { type: 'vei', porter: ['Ø1'], punkt: [0.86, 0.5] },
      { type: 'vei', porter: ['V1'], punkt: [0.14, 0.5] },
      { type: 'eng', porter: ['V2', ...alle('N'), 'Ø0'], punkt: [0.5, 0.1], borger: [] },
      { type: 'eng', porter: ['Ø2', ...alle('S'), 'V0'], punkt: [0.5, 0.9], borger: [] },
    ],
  },
  {
    id: 'G16', navn: 'Gjestgiveriet ved veidelet', antall: 1, utvidelse: 'gjestgiveri', kanter: ['eng', 'vei', 'vei', 'vei'],
    deler: [
      { type: 'vei', porter: ['Ø1'], punkt: [0.82, 0.5], gjestgiveri: true },
      { type: 'vei', porter: ['S1'], punkt: [0.5, 0.82] },
      { type: 'vei', porter: ['V1'], punkt: [0.18, 0.5] },
      { type: 'eng', porter: ['V2', ...alle('N'), 'Ø0'], punkt: [0.5, 0.3], borger: [] },
      { type: 'eng', porter: ['Ø2', 'S0'], punkt: [0.78, 0.78], borger: [] },
      { type: 'eng', porter: ['S2', 'V0'], punkt: [0.22, 0.78], borger: [] },
    ],
  },
  {
    id: 'G17', navn: 'Dobbelsvingen', antall: 1, utvidelse: 'gjestgiveri', kanter: ['vei', 'vei', 'vei', 'vei'],
    deler: [
      { type: 'vei', porter: ['N1', 'V1'], punkt: [0.3, 0.3] },
      { type: 'vei', porter: ['Ø1', 'S1'], punkt: [0.7, 0.7] },
      { type: 'eng', porter: ['V2', 'N0'], punkt: [0.1, 0.1], borger: [] },
      { type: 'eng', porter: ['N2', 'Ø0', 'S2', 'V0'], punkt: [0.5, 0.5], borger: [] },
      { type: 'eng', porter: ['Ø2', 'S0'], punkt: [0.9, 0.9], borger: [] },
    ],
  },
];

// ---------- Utvidelse: Handel og håndverk ----------
// Formene er de samme som i grunnspillet, men borgene har varer: [id, navn, antall, form, varer]
const HANDEL = [
    ['H1', 'Fiskebua', 2, 'E', ['fisk']],
    ['H2', 'Smia', 1, 'E', ['jern']],
    ['H3', 'Kornloftet', 1, 'E', ['korn']],
    ['H4', 'Fiskeveien', 1, 'D', ['fisk']],
    ['H5', 'Smia ved veien', 1, 'D', ['jern']],
    ['H6', 'Kornloftet ved svingen', 1, 'J', ['korn']],
    ['H7', 'Jernsvingen', 1, 'J', ['jern']],
    ['H8', 'Fiskesvingen', 1, 'K', ['fisk']],
    ['H9', 'Hjørnesmia', 1, 'N', ['jern']],
    ['H10', 'Kornhjørnet', 1, 'P', ['korn']],
    ['H11', 'Fiskegården', 1, 'R', ['fisk']],
    ['H12', 'Korngården', 1, 'R', ['korn']],
    ['H13', 'Smieporten', 1, 'T', ['jern']],
    ['H14', 'Fisk og korn', 1, 'H', ['fisk', 'korn']],
];

// En kopi av brikken `form` der borgene (i rekkefølge) får hver sin vare
function medVarer([id, navn, antall, form, varer]) {
  const b = GRUNNFORMER.find((g) => g.id === form);
  let n = 0;
  const deler = b.deler.map((d) => (d.type === 'borg' && varer[n] ? { ...d, vare: varer[n++] } : { ...d }));
  return { id, navn, antall, utvidelse: 'handel', form, kanter: [...b.kanter], deler };
}

export const BRIKKER = [...GRUNNFORMER, ...HANDEL.map(medVarer)];

// Varene i Handel og håndverk
export const VARER = { fisk: 'tørrfisk', jern: 'jern', korn: 'korn' };

// Utvidelsene man kan velge i lobbyen. Grunnspillet er alltid med.
export const UTVIDELSER = [
  {
    id: 'elva', navn: 'Elva',
    om: 'Spillet starter ved kilden. Elvebrikkene legges først, og elva renner ut i vatnet før resten av brikkene kommer.',
  },
  {
    id: 'gjestgiveri', navn: 'Gjestgiveri og storhov',
    om: 'Gjestgiverier gir 2 poeng per brikke for ferdige veier og storhov 3 poeng per brikke for ferdige borger, men begge gir ingenting hvis de er uferdige. Hver spiller får en storviking som teller som to, og det blir plass til en sjette spiller.',
  },
  {
    id: 'handel', navn: 'Handel og håndverk',
    om: 'Borger med tørrfisk, jern og korn. Den som fullfører borgen, får varene, og flest av hver vare gir 10 poeng på slutten. Hver spiller får en byggmester som gir ekstra tur, og en liten sort dvergkochin-høne som gjør enga mer verdt.',
  },
];

export const BRIKKE = Object.fromEntries(BRIKKER.map((b) => [b.id, b]));

export const utvidelseAv = (b) => b.utvidelse ?? 'grunn';

// Antall brikker i grunnspillet (72) og i hver utvidelse
export const ANTALL = BRIKKER.reduce((tall, b) => ({ ...tall, [utvidelseAv(b)]: (tall[utvidelseAv(b)] ?? 0) + b.antall }), {});
export const ANTALL_BRIKKER = ANTALL.grunn;
for (const u of UTVIDELSER) u.antall = ANTALL[u.id];
