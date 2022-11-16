import {
  Address,
  Callback,
  Connection,
  JsonRpcPayload,
  JsonRpcResponse,
  Provider,
} from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import Web3 from 'web3'
import { fetchMetadata, Metadata } from './sourcify'

// This is taken from protocol/contracts/build/Account.json
const CONTRACT_METADATA = require('../fixtures/contract.metadata.json')
// This is taken from protocol/contracts/build/AccountProxy.json
const PROXY_METADATA = require('../fixtures/proxy.metadata.json')

describe('sourcify helpers', () => {
  let kit: ContractKit
  const web3: Web3 = new Web3()
  const address: Address = web3.utils.randomHex(20)
  const implAddress: Address = web3.utils.randomHex(20)

  const mockProvider: Provider = {
    send: (payload: JsonRpcPayload, callback: Callback<JsonRpcResponse>): void => {
      callback(null, {
        jsonrpc: payload.jsonrpc,
        id: Number(payload.id),
        result: `0x000000000000000000000000${implAddress}`,
      })
    },
  }

  beforeEach(() => {
    fetchMock.reset()
    web3.setProvider(mockProvider as any)
    const connection = new Connection(web3)
    kit = new ContractKit(connection)
  })

  describe('fetchMetadata()', () => {
    describe('when a full match exists', () => {
      it('returns the metadata from the full match', async () => {
        fetchMock.get(
          'https://repo.sourcify.dev/contracts/full_match/42220/0xabc/metadata.json',
          new Metadata(kit, address, {})
        )
        const metadata = await fetchMetadata(kit, '42220', '0xabc')
        expect(metadata).toBeInstanceOf(Metadata)
      })
    })

    describe('when a full match does not exist', () => {
      describe('but a partial match exists', () => {
        it('returns the metadata from the partial match', async () => {
          fetchMock
            .get('https://repo.sourcify.dev/contracts/full_match/42220/0xabc/metadata.json', 400)
            .get(
              'https://repo.sourcify.dev/contracts/partial_match/42220/0xabc/metadata.json',
              new Metadata(kit, address, {})
            )
          const metadata = await fetchMetadata(kit, '42220', '0xabc')
          expect(metadata).toBeInstanceOf(Metadata)
        })
      })

      describe('and a partial match does not exist', () => {
        it('is null', async () => {
          fetchMock
            .get('https://repo.sourcify.dev/contracts/full_match/42220/0xabc/metadata.json', 400)
            .get('https://repo.sourcify.dev/contracts/partial_match/42220/0xabc/metadata.json', 400)
          const metadata = await fetchMetadata(kit, '42220', '0xabc')
          expect(metadata).toEqual(null)
        })
      })
    })
  })

  describe('Metadata', () => {
    describe('get abi', () => {
      it('returns the abi when it finds it', () => {
        const metadata = new Metadata(kit, address, { output: { abi: [{}] } })
        const abi = metadata.abi
        expect(abi).not.toBeNull()
        expect(abi).toEqual([{}])
      })

      it('returns null when there is no abi', () => {
        const metadata = new Metadata(kit, address, { output: { other: [{}] } })
        const abi = metadata.abi
        expect(abi).toBeNull()
      })
    })

    describe('get contractName', () => {
      describe('when the structure does not contain it', () => {
        it('returns null', () => {
          const metadata = new Metadata(kit, address, { output: { abi: [{}] } })
          const name = metadata.contractName
          expect(name).toBeNull()
        })
      })

      describe('when the structure contains multiple compilation targets', () => {
        it('returns the first', () => {
          const metadata = new Metadata(kit, address, {
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
          const metadata = new Metadata(kit, address, {
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

    describe('abiForSignature', () => {
      let contractMetadata: Metadata

      beforeEach(() => {
        contractMetadata = new Metadata(kit, address, CONTRACT_METADATA)
      })

      describe('when the function exists', () => {
        it('returns the ABI', async () => {
          const callSignature = kit.connection
            .getAbiCoder()
            .encodeFunctionSignature('authorizedBy(address)')
          const abi = contractMetadata.abiForSignature(callSignature)
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
          const abi = contractMetadata.abiForSignature('0x0')
          expect(abi).toBeNull()
        })
      })
    })

    describe('tryGetProxyImplementation', () => {
      let proxyMetadata: Metadata
      let contractMetadata: Metadata

      beforeEach(() => {
        contractMetadata = new Metadata(kit, address, CONTRACT_METADATA)
        proxyMetadata = new Metadata(kit, address, PROXY_METADATA)
      })

      describe('with a cLabs proxy', () => {
        it('fetches the implementation', async () => {
          const implAddress = await proxyMetadata.tryGetProxyImplementation()
          expect(implAddress).toEqual(implAddress)
        })
      })

      describe('with a non-proxy', () => {
        it('returns null', async () => {
          const implAddress = await contractMetadata.tryGetProxyImplementation()
          expect(implAddress).toBeNull()
        })
      })
    })
  })
})
