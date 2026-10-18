import { compilerFamily } from '@celo/protocol/lib/compatibility/internal'
import { assert } from 'chai'

describe('#compilerFamily()', () => {
  it('keeps the language generation and drops the patch release and commit', () => {
    assert.equal(compilerFamily('0.8.19+commit.7dd6d404'), '0.8')
    assert.equal(compilerFamily('0.8.37+commit.1a2b3c4d'), '0.8')
    assert.equal(compilerFamily('0.5.13+commit.5b0ffab'), '0.5')
  })

  it('returns an unparseable version unchanged', () => {
    assert.equal(compilerFamily('unknown'), 'unknown')
  })
})
