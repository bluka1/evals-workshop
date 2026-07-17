# Radionica: LLM evalsi (Node.js/TypeScript + Evalite)

Starter repo za 30-minutnu hands-on radionicu.

[Evalite](https://www.evalite.dev/) je TypeScript-native, local-first alat za testiranje LLM aplikacija, izgrađen na Vitestu. Rezultati se spremaju u lokalni SQLite, a UI je dostupan na `http://localhost:3006`.

## Struktura

- `evals/trijaza.eval.ts` — definicija evala: task (poziv modela), test caseovi i scorers
- `evals/trijaza-object.eval.ts` — varijanta s `generateObject` (strukturirani output)
- `evals/shared.ts` — dijeljeni `SYSTEM_PROMPT`, `TESTOVI` i `TestCase` tip
- `provider.ts` — konfiguracija modela (Ollama lokalni / Anthropic), jednostavno prebacivanje
- `scorers/trijaza-schema.ts` — dijeljena Zod schema + `parseTrijazaOutput` helper
- `scorers/schema.ts` — `isJson` + `schemaValid` scorers (validacija JSON scheme i enuma)
- `scorers/fields.ts` — `fieldsMatch` scorer (usporedba izlaznih polja s očekivanjima)
- `scorers/llm-rubric.ts` — `llmRubric` scorer (LLM-as-judge za subjektivne kriterije)
- `scorers/types.ts` — dijeljeni tipovi (`Expected`, `EmailInput`)
- `evalite.config.ts` — konfiguracija (timeout, concurrency, score threshold, storage, UI port)

---

## 1. Setup (napraviti PRIJE radionice)

Zahtijeva **Node 22 LTS** (`.nvmrc` je pinan na `22.22.2`). Node 22 ima prebuilt binarku za `better-sqlite3`, pa instalacija prolazi bez kompajliranja.

```bash
nvm use          # aktivira Node 22 iz .nvmrc
npm install
# Instaliraj i pokreni Ollama (lokalni LLM server):
#   brew install ollama  &&  ollama serve   # u zasebnom terminalu
#   ollama pull gemma3                        # povuci model (~3.3 GB, jednom)
npm run eval     # provjeri da sve radi end-to-end
```

Model se poziva preko lokalnog Ollama servera na `http://localhost:11434` — nema API ključeva ni troškova, radi offline. (Za Anthropic umjesto Ollame: odkomentiraj `anthropic` linije u `provider.ts` i upiši `ANTHROPIC_API_KEY` u `.env`.)

---

## 2. Kako NAPISATI eval (korak po korak)

Eval se sastoji od tri dijela u `evals/trijaza.eval.ts`:

```ts
evalite<string, string, Expected>("Ime evala", {
  data: [                          // 1. test caseovi (input + očekivanja)
    { input: "Tekst korisničkog emaila", expected: { kategorija: "racun" } },
  ],
  task: async (email: string) => {  // 2. TASK — poziva LLM (lokalni Ollama model), vraća output
    const { text } = await generateText({ model: model(), system: SYSTEM_PROMPT, prompt: email });
    return text;
  },
  scorers: [isJson, schemaValid, fieldsMatch, llmRubric],  // 3. SCORERS — ocjenjuju output
});
```

Svaki test case u `data` nizu ima:

```ts
{
  input: "Tekst korisničkog emaila",       // INPUT — ide u task funkciju
  expected: {                               // OČEKIVANJA — čitaju scorers
    kategorija: "racun",
    sentiment: "negativan",
    rubric: "Sažetak spominje duplu naplatu.",  // za llmRubric scorer
  },
}
```

Postupak za dodavanje novog testa:

1. Otvori `evals/trijaza.eval.ts` i nađi niz `TESTOVI`.
2. Kopiraj postojeći test i promijeni `input` (email) i `expected` (očekivanja).
3. **Prvo napiši očekivanje riječima** ("model mora prepoznati da je ovo prodaja
   i visok prioritet"), pa ga tek onda pretvori u `expected` polja.
4. Odaberi najjeftiniji scorer koji može provjeriti to očekivanje:

   | Scorer | Kada | Gdje |
   |---|---|---|
   | `isJson` | je output validan JSON | `scorers/schema.ts` |
   | `schemaValid` | enum vrijednosti + dužina sažetka | `scorers/schema.ts` |
   | `fieldsMatch` | točna vrijednost polja (`kategorija`, `sentiment`, `prioritet`) | `scorers/fields.ts` |
   | `llmRubric` | subjektivno (ton, točnost sažetka) — `expected.rubric` | `scorers/llm-rubric.ts` |

5. Sva 4 scorera vrijede za SVAKI test automatski. Ako `expected` ne sadrži
   neko polje (npr. `prioritet`), `fieldsMatch` preskače to polje; ako `expected`
   nema `rubric`, `llmRubric` vraća 1 (preskače se).

Pravila dobrog test casea:
- Jedan test = jedno očekivanje. Bolje 3 mala testa nego 1 s 10 polja u `expected`.
- Uvijek uključi barem 1 edge case (prazan input, dvije teme, injection).
- Najbolji testovi dolaze iz stvarnih produkcijskih failova — kopiraj pravi
  (anonimizirani) email koji je model nekad krivo obradio.

---

## 3. Kako POKRENUTI evalse

```bash
npm run eval                                          # svi testovi (jednom, CI mode)
npm run watch                                         # watch mode — rerun na promjenu .eval.ts datoteke
npx evalite evals/trijaza.eval.ts                     # samo specificna datoteka
npx evalite --threshold=80                            # exit 1 ako je prosječni score < 80%
```

`npm run eval` poziva lokalni Ollama model — nema troškova ni API poziva. (S Anthropicem bi trošio tokene.)

---

## 4. Kako ČITATI rezultate

### U terminalu (odmah nakon eval-a)

- Tablica: redak = test case, stupci = scorers. Score po ćeliji (0–1).
- Na dnu: ukupni score i `Threshold` (75%). Ako je prosjek ispod thresholda, exit 1.
- Kod FAIL-a scorer `schemaValid` i `fieldsMatch` vraćaju `rationale` u metadata
  (npr. `kategorija "upit" nije jedna od: racun, tehnicki_problem, ...`).

### U web UI-ju (za radionicu obavezno — puno pregledniji)

```bash
npm run view    # pokreće evals jednom + drži UI server na http://localhost:3006
```

Postupak čitanja:

1. Otvori `http://localhost:3006` u browseru.
2. Pogledaj ukupni pass rate gore — to je tvoja "ocjena prompta".
3. Klikni na crveni (FAIL) test case.
4. Pročitaj **stvarni output modela** — ne samo pass/fail! Ovo je najvažniji korak.
5. Pročitaj koji je scorer pao i njegov `rationale` (iz metadata).
6. Postavi si pitanje: je li kriv **prompt** (model nije dobro instruiran),
   **test** (moje očekivanje je bilo krivo/dvosmisleno) ili **model** (task pretežak)?

### Usporedba dviju verzija prompta

Svaki `npm run eval` sprema zaseban run u SQLite (`./evalite.db`). U web UI-ju
možeš usporediti runove prije i poslije promjene prompta — to je poanta cijele
priče: promjena prompta prestaje biti "osjećaj" i postaje mjerljiva.

---

## 5. Failure loop (srž radionice)

Test br. 5 (dvosmislen email) vjerojatno pada. Postupak:

1. `npm run view` → otvori pali test → pročitaj output.
2. Postavi hipotezu: "model bira tehnicki_problem jer je spomenut zadnji".
3. Promijeni `SYSTEM_PROMPT` u `evals/shared.ts` — npr. dodaj pravilo:
   *"Ako email sadrži više tema, odaberi onu koja traži akciju od nas."*
4. Ponovno pokreni **CIJELI** eval (`npm run eval`), ne samo pali test.
5. Provjeri: je li test 5 sad zelen? Jesu li testovi 1–4 OSTALI zeleni?
   Ako je fix razbio nešto drugo — upravo si vidio zašto evalsi postoje.

---

## 6. Dva evala: sirovi prompt vs. strukturirani output

Repo sadrži dva evala s **istim test caseovima i istim scorerima**, ali različitim taskom:

| Eval | Task | Što testira |
|---|---|---|
| `trijaza.eval.ts` | `generateText` + ručni `JSON.parse` | instruction-following — sluša li model "vrati čisti JSON, bez markdowna"? |
| `trijaza-object.eval.ts` | `generateObject` + Zod schema | hoće li strukturirani output riješiti format, a što ostaje? |

### Očekivani rezultati (baseline s `gemma3`)

- **`trijaza.eval.ts` ≈ 25%** — gemma3 omata JSON u `` ```json `` `` fence unatoč uputi "bez markdowna".
  `isJson` i `schemaValid` padaju (ručni `JSON.parse` pukne na backtickovima), `fieldsMatch`
  kaskadno pada jer nema parsiranog objekta. Prolazi samo `llmRubric` (ne parsira, šalje sirovi string sucu).
- **`trijaza-object.eval.ts` ≈ 97%** — `generateObject` šalje Zod schemu preko Ollamina strukturiranog
  outputa, pa SDK garantira shape. `isJson` i `schemaValid` su sad **trivijalno zeleni**. Ostaju
  smisleni samo `fieldsMatch` (jel odabrao pravu kategoriju) i `llmRubric` (jel sažetak dobar).
- **Ukupno ≈ 61%, ispod thresholda 75% → `exit 1`** — to je poenta: ima se što iterirati.

### Što usporedba uči

1. Pokreni `npm run view` i usporedi dva evala jedan pored drugog.
2. `generateObject` **rješava format** (fence, validan JSON, enumi) strukturno — ne ovisi o promptu.
   To vidiš jer object-eval ima `isJson`/`schemaValid` uvijek zelene.
3. Ali `generateObject` **ne rješava semantiku** — object-eval i dalje pada na `fieldsMatch`
   kad model fula kategoriju (npr. tehnicki_problem prepozna kao prodaja). To je onda pravi
   failure loop: čitaš output → hipoteza ("model ne razumije sarkazam") → pojačavaš prompt → rerun.
4. Zaključak: `generateObject` je produkcijski robusan izbor, ali **ne zamjenjuje evale** —
   maknuti formatne failove samo ti otkriva prave (semantičke) failove koje treba popraviti.

---

## Tijek radionice (30 min)

1. (5 min) `npm run eval` + `npm run view` — pokaži rezultate (oba evala)
2. (5 min) Prođi kroz anatomiju evala u `evals/trijaza.eval.ts` (data → task → scorers)
3. (8 min) Hands-on: svatko doda 2–3 svoja test casea (sekcija 2)
4. (7 min) Usporedba dva evala: sirovi prompt vs. `generateObject` (sekcija 6)
5. (3 min) Failure loop na padajućem testu (sekcija 5)
6. (2 min) Zaključak + zadaća: 3 test casea iz stvarnih bugova

---

## Bilješke

- Evalite je označen kao *experimental* (mogu breaking changes između verzija).
  Za radionicu (jednokratni setup) to nije problem; pinali smo `evalite@^0.19.0`.
- Ako `npm install` pada na `better-sqlite3`, provjeri da si na Node 22 (`nvm use`)
  — za Node 22 postoji prebuilt binarka i nema kompajliranja preko `node-gyp`.
- **Lokalni model (Ollama)**: `gemma3:latest` radi 100% na GPU, ~2 s po pozivu, bez troškova i offline.
  Ako je model prespor, provjeri `ollama ps` — ako piše `CPU/GPU` podijeljeno, model ne stane cijeli u
  GPU (često zbog prevelikog default context windowa). Rješenje: custom Modelfile s `num_ctx 4096`.
- **Anthropic (alternativa)**: odkomentiraj `anthropic` linije u `provider.ts` i upiši `ANTHROPIC_API_KEY`
  u `.env`. Novi računi dobiju 5 USD kredita — dovoljno za sve radionice.
