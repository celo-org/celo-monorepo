import { getContractVersion } from '@celo/protocol/lib/compatibility/ast-version'
import { Artifact } from '@celo/protocol/lib/compatibility/internal'
import { DEFAULT_VERSION_STRING } from '@celo/protocol/lib/compatibility/version'
import { assert } from 'chai'

const artifactWithCode = (contractName: string, code: string): Artifact =>
  ({ contractName, deployedBytecode: { object: code } } as unknown as Artifact)

describe('#getContractVersion()', () => {
  it('runs bytecode built for the EVM version the contracts target', async () => {
    // PUSH0 PUSH0 RETURN: valid from shanghai on, an invalid opcode before it. Fails if the
    // reader's hardfork ever drops below what foundry.toml targets.
    const version = await getContractVersion(artifactWithCode('Shanghai', '0x5f5ff3'), true)
    assert.equal(version.toString(), DEFAULT_VERSION_STRING)
  })

  it('runs cancun bytecode, which the reader executes on prague', async () => {
    // PUSH1 0 PUSH1 0 PUSH1 0 MCOPY STOP: MCOPY arrived in cancun.
    const version = await getContractVersion(artifactWithCode('Cancun', '0x6000600060005e00'), true)
    assert.equal(version.toString(), DEFAULT_VERSION_STRING)
  })

  it('reports bytecode using an opcode its EVM does not implement', async () => {
    // INVALID (0xfe) is reserved as an invalid opcode by every hardfork, so it takes the same
    // path a not-yet-implemented opcode would without depending on which opcodes this EVM
    // happens to assign.
    try {
      await getContractVersion(artifactWithCode('Unsupported', '0xfe'), true)
      assert.fail('expected the unreadable version to be reported')
    } catch (error) {
      assert.include((error as Error).message, 'Cannot read the version of Unsupported')
      assert.include((error as Error).message, 'does not implement')
    }
  })

  it('falls back to the default version for a contract without getVersionNumber', async () => {
    // STOP: a contract that answers nothing, which is how unversioned contracts behave.
    const version = await getContractVersion(artifactWithCode('Unversioned', '0x00'), true)
    assert.equal(version.toString(), DEFAULT_VERSION_STRING)
  })
})
