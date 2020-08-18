import {
  collectLibraryPositions,
  collectLibraryAddresses,
} from '@celo/protocol/lib/compatibility/verify-bytecode'
import { LibraryLinks, linkLibraries } from '@celo/protocol/lib/bytecode'

import { getTestArtifacts } from '@celo/protocol/test/compatibility/common'

import { assert } from 'chai'

const artifacts = getTestArtifacts('linked_libraries')
const artifact = artifacts.getArtifactByName('TestContract')

describe('#collectLibraryPositions()', () => {
  it('collects the right number of positions for each library', () => {
    const positions = collectLibraryPositions(artifact.deployedBytecode)
    assert.equal(positions['LinkedLibrary1'].length, 2)
    assert.equal(positions['LinkedLibrary2'].length, 2)
  })
})

describe('#collectLibraryAddresses()', () => {
  describe('when libraries are linked correctly', () => {
    it('collects the correct addresses', () => {
      const positions = collectLibraryPositions(artifact.deployedBytecode)
      const links: LibraryLinks = {
        LinkedLibrary1: '0000000000000000000000000000000000000001',
        LinkedLibrary2: '0000000000000000000000000000000000000002',
      }
      const linkedBytecode = linkLibraries(artifact.deployedBytecode, links)
      const addresses = collectLibraryAddresses(linkedBytecode, positions)

      assert.equal(addresses['LinkedLibrary1'], '0000000000000000000000000000000000000001')
      assert.equal(addresses['LinkedLibrary2'], '0000000000000000000000000000000000000002')
    })
  })

  describe('when libraries are not linked correctly', () => {
    it('detects incorrect linking', () => {
      const positions = collectLibraryPositions(artifact.deployedBytecode)
      const links: LibraryLinks = {
        LinkedLibrary1: '0000000000000000000000000000000000000001',
        LinkedLibrary2: '0000000000000000000000000000000000000002',
      }
      const linkedBytecode = linkLibraries(artifact.deployedBytecode, links)
      const incorrectBytecode =
        linkedBytecode.slice(0, positions['LinkedLibrary1'][0] - 1) +
        '0000000000000000000000000000000000000003' +
        linkedBytecode.slice(positions['LinkedLibrary1'][0] - 1 + 40, linkedBytecode.length)

      assert.throws(() => {
        collectLibraryAddresses(incorrectBytecode, positions)
      })
    })
  })
})
