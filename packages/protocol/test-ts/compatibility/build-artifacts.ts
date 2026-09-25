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

    it('returns undefined for an unknown name', () => {
      const [artifacts] = getTestArtifacts('original')
      assert.isUndefined(artifacts.getArtifactByName('NoSuchContract'))
    })
  })
})
