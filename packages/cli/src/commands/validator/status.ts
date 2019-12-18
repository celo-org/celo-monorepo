import { Address } from '@celo/contractkit'
import { eqAddress } from '@celo/utils/lib/address'
import { concurrentMap } from '@celo/utils/lib/async'
import { bitIsSet, parseBlockExtraData } from '@celo/utils/lib/istanbul'
import { flags } from '@oclif/command'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { Flags } from '../../utils/command'

export const statusTable = {
  address: {},
  name: {},
  signer: {},
  elected: {},
  frontRunner: {},
  proposed: {},
  signatures: { get: (v: Validator) => parseInt(v.signatures * 100) + '%' },
}

export default class ValidatorStatus extends BaseCommand {
  static description =
    'Show information about whether the validator signer is elected and validating. This command will check that the validator meets the registration requirements, and its signer is currently elected and actively signing blocks.'

  static flags = {
    ...BaseCommand.flags,
    validator: Flags.address({
      description: 'address of the validator to check if elected and validating',
      exclusive: ['all', 'signer'],
    }),
    signer: Flags.address({
      description: 'address of the signer to check if elected and validating',
      exclusive: ['validator', 'all'],
    }),
    all: flags.boolean({
      description: 'get the status of all registered validators',
      exclusive: ['validator', 'signer'],
    }),
    lookback: flags.integer({
      description: 'how many blocks to look back for signer activity',
      default: 100,
    }),
  }

  static examples = [
    'status --validator 0x5409ED021D9299bf6814279A6A1411A7e866A631',
    'status --all --lookback 100',
  ]

  requireSynced = true
  name = (await accounts.getName(validator)) || ''
  signer = await accounts.getValidatorSigner(validator)

  async run() {
    const res = this.parse(ValidatorStatus)
    const accounts = await this.kit.contracts.getAccounts()
    const validators = await this.kit.contracts.getValidators()
    let signers: string[] = []
    const checker = newCheckBuilder(this)
    if (res.flags.signer) {
      signers = [res.flags.signer]
      checker.isAccount(res.flags.validator).isValidator(res.flags.validator)
      await checker.runChecks()
    } else if (res.flags.validator) {
      const validator = await accounts.signerToAccount(res.flags.signer)
      signers = [validator]
      checker.isAccount(validator).isValidator(validator)
      await checker.runChecks()
    } else {
      signers = concurrentMap(10, await validators.getRegisteredValidatorsAddresses(), (a) =>
        accounts.getValidatorSigner(a)
      )
    }

    const election = await this.kit.contracts.getElection()
    const electedSigners = await election.getCurrentValidatorSigners()
    const frontRunnerSigners = await election.electValidatorSigners()
    const latest = await this.web3.eth.getBlock('latest')
    const blocks = await concurrentMap(10, [...Array(res.flags.lookback).keys()], (i) =>
      this.web3.eth.getBlock(latest.number - i)
    )
    const validatorStatuses = await concurrentMap(10, accounts, (a) =>
      validators.getStatus(a, blocks, electedSigners, frontRunnerSigners)
    )
    cli.action.stop()
    cli.table(validatorStatuses, statusTable, { 'no-truncate': res.flags['no-truncate'] })
  }
}
