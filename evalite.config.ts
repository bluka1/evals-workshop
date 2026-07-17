import { defineConfig } from 'evalite/config';
import { createSqliteStorage } from 'evalite/sqlite-storage';

try {
	process.loadEnvFile();
} catch {}

export default defineConfig({
	testTimeout: 60000,
	maxConcurrency: 3,
	scoreThreshold: 75,
	hideTable: false,
	server: {
		port: 3006,
	},
	storage: () => createSqliteStorage('./evalite.db'),
});
