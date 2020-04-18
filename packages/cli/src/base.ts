import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { CeloProvider } from '@celo/contractkit/lib/providers/celo-provider'
import {
  AddressValidation,
  newLedgerWalletWithSetup,
} from '@celo/contractkit/lib/wallets/ledger-wallet'
import { Wallet } from '@celo/contractkit/lib/wallets/wallet'
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
import { Command, flags } from '@oclif/command'
import { ParserOutput } from '@oclif/parser/lib/parse'
import Web3 from 'web3'
import { getNodeUrl } from './utils/config'
import { requireNodeIsSynced } from './utils/helpers'

// Base for commands that do not need web3.
export abstract class LocalCommand extends Command {
  static flags = {
    logLevel: flags.string({ char: 'l', hidden: true }),
    help: flags.help({ char: 'h', hidden: true }),
    truncate: flags.boolean({
      default: true,
      hidden: true,
      allowNo: true,
      description: 'Truncate fields to fit line',
    }),
  }

  // TODO(yorke): implement log(msg) switch on logLevel with chalk colored output
  log(msg: string, logLevel: string = 'info') {
    if (logLevel === 'info') {
      console.debug(msg)
    } else if (logLevel === 'error') {
      console.error(msg)
    }
  }
}

// tslint:disable-next-line:max-classes-per-file
export abstract class BaseCommand extends LocalCommand {
  static flags = {
    ...LocalCommand.flags,
    privateKey: flags.string({ hidden: true }),
    node: flags.string({ char: 'n', hidden: true }),
    useLedger: flags.boolean({
      default: false,
      hidden: false,
      description: 'Set it to use a ledger wallet',
    }),
    ledgerAddresses: flags.integer({
      default: 1,
      hidden: false,
      exclusive: ['ledgerCustomAddresses'],
      description: 'If --userLedger is set, this will get the first N addresses for local signing',
    }),
    ledgerCustomAddresses: flags.string({
      default: '[0]',
      hidden: false,
      exclusive: ['ledgerAddresses'],
      description:
        'If --userLedger is set, this will get the array of index addresses for local signing. Example --ledgerCustomAddresses "[4,99]"',
    }),
    ledgerConfirmAddress: flags.boolean({
      default: false,
      hidden: false,
      description: 'Set it to ask confirmation for the address of the transaction from the ledger',
    }),
  }

  static flagsWithoutLocalAddresses() {
    return {
      ...BaseCommand.flags,
      privateKey: flags.string({ hidden: true }),
      useLedger: flags.boolean({ hidden: true }),
      ledgerAddresses: flags.integer({ hidden: true }),
      ledgerCustomAddresses: flags.string({ hidden: true }),
      ledgerConfirmAddress: flags.boolean({ hidden: true }),
    }
  }
  // This specifies whether the node needs to be synced before the command
  // can be run. In most cases, this should be `true`, so that's the default.
  // For commands that don't require the node is synced, add the following line
  // to its definition:
  //   requireSynced = false
  public requireSynced: boolean = true

  private _web3: Web3 | null = null
  private _kit: ContractKit | null = null
  private _wallet?: Wallet

  // This is required since we wrap the provider with a debug provider and
  // there is no way to unwrap the provider afterwards.
  // We need access to the original provider, so that, we can close it.
  private _originalProvider: any | null = null

  get web3() {
    if (!this._web3) {
      const res: ParserOutput<any, any> = this.parse()
      const nodeUrl = (res.flags && res.flags.node) || getNodeUrl(this.config.configDir)
      this._web3 = new Web3(nodeUrl)
      this._originalProvider = this._web3.currentProvider
    }
    return this._web3
  }

  get kit() {
    if (!this._kit) {
      this._kit = newKitFromWeb3(this.web3, this._wallet)
    }

    const res: ParserOutput<any, any> = this.parse()
    if (res.flags && res.flags.privateKey && !res.flags.useLedger) {
      this._kit.addAccount(res.flags.privateKey)
    }
    return this._kit
  }

  async init() {
    if (this.requireSynced) {
      await requireNodeIsSynced(this.web3)
    }
    const res: ParserOutput<any, any> = this.parse()
    if (res.flags.useLedger) {
      let transport: Transport
      try {
        transport = await TransportNodeHid.open('')
        const derivationPathIndexes = res.raw.some(
          (value) => (value as any).flag === 'ledgerCustomAddresses'
        )
          ? JSON.parse(res.flags.ledgerCustomAddresses)
          : Array.from(Array(res.flags.ledgerAddresses).keys())

        console.log('Retrieving derivation Paths', derivationPathIndexes)
        let ledgerConfirmation = AddressValidation.never
        if (res.flags.ledgerConfirmAddress) {
          ledgerConfirmation = AddressValidation.everyTransaction
        }
        this._wallet = await newLedgerWalletWithSetup(
          transport,
          derivationPathIndexes,
          undefined,
          ledgerConfirmation
        )
      } catch (err) {
        console.log('Check if the ledger is connected and logged.')
        throw err
      }
    }
  }

  finally(arg: Error | undefined): Promise<any> {
    try {
      // If local-signing accounts are added, the debug wrapper is itself wrapped
      // with a CeloProvider. This class has a stop() function that handles closing
      // the connection for underlying providers
      if (this.web3.currentProvider instanceof CeloProvider) {
        const celoProvider = this.web3.currentProvider as CeloProvider
        celoProvider.stop()
      }

      if (this._originalProvider && this._originalProvider.hasOwnProperty('connection')) {
        // Close the web3 connection or the CLI hangs forever.
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
