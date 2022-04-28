import { StableToken } from '@celo/base'
import { Connection } from '@celo/connect'
import { AddressRegistry } from './address-registry'
import { CeloContract } from './base'
import { ContractCacheType } from './basic-contract-cache-type'
import { stableTokenInfos } from './celo-tokens'
import { newAccounts } from './generated/Accounts'
import { newExchange } from './generated/Exchange'
import { newExchangeBrl } from './generated/ExchangeBRL'
import { newExchangeEur } from './generated/ExchangeEUR'
import { newGasPriceMinimum } from './generated/GasPriceMinimum'
import { newGoldToken } from './generated/GoldToken'
import { newStableToken } from './generated/StableToken'
import { newStableTokenBrl } from './generated/StableTokenBRL'
import { newStableTokenEur } from './generated/StableTokenEUR'
import { AccountsWrapper } from './wrappers/Accounts'
import { ExchangeWrapper } from './wrappers/Exchange'
import { GasPriceMinimumWrapper } from './wrappers/GasPriceMinimum'
import { GoldTokenWrapper } from './wrappers/GoldTokenWrapper'
import { StableTokenWrapper } from './wrappers/StableTokenWrapper'

const MINIMUM_CONTRACTS = {
  [CeloContract.Accounts]: {
    newInstance: newAccounts,
    wrapper: AccountsWrapper,
  },
  [CeloContract.GasPriceMinimum]: {
    newInstance: newGasPriceMinimum,
    wrapper: GasPriceMinimumWrapper,
  },
  [CeloContract.GoldToken]: {
    newInstance: newGoldToken,
    wrapper: GoldTokenWrapper,
  },
  [CeloContract.Exchange]: {
    newInstance: newExchange,
    wrapper: ExchangeWrapper,
  },
  [CeloContract.ExchangeEUR]: {
    newInstance: newExchangeEur,
    wrapper: ExchangeWrapper,
  },
  [CeloContract.ExchangeBRL]: {
    newInstance: newExchangeBrl,
    wrapper: ExchangeWrapper,
  },
  [CeloContract.StableToken]: {
    newInstance: newStableToken,
    wrapper: StableTokenWrapper,
  },
  [CeloContract.StableTokenBRL]: {
    newInstance: newStableTokenBrl,
    wrapper: StableTokenWrapper,
  },
  [CeloContract.StableTokenEUR]: {
    newInstance: newStableTokenEur,
    wrapper: StableTokenWrapper,
  },
}

export type ContractsBroughtBase = typeof MINIMUM_CONTRACTS

type Keys = keyof ContractsBroughtBase

type Wrappers<T extends Keys> = InstanceType<ContractsBroughtBase[T]['wrapper']>

const contractsWhichRequireCache = new Set([
  CeloContract.Attestations,
  CeloContract.DoubleSigningSlasher,
  CeloContract.DowntimeSlasher,
  CeloContract.Election,
  CeloContract.Governance,
  CeloContract.LockedGold,
  CeloContract.Validators,
])

/**
 * Alternative Contract Cache with Minimal Contracts
 *
 * Provides access to a subset of wrappers: {@link AccountsWrapper},  {@link ExchangeWrapper}, {@link GasPriceMinimumWrapper} and Celo Token contracts
 * Used internally by {@link MiniContractKit}
 *
 * @param connection – {@link Connection}
 * @param registry – {@link AddressRegistry}
 */

export class MiniContractCache implements ContractCacheType {
  private cache: Map<keyof ContractsBroughtBase, any> = new Map()

  constructor(
    readonly connection: Connection,
    readonly registry: AddressRegistry,
    private readonly contractClasses: ContractsBroughtBase = MINIMUM_CONTRACTS
  ) {}

  getAccounts(): Promise<AccountsWrapper> {
    return this.getContract(CeloContract.Accounts)
  }
  getExchange(stableToken: StableToken = StableToken.cUSD): Promise<ExchangeWrapper> {
    return this.getContract(stableTokenInfos[stableToken].exchangeContract)
  }

  getGoldToken(): Promise<GoldTokenWrapper> {
    return this.getContract(CeloContract.GoldToken)
  }

  getStableToken(stableToken: StableToken = StableToken.cUSD): Promise<StableTokenWrapper> {
    return this.getContract(stableTokenInfos[stableToken].contract)
  }

  /**
   * Get Contract wrapper
   */
  public async getContract<ContractKey extends keyof ContractsBroughtBase>(
    contract: ContractKey,
    address?: string
  ): Promise<Wrappers<ContractKey>> {
    if (!this.isContractAvailable(contract)) {
      throw new Error(
        `This instance of MiniContracts was not given a mapping for ${contract}. Either add it or use WrapperCache for full set of contracts`
      )
    }

    if (contractsWhichRequireCache.has(contract)) {
      throw new Error(
        `${contract} cannot be used with MiniContracts as it requires an instance of WrapperCache to be passed in as an argument`
      )
    }

    if (this.cache.get(contract) == null || address !== undefined) {
      await this.setContract<ContractKey>(contract, address)
    }
    return this.cache.get(contract)! as Wrappers<ContractKey>
  }

  private async setContract<ContractKey extends keyof ContractsBroughtBase>(
    contract: ContractKey,
    address: string | undefined
  ) {
    if (!address) {
      address = await this.registry.addressFor(contract)
    }

    const classes = this.contractClasses[contract]

    const instance = classes.newInstance(this.connection.web3, address)

    const Klass = classes.wrapper as ContractsBroughtBase[ContractKey]['wrapper']
    const wrapper = new Klass(this.connection, instance as any)

    this.cache.set(contract, wrapper)
  }

  public invalidateContract<C extends keyof ContractsBroughtBase>(contract: C) {
    this.cache.delete(contract)
  }

  private isContractAvailable(contract: keyof ContractsBroughtBase) {
    return !!this.contractClasses[contract]
  }
}
