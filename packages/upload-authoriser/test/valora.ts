import { ensureLeading0x, Ok, Result } from '@celo/base'
import { Address, ContractKit, newKit } from '@celo/contractkit'
import {
  OffchainDataWrapper,
  OffchainErrors,
} from '@celo/contractkit/lib/identity/offchain-data-wrapper'
import {
  PrivateNameAccessor,
  PublicNameAccessor,
} from '@celo/contractkit/lib/identity/offchain/accessors/name'
import { privateKeyToPublicKey, publicKeyToAddress } from '@celo/utils/lib/address'
import { SignedPostPolicyV4Output } from '@google-cloud/storage'
import FormData from 'form-data'
import * as t from 'io-ts'
import fetch from 'node-fetch'

const writerPrivate = '0xdcef435698f5d070035071541c14440fde752ea847d863d88418218f93ad5a1a'
const writerPublic = privateKeyToPublicKey(writerPrivate)
const writerAddress = publicKeyToAddress(writerPublic)
const writerEncryptionKeyPrivate =
  '0xc029c933337a6a1b08fc75c56dfba605bfbece471c356923ef79056c5f0a2e81'
const writerKit = newKit('https://alfajores-forno.celo-testnet.org')
writerKit.addAccount(writerPrivate)
writerKit.addAccount(writerEncryptionKeyPrivate)
writerKit.defaultAccount = writerAddress

const readerPrivate = '0xfb90684bb1b8c11ec0cc95725985207f99a6813d6335012befd1495bd0ff9535'
const readerPublic = privateKeyToPublicKey(readerPrivate)
const readerAddress = publicKeyToAddress(readerPublic)

async function call(data: any, signature: string): Promise<SignedPostPolicyV4Output[]> {
  const { result } = await fetch('http://localhost:5001/celo-testnet/us-central1/authorize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Signature: signature,
    },
    body: JSON.stringify({ data }),
  }).then((x) => x.json())

  return result as SignedPostPolicyV4Output[]
}

class UploadServiceDataWrapper implements OffchainDataWrapper {
  signer: Address
  self: Address

  constructor(readonly kit: ContractKit) {
    this.signer = this.self = kit.defaultAccount!
  }

  async writeDataTo(
    data: Buffer,
    signature: Buffer,
    dataPath: string
  ): Promise<OffchainErrors | void> {
    const dataPayloads = [data, signature]
    const signedUrlsPayload = [
      {
        path: dataPath,
      },
      {
        path: `${dataPath}.signature`,
      },
    ]

    const hexPayload = ensureLeading0x(
      Buffer.from(JSON.stringify(signedUrlsPayload)).toString('hex')
    )
    const authorization = await this.kit.getWallet().signPersonalMessage(this.signer, hexPayload)
    const signedUrls = await call(signedUrlsPayload, authorization)

    await Promise.all(
      signedUrls.map(({ url, fields }, i) => {
        const formData = new FormData()
        for (const name of Object.keys(fields)) {
          formData.append(name, fields[name])
        }
        formData.append('file', dataPayloads[i])

        return fetch(url, {
          method: 'POST',
          headers: {
            enctype: 'multipart/form-data',
          },
          // @ts-ignore
          body: formData,
        }).then((x) => x.text())
      })
    )
  }

  async readDataFromAsResult<DataType>(
    _account: Address,
    _dataPath: string,
    _checkOffchainSigners: boolean,
    _type?: t.Type<DataType>
  ): Promise<Result<Buffer, OffchainErrors>> {
    throw new Error('Not implemented')
    return Ok(Buffer.from([]))
  }
}

async function main() {
  const offchainWrapper = new UploadServiceDataWrapper(writerKit)
  const publicWriter = new PublicNameAccessor(offchainWrapper)
  const privateWriter = new PrivateNameAccessor(offchainWrapper)

  const publicWriteError = await publicWriter.write({ name: 'Alex ' })
  if (publicWriteError) {
    console.log('Public accessor failed to write', publicWriteError)
    return
  }

  const privateWriteError = await privateWriter.write({ name: 'Alex ' }, [readerAddress])
  if (privateWriteError) {
    console.log('Public accessor failed to write', privateWriteError)
    return
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.log(e)
    process.exit(1)
  })
