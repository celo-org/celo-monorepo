import { StableToken } from '..'
import { CeloContract } from '../base'
import { stableTokenInfos } from '../celo-tokens'
import { WrapperCache } from '../contract-cache'

export default class TokenExchangeWrappers extends WrapperCache {
  getExchange(stableToken: StableToken = StableToken.cUSD) {
    return this.getContract(stableTokenInfos[stableToken].exchangeContract)
  }

  getGoldToken() {
    return this.getContract(CeloContract.GoldToken)
  }

  getStableToken(stableToken: StableToken = StableToken.cUSD) {
    return this.getContract(stableTokenInfos[stableToken].contract)
  }
}
