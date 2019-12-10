const Sentry = {
  config: () => ({ install: jest.fn() }),
  setTagsContext: jest.fn(),
  captureException: jest.fn(),
}

module.exports = Sentry
