import { Address } from '@celo/contractkit'
import { flags } from '@oclif/command'
import { cli } from 'cli-ux'
import { range } from 'lodash'
import * as rlp from 'rlp'
import { Block } from 'web3/eth/types'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { Flags } from '../../utils/command'

export default class ValidatorOnline extends BaseCommand {
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
      default: 50,
    }),
  }

  static examples = [
    'status --validator 0x5409ED021D9299bf6814279A6A1411A7e866A631',
    'status --signer 0x738337030fAeb1E805253228881d844b5332fB4c',
    'status --signer 0x738337030fAeb1E805253228881d844b5332fB4c --lookback 100',
  ]

  requireSynced = true

  async run() {
    const { flags } = this.parse(ValidatorOnline)

    if (!flags.validator && !flags.signer) {
      this.error('Either validator or signer must be specified')
    }

    // Determine the validator signer to check.
    let signer: Address
    if (flags.validator) {
      const accounts = await this.kit.contracts.getAccounts()
      signer = await accounts.getValidatorSigner(flags.validator)
      console.info(`Identified ${signer} as the authorized validator signer`)

      // If the user specified both, verify that it matches what is stored on chain.
      if (flags.signer && signer.toLowerCase() !== flags.signer.toLowerCase()) {
        this.error(`${flags.signer} is not the authorized signer for ${flags.validator}`)
      }
    } else {
      signer = flags.signer!
    }

    // Use redundant checks to help the user diagnose issues.
    await newCheckBuilder(this, signer)
      .canSignValidatorTxs()
      .signerMeetsValidatorBalanceRequirements()
      .signerAccountIsValidator()
      .runChecks()

    // Determine if the signer is elected, and get their index in the validator set.
    const election = await this.kit.contracts.getElection()
    const signers = await election.getCurrentValidatorSigners()
    const signerIndex = signers.map((a) => a.toLowerCase()).indexOf(signer.toLowerCase())
    if (signerIndex < 0) {
      // Determine whether the signer will be elected at the next epoch to provide a helpful error.
      const frontrunners = await election.electValidatorSigners()
      if (frontrunners.map((a) => a.toLowerCase()).indexOf(signer.toLowerCase()) >= 0) {
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

    if (flags.lookback <= 0) {
      return
    }

    // Retrieve blocks to examine for the singers signature.
    cli.action.start(`Retreiving the last ${flags.lookback} blocks`)
    const latest = await this.web3.eth.getBlock('latest')
    const blocks = await Promise.all(
      range(1, flags.lookback).map((i) => this.web3.eth.getBlock(latest.number - i))
    )
    blocks.splice(0, 0, latest)
    cli.action.stop()

    const signedCount = blocks.filter((b) => this.validatorIndexSignedParentHeader(b, signerIndex))
      .length
    if (signedCount === 0) {
      this.error(`Signer has not signed any of the last ${flags.lookback} blocks`)
    }
    console.info(`Signer has signed ${signedCount} of the last ${flags.lookback} blocks`)
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
