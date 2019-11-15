import { flags } from '@oclif/command'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import { Flags } from '../../utils/command'

export default class Unlock extends BaseCommand {
  static description = 'Unlock an account address to send transactions or validate blocks'

  static flags = {
    ...BaseCommand.flags,
    account: Flags.address({ required: true }),
    password: flags.string({ required: false }),
  }

  static examples = ['unlock --account 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const res = this.parse(Unlock)
    // Unlock till geth exits
    // Source: https://github.com/ethereum/go-ethereum/wiki/Management-APIs#personal_unlockaccount
    const unlockDurationInMs = 0
    const password = res.flags.password || (await cli.prompt('Password', { type: 'hide' }))

    this.web3.eth.personal.unlockAccount(res.flags.account, password, unlockDurationInMs)
  }
}
