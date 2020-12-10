// ensure random is predictable
Math.random = function random() {
  return 0.5
}

require('jest-fetch-mock').enableMocks()

process.env.TZ = 'UTC'

global.IntersectionObserver = class IntersectionObserver {
  constructor() {}

  disconnect() {
    return null
  }

  observe() {
    return null
  }

  takeRecords() {
    return null
  }

  unobserve() {
    return null
  }
}
