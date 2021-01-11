export interface TestCase {
  label: string
}

export function describeEach<T extends TestCase>(testCases: T[], fn: (testCase: T) => void) {
  for (const testCase of testCases) {
    describe(testCase.label, () => fn(testCase))
  }
}
