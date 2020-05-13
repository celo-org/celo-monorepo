import { Tx } from 'web3-core'
import { CeloContract } from '../base'
import { newKit } from '../kit'
import { buildUri, parseUri } from './tx-uri'

describe('URI utils', () => {
  const recipient = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
  const value = '100'

  const simpleTransferTx: Tx = {
    value,
    to: recipient,
  }
  const simpleTransferUri = `celo:${recipient}?value=${value}`

  let stableTokenTransferUri: string
  let stableTokenTransferTx: Tx

  let lockGoldUri: string
  let lockGoldTx: Tx

  const kit = newKit('http://localhost:8545')

  beforeAll(async () => {
    const stableTokenAddr = await kit.registry.addressFor(CeloContract.StableToken)
    stableTokenTransferUri = `celo:${stableTokenAddr}/transfer(address,uint256)?args=[${recipient},${value}]`
    const stableToken = await kit.contracts.getStableToken()
    const transferData = stableToken.transfer(recipient, value).txo.encodeABI()
    stableTokenTransferTx = {
      to: stableTokenAddr,
      data: transferData,
    }

    const lockedGoldAddr = await kit.registry.addressFor(CeloContract.LockedGold)
    lockGoldUri = `celo:${lockedGoldAddr}/lock()?value=${value}`
    const lockedGold = await kit.contracts.getLockedGold()
    const lockData = lockedGold.lock().txo.encodeABI()
    lockGoldTx = {
      to: lockedGoldAddr,
      data: lockData,
      value,
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

    it('should match lock gold tx', () => {
      const resultTx = parseUri(lockGoldUri)
      expect(resultTx).toEqual(lockGoldTx)
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

    it('should match lock gold URI', () => {
      const uri = buildUri(lockGoldTx, 'lock')
      expect(uri).toEqual(lockGoldUri)
    })
  })
})
