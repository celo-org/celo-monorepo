import { Address, ensureLeading0x } from '@celo/base/lib/address'
import { Err, makeAsyncThrowable, Ok, Result, RootError } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import { ClaimTypes } from '@celo/contractkit/lib/identity/claims/types'
import { IdentityMetadataWrapper } from '@celo/contractkit/lib/identity/metadata'
import { publicKeyToAddress } from '@celo/utils/lib/address'
import { ensureUncompressed } from '@celo/utils/lib/ecdh'
import {
  recoverEIP712TypedDataSignerRsv,
  recoverEIP712TypedDataSignerVrs,
  verifyEIP712TypedDataSigner,
} from '@celo/utils/lib/signatureUtils'
import fetch from 'cross-fetch'
import debugFactory from 'debug'
import * as t from 'io-ts'
import { AuthorizedSignerAccessor } from './offchain/accessors/authorized-signer'
import { StorageWriter } from './offchain/storage-writers'
import { buildEIP712TypedData, resolvePath } from './offchain/utils'

const debug = debugFactory('offchaindata')

export enum OffchainErrorTypes {
  FetchError = 'FetchError',
  InvalidSignature = 'InvalidSignature',
  NoStorageRootProvidedData = 'NoStorageRootProvidedData',
  NoStorageProvider = 'NoStorageProvider',
}

export class FetchError extends RootError<OffchainErrorTypes.FetchError> {
  constructor(error: Error) {
    super(OffchainErrorTypes.FetchError)
    this.message = error.message
  }
}

export class InvalidSignature extends RootError<OffchainErrorTypes.InvalidSignature> {
  constructor() {
    super(OffchainErrorTypes.InvalidSignature)
  }
}

export class NoStorageRootProvidedData extends RootError<OffchainErrorTypes.NoStorageRootProvidedData> {
  constructor() {
    super(OffchainErrorTypes.NoStorageRootProvidedData)
  }
}

export class NoStorageProvider extends RootError<OffchainErrorTypes.NoStorageProvider> {
  constructor() {
    super(OffchainErrorTypes.NoStorageProvider)
  }
}

export type OffchainErrors =
  | FetchError
  | InvalidSignature
  | NoStorageRootProvidedData
  | NoStorageProvider

export interface OffchainDataWrapper {
  kit: ContractKit
  signer: Address
  self: Address
  writeDataTo(data: Buffer, signature: Buffer, dataPath: string): Promise<OffchainErrors | void>
  readDataFromAsResult<DataType>(
    account: Address,
    dataPath: string,
    checkOffchainSigners: boolean,
    type?: t.Type<DataType>
  ): Promise<Result<Buffer, OffchainErrors>>
}

export class BasicDataWrapper implements OffchainDataWrapper {
  storageWriter: StorageWriter | undefined
  signer: string

  constructor(readonly self: string, readonly kit: ContractKit, signer?: string) {
    this.signer = signer || self
  }

  async readDataFromAsResult<DataType>(
    account: Address,
    dataPath: string,
    checkOffchainSigners: boolean,
    type?: t.Type<DataType>
  ): Promise<Result<Buffer, OffchainErrors>> {
    const accounts = await this.kit.contracts.getAccounts()
    const metadataURL = await accounts.getMetadataURL(account)
    debug({ account, metadataURL })
    const metadata = await IdentityMetadataWrapper.fetchFromURL(accounts, metadataURL)
    // TODO: Filter StorageRoots with the datapath glob
    const storageRoots = metadata
      .filterClaims(ClaimTypes.STORAGE)
      .map((_) => new StorageRoot(this, account, _.address))

    if (storageRoots.length === 0) {
      return Err(new NoStorageRootProvidedData())
    }

    const results = await Promise.all(
      storageRoots.map(async (s) => s.readAndVerifySignature(dataPath, checkOffchainSigners, type))
    )
    const item = results.find((s) => s.ok)

    if (item === undefined) {
      return Err(new NoStorageRootProvidedData())
    }

    return item
  }

  readDataFrom = makeAsyncThrowable(this.readDataFromAsResult.bind(this))

  async writeDataTo(
    data: Buffer,
    signature: Buffer,
    dataPath: string
  ): Promise<OffchainErrors | void> {
    if (this.storageWriter === undefined) {
      return new NoStorageProvider()
    }

    try {
      await Promise.all([
        this.storageWriter.write(data, dataPath),
        this.storageWriter.write(signature, `${dataPath}.signature`),
      ])
    } catch (e: any) {
      return new FetchError(e instanceof Error ? e : new Error(e))
    }
  }
}

class StorageRoot {
  constructor(
    readonly wrapper: OffchainDataWrapper,
    readonly account: Address,
    readonly root: string
  ) {}

  async readAndVerifySignature<DataType>(
    dataPath: string,
    checkOffchainSigners: boolean,
    type?: t.Type<DataType>
  ): Promise<Result<Buffer, OffchainErrors>> {
    let dataResponse, signatureResponse

    try {
      ;[dataResponse, signatureResponse] = await Promise.all([
        fetch(resolvePath(this.root, dataPath)),
        fetch(resolvePath(this.root, `${dataPath}.signature`)),
      ])
    } catch (error: any) {
      const fetchError = error instanceof Error ? error : new Error(error)
      return Err(new FetchError(fetchError))
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
    const typedData = await buildEIP712TypedData(this.wrapper, dataPath, toParse, type)

    if (verifyEIP712TypedDataSigner(typedData, signature, this.account)) {
      return Ok(body)
    }

    const accounts = await this.wrapper.kit.contracts.getAccounts()
    if (await accounts.isAccount(this.account)) {
      const keys = await Promise.all([
        accounts.getVoteSigner(this.account),
        accounts.getValidatorSigner(this.account),
        accounts.getAttestationSigner(this.account),
        accounts.getDataEncryptionKey(this.account),
      ])

      const dekAddress = keys[3] ? publicKeyToAddress(ensureUncompressed(keys[3])) : '0x0'
      const signers = [keys[0], keys[1], keys[2], dekAddress]

      if (signers.some((signer) => verifyEIP712TypedDataSigner(typedData, signature, signer))) {
        return Ok(body)
      }

      if (checkOffchainSigners) {
        let guessedSigner: string
        try {
          guessedSigner = recoverEIP712TypedDataSignerRsv(typedData, signature)
        } catch (error) {
          guessedSigner = recoverEIP712TypedDataSignerVrs(typedData, signature)
        }
        const authorizedSignerAccessor = new AuthorizedSignerAccessor(this.wrapper)
        const authorizedSigner = await authorizedSignerAccessor.readAsResult(
          this.account,
          guessedSigner
        )
        if (authorizedSigner.ok) {
          return Ok(body)
        }
      }
    }

    return Err(new InvalidSignature())
  }
}
