const originalConsoleError = console.error

console.error = (message) => {
  if (/(Failed prop type)/.test(message)) {
    return
  }

  originalConsoleError(message)
}
