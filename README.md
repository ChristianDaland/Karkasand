# Karkasand

Et flisleggingsspill i nettleseren, inspirert av Carcassonne og satt i vikingtidens Norden. To spillere bygger borger, ferdaveier og hov sammen. Brettet vises på en felles skjerm, og hver spiller styrer med mobilen sin.

## Slik spiller du

1. Åpne spillet på storskjermen og velg **Spill på skjerm** (TV/PC) eller **Spill på bordet** (prosjektor som lyser ned på et bord).
2. Begge spillerne skanner QR-koden med mobilen, skriver navnet sitt og velger farge. I bordmodus velger de også hvilken side av bordet de sitter ved.
3. Trykk **Start spillet** på en av mobilene.
4. Når det er din tur, flytter du brikken med pilene og roterer den med ⟳. «Neste plass» hopper til neste rute der brikken passer. Trykk **Legg brikken**.
5. Velg om du vil sette ut en viking på brikken du nettopp la.

I bordmodus følger pilene siden du sitter ved. «Opp» betyr alltid bort fra deg.

### Poeng

| Område | Ferdig under spillet | Ved slutten (uferdig) |
|---|---|---|
| Borg | 2 per brikke + 2 per runestein | 1 per brikke + 1 per runestein |
| Vei | 1 per brikke | 1 per brikke |
| Hov | 9 når det er omringet | 1 + antall brikker rundt |
| Eng | – | 3 per ferdig borg enga grenser til |

Den som har flest vikinger i et område får poengene. Står det likt, får alle de som deler førsteplassen poengene.

## Utvikling

```bash
npm install
npm run dev      # starter serveren på http://localhost:3000 og starter på nytt ved endringer
npm test         # tester spillmotoren
npm run skisser  # lager skissene på nytt i kunst/skisser/ (krever Google Chrome og ImageMagick)
```

Når du kjører lokalt, peker QR-koden til maskinens IP-adresse på nettverket. Mobilene må da være på samme nett.

### Mapper

| Mappe | Innhold |
|---|---|
| `delt/` | Brikkedata, spillmotor og brikketegning. Brukes av både serveren og nettleseren. |
| `server/` | Express- og Socket.IO-server og spillrommene |
| `public/` | Nettsidene: startside, storskjerm, mobilkontroll og galleri |
| `kunst/brikker/` | De malte brikkebildene (`A.jpg` til `X.jpg`) |
| `kunst/skisser/` | Skisser som brukes som maler for maleriene |
| `docs/BRIKKER.md` | Beskrivelse av alle brikkene, med krav til bildene |
| `test/` | Tester for spillmotoren |

### Malte brikker

Legg bildene i `kunst/brikker/`, så tar spillet dem i bruk automatisk. Brikker som mangler bilde, tegnes med en midlertidig illustrasjon. Siden `/galleri` viser hvilke brikker som er malt og har et tilfeldig brett der du kan sjekke at kantene passer sammen. Se [docs/BRIKKER.md](docs/BRIKKER.md).

## Publisering på Render

Repoet har en `render.yaml`. Gå til Render, velg **New → Blueprint** og koble til GitHub-repoet, så settes tjenesten opp automatisk. Alternativt kan du lage en **Web Service** med byggkommandoen `npm ci --omit=dev` og startkommandoen `npm start`.

På gratisplanen går tjenesten i dvale etter en stund uten bruk, og første oppstart tar da opptil et minutt. Spill som pågår ligger i minnet og forsvinner hvis tjenesten starter på nytt.
