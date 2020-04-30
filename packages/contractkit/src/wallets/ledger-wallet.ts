import { CELO_DERIVATION_PATH_BASE } from '@celo/utils/lib/account'
import { TransportError, TransportStatusError } from '@ledgerhq/errors'
import Ledger from '@ledgerhq/hw-app-eth'
import debugFactory from 'debug'
import { Address } from '../base'
import { transportErrorFriendlyMessage } from '../utils/ledger-utils'
import { RemoteWallet } from './remote-wallet'
import { LedgerSigner } from './signers/ledger-signer'
import { Signer } from './signers/signer'
import { Wallet } from './wallet'

export const CELO_BASE_DERIVATION_PATH = CELO_DERIVATION_PATH_BASE.slice(2)
const ADDRESS_QTY = 5

// Validates an address using the Ledger
export enum AddressValidation {
  // Validates every address required only when the ledger is initialized
  initializationOnly,
  // Validates the address every time a transaction is made
  everyTransaction,
  // Validates the address the first time a transaction is made for that specific address
  firstTransactionPerAddress,
  // Never validates the addresses
  never,
}

export async function newLedgerWalletWithSetup(
  transport: any,
  derivationPathIndexes?: number[],
  baseDerivationPath?: string,
  ledgerAddressValidation?: AddressValidation
): Promise<LedgerWallet> {
  const wallet = new LedgerWallet(
    derivationPathIndexes,
    baseDerivationPath,
    transport,
    ledgerAddressValidation
  )
  await wallet.init()
  return wallet
}

const debug = debugFactory('kit:wallet:ledger')

export class LedgerWallet extends RemoteWallet implements Wallet {
  private ledger: any

  /**
   * @param derivationPathIndexes number array of "address_index" for the base derivation path.
   * Default: Array[0..9].
   * Example: [3, 99, 53] will retrieve the derivation paths of
   * [`${baseDerivationPath}/3`, `${baseDerivationPath}/99`, `${baseDerivationPath}/53`]
   * @param baseDerivationPath base derivation path. Default: "44'/52752'/0'/0"
   * @param transport Transport to connect the ledger device
   */
  constructor(
    readonly derivationPathIndexes: number[] = Array.from(Array(ADDRESS_QTY).keys()),
    readonly baseDerivationPath: string = CELO_BASE_DERIVATION_PATH,
    readonly transport: any = {},
    readonly ledgerAddressValidation: AddressValidation = AddressValidation.firstTransactionPerAddress
  ) {
    super()
    const invalidDPs = derivationPathIndexes.some(
      (value) => !(Number.isInteger(value) && value >= 0)
    )
    if (invalidDPs) {
      throw new Error('ledger-wallet: Invalid address index')
    }
  }

  protected async loadAccountSigners(): Promise<Map<Address, Signer>> {
    if (!this.ledger) {
      this.ledger = this.generateNewLedger(this.transport)
    }
    debug('Fetching addresses from the ledger')
    let addressToSigner = new Map<Address, Signer>()
    try {
      addressToSigner = await this.retrieveAccounts()
    } catch (error) {
      if (error instanceof TransportStatusError || error instanceof TransportError) {
        transportErrorFriendlyMessage(error)
      }
      throw error
    }
    return addressToSigner
  }

  // Extracted for testing purpose
  private generateNewLedger(transport: any) {
    return new Ledger(transport)
  }

  private async retrieveAccounts(): Promise<Map<Address, Signer>> {
    const addressToSigner = new Map<Address, Signer>()
    const appConfiguration = await this.retrieveAppConfiguration()
    const validationRequired = this.ledgerAddressValidation === AddressValidation.initializationOnly

    // Each address must be retrieved synchronously, (ledger lock)
    for (const value of this.derivationPathIndexes) {
      const derivationPath = `${this.baseDerivationPath}/${value}`
      const addressInfo = await this.ledger!.getAddress(derivationPath, validationRequired)
      addressToSigner.set(
        addressInfo.address,
        new LedgerSigner(
          this.ledger,
          derivationPath,
          this.ledgerAddressValidation,
          appConfiguration
        )
      )
    }
    return addressToSigner
  }

  private async retrieveAppConfiguration(): Promise<{
    arbitraryDataEnabled: number
    version: string
  }> {
    const appConfiguration = await this.ledger!.getAppConfiguration()
    if (!appConfiguration.arbitraryDataEnabled) {
      console.warn(
        'Beware, your ledger does not allow the use of contract data. Some features may not work correctly, including token transfers. You can enable it from the ledger app settings.'
      )
    }
    return appConfiguration
  }
}
