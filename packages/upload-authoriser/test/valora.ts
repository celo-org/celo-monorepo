import { ensureLeading0x, eqAddress, Err, Ok, Result } from '@celo/base'
import { Address, ContractKit, newKit } from '@celo/contractkit'
import {
  FetchError,
  InvalidSignature,
  OffchainDataWrapper,
  OffchainErrors,
} from '@celo/contractkit/lib/identity/offchain-data-wrapper'
import {
  PrivateNameAccessor,
  PublicNameAccessor,
} from '@celo/contractkit/lib/identity/offchain/accessors/name'
import { buildEIP712TypedData, resolvePath } from '@celo/contractkit/lib/identity/offchain/utils'
import {
  privateKeyToPublicKey,
  publicKeyToAddress,
  toChecksumAddress,
} from '@celo/utils/lib/address'
import { recoverEIP712TypedDataSigner } from '@celo/utils/lib/signatureUtils'
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
const readerEncryptionKeyPrivate =
  '0x2ad897e057bf61f16fd5a9aa94632ef47bb3819bd5a51d4b8afd7cbededbc7ba'
const readerKit = newKit('https://alfajores-forno.celo-testnet.org')
readerKit.addAccount(readerPrivate)
readerKit.addAccount(readerEncryptionKeyPrivate)
readerKit.defaultAccount = readerAddress

const authorizerUrl = 'https://us-central1-celo-testnet.cloudfunctions.net/valora-upload-authorizer'

async function call(data: any, signature: string): Promise<SignedPostPolicyV4Output[]> {
  const response = await fetch(authorizerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Signature: signature,
    },
    body: JSON.stringify(data),
  })

  if (response.status >= 400) {
    throw new Error(await response.text())
  }

  return response.json()
}

const valoraMetadataUrl = 'https://storage.googleapis.com/celo-test-alexh-bucket'

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
    account: Address,
    dataPath: string,
    _checkOffchainSigners: boolean,
    type?: t.Type<DataType>
  ): Promise<Result<Buffer, OffchainErrors>> {
    let dataResponse, signatureResponse

    const accountRoot = `${valoraMetadataUrl}/${toChecksumAddress(account)}`
    try {
      ;[dataResponse, signatureResponse] = await Promise.all([
        fetch(resolvePath(accountRoot, dataPath)),
        fetch(resolvePath(accountRoot, `${dataPath}.signature`)),
      ])
    } catch (error) {
      return Err(new FetchError(error))
    }

    if (!dataResponse.ok) {
      return Err(new FetchError(new Error(dataResponse.statusText)))
    }
    if (!signatureResponse.ok) {
      return Err(new FetchError(new Error(signatureResponse.statusText)))
    }

    const [dataBody, signatureBody] = await Promise.all([
      dataResponse.arrayBuffer(),
      signatureResponse.arrayBuffer(),
    ])

    const body = Buffer.from(dataBody)
    const signature = ensureLeading0x(Buffer.from(signatureBody).toString('hex'))

    const toParse = type ? JSON.parse(body.toString()) : body
    const typedData = await buildEIP712TypedData(this, dataPath, toParse, type)
    const guessedSigner = recoverEIP712TypedDataSigner(typedData, signature)
    if (eqAddress(guessedSigner, account)) {
      return Ok(body)
    }

    return Err(new InvalidSignature())
  }
}

async function main() {
  const writerWrapper = new UploadServiceDataWrapper(writerKit)
  const readerWrapper = new UploadServiceDataWrapper(readerKit)

  const publicWriter = new PublicNameAccessor(writerWrapper)
  const privateWriter = new PrivateNameAccessor(writerWrapper)

  const publicReader = new PublicNameAccessor(readerWrapper)
  const privateReader = new PrivateNameAccessor(readerWrapper)

  const publicWriteError = await publicWriter.write({ name: 'Alex' })
  if (publicWriteError) {
    console.log('Public accessor failed to write', publicWriteError)
    return
  }

  const publicResult = await publicReader.readAsResult(writerAddress)
  if (!publicResult.ok) {
    console.log('Public failed', publicResult)
    return
  }
  console.log(publicResult.result)

  const privateWriteError = await privateWriter.write({ name: 'Alex' }, [readerAddress])
  if (privateWriteError) {
    console.log('Private accessor failed to write', privateWriteError)
    return
  }

  const privateResult = await privateReader.readAsResult(writerAddress)
  if (!privateResult.ok) {
    console.log('Private read failed', privateResult)
    return
  }
  console.log(privateResult.result)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.log(e)
    process.exit(1)
  })
