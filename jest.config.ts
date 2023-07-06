import type { JestConfigWithTsJest } from 'ts-jest';

export default <JestConfigWithTsJest>{
	transform: { '^.+\\.ts$': ['ts-jest', { useESM: true }] },
	moduleNameMapper: { '@slangroom/(.*)': '<rootDir>/pkg/$1' },
	testMatch: ['<rootDir>/pkg/*/**/*.test.ts'],
	forceCoverageMatch: ['<rootDir>/pkg/*/**/*.test.ts'],
	collectCoverageFrom: ['<rootDir>/pkg/*/**/*.ts'],
	coverageDirectory: '<rootDir>/.coverage/',
	testEnvironment: 'node',
	errorOnDeprecated: true,
	extensionsToTreatAsEsm: ['.ts'],
	reporters: ['default', ['jest-junit', { outputDirectory: '<rootDir>/.coverage' }]],
};
