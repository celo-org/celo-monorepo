import { BaseCommand } from '../../base'
import { printValueMap } from '../../utils/cli'

export default class Head extends BaseCommand {
  static description = 'Get information about latest block'

  static flags = {
    ...BaseCommand.flags,
  }

  async run() {
    const block = await this.web3.eth.getBlock('latest')
    console.log(block.miner)
    let interesting: { [key: string]: string | number | boolean } = {}
    interesting['timestamp'] = new Date(0).setUTCSeconds(block.timestamp).toLocaleString()
    interesting['block number'] = block.number
    interesting['epoch index'] = Math.floor(block.number / 720) // TODO: epoch block duration should come from network:parameters
    interesting['epoch position'] = Math.floor(block.number % 720) // TODO: epoch block duration should come from network:parameters
    interesting['block validator'] = block.miner

    printValueMap(interesting)
  }
}
