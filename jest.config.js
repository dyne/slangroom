module.exports = {
	roots: ['<rootDir>/src'],
	testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest'
	},
	reporters: ['default', 'jest-junit'],
	coverageReporters: ['html', 'json', 'lcov', 'text'],
	coverageThreshold: { global: { lines: 90 } }
};
