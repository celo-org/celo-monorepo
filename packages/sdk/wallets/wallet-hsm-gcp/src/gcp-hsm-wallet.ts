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
    const derEncodedPk = pk.pem?.split('\n').slice(1, -2).join('').trim()
    // @ts-ignore
    const pubKey = publicKeyFromAsn1(Buffer.from(derEncodedPk, 'base64'))
    const pkbuff = bigNumberToBuffer(pubKey, sixtyFour)
    const pubKeyPrefix = Buffer.from(new Uint8Array([publicKeyPrefix]))
    const rawPublicKey = Buffer.concat([pubKeyPrefix, pkbuff])
    return bufferToBigNumber(rawPublicKey)
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
