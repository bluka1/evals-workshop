import { evalite } from "evalite";
import { generateObject } from "ai";
import { isJson, schemaValid } from "../scorers/schema";
import { fieldsMatch } from "../scorers/fields";
import { llmRubric } from "../scorers/llm-rubric";
import { rawOutput } from "../scorers/raw";
import type { Expected } from "../scorers/types";
import { trijazaSchema } from "../scorers/trijaza-schema";
import { model } from "../provider";
import { SYSTEM_PROMPT, TESTOVI } from "./shared";

export default evalite<string, string, Expected>(
  "Trijaža support emailova (generateObject)",
  {
    data: TESTOVI,
    task: async (email: string) => {
      const { object } = await generateObject({
        model: model(),
        system: SYSTEM_PROMPT,
        prompt: email,
        schema: trijazaSchema,
      });
      return JSON.stringify(object);
    },
    scorers: [rawOutput, isJson, schemaValid, fieldsMatch, llmRubric],
  },
);
