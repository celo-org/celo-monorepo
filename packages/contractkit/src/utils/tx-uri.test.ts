import { Tx } from 'web3-core'
import { CeloContract } from '../base'
import { newKit } from '../kit'
import { buildUri, parseUri } from './tx-uri'

describe('URI utils', () => {
  const kit = newKit('http://localhost:8545')
  const recipient = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
  const value = '100'
  const simpleTransferTx: Tx = {
    value,
    to: recipient,
  }
  const simpleTransferUri = `celo:${recipient}?value=${value}`
  let stableTokenTransferUri: string
  let stableTokenTransferTx: Tx

  beforeAll(async () => {
    const stableTokenAddr = await kit.registry.addressFor(CeloContract.StableToken)
    stableTokenTransferUri = `celo:${stableTokenAddr}/transfer(address,uint256)?0=${recipient}&1=${value}`
    const stableToken = await kit.contracts.getStableToken()
    const data = stableToken.transfer(recipient, value).txo.encodeABI()
    stableTokenTransferTx = {
      to: stableTokenAddr,
      data,
    }
  })

  describe('#parseUri', () => {
    it('should match simple cGLD transfer tx', () => {
      const resultTx = parseUri(simpleTransferUri)
      expect(resultTx).toEqual(simpleTransferTx)
    })

    it('should match cUSD transfer tx', () => {
      const resultTx = parseUri(stableTokenTransferUri)
      expect(resultTx).toEqual(stableTokenTransferTx)
    })
  })

  describe('#buildUri', () => {
    it('should match simple cGLD transfer URI', () => {
      const resultUri = buildUri(simpleTransferTx)
      expect(resultUri).toEqual(simpleTransferUri)
    })

    it('should match cUSD transfer URI', () => {
      const uri = buildUri(stableTokenTransferTx, 'transfer', ['address', 'uint256'])
      expect(uri).toEqual(stableTokenTransferUri)
    })
  })
})
