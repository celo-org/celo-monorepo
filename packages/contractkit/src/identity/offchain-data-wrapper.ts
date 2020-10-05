import { ensureLeading0x, eqAddress, trimLeading0x } from '@celo/base/lib/address'
import { Err, makeAsyncThrowable, Ok, Result, RootError } from '@celo/base/lib/result'
import { EIP712TypedData } from '@celo/utils/lib/sign-typed-data-utils'
import { guessEIP712TypedDataSigner } from '@celo/utils/src/signatureUtils'
import fetch from 'cross-fetch'
import debugFactory from 'debug'
import { toChecksumAddress } from 'web3-utils'
import { ContractKit } from '../kit'
import { ClaimTypes } from './claims/types'
import { IdentityMetadataWrapper } from './metadata'
import { StorageWriter } from './offchain/storage-writers'

const debug = debugFactory('offchaindata')

export enum OffchainErrorTypes {
  FetchError = 'FetchError',
  InvalidSignature = 'InvalidSignature',
  NoStorageRootProvidedData = 'NoStorageRootProvidedData',
}

class FetchError extends RootError<OffchainErrorTypes.FetchError> {
  constructor() {
    super(OffchainErrorTypes.FetchError)
  }
}

class InvalidSignature extends RootError<OffchainErrorTypes.InvalidSignature> {
  constructor() {
    super(OffchainErrorTypes.InvalidSignature)
  }
}

class NoStorageRootProvidedData extends RootError<OffchainErrorTypes.NoStorageRootProvidedData> {
  constructor() {
    super(OffchainErrorTypes.NoStorageRootProvidedData)
  }
}

export type OffchainErrors = FetchError | InvalidSignature | NoStorageRootProvidedData

export default class OffchainDataWrapper {
  storageWriter: StorageWriter | undefined

  constructor(readonly self: string, readonly kit: ContractKit) {}

  async readDataFromAsResult(
    account: string,
    buildTypedData: (x: Buffer) => Promise<EIP712TypedData>,
    dataPath: string
  ): Promise<Result<Buffer, OffchainErrors>> {
    const accounts = await this.kit.contracts.getAccounts()
    const metadataURL = await accounts.getMetadataURL(account)
    debug({ account, metadataURL })
    const metadata = await IdentityMetadataWrapper.fetchFromURL(this.kit, metadataURL)
    // TODO: Filter StorageRoots with the datapath glob
    const storageRoots = metadata
      .filterClaims(ClaimTypes.STORAGE)
      .map((_) => new StorageRoot(account, _.address))
    debug({ account, storageRoots })

    if (storageRoots.length === 0) {
      return Err(new NoStorageRootProvidedData())
    }

    const item = (
      await Promise.all(storageRoots.map((_) => _.readAndVerifySignature(dataPath, buildTypedData)))
    ).find((_) => _.ok)

    if (item === undefined) {
      return Err(new NoStorageRootProvidedData())
    }

    return item
  }

  readDataFrom = makeAsyncThrowable(this.readDataFromAsResult.bind(this))

  async writeDataTo(data: Buffer, signature: string, dataPath: string) {
    if (this.storageWriter === undefined) {
      throw new Error('no storage writer')
    }

    await Promise.all([
      this.storageWriter.write(data, dataPath),
      await this.storageWriter.write(
        Buffer.from(trimLeading0x(signature), 'hex'),
        dataPath + '.signature'
      ),
    ])
  }
}

class StorageRoot {
  constructor(readonly account: string, readonly address: string) {}

  async readAndVerifySignature(
    dataPath: string,
    buildTypedData: (x: Buffer) => Promise<EIP712TypedData>
  ): Promise<Result<Buffer, OffchainErrors>> {
    let dataResponse, signatureResponse

    try {
      ;[dataResponse, signatureResponse] = await Promise.all([
        fetch(this.address + dataPath),
        fetch(this.address + dataPath + '.signature'),
      ])
    } catch (error) {
      return Err(new FetchError())
    }

    if (!dataResponse.ok) {
      return Err(new FetchError())
    }
    if (!signatureResponse.ok) {
      return Err(new InvalidSignature())
    }

    const body = Buffer.from(dataResponse.body || [])
    const signature = ensureLeading0x(Buffer.from(signatureResponse.body || []).toString('hex'))

    const typedData = await buildTypedData(body)
    const guessedSigner = guessEIP712TypedDataSigner(typedData, signature)
    if (eqAddress(guessedSigner, this.account)) {
      return Ok(body)
    }

    // The signer might be authorized off-chain
    // TODO: Only if the signer is authorized with an on-chain key
    return this.readAndVerifySignature(
      `/account/authorizedSigners/${toChecksumAddress(guessedSigner)}`,
      buildTypedData
    )
  }
}
