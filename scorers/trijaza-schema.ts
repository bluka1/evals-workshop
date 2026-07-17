import { z } from "zod";

export const trijazaSchema = z.object({
  kategorija: z.enum(["racun", "tehnicki_problem", "prodaja", "ostalo"]),
  sentiment: z.enum(["pozitivan", "neutralan", "negativan"]),
  prioritet: z.enum(["nizak", "srednji", "visok"]),
  sazetak: z.string().refine(
    (s) => s.trim().length > 0 && s.trim().split(/\s+/).length <= 20,
    "sazetak je prazan ili ima više od 20 riječi",
  ),
});

export type TrijazaOutput = z.infer<typeof trijazaSchema>;

export type ParseResult =
  | { ok: true; data: TrijazaOutput }
  | { ok: false; error: string };

export function parseTrijazaOutput(output: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(output);
  } catch {
    return { ok: false, error: "Output nije validan JSON" };
  }

  const result = trijazaSchema.safeParse(json);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return {
    ok: false,
    error: result.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; "),
  };
}
