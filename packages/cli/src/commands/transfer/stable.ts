import { StableToken } from '@celo/contractkit'
import { flags } from '@oclif/command'
import { TransferStableBase } from '../../transfer-stable-base'

export default class TransferStable extends TransferStableBase {
  static description = 'Transfer a stable token to a specified address.'

  static flags = {
    ...TransferStableBase.flags,
    stableToken: flags.enum({
      options: Object.keys(StableToken),
      description: 'Name of the stable to be transfered',
    }),
  }

  static examples = [
    'stable --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --value 1000000000000000000 --stableToken cUSD',
  ]

  async init() {
    const res = this.parse(TransferStable)
    const stableName = res.flags.stableToken
    this._stableCurrency = StableToken[stableName as keyof typeof StableToken]
    await super.init()
  }
}
