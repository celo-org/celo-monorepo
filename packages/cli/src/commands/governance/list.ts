import { concurrentMap } from '@celo/utils/src/async'
import chalk from 'chalk'
import { BaseCommand } from '../../base'
import { printValueMap, printValueMapRecursive } from '../../utils/cli'

export default class List extends BaseCommand {
  static description = 'List live governance proposals (queued and ongoing)'

  static flags = {
    ...BaseCommand.flags,
  }

  static examples = []

  async run() {
    this.parse(List)

    const governance = await this.kit.contracts.getGovernance()
    const queue = await governance.getQueue()
    const sortedQueue = governance.sortedQueue(queue)

    console.log(chalk`{purple.bold Queued Proposals:}`)
    sortedQueue.map(printValueMap)

    const dequeue = await governance.getDequeue()
    const dequeueRecords = await concurrentMap(5, dequeue, (proposalID) =>
      governance.getProposalRecord(proposalID)
    )
    console.log(chalk`{blue.bold Dequeued Proposals:}`)
    dequeueRecords.map(printValueMapRecursive)
  }
}
