import { evalite } from 'evalite';
import { generateText } from 'ai';
import type { Expected } from '../scorers/types';
import { model } from '../provider';
import { SYSTEM_PROMPT, TESTOVI, type TestCase } from './shared';
import { fieldsMatch } from '../scorers/fields';

type Input = TestCase['input'];
type ExpectedT = NonNullable<TestCase['expected']>;

/*
import { evalite } from 'evalite';

// evalite<inputType, outputType, expectedType>
evalite<NekiInput, NekiOutput, NekiExpected>('Naziv evaluacije', {
    data: nekaTestPodaci,
    task: async (input) => {
        // Generiši output na osnovu inputa, npr. poziv modela
        return nekiOutput;
    },
    scorers: [nekiScorer],
});
*/

// evalite<input, output, expected>
export default evalite<Input, string, ExpectedT>('Trijaža support emailova', {
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
	scorers: [fieldsMatch],
});
