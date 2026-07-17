import { createScorer } from 'evalite';
import type { EmailInput, Expected } from './types';

const PROVJERENA_POLJA = ['kategorija', 'sentiment', 'prioritet'] as const;

type Polje = (typeof PROVJERENA_POLJA)[number];

function parseOutput(output: string): Record<string, unknown> | null {
	try {
		return JSON.parse(output) as Record<string, unknown>;
	} catch {
		return null;
	}
}

// export const templateScorer = createScorer<EmailInput, string, Expected>({
// 	name: 'Primjer Template Scorera',
// 	description: 'Ovo je samo primjer template scorer funkcije.',
// 	scorer: ({ output, expected }) => {
// 		// Ovdje ide tvoja logika za usporedbu output-a i expected vrijednosti
// 		// Npr:
// 		// if (output === expected.nekoPolje) {
// 		//     return 1;
// 		// }
// 		// return { score: 0, metadata: { rationale: 'Ne podudara se' } };
// 		return 1; // Placeholder vrijednost
// 	},
// });

// createScorer<input, output, expected>
export const fieldsMatch = createScorer<EmailInput, string, Expected>({
	name: 'Polja se podudaraju',
	description: 'Izlazna polja odgovaraju očekivanjima iz testa.',
	scorer: ({ output, expected }) => {
		const data = parseOutput(output);
		if (!data) {
			return { score: 0, metadata: { rationale: 'Output nije validan JSON' } };
		}

		const razlike: string[] = [];
		for (const polje of PROVJERENA_POLJA) {
			const ocekivano = expected?.[polje as Polje];
			if (ocekivano !== undefined && data[polje] !== ocekivano) {
				razlike.push(
					`${polje}: očekivano "${ocekivano}", dobiveno "${data[polje]}"`,
				);
			}
		}

		if (razlike.length > 0) {
			return { score: 0, metadata: { rationale: razlike.join('; ') } };
		}

		return 1;
	},
});
