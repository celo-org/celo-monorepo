import { flags } from '@oclif/command'
import fs from 'fs'
import { BaseCommand } from '../../../base'

export default class AttestationCompletedEvents extends BaseCommand {
  static description = 'Fetch AttestationCompleted events from Attestations contract'

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
    const res = this.parse(AttestationCompletedEvents)
    const fromBlock = res.flags.fromBlock
    const toBlock = res.flags.toBlock
    const batchSize = res.flags.batchSize
    const attestations = await this.kit.contracts.getAttestations()
    const events = await attestations.getAttestationCompletedEvents(fromBlock, toBlock, batchSize)
    const outputFile = `attestation-completed-events-${fromBlock}-${toBlock}.json`
    fs.writeFile(outputFile, JSON.stringify(events, null, 2), (err) => {
      if (err) throw err
    })
    console.log('Results output to: ', outputFile)
  }
}
