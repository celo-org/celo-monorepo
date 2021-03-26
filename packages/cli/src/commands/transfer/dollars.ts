import { StableToken } from '@celo/contractkit'
import { TransferStableBase } from '../../transfer-stable-base'

export default class TransferDollars extends TransferStableBase {
  static description = 'Transfer Celo Dollars (cUSD) to a specified address.'

  static flags = {
    ...TransferStableBase.flags,
  }

  static examples = [
    'dollars --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --value 1000000000000000000',
  ]

  async init() {
    this._stableCurrency = StableToken.cUSD
    await super.init()
  }
}
