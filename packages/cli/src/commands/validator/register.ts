import ethjsutil from 'ethereumjs-util'

import { Attestations, Validators } from '@celo/contractkit'
import { flags } from '@oclif/command'

import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { sendTx } from '../../utils/tx'

export default class ValidatorRegister extends BaseCommand {
  static description = 'Register a new Validator'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Address for the Validator' }),
    id: flags.string({ required: true }),
    name: flags.string({ required: true }),
    url: flags.string({ required: true }),
    publicKey: Flags.publicKey({ required: true }),
    noticePeriod: flags.string({
      required: true,
      description: 'Notice Period for the Bonded deposit to use',
    }),
  }

  static examples = [
    'register --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --id myID --name myNAme --noticePeriod 5184000 --url "http://validator.com" --publicKey 0xc52f3fab06e22a54915a8765c4f6826090cfac5e40282b43844bf1c0df83aaa632e55b67869758f2291d1aabe0ebecc7cbf4236aaa45e3e0cfbf997eda082ae1',
  ]
  async run() {
    const res = this.parse(ValidatorRegister)
    const contract = await Validators(this.web3, res.flags.from)
    const tx = contract.methods.registerValidator(
      res.flags.id,
      res.flags.name,
      res.flags.url,
      res.flags.publicKey as any,
      res.flags.noticePeriod
    )
    await displaySendTx('registerValidator', tx)

    // register encryption key on attestations contract
    const msg = new Buffer('msg_data')
    const sig = await this.web3.eth.sign(res.flags.from, '0x' + msg.toString('hex'))
    const rawsig = ethjsutil.fromRpcSig(sig)

    const prefix = new Buffer('\x19Ethereum Signed Message:\n')
    const prefixedMsg = ethjsutil.sha3(Buffer.concat([prefix, new Buffer(String(msg.length)), msg]))
    const pubKey = ethjsutil.ecrecover(prefixedMsg, rawsig.v, rawsig.r, rawsig.s)
    const attestations = await Attestations(this.web3, res.flags.from)
    // @ts-ignore
    const setKeyTx = attestations.methods.setAccountDataEncryptionKey(pubKey)
    await sendTx(setKeyTx)
  }
}
