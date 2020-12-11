import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class AttestationRewardsWithdraw extends BaseCommand {
  static description = 'Withdraw accumulated attestation rewards for a given currency'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({
      required: true,
      description:
        'Address to withdraw from. Can be the attestation signer address or the underlying account address',
    }),
    tokenAddress: Flags.address({
      required: true,
      description: 'The address of the token that will be withdrawn',
    }),
  }

  async run() {
    const {
      flags: { from, tokenAddress },
    } = this.parse(AttestationRewardsWithdraw)
    const [accounts, attestations] = await Promise.all([
      this.kit.contracts.getAccounts(),
      this.kit.contracts.getAttestations(),
    ])

    const address = await accounts.signerToAccount(from)
    const pendingWithdrawals = await attestations.getPendingWithdrawals(tokenAddress, address)
    if (!pendingWithdrawals.gt(0)) {
      console.info('No pending rewards for this token address')
      return
    }

    cli.action.start(`Withdrawing ${pendingWithdrawals.toString()} rewards to ${address}`)
    await displaySendTx('withdraw', attestations.withdraw(tokenAddress), { from: address })
    cli.action.stop()
  }
}
