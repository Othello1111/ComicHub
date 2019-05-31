module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['src/**/*.test.ts'],
    testPathIgnorePatterns: ['/node_modules/', '/server/', '/dist/'],
    coverageReporters: ['text-summary', 'lcov'],
    collectCoverageFrom: ['src/**/*.ts'],
    bail: true
};