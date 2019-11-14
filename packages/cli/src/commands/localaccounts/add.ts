import { cli } from 'cli-ux'
import * as fs from 'fs-extra'
// import * as path from 'path'
import { BaseCommand } from '../../base'
import { addPrivateKeyToConfig } from '../../utils/local_accounts'

export default class AddLocalAccount extends BaseCommand {
  static description = 'Add a private key to locally sign transactions from an account'

  static args = [
    {
      name: 'keyPath',
      required: true,
      description: 'Private key to add',
    },
  ]

  async run() {
    const res = this.parse(AddLocalAccount)
    try {
      const absolutePath = fs.realpathSync(res.args.keyPath)
      const key = fs.readFileSync(absolutePath).toString()
      this.kit.addAccount(key)

      addPrivateKeyToConfig(this.config.configDir, absolutePath)
    } catch (error) {
      cli.info('Failed to add private key')
      cli.error(error)
    }
  }
}
