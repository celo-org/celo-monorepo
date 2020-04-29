import { eqAddress } from '@celo/utils/lib/address'
import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { newCheckBuilder } from '../../utils/checks'
import { binaryPrompt, displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { ReleaseGoldCommand } from './release-gold'

export default class LockedGold extends ReleaseGoldCommand {
  static description =
    'Perform actions [lock, unlock, withdraw] on Celo Gold that has been locked via the provided ReleaseGold contract.'

  static flags = {
    ...ReleaseGoldCommand.flags,
    action: flags.string({
      char: 'a',
      options: ['lock', 'unlock', 'withdraw'],
      description: "Action to perform on contract's gold",
      required: true,
    }),
    value: Flags.wei({ required: true, description: 'Amount of gold to perform `action` with' }),
    yes: flags.boolean({ description: 'Answer yes to prompt' }),
  }

  static examples = [
    'locked-gold --contract 0xCcc8a47BE435F1590809337BB14081b256Ae26A8 --action lock --value 10000000000000000000000',
    'locked-gold --contract 0xCcc8a47BE435F1590809337BB14081b256Ae26A8 --action unlock --value 10000000000000000000000',
    'locked-gold --contract 0xCcc8a47BE435F1590809337BB14081b256Ae26A8 --action withdraw --value 10000000000000000000000',
  ]

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(LockedGold)
    const value = new BigNumber(flags.value)
    const checkBuilder = newCheckBuilder(this, this.contractAddress).isAccount(this.contractAddress)
    const isRevoked = await this.releaseGoldWrapper.isRevoked()
    const beneficiary = await this.releaseGoldWrapper.getBeneficiary()
    const releaseOwner = await this.releaseGoldWrapper.getReleaseOwner()
    const lockedGold = await this.kit.contracts.getLockedGold()
    this.kit.defaultAccount = isRevoked ? releaseOwner : beneficiary

    if (flags.action === 'lock') {
      // Must verify contract is account before checking pending withdrawals
      await checkBuilder.addCheck('Is not revoked', () => !isRevoked).runChecks()
      const pendingWithdrawalsValue = await lockedGold.getPendingWithdrawalsTotalValue(
        this.contractAddress
      )
      const relockValue = BigNumber.minimum(pendingWithdrawalsValue, value)
      const lockValue = value.minus(relockValue)
      await newCheckBuilder(this, this.contractAddress)
        .hasEnoughGold(this.contractAddress, lockValue)
        .runChecks()
      const txos = await this.releaseGoldWrapper.relockGold(relockValue)
      for (const txo of txos) {
        await displaySendTx('lockedGoldRelock', txo, { from: beneficiary })
      }
      if (lockValue.gt(new BigNumber(0))) {
        const accounts = await this.kit.contracts.getAccounts()
        const totalValue = await this.releaseGoldWrapper.getRemainingUnlockedBalance()
        const remaining = totalValue.minus(lockValue)
        console.log('remaining', remaining.toFixed())
        if (
          !flags.yes &&
          remaining.lt(new BigNumber(2e18)) &&
          (eqAddress(await accounts.getVoteSigner(flags.contract), flags.contract) ||
            eqAddress(await accounts.getValidatorSigner(flags.contract), flags.contract))
        ) {
          const check = await binaryPrompt(
            `Only ${remaining.shiftedBy(
              -18
            )} cGLD would be left unlocked, you might not be able to fund your signers. Unlock anyway?`,
            true
          )
          if (!check) {
            console.log('Cancelled')
            return
          }
        }
        await displaySendTx('lockedGoldLock', this.releaseGoldWrapper.lockGold(lockValue))
      }
    } else if (flags.action === 'unlock') {
      await checkBuilder
        .isNotVoting(this.contractAddress)
        .hasEnoughLockedGoldToUnlock(value)
        .runChecks()
      await displaySendTx('lockedGoldUnlock', this.releaseGoldWrapper.unlockGold(flags.value))
    } else if (flags.action === 'withdraw') {
      await checkBuilder.runChecks()
      const currentTime = Math.round(new Date().getTime() / 1000)
      while (true) {
        let madeWithdrawal = false
        const pendingWithdrawals = await lockedGold.getPendingWithdrawals(this.contractAddress)
        for (let i = 0; i < pendingWithdrawals.length; i++) {
          const pendingWithdrawal = pendingWithdrawals[i]
          if (pendingWithdrawal.time.isLessThan(currentTime)) {
            console.log(
              `Found available pending withdrawal of value ${pendingWithdrawal.value.toFixed()}, withdrawing`
            )
            await displaySendTx('lockedGoldWithdraw', this.releaseGoldWrapper.withdrawLockedGold(i))
            madeWithdrawal = true
            break
          }
        }
        if (!madeWithdrawal) break
      }
      const remainingPendingWithdrawals = await lockedGold.getPendingWithdrawals(
        this.contractAddress
      )
      for (const pendingWithdrawal of remainingPendingWithdrawals) {
        console.log(
          `Pending withdrawal of value ${pendingWithdrawal.value.toFixed()} available for withdrawal in ${pendingWithdrawal.time
            .minus(currentTime)
            .toFixed()} seconds.`
        )
      }
    }
  }
}
