import { assert } from 'chai'
import { encodeFunctionData } from 'viem'
import { readJsonSync } from 'fs-extra'

import {
  ArtifactLibraryLinking,
  LibraryLinks,
  LibraryLinkingInfo,
  getPlaceholderHash,
  linkLibraries,
} from '@celo/protocol/lib/bytecode-foundry'
import {
  getArtifactByName,
  getBytecode,
  getDeployedBytecode,
  getSourceFile,
} from '@celo/protocol/lib/compatibility/internal'
import { verifyBytecodes } from '@celo/protocol/lib/compatibility/verify-bytecode-foundry'
import { assertThrowsAsync } from '@celo/protocol/lib/test-utils'
import { startNetwork } from '@celo/protocol/test-ts/util/anvil'
import { getTestArtifacts } from '@celo/protocol/test-ts/util/compatibility'
import { deployViemContract } from '@celo/protocol/test-ts/util/viem'

const registryAbi = readJsonSync(`./out/Registry.sol/Registry.json`).abi
const registryBytecode = readJsonSync(`./out/Registry.sol/Registry.json`).bytecode.object

const proxyAbi = readJsonSync(`./out/Proxy.sol/Proxy.json`).abi
const proxyBytecode = readJsonSync(`./out/Proxy.sol/Proxy.json`).bytecode.object

const deployContractWithLinking = async (
  contract: string,
  artifacts: any,
  client: any,
  links: LibraryLinks
) => {
  const artifact = getArtifactByName(contract, artifacts)
  const bytecode = getBytecode(artifact)
  const linkedBytecode = linkLibraries(bytecode, links)
  const address = await deployViemContract(artifact.abi, linkedBytecode, client)

  links[contract] = {
    address: address.slice(2),
    placeholderHash: getPlaceholderHash(`${getSourceFile(artifact)}:${contract}`),
  }

  return address
}

const deployProxiedContract = async (
  contract: string,
  artifacts: any,
  client: any,
  links: LibraryLinks
) => {
  const proxyAddress = await deployViemContract(proxyAbi, proxyBytecode, client)
  const implementationAddress = await deployContractWithLinking(contract, artifacts, client, links)

  await client.writeContract({
    address: proxyAddress,
    abi: proxyAbi,
    functionName: '_setImplementation',
    args: [implementationAddress],
  })

  return proxyAddress
}

const buildArtifacts = getTestArtifacts('linked_libraries')[0]
const upgradedLibBuildArtifacts = getTestArtifacts('linked_libraries_upgraded_lib')[0]
const upgradedContractBuildArtifacts = getTestArtifacts('linked_libraries_upgraded_contract')[0]

describe('', () => {
  const artifact = getArtifactByName('TestContract', buildArtifacts)
  const placeholderHashes = {}

  before(() => {
    const libraryNames = ['LinkedLibrary1', 'LinkedLibrary2', 'LinkedLibrary3']
    libraryNames.forEach((library: string) => {
      const artifact = getArtifactByName(library, buildArtifacts)
      const placeholderHash = getPlaceholderHash(`${getSourceFile(artifact)}:${library}`)
      placeholderHashes[library] = placeholderHash
    })
  })

  describe('ArtifactLibraryLinking()', () => {
    it('collects the right number of positions for each library', () => {
      const linking = new ArtifactLibraryLinking(artifact)
      assert.equal(linking.links['LinkedLibrary1'].positions.length, 2)
      assert.equal(linking.links['LinkedLibrary2'].positions.length, 2)
    })
  })

  describe('LibraryLinkingInfo.collect()', () => {
    describe('when libraries are linked correctly', () => {
      it('collects the correct addresses', () => {
        const linking = new ArtifactLibraryLinking(artifact)
        const links: LibraryLinks = {
          LinkedLibrary1: {
            address: '0000000000000000000000000000000000000001',
            placeholderHash: placeholderHashes['LinkedLibrary1'],
          },
          LinkedLibrary2: {
            address: '0000000000000000000000000000000000000002',
            placeholderHash: placeholderHashes['LinkedLibrary2'],
          },
        }
        const linkedBytecode = linkLibraries(getDeployedBytecode(artifact), links)
        const linkingInfo = new LibraryLinkingInfo()
        linkingInfo.collect(linkedBytecode, linking)

        assert.equal(
          linkingInfo.info['LinkedLibrary1'].address,
          '0000000000000000000000000000000000000001'
        )
        assert.equal(
          linkingInfo.info['LinkedLibrary2'].address,
          '0000000000000000000000000000000000000002'
        )
      })
    })

    describe('when libraries are not linked correctly', () => {
      it('detects incorrect linking', () => {
        const linking = new ArtifactLibraryLinking(artifact)
        const links: LibraryLinks = {
          LinkedLibrary1: {
            address: '0000000000000000000000000000000000000001',
            placeholderHash: placeholderHashes['LinkedLibrary1'],
          },
          LinkedLibrary2: {
            address: '0000000000000000000000000000000000000002',
            placeholderHash: placeholderHashes['LinkedLibrary2'],
          },
        }
        const linkedBytecode = linkLibraries(getDeployedBytecode(artifact), links)
        const incorrectBytecode =
          linkedBytecode.slice(0, linking.links['LinkedLibrary1'].positions[0] - 1) +
          '0000000000000000000000000000000000000003' +
          linkedBytecode.slice(
            linking.links['LinkedLibrary1'].positions[0] - 1 + 40,
            linkedBytecode.length
          )

        assert.throws(() => {
          new LibraryLinkingInfo().collect(incorrectBytecode, linking)
        }, /Mismatched addresses for LinkedLibrary1/)
      })
    })
  })

  describe('on a test contract deployment', () => {
    let network
    let registryLookup
    let proxyLookup
    let chainLookup
    let links: LibraryLinks = {}

    beforeEach(async () => {
      network = await startNetwork()
      // Test contract deployment

      const registryAddress = await deployViemContract(
        registryAbi,
        registryBytecode,
        network.client,
        [true]
      )

      await deployContractWithLinking('LinkedLibrary1', buildArtifacts, network.client, links)
      await deployContractWithLinking('LinkedLibrary3', buildArtifacts, network.client, links)
      await deployContractWithLinking('LinkedLibrary2', buildArtifacts, network.client, links)

      const testContractAddress = await deployProxiedContract(
        'TestContract',
        buildArtifacts,
        network.client,
        links
      )

      registryLookup = {
        getAddressForString: async (name: string) => {
          return network.client.readContract({
            address: registryAddress as `0x${string}`,
            abi: registryAbi,
            functionName: 'getAddressForString',
            args: [name],
          })
        },
      }

      proxyLookup = {
        getImplementation: async (address: string) => {
          return network.client.readContract({
            address,
            abi: proxyAbi,
            functionName: '_getImplementation',
            args: [],
          })
        },
      }

      chainLookup = {
        getCode: (address: `0x${string}`) => {
          return network.client.getCode({ address })
        },
        encodeFunctionCall: (abi: any, args: any[]) => {
          return encodeFunctionData({
            abi: [abi],
            functionName: abi.name,
            args,
          })
        },
        getProof: (address: `0x${string}`, slots: `0x${string}`[]) => {
          return network.client.getProof({
            address,
            storageKeys: slots,
          })
        },
      }

      await network.client.writeContract({
        address: registryAddress as `0x${string}`,
        abi: registryAbi,
        functionName: 'setAddressFor',
        args: ['TestContract', testContractAddress],
      })

      // Set a dummy governance address as it's looked up in the verification logic
      await network.client.writeContract({
        address: registryAddress as `0x${string}`,
        abi: registryAbi,
        functionName: 'setAddressFor',
        args: ['Governance', '0x0000000000000000000000000000000000000001'],
      })
    })

    afterEach(() => {
      network.anvil.kill()
    })

    describe('verifyBytecodes', () => {
      it(`doesn't throw on matching contracts`, async () => {
        await verifyBytecodes(
          ['TestContract'],
          [buildArtifacts],
          registryLookup,
          [],
          proxyLookup,
          chainLookup
        )
      })

      it(`throws when a contract's bytecodes don't match`, async () => {
        const oldBytecode = (artifact as any).deployedBytecode.object
        ;(artifact as any).deployedBytecode.object =
          '0x0' + oldBytecode.slice(3, oldBytecode.length)
        await assertThrowsAsync(
          verifyBytecodes(
            ['TestContract'],
            [buildArtifacts],
            registryLookup,
            [],
            proxyLookup,
            chainLookup
          )
        )
        ;(artifact as any).deployedBytecode.object = oldBytecode
      })

      it(`throws when a library's bytecodes don't match`, async () => {
        const libraryArtifact = getArtifactByName('LinkedLibrary1', buildArtifacts)
        const oldBytecode = (libraryArtifact as any).deployedBytecode.object
        ;(libraryArtifact as any).deployedBytecode.object =
          oldBytecode.slice(0, 44) + '00' + oldBytecode.slice(46, oldBytecode.length)
        await assertThrowsAsync(
          verifyBytecodes(
            ['TestContract'],
            [buildArtifacts],
            registryLookup,
            [],
            proxyLookup,
            chainLookup
          )
        )
        ;(libraryArtifact as any).deployedBytecode.object = oldBytecode
      })

      describe(`when a proposal upgrades a library's implementation`, () => {
        let testContractAddress

        beforeEach(async () => {
          await deployContractWithLinking(
            'LinkedLibrary3',
            upgradedLibBuildArtifacts,
            network.client,
            links
          )

          await deployContractWithLinking(
            'LinkedLibrary2',
            upgradedLibBuildArtifacts,
            network.client,
            links
          )

          // The new linking placeholders are source path dependent. This doesn't matter in a real
          // deployment where contract source paths remain consistent between releases, but our test
          // cases are organized in separate directories, so this needs to be updated.
          links['LinkedLibrary1'].placeholderHash = getPlaceholderHash(
            `${getSourceFile(
              getArtifactByName('LinkedLibrary1', upgradedLibBuildArtifacts)
            )}:LinkedLibrary1`
          )

          testContractAddress = await deployContractWithLinking(
            'TestContract',
            upgradedLibBuildArtifacts,
            network.client,
            links
          )
        })

        it(`doesn't throw on matching contracts`, async () => {
          const proposal = [
            {
              contract: 'TestContractProxy',
              function: '_setImplementation',
              args: [testContractAddress],
              value: '0',
            },
          ]

          await verifyBytecodes(
            ['TestContract'],
            [upgradedLibBuildArtifacts],
            registryLookup,
            proposal,
            proxyLookup,
            chainLookup
          )
          assert(true)
        })

        it(`throws on different contracts`, async () => {
          const proposal = [
            {
              contract: 'TestContractProxy',
              function: '_setImplementation',
              args: [testContractAddress],
              value: '0',
            },
          ]

          await assertThrowsAsync(
            verifyBytecodes(
              ['TestContract'],
              [buildArtifacts],
              registryLookup,
              proposal,
              proxyLookup,
              chainLookup
            )
          )
        })

        it(`throws when the proposed address is wrong`, async () => {
          const proposal = [
            {
              contract: 'TestContractProxy',
              function: '_setImplementation',
              args: [network.accounts[1].address],
              value: '0',
            },
          ]

          await assertThrowsAsync(
            verifyBytecodes(
              ['TestContract'],
              [upgradedLibBuildArtifacts],
              registryLookup,
              proposal,
              proxyLookup,
              chainLookup
            )
          )
        })
      })

      describe(`when a proposal upgrades a contract's implementation`, () => {
        let testContractAddress
        beforeEach(async () => {
          // The new linking placeholders are source path dependent. This doesn't matter in a real
          // deployment where contract source paths remain consistent between releases, but our test
          // cases are organized in separate directories, so this needs to be updated.
          links['LinkedLibrary1'].placeholderHash = getPlaceholderHash(
            `${getSourceFile(
              getArtifactByName('LinkedLibrary1', upgradedContractBuildArtifacts)
            )}:LinkedLibrary1`
          )
          links['LinkedLibrary2'].placeholderHash = getPlaceholderHash(
            `${getSourceFile(
              getArtifactByName('LinkedLibrary2', upgradedContractBuildArtifacts)
            )}:LinkedLibrary2`
          )

          testContractAddress = await deployContractWithLinking(
            'TestContract',
            upgradedContractBuildArtifacts,
            network.client,
            links
          )
        })

        it(`doesn't throw on matching contracts`, async () => {
          const proposal = [
            {
              contract: 'TestContractProxy',
              function: '_setImplementation',
              args: [testContractAddress],
              value: '0',
            },
          ]

          await verifyBytecodes(
            ['TestContract'],
            [upgradedContractBuildArtifacts],
            registryLookup,
            proposal,
            proxyLookup,
            chainLookup
          )
          assert(true)
        })

        it(`throws on different contracts`, async () => {
          const proposal = [
            {
              contract: 'TestContractProxy',
              function: '_setImplementation',
              args: [testContractAddress],
              value: '0',
            },
          ]

          await assertThrowsAsync(
            verifyBytecodes(
              ['TestContract'],
              [buildArtifacts],
              registryLookup,
              proposal,
              proxyLookup,
              chainLookup
            )
          )
        })

        it(`throws when the proposed address is wrong`, async () => {
          const proposal = [
            {
              contract: 'TestContractProxy',
              function: '_setImplementation',
              args: [network.accounts[1].address],
              value: '0',
            },
          ]

          await assertThrowsAsync(
            verifyBytecodes(
              ['TestContract'],
              [upgradedContractBuildArtifacts],
              registryLookup,
              proposal,
              proxyLookup,
              chainLookup
            )
          )
        })

        it(`throws when there is no proposal`, async () => {
          const proposal = []

          await assertThrowsAsync(
            verifyBytecodes(
              ['TestContract'],
              [upgradedContractBuildArtifacts],
              registryLookup,
              proposal,
              proxyLookup,
              chainLookup
            )
          )
        })
      })

      describe(`when a proposal changes a contract's proxy`, () => {
        let testContractProxyAddress
        beforeEach(async () => {
          // The new linking placeholders are source path dependent. This doesn't matter in a real
          // deployment where contract source paths remain consistent between releases, but our test
          // cases are organized in separate directories, so this needs to be updated.
          links['LinkedLibrary1'].placeholderHash = getPlaceholderHash(
            `${getSourceFile(
              getArtifactByName('LinkedLibrary1', upgradedContractBuildArtifacts)
            )}:LinkedLibrary1`
          )
          links['LinkedLibrary2'].placeholderHash = getPlaceholderHash(
            `${getSourceFile(
              getArtifactByName('LinkedLibrary2', upgradedContractBuildArtifacts)
            )}:LinkedLibrary2`
          )

          testContractProxyAddress = await deployProxiedContract(
            'TestContract',
            upgradedContractBuildArtifacts,
            network.client,
            links
          )
        })

        it(`doesn't throw on matching contracts`, async () => {
          const proposal = [
            {
              contract: 'Registry',
              function: 'setAddressFor',
              args: ['TestContract', testContractProxyAddress],
              value: '0',
            },
          ]

          await verifyBytecodes(
            ['TestContract'],
            [upgradedContractBuildArtifacts],
            registryLookup,
            proposal,
            proxyLookup,
            chainLookup
          )
          assert(true)
        })

        it(`throws on different contracts`, async () => {
          const proposal = [
            {
              contract: 'Registry',
              function: 'setAddressFor',
              args: ['TestContract', testContractProxyAddress],
              value: '0',
            },
          ]

          await assertThrowsAsync(
            verifyBytecodes(
              ['TestContract'],
              [buildArtifacts],
              registryLookup,
              proposal,
              proxyLookup,
              chainLookup
            )
          )
        })

        it(`throws when the proposed address is wrong`, async () => {
          const proposal = [
            {
              contract: 'Registry',
              function: 'setAddressFor',
              args: ['TestContract', network.accounts[0].address],
              value: '0',
            },
          ]

          await assertThrowsAsync(
            verifyBytecodes(
              ['TestContract'],
              [upgradedContractBuildArtifacts],
              registryLookup,
              proposal,
              proxyLookup,
              chainLookup
            )
          )
        })
      })
    })
  })
})
