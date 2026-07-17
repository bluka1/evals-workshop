# Radionica: LLM evalsi (Node.js/TypeScript + Evalite)

Starter repo za 30-minutnu hands-on radionicu.

[Evalite](https://www.evalite.dev/) je TypeScript-native, local-first alat za testiranje LLM aplikacija, izgrađen na Vitestu. Rezultati se spremaju u lokalni SQLite, a UI je dostupan na `http://localhost:3006`.

Repo sadrži konfiguraciju, provider te skeleton evala s jednim scorerom. Tijekom radionice sudionici dodaju preostale scorere (`isJson`, `schemaValid`, `llmRubric`) i iteriraju prompt; gotova verzija nalazi se na `final` branchu.

- `evalite.config.ts` — konfiguracija (timeout, concurrency, score threshold, storage, UI port)
- `provider.ts` — konfiguracija modela (Ollama lokalni / Anthropic), jednostavno prebacivanje
- `evals/shared.ts` — `SYSTEM_PROMPT`, `TESTOVI` (8 test caseova), `TestCase` tip
- `evals/trijaza.eval.ts` — definicija evala: `task` (poziv modela) + registrirani scorers
- `scorers/fields.ts` — `fieldsMatch` scorer (usporedba izlaznih polja s očekivanjima)
- `scorers/types.ts` — dijeljeni tipovi (`Expected`, `EmailInput`)

---

## 1. Setup (napraviti PRIJE radionice)

Zahtijeva **Node 22 LTS** (`.nvmrc` je pinan na `22.22.2`). Node 22 ima prebuilt binarku za `better-sqlite3`, pa instalacija prolazi bez kompajliranja.

```bash
nvm use          # aktivira Node 22 iz .nvmrc
npm install
# Instaliraj i pokreni Ollama (lokalni LLM server):
#   brew install ollama  &&  ollama serve   # u zasebnom terminalu
#   ollama pull gemma3                        # povuci model (~3.3 GB, jednom)
```

Model se poziva preko lokalnog Ollama servera na `http://localhost:11434` — nema API ključeva ni troškova, radi offline. (Za Anthropic umjesto Ollame: odkomentiraj `anthropic` linije u `provider.ts` i upiši `ANTHROPIC_API_KEY` u `.env`.)

---

## 2. Pokretanje evala

```bash
npm run eval                                          # svi testovi (jednom, CI mode)
npm run watch                                         # watch mode — rerun na promjenu .eval.ts datoteke
npx evalite evals/trijaza.eval.ts                     # samo specificna datoteka
npx evalite --threshold=80                            # exit 1 ako je prosječni score < 80%
```

`npm run eval` poziva lokalni Ollama model — nema troškova ni API poziva. (S Anthropicem bi trošio tokene.)

---

## 3. Čitanje rezultata

### U terminalu (odmah nakon eval-a)

- Tablica: redak = test case, stupci = scorers. Score po ćeliji (0–1).
- Na dnu: ukupni score i `Threshold` (75%). Ako je prosjek ispod thresholda, exit 1.

### U web UI-ju (puno pregledniji)

```bash
npm run view    # pokreće evals jednom + drži UI server na http://localhost:3006
```

1. Otvori `http://localhost:3006` u browseru.
2. Pogledaj ukupni pass rate gore — to je "ocjena prompta".
3. Klikni na crveni (FAIL) test case.
4. Pročitaj **stvarni output modela** — ne samo pass/fail!
5. Pročitaj koji je scorer pao i njegov `rationale` (iz metadata).
6. Postavi si pitanje: je li kriv **prompt**, **test** ili **model**?

Svaki `npm run eval` sprema zaseban run u SQLite (`./evalite.db`). U web UI-ju možeš usporediti runove prije i poslije promjene prompta — promjena prompta prestaje biti "osjećaj" i postaje mjerljiva.

---

## Bilješke

- Evalite je označen kao *experimental* (mogu breaking changes između verzija). Pinan `evalite@^0.19.0`.
- Ako `npm install` pada na `better-sqlite3`, provjeri da si na Node 22 (`nvm use`) — postoji prebuilt binarka, nema kompajliranja preko `node-gyp`.
- **Lokalni model (Ollama)**: `gemma3:latest` radi 100% na GPU, ~2 s po pozivu, bez troškova i offline. Ako je model prespor, provjeri `ollama ps` — ako piše `CPU/GPU` podijeljeno, model ne stane cijeli u GPU (često zbog prevelikog default context windowa). Rješenje: custom Modelfile s `num_ctx 4096`.
- **Anthropic (alternativa)**: odkomentiraj `anthropic` linije u `provider.ts` i upiši `ANTHROPIC_API_KEY` u `.env`. Novi računi dobiju 5 USD kredita — dovoljno za sve radionice.
