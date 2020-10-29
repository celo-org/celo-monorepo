import { BaseCommand } from '../../base'
import { printValueMapRecursive } from '../../utils/cli'

export default class Info extends BaseCommand {
  static description = 'View general network information such as the current block number'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
  }

  async run() {
    const blockNumber = await this.kit.web3.eth.getBlockNumber()
    const epochNumber = await this.kit.getEpochNumberOfBlock(blockNumber)

    const info = {
      blockNumber,
      epoch: {
        number: await this.kit.getEpochNumberOfBlock(blockNumber),
        size: await this.kit.getEpochSize(),
        start: await this.kit.getFirstBlockNumberForEpoch(epochNumber),
        end: await this.kit.getLastBlockNumberForEpoch(epochNumber),
      },
    }

    printValueMapRecursive(info)
  }
}
