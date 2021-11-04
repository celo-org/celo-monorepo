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
import { KMS } from 'aws-sdk'
import { BigNumber } from 'bignumber.js'
import debugFactory from 'debug'
import { AwsHsmSigner } from './aws-hsm-signer'

const debug = debugFactory('kit:wallet:aws-hsm-wallet')

const defaultCredentials: KMS.ClientConfiguration = {
  region: 'eu-central-1',
  apiVersion: '2014-11-01',
}

/**
 * A Cloud HSM wallet built on AWS KMS
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/KMS.html
 * When using the default credentials, it's expected to set the
 * aws_access_key_id and aws_secret_access_key in ~/.aws/credentials
 */
export class AwsHsmWallet extends RemoteWallet<AwsHsmSigner> implements ReadOnlyWallet {
  private kms: KMS | undefined
  private credentials: KMS.ClientConfiguration

  constructor(awsCredentials?: KMS.ClientConfiguration) {
    super()
    this.credentials = awsCredentials || defaultCredentials
  }

  protected async loadAccountSigners(): Promise<Map<Address, AwsHsmSigner>> {
    if (!this.kms) {
      this.kms = this.generateKmsClient()
    }
    const { Keys } = await this.kms.listKeys().promise()
    const addressToSigner = new Map<Address, AwsHsmSigner>()
    for (const { KeyId } of Keys!) {
      if (!KeyId) {
        throw new Error(`Missing KeyId in KMS response object ${Keys!}`)
      }
      try {
        const { KeyMetadata } = await this.kms.describeKey({ KeyId }).promise()
        if (!KeyMetadata?.Enabled) {
          continue
        }

        const publicKey = await this.getPublicKeyFromKeyId(KeyId)
        const address = getAddressFromPublicKey(publicKey)
        addressToSigner.set(address, new AwsHsmSigner(this.kms, KeyId, publicKey))
      } catch (e: any) {
        // Safely ignore non-secp256k1 keys
        if (e.name === 'UnsupportedOperationException') {
          debug(`Ignoring non-secp256k1 key ${KeyId}`)
        } else if (e.name === 'AccessDeniedException') {
          debug(`Ignoring key that user does not have DescribeKey access for: ${KeyId}`)
        } else {
          throw e
        }
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
    const pubKey = publicKeyFromAsn1(Buffer.from(PublicKey as Uint8Array))
    const pkbuff = bigNumberToBuffer(pubKey, sixtyFour)
    const pubKeyPrefix = Buffer.from(new Uint8Array([publicKeyPrefix]))
    const rawPublicKey = Buffer.concat([pubKeyPrefix, pkbuff])
    return bufferToBigNumber(rawPublicKey)
  }

  /**
   * Returns the EVM address for the given key
   * Useful for initially getting the 'from' field given a keyName
   * @param keyName Azure KeyVault key name
   */
  async getAddressFromKeyId(keyId: string): Promise<Address> {
    const publicKey = await this.getPublicKeyFromKeyId(keyId)
    return getAddressFromPublicKey(publicKey)
  }
}
