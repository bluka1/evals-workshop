import { defineConfig } from 'evalite/config';
import { createSqliteStorage } from 'evalite/sqlite-storage';

try {
	process.loadEnvFile();
} catch {}

export default defineConfig({
	testTimeout: 60000, // 60 seconds
	maxConcurrency: 3, // 3 concurrent tests
	scoreThreshold: 75, // 75% score to pass
	hideTable: false, // show table in results
	server: {
		port: 3006, // port for server
	},
	storage: () => createSqliteStorage('./evalite.db'), // sqlite database for results
});
