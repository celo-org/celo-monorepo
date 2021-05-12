import Web3 from 'web3'
import { CeloContract } from './base'
import { CeloTokenInfo, CeloTokens, StableToken, Token } from './celo-tokens'
import { ContractKit, newKitFromWeb3 } from './kit'

describe('CeloTokens', () => {
  let kit: ContractKit
  let celoTokens: CeloTokens

  beforeEach(() => {
    kit = newKitFromWeb3(new Web3('http://localhost:8545'))
    celoTokens = kit.celoTokens
  })

  describe('forEachCeloToken()', () => {
    it('returns an object with a key for each celo token and the value from a provided async fn', async () => {
      const result = await celoTokens.forEachCeloToken(async (info: CeloTokenInfo) =>
        Promise.resolve(info.symbol)
      )
      for (const [key, value] of Object.entries(result)) {
        expect(key).toEqual(value)
      }
    })

    it('returns an object with a key for each celo token and the value from a provided non-async fn', async () => {
      const result = await celoTokens.forEachCeloToken(async (info: CeloTokenInfo) => info.symbol)
      for (const [key, value] of Object.entries(result)) {
        expect(key).toEqual(value)
      }
    })
  })

  describe('isStableToken()', () => {
    it('returns true if the token is a stable token', () => {
      expect(celoTokens.isStableToken(StableToken.cUSD)).toEqual(true)
    })

    it('returns false if the token is not a stable token', () => {
      expect(celoTokens.isStableToken(Token.CELO)).toEqual(false)
    })
  })

  describe('isStableTokenContract()', () => {
    it('returns true if the contract is a stable token contract', () => {
      expect(celoTokens.isStableTokenContract(CeloContract.StableToken)).toEqual(true)
    })

    it('returns false if the contract is not a stable token contract', () => {
      expect(celoTokens.isStableTokenContract(CeloContract.Exchange)).toEqual(false)
    })
  })
})
