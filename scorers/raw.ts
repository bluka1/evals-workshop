import { createScorer } from "evalite";
import type { EmailInput, Expected } from "./types";

export const rawOutput = createScorer<EmailInput, string, Expected>({
  name: "Sirovi output",
  description: "Doslovni string koji je model vratio, prije bilo kakvog parsiranja.",
  scorer: ({ output }) => ({
    score: 1,
    metadata: { rationale: "````\n" + output + "\n````" },
  }),
});
