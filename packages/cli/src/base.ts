import { ReadOnlyWallet } from '@celo/connect'
import { ContractKit, newKitFromWeb3, StableToken, Token } from '@celo/contractkit'
import { stableTokenInfos } from '@celo/contractkit/lib/celo-tokens'
import { AzureHSMWallet } from '@celo/wallet-hsm-azure'
import { AddressValidation, newLedgerWalletWithSetup } from '@celo/wallet-ledger'
import { LocalWallet } from '@celo/wallet-local'
import { Command, flags } from '@oclif/command'
import { ParserOutput } from '@oclif/parser/lib/parse'
import chalk from 'chalk'
import net from 'net'
import Web3 from 'web3'
import { getGasCurrency, getNodeUrl } from './utils/config'
import { enumEntriesDupWithLowercase, requireNodeIsSynced } from './utils/helpers'

export const gasOptions = {
  auto: 'auto',
  Auto: 'auto',
  ...enumEntriesDupWithLowercase(Object.entries(Token)),
  ...enumEntriesDupWithLowercase(Object.entries(StableToken)),
}

// tslint:disable-next-line:max-classes-per-file
export abstract class BaseCommand extends Command {
  static flags = {
    privateKey: flags.string({
      char: 'k',
      description: 'Use a private key to sign local transactions with',
      hidden: true,
    }),
    node: flags.string({
      char: 'n',
      description: "URL of the node to run commands against (defaults to 'http://localhost:8545')",
      hidden: true,
      parse: (nodeUrl) => {
        switch (nodeUrl) {
          case 'local':
          case 'localhost':
            return 'http://localhost:8545'
          case 'baklava':
            return 'https://baklava-forno.celo-testnet.org'
          case 'alfajores':
            return 'https://alfajores-forno.celo-testnet.org'
          case 'mainnet':
          case 'forno':
            return 'https://forno.celo.org'
          default:
            return nodeUrl
        }
      },
    }),
    gasCurrency: flags.enum({
      options: Object.keys(gasOptions),
      description:
        "Use a specific gas currency for transaction fees (defaults to 'auto' which uses whatever feeCurrency is available)",
      hidden: true,
    }),
    useLedger: flags.boolean({
      default: false,
      hidden: true,
      description: 'Set it to use a ledger wallet',
    }),
    ledgerAddresses: flags.integer({
      default: 1,
      hidden: true,
      exclusive: ['ledgerCustomAddresses'],
      description: 'If --useLedger is set, this will get the first N addresses for local signing',
    }),
    ledgerCustomAddresses: flags.string({
      default: '[0]',
      hidden: true,
      exclusive: ['ledgerAddresses'],
      description:
        'If --useLedger is set, this will get the array of index addresses for local signing. Example --ledgerCustomAddresses "[4,99]"',
    }),
    useAKV: flags.boolean({
      default: false,
      hidden: true,
      description: 'Set it to use an Azure KeyVault HSM',
    }),
    azureVaultName: flags.string({
      hidden: true,
      description: 'If --useAKV is set, this is used to connect to the Azure KeyVault',
    }),
    ledgerConfirmAddress: flags.boolean({
      default: false,
      hidden: true,
      description: 'Set it to ask confirmation for the address of the transaction from the ledger',
    }),
    globalHelp: flags.boolean({
      default: false,
      hidden: false,
      description: 'View all available global flags',
    }),
  }
  // This specifies whether the node needs to be synced before the command
  // can be run. In most cases, this should be `true`, so that's the default.
  // For commands that don't require the node is synced, add the following line
  // to its definition:
  //   requireSynced = false
  public requireSynced: boolean = true

  private _web3: Web3 | null = null
  private _kit: ContractKit | null = null
  private _wallet?: ReadOnlyWallet

  get web3() {
    if (!this._web3) {
      const res: ParserOutput<any, any> = this.parse()
      const nodeUrl = (res.flags && res.flags.node) || getNodeUrl(this.config.configDir)
      this._web3 =
        nodeUrl && nodeUrl.endsWith('.ipc')
          ? new Web3(new Web3.providers.IpcProvider(nodeUrl, net))
          : new Web3(nodeUrl)
    }
    return this._web3
  }

  async newWeb3() {
    const res: ParserOutput<any, any> = this.parse()
    const nodeUrl = (res.flags && res.flags.node) || getNodeUrl(this.config.configDir)
    return nodeUrl && nodeUrl.endsWith('.ipc')
      ? new Web3(new Web3.providers.IpcProvider(nodeUrl, net))
      : new Web3(nodeUrl)
  }

  get kit() {
    if (!this._kit) {
      this._kit = newKitFromWeb3(this.web3)
      this._kit.connection.wallet = this._wallet
    }

    const res: ParserOutput<any, any> = this.parse()
    if (res.flags && res.flags.privateKey && !res.flags.useLedger && !res.flags.useAKV) {
      this._kit.connection.addAccount(res.flags.privateKey)
    }
    return this._kit
  }

  async init() {
    if (this.requireSynced) {
      await requireNodeIsSynced(this.web3)
    }

    const res: ParserOutput<any, any> = this.parse()
    if (res.flags.globalHelp) {
      console.log(chalk.red.bold('GLOBAL OPTIONS'))
      Object.entries(BaseCommand.flags).forEach(([name, flag]) => {
        console.log(chalk.black(`  --${name}`).padEnd(40) + chalk.gray(`${flag.description}`))
      })
      process.exit(0)
    }

    if (res.flags.useLedger) {
      let transport: Transport
      try {
        // Importing for ledger uses only fixes running jest tests
        const TransportNodeHid = (await import('@ledgerhq/hw-transport-node-hid')).default
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
    } else if (res.flags.useAKV) {
      try {
        const akvWallet = new AzureHSMWallet(res.flags.azureVaultName)
        await akvWallet.init()
        console.log(`Found addresses: ${akvWallet.getAccounts()}`)
        this._wallet = akvWallet
      } catch (err) {
        console.log(`Failed to connect to AKV ${err}`)
        throw err
      }
    } else {
      this._wallet = new LocalWallet()
    }

    if (res.flags.from) {
      this.kit.defaultAccount = res.flags.from
    }

    const gasCurrencyConfig = res.flags.gasCurrency
      ? (gasOptions as any)[res.flags.gasCurrency]
      : getGasCurrency(this.config.configDir)

    const setStableTokenGas = async (stable: StableToken) => {
      await this.kit.setFeeCurrency(stableTokenInfos[stable].contract)
      await this.kit.updateGasPriceInConnectionLayer(
        await this.kit.registry.addressFor(stableTokenInfos[stable].contract)
      )
    }
    if (Object.keys(StableToken).includes(gasCurrencyConfig)) {
      await setStableTokenGas(StableToken[gasCurrencyConfig as keyof typeof StableToken])
    } else if (gasCurrencyConfig === gasOptions.auto && this.kit.defaultAccount) {
      const balances = await this.kit.getTotalBalance(this.kit.defaultAccount)
      if (balances.CELO!.isZero()) {
        const stables = Object.entries(StableToken)
        for (const stable of stables) {
          const stableName = stable[0]
          const stableToken = stable[1]
          // has balance
          if ((balances as any)[stableName] && !(balances as any)[stableName].isZero()) {
            await setStableTokenGas(stableToken)
            break
          }
        }
      }
    }
  }

  finally(arg: Error | undefined): Promise<any> {
    try {
      this.kit.connection.stop()
    } catch (error) {
      this.log(`Failed to close the connection: ${error}`)
    }

    return super.finally(arg)
  }
}
