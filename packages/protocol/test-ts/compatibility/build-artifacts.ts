import {
  compilerVersionFromArtifactPath,
  contractNameFromArtifactPath,
} from '@celo/protocol/lib/compatibility/build-artifacts'
import { Artifact, getContractName } from '@celo/protocol/lib/compatibility/internal'
import { getTestArtifacts } from '@celo/protocol/test-ts/util/compatibility'
import { assert } from 'chai'

describe('BuildArtifacts', () => {
  describe('#getArtifactByName()', () => {
    // Foundry artifacts carry no contractName; release verification looks contracts up by
    // name to check their initialization data.
    it('finds a contract of a Foundry build by name', () => {
      const [artifacts] = getTestArtifacts('original')
      const artifact: Artifact = artifacts.getArtifactByName('TestContract')
      assert.isDefined(artifact)
      assert.equal(getContractName(artifact), 'TestContract')
      assert.isArray(artifact.abi)
    })

    // Every contract of a source file shares that file's AST, so names must not come from
    // its first declaration.
    it('tells apart the contracts declared in one source file', () => {
      const [artifacts] = getTestArtifacts('multiple_in_file')
      for (const name of ['IFirstInFile', 'SecondInFile', 'TestContract']) {
        const artifact: Artifact = artifacts.getArtifactByName(name)
        assert.isDefined(artifact, name)
        assert.equal(getContractName(artifact), name)
      }
    })

    it('returns undefined for an unknown name', () => {
      const [artifacts] = getTestArtifacts('original')
      assert.isUndefined(artifacts.getArtifactByName('NoSuchContract'))
    })
  })
})

describe('contractNameFromArtifactPath()', () => {
  it('reads the contract name from the artifact file name', () => {
    assert.equal(contractNameFromArtifactPath('out/Registry.sol/Registry.json'), 'Registry')
  })

  it('drops the compiler version Foundry adds for multi-compiler builds', () => {
    assert.equal(
      contractNameFromArtifactPath('out/Initializable.sol/Initializable.0.8.19.json'),
      'Initializable'
    )
  })
})

describe('compilerVersionFromArtifactPath()', () => {
  it('reads the compiler of a source compiled by several compilers', () => {
    assert.equal(compilerVersionFromArtifactPath('out/Types.sol/Types.0.8.19.json'), '0.8.19')
  })

  it('is undefined when a single compiler built the source', () => {
    assert.isUndefined(compilerVersionFromArtifactPath('out/Types.sol/Types.json'))
  })
})
