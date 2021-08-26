import { BigNumber } from 'bignumber.js'
import { CeloContract, CeloTokenContract, ExchangeContract, StableTokenContract } from './base'
import { ContractKit } from './kit'
import { GoldTokenWrapper } from './wrappers/GoldTokenWrapper'
import { StableTokenWrapper } from './wrappers/StableTokenWrapper'

export enum StableToken {
  cUSD = 'cUSD',
  cEUR = 'cEUR',
}

export enum Token {
  CELO = 'CELO',
}

export type CeloTokenType = StableToken | Token

type CeloTokenWrapper = GoldTokenWrapper | StableTokenWrapper

export type EachCeloToken<T> = {
  [key in CeloTokenType]?: T
}

export interface CeloTokenInfo {
  contract: CeloTokenContract
  symbol: CeloTokenType
}

export interface StableTokenInfo extends CeloTokenInfo {
  contract: StableTokenContract
  exchangeContract: ExchangeContract
}

/** Basic info for each stable token */
export const stableTokenInfos: {
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
export const celoTokenInfos: {
  [key in CeloTokenType]: CeloTokenInfo
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
   * @return a promise resolving to an object containing the address's balance
   *  for each celo token
   */
  balancesOf(address: string): Promise<EachCeloToken<BigNumber>> {
    return this.forEachCeloToken(async (info: CeloTokenInfo) => {
      const wrapper = await this.kit.contracts.getContract(info.contract)
      return wrapper.balanceOf(address)
    })
  }

  /**
   * Gets the wrapper for each celo token.
   * @return an promise resolving to an object containing the wrapper for each celo token.
   */
  getWrappers(): Promise<EachCeloToken<CeloTokenWrapper>> {
    return this.forEachCeloToken((info: CeloTokenInfo) =>
      this.kit.contracts.getContract(info.contract)
    )
  }

  /**
   * Gets the address for each celo token proxy contract.
   * @return an promise resolving to an object containing the address for each celo token proxy.
   */
  getAddresses(): Promise<EachCeloToken<string>> {
    return this.forEachCeloToken((info: CeloTokenInfo) =>
      this.kit.registry.addressFor(info.contract)
    )
  }

  async getStablesConfigs(humanReadable: boolean = false) {
    return this.forStableCeloToken(async (info: StableTokenInfo) => {
      const stableWrapper = await this.kit.contracts.getContract(info.contract)
      if (humanReadable) {
        return stableWrapper.getHumanReadableConfig()
      }
      return stableWrapper.getConfig()
    })
  }

  async getExchangesConfigs(humanReadable: boolean = false) {
    return this.forStableCeloToken(async (info: StableTokenInfo) => {
      const exchangeWrapper = await this.kit.contracts.getContract(info.exchangeContract)
      if (humanReadable) {
        return exchangeWrapper.getHumanReadableConfig()
      }
      return exchangeWrapper.getConfig()
    })
  }

  /**
   * Runs fn for each celo token found in celoTokenInfos, and returns the
   * value of each call in an object keyed by the token.
   * @param fn the function to be called for each CeloTokenInfo.
   * @return an object containing the resolved value the call to fn for each
   *  celo token.
   */
  async forEachCeloToken<T>(
    fn: (info: CeloTokenInfo) => T | Promise<T>
  ): Promise<EachCeloToken<T>> {
    const wrapperInfoFunction = async () =>
      Promise.all(
        (await this.validCeloTokenInfos()).map(async (info) => {
          const fnResult = fn(info)
          return {
            symbol: info.symbol,
            data: await fnResult,
          }
        })
      )
    return this.forEachWrapperInfo(wrapperInfoFunction)
  }

  /**
   * Runs fn for each stable token found in stableTokenInfos, and returns the
   * value of each call in an object keyed by the token.
   * @param fn the function to be called for each StableTokenInfo.
   * @return an object containing the resolved value the call to fn for each
   *  celo token.
   */
  async forStableCeloToken<T>(
    fn: (info: StableTokenInfo) => T | Promise<T>
  ): Promise<EachCeloToken<T>> {
    const wrapperInfoFunction = async () =>
      Promise.all(
        (await this.validStableTokenInfos()).map(async (info) => {
          const fnResult = fn(info)
          return {
            symbol: info.symbol,
            data: await fnResult,
          }
        })
      )
    return this.forEachWrapperInfo(wrapperInfoFunction)
  }

  private async forEachWrapperInfo<T>(
    fn: () => Promise<Array<{ symbol: CeloTokenType; data: T }>>
  ): Promise<EachCeloToken<T>> {
    return (await fn()).reduce(
      (
        obj: {
          [key in CeloTokenType]?: T
        },
        wrapperInfo
      ) => ({
        ...obj,
        [wrapperInfo.symbol]: wrapperInfo.data,
      }),
      {}
    ) as EachCeloToken<T>
  }

  async validCeloTokenInfos(): Promise<CeloTokenInfo[]> {
    const results = await Promise.all(
      Object.values(celoTokenInfos).map(async (info) => {
        try {
          // The registry add the valid addresses to a cache
          await this.kit.registry.addressFor(info.contract)
          return true
        } catch {
          // The contract was not deployed in the chain
          return false
        }
      })
    )

    return Object.values(celoTokenInfos).filter((_v, index) => results[index])
  }

  async validStableTokenInfos(): Promise<StableTokenInfo[]> {
    const results = await Promise.all(
      Object.values(stableTokenInfos).map(async (info) => {
        try {
          // The registry add the valid addresses to a cache
          await this.kit.registry.addressFor(info.contract)
          await this.kit.registry.addressFor(info.exchangeContract)
          return true
        } catch {
          // The contract was not deployed in the chain
          return false
        }
      })
    )

    return Object.values(stableTokenInfos).filter((_v, index) => results[index])
  }

  /**
   * Gets the wrapper for a given celo token.
   * @param token the token to get the appropriate wrapper for
   * @return an promise resolving to the wrapper for the token
   */
  getWrapper(token: StableToken): Promise<StableTokenWrapper>
  getWrapper(token: Token): Promise<GoldTokenWrapper>
  getWrapper(token: CeloTokenType): Promise<CeloTokenWrapper>
  getWrapper(token: CeloTokenType): Promise<CeloTokenWrapper> {
    return this.kit.contracts.getContract(celoTokenInfos[token].contract)
  }

  /**
   * Gets the contract for the provided token
   * @param token the token to get the contract of
   * @return The contract for the token
   */
  getContract(token: StableToken): StableTokenContract
  getContract(token: CeloTokenType): CeloTokenContract {
    return celoTokenInfos[token].contract
  }

  /**
   * Gets the exchange contract for the provided stable token
   * @param token the stable token to get exchange contract of
   * @return The exchange contract for the token
   */
  getExchangeContract(token: StableToken) {
    return stableTokenInfos[token].exchangeContract
  }

  /**
   * Gets the address of the contract for the provided token.
   * @param token the token to get the (proxy) contract address for
   * @return A promise resolving to the address of the token's contract
   */
  getAddress = (token: CeloTokenType) =>
    this.kit.registry.addressFor(celoTokenInfos[token].contract)

  /**
   * Gets the address to use as the feeCurrency when paying for gas with the
   *  provided token.
   * @param token the token to get the feeCurrency address for
   * @return If not CELO, the address of the token's contract. If CELO, undefined.
   */
  getFeeCurrencyAddress(token: CeloTokenType) {
    if (token === Token.CELO) {
      return undefined
    }
    return this.getAddress(token)
  }

  /**
   * Returns if the provided token is a StableToken
   * @param token the token
   * @return if token is a StableToken
   */
  isStableToken(token: CeloTokenType) {
    // We cast token as StableToken to make typescript happy
    return Object.values(StableToken).includes(token as StableToken)
  }

  isStableTokenContract(contract: CeloContract) {
    const allStableTokenContracts = Object.values(StableToken).map(
      (token) => stableTokenInfos[token].contract
    )
    // We cast token as StableTokenContract to make typescript happy
    return allStableTokenContracts.includes(contract as StableTokenContract)
  }
}
