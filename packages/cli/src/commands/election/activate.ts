import { sleep } from '@celo/utils/lib/async'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ElectionVote extends BaseCommand {
  static description = 'Activate pending votes in validator elections to begin earning rewards'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "Voter's address" }),
    wait: flags.boolean({ description: 'Wait until all pending votes become activatable' }),
  }

  static examples = [
    'activate --from 0x4443d0349e8b3075cba511a0a87796597602a0f1',
    'activate --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --wait',
  ]
  async run() {
    const res = this.parse(ElectionVote)

    this.kit.defaultAccount = res.flags.from
    await newCheckBuilder(this, res.flags.from)
      .isSignerOrAccount()
      .runChecks()

    const election = await this.kit.contracts.getElection()
    const accounts = await this.kit.contracts.getAccounts()
    const account = await accounts.voteSignerToAccount(res.flags.from)
    const hasPendingVotes = await election.hasPendingVotes(account)
    if (hasPendingVotes) {
      if (res.flags.wait) {
        // Spin until pending votes become activatable.
        while (!(await election.hasActivatablePendingVotes(account))) {
          await sleep(1000)
        }
      }
      const txos = await election.activate(account)
      for (const txo of txos) {
        await displaySendTx('activate', txo, { from: res.flags.from })
      }
      if (txos.length === 0) {
        this.log(`Pending votes not yet activatable. Consider using the --wait flag.`)
      }
    } else {
      this.log(`No pending votes to activate`)
    }
  }
}
