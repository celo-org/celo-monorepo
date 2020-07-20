import { NativeSigner, verifySignature } from '@celo/utils/lib/signatureUtils'
import { execSync } from 'child_process'
import fetch from 'cross-fetch'
import debugFactory from 'debug'
import { writeFile } from 'fs'
import { ContractKit } from '../kit'
import { ClaimTypes } from './claims/types'
import { IdentityMetadataWrapper } from './metadata'

const debug = debugFactory('offchaindata')

export default class OffchainDataWrapper {
  storageWriter: StorageWriter | undefined

  constructor(readonly self: string, readonly kit: ContractKit) {}

  async readDataFrom(account: string, dataPath: string) {
    const accounts = await this.kit.contracts.getAccounts()
    const metadataURL = await accounts.getMetadataURL(account)
    debug({ account, metadataURL })
    const metadata = await IdentityMetadataWrapper.fetchFromURL(this.kit, metadataURL)
    const storageRoots = metadata
      .filterClaims(ClaimTypes.STORAGE)
      .map((_) => new StorageRoot(account, _.address))
    debug({ account, storageRoots })
    const data = (await Promise.all(storageRoots.map((_) => _.read(dataPath)))).find((_) => _)

    if (data === undefined) {
      return undefined
    }

    const [actualData, error] = data
    if (error) {
      console.log(error)
      return undefined
    }

    return actualData
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

abstract class StorageWriter {
  // Not thread safe!
  toFlush: string[] = []
  pendingFlushing: string[] = []

  uploader: StorageUploader | undefined

  abstract write(_data: string, _dataPath: string): Promise<void>
  abstract flushWrites(): Promise<void>
  abstract shouldFlushWrites(): boolean
}

export class LocalStorageWriter extends StorageWriter {
  constructor(readonly root: string) {
    super()
  }
  write(data: string, dataPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // TODO: Create necessary folders
      writeFile(this.root + dataPath, data, (error) => {
        if (error) {
          reject(error)
        }
        this.toFlush.push(dataPath)
        resolve()
      })
    })
  }

  async flushWrites() {
    if (this.uploader === undefined) {
      throw new Error('No uploader to flush writes on')
    }
    if (this.pendingFlushing.length > 0) {
      throw new Error('flushing in progress')
    }

    this.pendingFlushing = this.toFlush
    this.toFlush = []
    await this.uploader.upload(this.pendingFlushing)
    this.pendingFlushing = []
    return
  }
  shouldFlushWrites() {
    return this.uploader === undefined
  }
}

abstract class StorageUploader {
  abstract upload(dataPaths: string[]): Promise<void>
}

export class GitStorageUploader extends StorageUploader {
  constructor(readonly root: string) {
    super()
  }
  upload(dataPaths: string[]) {
    dataPaths.forEach((path) =>
      execSync(`git add ${path.substr(1)}`, {
        cwd: this.root,
      })
    )

    execSync(`git commit --message "Upload"`, { cwd: this.root })

    execSync(`git push origin master`, { cwd: this.root })
    return Promise.resolve()
  }
}

class StorageRoot {
  constructor(readonly account: string, readonly address: string) {}

  async read(dataPath: string): Promise<[any, any]> {
    const data = await fetch(this.address + dataPath)
    if (!data.ok) {
      return [null, 'No can do']
    }

    const body = await data.text()

    const signature = await fetch(this.address + dataPath + '.signature')

    if (!signature.ok) {
      return [null, 'Signature could not be fetched']
    }

    const isSigned = verifySignature(body, await signature.text(), this.account)

    if (!isSigned) {
      return [null, 'Signature is not valid']
    }

    return [body, null]
  }
}
