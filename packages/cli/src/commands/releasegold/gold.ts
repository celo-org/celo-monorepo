import { newReleaseGold } from '@celo/contractkit/src/generated/ReleaseGold'
import { ReleaseGoldWrapper } from '@celo/contractkit/src/wrappers/ReleaseGold'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Gold extends BaseCommand {
  static description = 'Perform actions on the gold held in the given contract.'

  static flags = {
    ...BaseCommand.flags,
    contract: Flags.address({ required: true, description: 'Address of the ReleaseGold Contract' }),
    action: flags.string({
      char: 'a',
      options: ['lock', 'unlock', 'relock'],
      description: "Action to perform on contract's gold",
      required: true,
    }),
    value: Flags.wei({ required: true, description: 'Amount of gold to perform `action` with' }),
    // TODO(lucas): Should this take an index, or just chose an index based on the provided value?
    index: flags.string({
      char: 'i',
      description: 'Index for relocking pending withdrawal',
    }),
  }

  static examples = [
    'gold --contract 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --action lock --value 10000000000000000000000',
  ]

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(Gold)

    const releaseGoldWrapper = new ReleaseGoldWrapper(
      this.kit,
      newReleaseGold(this.kit.web3, flags.contract)
    )
    let tx: any
    const checkBuilder = newCheckBuilder(this)
    const isRevoked = await releaseGoldWrapper.isRevoked()
    const beneficiary = await releaseGoldWrapper.getBeneficiary()
    const releaseOwner = await releaseGoldWrapper.getReleaseOwner()

    if (flags.action === 'lock') {
      await checkBuilder.addCheck('Is not revoked', () => !isRevoked).runChecks()
      this.kit.defaultAccount = beneficiary
      tx = await releaseGoldWrapper.lockGold(flags.value)
    } else if (flags.action === 'unlock') {
      this.kit.defaultAccount = isRevoked ? releaseOwner : beneficiary
      tx = await releaseGoldWrapper.unlockGold(flags.value)
    } else if (flags.action === 'relock') {
      const index = Number(flags.index)
      await checkBuilder
        .addCheck('Is not revoked', () => !isRevoked)
        .addCheck('Index is provided', () => flags.index !== undefined)
        .addCheck('Index is valid', () => Number(flags.index) >= 0)
        .addCheck('Withdrawal at index is greater than value', async () => {
          const lockedGold = await this.kit.contracts.getLockedGold()
          const pendingWithdrawals = await lockedGold.getPendingWithdrawals(
            releaseGoldWrapper.address
          )
          return pendingWithdrawals[index].value.gte(flags.value)
        })
        .runChecks()
      this.kit.defaultAccount = beneficiary
      tx = await releaseGoldWrapper.relockGold(Number(flags.index), flags.value.toNumber())
    } else {
      return this.error('Invalid action provided')
    }

    await displaySendTx(flags.action, tx)
  }
}
