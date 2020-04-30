import { LocalCommand } from '../../base'
import { ConfigRetriever } from '../../utils/config'

export default class Reset extends LocalCommand {
  static description = 'Resets the cached Celocli data for propogating transactions to network'

  static flags = {
    ...LocalCommand.flags,
  }

  static examples = ['reset']

  async run() {
    new ConfigRetriever(this.config.configDir).resetConfig()
  }
}
