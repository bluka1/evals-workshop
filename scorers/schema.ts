import { createScorer } from "evalite";
import type { EmailInput, Expected } from "./types";
import { parseTrijazaOutput } from "./trijaza-schema";

function parseOutput(output: string): Record<string, unknown> | null {
  try {
    return JSON.parse(output) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export const isJson = createScorer<EmailInput, string, Expected>({
  name: "Validan JSON",
  description: "Output se može parsirati kao JSON.",
  scorer: ({ output }) => (parseOutput(output) ? 1 : 0),
});

export const schemaValid = createScorer<EmailInput, string, Expected>({
  name: "Schema valjana",
  description: "JSON ima ispravne ključeve i enum vrijednosti.",
  scorer: ({ output }) => {
    const result = parseTrijazaOutput(output);
    if (!result.ok) {
      return { score: 0, metadata: { rationale: result.error } };
    }
    return 1;
  },
});
