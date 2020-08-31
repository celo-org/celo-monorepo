import { LibraryLinks, linkLibraries } from '@celo/protocol/lib/bytecode'
import { Artifact } from '@celo/protocol/lib/compatibility/internal'
import {
  collectLibraryAddresses,
  collectLibraryPositions,
  verifyBytecodesDfs,
} from '@celo/protocol/lib/compatibility/verify-bytecode'
import { assertThrowsAsync } from '@celo/protocol/lib/test-utils'
import { getTestArtifacts } from '@celo/protocol/test/compatibility/common'

import { RegistryInstance } from 'types'

import { assert } from 'chai'

import truffleContract = require('truffle-contract')

const Registry = artifacts.require('Registry')
const Proxy = artifacts.require('Proxy')

const makeTruffleContract = (artifact: Artifact) => {
  const Contract = truffleContract({
    abi: artifact.abi,
    unlinked_binary: artifact.bytecode,
  })
  Contract.setProvider(web3.currentProvider)
  Contract.setNetwork('development')

  return Contract
}

const deployProxiedContract = async (Contract: any, from: string) => {
  const proxy = await Proxy.new()
  const contract = await Contract.new({ from })
  await proxy._setImplementation(contract.address)
  return Contract.at(proxy.address)
}

contract('', (accounts) => {
  const buildArtifacts = getTestArtifacts('linked_libraries')
  const upgradedLibBuildArtifacts = getTestArtifacts('linked_libraries_upgraded_lib')
  const upgradedContractBuildArtifacts = getTestArtifacts('linked_libraries_upgraded_contract')
  const artifact = buildArtifacts.getArtifactByName('TestContract')

  const TestContract = makeTruffleContract(buildArtifacts.getArtifactByName('TestContract'))
  const LinkedLibrary1 = makeTruffleContract(buildArtifacts.getArtifactByName('LinkedLibrary1'))
  const LinkedLibrary2 = makeTruffleContract(buildArtifacts.getArtifactByName('LinkedLibrary2'))
  const LinkedLibrary3 = makeTruffleContract(buildArtifacts.getArtifactByName('LinkedLibrary3'))

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

  describe('on a test contract deployment', () => {
    let registry: RegistryInstance
    let library1
    let library2
    let library3
    let testContract
    beforeEach(async () => {
      registry = await Registry.new()

      library1 = await deployProxiedContract(LinkedLibrary1, accounts[0])
      library3 = await deployProxiedContract(LinkedLibrary3, accounts[0])
      LinkedLibrary2.link('LinkedLibrary3', library3.address)
      library2 = await deployProxiedContract(LinkedLibrary2, accounts[0])

      TestContract.link('LinkedLibrary1', library1.address)
      TestContract.link('LinkedLibrary2', library2.address)
      testContract = await deployProxiedContract(TestContract, accounts[0])

      await registry.setAddressFor('TestContract', testContract.address)
    })

    describe('verifyBytecodesDfs', () => {
      it(`doesn't throw on matching contracts`, async () => {
        await verifyBytecodesDfs(['TestContract'], buildArtifacts, registry, [], Proxy, web3)
        assert(true)
      })

      it(`throws when a contract's bytecodes don't match`, async () => {
        const oldBytecode = artifact.deployedBytecode
        artifact.deployedBytecode = '0x0' + oldBytecode.slice(3, artifact.deployedBytecode.length)
        await assertThrowsAsync(
          verifyBytecodesDfs(['TestContract'], buildArtifacts, registry, [], Proxy, web3)
        )
        artifact.deployedBytecode = oldBytecode
      })

      it(`throws when a library's bytecodes don't match`, async () => {
        const libraryArtifact = buildArtifacts.getArtifactByName('LinkedLibrary1')
        const oldBytecode = libraryArtifact.deployedBytecode
        libraryArtifact.deployedBytecode =
          oldBytecode.slice(0, 44) + '00' + oldBytecode.slice(46, oldBytecode.length)
        await assertThrowsAsync(
          verifyBytecodesDfs(['TestContract'], buildArtifacts, registry, [], Proxy, web3)
        )
        libraryArtifact.deployedBytecode = oldBytecode
      })

      describe(`when a proposal upgrades a library's implementation`, () => {
        let LinkedLibrary3Upgraded = makeTruffleContract(
          upgradedLibBuildArtifacts.getArtifactByName('LinkedLibrary3')
        )
        beforeEach(async () => {
          library3 = await LinkedLibrary3Upgraded.new({ from: accounts[0] })
        })

        it(`doesn't throw on matching contracts`, async () => {
          const proposal = [
            {
              contract: 'LinkedLibrary3Proxy',
              function: '_setImplementation',
              args: [library3.address],
              value: '0',
            },
          ]

          await verifyBytecodesDfs(
            ['TestContract'],
            upgradedLibBuildArtifacts,
            registry,
            proposal,
            Proxy,
            web3
          )
          assert(true)
        })

        it(`throws on different contracts`, async () => {
          const proposal = [
            {
              contract: 'LinkedLibrary3Proxy',
              function: '_setImplementation',
              args: [library3.address],
              value: '0',
            },
          ]

          await assertThrowsAsync(
            verifyBytecodesDfs(['TestContract'], buildArtifacts, registry, proposal, Proxy, web3)
          )
        })

        it(`throws when the proposed address is wrong`, async () => {
          const proposal = [
            {
              contract: 'LinkedLibrary3Proxy',
              function: '_setImplementation',
              args: [accounts[1]],
              value: '0',
            },
          ]

          await assertThrowsAsync(
            verifyBytecodesDfs(['TestContract'], buildArtifacts, registry, proposal, Proxy, web3)
          )
        })
      })

      describe(`when a proposal changes a library's proxy`, () => {
        let LinkedLibrary3Upgraded = makeTruffleContract(
          upgradedLibBuildArtifacts.getArtifactByName('LinkedLibrary3')
        )
        let newLibrary2Implementation
        beforeEach(async () => {
          library3 = await deployProxiedContract(LinkedLibrary3Upgraded, accounts[0])
          LinkedLibrary2.link('LinkedLibrary3', library3.address)
          newLibrary2Implementation = await LinkedLibrary2.new({ from: accounts[0] })
        })

        it(`doesn't throw on matching contracts`, async () => {
          const proposal = [
            {
              contract: 'LinkedLibrary2Proxy',
              function: '_setImplementation',
              args: [newLibrary2Implementation.address],
              value: '0',
            },
          ]

          await verifyBytecodesDfs(
            ['TestContract'],
            upgradedLibBuildArtifacts,
            registry,
            proposal,
            Proxy,
            web3
          )
          assert(true)
        })

        it(`throws on different contracts`, async () => {
          const proposal = [
            {
              contract: 'LinkedLibrary2Proxy',
              function: '_setImplementation',
              args: [newLibrary2Implementation.address],
              value: '0',
            },
          ]

          await assertThrowsAsync(
            verifyBytecodesDfs(['TestContract'], buildArtifacts, registry, proposal, Proxy, web3)
          )
        })

        it(`throws when dependent contract wasn't repointed`, async () => {
          const proposal = []

          await assertThrowsAsync(
            verifyBytecodesDfs(
              ['TestContract'],
              upgradedLibBuildArtifacts,
              registry,
              proposal,
              Proxy,
              web3
            )
          )
        })
      })

      describe(`when a proposal upgrades a contract's implementation`, () => {
        let TestContractUpgraded = makeTruffleContract(
          upgradedContractBuildArtifacts.getArtifactByName('TestContract')
        )
        beforeEach(async () => {
          TestContractUpgraded.link('LinkedLibrary1', library1.address)
          TestContractUpgraded.link('LinkedLibrary2', library2.address)
          testContract = await TestContractUpgraded.new({ from: accounts[0] })
        })

        it(`doesn't throw on matching contracts`, async () => {
          const proposal = [
            {
              contract: 'TestContractProxy',
              function: '_setImplementation',
              args: [testContract.address],
              value: '0',
            },
          ]

          await verifyBytecodesDfs(
            ['TestContract'],
            upgradedContractBuildArtifacts,
            registry,
            proposal,
            Proxy,
            web3
          )
          assert(true)
        })

        it(`throws on different contracts`, async () => {
          const proposal = [
            {
              contract: 'TestContractProxy',
              function: '_setImplementation',
              args: [testContract.address],
              value: '0',
            },
          ]

          await assertThrowsAsync(
            verifyBytecodesDfs(['TestContract'], buildArtifacts, registry, proposal, Proxy, web3)
          )
        })

        it(`throws when the proposed address is wrong`, async () => {
          const proposal = [
            {
              contract: 'TestContractProxy',
              function: '_setImplementation',
              args: [accounts[1]],
              value: '0',
            },
          ]

          await assertThrowsAsync(
            verifyBytecodesDfs(['TestContract'], buildArtifacts, registry, proposal, Proxy, web3)
          )
        })

        it(`throws when there is no proposal`, async () => {
          const proposal = []

          await assertThrowsAsync(
            verifyBytecodesDfs(
              ['TestContract'],
              upgradedContractBuildArtifacts,
              registry,
              proposal,
              Proxy,
              web3
            )
          )
        })
      })

      describe(`when a proposal changes a contract's proxy`, () => {
        let TestContractUpgraded = makeTruffleContract(
          upgradedContractBuildArtifacts.getArtifactByName('TestContract')
        )
        beforeEach(async () => {
          TestContractUpgraded.link('LinkedLibrary1', library1.address)
          TestContractUpgraded.link('LinkedLibrary2', library2.address)
          testContract = await deployProxiedContract(TestContractUpgraded, accounts[0])
        })

        it(`doesn't throw on matching contracts`, async () => {
          const proposal = [
            {
              contract: 'Registry',
              function: 'setAddressFor',
              args: [
                web3.utils.soliditySha3({ type: 'string', value: 'TestContract' }),
                testContract.address,
              ],
              value: '0',
            },
          ]

          await verifyBytecodesDfs(
            ['TestContract'],
            upgradedContractBuildArtifacts,
            registry,
            proposal,
            Proxy,
            web3
          )
          assert(true)
        })

        it(`throws on different contracts`, async () => {
          const proposal = [
            {
              contract: 'Registry',
              function: 'setAddressFor',
              args: [
                web3.utils.soliditySha3({ type: 'string', value: 'TestContract' }),
                testContract.address,
              ],
              value: '0',
            },
          ]

          await assertThrowsAsync(
            verifyBytecodesDfs(['TestContract'], buildArtifacts, registry, proposal, Proxy, web3)
          )
        })

        it(`throws when the proposed address is wrong`, async () => {
          const proposal = [
            {
              contract: 'Registry',
              function: 'setAddressFor',
              args: [
                web3.utils.soliditySha3({ type: 'string', value: 'TestContract' }),
                accounts[0],
              ],
              value: '0',
            },
          ]

          await assertThrowsAsync(
            verifyBytecodesDfs(['TestContract'], buildArtifacts, registry, proposal, Proxy, web3)
          )
        })

        it(`throws when there is no proposal`, async () => {
          const proposal = []

          await assertThrowsAsync(
            verifyBytecodesDfs(
              ['TestContract'],
              upgradedContractBuildArtifacts,
              registry,
              proposal,
              Proxy,
              web3
            )
          )
        })
      })
    })
  })
})
