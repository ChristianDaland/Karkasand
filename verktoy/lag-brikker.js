// Maler brikkebildene med Z-Image Turbo i ComfyUI på AI-serveren. Promptene hentes
// fra docs/BRIKKER.md, og skissene i kunst/skisser/ bestemmer hvor alt havner:
//   1. Hele brikken males. Et kantkart av skissen styrer ControlNet. (Skissen som
//      startbilde med denoise under 1 gir flate felt eller rutemønstre, så det er av.)
//   2. Borggrunnen (med runesteinen) males på nytt med borgprompten. ControlNet ser
//      bare strekene og vet ellers ikke hvilken side av palisaden som er borg.
//      Grønt som likevel havner inne i borgen, gjøres grått etterpå.
//   3. Båndet langs kantene byttes ut med det samme båndet fra tre kildebilder som er
//      malt på samme måte: bare eng, bare borggrunn og en rett vei (dreid 90° for
//      øst–vest). Da møtes alle brikkene likt. Kildene lagres i kunst/teksturer/ og
//      lages på nytt hvis de slettes.
//
// Bruk: npm run brikker                       maler alle brikkene til kunst/brikker/
//       npm run brikker -- A D V              maler bare A, D og V
//       npm run brikker -- A --ut=kunst/proeve --seed=7
//
// Valg: --ut=<mappe>  --seed=<tall>  --denoise=<0–1>  --styrke=<ControlNet, 0–1>
//       --stoy=<fargestøy i startbildet>  --borgdenoise=<0–1>  --borgseed=<seed for borgrunden>
// Serveren settes med COMFY_URL (standard http://10.0.0.76:8188). Krever ImageMagick.

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { BRIKKER } from '../delt/brikker.js';

const COMFY = process.env.COMFY_URL ?? 'http://10.0.0.76:8188';
const ROT = new URL('../', import.meta.url).pathname;
const SKISSEFARGE = { eng: '#7fa65a', vei: '#c9a877', borg: '#9c7a55', stein: '#8a8f94', rune: '#b3322b', steinkant: '#3c3f42', helle: '#b8b2a4',
  elv: '#4f86b5', storhov: '#5e2a1a' };

const valg = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--'))
  .map((a) => a.slice(2).split('=')));
const ider = process.argv.slice(2).filter((a) => !a.startsWith('--')).map((a) => a.toUpperCase());
const seed = Number(valg.seed ?? 1066);
// Brikker der standard-seed ga feil: B fikk en sti ned til kanten (har ingen vei), X fikk
// åtte veier, H og I fikk borger av gress, og M og O fikk to runesteiner
const SEED = { B: 7, X: 99, H: 42, I: 42, M: 99, O: 99, R5: 42, R1: 123 };
// Eng som males på nytt som ren eng etter runde 1. W (tre veier) får ellers alltid en fjerde
// vei mot nord, fordi kantkartet er tomt der og modellen ser brønn i krysset som firveiskryss.
// «omrade» er rektanglene (x0,y0 x1,y1) som males på nytt; bare enga innenfor tas med.
// R1 (kilden) får elv i alle fire retninger, men elva skal bare renne mot vest.
// Seed for borgrunden (runde 2), der standard-seed ga feil vare, en vare som knapt synes, eller to runesteiner.
// Kan prøves med --borgseed=<tall>. En liste gir én seed per borg (for brikker med flere borger).
const BORGSEED = { M: 123, O: 123, H1: 123, H2: 42, H3: 123, H5: 42, H7: 42, H12: 7, H13: 42, H14: 7 };
const RENSK_ENG = {
  W: { omrade: ['420,0 604,430'] },
  G16: { omrade: ['420,0 604,430'] },
  // R1: elva fikk armer i alle retninger, men opprydding ga synlige skjøter; løst med seed i stedet
};
const denoise = Number(valg.denoise ?? 1.0);
const styrke = Number(valg.styrke ?? 1.0);
const stoy = Number(valg.stoy ?? 0);
const borgdenoise = Number(valg.borgdenoise ?? 1.0);
const UT = `${ROT}${valg.ut ?? 'kunst/brikker'}/`;
const ARBEID = `${UT}.arbeid/`;
const TEKSTURER = `${ROT}kunst/teksturer/`;
mkdirSync(ARBEID, { recursive: true });
mkdirSync(TEKSTURER, { recursive: true });

// Promptene fra docs/BRIKKER.md
const doc = readFileSync(`${ROT}docs/BRIKKER.md`, 'utf8');
const kodeEtter = (tekst, merke) => tekst.split(merke)[1].match(/```\n([\s\S]*?)\n```/)[1].trim();
const stil = kodeEtter(doc, '**Stilprompt (felles):**');
const borgprompt = kodeEtter(doc, '**Borgprompt (felles):**');
const kildeprompter = Object.fromEntries(kodeEtter(doc, '**Kantkilder (felles):**')
  .split('\n').map((linje) => linje.split(/:\s(.+)/).slice(0, 2)));
const prompter = Object.fromEntries(doc.split(/\n### /).slice(1)
  .filter((del) => /^[A-Z]\d* –/.test(del) && del.includes('**Prompt:**'))
  .map((del) => [del.split(' ')[0], kodeEtter(del, '**Prompt:**')]));
// Stilen for kantkildene: uten leddene som får modellen til å fylle en ensfarget flate med mønstre
const kildestil = stil.split(', ').filter((ledd) => !/board game|richly detailed|edge to edge|along all edges/.test(ledd)).join(', ');
// Stilen for borgrunden: uten mosegrønt, lyng og gress, ellers får husene grønne tak
const borgstil = stil.split(', ').filter((ledd) => !/moss green|heather|grass/.test(ledd)).join(', ');
const STORHOV = 'a great stave-church-like temple hall with tiered shingled roofs and carved dragon heads in the middle of the settlement';
const RUNESTEIN = 'a large prominent grey runestone with bright red serpent knotwork standing in the middle of a round stone-paved square';
// Varene i Handel og håndverk (samme beskrivelse som i docs/BRIKKER.md)
const VARE = {
  fisk: 'a large wooden drying rack (hjell) full of pale dried stockfish hanging in rows, clearly visible in the open yard',
  jern: 'an open blacksmith forge with a glowing fire, an anvil and a big stack of dark iron bars, clearly visible in the open yard',
  korn: 'a wooden grain store (stabbur) on stone posts with many golden sheaves of grain stacked in front of it, clearly visible in the open yard',
};

const magick = (...args) => execFileSync('convert', args.flat());
const snitt = (fil) => Number(execFileSync('convert', [fil, '-format', '%[fx:mean]', 'info:']).toString());

async function api(sti, init) {
  const svar = await fetch(`${COMFY}${sti}`, init);
  if (!svar.ok) throw new Error(`${sti}: ${svar.status} ${await svar.text()}`);
  return svar;
}

async function lastOpp(fil, navn) {
  const skjema = new FormData();
  skjema.append('image', new Blob([readFileSync(fil)], { type: 'image/png' }), navn);
  skjema.append('overwrite', 'true');
  return (await (await api('/upload/image', { method: 'POST', body: skjema })).json()).name;
}

// Kjører en arbeidsflyt og henter bildet fra SaveImage-noden 'lagre'
async function kjor(arbeidsflyt) {
  const { prompt_id } = await (await api('/prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: arbeidsflyt }),
  })).json();
  for (;;) {
    const historikk = (await (await api(`/history/${prompt_id}`)).json())[prompt_id];
    if (historikk?.status?.status_str === 'error') throw new Error(JSON.stringify(historikk.status.messages));
    if (historikk?.status?.completed) {
      const bilde = historikk.outputs.lagre.images[0];
      return Buffer.from(await (await api(`/view?${new URLSearchParams(bilde)}`)).arrayBuffer());
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}

const lastere = {
  unet: { class_type: 'UNETLoader', inputs: { unet_name: 'z_image_turbo_bf16.safetensors', weight_dtype: 'default' } },
  clip: { class_type: 'CLIPLoader', inputs: { clip_name: 'qwen_3_4b.safetensors', type: 'lumina2' } },
  vae: { class_type: 'VAELoader', inputs: { vae_name: 'ae.safetensors' } },
  modell: { class_type: 'ModelSamplingAuraFlow', inputs: { model: ['unet', 0], shift: 3 } },
};
const tekst = (navn, prompt) => ({
  [navn]: { class_type: 'CLIPTextEncode', inputs: { clip: ['clip', 0], text: prompt } },
  [`${navn}_tom`]: { class_type: 'ConditioningZeroOut', inputs: { conditioning: [navn, 0] } },
});
const sampler = (modell, prompt, latent, d, brikkeseed = seed) => ({
  class_type: 'KSampler',
  inputs: {
    model: [modell, 0], positive: [prompt, 0], negative: [`${prompt}_tom`, 0], latent_image: [latent, 0],
    seed: brikkeseed, steps: 8, cfg: 1, sampler_name: 'res_multistep', scheduler: 'simple', denoise: d,
  },
});

const styrtModell = (kantbilde) => ({
  patch: { class_type: 'ModelPatchLoader', inputs: { name: 'Z-Image-Turbo-Fun-Controlnet-Union-2.1-lite-2602-8steps.safetensors' } },
  kant: { class_type: 'LoadImage', inputs: { image: kantbilde } },
  styrt: {
    class_type: 'ZImageFunControlnet',
    inputs: { model: ['modell', 0], model_patch: ['patch', 0], vae: ['vae', 0], image: ['kant', 0], strength: styrke },
  },
});

// Hvit der skissen har en av fargene, svart ellers
const fargemaske = (skisse, farger, ut, ...etter) => magick(skisse, '-fuzz', '4%', '-fill', 'white',
  farger.flatMap((f) => ['-opaque', f]), '-fill', 'black', '+opaque', 'white', '-colorspace', 'gray', etter, ut);

const skisseAv = (id) => `${ROT}kunst/skisser/${id}.png`;
const filAv = (id) => (navn) => `${ARBEID}${id}_${navn}.png`;

// Maler ett område av brikken på nytt med en egen prompt. Området (masken fil(navn), med
// en myk utgave fil(navn + 'myk')) klippes ut og skaleres opp til ca. 1024 px, så modellen
// ser det som et helt bilde. Under området legges skissen, så runden starter fra riktig farge.
async function malPaaNytt(b, navn, prompt, d, { kontroll = true, borgseed = BORGSEED[b.id] } = {}) {
  const fil = filAv(b.id);
  // Rammen rundt området. Svart kant først, ellers regnes et område som dekker hjørnene som bakgrunn.
  const [, w, h, xr, yr] = execFileSync('convert', [fil(navn), '-bordercolor', 'black', '-border', '1', '-format', '%@', 'info:'])
    .toString().match(/(\d+)x(\d+)\+(\d+)\+(\d+)/).map(Number);
  const x = xr - 1, y = yr - 1;
  const x0 = Math.max(0, x - 48), y0 = Math.max(0, y - 48);
  const bw = Math.min(1024, x + w + 48) - x0, bh = Math.min(1024, y + h + 48) - y0;
  const skala = 1024 / Math.max(bw, bh);
  const [sw, sh] = [bw, bh].map((v) => Math.round((v * skala) / 16) * 16);
  const klipp = (inn, ut, ...etter) => magick(inn, '-crop', `${bw}x${bh}+${x0}+${y0}`, '+repage', '-resize', `${sw}x${sh}!`, etter, ut);
  magick(fil('malt'), fil('start'), fil(navn), '-composite', fil(`${navn}_grunn`));
  klipp(fil(`${navn}_grunn`), fil(`${navn}_grunn_klipp`));
  klipp(fil('kant'), fil(`${navn}_kant_klipp`), '-threshold', '50%');
  klipp(fil(navn), fil(`${navn}_klipp`));
  writeFileSync(fil(`${navn}_malt`), await kjor({
    ...lastere,
    ...styrtModell(await lastOpp(fil(`${navn}_kant_klipp`), `karkasand_${b.id}_${navn}_kant.png`)),
    start: { class_type: 'LoadImage', inputs: { image: await lastOpp(fil(`${navn}_grunn_klipp`), `karkasand_${b.id}_${navn}_grunn.png`) } },
    maskebilde: { class_type: 'LoadImage', inputs: { image: await lastOpp(fil(`${navn}_klipp`), `karkasand_${b.id}_${navn}.png`) } },
    maske: { class_type: 'ImageToMask', inputs: { image: ['maskebilde', 0], channel: 'red' } },
    ...tekst('p', prompt),
    latent: { class_type: 'VAEEncode', inputs: { pixels: ['start', 0], vae: ['vae', 0] } },
    maskert: { class_type: 'SetLatentNoiseMask', inputs: { samples: ['latent', 0], mask: ['maske', 0] } },
    k: sampler(kontroll ? 'styrt' : 'modell', 'p', 'maskert', d, Number(valg.borgseed ?? borgseed ?? seed)),
    bilde: { class_type: 'VAEDecode', inputs: { samples: ['k', 0], vae: ['vae', 0] } },
    lagre: { class_type: 'SaveImage', inputs: { images: ['bilde', 0], filename_prefix: `karkasand/${b.id}_${navn}` } },
  }));
  magick(fil('malt'), '(', fil(`${navn}_malt`), '-resize', `${bw}x${bh}!`, ')', '-geometry', `+${x0}+${y0}`, '-composite', fil(`${navn}_innsatt`));
  magick(fil('malt'), fil(`${navn}_innsatt`), fil(`${navn}myk`), '-composite', fil('malt'));
}

// Borgen skal bare ha gråtoner, brunt, hvitt og svart, slik at den skiller seg fra enga
// på en TV-skjerm. Det grønne modellen likevel maler inne i borgen (torvtak, busker,
// gress), gjøres grått. Fargetonen fra ca. 50° (gulgrønn torv) til 170° regnes som grønn,
// så gylne kornband og glo fra smia får stå.
function fjernGront(b) {
  const fil = filAv(b.id);
  magick(fil('malt'), '-colorspace', 'HSL', '-fx', 'u.r>0.14 && u.r<0.47 ? min(1, max(0, (u.g-0.08)*6)) : 0',
    '-channel', 'R', '-separate', '+channel', fil('borgmyk'), '-compose', 'multiply', '-composite', '-blur', '0x1', fil('gront'));
  magick(fil('malt'), '(', '+clone', '-modulate', '100,12', ')', fil('gront'), '-composite', fil('malt'));
}

// Runde 1 og 2. Gir stien til det malte bildet, før kantstripen.
// Brikkene i Handel og håndverk har formen til en grunnbrikke (b.form). Runde 1 bruker
// prompten og seeden til den, ellers maler modellen en ekstra innhegning med varen ute
// i enga. Varen males inn i runde 2, sammen med borgen.
async function malRunder(b, { skisse = skisseAv(b.id), prompt = `${prompter[b.form ?? b.id]}, ${stil}`, borgrunde = true, kontroll = true } = {}) {
  const fil = filAv(b.id);
  if (existsSync(fil('malt'))) return fil('malt');

  // Kantkart: en hvit strek ved hver fargeovergang. Canny i ComfyUI ser bare lysstyrke
  // og mister overganger mellom farger som er omtrent like lyse.
  magick(skisse, '-morphology', 'Edge', 'Diamond:1', '-separate', '-evaluate-sequence', 'max', '-threshold', '8%', fil('kant'));
  // Elva følger ikke kantkartet godt nok alene (den legger seg på skrå), så brikker med elv
  // starter fra skissen med fargestøy og litt lavere denoise. Ellers males alt fritt.
  fargemaske(skisse, [SKISSEFARGE.elv], fil('elv'));
  const harElv = snitt(fil('elv')) > 0.01;
  const stoyHer = harElv ? 6 : stoy;
  const denoiseHer = harElv ? Math.min(denoise, 0.85) : denoise;
  // Startbilde med fargestøy, ellers beholder modellen de flate feltene
  magick(skisse, ...(stoyHer ? ['-attenuate', String(stoyHer), '+noise', 'Gaussian', '-blur', '0x1.5'] : []), fil('start'));
  fargemaske(skisse, [SKISSEFARGE.borg, SKISSEFARGE.stein, SKISSEFARGE.rune, SKISSEFARGE.steinkant, SKISSEFARGE.helle, SKISSEFARGE.storhov], fil('borg'),
    '-morphology', 'Close', 'Disk:8');
  magick(fil('borg'), '-blur', '0x4', fil('borgmyk'));
  const harBorg = borgrunde && snitt(fil('borg')) > 0.01;

  // Runde 1: hele brikken
  writeFileSync(fil('malt'), await kjor({
    ...lastere,
    ...styrtModell(await lastOpp(fil('kant'), `karkasand_${b.id}_kant.png`)),
    start: { class_type: 'LoadImage', inputs: { image: await lastOpp(fil('start'), `karkasand_${b.id}.png`) } },
    ...tekst('p', prompt),
    latent: { class_type: 'VAEEncode', inputs: { pixels: ['start', 0], vae: ['vae', 0] } },
    k: sampler(kontroll ? 'styrt' : 'modell', 'p', 'latent', denoiseHer, valg.seed ? seed : SEED[b.id] ?? SEED[b.form] ?? seed),
    bilde: { class_type: 'VAEDecode', inputs: { samples: ['k', 0], vae: ['vae', 0] } },
    lagre: { class_type: 'SaveImage', inputs: { images: ['bilde', 0], filename_prefix: `karkasand/${b.id}` } },
  }));

  // Runde 2: borggrunnen klippes ut og skaleres opp, slik at modellen maler en hel
  // borg med hus og ikke bare fortsetter enga rundt. Under borgen legges den brune
  // skissen, så runden starter fra jord.
  if (harBorg) {
    const runestein = b.deler.some((d) => d.runestein) ? `, ${RUNESTEIN}` : '';
    const storhov = b.deler.some((d) => d.storhov) ? `, ${STORHOV}` : '';
    const medVare = b.deler.filter((d) => d.vare);
    if (medVare.length < 2) {
      const vare = medVare.length ? `, ${VARE[medVare[0].vare]}` : '';
      await malPaaNytt(b, 'borg', `${borgprompt}${runestein}${storhov}${vare}, ${borgstil}`, borgdenoise);
    } else {
      // Flere borger med hver sin vare: hver borg males for seg, ellers får bare én av dem varen.
      // Borgen er den delen av borgmasken som ligger nærmest vikingpunktet til delen.
      const punkter = medVare.map((d) => d.punkt.map((v) => v * 1024));
      for (const [i, d] of medVare.entries()) {
        const [x, y] = punkter[i];
        const naermest = punkter.filter((_, j) => j !== i)
          .map(([px, py]) => `hypot(i-${x},j-${y})<hypot(i-${px},j-${py})`).join('&&');
        magick(fil('borg'), '(', '+clone', '-fx', `${naermest}?1:0`, ')', '-compose', 'multiply', '-composite', fil(`borg${i}`));
        magick(fil(`borg${i}`), '-blur', '0x4', fil(`borg${i}myk`));
        await malPaaNytt(b, `borg${i}`, `${borgprompt}${runestein}${storhov}, ${VARE[d.vare]}, ${borgstil}`, borgdenoise,
          { borgseed: [BORGSEED[b.id]].flat()[i] });
      }
    }
    fjernGront(b);
  }
  // Rydd enga der modellen legger til noe som ikke skal være der (se RENSK_ENG)
  if (RENSK_ENG[b.id]) {
    fargemaske(skisse, [SKISSEFARGE.eng], fil('eng'), '(', '-size', '1024x1024', 'xc:black', '-fill', 'white',
      ...RENSK_ENG[b.id].omrade.flatMap((r) => ['-draw', `rectangle ${r}`]), ')', '-compose', 'multiply', '-composite');
    magick(fil('eng'), '-blur', '0x10', fil('engmyk'));
    // Uten ControlNet og uten «board game tile» i stilen: ellers blir det rutemønster
    await malPaaNytt(b, 'eng', `${kildeprompter.eng}, ${kildestil}`, 1, { kontroll: false });
  }

  return fil('malt');
}

// Runde 3: felles kantstripe. Hver kilde legges der skissen har den typen underlag,
// men bare i båndet langs kantene (nesten helt dekkende ut til ca. 30 px, så tones den
// ut mot ca. 90 px). Palisaden og alt annet som ikke er gress, vei eller borggrunn får stå.
function kantstripe(b, malt, kilder) {
  const skisse = skisseAv(b.id);
  const fil = filAv(b.id);
  const band = `${ARBEID}band.png`;
  if (!existsSync(band)) magick('-size', '1024x1024', 'xc:white', '-fill', 'black', '-draw', 'rectangle 56,56 967,967', '-blur', '0x14', band);
  let bilde = malt;
  for (const [type, kilde] of Object.entries(kilder)) {
    fargemaske(skisse, [SKISSEFARGE[type]], fil(`klasse_${type}`), '-blur', '0x2');
    magick(fil(`klasse_${type}`), band, '-compose', 'multiply', '-composite', fil(`maske_${type}`));
    if (snitt(fil(`maske_${type}`)) < 0.0005) continue;
    magick(bilde, kilde, fil(`maske_${type}`), '-composite', fil('kantet'));
    bilde = fil('kantet');
  }
  magick(bilde, '-resize', '1024x1024!', '-colorspace', 'sRGB', '-quality', '88', `${UT}${b.id}.jpg`);
}

// Snittfargen gress, vei og borggrunn har inne på de malte brikkene. Kantkildene flyttes
// hit, ellers blir kantbåndet brunere eller mørkere og rutenettet synes på brettet.
const MALFARGE = { eng: [112, 120, 51], vei: [171, 155, 116], borg: [110, 100, 66] }; // elva brukes som den er

// Flytter snittfargen i bildet (eller i utsnittet) til målfargen, kanal for kanal
function fargejuster(inn, ut, maal, utsnitt) {
  const snittfarge = execFileSync('convert', [inn, ...(utsnitt ? ['-crop', utsnitt, '+repage'] : []),
    '-format', '%[fx:255*mean.r] %[fx:255*mean.g] %[fx:255*mean.b]', 'info:']).toString().split(' ').map(Number);
  magick(inn, ['R', 'G', 'B'].flatMap((k, i) => ['-channel', k, '-evaluate', 'add', `${((maal[i] - snittfarge[i]) / 2.55).toFixed(2)}%`]),
    '+channel', ut);
}

// Kildene til kantstripen: tre bilder malt med samme stil som brikkene, men med bare
// eng, bare borggrunn og en rett vei nord–sør (promptene står under «Kantkilder» i
// docs/BRIKKER.md). Veien brukes som den er langs nord- og sørkanten, og dreid 90°
// langs øst- og vestkanten.
// Hvit i trekantene mot nord og sør, svart mot øst og vest
function diagonalMaske() {
  const fil = `${ARBEID}diagonal.png`;
  if (!existsSync(fil)) {
    magick('-size', '1024x1024', 'xc:black', '-fill', 'white', '-draw', 'polygon 0,0 1024,0 512,512',
      '-draw', 'polygon 0,1024 1024,1024 512,512', fil);
  }
  return fil;
}

async function lagKantkilder() {
  const kilder = { eng: `${TEKSTURER}eng.jpg`, borg: `${TEKSTURER}borg.jpg`, vei: `${TEKSTURER}vei.jpg`, elv: `${TEKSTURER}elv.jpg` };
  const ensfarget = (type) => {
    const fil = `${ARBEID}skisse_${type}.png`;
    magick('-size', '1024x1024', `xc:${SKISSEFARGE[type]}`, fil);
    return fil;
  };
  // Eng og borg males uten ControlNet: med et tomt kantkart finner den på mønstre selv.
  // Borggrunnen får den reduserte stilen, ellers fyller modellen den med stokker og heller.
  // Veien trenger både full stil og ControlNet for å ligge rett ovenfra og midt på.
  const mal = (type, skisse, { kontroll = false, medStil = stil } = {}) => malRunder({ id: `kilde_${type}`, deler: [] },
    { skisse, prompt: `${kildeprompter[type]}, ${medStil}`, borgrunde: false, kontroll });
  // Eng og borggrunn: bare midten brukes, speilet 2×2, så det modellen har lagt langs kantene forsvinner
  const speilMidten = (inn, ut) => magick(inn, '-gravity', 'center', '-crop', '512x512+0+0', '+repage',
    '(', '+clone', '-flop', ')', '+append', '(', '+clone', '-flip', ')', '-append', '-quality', '92', ut);
  if (!existsSync(kilder.eng)) speilMidten(await mal('eng', ensfarget('eng')), kilder.eng);
  if (!existsSync(kilder.borg)) speilMidten(await mal('borg', ensfarget('borg'), { medStil: kildestil }), kilder.borg);
  if (!existsSync(kilder.vei)) {
    const u = await mal('vei', skisseAv('U'), { kontroll: true });
    magick('(', u, '-rotate', '90', ')', u, diagonalMaske(), '-composite', '-quality', '92', kilder.vei);
  }
  // Elva: R3 går vest–øst, så her er det motsatt av veien
  if (!existsSync(kilder.elv)) {
    const r = await mal('elv', skisseAv('R3'), { kontroll: true });
    magick(r, '(', r, '-rotate', '90', ')', diagonalMaske(), '-composite', '-quality', '92', kilder.elv);
  }
  // Veien ligger i en stripe midt på (457–567 px), så fargen måles bare der
  const justert = {};
  for (const [type, fil] of Object.entries(kilder)) {
    justert[type] = `${ARBEID}kilde_${type}_justert.png`;
    if (MALFARGE[type]) fargejuster(fil, justert[type], MALFARGE[type], type === 'vei' ? '110x1024+457+0' : null);
    else magick(fil, justert[type]);
  }
  return justert;
}

const valgte = ider.length ? BRIKKER.filter((b) => ider.includes(b.id)) : BRIKKER;
for (const b of valgte) if (!prompter[b.id]) throw new Error(`Fant ingen prompt for ${b.id} i docs/BRIKKER.md`);
const kilder = await lagKantkilder();
for (const b of valgte) {
  const start = Date.now();
  kantstripe(b, await malRunder(b), kilder);
  console.log(`${b.id}  ${b.navn}  (${((Date.now() - start) / 1000).toFixed(0)} s)`);
}
if (!valg.behold) rmSync(ARBEID, { recursive: true });
console.log(`Ferdig: ${valgte.length} brikker i ${UT}`);
