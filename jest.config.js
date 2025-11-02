module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./tests/setupJest.ts'],
    testMatch: ['**/tests/**/*.test.ts'],
};