import { valueToString } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import { concurrentMap } from '@celo/utils/lib/async'
import { zip } from '@celo/utils/lib/collections'
import chalk from 'chalk'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'

export default class List extends BaseCommand {
  static description = 'List live governance proposals (queued and ongoing)'

  static flags = {
    ...BaseCommand.flags,
  }

  static examples = ['list']

  async run() {
    this.parse(List)

    const governance = await this.kit.contracts.getGovernance()
    const queue = await governance.getQueue()
    const sortedQueue = governance.sortedQueue(queue)

    console.log(chalk.magenta.bold('Queued Proposals:'))
    cli.table(sortedQueue, {
      ID: { get: (p) => valueToString(p.proposalID) },
      upvotes: { get: (p) => valueToString(p.upvotes) },
    })

    const dequeue = await governance.getDequeue()
    const stages = await concurrentMap(5, dequeue, governance.getProposalStage)
    const proposals = zip((proposalID, stage) => ({ proposalID, stage }), dequeue, stages)

    console.log(chalk.blue.bold('Dequeued Proposals:'))
    cli.table(proposals, {
      ID: { get: (p) => valueToString(p.proposalID) },
      stage: {},
    })
  }
}
