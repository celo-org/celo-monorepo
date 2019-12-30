import { Address } from '@celo/contractkit'
import { eqAddress } from '@celo/utils/lib/address'
import { concurrentMap } from '@celo/utils/lib/async'
import { bitIsSet, parseBlockExtraData } from '@celo/utils/lib/istanbul'
import { flags } from '@oclif/command'
import { cli } from 'cli-ux'
import { Block } from 'web3/eth/types'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { Flags } from '../../utils/command'

interface ValidatorStatusEntry {
  name: string
  address: Address
  signer: Address
  elected: boolean
  frontRunner: boolean
  signatures: number
  proposed: number
}

export const statusTable = {
  address: {},
  name: {},
  signer: {},
  elected: {},
  frontRunner: {},
  proposed: {},
  signatures: { get: (v: ValidatorStatusEntry) => Math.round(v.signatures * 100) + '%' },
}

export default class ValidatorStatus extends BaseCommand {
  static description =
    'Shows the consensus status of a validator. This command will show whether a validator is currently elected, would be elected if an election were to be run right now, and the percentage of blocks signed and number of blocks successfully proposed within a given window.'

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
    'no-truncate': flags.boolean({
      description: "Don't truncate fields to fit line",
      required: false,
    }),
  }

  static examples = [
    'status --validator 0x5409ED021D9299bf6814279A6A1411A7e866A631',
    'status --all --lookback 100',
  ]

  requireSynced = true

  async getStatus(
    signer: Address,
    blocks: Block[],
    electedSigners: Address[],
    frontRunnerSigners: Address[]
  ): Promise<ValidatorStatusEntry> {
    const accounts = await this.kit.contracts.getAccounts()
    const validator = await accounts.signerToAccount(signer)
    const name = (await accounts.getName(validator)) || ''
    const electedIndex = electedSigners.map((a) => eqAddress(a, signer)).indexOf(true)
    const frontRunnerIndex = frontRunnerSigners.map((a) => eqAddress(a, signer)).indexOf(true)
    const proposedCount = blocks.filter((b) => b.miner === signer).length
    let signedCount = 0
    if (electedIndex >= 0) {
      signedCount = blocks.filter((b) =>
        bitIsSet(parseBlockExtraData(b.extraData).parentAggregatedSeal.bitmap, electedIndex)
      ).length
    }
    return {
      name,
      address: validator,
      signer,
      elected: electedIndex >= 0,
      frontRunner: frontRunnerIndex >= 0,
      proposed: proposedCount,
      signatures: signedCount / blocks.length,
    }
  }

  async run() {
    const res = this.parse(ValidatorStatus)
    const accounts = await this.kit.contracts.getAccounts()
    const validators = await this.kit.contracts.getValidators()
    let signers: string[] = []
    const checker = newCheckBuilder(this)
    if (res.flags.signer) {
      signers = [res.flags.signer]
      const validator = await accounts.signerToAccount(res.flags.signer)
      checker.isAccount(validator).isValidator(validator)
      await checker.runChecks()
    } else if (res.flags.validator) {
      checker.isAccount(res.flags.validator).isValidator(res.flags.validator)
      await checker.runChecks()
      const signer = await accounts.getValidatorSigner(res.flags.validator)
      signers = [signer]
    } else {
      signers = await concurrentMap(10, await validators.getRegisteredValidatorsAddresses(), (a) =>
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
    const validatorStatuses = await concurrentMap(10, signers, (s) =>
      this.getStatus(s, blocks, electedSigners, frontRunnerSigners)
    )
    cli.action.stop()
    cli.table(validatorStatuses, statusTable, { 'no-truncate': res.flags['no-truncate'] })
  }
}
