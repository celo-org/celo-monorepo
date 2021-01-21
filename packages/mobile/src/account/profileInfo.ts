import { ensureLeading0x, eqAddress, Err, normalizeAddressWith0x, Ok, Result } from '@celo/base'
import { Address, ContractKit } from '@celo/contractkit'
import {
  FetchError,
  InvalidSignature,
  OffchainDataWrapper,
  OffchainErrors,
} from '@celo/identity/lib/offchain-data-wrapper'
import { PrivateNameAccessor } from '@celo/identity/lib/offchain/accessors/name'
import { PrivatePictureAccessor } from '@celo/identity/lib/offchain/accessors/pictures'
import { buildEIP712TypedData, resolvePath } from '@celo/identity/lib/offchain/utils'
import { privateKeyToAddress, toChecksumAddress } from '@celo/utils/lib/address'
import { recoverEIP712TypedDataSigner } from '@celo/utils/lib/signatureUtils'
import { UnlockableWallet } from '@celo/wallet-base'
import { SignedPostPolicyV4Output } from '@google-cloud/storage'
// Use targetted import otherwise the RN FormData gets used which doesn't support Buffer related functionality
import FormData from 'form-data/lib/form_data'
import * as t from 'io-ts'
import RNFS from 'react-native-fs'
import { call, put, select } from 'redux-saga/effects'
import { profileUploaded } from 'src/account/actions'
import { isProfileUploadedSelector, nameSelector, pictureSelector } from 'src/account/selectors'
import { extensionToMimeType, getDataURL, saveRecipientPicture } from 'src/utils/image'
import Logger from 'src/utils/Logger'
import { getContractKit, getWallet } from 'src/web3/contracts'
import { currentAccountSelector, dataEncryptionKeySelector } from 'src/web3/selectors'
const TAG = 'account/profileInfo'

const authorizerUrl = 'https://kel03d4ef0.execute-api.eu-west-1.amazonaws.com/dev/authorize'
const valoraMetadataUrl = 'https://d2uaxwjh0f8rcm.cloudfront.net'

async function makeCall(data: any, signature: string): Promise<SignedPostPolicyV4Output[]> {
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

// Workaround fetch response.arrayBuffer() not working in RN environment
// See https://github.com/facebook/react-native/blob/f96478778cc00da8c11da17f9591dbdf928e7437/Libraries/Blob/FileReader.js#L85
async function responseBuffer(response: Response) {
  const blob = await response.blob()
  return blobToBuffer(blob)
}

// Hacky way to get Buffer from Blob
// Note: this is gonna transfer the whole data over the RN bridge (as base64 encoded string)
// and should be avoided for large files!
function blobToBuffer(blob: Blob) {
  const reader = new FileReader()
  reader.readAsDataURL(blob)
  return new Promise<Buffer>((resolve, reject) => {
    reader.onerror = () => {
      reject(reader.error)
    }
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Unexpected result type'))
      } else {
        // Result looks like "data:application/octet-stream;base64,BLMHTkM..."
        // Extract the base64 part
        const base64 = result.substr(result.lastIndexOf(',') + 1)
        resolve(Buffer.from(base64, 'base64'))
      }
    }
  })
}

class UploadServiceDataWrapper implements OffchainDataWrapper {
  signer: Address
  self: Address

  constructor(readonly kit: ContractKit, address: Address) {
    this.signer = this.self = address
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
    const signedUrls = await makeCall(signedUrlsPayload, authorization)
    await Promise.all(
      signedUrls.map(({ url, fields }, i) => {
        const formData = new FormData()
        for (const name of Object.keys(fields)) {
          formData.append(name, fields[name])
        }
        formData.append('file', dataPayloads[i])

        return fetch(url, {
          method: 'POST',
          headers: formData.getHeaders(),
          // Use getBuffer() which ends up transferring the body as base64 data over the RN bridge
          // because RN doesn't support Buffer inside FormData
          // See https://github.com/facebook/react-native/blob/b26a9549ce2dffd1d0073ae13502830459051c27/Libraries/Network/convertRequestBody.js#L34
          // and https://github.com/facebook/react-native/blob/b26a9549ce2dffd1d0073ae13502830459051c27/Libraries/Network/FormData.js
          body: formData.getBuffer(),
        }).then((x) => {
          if (!x.ok) {
            Logger.error(TAG + '@writeDataTo', 'Error uploading ' + x.headers.get('location'))
          }
          return x.text()
        })
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
      responseBuffer(dataResponse),
      responseBuffer(signatureResponse),
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

// requires that the DEK has already been registered
export function* uploadProfileInfo() {
  const isAlreadyUploaded = yield select(isProfileUploadedSelector)
  if (isAlreadyUploaded) {
    return
  }
  try {
    yield call(unlockDEK, true)
    // yield call(addMetadataClaim)
    yield call(uploadNameAndPicture)

    yield put(profileUploaded())
  } catch (e) {
    Logger.error(TAG + '@uploadProfileInfo', 'Error uploading profile', e)
  }
}

// TODO: make metadata claim when registering account info, and use fetched metadata url when reading data

// export function* addMetadataClaim() {
//   try {
//     const contractKit = yield call(getContractKit)
//     const account = yield select(currentAccountSelector)
//     const metadata = IdentityMetadataWrapper.fromEmpty(account)
//     yield call(
//       [metadata, 'addClaim'],
//       createStorageClaim(BUCKET_URL),
//       NativeSigner(contractKit.web3.eth.sign, account)
//     )
//     Logger.info(TAG + '@addMetadataClaim' + 'created storage claim on chain')
//     yield call(writeToGCPBucket, metadata.toString(), `${account}/metadata.json`)
//     Logger.info(TAG + '@addMetadataClaim' + 'uploaded metadata.json')
//     const accountsWrapper: AccountsWrapper = yield call([
//       contractKit.contracts,
//       contractKit.contracts.getAccounts,
//     ])
//     const setAccountTx = accountsWrapper.setMetadataURL(`${BUCKET_URL}${account}/metadata.json`)
//     const context = newTransactionContext(TAG, 'Set metadata URL')
//     yield call(sendTransaction, setAccountTx.txo, account, context)
//     Logger.info(TAG + '@addMetadataClaim' + 'set metadata URL')
//   } catch (error) {
//     Logger.error(`${TAG}/addMetadataClaim`, 'Could not add metadata claim', error)
//     throw error
//   }
// }

export function* uploadNameAndPicture() {
  const contractKit = yield call(getContractKit)
  const account = yield select(currentAccountSelector)
  const offchainWrapper = new UploadServiceDataWrapper(contractKit, account)

  const name = yield select(nameSelector)
  const nameAccessor = new PrivateNameAccessor(offchainWrapper)
  let writeError = yield call([nameAccessor, 'write'], { name }, [])
  Logger.info(TAG + 'uploadNameAndPicture', 'uploaded profile name')

  const pictureUri = yield select(pictureSelector)
  if (pictureUri) {
    const data = yield call(RNFS.readFile, pictureUri, 'base64')
    const mimeType = extensionToMimeType[pictureUri.split('.').slice(-1)] || 'image/jpeg'
    const dataURL = getDataURL(mimeType, data)
    const pictureAccessor = new PrivatePictureAccessor(offchainWrapper)
    writeError = yield call([pictureAccessor, 'write'], dataURL, [])
    Logger.info(TAG + 'uploadNameAndPicture', 'uploaded profile picture')
  }

  if (writeError) {
    Logger.error(TAG + '@uploadNameAndPicture', writeError)
    throw Error('Unable to write data')
  }
}

// this function gives permission to the recipient to view the user's profile info
export function* uploadSymmetricKeys(recipientAddresses: string[]) {
  // TODO: check if key for user already exists, skip if yes
  const account = yield select(currentAccountSelector)
  const contractKit = yield call(getContractKit)
  yield call(unlockDEK)
  const offchainWrapper = new UploadServiceDataWrapper(contractKit, account)

  const nameAccessor = new PrivateNameAccessor(offchainWrapper)
  let writeError = yield call([nameAccessor, 'writeKeys'], recipientAddresses)

  const pictureUri = yield select(pictureSelector)
  if (pictureUri) {
    const pictureAccessor = new PrivatePictureAccessor(offchainWrapper)
    writeError = yield call([pictureAccessor, 'writeKeys'], recipientAddresses)
  }

  Logger.info(TAG + '@uploadSymmetricKeys', 'uploaded symmetric keys for ' + recipientAddresses)

  if (writeError) {
    Logger.error(TAG + '@uploadSymmetricKeys', writeError)
    throw Error('Unable to write keys')
  }
}

export function* getProfileInfo(address: string) {
  // TODO: check if we already have profile info of address
  const account = yield select(currentAccountSelector)
  const contractKit = yield call(getContractKit)
  yield call(unlockDEK)
  const offchainWrapper = new UploadServiceDataWrapper(contractKit, account)

  const nameAccessor = new PrivateNameAccessor(offchainWrapper)
  try {
    const name = yield call([nameAccessor, 'read'], address)

    const pictureAccessor = new PrivatePictureAccessor(offchainWrapper)
    let picturePath
    try {
      const pictureObject = yield call([pictureAccessor, 'read'], address)
      const pictureURL = pictureObject.toString()
      picturePath = yield call(saveRecipientPicture, pictureURL, address)
    } catch (error) {
      Logger.warn("can't fetch picture for", address)
    }
    return { name: name.name, thumbnailPath: picturePath }
  } catch (error) {
    Logger.warn("can't fetch name for", address)
  }
}

function* unlockDEK(addAccount = false) {
  const privateDataKey: string | null = yield select(dataEncryptionKeySelector)
  if (!privateDataKey) {
    throw new Error('No data key in store. Should never happen.')
  }
  const dataKeyaddress = normalizeAddressWith0x(
    privateKeyToAddress(ensureLeading0x(privateDataKey))
  )
  const wallet: UnlockableWallet = yield call(getWallet)
  if (addAccount) {
    try {
      yield call([wallet, wallet.addAccount], privateDataKey, '')
    } catch (e) {
      Logger.warn('Tried adding DEK to geth wallet when it already exists')
    }
  }
  yield call([wallet, wallet.unlockAccount], dataKeyaddress, '', 0)
}
