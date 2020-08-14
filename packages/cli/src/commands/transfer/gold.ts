import TransferCelo from './celo'

export default class TransferGold extends TransferCelo {
  static description =
    'Transfer CELO to a specified address. *DEPRECATION WARNING* Use the "transfer:celo" command instead'

  static flags = {
    ...TransferCelo.flags,
  }

  static examples = [
    'gold --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --value 10000000000000000000',
  ]
}
