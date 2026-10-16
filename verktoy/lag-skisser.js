// Lager én flat fargeskisse (1024x1024) per brikketype i kunst/skisser/.
// Skissene er maler for AI-maleriet: de viser nøyaktig hvor borg, vei og eng
// ligger, slik at kantene på de malte brikkene passer sammen.
//
// Bruk: npm run skisser            (krever Google Chrome og ImageMagick for PNG-utdata)
//       npm run skisser -- plassholder   lager i stedet de illustrerte plassholderne

import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { BRIKKER } from '../delt/brikker.js';
import { tegnBrikke } from '../delt/tegning.js';

const stil = process.argv[2] ?? 'skisse';
const mappe = stil === 'skisse' ? 'skisser' : stil;
const UT = new URL(`../kunst/${mappe}/`, import.meta.url).pathname;
mkdirSync(UT, { recursive: true });

for (const b of BRIKKER) {
  writeFileSync(`${UT}${b.id}.svg`, tegnBrikke(b.id, stil));
  // Chrome tegner SVG riktig (ImageMagick sin egen tegner bommer på mønstre og rotasjon)
  execFileSync('google-chrome', [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1024,1024',
    `--screenshot=${UT}${b.id}.png`, `file://${UT}${b.id}.svg`,
  ], { stdio: 'ignore' });
}

// Oversiktsark med navn og antall under hver skisse
execFileSync('montage', [
  ...BRIKKER.flatMap((b) => ['-label', `${b.id}  ${b.navn}  (x${b.antall})`, `${UT}${b.id}.png`]),
  '-tile', '6x', '-geometry', '256x256+12+12', '-pointsize', '15', '-background', '#f4efe6',
  `${UT}oversikt.png`,
]);

console.log(`Laget ${BRIKKER.length} bilder (${stil}) i ${UT}`);
