import { ensureLeading0x, trimLeading0x } from '@celo/utils/lib/address'
import { TransportStatusError } from '@ledgerhq/errors'
import debugFactory from 'debug'
import * as ethUtil from 'ethereumjs-util'
import { transportErrorFriendlyMessage } from '../../utils/ledger-utils'
import { EIP712TypedData, generateTypedDataHash } from '../../utils/sign-typed-data-utils'
import { RLPEncodedTx } from '../../utils/signing-utils'
import { compareLedgerAppVersions, tokenInfoByAddressAndChainId } from '../ledger-utils/tokens'
import { AddressValidation } from '../ledger-wallet'
import { Signer } from './signer'

const debug = debugFactory('kit:wallet:ledger')
const CELO_APP_ACCEPTS_CONTRACT_DATA_FROM_VERSION = '1.0.2'

/**
 * Signs the EVM transaction with a Ledger device
 */
export class LedgerSigner implements Signer {
  private ledger: any
  private derivationPath: string
  private validated: boolean = false
  private ledgerAddressValidation: AddressValidation
  private appConfiguration: { arbitraryDataEnabled: number; version: string }

  constructor(
    ledger: any,
    derivationPath: string,
    ledgerAddressValidation: AddressValidation,
    appConfiguration: { arbitraryDataEnabled: number; version: string } = {
      arbitraryDataEnabled: 0,
      version: '0.0.0',
    }
  ) {
    this.ledger = ledger
    this.derivationPath = derivationPath
    this.ledgerAddressValidation = ledgerAddressValidation
    this.appConfiguration = appConfiguration
  }

  getNativeKey(): string {
    return this.derivationPath
  }

  async signTransaction(
    addToV: number,
    encodedTx: RLPEncodedTx
  ): Promise<{ v: number; r: Buffer; s: Buffer }> {
    try {
      const validatedDerivationPath = await this.getValidatedDerivationPath()
      await this.checkForKnownToken(encodedTx)
      const signature = await this.ledger!.signTransaction(
        validatedDerivationPath,
        trimLeading0x(encodedTx.rlpEncode) // the ledger requires the rlpEncode without the leading 0x
      )
      // EIP155 support. check/recalc signature v value.
      const rv = parseInt(signature.v, 16)
      // tslint:disable-next-line: no-bitwise
      if (rv !== addToV && (rv & addToV) !== rv) {
        addToV += 1 // add signature v bit.
      }
      signature.v = addToV.toString(10)
      return {
        v: signature.v,
        r: ethUtil.toBuffer(ensureLeading0x(signature.r)) as Buffer,
        s: ethUtil.toBuffer(ensureLeading0x(signature.s)) as Buffer,
      }
    } catch (error) {
      if (error instanceof TransportStatusError) {
        // The Ledger fails if it doesn't know the feeCurrency
        if (error.statusCode === 27264 && error.statusText === 'INCORRECT_DATA') {
          debug('Possible invalid feeCurrency field')
          throw new Error(
            'ledger-signer@singTransaction: Incorrect Data. Verify that the feeCurrency is a valid one'
          )
        } else {
          transportErrorFriendlyMessage(error)
        }
      }
      throw error
    }
  }

  async signPersonalMessage(data: string): Promise<{ v: number; r: Buffer; s: Buffer }> {
    try {
      // Ledger's signPersonalMessage adds the 'Ethereum' header
      const signature = await this.ledger!.signPersonalMessage(
        await this.getValidatedDerivationPath(),
        trimLeading0x(data)
      )

      return {
        v: signature.v,
        r: ethUtil.toBuffer(ensureLeading0x(signature.r)) as Buffer,
        s: ethUtil.toBuffer(ensureLeading0x(signature.s)) as Buffer,
      }
    } catch (error) {
      if (error instanceof TransportStatusError) {
        transportErrorFriendlyMessage(error)
      }
      throw error
    }
  }

  async signTypedData(typedData: EIP712TypedData): Promise<{ v: number; r: Buffer; s: Buffer }> {
    try {
      const dataBuff = generateTypedDataHash(typedData)
      const trimmedData = trimLeading0x(dataBuff.toString('hex'))
      const sig = await this.ledger!.signPersonalMessage(
        await this.getValidatedDerivationPath(),
        trimmedData
      )

      return {
        v: parseInt(sig.v, 10),
        r: ethUtil.toBuffer(ensureLeading0x(sig.r)) as Buffer,
        s: ethUtil.toBuffer(ensureLeading0x(sig.s)) as Buffer,
      }
    } catch (error) {
      if (error instanceof TransportStatusError) {
        transportErrorFriendlyMessage(error)
      }
      throw error
    }
  }

  private async getValidatedDerivationPath(): Promise<string> {
    if (this.validationRequired()) {
      await this.ledger!.getAddress(this.derivationPath, true)
      this.validated = true
    }
    return this.derivationPath
  }

  private validationRequired(): boolean {
    switch (this.ledgerAddressValidation) {
      case AddressValidation.never: {
        return false
      }
      case AddressValidation.everyTransaction: {
        return true
      }
      case AddressValidation.firstTransactionPerAddress: {
        return !this.validated
      }
      case AddressValidation.initializationOnly: {
        // Already initialized, so no need to validate in this state
        return false
      }
      default: {
        throw new Error('ledger-signer@validationRequired: invalid ledgerValidation value')
      }
    }
  }

  /**
   * Display ERC20 info on ledger if contract is well known
   * @param rlpEncoded Encoded transaction
   */
  private async checkForKnownToken(rlpEncoded: RLPEncodedTx) {
    if (
      compareLedgerAppVersions(
        this.appConfiguration.version,
        CELO_APP_ACCEPTS_CONTRACT_DATA_FROM_VERSION
      ) >= 0
    ) {
      const tokenInfo = tokenInfoByAddressAndChainId(
        rlpEncoded.transaction.to!,
        rlpEncoded.transaction.chainId!
      )
      if (tokenInfo) {
        await this.ledger!.provideERC20TokenInformation(tokenInfo)
      }
      if (rlpEncoded.transaction.feeCurrency && rlpEncoded.transaction.feeCurrency !== '0x') {
        const feeTokenInfo = tokenInfoByAddressAndChainId(
          rlpEncoded.transaction.feeCurrency!,
          rlpEncoded.transaction.chainId!
        )
        if (feeTokenInfo) {
          await this.ledger!.provideERC20TokenInformation(feeTokenInfo)
        }
      }
    }
  }
}
