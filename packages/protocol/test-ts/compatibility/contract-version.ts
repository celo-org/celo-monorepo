import { getContractVersion } from '@celo/protocol/lib/compatibility/ast-version'
import { DEFAULT_VERSION_STRING } from '@celo/protocol/lib/compatibility/version'
import { assert } from 'chai'

const artifactWithCode = (contractName: string, code: string) =>
  ({ contractName, deployedBytecode: { object: code } } as any)

describe('#getContractVersion()', () => {
  it('runs bytecode built for the EVM version the contracts target', async () => {
    // PUSH0 PUSH0 RETURN: valid from shanghai on, an invalid opcode before it. The reader
    // defaults to merge unless it is told otherwise, which would fail here.
    const version = await getContractVersion(artifactWithCode('Shanghai', '0x5f5ff3'), true)
    assert.equal(version.toString(), DEFAULT_VERSION_STRING)
  })

  it('reports bytecode using an opcode its EVM does not implement', async () => {
    // MCOPY, which arrived in cancun, past what the vendored EVM implements.
    try {
      await getContractVersion(artifactWithCode('Cancun', '0x5e'), true)
      assert.fail('expected the unreadable version to be reported')
    } catch (error) {
      assert.include((error as Error).message, 'Cannot read the version of Cancun')
      assert.include((error as Error).message, 'does not implement')
    }
  })

  it('falls back to the default version for a contract without getVersionNumber', async () => {
    // STOP: a contract that answers nothing, which is how unversioned contracts behave.
    const version = await getContractVersion(artifactWithCode('Unversioned', '0x00'), true)
    assert.equal(version.toString(), DEFAULT_VERSION_STRING)
  })
})
