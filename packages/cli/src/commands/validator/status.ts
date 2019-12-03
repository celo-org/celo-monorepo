import { Address } from '@celo/contractkit'
import { eqAddress } from '@celo/utils/lib/address'
import { concurrentMap } from '@celo/utils/lib/async'
import { flags } from '@oclif/command'
import { cli } from 'cli-ux'
import * as rlp from 'rlp'
import { Block } from 'web3/eth/types'
import { BaseCommand } from '../../base'
import { CheckBuilder, newCheckBuilder } from '../../utils/checks'
import { Flags } from '../../utils/command'

export default class ValidatorStatus extends BaseCommand {
  static description =
    'Show information about whether the validator signer is elected and validating. This command will check that the validator meets the registration requirements, and its signer is currently elected and actively signing blocks.'

  static flags = {
    ...BaseCommand.flags,
    signer: Flags.address({
      description: 'address of the validator to check if elected and validating',
    }),
    validator: Flags.address({
      description: 'address of the signer to check if elected and validating',
    }),
    lookback: flags.integer({
      description: 'how many blocks to look back for signer activity',
      default: 100,
    }),
  }

  static examples = [
    'status --validator 0x5409ED021D9299bf6814279A6A1411A7e866A631',
    'status --signer 0x738337030fAeb1E805253228881d844b5332fB4c',
    'status --signer 0x738337030fAeb1E805253228881d844b5332fB4c --lookback 100',
  ]

  requireSynced = true

  async run() {
    const res = this.parse(ValidatorStatus)

    // Determine the validator signer to check.
    let signer: Address
    if (res.flags.signer) {
      signer = res.flags.signer
    } else {
      signer = await accounts.getValidatorSigner(res.flags.validator)
    }

    // Check that the specified validator or signer meets the validator requirements.
    const checker = newCheckBuilder(this, res.flags.signer)
    if (res.flags.validator) {
      const account = res.flags.validator
      checker.isValidator(account).meetsValidatorBalanceRequirements(account)
    } else if (res.flags.signer) {
      cheker.signerMeetsValidatorBalanceRequirements().signerAccountIsValidator()
    } else {
      this.error('Either validator or signer must be specified')
    }
    await checker.runChecks()

    // Assign and verify the signer.
    let signer: Address
    if (res.flags.signer) {
      signer = res.flags.signer
      if (res.flags.validator) {
        const accounts = await this.kit.contracts.getAccounts()
        if ((await accounts.signerToAccount(signer)) !== res.flags.validator) {
          this.error(
            `Signer ${signer} has never been authorized for account ${res.flags.validator}`
          )
        }
      }
    } else {
      signer = await accounts.getValidatorSigner(res.flags.validator!)
      console.info(`Identified ${signer} as the authorized validator signer`)
    }

    // Determine if the signer is elected, and get their index in the validator set.
    const election = await this.kit.contracts.getElection()
    const signers = await election.getCurrentValidatorSigners()
    const signerIndex = signers.map((a) => eqAddress(a, signer)).indexOf(true)
    if (signerIndex < 0) {
      // Determine whether the signer will be elected at the next epoch to provide a helpful error.
      const frontrunners = await election.electValidatorSigners()
      if (frontrunners.some((a) => eqAddress(a, signer))) {
        this.error(
          `Signer ${signer} is not elected for this epoch, but is currently winning in the upcoming election. Wait for the next epoch.`
        )
      } else {
        this.error(
          `Signer ${signer} is not elected for this epoch, and is not currently winning the upcoming election.`
        )
      }
    }
    console.info('Signer has been elected for this epoch')

    if (res.flags.lookback <= 0) {
      return
    }

    // Retrieve blocks to examine for the singers signature.
    cli.action.start(`Retreiving the last ${res.flags.lookback} blocks`)
    const latest = await this.web3.eth.getBlock('latest')
    const blocks = await concurrentMap(10, [...Array(res.flags.lookback).keys()].slice(1), (i) =>
      this.web3.eth.getBlock(latest.number - i)
    )
    blocks.splice(0, 0, latest)
    cli.action.stop()

    const signedCount = blocks.filter((b) => this.validatorIndexSignedParentHeader(b, signerIndex))
      .length
    if (signedCount === 0) {
      this.error(`Signer has not signed any of the last ${res.flags.lookback} blocks`)
    }
    console.info(`Signer has signed ${signedCount} of the last ${res.flags.lookback} blocks`)

    const proposedCount = blocks.filter((b) => b.miner === signer).length
    console.info(`Signer has proposed ${proposedCount} of the last ${res.flags.lookback} blocks`)
  }

  // Check the parent seal in the given block header for a bit indicating at the given index.
  private validatorIndexSignedParentHeader(block: Block, index: number) {
    // See https://github.com/celo-org/celo-blockchain/blob/master/core/types/istanbul.go
    // tslint:disable:no-bitwise
    // @ts-ignore
    const parentSealBitmap = rlp.decode('0x' + block.extraData.slice(66))[5][0]
    return (
      (parentSealBitmap[parentSealBitmap.length - 1 - Math.floor(index / 8)] & (1 << index % 8)) > 0
    )
    // tslint:enable:no-bitwise
  }
}
