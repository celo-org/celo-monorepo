import { Address, publicKeyToAddress } from '@celo/utils/lib/address'
import * as asn1 from 'asn1js'
import { KMS } from 'aws-sdk'
import { RemoteWallet } from './remote-wallet'
import AwsHsmSigner from './signers/aws-hsm-signer'
import { Signer } from './signers/signer'
import { Wallet } from './wallet'

const kms = new KMS({ region: 'eu-central-1', apiVersion: '2014-11-01' })

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  const ab = new ArrayBuffer(buffer.length)
  const view = new Uint8Array(ab)
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i]
  }
  return ab
}

export default class AwsHsmWallet extends RemoteWallet implements Wallet {
  constructor() {
    super()
  }

  protected async loadAccountSigners(): Promise<Map<Address, Signer>> {
    const { Keys } = await kms.listKeys().promise()
    const addressToSigner = new Map<Address, Signer>()
    for (const { KeyId } of Keys!) {
      try {
        const { KeyMetadata } = await kms.describeKey({ KeyId: KeyId! }).promise()
        if (!KeyMetadata?.Enabled) {
          continue
        }
        const address = await this.getAddressFromKeyId(KeyId!)
        addressToSigner.set(address, new AwsHsmSigner(KeyId!))
      } catch (e) {
        // todo: what does the error look like here
        throw e
      }
    }
    return addressToSigner
  }

  async getAddressFromKeyId(keyId: string): Promise<Address> {
    const { PublicKey } = await kms.getPublicKey({ KeyId: keyId }).promise()
    const { result } = asn1.fromBER(toArrayBuffer(PublicKey as Buffer))
    const values = (result as asn1.Sequence).valueBlock.value
    const value = values[1] as asn1.BitString
    const newPublicKey = Buffer.from(value.valueBlock.valueHex.slice(1))
    return publicKeyToAddress(newPublicKey.toString('hex'))
  }
}
