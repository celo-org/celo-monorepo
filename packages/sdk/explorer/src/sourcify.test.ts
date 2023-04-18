import {
  Address,
  Callback,
  Connection,
  JsonRpcPayload,
  JsonRpcResponse,
  Provider,
} from '@celo/connect'
import Web3 from 'web3'
import { Metadata, fetchMetadata, tryGetProxyImplementation } from './sourcify'

// This is taken from protocol/contracts/build/Account.json
const CONTRACT_METADATA = require('../fixtures/contract.metadata.json')

describe('sourcify helpers', () => {
  let connection: Connection
  const web3: Web3 = new Web3()
  const address: Address = web3.utils.randomHex(20)
  const proxyAddress: Address = web3.utils.randomHex(20)
  const implAddress: Address = web3.utils.randomHex(20)
  const chainId: number = 42220

  const mockProvider: Provider = {
    send: (payload: JsonRpcPayload, callback: Callback<JsonRpcResponse>): void => {
      if (payload.params[0].to === proxyAddress) {
        callback(null, {
          jsonrpc: payload.jsonrpc,
          id: Number(payload.id),
          result: `0x000000000000000000000000${implAddress}`,
        })
      } else {
        callback(new Error('revert'))
      }
    },
  }

  beforeEach(() => {
    fetchMock.reset()
    web3.setProvider(mockProvider as any)
    connection = new Connection(web3)
    connection.chainId = jest.fn().mockImplementation(async () => {
      return chainId
    })
  })

  describe('fetchMetadata()', () => {
    describe('when a full match exists', () => {
      it('returns the metadata from the full match', async () => {
        fetchMock.get(
          `https://repo.sourcify.dev/contracts/full_match/42220/${address}/metadata.json`,
          {}
        )
        const metadata = await fetchMetadata(connection, address)
        expect(metadata).toBeInstanceOf(Metadata)
      })
    })

    describe('when a full match does not exist', () => {
      describe('but a partial match exists', () => {
        it('returns the metadata from the partial match', async () => {
          fetchMock
            .get(
              `https://repo.sourcify.dev/contracts/full_match/42220/${address}/metadata.json`,
              400
            )
            .get(
              `https://repo.sourcify.dev/contracts/partial_match/42220/${address}/metadata.json`,
              {}
            )
          const metadata = await fetchMetadata(connection, address)
          expect(metadata).toBeInstanceOf(Metadata)
        })
      })

      describe('and a partial match does not exist', () => {
        it('is null', async () => {
          fetchMock
            .get(
              `https://repo.sourcify.dev/contracts/full_match/42220/${address}/metadata.json`,
              400
            )
            .get(
              `https://repo.sourcify.dev/contracts/partial_match/42220/${address}/metadata.json`,
              400
            )
          const metadata = await fetchMetadata(connection, address)
          expect(metadata).toEqual(null)
        })
      })
    })
  })

  describe('Metadata', () => {
    describe('get abi', () => {
      it('returns the abi when it finds it', () => {
        const metadata = new Metadata(connection, address, { output: { abi: [{}] } })
        const abi = metadata.abi
        expect(abi).not.toBeNull()
        expect(abi).toEqual([{}])
      })

      it('returns null when there is no abi', () => {
        const metadata = new Metadata(connection, address, { output: { other: [{}] } })
        const abi = metadata.abi
        expect(abi).toBeNull()
      })
    })

    describe('get contractName', () => {
      describe('when the structure does not contain it', () => {
        it('returns null', () => {
          const metadata = new Metadata(connection, address, { output: { abi: [{}] } })
          const name = metadata.contractName
          expect(name).toBeNull()
        })
      })

      describe('when the structure contains multiple compilation targets', () => {
        it('returns the first', () => {
          const metadata = new Metadata(connection, address, {
            settings: {
              compilationTarget: {
                'somefile.sol': 'SomeContract',
                'otherfile.sol': 'OtherContract',
              },
            },
          })
          const name = metadata.contractName
          expect(name).toEqual('SomeContract')
        })
      })

      describe('when the structure contains one compilation targets', () => {
        it('returns it', () => {
          const metadata = new Metadata(connection, address, {
            settings: {
              compilationTarget: {
                'otherfile.sol': 'OtherContract',
              },
            },
          })
          const name = metadata.contractName
          expect(name).toEqual('OtherContract')
        })
      })
    })

    describe('abiForMethod', () => {
      let contractMetadata: Metadata

      beforeEach(() => {
        contractMetadata = new Metadata(connection, address, CONTRACT_METADATA)
      })

      describe('with full signature', () => {
        it('finds one ABI item when it exists', async () => {
          const results = contractMetadata.abiForMethod('isLegacyRole(bytes32,bytes32)')
          expect(results.length).toEqual(1)
          expect(results[0]).toMatchObject({
            name: 'isLegacyRole',
            inputs: [{ name: 'role' }, { name: 'otherRole' }],
          })
        })

        it('returns an empty array when none exists', async () => {
          const results = contractMetadata.abiForMethod('randomFunction(bytes32,bytes32')
          expect(results.length).toEqual(0)
        })
      })

      describe('with method name', () => {
        it('finds one ABI item when one exists', async () => {
          const results = contractMetadata.abiForMethod('isLegacySigner')
          expect(results.length).toEqual(1)
          expect(results[0]).toMatchObject({
            name: 'isLegacySigner',
          })
        })

        it('finds multiple ABI items when they exist', async () => {
          const results = contractMetadata.abiForMethod('isLegacyRole')
          expect(results.length).toEqual(2)
        })

        it('returns an empty array when none exists', async () => {
          const results = contractMetadata.abiForMethod('randomFunction')
          expect(results.length).toEqual(0)
        })
      })
    })

    describe('abiForSignature', () => {
      let contractMetadata: Metadata

      beforeEach(() => {
        contractMetadata = new Metadata(connection, address, CONTRACT_METADATA)
      })

      describe('when the function exists', () => {
        it('returns the ABI', async () => {
          const callSignature = connection
            .getAbiCoder()
            .encodeFunctionSignature('authorizedBy(address)')
          const abi = contractMetadata.abiForSelector(callSignature)
          expect(abi).toMatchObject({
            constant: true,
            inputs: [
              {
                internalType: 'address',
                name: '',
                type: 'address',
              },
            ],
            name: 'authorizedBy',
            outputs: [
              {
                internalType: 'address',
                name: '',
                type: 'address',
              },
            ],
            payable: false,
            stateMutability: 'view',
            type: 'function',
          })
        })
      })

      describe("when the function doesn't exist", () => {
        it('returns null', () => {
          const abi = contractMetadata.abiForSelector('0x0')
          expect(abi).toBeNull()
        })
      })
    })

    describe('tryGetProxyImplementation', () => {
      describe('with a cLabs proxy', () => {
        it('fetches the implementation', async () => {
          const result = await tryGetProxyImplementation(connection, proxyAddress)
          expect(result?.toLocaleLowerCase()).toEqual(implAddress.toLocaleLowerCase())
        })
      })

      describe('with a non-proxy', () => {
        it('returns null', async () => {
          const result = await tryGetProxyImplementation(connection, address)
          expect(result).toBeUndefined()
        })
      })
    })
  })
})
