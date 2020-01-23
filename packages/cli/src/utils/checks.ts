import { Address } from '@celo/contractkit'
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import { GovernanceWrapper, ProposalStage } from '@celo/contractkit/lib/wrappers/Governance'
import { LockedGoldWrapper } from '@celo/contractkit/lib/wrappers/LockedGold'
import { ValidatorsWrapper } from '@celo/contractkit/lib/wrappers/Validators'
import { eqAddress } from '@celo/utils/lib/address'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import BigNumber from 'bignumber.js'
import chalk from 'chalk'
import { BaseCommand } from '../base'
import { printValueMap } from './cli'

export interface CommandCheck {
  name: string
  errorMessage?: string
  run(): Promise<boolean> | boolean
}

export function check(
  name: string,
  predicate: () => Promise<boolean> | boolean,
  errorMessage?: string
): CommandCheck {
  return {
    name,
    errorMessage,
    run: predicate,
  }
}

const negate = (x: Promise<boolean>) => x.then((y) => !y)

type Resolve<A> = A extends Promise<infer T> ? T : A

export function newCheckBuilder(cmd: BaseCommand, signer?: Address) {
  return new CheckBuilder(cmd, signer)
}

class CheckBuilder {
  private checks: CommandCheck[] = []

  constructor(private cmd: BaseCommand, private signer?: Address) {}

  get kit() {
    return this.cmd.kit
  }

  withValidators<A>(
    f: (validators: ValidatorsWrapper, signer: Address, account: Address) => A
  ): () => Promise<Resolve<A>> {
    return async () => {
      const validators = await this.kit.contracts.getValidators()
      if (this.signer) {
        const account = await validators.signerToAccount(this.signer)
        return f(validators, this.signer, account) as Resolve<A>
      } else {
        return f(validators, '', '') as Resolve<A>
      }
    }
  }

  withLockedGold<A>(
    f: (lockedGold: LockedGoldWrapper, signer: Address, account: Address) => A
  ): () => Promise<Resolve<A>> {
    return async () => {
      const lockedGold = await this.kit.contracts.getLockedGold()
      const validators = await this.kit.contracts.getValidators()
      if (this.signer) {
        const account = await validators.signerToAccount(this.signer)
        return f(lockedGold, this.signer, account) as Resolve<A>
      } else {
        return f(lockedGold, '', '') as Resolve<A>
      }
    }
  }

  withAccounts<A>(f: (accounts: AccountsWrapper) => A): () => Promise<Resolve<A>> {
    return async () => {
      const accounts = await this.kit.contracts.getAccounts()
      return f(accounts) as Resolve<A>
    }
  }

  withGovernance<A>(f: (accounts: GovernanceWrapper) => A): () => Promise<Resolve<A>> {
    return async () => {
      const governance = await this.kit.contracts.getGovernance()
      return f(governance) as Resolve<A>
    }
  }

  addCheck(name: string, predicate: () => Promise<boolean> | boolean, errorMessage?: string) {
    this.checks.push(check(name, predicate, errorMessage))
    return this
  }

  isApprover = (account: Address) =>
    this.addCheck(
      `${account} is approver address`,
      this.withGovernance(async (g) => eqAddress(await g.getApprover(), account))
    )

  proposalExists = (proposalID: string) =>
    this.addCheck(
      `${proposalID} is an existing proposal`,
      this.withGovernance((g) => g.proposalExists(proposalID))
    )

  proposalInStage = (proposalID: string, stage: keyof typeof ProposalStage) =>
    this.addCheck(
      `${proposalID} is in stage ${stage}`,
      this.withGovernance(async (g) => {
        const match = (await g.getProposalStage(proposalID)) === stage
        if (!match) {
          const waitTimes = await g.timeUntilStages(proposalID)
          printValueMap(waitTimes)
        }
        return match
      })
    )

  proposalIsPassing = (proposalID: string) =>
    this.addCheck(
      `Proposal ${proposalID} is passing corresponding constitutional quorum`,
      this.withGovernance((g) => g.isProposalPassing(proposalID))
    )

  hotfixIsPassing = (hash: Buffer) =>
    this.addCheck(
      `Hotfix ${hash} is whitelisted by quorum of validators`,
      this.withGovernance((g) => g.isHotfixPassing(hash))
    )

  hotfixNotExecuted = (hash: Buffer) =>
    this.addCheck(
      `Hotfix ${hash} is not already executed`,
      this.withGovernance(async (g) => !(await g.getHotfixRecord(hash)).executed)
    )

  canSign = (account: Address) =>
    this.addCheck('Account can sign', async () => {
      try {
        const message = 'test'
        const signature = await this.kit.web3.eth.sign(message, account)
        return verifySignature(message, signature, account)
      } catch (error) {
        console.error(error)
        return false
      }
    })

  canSignValidatorTxs = () =>
    this.addCheck(
      'Signer can sign Validator Txs',
      this.withAccounts((lg) =>
        lg
          .validatorSignerToAccount(this.signer!)
          .then(() => true)
          .catch(() => false)
      )
    )

  signerAccountIsValidator = () =>
    this.addCheck(
      `Signer account is Validator`,
      this.withValidators((v, _s, account) => v.isValidator(account))
    )

  signerAccountIsValidatorGroup = () =>
    this.addCheck(
      `Signer account is ValidatorGroup`,
      this.withValidators((v, _s, account) => v.isValidatorGroup(account))
    )

  isValidator = (account: Address) =>
    this.addCheck(
      `${account} is Validator`,
      this.withValidators((v) => v.isValidator(account))
    )

  isValidatorGroup = (account: Address) =>
    this.addCheck(
      `${account} is ValidatorGroup`,
      this.withValidators((v) => v.isValidatorGroup(account))
    )

  signerMeetsValidatorBalanceRequirements = () =>
    this.addCheck(
      `Signer's account has enough locked gold for registration`,
      this.withValidators((v, _signer, account) => v.meetsValidatorBalanceRequirements(account))
    )

  signerMeetsValidatorGroupBalanceRequirements = () =>
    this.addCheck(
      `Signer's account has enough locked gold for group registration`,
      this.withValidators((v, _signer, account) =>
        v.meetsValidatorGroupBalanceRequirements(account)
      )
    )

  meetsValidatorBalanceRequirements = (account: Address) =>
    this.addCheck(
      `${account} has enough locked gold for registration`,
      this.withValidators((v) => v.meetsValidatorBalanceRequirements(account))
    )

  meetsValidatorGroupBalanceRequirements = (account: Address) =>
    this.addCheck(
      `${account} has enough locked gold for group registration`,
      this.withValidators((v) => v.meetsValidatorGroupBalanceRequirements(account))
    )

  isNotAccount = (address: Address) =>
    this.addCheck(
      `${address} is not a registered Account`,
      this.withAccounts((accs) => negate(accs.isAccount(address)))
    )

  isSignerOrAccount = () =>
    this.addCheck(
      `${this.signer!} is Signer or registered Account`,
      this.withAccounts(async (accs) => {
        const res = (await accs.isAccount(this.signer!)) || (await accs.isSigner(this.signer!))
        return res
      })
    )

  isVoteSignerOrAccount = () =>
    this.addCheck(
      `${this.signer!} is vote signer or registered account`,
      this.withAccounts(async (accs) => {
        return accs.voteSignerToAccount(this.signer!).then(
          () => true,
          () => false
        )
      })
    )

  isAccount = (address: Address) =>
    this.addCheck(
      `${address} is a registered Account`,
      this.withAccounts((accs) => accs.isAccount(address)),
      `${address} is not registered as an account. Try running account:register`
    )

  hasEnoughGold = (account: Address, value: BigNumber) => {
    const valueInEth = this.kit.web3.utils.fromWei(value.toFixed(), 'ether')
    return this.addCheck(`Account has at least ${valueInEth} cGold`, () =>
      this.kit.contracts
        .getGoldToken()
        .then((gt) => gt.balanceOf(account))
        .then((balance) => balance.gte(value))
    )
  }

  exceedsProposalMinDeposit = (deposit: BigNumber) =>
    this.addCheck(
      `Deposit is greater than or equal to governance proposal minDeposit`,
      this.withGovernance(async (g) => deposit.gte(await g.minDeposit()))
    )

  hasEnoughLockedGold = (value: BigNumber) => {
    const valueInEth = this.kit.web3.utils.fromWei(value.toFixed(), 'ether')
    return this.addCheck(
      `Account has at least ${valueInEth} Locked Gold`,
      this.withLockedGold(async (l, _signer, account) =>
        value.isLessThanOrEqualTo(await l.getAccountTotalLockedGold(account))
      )
    )
  }

  hasEnoughNonvotingLockedGold = (value: BigNumber) => {
    const valueInEth = this.kit.web3.utils.fromWei(value.toFixed(), 'ether')
    return this.addCheck(
      `Account has at least ${valueInEth} non-voting Locked Gold`,
      this.withLockedGold(async (l, _signer, account) =>
        value.isLessThanOrEqualTo(await l.getAccountNonvotingLockedGold(account))
      )
    )
  }

  async runChecks() {
    console.log(`Running Checks:`)
    let allPassed = true
    for (const aCheck of this.checks) {
      const passed = await aCheck.run()
      const status︎Str = chalk.bold(passed ? '✔' : '✘')
      const color = passed ? chalk.green : chalk.red
      const msg = !passed && aCheck.errorMessage ? aCheck.errorMessage : ''
      console.log(color(`   ${status︎Str}  ${aCheck.name} ${msg}`))
      allPassed = allPassed && passed
    }

    if (!allPassed) {
      return this.cmd.error("Some checks didn't pass!")
    }
  }

  // async executeValidatorTx(
  //   name: string,
  //   f: (
  //     validators: ValidatorsWrapper,
  //     signer: Address,
  //     account: Address
  //   ) => Promise<CeloTransactionObject<any>> | CeloTransactionObject<any>
  // ) {

  // }
}
