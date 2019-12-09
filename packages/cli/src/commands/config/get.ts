import { LocalCommand } from '../../base'
import { printValueMap } from '../../utils/cli'
import { readConfig } from '../../utils/config'

export default class Get extends LocalCommand {
  static description = 'Output network node configuration'

  static flags = {
    ...LocalCommand.flags,
  }

  async run() {
    printValueMap(readConfig(this.config.configDir))
  }
}
