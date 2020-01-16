import { concurrentMap } from '@celo/utils/lib/async'
import { zip } from '@celo/utils/lib/collections'
import chalk from 'chalk'
import { BaseCommand } from '../../base'
import { printValueMap } from '../../utils/cli'

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

    console.log(chalk`{purple.bold Queued Proposals:}`)
    sortedQueue.map(printValueMap)

    const dequeue = await governance.getDequeue()
    const stages = await concurrentMap(5, dequeue, governance.getProposalStage)
    const proposals = zip((proposalID, stage) => ({ proposalID, stage }), dequeue, stages)

    console.log(chalk`{blue.bold Dequeued Proposals:}`)
    proposals.map(printValueMap)
  }
}
