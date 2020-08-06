import { eqAddress } from '@celo/utils/lib/address'
import { guessSigner, NativeSigner } from '@celo/utils/lib/signatureUtils'
import debugFactory from 'debug'
import { toChecksumAddress } from 'web3-utils'
import { ContractKit } from '../kit'
import { ClaimTypes } from './claims/types'
import { IdentityMetadataWrapper } from './metadata'
import { StorageWriter } from './offchain/storage-writers'
import { Err, isResult, Ok, RootError, Task } from './task'

const debug = debugFactory('offchaindata')

export enum OffchainErrorTypes {
  FetchError = 'FetchError',
  InvalidSignature = 'InvalidSignature',
  NoStorageRootProvidedData = 'NoStorageRootProvidedData',
}

interface FetchError {
  errorType: OffchainErrorTypes.FetchError
}
interface InvalidSignature {
  errorType: OffchainErrorTypes.InvalidSignature
}
interface NoStorageRootProvidedData {
  errorType: OffchainErrorTypes.NoStorageRootProvidedData
}

export type OffchainErrors = FetchError | InvalidSignature | NoStorageRootProvidedData

export default class OffchainDataWrapper {
  storageWriter: StorageWriter | undefined

  constructor(readonly self: string, readonly kit: ContractKit) {}

  async readDataFrom(account: string, dataPath: string): Promise<Task<string, OffchainErrors>> {
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
      return Err(new RootError(OffchainErrorTypes.FetchError))
    }

    const item = await (await Promise.all(storageRoots.map((_) => _.read(dataPath)))).find(isResult)

    if (item === undefined) {
      return Err(new RootError(OffchainErrorTypes.FetchError))
    }

    return item
  }

  async writeDataTo(data: string, dataPath: string) {
    if (this.storageWriter === undefined) {
      throw new Error('no storage writer')
    }
    await this.storageWriter.write(data, dataPath)
    // TODO: Prefix signing abstraction
    const sig = await NativeSigner(this.kit.web3.eth.sign, this.self).sign(data)
    await this.storageWriter.write(sig, dataPath + '.signature')
  }
}

class StorageRoot {
  constructor(readonly account: string, readonly address: string) {}

  // TODO: Add decryption metadata (i.e. indicates ciphertext to be decrypted/which key to use)
  async read(dataPath: string): Promise<Task<string, FetchError>> {
    const data = await fetch(this.address + dataPath)
    if (!data.ok) {
      return Err(new RootError<OffchainErrorTypes.FetchError>(OffchainErrorTypes.FetchError))
    }

    const body = await data.text()

    const signature = await fetch(this.address + dataPath + '.signature')

    if (!signature.ok) {
      return Err(new RootError<OffchainErrorTypes.FetchError>(OffchainErrorTypes.FetchError))
    }

    // TODO: Compare against registered on-chain signers or off-chain signers
    const signer = guessSigner(body, await signature.text())

    if (eqAddress(signer, this.account)) {
      return Ok(body)
    }

    // The signer might be authorized off-chain
    // TODO: Only if the signer is authorized with an on-chain key
    return this.read(`/account/authorizedSigners/${toChecksumAddress(signer)}`)
  }
}
