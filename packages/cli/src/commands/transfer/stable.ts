import { StableToken } from '@celo/contractkit'
import { flags } from '@oclif/command'
import { TransferStableBaseDollars } from '../../transfer-stable-base'

export default class TransferStable extends TransferStableBaseDollars {
  static description = 'Transfer a stable token to a specified address.'

  static flags = {
    ...TransferStableBaseDollars.flags,
    stable: flags.enum({
      options: Object.keys(StableToken),
      description: 'Name of the stable to be transfered',
    }),
  }

  static examples = [
    'stable --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --value 1000000000000000000',
  ]

  async init() {
    const res = this.parse(TransferStable)
    const stableName = res.flags.stable
    this._stableCurrency = StableToken[stableName as keyof typeof StableToken]
    await super.init()
  }
}
