const originalConsoleError = console.error

// proptype warnings make tests impossible to understand
console.error = (message) => {
  if (/(Failed prop type)/.test(message) || /Warning: componentWillReceiveProps/.test(message)) {
    return
  }

  originalConsoleError(message)
}

// ensure random is predictable
Math.random = function random() {
  return 0.5
}

require('jest-fetch-mock').enableMocks()
