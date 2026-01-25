// Jest setup file
require('@testing-library/jest-dom')

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.UPLOAD_DIR = './uploads'
process.env.NODE_ENV = 'test'

// Mock next-auth internals before any imports
jest.mock('openid-client', () => ({
  Issuer: {
    discover: jest.fn(),
  },
}))

// Suppress console errors in tests (optional)
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: useLayoutEffect does nothing on the server') ||
       args[0].includes('Cannot read properties'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
