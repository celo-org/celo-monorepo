import { buildDirectoryForRef } from '@celo/protocol/lib/compatibility/utils'
import { resolveBuildDirectories } from '@celo/protocol/lib/compatibility/internal'
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

describe('#resolveBuildDirectories()', () => {
  const existing = (dirs: string[]) => (path: string) => dirs.includes(path)

  it('uses the profile directories a pre-migration tag builds into', () => {
    const dirs = resolveBuildDirectories(
      './out-core-contracts.v17',
      existing([
        './out-core-contracts.v17-truffle-compat',
        './out-core-contracts.v17-truffle-compat8',
      ])
    )
    assert.deepEqual(dirs, {
      buildDir05: './out-core-contracts.v17-truffle-compat',
      buildDir08: './out-core-contracts.v17-truffle-compat8',
    })
  })

  it('falls back to the solc05 proxies build and the default 0.8 build of the unified layout', () => {
    const dirs = resolveBuildDirectories(
      './out-core-contracts.v18',
      existing(['./out-core-contracts.v18-solc05', './out-core-contracts.v18'])
    )
    assert.deepEqual(dirs, {
      buildDir05: './out-core-contracts.v18-solc05',
      buildDir08: './out-core-contracts.v18',
    })
  })
})
