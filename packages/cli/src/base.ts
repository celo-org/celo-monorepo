import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { Command, flags } from '@oclif/command'
import Web3 from 'web3'
import { getNodeUrl } from './utils/config'
import { injectDebugProvider } from './utils/eth-debug-provider'
import { requireNodeIsSynced } from './utils/helpers'

export abstract class BaseCommand extends Command {
  static flags = {
    logLevel: flags.string({ char: 'l', hidden: true }),
    help: flags.help({ char: 'h', hidden: true }),
  }

  // This specifies whether the node needs to be synced before the command
  // can be run. In most cases, this should be `true`, so that's the default.
  // For commands that don't require the node is synced, add the following line
  // to its definition:
  //   requireSynced = false
  public requireSynced: boolean = true

  private _web3: Web3 | null = null
  private _kit: ContractKit | null = null
  // This is required since we wrap the provider with a debug provider and
  // there is no way to unwrap the provider afterwards.
  // We need access to the original provider, so that, we can close it.
  private _originalProvider: any | null = null

  get web3() {
    if (!this._web3) {
      this._web3 = new Web3(getNodeUrl(this.config.configDir))
      this._originalProvider = this._web3.currentProvider
      injectDebugProvider(this._web3)
    }
    return this._web3
  }

  get kit() {
    if (!this._kit) {
      this._kit = newKitFromWeb3(this.web3)
    }
    return this._kit
  }

  async init() {
    if (this.requireSynced) {
      await requireNodeIsSynced(this.web3)
    }
  }

  // TODO(yorke): implement log(msg) switch on logLevel with chalk colored output
  log(msg: string, logLevel: string = 'info') {
    if (logLevel === 'info') {
      console.debug(msg)
    } else if (logLevel === 'error') {
      console.error(msg)
    }
  }

  finally(arg: Error | undefined): Promise<any> {
    try {
      // Close the web3 connection or the CLI hangs forever.
      if (this._originalProvider && this._originalProvider.hasOwnProperty('connection')) {
        const connection = this._originalProvider.connection
        if (connection.hasOwnProperty('_connection')) {
          connection._connection.close()
        }
      }
    } catch (error) {
      this.log(`Failed to close the connection: ${error}`)
    }

    return super.finally(arg)
  }
}
