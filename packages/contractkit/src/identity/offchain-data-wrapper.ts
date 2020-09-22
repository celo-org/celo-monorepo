import { ensureLeading0x, eqAddress, trimLeading0x } from '@celo/base/lib/address'
import { Err, makeAsyncThrowable, Ok, Result, RootError } from '@celo/base/lib/result'
import { NativeSigner } from '@celo/base/lib/signatureUtils'
import { guessSigner } from '@celo/utils/lib/signatureUtils'
import fetch from 'cross-fetch'
import { createHash } from 'crypto'
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

    const item = (await Promise.all(storageRoots.map((_) => _.readAsResult(dataPath)))).find(
      (_) => _.ok
    )

    if (item === undefined) {
      return Err(new NoStorageRootProvidedData())
    }

    return item
  }

  readDataFrom = makeAsyncThrowable(this.readDataFromAsResult.bind(this))

  async writeDataTo(data: Buffer, dataPath: string) {
    if (this.storageWriter === undefined) {
      throw new Error('no storage writer')
    }
    await this.storageWriter.write(data, dataPath)

    const signPayload = Buffer.concat([
      createHash('sha3-256')
        .update(Buffer.from(dataPath))
        .digest(),
      data,
    ]).toString('hex')

    const sig = await NativeSigner(this.kit.web3.eth.sign, this.self).sign(signPayload)
    await this.storageWriter.write(Buffer.from(trimLeading0x(sig), 'hex'), dataPath + '.signature')
  }
}

class StorageRoot {
  constructor(readonly account: string, readonly address: string) {}

  // TODO: Add decryption metadata (i.e. indicates ciphertext to be decrypted/which key to use)
  async readAsResult(dataPath: string): Promise<Result<Buffer, OffchainErrors>> {
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
    const signPayload = Buffer.concat([
      createHash('sha3-256')
        .update(Buffer.from(dataPath))
        .digest(),
      body,
    ]).toString('hex')

    // TODO: Compare against registered on-chain signers or off-chain signers
    const signer = guessSigner(signPayload, signature)
    if (eqAddress(signer, this.account)) {
      return Ok(body)
    }

    // The signer might be authorized off-chain
    // TODO: Only if the signer is authorized with an on-chain key
    return this.readAsResult(`/account/authorizedSigners/${toChecksumAddress(signer)}`)
  }

  read = makeAsyncThrowable(this.readAsResult.bind(this))
}
