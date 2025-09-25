import { getContractVersion } from '@celo/protocol/lib/compatibility/ast-version'
import { getArtifactByName } from '@celo/protocol/lib/compatibility/internal'
import { DEFAULT_VERSION_STRING } from '@celo/protocol/lib/compatibility/version'
import { getTestArtifacts } from '@celo/protocol/test-ts/util/compatibility'
import { assert } from 'chai'

const testCases = {
  original: getTestArtifacts('original'),
  versioned: getTestArtifacts('versioned'),
}

describe('#getContractVersion()', () => {
  describe('when the contract implements getVersionNumber()', () => {
    it('returns the correct version number', async () => {
      const version = await getContractVersion(
        getArtifactByName('TestContract', testCases.versioned[0]),
        false
      )
      assert.equal(version.toString(), '1.2.3.4')
    })
  })

  describe('when the contract does not implement getVersionNumber()', () => {
    it('returns the default version number', async () => {
      const version = await getContractVersion(
        getArtifactByName('TestContract', testCases.original[0]),
        false
      )
      assert.equal(version.toString(), DEFAULT_VERSION_STRING)
    })
  })
})
