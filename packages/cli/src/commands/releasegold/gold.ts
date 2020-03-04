import { newReleaseGold } from '@celo/contractkit/lib/generated/ReleaseGold'
import { ReleaseGoldWrapper } from '@celo/contractkit/lib/wrappers/ReleaseGold'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Gold extends BaseCommand {
  static description =
    'Perform actions [lock, unlock, relock, withdraw] on the gold held in the given contract.'

  static flags = {
    ...BaseCommand.flags,
    contract: Flags.address({ required: true, description: 'Address of the ReleaseGold Contract' }),
    action: flags.string({
      char: 'a',
      options: ['lock', 'unlock', 'relock', 'withdraw'],
      description: "Action to perform on contract's gold",
      required: true,
    }),
    value: Flags.wei({ required: true, description: 'Amount of gold to perform `action` with' }),
    // TODO(lucas): Should this take an index, or just chose an index based on the provided value?
    index: flags.string({
      char: 'i',
      description: 'Index for relocking and withdrawing pending withdrawal',
    }),
  }

  static examples = [
    'gold --contract 0xCcc8a47BE435F1590809337BB14081b256Ae26A8 --action lock --value 10000000000000000000000',
    'gold --contract 0xCcc8a47BE435F1590809337BB14081b256Ae26A8 --action unlock --value 10000000000000000000000',
    'gold --contract 0xCcc8a47BE435F1590809337BB14081b256Ae26A8 --action relock --value 10000000000000000000000 --index 0',
    'gold --contract 0xCcc8a47BE435F1590809337BB14081b256Ae26A8 --action withdraw --value 10000000000000000000000 --index 0',
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
      tx = releaseGoldWrapper.lockGold(flags.value)
    } else if (flags.action === 'unlock') {
      this.kit.defaultAccount = isRevoked ? releaseOwner : beneficiary
      tx = releaseGoldWrapper.unlockGold(flags.value)
    } else if (flags.action === 'relock') {
      // TODO(lucas): clean up duplicated code
      const index = Number(flags.index)
      await checkBuilder
        .addCheck('Is not revoked', () => !isRevoked)
        .addCheck('Index is provided', () => flags.index !== undefined)
        .addCheck('Index is valid', () => index >= 0)
        .addCheck(
          'Index is in bounds and withdrawal value at index is greater or equal to value',
          async () => {
            const lockedGold = await this.kit.contracts.getLockedGold()
            const pendingWithdrawals = await lockedGold.getPendingWithdrawals(
              releaseGoldWrapper.address
            )
            const validIndex = index < pendingWithdrawals.length
            return validIndex && pendingWithdrawals[index].value.gte(flags.value)
          }
        )
        .runChecks()
      this.kit.defaultAccount = beneficiary
      tx = releaseGoldWrapper.relockGold(index, flags.value.toNumber())
    } else if (flags.action === 'withdraw') {
      const index = Number(flags.index)
      const lockedGold = await this.kit.contracts.getLockedGold()
      const pendingWithdrawals = await lockedGold.getPendingWithdrawals(releaseGoldWrapper.address)
      await checkBuilder
        .addCheck('Index is provided', () => flags.index !== undefined)
        .addCheck('Index is valid', () => index >= 0)
        .addCheck(
          'Index is in bounds and withdrawal value at index is greater or equal to value',
          async () => {
            const validIndex = index < pendingWithdrawals.length
            return validIndex && pendingWithdrawals[index].value.gte(flags.value)
          }
        )
        .addCheck('Pending withdrawal at index is available for withdrawal', async () => {
          const currentTime = Math.round(new Date().getTime() / 1000)
          if (index < pendingWithdrawals.length) {
            return pendingWithdrawals[index].time.isLessThan(currentTime)
          }
          return false
        })
        .runChecks()
      this.kit.defaultAccount = isRevoked ? releaseOwner : beneficiary
      tx = releaseGoldWrapper.withdrawLockedGold(index)
    } else {
      return this.error('Invalid action provided')
    }

    await displaySendTx('gold' + flags.action + 'Tx', tx)
  }
}
