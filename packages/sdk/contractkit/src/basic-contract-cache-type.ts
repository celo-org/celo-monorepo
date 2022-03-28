import { StableToken } from '@celo/base'
import { CeloContract, CeloTokenContract } from './base'
import { AccountsWrapper } from './wrappers/Accounts'
import { ExchangeWrapper } from './wrappers/Exchange'
import { GasPriceMinimumWrapper } from './wrappers/GasPriceMinimum'
import { GoldTokenWrapper, GoldTokenWrapperType } from './wrappers/GoldTokenWrapper'
import { StableTokenWrapper } from './wrappers/StableTokenWrapper'

/**
 * Interface for a class with the minimum required wrappers
 * to make a {@link MiniContractKit} or {@link CeloTokens} Class
 */
export interface ContractCacheType {
  getAccounts(): Promise<AccountsWrapper>
  getExchange(stableToken: StableToken): Promise<ExchangeWrapper>

  getGasPriceMinimum(): Promise<GasPriceMinimumWrapper>
  getGoldToken(): Promise<GoldTokenWrapper>

  getStableToken(stableToken: StableToken): Promise<StableTokenWrapper>

  getContract(
    contract: CeloContract.Exchange | CeloContract.ExchangeEUR | CeloContract.ExchangeBRL
  ): Promise<ExchangeWrapper>
  getContract(contract: CeloTokenContract): Promise<StableTokenWrapper>
  getContract(contract: CeloContract.GoldToken): Promise<GoldTokenWrapperType>
}
