// Global teardown for coverage
after(async () => {
  if ((global as any).coverageSubprovider) {
    await (global as any).coverageSubprovider.writeCoverageAsync()
  }
})
