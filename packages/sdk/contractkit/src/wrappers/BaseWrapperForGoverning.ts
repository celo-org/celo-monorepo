import { Connection, Contract } from '@celo/connect'
import { AccountsWrapper } from './Accounts'
import { BaseWrapper } from './BaseWrapper'
import { ElectionWrapper } from './Election'
import { LockedGoldWrapper } from './LockedGold'
import { MultiSigWrapper } from './MultiSig'
import { ValidatorsWrapper } from './Validators'

interface ContractWrappersForVotingAndRules {
  getAccounts: () => Promise<AccountsWrapper>
  getValidators: () => Promise<ValidatorsWrapper>
  getElection: () => Promise<ElectionWrapper>
  getLockedGold: () => Promise<LockedGoldWrapper>
  getMultiSig: (address: string) => Promise<MultiSigWrapper>
}

export class BaseWrapperForGoverning<T extends Contract> extends BaseWrapper<T> {
  constructor(
    protected readonly connection: Connection,
    protected readonly contract: T,
    protected readonly contracts: ContractWrappersForVotingAndRules
  ) {
    super(connection, contract)
  }
}
