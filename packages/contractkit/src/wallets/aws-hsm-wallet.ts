import { Address } from '@celo/utils/lib/address'
import { KMS } from 'aws-sdk'
import { addressFromAsn1 } from '../utils/ber-utils'
import { RemoteWallet } from './remote-wallet'
import AwsHsmSigner from './signers/aws-hsm-signer'
import { Signer } from './signers/signer'
import { Wallet } from './wallet'

export default class AwsHsmWallet extends RemoteWallet implements Wallet {
  private kms: KMS | undefined

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

        const address = await this.getAddressFromKeyId(KeyId!)
        addressToSigner.set(address, new AwsHsmSigner(this.kms, KeyId!, address))
      } catch (e) {
        // todo: what does the error look like here
        throw e
      }
    }
    return addressToSigner
  }

  private generateKmsClient() {
    return new KMS({ region: 'eu-central-1', apiVersion: '2014-11-01' })
  }

  public async getAddressFromKeyId(keyId: string): Promise<string> {
    if (!this.kms) {
      throw new Error('AwsHsmWallet needs to be initialised first')
    }
    const { PublicKey } = await this.kms.getPublicKey({ KeyId: keyId }).promise()
    return addressFromAsn1(PublicKey as Buffer)
  }
}
