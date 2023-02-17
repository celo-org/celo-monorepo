import { Address, ReadOnlyWallet } from '@celo/connect'
import {
  bigNumberToBuffer,
  bufferToBigNumber,
  getAddressFromPublicKey,
  publicKeyFromAsn1,
  publicKeyPrefix,
  sixtyFour,
} from '@celo/wallet-hsm'
import { RemoteWallet } from '@celo/wallet-remote'
import { KeyManagementServiceClient } from '@google-cloud/kms'
import { BigNumber } from 'bignumber.js'
import { GcpHsmSigner } from './gcp-hsm-signer'

/**
 * A Cloud HSM wallet built on GCP.
 */
export class GcpHsmWallet extends RemoteWallet<GcpHsmSigner> implements ReadOnlyWallet {
  private client: KeyManagementServiceClient | undefined

  constructor(private readonly versionName: string) {
    super()
  }

  private generateKmsClient() {
    return new KeyManagementServiceClient()
  }

  protected async loadAccountSigners(): Promise<Map<Address, GcpHsmSigner>> {
    if (!this.client) {
      this.client = this.generateKmsClient()
    }
    const addressToSigner = new Map<Address, GcpHsmSigner>()
    try {
      const publicKey = await this.getPublicKeyFromVersionName(this.versionName)
      const address = getAddressFromPublicKey(publicKey)
      addressToSigner.set(address, new GcpHsmSigner(this.client, this.versionName, publicKey))
    } catch (e) {
      console.error('Error loading account', e)
      throw e
    }
    return addressToSigner
  }

  private async getPublicKeyFromVersionName(versionName: string): Promise<BigNumber> {
    if (!this.client) {
      throw new Error('GcpHsmWallet needs to be initialised first')
    }
    const [pk] = await this.client.getPublicKey({ name: versionName })
    if (!pk.pem) {
      throw new Error('PublicKey pem is not defined')
    }
    const derEncodedPk = this.pemToDerEncode(pk.pem)
    const pubKey = publicKeyFromAsn1(Buffer.from(derEncodedPk, 'base64'))
    const pkbuff = bigNumberToBuffer(pubKey, sixtyFour)
    const pubKeyPrefix = Buffer.from(new Uint8Array([publicKeyPrefix]))
    const rawPublicKey = Buffer.concat([pubKeyPrefix, pkbuff])
    return bufferToBigNumber(rawPublicKey)
  }

  /**
   * Converts key from PEM to DER encoding.
   *
   * DER (Distinguished Encoding Rules) is a binary encoding for X.509 certificates and private keys.
   * Unlike PEM, DER-encoded files do not contain plain text statements such as -----BEGIN CERTIFICATE-----
   *
   * https://www.ssl.com/guide/pem-der-crt-and-cer-x-509-encodings-and-conversions/#:~:text=DER%20(Distinguished%20Encoding%20Rules)%20is,commonly%20seen%20in%20Java%20contexts.
   */
  private pemToDerEncode(pem: string): string {
    return pem.split('\n').slice(1, -2).join('').trim()
  }

  /**
   * Returns the EVM address for the given key
   * Useful for initially getting the 'from' field given a keyName
   * @param versionName GCP version name for the HSM
   */
  async getAddressFromVersionName(versionName: string): Promise<Address> {
    const publicKey = await this.getPublicKeyFromVersionName(versionName)
    return getAddressFromPublicKey(publicKey)
  }
}
