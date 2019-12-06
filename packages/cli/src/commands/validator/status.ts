import { Address } from '@celo/contractkit'
import { eqAddress } from '@celo/utils/lib/address'
import { concurrentMap } from '@celo/utils/lib/async'
import { bitIsSet, parseBlockExtraData } from '@celo/utils/lib/istanbul'
import { flags } from '@oclif/command'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { Flags } from '../../utils/command'

export default class ValidatorStatus extends BaseCommand {
  static description =
    'Show information about whether the validator signer is elected and validating. This command will check that the validator meets the registration requirements, and its signer is currently elected and actively signing blocks.'

  static flags = {
    ...BaseCommand.flags,
    signer: Flags.address({
      description: 'address of the signer to check if elected and validating',
      exclusive: ['validator'],
    }),
    validator: Flags.address({
      description: 'address of the validator to check if elected and validating',
      exclusive: ['signer'],
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

    // Check that the specified validator or signer meets the validator requirements.
    const checker = newCheckBuilder(this, res.flags.signer)
    if (res.flags.validator) {
      const account = res.flags.validator
      checker
        .isAccount(account)
        .isValidator(account)
        .meetsValidatorBalanceRequirements(account)
    } else if (res.flags.signer) {
      checker
        .isSignerOrAccount()
        .signerMeetsValidatorBalanceRequirements()
        .signerAccountIsValidator()
    } else {
      this.error('Either validator or signer must be specified')
    }
    await checker.runChecks()

    // Get the signer from the validator account if not provided.
    let signer: Address = res.flags.signer || ''
    if (!signer) {
      const accounts = await this.kit.contracts.getAccounts()
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
          `Signer ${signer} is not elected for this epoch, but would be elected if an election were to be held now. Please wait until the next epoch.`
        )
      } else {
        this.error(
          `Signer ${signer} is not elected for this epoch, and would not be elected if an election were to be held now.`
        )
      }
    }
    console.info('Signer has been elected for this epoch')

    if (((res.flags && res.flags.lookback) || 0) <= 0) {
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

    const signedCount = blocks.filter((b) =>
      bitIsSet(parseBlockExtraData(b.extraData).parentAggregatedSeal.bitmap, signerIndex)
    ).length
    if (signedCount === 0) {
      this.error(`Signer has not signed any of the last ${res.flags.lookback} blocks`)
    }
    console.info(`Signer has signed ${signedCount} of the last ${res.flags.lookback} blocks`)

    const proposedCount = blocks.filter((b) => b.miner === signer).length
    console.info(`Signer has proposed ${proposedCount} of the last ${res.flags.lookback} blocks`)
  }
}
