import { flags } from '@oclif/command'
import fs from 'fs'
import { BaseCommand } from '../../../base'

export default class TransferEventscUSD extends BaseCommand {
  static description = 'Fetch Transfer events from StableToken contract'

  static flags = {
    ...BaseCommand.flags,
    fromBlock: flags.integer({ required: true, description: 'Starting Block' }),
    toBlock: flags.integer({ required: true, description: 'Ending Block' }),
    batchSize: flags.integer({
      required: true,
      description: 'batch size of blocks requested by the server at a time',
    }),
  }

  async run() {
    const res = this.parse(TransferEventscUSD)
    const fromBlock = res.flags.fromBlock
    const toBlock = res.flags.toBlock
    const batchSize = res.flags.batchSize
    const stableToken = await this.kit.contracts.getStableToken()
    const events = await stableToken.getTransferEvents(fromBlock, toBlock, batchSize)
    const outputFile = `transfer-cusd-events-${fromBlock}-${toBlock}.json`
    fs.writeFile(outputFile, JSON.stringify(events, null, 2), (err) => {
      if (err) throw err
    })
    console.log('Results output to: ', outputFile)
  }
}
