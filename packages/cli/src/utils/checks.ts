import { Address } from '@celo/contractkit'
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import { GovernanceWrapper, ProposalStage } from '@celo/contractkit/lib/wrappers/Governance'
import { LockedGoldWrapper } from '@celo/contractkit/lib/wrappers/LockedGold'
import { MultiSigWrapper } from '@celo/contractkit/lib/wrappers/MultiSig'
import { ValidatorsWrapper } from '@celo/contractkit/lib/wrappers/Validators'
import { eqAddress, NULL_ADDRESS } from '@celo/utils/lib/address'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import BigNumber from 'bignumber.js'
import chalk from 'chalk'
import { BaseCommand } from '../base'
import { printValueMapRecursive } from './cli'

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

  get web3() {
    return this.cmd.web3
  }

  get kit() {
    return this.cmd.kit
  }

  withValidators<A>(
    f: (validators: ValidatorsWrapper, signer: Address, account: Address, ctx: CheckBuilder) => A
  ): () => Promise<Resolve<A>> {
    return async () => {
      const validators = await this.kit.contracts.getValidators()
      if (this.signer) {
        const account = await validators.signerToAccount(this.signer)
        return f(validators, this.signer, account, this) as Resolve<A>
      } else {
        return f(validators, '', '', this) as Resolve<A>
      }
    }
  }

  withLockedGold<A>(
    f: (
      lockedGold: LockedGoldWrapper,
      signer: Address,
      account: Address,
      validators: ValidatorsWrapper
    ) => A
  ): () => Promise<Resolve<A>> {
    return async () => {
      const lockedGold = await this.kit.contracts.getLockedGold()
      const validators = await this.kit.contracts.getValidators()
      if (this.signer) {
        const account = await validators.signerToAccount(this.signer)
        return f(lockedGold, this.signer, account, validators) as Resolve<A>
      } else {
        return f(lockedGold, '', '', validators) as Resolve<A>
      }
    }
  }

  withAccounts<A>(f: (accounts: AccountsWrapper) => A): () => Promise<Resolve<A>> {
    return async () => {
      const accounts = await this.kit.contracts.getAccounts()
      return f(accounts) as Resolve<A>
    }
  }

  withGovernance<A>(
    f: (governance: GovernanceWrapper, signer: Address, account: Address, ctx: CheckBuilder) => A
  ): () => Promise<Resolve<A>> {
    return async () => {
      const governance = await this.kit.contracts.getGovernance()
      return f(governance, '', '', this) as Resolve<A>
    }
  }

  addCheck(name: string, predicate: () => Promise<boolean> | boolean, errorMessage?: string) {
    this.checks.push(check(name, predicate, errorMessage))
    return this
  }

  addConditionalCheck(
    name: string,
    runCondition: boolean,
    predicate: () => Promise<boolean> | boolean,
    errorMessage?: string
  ) {
    if (runCondition) {
      return this.addCheck(name, predicate, errorMessage)
    }
    return this
  }

  isApprover = (account: Address) =>
    this.addCheck(
      `${account} is approver address`,
      this.withGovernance(async (governance) => eqAddress(await governance.getApprover(), account))
    )

  proposalExists = (proposalID: string) =>
    this.addCheck(
      `${proposalID} is an existing proposal`,
      this.withGovernance((governance) => governance.proposalExists(proposalID))
    )

  proposalInStage = (proposalID: string, stage: keyof typeof ProposalStage) =>
    this.addCheck(
      `${proposalID} is in stage ${stage}`,
      this.withGovernance(async (governance) => {
        const match = (await governance.getProposalStage(proposalID)) === stage
        if (!match) {
          const timeUntilStages = await governance.timeUntilStages(proposalID)
          printValueMapRecursive({ timeUntilStages })
        }
        return match
      })
    )

  proposalIsPassing = (proposalID: string) =>
    this.addCheck(
      `Proposal ${proposalID} is passing corresponding constitutional quorum`,
      this.withGovernance((governance) => governance.isProposalPassing(proposalID))
    )

  hotfixIsPassing = (hash: Buffer) =>
    this.addCheck(
      `Hotfix 0x${hash.toString('hex')} is whitelisted by quorum of validators`,
      this.withGovernance((governance) => governance.isHotfixPassing(hash))
    )

  hotfixNotExecuted = (hash: Buffer) =>
    this.addCheck(
      `Hotfix 0x${hash.toString('hex')} is not already executed`,
      this.withGovernance(async (governance) => !(await governance.getHotfixRecord(hash)).executed)
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
      this.withAccounts((accounts) =>
        accounts
          .validatorSignerToAccount(this.signer!)
          .then(() => true)
          .catch(() => false)
      )
    )

  signerAccountIsValidator = () =>
    this.addCheck(
      `Signer account is Validator`,
      this.withValidators((validators, _s, account) => validators.isValidator(account))
    )

  signerAccountIsValidatorGroup = () =>
    this.addCheck(
      `Signer account is ValidatorGroup`,
      this.withValidators((validators, _s, account) => validators.isValidatorGroup(account))
    )

  isValidator = (account?: Address) =>
    this.addCheck(
      `${account} is Validator`,
      this.withValidators((validators, _, _account) => validators.isValidator(account ?? _account))
    )

  isValidatorGroup = (account: Address) =>
    this.addCheck(
      `${account} is ValidatorGroup`,
      this.withValidators((validators) => validators.isValidatorGroup(account))
    )

  isNotValidator = (account?: Address) =>
    this.addCheck(
      `${this.signer!} is not a registered Validator`,
      this.withValidators((validators, _, _account) =>
        negate(validators.isValidator(account ?? _account))
      )
    )

  isNotValidatorGroup = () =>
    this.addCheck(
      `${this.signer!} is not a registered ValidatorGroup`,
      this.withValidators((validators, _, account) => negate(validators.isValidatorGroup(account)))
    )

  signerMeetsValidatorBalanceRequirements = () =>
    this.addCheck(
      `Signer's account has enough locked gold for registration`,
      this.withValidators((validators, _signer, account) =>
        validators.meetsValidatorBalanceRequirements(account)
      )
    )

  signerMeetsValidatorGroupBalanceRequirements = () =>
    this.addCheck(
      `Signer's account has enough locked gold for group registration`,
      this.withValidators((validators, _signer, account) =>
        validators.meetsValidatorGroupBalanceRequirements(account)
      )
    )

  meetsValidatorBalanceRequirements = (account: Address) =>
    this.addCheck(
      `${account} has enough locked gold for registration`,
      this.withValidators((validators) => validators.meetsValidatorBalanceRequirements(account))
    )

  meetsValidatorGroupBalanceRequirements = (account: Address) =>
    this.addCheck(
      `${account} has enough locked gold for group registration`,
      this.withValidators((validators) =>
        validators.meetsValidatorGroupBalanceRequirements(account)
      )
    )

  isNotAccount = (address: Address) =>
    this.addCheck(
      `${address} is not a registered Account`,
      this.withAccounts((accounts) => negate(accounts.isAccount(address)))
    )

  isSignerOrAccount = () =>
    this.addCheck(
      `${this.signer!} is Signer or registered Account`,
      this.withAccounts(async (accounts) => {
        const res =
          (await accounts.isAccount(this.signer!)) || (await accounts.isSigner(this.signer!))
        return res
      })
    )

  isVoteSignerOrAccount = () =>
    this.addCheck(
      `${this.signer!} is vote signer or registered account`,
      this.withAccounts(async (accounts) => {
        return accounts.voteSignerToAccount(this.signer!).then(
          (addr) => !eqAddress(addr, NULL_ADDRESS),
          () => false
        )
      })
    )

  isAccount = (address: Address) =>
    this.addCheck(
      `${address} is a registered Account`,
      this.withAccounts((accounts) => accounts.isAccount(address)),
      `${address} is not registered as an account. Try running account:register`
    )

  isNotVoting = (address: Address) =>
    this.addCheck(
      `${address} is not currently voting on a governance proposal`,
      this.withGovernance((governance) => negate(governance.isVoting(address))),
      `${address} is currently voting in governance. Revoke your upvotes or wait for the referendum to end.`
    )

  hasEnoughCelo = (account: Address, value: BigNumber) => {
    const valueInEth = this.kit.web3.utils.fromWei(value.toFixed(), 'ether')
    return this.addCheck(`Account has at least ${valueInEth} CELO`, () =>
      this.kit.contracts
        .getGoldToken()
        .then((goldToken) => goldToken.balanceOf(account))
        .then((balance) => balance.gte(value))
    )
  }

  hasEnoughUsd = (account: Address, value: BigNumber) => {
    const valueInEth = this.kit.web3.utils.fromWei(value.toFixed(), 'ether')
    return this.addCheck(`Account has at least ${valueInEth} cUSD`, () =>
      this.kit.contracts
        .getStableToken()
        .then((stableToken) => stableToken.balanceOf(account))
        .then((balance) => balance.gte(value))
    )
  }

  exceedsProposalMinDeposit = (deposit: BigNumber) =>
    this.addCheck(
      `Deposit is greater than or equal to governance proposal minDeposit`,
      this.withGovernance(async (governance) => deposit.gte(await governance.minDeposit()))
    )

  hasRefundedDeposits = (account: Address) =>
    this.addCheck(
      `${account} has refunded governance deposits`,
      this.withGovernance(
        async (governance) => !(await governance.getRefundedDeposits(account)).isZero()
      )
    )

  hasEnoughLockedGold = (value: BigNumber) => {
    const valueInEth = this.kit.web3.utils.fromWei(value.toFixed(), 'ether')
    return this.addCheck(
      `Account has at least ${valueInEth} Locked Gold`,
      this.withLockedGold(async (lockedGold, _signer, account) =>
        value.isLessThanOrEqualTo(await lockedGold.getAccountTotalLockedGold(account))
      )
    )
  }

  hasEnoughNonvotingLockedGold = (value: BigNumber) => {
    const valueInEth = this.kit.web3.utils.fromWei(value.toFixed(), 'ether')
    return this.addCheck(
      `Account has at least ${valueInEth} non-voting Locked Gold`,
      this.withLockedGold(async (lockedGold, _signer, account) =>
        value.isLessThanOrEqualTo(await lockedGold.getAccountNonvotingLockedGold(account))
      )
    )
  }

  hasEnoughLockedGoldToUnlock = (value: BigNumber) => {
    const valueInEth = this.kit.web3.utils.fromWei(value.toFixed(), 'ether')
    return this.addCheck(
      `Account has at least ${valueInEth} non-voting Locked Gold over requirement`,
      this.withLockedGold(async (lockedGold, _signer, account, validators) => {
        const requirement = await validators.getAccountLockedGoldRequirement(account)
        return (
          (requirement.eq(0) ||
            value.plus(requirement).lte(await lockedGold.getAccountTotalLockedGold(account))) &&
          value.lte(await lockedGold.getAccountNonvotingLockedGold(account))
        )
      })
    )
  }

  isNotValidatorGroupMember = () => {
    return this.addCheck(
      `Account isn't a member of a validator group`,
      this.withValidators(async (validators, _signer, account) => {
        const { affiliation } = await validators.getValidator(account)
        if (!affiliation || eqAddress(affiliation, NULL_ADDRESS)) {
          return true
        }
        const { members } = await validators.getValidatorGroup(affiliation!)
        return !members.includes(account)
      })
    )
  }

  validatorDeregisterDurationPassed = () => {
    return this.addCheck(
      `Enough time has passed since the account was removed from a validator group`,
      this.withValidators(async (validators, _signer, account) => {
        const {
          lastRemovedFromGroupTimestamp,
        } = await validators.getValidatorMembershipHistoryExtraData(account)
        const { duration } = await validators.getValidatorLockedGoldRequirements()
        return duration.toNumber() + lastRemovedFromGroupTimestamp < Date.now() / 1000
      })
    )
  }

  resetSlashingmultiplierPeriodPassed = () => {
    return this.addCheck(
      `Enough time has passed since the last halving of the slashing multiplier`,
      this.withValidators(async (validators, _signer, account) => {
        const { lastSlashed } = await validators.getValidatorGroup(account)
        const duration = await validators.getSlashingMultiplierResetPeriod()
        return duration.toNumber() + lastSlashed.toNumber() < Date.now() / 1000
      })
    )
  }

  hasACommissionUpdateQueued = () =>
    this.addCheck(
      "There's a commision update queued",
      this.withValidators(async (validators, _signer, account) => {
        const vg = await validators.getValidatorGroup(account)
        return !vg.nextCommissionBlock.eq(0)
      })
    )

  hasCommissionUpdateDelayPassed = () =>
    this.addCheck(
      'The Commission update delay has already passed',
      this.withValidators(async (validators, _signer, account, ctx) => {
        const blockNumber = await ctx.web3.eth.getBlockNumber()
        const vg = await validators.getValidatorGroup(account)
        return vg.nextCommissionBlock.lte(blockNumber)
      })
    )

  isMultiSigOwner = (from: string, multisig: MultiSigWrapper) => {
    return this.addCheck('The provided address is an owner of the multisig', async () => {
      const owners = await multisig.getOwners()
      return owners.indexOf(from) > -1
    })
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
