import { TransportError, TransportStatusError } from '@ledgerhq/errors'
import Ledger from '@ledgerhq/hw-app-eth'
import debugFactory from 'debug'
import { Address } from '../base'
import { Wallet } from './wallet'
import { RemoteWallet } from './remote-wallet'
import { Signer } from './signers/signer'
import { LedgerSigner } from './signers/ledger-signer'
import { transportErrorFriendlyMessage } from '../utils/ledger-utils'

export const CELO_BASE_DERIVATION_PATH = "44'/52752'/0'/0"
const ADDRESS_QTY = 5

export async function newLedgerWalletWithSetup(
  transport: any,
  derivationPathIndexes?: number[],
  baseDerivationPath?: string
): Promise<LedgerWallet> {
  const wallet = new LedgerWallet(derivationPathIndexes, baseDerivationPath, transport)
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
    readonly transport: any = {}
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

    // Each address must be retrieved synchronously, (ledger lock)
    for (const value of this.derivationPathIndexes) {
      const derivationPath = `${this.baseDerivationPath}/${value}`
      const addressInfo = await this.ledger!.getAddress(derivationPath)
      addressToSigner.set(addressInfo.address, new LedgerSigner(this.ledger, derivationPath))
    }
    return addressToSigner
  }
}
