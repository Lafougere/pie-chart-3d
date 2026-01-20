/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
// import path from 'node:path'
// import { fileURLToPath } from 'node:url'
// import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
// import { playwright } from '@vitest/browser-playwright'
// const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))
import dts from 'vite-plugin-dts'
// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
	plugins: [dts({ insertTypesEntry: true })],
	build: {
		lib: {
			entry: 'src/pie-chart-3d.ts',
			formats: ['es'],
		},
		rollupOptions: {
			output: {
				manualChunks: {
					// 'three-addons': ['three/addons'],
					// // 'three-examples': ['three/examples/jsm'],
					// three: ['three'],
					// tweenjs: ['@tweenjs/tween.js'],
					// lit: ['lit'],
				},
			},
		},
	},
	// test: {
	// 	projects: [
	// 		{
	// 			extends: true,
	// 			plugins: [
	// 				// The plugin will run tests for the stories defined in your Storybook config
	// 				// See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
	// 				storybookTest({
	// 					configDir: path.join(dirname, '.storybook'),
	// 				}),
	// 			],
	// 			test: {
	// 				name: 'storybook',
	// 				browser: {
	// 					enabled: true,
	// 					headless: true,
	// 					provider: playwright({}),
	// 					instances: [
	// 						{
	// 							browser: 'chromium',
	// 						},
	// 					],
	// 				},
	// 				setupFiles: ['.storybook/vitest.setup.ts'],
	// 			},
	// 		},
	// 	],
	// },
})
