import { Address, publicKeyToAddress } from '@celo/utils/lib/address'
import { KMS } from 'aws-sdk'
import { BigNumber } from 'bignumber.js'
import { publicKeyFromAsn1 } from '../utils/ber-utils'
import { bigNumberToBuffer } from '../utils/signature-utils'
import { RemoteWallet } from './remote-wallet'
import AwsHsmSigner from './signers/aws-hsm-signer'
import { Signer } from './signers/signer'
import { Wallet } from './wallet'

const defaultCredentials: KMS.ClientConfiguration = {
  region: 'eu-central-1',
  apiVersion: '2014-11-01',
}

export default class AwsHsmWallet extends RemoteWallet implements Wallet {
  private kms: KMS | undefined
  private credentials: KMS.ClientConfiguration

  constructor(awsCredentials?: KMS.ClientConfiguration) {
    super()
    this.credentials = awsCredentials || defaultCredentials
  }

  protected async loadAccountSigners(): Promise<Map<Address, Signer>> {
    if (!this.kms) {
      this.kms = this.generateKmsClient()
    }
    const { Keys } = await this.kms.listKeys().promise()
    const addressToSigner = new Map<Address, Signer>()
    for (const { KeyId } of Keys!) {
      try {
        const { KeyMetadata } = await this.kms.describeKey({ KeyId: KeyId! }).promise()
        if (!KeyMetadata?.Enabled) {
          continue
        }

        const publicKey = await this.getPublicKeyFromKeyId(KeyId!)
        addressToSigner.set(
          publicKeyToAddress(bigNumberToBuffer(publicKey, 64).toString('hex')),
          new AwsHsmSigner(this.kms, KeyId!, publicKey)
        )
      } catch (e) {
        // todo: what does the error look like here
        throw e
      }
    }
    return addressToSigner
  }

  private generateKmsClient() {
    return new KMS(this.credentials)
  }

  private async getPublicKeyFromKeyId(keyId: string): Promise<BigNumber> {
    if (!this.kms) {
      throw new Error('AwsHsmWallet needs to be initialised first')
    }
    const { PublicKey } = await this.kms.getPublicKey({ KeyId: keyId }).promise()
    return publicKeyFromAsn1(Buffer.from(PublicKey as Uint8Array))
  }

  public async getAddressFromKeyId(keyId: string): Promise<string> {
    const publicKey = await this.getPublicKeyFromKeyId(keyId)
    return publicKeyToAddress(bigNumberToBuffer(publicKey, 64).toString('hex'))
  }
}
