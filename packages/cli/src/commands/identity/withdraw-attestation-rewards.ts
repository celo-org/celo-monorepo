import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class AttestationRewardsWithdraw extends BaseCommand {
  static description = 'Withdraw accumulated attestation rewards for a given currency'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Address to withdraw to' }),
    tokenAddress: Flags.address({
      required: true,
      description: 'The address of the token that will be withdrawn',
    }),
  }

  async run() {
    const res = this.parse(AttestationRewardsWithdraw)
    const [accounts, attestations] = await Promise.all([
      this.kit.contracts.getAccounts(),
      this.kit.contracts.getAttestations(),
    ])

    const attestationSigner = await accounts.getAttestationSigner(res.flags.from)
    const pendingWithdrawals = await attestations.getPendingWithdrawals(
      attestationSigner,
      res.flags.tokenAddress
    )
    if (!pendingWithdrawals.gt(0)) {
      console.info('No pending rewards for this token address')
      return
    }

    cli.action.start(
      `Withdrawing ${pendingWithdrawals.toString()} rewards for ${res.flags.tokenAddress}`
    )
    await displaySendTx('withdraw', attestations.withdraw(res.flags.tokenAddress))
    cli.action.stop()
  }
}
