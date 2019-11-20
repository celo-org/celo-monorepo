import { Address } from '@celo/contractkit'
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import { LockedGoldWrapper } from '@celo/contractkit/lib/wrappers/LockedGold'
import { ValidatorsWrapper } from '@celo/contractkit/lib/wrappers/Validators'
import BigNumber from 'bignumber.js'
import chalk from 'chalk'
import { BaseCommand } from '../base'

export interface CommandCheck {
  name: string
  run(): Promise<boolean> | boolean
}

export function check(name: string, predicate: () => Promise<boolean> | boolean): CommandCheck {
  return {
    name,
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

  withLockedGold<A>(f: (lockedGold: LockedGoldWrapper) => A): () => Promise<Resolve<A>> {
    return async () => {
      const lockedGold = await this.kit.contracts.getLockedGold()
      return f(lockedGold) as Resolve<A>
    }
  }

  withAccounts<A>(f: (lockedGold: AccountsWrapper) => A): () => Promise<Resolve<A>> {
    return async () => {
      const accounts = await this.kit.contracts.getAccounts()
      return f(accounts) as Resolve<A>
    }
  }

  addCheck(name: string, predicate: () => Promise<boolean> | boolean) {
    this.checks.push(check(name, predicate))
    return this
  }

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
    this.addCheck(`${account} is Validator`, this.withValidators((v) => v.isValidator(account)))

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
      `Signer's account has enough locked gold for registration`,
      this.withValidators((v, _signer, account) =>
        v.meetsValidatorGroupBalanceRequirements(account)
      )
    )

  isNotAccount = (address: Address) =>
    this.addCheck(
      `${address} is not an Account`,
      this.withAccounts((accs) => negate(accs.isAccount(address)))
    )

  isSignerOrAccount = () =>
    this.addCheck(
      `${this.signer!} is Signer or Account`,
      this.withAccounts(async (accs) => {
        const res = (await accs.isAccount(this.signer!)) || (await accs.isSigner(this.signer!))
        return res
      })
    )

  isAccount = (address: Address) =>
    this.addCheck(`${address} is Account`, this.withAccounts((accs) => accs.isAccount(address)))

  hasEnoughGold = (account: Address, value: BigNumber) => {
    const valueInEth = this.kit.web3.utils.fromWei(value.toFixed(), 'ether')
    return this.addCheck(`Account has at least ${valueInEth} cGold`, () =>
      this.kit.contracts
        .getGoldToken()
        .then((gt) => gt.balanceOf(account))
        .then((balance) => balance.gte(value))
    )
  }

  async runChecks() {
    console.log(`Running Checks:`)
    let allPassed = true
    for (const aCheck of this.checks) {
      const passed = await aCheck.run()
      const status︎Str = chalk.bold(passed ? '✔' : '✘')
      const color = passed ? chalk.green : chalk.red
      console.log(color(`   ${status︎Str}  ${aCheck.name}`))
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
