import { ensureLeading0x } from '@celo/utils/lib/address'
import { flags } from '@oclif/command'
import fs from 'fs'
import { BaseCommand } from '../../base'
import { displayWeb3Tx } from '../../utils/cli'
import { Flags } from '../../utils/command'

const DKG = require('./DKG.json')

export default class DKGPublish extends BaseCommand {
  static description = 'Publishes data for each phase of the DKG'

  static flags = {
    ...BaseCommand.flags,
    data: flags.string({ required: true, description: 'Path to the data being published' }),
    address: Flags.address({ required: true, description: 'DKG Contract Address' }),
    from: Flags.address({ required: true, description: 'Address of the sender' }),
  }

  async run() {
    const res = this.parse(DKGPublish)
    const web3 = this.kit.web3

    const dkg = new web3.eth.Contract(DKG.abi, res.flags.address)

    const data = fs.readFileSync(res.flags.data).toString('hex')
    await displayWeb3Tx('publishData', dkg.methods.publish(ensureLeading0x(data)), {
      from: res.flags.from,
    })
  }
}
