const Sequencer = require('@jest/test-sequencer').default

class AlphabeticSequencer extends Sequencer {
  // @ts-ignore
  sort(tests) {
    const copyTests = Array.from(tests)
    return copyTests.sort(
      // @ts-ignore
      (testA, testB) => (testA.path > testB.path ? 1 : -1)
    )
  }
}

module.exports = AlphabeticSequencer
