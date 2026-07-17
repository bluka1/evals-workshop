import { evalite } from "evalite";
import { generateText } from "ai";
import { isJson, schemaValid } from "../scorers/schema";
import { fieldsMatch } from "../scorers/fields";
import { llmRubric } from "../scorers/llm-rubric";
import { rawOutput } from "../scorers/raw";
import type { Expected } from "../scorers/types";
import { model } from "../provider";
import { SYSTEM_PROMPT, TESTOVI } from "./shared";

export default evalite<string, string, Expected>("Trijaža support emailova", {
  data: TESTOVI,
  task: async (email: string) => {
    const { text } = await generateText({
      model: model(),
      system: SYSTEM_PROMPT,
      prompt: email,
      maxOutputTokens: 200,
    });
    return text;
  },
  scorers: [rawOutput, isJson, schemaValid, fieldsMatch, llmRubric],
});
