import { buildDirectoryForRef } from '@celo/protocol/lib/compatibility/utils'
import { assert } from 'chai'

describe('#buildDirectoryForRef()', () => {
  it('keeps a tag name as is', () => {
    assert.equal(buildDirectoryForRef('core-contracts.v17'), './out-core-contracts.v17')
    assert.equal(
      buildDirectoryForRef('core-contracts.v17', 'truffle-compat'),
      './out-core-contracts.v17-truffle-compat'
    )
  })

  it('flattens slashes in branch names the way release-lib.sh does', () => {
    assert.equal(
      buildDirectoryForRef('release/core-contracts/18', 'truffle-compat8'),
      './out-release_core-contracts_18-truffle-compat8'
    )
  })
})
