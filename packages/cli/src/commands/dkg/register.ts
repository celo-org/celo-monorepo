import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { displayWeb3Tx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import fs from 'fs'

const DKG = require('./DKG.json')

export default class DKGRegister extends BaseCommand {
  static description = 'Register a public key in the DKG'

  static flags = {
    ...BaseCommand.flags,
    blsKey: flags.string({ required: true }),
    address: Flags.address({ required: true, description: 'DKG Contract Address' }),
    from: Flags.address({ required: true, description: 'Address of the sender' }),
  }

  async run() {
    const res = this.parse(DKGRegister)
    const web3 = this.kit.web3

    const dkg = new web3.eth.Contract(DKG.abi, res.flags.address)

    // read the pubkey and publish it
    const blsKey = fs.readFileSync(res.flags.blsKey)
    await displayWeb3Tx('registerBlsKey', dkg.methods.register('0x' + blsKey.toString('hex')), {
      from: res.flags.from,
    })
  }
}
