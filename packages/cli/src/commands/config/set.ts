import { flags } from '@oclif/command'
import { BaseCommand, LocalCommand } from '../../base'
import { failWith, printValueMap } from '../../utils/cli'
import { CeloConfig, ConfigRetriever, defaultCeloConfig } from '../../utils/config'

export default class Set extends LocalCommand {
  static description = 'Configure running node information for propogating transactions to network'

  static flags = {
    ...BaseCommand.flags,
    // Overrides base command node flag.
    node: flags.string({
      char: 'n',
      description: 'URL of the node to run commands against',
      default: 'http://localhost:8545',
    }),
    privateKey: flags.string({
      description:
        'Set to use a specific privateKey. Beware this privateKey will be stored on disk.',
    }),
    add: flags.boolean({
      default: false,
      description:
        'If --add flag is set, it will add the configurations to the already saved cache. Otherwise will replace the old cache',
    }),
  }

  static examples = [
    'set  --node ws://localhost:2500',
    'set  --node <geth-location>/geth.ipc',
    'set  --node https://somehost.com  --useLedger',
    'set  --useLedger  --ledgerCustomAddress "[0, 47, 99]"  --add',
    'set  --node ws://localhost:2500  --useLedger  --ledgerAddresses 3 --ledgerConfirmAddress',
    'set  --useAKV  --azureVaultName some-vault',
  ]

  async run() {
    const res = this.parse(Set)
    const configRetriever: ConfigRetriever = new ConfigRetriever(this.config.configDir)
    const celoConfig = res.flags.add ? configRetriever.getConfig() : { ...defaultCeloConfig }
    res.raw
      .map((v) => (v as any).flag)
      .filter((v) => v !== 'add')
      .forEach((v) => ((celoConfig as any)[v] = (res.flags as any)[v]))
    const errors = validateConfig(celoConfig)
    if (!errors) {
      configRetriever.writeConfig(celoConfig)
      console.log('Configuration saved!')
      printValueMap(celoConfig)
    } else {
      failWith(`${errors} There was a configuration incompatibility. No changes were saved`)
    }
  }
}

function validateConfig(celoConfig: CeloConfig): string | undefined {
  let counter = celoConfig.useLedger ? 1 : 0
  counter = celoConfig.useAKV ? counter + 1 : counter
  counter = celoConfig.privateKey ? counter + 1 : counter
  if (counter > 1) {
    return "Can't have two or more of these flags stored: '--useLedger', '--useAKV' or '--privateKey'."
  }
  if (
    (celoConfig.ledgerAddresses ||
      celoConfig.ledgerCustomAddresses ||
      celoConfig.ledgerConfirmAddress) &&
    !celoConfig.useLedger
  ) {
    console.log(
      "You will need to use the '--useLedger' flag in your transactions, to use the Ledger flags that you set. You could also store the '--useLedger' flag to your configuration"
    )
  }
  if (celoConfig.azureVaultName && !celoConfig.useAKV) {
    console.log(
      "You will need to use the '--useAKV' flag in your transactions, to use the Azure flags that you set. You could also store the '--useAKV' flag to your configuration"
    )
  }
  return
}
