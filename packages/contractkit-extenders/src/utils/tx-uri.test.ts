import { CeloTx } from '@celo/communication'
import { CeloContract, newKitFromWeb3 } from '@celo/contractkit'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { buildUri, parseUri } from './tx-uri'

testWithGanache('URI utils', (web3) => {
  const recipient = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
  const value = '100'

  const simpleTransferTx: CeloTx = {
    value,
    to: recipient,
  }
  const simpleTransferUri = `celo:${recipient}?value=${value}`

  let stableTokenTransferUri: string
  let stableTokenTransferTx: CeloTx

  let lockGoldUri: string
  let lockGoldTx: CeloTx

  const kit = newKitFromWeb3(web3)

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
    it('should match simple CELO transfer tx', () => {
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
    it('should match simple CELO transfer URI', () => {
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
