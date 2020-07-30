import { eqAddress } from '@celo/utils/lib/address'
import { guessSigner, NativeSigner } from '@celo/utils/lib/signatureUtils'
import debugFactory from 'debug'
import { toChecksumAddress } from 'web3-utils'
import { ContractKit } from '../kit'
import { ClaimTypes } from './claims/types'
import { IdentityMetadataWrapper } from './metadata'
import { StorageWriter } from './offchain/storage-writers'
const debug = debugFactory('offchaindata')

class FetchError extends Error {}
class InvalidSignature extends Error {}
class NoStorageRootProvidedData extends Error {}
export type OffchainErrors = FetchError | InvalidSignature | NoStorageRootProvidedData

export default class OffchainDataWrapper {
  storageWriter: StorageWriter | undefined

  constructor(readonly self: string, readonly kit: ContractKit) {}

  async readDataFrom(account: string, dataPath: string): Promise<[any, OffchainErrors | null]> {
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
      return [null, new NoStorageRootProvidedData()]
    }
    const [actualData, err] = (await Promise.all(storageRoots.map((_) => _.read(dataPath))))[0]

    if (err) {
      return [null, err]
    }

    return [actualData, null]
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
  async read(dataPath: string): Promise<[any, OffchainErrors | null]> {
    const data = await fetch(this.address + dataPath)
    if (!data.ok) {
      return [null, new FetchError()]
    }

    const body = await data.text()

    const signature = await fetch(this.address + dataPath + '.signature')

    if (!signature.ok) {
      return [null, new FetchError()]
    }

    // TODO: Compare against registered on-chain signers or off-chain signers
    const signer = guessSigner(body, await signature.text())

    if (eqAddress(signer, this.account)) {
      return [body, null]
    }

    // The signer might be authorized off-chain
    // TODO: Only if the signer is authorized with an on-chain key
    const [, err] = await this.read(`/account/authorizedSigners/${toChecksumAddress(signer)}`)

    if (err) {
      return [null, err]
    }

    return [body, null]
  }
}
