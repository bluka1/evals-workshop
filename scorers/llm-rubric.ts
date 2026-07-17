import { createScorer } from "evalite";
import { generateObject } from "ai";
import { z } from "zod";
import type { EmailInput, Expected } from "./types";
import { judgeModel } from "../provider";

const SUDAC_SYSTEM = `Ti si sudac za kvalitetu izlaza modela za trijažu emailova.
Ocjenjuješ zadovoljava li izlaz zadani rubrik. Odgovori ISKLJUČIVO JSON-om.`;

export const llmRubric = createScorer<EmailInput, string, Expected>({
  name: "LLM rubric",
  description: "LLM-as-judge za subjektivne kriterije (ton, točnost sažetka).",
  scorer: async ({ input, output, expected }) => {
    const rubrik = expected?.rubric;
    if (!rubrik) {
      return 1;
    }

    const { object } = await generateObject({
      model: judgeModel(),
      system: SUDAC_SYSTEM,
      prompt: `Email:\n${input}\n\nIzlaz modela:\n${output}\n\nRubrik:\n${rubrik}\n\nZadovoljava li izlaz rubrik?`,
      schema: z.object({
        odgovor: z.enum(["da", "ne"]),
        obrazlozenje: z.string(),
      }),
    });

    return {
      score: object.odgovor === "da" ? 1 : 0,
      metadata: { rationale: object.obrazlozenje },
    };
  },
});
