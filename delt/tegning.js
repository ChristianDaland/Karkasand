// Tegner brikkene som SVG ut fra én felles geometri.
//   stil 'skisse':      flate fargefelt, maler for AI-maleriet (kunst/skisser/)
//   stil 'plassholder': enkel illustrert brikke som brukes til de malte bildene finnes
// Modulen brukes både av Node (verktoy/lag-skisser.js) og i nettleseren.

export const S = 1024;
const m = S / 2;
export const VEIBREDDE = 110;
export const ELVBREDDE = 150;
export const KAPPEDYBDE = 300;
const c = 2 * KAPPEDYBDE;
const UT = 20; // veier tegnes litt utenfor kanten så de ikke får synlig ende

export const FARGE = {
  eng: '#7fa65a',
  vei: '#c9a877',
  borg: '#9c7a55',
  palisade: '#4a3523',
  bygg: '#6b3e26',
  stein: '#8a8f94',
  rune: '#b3322b',
  helle: '#b8b2a4', // steinlagt plass rundt runesteinen
  elv: '#4f86b5',
  bro: '#7a5a3a',
  gjest: '#a8492f', // gjestgiveriet
  storhov: '#5e2a1a',
};

// Kappe = område avgrenset av en kant og en bue som når KAPPEDYBDE inn
const KAPPE = {
  N: { flate: `M0 0 L${S} 0 Q${m} ${c} 0 0 Z`, bue: `M${S} 0 Q${m} ${c} 0 0` },
  Ø: { flate: `M${S} 0 L${S} ${S} Q${S - c} ${m} ${S} 0 Z`, bue: `M${S} 0 Q${S - c} ${m} ${S} ${S}` },
  S: { flate: `M0 ${S} L${S} ${S} Q${m} ${S - c} 0 ${S} Z`, bue: `M0 ${S} Q${m} ${S - c} ${S} ${S}` },
  V: { flate: `M0 0 L0 ${S} Q${c} ${m} 0 0 Z`, bue: `M0 0 Q${c} ${m} 0 ${S}` },
};
// Borgen i et hjørne, avgrenset av en bue fra hjørne til hjørne: NV, NØ eller ØS
const DIAGONALER = {
  NV: { flate: `M0 0 L${S} 0 Q640 640 0 ${S} Z`, bue: `M${S} 0 Q640 640 0 ${S}` },
  NØ: { flate: `M${S} 0 L${S} ${S} Q384 640 0 0 Z`, bue: `M${S} ${S} Q384 640 0 0` },
  ØS: { flate: `M${S} ${S} L0 ${S} Q384 384 ${S} 0 Z`, bue: `M0 ${S} Q384 384 ${S} 0` },
};
const HEL = `M0 0 H${S} V${S} H0 Z`;

const VEI = {
  NS: `M${m} ${-UT} L${m} ${S + UT}`,
  VØ: `M${-UT} ${m} L${S + UT} ${m}`,
  VS: `M${-UT} ${m} Q${m} ${m} ${m} ${S + UT}`,
  ØS: `M${S + UT} ${m} Q${m} ${m} ${m} ${S + UT}`,
  ØS_YTRE: `M${S + UT} ${m} Q700 700 ${m} ${S + UT}`,
  N: `M${m} ${-UT} L${m} ${m}`,
  Ø: `M${S + UT} ${m} L${m} ${m}`,
  S: `M${m} ${S + UT} L${m} ${m}`,
  V: `M${-UT} ${m} L${m} ${m}`,
  PORT: `M${m} ${S + UT} L${m} ${S - KAPPEDYBDE}`,
  HOV: `M${m} ${S + UT} L${m} 640`,
  // Utvidelsene
  PORT_N: `M${m} ${S + UT} L${m} ${KAPPEDYBDE}`, // fra sør inn til en borgkappe i nord
  PORT_Ø: `M${S + UT} ${m} L${S - KAPPEDYBDE} ${m}`,
  PORT_V: `M${-UT} ${m} L${KAPPEDYBDE} ${m}`,
  NV: `M${m} ${-UT} Q${m} ${m} ${-UT} ${m}`,
  NØ: `M${m} ${-UT} Q${m} ${m} ${S + UT} ${m}`,
  TIL_ELV: `M${m} ${S + UT} L${m} ${m + ELVBREDDE / 2}`, // fra sør og ned til elvebredden
  TIL_HOV_ELV: `M${m} ${S + UT} L${m} 400`,
  V_HJØRNEBORG: `M${-UT} ${m} L385 ${m}`, // fra vest inn til en hjørneborg i NØ
  S_HJØRNEBORG: `M${m} ${S + UT} L${m} 636`, // fra sør inn til en hjørneborg i NØ
  KAPPE_N_TUN: `M${m} ${KAPPEDYBDE} L${m} ${m}`,
  KAPPE_S_TUN: `M${m} ${S - KAPPEDYBDE} L${m} ${m}`,
};

const ELV = {
  VØ: VEI.VØ,
  VS: VEI.VS,
  V: VEI.V,
  TIL_VATN: `M${-UT} ${m} L560 ${m}`,
};

// Langhus [x, y, bredde, høyde, vinkel] i en borgkappe mot nord. Roteres til de andre sidene.
const HUS_N = [[512, 170, 250, 84, 0], [285, 108, 120, 58, -12], [740, 108, 120, 58, 12]];

function roter([x, y, b, h, v], ganger) {
  for (let i = 0; i < ganger; i++) {
    [x, y] = [S - y, x];
    v += 90;
  }
  return [x, y, b, h, v];
}
const husKappe = (side) => HUS_N.map((h) => roter(h, 'NØSV'.indexOf(side)));

const HUS_HJØRNE = [[470, 165, 210, 78, -25], [165, 470, 210, 78, -65]];
const HUS_PORT = [[220, 220, 210, 80, 0], [804, 220, 210, 80, 0], [250, 560, 200, 80, 90], [774, 560, 200, 80, 90]];
const PYNT_HJØRNE = [['tre', 880, 870], ['tre', 890, 560], ['sau', 600, 880], ['busk', 700, 640]];

// Oppskrift per brikke. Lagene tegnes i fast rekkefølge (se tegnBrikke).
const OPPSETT = {
  A: { veier: [VEI.HOV], hov: [m, 470], pynt: [['tre', 200, 230], ['tre', 830, 780], ['stein', 200, 830], ['busk', 840, 240], ['busk', 250, 520]] },
  B: { hov: [m, m], pynt: [['tre', 190, 190], ['tre', 834, 200], ['tre', 200, 834], ['tre', 834, 834], ['stein', 512, 140]] },
  C: {
    helBorg: true, runestein: [m, m],
    hus: [[250, 240, 230, 84, 0], [774, 240, 230, 84, 0], [250, 784, 230, 84, 0], [774, 784, 230, 84, 0],
      [512, 820, 150, 62, 0], [512, 190, 150, 62, 0], [180, 512, 150, 62, 90], [844, 512, 150, 62, 90]],
  },
  D: { borgKapper: ['N'], veier: [VEI.VØ], hus: husKappe('N'), pynt: [['stein', 830, 380], ['tre', 240, 790], ['tre', 790, 830], ['sau', 540, 700], ['sau', 600, 740]] },
  E: { borgKapper: ['N'], hus: husKappe('N'), pynt: [['tre', 220, 720], ['tre', 800, 640], ['stein', 520, 840], ['sau', 560, 470], ['sau', 420, 520], ['busk', 180, 420]] },
  F: { helBorg: true, engKapper: ['N', 'S'], runestein: [m, m], hus: [[220, 512, 220, 84, 0], [804, 512, 220, 84, 0]] },
  G: { helBorg: true, engKapper: ['Ø', 'V'], hus: [[512, 220, 220, 84, 90], [512, 804, 220, 84, 90]] },
  H: { borgKapper: ['N', 'S'], hus: [...husKappe('N'), ...husKappe('S')], pynt: [['korn', 512, 512], ['tre', 145, 512], ['tre', 879, 512]] },
  I: { borgKapper: ['N', 'Ø'], hus: [...husKappe('N'), ...husKappe('Ø')], pynt: [['tre', 240, 820], ['tre', 540, 660], ['sau', 300, 470], ['stein', 760, 870]] },
  J: { borgKapper: ['N'], veier: [VEI.ØS], hus: husKappe('N'), pynt: [['tre', 170, 700], ['tre', 390, 440], ['stein', 890, 890], ['sau', 230, 880]] },
  K: { borgKapper: ['N'], veier: [VEI.VS], hus: husKappe('N'), pynt: [['tre', 854, 700], ['tre', 634, 440], ['stein', 134, 890], ['sau', 794, 880]] },
  L: { borgKapper: ['N'], veier: [VEI.Ø, VEI.S, VEI.V], tun: [m, m], hus: husKappe('N'), pynt: [['stein', 840, 840], ['tre', 190, 840], ['busk', 830, 360]] },
  M: { diagonal: true, runestein: [270, 270], hus: HUS_HJØRNE, pynt: PYNT_HJØRNE },
  N: { diagonal: true, hus: [...HUS_HJØRNE, [330, 330, 220, 84, -45]], pynt: PYNT_HJØRNE },
  O: { diagonal: true, veier: [VEI.ØS_YTRE], runestein: [270, 270], hus: HUS_HJØRNE, pynt: [['busk', 915, 915], ['stein', 940, 230]] },
  P: { diagonal: true, veier: [VEI.ØS_YTRE], hus: [...HUS_HJØRNE, [330, 330, 220, 84, -45]], pynt: [['busk', 915, 915], ['stein', 940, 230]] },
  Q: { helBorg: true, engKapper: ['S'], runestein: [m, 380], hus: [[230, 220, 220, 84, 0], [794, 220, 220, 84, 0], [200, 580, 200, 80, 90], [824, 580, 200, 80, 90]] },
  R: { helBorg: true, engKapper: ['S'], hus: [[512, 420, 330, 112, 0], [200, 580, 200, 80, 90], [824, 580, 200, 80, 90], [230, 190, 200, 76, 0], [794, 190, 200, 76, 0]] },
  S: { helBorg: true, engKapper: ['S'], veier: [VEI.PORT], port: [m, S - KAPPEDYBDE], runestein: [m, 360], hus: HUS_PORT },
  T: { helBorg: true, engKapper: ['S'], veier: [VEI.PORT], port: [m, S - KAPPEDYBDE], hus: [...HUS_PORT, [512, 360, 260, 96, 0]] },
  U: { veier: [VEI.NS], pynt: [['tre', 230, 300], ['tre', 800, 760], ['stein', 780, 250], ['sau', 250, 760], ['busk', 330, 900]] },
  V: { veier: [VEI.VS], pynt: [['tre', 800, 240], ['tre', 300, 230], ['stein', 170, 870], ['stein', 740, 790], ['busk', 880, 620]] },
  W: { veier: [VEI.Ø, VEI.S, VEI.V], tun: [m, m], pynt: [['tre', 240, 240], ['tre', 790, 220], ['sau', 640, 300], ['stein', 840, 840], ['tre', 190, 840]] },
  X: { veier: [VEI.N, VEI.Ø, VEI.S, VEI.V], tun: [m, m], pynt: [['tre', 200, 200], ['stein', 830, 200], ['tre', 830, 830], ['sau', 200, 830]] },

  // Elva
  R1: { elver: [ELV.V], kilde: [m, m], pynt: [['tre', 760, 260], ['stein', 640, 760], ['busk', 300, 250], ['sau', 800, 700]] },
  R2: { elver: [ELV.TIL_VATN], vatn: [640, m], pynt: [['tre', 230, 230], ['busk', 220, 800], ['stein', 880, 140]] },
  R3: { elver: [ELV.VØ], pynt: [['tre', 250, 220], ['stein', 780, 240], ['busk', 300, 820], ['sau', 760, 800]] },
  R4: { elver: [ELV.VS], pynt: [['tre', 760, 260], ['stein', 640, 600], ['sau', 420, 260], ['busk', 860, 760]] },
  R5: { borgKapper: ['N', 'S'], elver: [ELV.VØ], hus: [...husKappe('N'), ...husKappe('S')] },
  R6: { diagonal: 'NØ', elver: [ELV.VS], hus: [[560, 165, 210, 78, 25], [860, 470, 210, 78, 65]], pynt: [['busk', 560, 820]] },
  R7: { borgKapper: ['N'], elver: [ELV.VØ], veier: [VEI.TIL_ELV], hus: husKappe('N'), pynt: [['tre', 230, 820], ['stein', 800, 830]] },
  R8: { elver: [ELV.VØ], veier: [VEI.TIL_HOV_ELV], bro: [[m, m, 0]], hov: [m, 245, 0.8], pynt: [['tre', 170, 200], ['tre', 850, 200], ['busk', 230, 840], ['stein', 800, 840]] },
  R9: { elver: [ELV.VS], veier: [VEI.NØ], pynt: [['stein', 600, 560], ['busk', 880, 140], ['tre', 300, 330]] },
  R10: { elver: [ELV.VØ], veier: [VEI.NS], bro: [[m, m, 0]], pynt: [['tre', 230, 230], ['tre', 800, 800], ['sau', 780, 250], ['stein', 230, 800]] },

  // Gjestgiveri og storhov
  G1: { helBorg: true, storhov: [m, 450], hus: [[200, 820, 210, 80, 0], [824, 820, 210, 80, 0], [180, 200, 180, 70, 90], [844, 200, 180, 70, 90]] },
  G2: { borgKapper: ['N', 'Ø', 'S', 'V'], hus: [...husKappe('N'), ...husKappe('Ø'), ...husKappe('S'), ...husKappe('V')].filter((_, i) => i % 3 === 0), pynt: [['sau', m, m]] },
  G3: { borgKapper: ['N', 'Ø', 'S'], hus: [...husKappe('N'), ...husKappe('Ø'), ...husKappe('S')].filter((_, i) => i % 3 === 0), pynt: [['tre', 260, m], ['sau', 470, 560]] },
  G4: { borgKapper: ['N'], diagonal: 'ØS', runestein: [740, 740], hus: [husKappe('N')[0], [880, 520, 200, 76, 65], [520, 880, 200, 76, 25]], pynt: [['tre', 230, 520]] },
  G5: { diagonal: 'NØ', veier: [VEI.V_HJØRNEBORG], port: [385, m, 90], gjestgiveri: [[220, 640, 0]], hus: [[600, 170, 210, 78, 25], [860, 470, 210, 78, 65]], pynt: [['tre', 330, 860], ['busk', 640, 760]] },
  G6: { diagonal: 'NØ', veier: [VEI.S_HJØRNEBORG], port: [m, 636, 0], hus: [[560, 165, 210, 78, 25], [860, 400, 210, 78, 65]], pynt: [['tre', 230, 600], ['sau', 230, 300], ['busk', 820, 880]] },
  G7: { diagonal: 'NØ', veier: [VEI.VS], runestein: [760, 270], gjestgiveri: [[250, 380, 0]], hus: [[500, 140, 180, 70, 20], [890, 520, 180, 70, 70]], pynt: [['busk', 860, 860]] },
  G8: { borgKapper: ['N'], hus: husKappe('N'), pynt: [['tre', 220, 700], ['tre', 800, 640], ['sau', 520, 560], ['stein', 520, 860]] },
  G9: { borgKapper: ['N'], veier: [VEI.PORT_N], port: [m, KAPPEDYBDE, 0], hus: husKappe('N').filter((_, i) => i > 0), pynt: [['tre', 230, 720], ['tre', 800, 720], ['sau', 760, 440]] },
  G10: { borgKapper: ['N'], veier: [VEI.VS], gjestgiveri: [[230, 400, 0]], hus: husKappe('N'), pynt: [['tre', 854, 700], ['stein', 640, 860]] },
  G11: { helBorg: true, engKapper: ['Ø', 'V'], veier: [VEI.PORT_Ø, VEI.PORT_V], port: [[S - KAPPEDYBDE, m, 90], [KAPPEDYBDE, m, 90]], runestein: [m, 270], hus: [[m, 740, 200, 80, 0], [m, 880, 160, 64, 0]] },
  G12: { borgKapper: ['N', 'S'], veier: [VEI.V, VEI.Ø, VEI.KAPPE_N_TUN, VEI.KAPPE_S_TUN], tun: [m, m], hus: [...husKappe('N'), ...husKappe('S')].filter((h) => Math.abs(h[0] - m) > 50) },
  G13: { veier: [VEI.VS], gjestgiveri: [[620, 360, 0]], pynt: [['tre', 830, 220], ['stein', 170, 870], ['busk', 880, 620]] },
  G14: { veier: [VEI.VØ], gjestgiveri: [[m, 300, 0]], pynt: [['tre', 200, 220], ['tre', 830, 800], ['sau', 300, 780], ['stein', 780, 220]] },
  G15: { veier: [VEI.V, VEI.Ø], hov: [m, m, 0.8], pynt: [['tre', 170, 200], ['tre', 850, 830], ['busk', 200, 840], ['stein', 830, 180]] },
  G16: { veier: [VEI.Ø, VEI.S, VEI.V], tun: [m, m], gjestgiveri: [[760, 360, 0]], pynt: [['tre', 240, 240], ['stein', 840, 840], ['tre', 190, 840]] },
  G17: { veier: [VEI.NV, VEI.ØS], pynt: [['busk', 120, 120], ['tre', 512, 512], ['stein', 900, 900], ['sau', 760, 300]] },
};

// ---------- Skisse: flate fargefelt ----------

const SKISSE = {
  grunn: () => `<rect width="${S}" height="${S}" fill="${FARGE.eng}"/>`,
  borg: (d) => `<path d="${d}" fill="${FARGE.borg}"/>`,
  eng: (d) => `<path d="${d}" fill="${FARGE.eng}"/>`,
  vei: (d) => `<path d="${d}" fill="none" stroke="${FARGE.vei}" stroke-width="${VEIBREDDE}"/>`,
  palisade: (d) =>
    `<path d="${d}" fill="none" stroke="${FARGE.palisade}" stroke-width="36"/>` +
    `<path d="${d}" fill="none" stroke="#6e5238" stroke-width="20" stroke-dasharray="14 10"/>`,
  port: (x, y, v = 0) => `<rect x="-75" y="-30" width="150" height="60" fill="#2b1d12" transform="translate(${x} ${y}) rotate(${v})"/>`,
  elv: (d) => `<path d="${d}" fill="none" stroke="${FARGE.elv}" stroke-width="${ELVBREDDE}"/>`,
  kilde: (x, y) => `<circle cx="${x}" cy="${y}" r="70" fill="${FARGE.elv}"/>`,
  vatn: (x, y) => `<ellipse cx="${x}" cy="${y}" rx="300" ry="250" fill="${FARGE.elv}"/>`,
  bro: (x, y, v) => `<rect x="-70" y="-110" width="140" height="220" fill="${FARGE.bro}" transform="translate(${x} ${y}) rotate(${v})"/>`,
  gjestgiveri: (x, y, v) =>
    `<g transform="translate(${x} ${y}) rotate(${v})"><rect x="-95" y="-60" width="190" height="120" rx="10" fill="${FARGE.gjest}"/>` +
    `<circle cx="120" cy="0" r="22" fill="#d9a441"/></g>`,
  storhov: (x, y) =>
    `<g transform="translate(${x} ${y})"><rect x="-120" y="-230" width="240" height="460" rx="14" fill="${FARGE.storhov}"/>` +
    `<rect x="-220" y="-80" width="440" height="160" rx="14" fill="${FARGE.storhov}"/></g>`,
  tun: (x, y) =>
    `<circle cx="${x}" cy="${y}" r="92" fill="${FARGE.vei}"/>` +
    `<rect x="${x - 34}" y="${y - 34}" width="68" height="68" rx="8" fill="${FARGE.bygg}"/>` +
    `<circle cx="${x}" cy="${y}" r="16" fill="#2f4f6f"/>`,
  hus: () => '',
  // Ca. 14 % av brikkebredden, på en rund steinlagt plass, så den synes godt på brettet
  runestein: (x, y) =>
    `<g transform="translate(${x} ${y})">` +
    `<circle r="125" fill="${FARGE.helle}"/>` +
    `<g transform="scale(1.5)">` +
    `<path d="M-40 60 L-48 -20 Q-40 -70 0 -76 Q40 -70 48 -20 L40 60 Z" fill="${FARGE.stein}" stroke="#3c3f42" stroke-width="6"/>` +
    `<path d="M-22 -40 Q20 -50 18 -10 Q14 26 -20 20 Q-30 50 6 44" fill="none" stroke="${FARGE.rune}" stroke-width="10"/></g></g>`,
  hov: (x, y, skala = 1) =>
    `<g transform="translate(${x} ${y}) scale(${skala})">` +
    `<rect x="-150" y="-190" width="300" height="380" rx="12" fill="${FARGE.bygg}"/>` +
    `<path d="M0 -190 L0 190" stroke="#3e2416" stroke-width="10"/>` +
    `<path d="M-150 -190 l-30 -30 M150 -190 l30 -30 M-150 190 l-30 30 M150 190 l30 30" stroke="#3e2416" stroke-width="14"/></g>`,
  pynt: () => '',
  defs: () => '',
};

// ---------- Plassholder: enkel illustrasjon ----------

const P = {
  gress: '#7a9f55',
  jord: '#9a7a56',
  vei: '#c4a574',
  veikant: '#9b8058',
};

const PLASSHOLDER = {
  defs: () =>
    `<defs>` +
    `<pattern id="g" width="128" height="128" patternUnits="userSpaceOnUse">` +
    `<path d="M14 30l4-12M22 32l-2-11M70 84l4-12M78 86l-2-11M96 20l3-10M40 104l-3-10M110 110l3-10M52 50l-3-9" stroke="#5f8441" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M30 70l3-9M88 50l-3-9" stroke="#93b86a" stroke-width="4" stroke-linecap="round"/>` +
    `<circle cx="104" cy="64" r="4" fill="#ecd56c"/><circle cx="34" cy="60" r="3.5" fill="#a98bc9"/>` +
    `<circle cx="80" cy="116" r="3.5" fill="#f2f2ee"/><circle cx="12" cy="100" r="3" fill="#ecd56c"/></pattern>` +
    `<pattern id="j" width="128" height="128" patternUnits="userSpaceOnUse">` +
    `<ellipse cx="20" cy="30" rx="9" ry="6" fill="#86684a"/><ellipse cx="90" cy="20" rx="7" ry="5" fill="#ad8e68"/>` +
    `<ellipse cx="60" cy="80" rx="10" ry="6" fill="#86684a"/><ellipse cx="110" cy="100" rx="6" ry="4" fill="#ad8e68"/>` +
    `<path d="M8 120h40M70 54h36" stroke="#7b5e40" stroke-width="5" stroke-linecap="round"/></pattern>` +
    `</defs>`,
  grunn: () => `<rect width="${S}" height="${S}" fill="${P.gress}"/><rect width="${S}" height="${S}" fill="url(#g)"/>`,
  borg: (d) => `<path d="${d}" fill="${P.jord}"/><path d="${d}" fill="url(#j)"/>`,
  eng: (d) => `<path d="${d}" fill="${P.gress}"/><path d="${d}" fill="url(#g)"/>`,
  vei: (d) =>
    `<path d="${d}" fill="none" stroke="${P.veikant}" stroke-width="${VEIBREDDE + 10}"/>` +
    `<path d="${d}" fill="none" stroke="${P.vei}" stroke-width="${VEIBREDDE - 6}"/>` +
    `<path d="${d}" fill="none" stroke="#b39463" stroke-width="64" stroke-dasharray="60 26" opacity=".5"/>` +
    `<path d="${d}" fill="none" stroke="#e3d6bc" stroke-width="13" stroke-dasharray="0.1 48" stroke-linecap="round"/>`,
  palisade: (d) =>
    `<path d="${d}" fill="none" stroke="#2e2015" stroke-width="46"/>` +
    `<path d="${d}" fill="none" stroke="#6b4e30" stroke-width="28" stroke-dasharray="0.1 25" stroke-linecap="round"/>` +
    `<path d="${d}" fill="none" stroke="#9a774c" stroke-width="10" stroke-dasharray="0.1 25" stroke-linecap="round"/>`,
  port: (x, y, v = 0) =>
    `<g transform="translate(${x} ${y}) rotate(${v})"><rect x="-82" y="-32" width="164" height="64" rx="6" fill="#3a2716"/>` +
    `<path d="M-60 -32v64M-30 -32v64M0 -32v64M30 -32v64M60 -32v64" stroke="#5c412a" stroke-width="8"/>` +
    `<circle cx="-82" cy="0" r="22" fill="#2e2015"/><circle cx="82" cy="0" r="22" fill="#2e2015"/></g>`,
  tun: (x, y) =>
    `<circle cx="${x}" cy="${y}" r="98" fill="${P.veikant}"/><circle cx="${x}" cy="${y}" r="90" fill="${P.vei}"/>` +
    `<rect x="${x + 28}" y="${y - 84}" width="54" height="54" rx="6" fill="#5a3a22" stroke="#2e2015" stroke-width="5"/>` +
    `<path d="M${x + 28} ${y - 57}h54" stroke="#2e2015" stroke-width="5"/>` +
    `<circle cx="${x}" cy="${y}" r="36" fill="#868a8f" stroke="#55595e" stroke-width="9"/>` +
    `<circle cx="${x}" cy="${y}" r="20" fill="#2c4a66"/>` +
    `<rect x="${x - 46}" y="${y - 5}" width="92" height="10" fill="#4a3322"/>`,
  hus: ([x, y, b, h, v]) =>
    `<g transform="translate(${x} ${y}) rotate(${v})">` +
    `<rect x="${-b / 2 - 7}" y="${-h / 2 - 7}" width="${b + 14}" height="${h + 14}" rx="${h / 2}" fill="#2b1d12" opacity=".35"/>` +
    `<rect x="${-b / 2}" y="${-h / 2}" width="${b}" height="${h}" rx="${h * 0.42}" fill="#6f8a3c" stroke="#3b2a1a" stroke-width="5"/>` +
    `<rect x="${-b / 2 + 6}" y="${-h / 2 + 6}" width="${b - 12}" height="${h / 2 - 6}" rx="${h * 0.3}" fill="#8aa64f" opacity=".7"/>` +
    `<path d="M${-b / 2 + 14} 0H${b / 2 - 14}" stroke="#4b5e27" stroke-width="6"/>` +
    `<circle r="9" fill="#2a1d12"/><circle cx="${b * 0.12}" cy="-6" r="15" fill="#e8e8e8" opacity=".35"/></g>`,
  runestein: (x, y) =>
    `<g transform="translate(${x} ${y})">` +
    `<circle r="96" fill="#b6a68a" stroke="#7d6f58" stroke-width="6"/>` +
    `<circle r="96" fill="none" stroke="#9c8d72" stroke-width="3" stroke-dasharray="22 10"/>` +
    `<ellipse cx="6" cy="58" rx="50" ry="14" fill="#2b2b2b" opacity=".3"/>` +
    `<path d="M-42 58 L-50 -20 Q-42 -74 0 -80 Q42 -74 50 -20 L42 58 Z" fill="#8d9298" stroke="#3c3f42" stroke-width="6"/>` +
    `<path d="M-30 -30 Q-24 -64 0 -66 Q26 -62 32 -30" fill="none" stroke="#b4b9be" stroke-width="6" opacity=".7"/>` +
    `<path d="M-24 -40 Q22 -54 20 -10 Q16 28 -20 22 Q-32 52 8 46" fill="none" stroke="${FARGE.rune}" stroke-width="11" stroke-linecap="round"/>` +
    `<circle cx="-24" cy="-40" r="8" fill="${FARGE.rune}"/></g>`,
  elv: (d) =>
    `<path d="${d}" fill="none" stroke="#3f6f96" stroke-width="${ELVBREDDE + 12}"/>` +
    `<path d="${d}" fill="none" stroke="#5f9ccc" stroke-width="${ELVBREDDE - 10}"/>` +
    `<path d="${d}" fill="none" stroke="#a9d1ee" stroke-width="8" stroke-dasharray="40 60" opacity=".7"/>`,
  kilde: (x, y) =>
    `<circle cx="${x}" cy="${y}" r="80" fill="#3f6f96"/><circle cx="${x}" cy="${y}" r="66" fill="#5f9ccc"/>` +
    `<circle cx="${x - 14}" cy="${y - 12}" r="16" fill="#a9d1ee" opacity=".7"/>`,
  vatn: (x, y) =>
    `<ellipse cx="${x}" cy="${y}" rx="312" ry="262" fill="#3f6f96"/><ellipse cx="${x}" cy="${y}" rx="296" ry="246" fill="#5f9ccc"/>` +
    `<path d="M${x - 160} ${y - 60}h120M${x + 20} ${y + 40}h160M${x - 80} ${y + 120}h90" stroke="#a9d1ee" stroke-width="8" opacity=".7"/>`,
  bro: (x, y, v) =>
    `<g transform="translate(${x} ${y}) rotate(${v})"><rect x="-72" y="-112" width="144" height="224" rx="6" fill="#5c412a"/>` +
    `<path d="M-60 -90h120M-60 -54h120M-60 -18h120M-60 18h120M-60 54h120M-60 90h120" stroke="#8a6644" stroke-width="16"/></g>`,
  gjestgiveri: (x, y, v) =>
    `<g transform="translate(${x} ${y}) rotate(${v})"><rect x="-100" y="-66" width="200" height="132" rx="12" fill="#2b1d12" opacity=".35"/>` +
    `<rect x="-92" y="-58" width="184" height="116" rx="10" fill="#b5523a" stroke="#4a2316" stroke-width="6"/>` +
    `<path d="M-92 0H92" stroke="#4a2316" stroke-width="6"/><circle cx="122" cy="0" r="22" fill="#d9a441" stroke="#4a2316" stroke-width="5"/></g>`,
  storhov: (x, y) =>
    `<g transform="translate(${x} ${y})"><path d="M-120 -230H120V-80H220V80H120V230H-120V80H-220V-80H-120Z" fill="#6b3a22" stroke="#2f1b10" stroke-width="10"/>` +
    `<path d="M0 -230V230M-220 0H220" stroke="#2f1b10" stroke-width="12"/></g>`,
  hov: (x, y, skala = 1) => {
    const takstein = Array.from({ length: 15 }, (_, i) => `M-150 ${-180 + i * 25}H150`).join('');
    return (
      `<g transform="translate(${x} ${y}) scale(${skala})">` +
      `<rect x="-178" y="-212" width="356" height="424" rx="34" fill="#a49a86" stroke="#6d6556" stroke-width="6"/>` +
      `<rect x="-150" y="-190" width="150" height="380" fill="#55321e"/>` +
      `<rect x="0" y="-190" width="150" height="380" fill="#7a4a2c"/>` +
      `<path d="${takstein}" stroke="#3d2314" stroke-width="3" opacity=".6"/>` +
      `<rect x="-150" y="-190" width="300" height="380" fill="none" stroke="#2f1b10" stroke-width="8"/>` +
      `<path d="M0 -200V200" stroke="#2f1b10" stroke-width="14"/>` +
      `<path d="M0 -196q-14-38 14-58q26-14 30 12q-14-6-22 6" fill="none" stroke="#2f1b10" stroke-width="11" stroke-linecap="round"/>` +
      `<path d="M0 196q14 38-14 58q-26 14-30-12q14 6 22-6" fill="none" stroke="#2f1b10" stroke-width="11" stroke-linecap="round"/>` +
      `</g>`
    );
  },
  pynt: ([type, x, y]) => {
    switch (type) {
      case 'tre':
        return (
          `<circle cx="${x + 8}" cy="${y + 10}" r="66" fill="#1f2e15" opacity=".3"/>` +
          `<circle cx="${x - 22}" cy="${y + 12}" r="40" fill="#3c6229"/><circle cx="${x + 24}" cy="${y + 8}" r="42" fill="#3c6229"/>` +
          `<circle cx="${x}" cy="${y - 22}" r="44" fill="#456f2f"/>` +
          `<circle cx="${x - 10}" cy="${y - 28}" r="20" fill="#5f8c3f"/><circle cx="${x + 22}" cy="${y}" r="16" fill="#5f8c3f"/>`
        );
      case 'busk':
        return (
          `<circle cx="${x + 4}" cy="${y + 6}" r="38" fill="#1f2e15" opacity=".25"/>` +
          `<circle cx="${x}" cy="${y}" r="34" fill="#4a7533"/><circle cx="${x - 8}" cy="${y - 10}" r="14" fill="#679a46"/>`
        );
      case 'stein':
        return (
          `<ellipse cx="${x + 4}" cy="${y + 6}" rx="32" ry="22" fill="#1f2e15" opacity=".25"/>` +
          `<ellipse cx="${x}" cy="${y}" rx="30" ry="21" fill="#8d9196" stroke="#5c6065" stroke-width="4"/>` +
          `<ellipse cx="${x - 8}" cy="${y - 6}" rx="12" ry="7" fill="#b3b7bb"/>`
        );
      case 'sau':
        return (
          `<ellipse cx="${x}" cy="${y}" rx="26" ry="18" fill="#f1efe8" stroke="#a9a59a" stroke-width="3"/>` +
          `<circle cx="${x + 26}" cy="${y}" r="10" fill="#2e2b28"/>`
        );
      case 'korn': {
        const striper = Array.from({ length: 9 }, (_, i) => `M${x - 170 + i * 40} ${y - 70}v140`).join('');
        return (
          `<rect x="${x - 180}" y="${y - 75}" width="360" height="150" rx="18" fill="#cdb15a" stroke="#8f7a3a" stroke-width="5"/>` +
          `<path d="${striper}" stroke="#b39645" stroke-width="7"/>`
        );
      }
      default:
        return '';
    }
  },
};

const STILER = { skisse: SKISSE, plassholder: PLASSHOLDER };

export function tegnBrikke(id, stil = 'plassholder') {
  const t = STILER[stil];
  const o = OPPSETT[id];
  if (!o) throw new Error(`Ukjent brikke: ${id}`);
  const lag = [t.defs(), t.grunn()];

  if (o.helBorg) lag.push(t.borg(HEL));
  for (const side of o.borgKapper ?? []) lag.push(t.borg(KAPPE[side].flate));
  const diagonal = o.diagonal && DIAGONALER[o.diagonal === true ? 'NV' : o.diagonal];
  if (diagonal) lag.push(t.borg(diagonal.flate));
  for (const side of o.engKapper ?? []) lag.push(t.eng(KAPPE[side].flate));

  for (const d of o.elver ?? []) lag.push(t.elv(d));
  if (o.kilde) lag.push(t.kilde(...o.kilde));
  if (o.vatn) lag.push(t.vatn(...o.vatn));
  for (const d of o.veier ?? []) lag.push(t.vei(d));
  for (const b of o.bro ?? []) lag.push(t.bro(...b));

  for (const side of o.borgKapper ?? []) lag.push(t.palisade(KAPPE[side].bue));
  for (const side of o.engKapper ?? []) lag.push(t.palisade(KAPPE[side].bue));
  if (diagonal) lag.push(t.palisade(diagonal.bue));

  const porter = o.port ? (Array.isArray(o.port[0]) ? o.port : [o.port]) : [];
  for (const p of porter) lag.push(t.port(...p));
  if (o.tun) lag.push(t.tun(...o.tun));
  for (const h of o.hus ?? []) lag.push(t.hus(h));
  if (o.runestein) lag.push(t.runestein(...o.runestein));
  if (o.hov) lag.push(t.hov(...o.hov));
  if (o.storhov) lag.push(t.storhov(...o.storhov));
  for (const g of o.gjestgiveri ?? []) lag.push(t.gjestgiveri(...g));
  for (const p of o.pynt ?? []) lag.push(t.pynt(p));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${lag.join('')}</svg>`;
}
