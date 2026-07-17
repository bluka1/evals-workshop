import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
// import { anthropic } from "@ai-sdk/anthropic";

const ollama = createOpenAICompatible({
  name: "ollama",
  baseURL: "http://localhost:11434/v1",
  supportsStructuredOutputs: true,
});

export const MODEL = "gemma3:latest";
export const JUDGE_MODEL = "gemma3:latest";
// export const MODEL = "claude-sonnet-4-6";
// export const JUDGE_MODEL = "claude-opus-4-8";

export function model() {
  return ollama(MODEL);
  // return anthropic(MODEL);
}

export function judgeModel() {
  return ollama(JUDGE_MODEL);
  // return anthropic(JUDGE_MODEL);
}
