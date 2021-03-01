import { BigNumber } from 'bignumber.js'
import { CeloContract, CeloTokenContract, StableTokenContract, ExchangeContract } from './base'
import { ContractKit } from './kit'
import { StableTokenWrapper } from './wrappers/StableTokenWrapper'
import { GoldTokenWrapper } from './wrappers/GoldTokenWrapper'

export enum StableToken {
  cUSD = 'cUSD',
  cEUR = 'cEUR',
}

export enum Token {
  CELO = 'CELO',
}

export type CeloToken = StableToken | Token

type CeloTokenWrapper = GoldTokenWrapper | StableTokenWrapper

export type EachCeloToken<T> = {
  [key in CeloToken]: T
}

interface CeloTokenInfo {
  contract: CeloTokenContract
  symbol: CeloToken
}

interface StableTokenInfo extends CeloTokenInfo {
  contract: StableTokenContract
  exchangeContract: ExchangeContract
}

/** Basic info for each stable token */
const stableTokenInfos: {
  [key in StableToken]: StableTokenInfo
} = {
  [StableToken.cUSD]: {
    contract: CeloContract.StableToken,
    exchangeContract: CeloContract.Exchange,
    symbol: StableToken.cUSD,
  },
  [StableToken.cEUR]: {
    contract: CeloContract.StableTokenEUR,
    exchangeContract: CeloContract.ExchangeEUR,
    symbol: StableToken.cEUR,
  },
}

/** Basic info for each supported celo token, including stable tokens */
const celoTokenInfos: {
  [key in CeloToken]: CeloTokenInfo
} = {
  [Token.CELO]: {
    contract: CeloContract.GoldToken,
    symbol: Token.CELO,
  },
  ...stableTokenInfos,
}

/**
 * A helper class to interact with all Celo tokens, ie CELO and stable tokens
 */
export class CeloTokens {
  constructor(readonly kit: ContractKit) {}

  /**
   * Gets an address's balance for each celo token.
   * @param address the address to look up the balances for
   * @return an object containing the address's balance for each celo token
   */
  async balancesOf(address: string): Promise<EachCeloToken<BigNumber>> {
    return this.forEachCeloToken(async (info: CeloTokenInfo) => {
      const wrapper = await this.kit.contracts.getContract(info.contract)
      return wrapper.balanceOf(address)
    })
  }

  /**
   * Gets the wrapper for each celo token.
   * @return an object containing the wrapper for each celo token.
   */
  async getCeloTokens(): Promise<EachCeloToken<CeloTokenWrapper>> {
    return this.forEachCeloToken((info: CeloTokenInfo) =>
      this.kit.contracts.getContract(info.contract)
    )
  }

  /**
   * Runs fn for each celo token found in celoTokenInfos, and returns the
   * value of each call in an object keyed by the token.
   * @param fn the function to be called for each CeloTokenInfo.
   * @return an object containing the resolved value the call to fn for each
   *  celo token.
   */
  async forEachCeloToken<T>(fn: (info: CeloTokenInfo) => Promise<T>): Promise<EachCeloToken<T>> {
    const wrapperInfos = await Promise.all(
      Object.values(celoTokenInfos).map(async (info: CeloTokenInfo) => ({
        symbol: info.symbol,
        data: await fn(info),
      }))
    )
    return wrapperInfos.reduce(
      (
        obj: {
          [key in CeloToken]?: T
        },
        wrapperInfo
      ) => ({
        ...obj,
        [wrapperInfo.symbol]: wrapperInfo.data,
      }),
      {}
    ) as EachCeloToken<T>
  }

  /**
   * Gets a StableTokenWrapper for the provided stable token
   * @param token the stable token to get StableTokenWrapper for
   * @return A promise resolving to a StableTokenWrapper for token
   */
  getStableToken(token: StableToken) {
    // return this.kit.contracts.getContract(stableTokenInfos[token].contract)
    return stableTokenInfos[token].contract
  }

  /**
   * Gets an ExchangeWrapper for the provided stable token
   * @param token the stable token to get ExchangeWrapper for
   * @return A promise resolving to a ExchangeWrapper for token
   */
  getExchange(token: StableToken) {
    // return this.kit.contracts.getContract(stableTokenInfos[token].exchangeContract)
    return stableTokenInfos[token].exchangeContract
  }
}
