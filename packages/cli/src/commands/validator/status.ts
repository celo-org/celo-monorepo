import { cli } from 'cli-ux'
import { range } from 'lodash'
import * as rlp from 'rlp'
import { Block } from 'web3/eth/types'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { Flags } from '../../utils/command'

export default class ValidatorOnline extends BaseCommand {
  static description = 'Show information about whether the signer is elected and validating'

  // How many blocks to look back for proposals of this signer.
  static readonly lookback = 50

  static flags = {
    ...BaseCommand.flags,
    signer: Flags.address({
      required: true,
      description: 'address of the signer to check if elected and validating',
    }),
  }

  static examples = ['status --signer 0x5409ED021D9299bf6814279A6A1411A7e866A631']

  requireSynced = true

  async run() {
    const { flags } = this.parse(ValidatorOnline)

    // Use redundant checks to help the user diagnose issues.
    await newCheckBuilder(this, flags.signer)
      .canSignValidatorTxs()
      .signerMeetsValidatorBalanceRequirements()
      .signerAccountIsValidator()
      .runChecks()

    cli.action.start('Querying current validator set')
    const election = await this.kit.contracts.getElection()
    const size = await election.numberValidatorsInCurrentSet()
    const set = await Promise.all(range(size).map(election.validatorAddressFromCurrentSet))
    cli.action.stop()

    const signerIndex = set.map((a) => a.toLowerCase()).indexOf(flags.signer.toLowerCase())
    if (signerIndex < 0) {
      this.error(`Signer ${flags.signer} is not in the validator set for this epoch`)
    }

    cli.action.start('Searching for proposed blocks')
    const latest = await this.web3.eth.getBlock('latest')
    const blocks = await Promise.all(
      range(1, ValidatorOnline.lookback).map((i) => this.web3.eth.getBlock(latest.number - i))
    )
    blocks.splice(0, 0, latest)
    cli.action.stop()

    for (const [i, block] of blocks.entries()) {
      if (this.validatorIndexSignedParentHeader(block, signerIndex)) {
        const parent =
          i + 1 < blocks.length ? blocks[i + 1] : await this.web3.getBlock(block.number - 1)
        const timedelta = Date.now() / 1000 - parent.timestamp
        console.info(
          `Signer most recently signed block ${parent.number} ${Math.ceil(timedelta)} seconds ago`
        )
        return
      }
    }
    this.error(
      `Signer is part of the current validator set, but has not signed any of the last ${
        ValidatorOnline.lookback
      } blocks`
    )
  }
  k
  // Check the parent seal in the given block header for a bit indicating at the given index.
  private validatorIndexSignedParentHeader(block: Block, index: number) {
    // See https://github.com/celo-org/celo-blockchain/blob/master/core/types/istanbul.go
    // tslint:disable:no-bitwise
    // @ts-ignore
    const parentSealBitmap = rlp.decode('0x' + block.extraData.slice(66))[5][0]
    // @ts-ignore
    return (
      (parentSealBitmap[parentSealBitmap.length - 1 - Math.floor(index / 8)] & (1 << index % 8)) > 0
    )
    // tslint:enable:no-bitwise
  }
}
