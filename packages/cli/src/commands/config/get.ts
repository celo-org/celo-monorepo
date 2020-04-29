import { LocalCommand } from '../../base'
import { printValueMap } from '../../utils/cli'
import { ConfigRetriever } from '../../utils/config'

export default class Get extends LocalCommand {
  static description = 'Output Celoclo cached configuration'

  static flags = {
    ...LocalCommand.flags,
  }

  async run() {
    printValueMap(new ConfigRetriever(this.config.configDir).getConfig())
  }
}
