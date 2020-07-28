import {
  Storage as GoogleStorage,
  StorageOptions as GoogleStorageOptions,
} from '@google-cloud/storage'
import { execSync } from 'child_process'
import { mkdirSync, writeFile } from 'fs'
import { parse } from 'path'

export abstract class StorageWriter {
  abstract write(_data: string, _dataPath: string): Promise<void>
}

export class LocalStorageWriter extends StorageWriter {
  constructor(readonly root: string) {
    super()
  }
  async write(data: string, dataPath: string): Promise<void> {
    return this.writeToFs(data, dataPath)
  }

  protected async writeToFs(data: string, dataPath: string): Promise<void> {
    await new Promise((resolve, reject) => {
      const directory = parse(dataPath).dir
      mkdirSync(this.root + directory, { recursive: true })
      writeFile(this.root + dataPath, data, (error) => {
        if (error) {
          reject(error)
        }

        resolve()
      })
    })
  }
}

export class GitStorageWriter extends LocalStorageWriter {
  async write(data: string, dataPath: string): Promise<void> {
    await this.writeToFs(data, dataPath)
    execSync(`git add ${dataPath.substr(1)}`, {
      cwd: this.root,
    })
    execSync(`git commit --message "Upload ${dataPath}"`, { cwd: this.root })
    execSync(`git push origin master`, { cwd: this.root })
    return
  }
}

export class GoogleStorageWriter extends LocalStorageWriter {
  private client: GoogleStorage
  private bucketName: string

  constructor(bucketName: string, localPath: string, options?: GoogleStorageOptions) {
    super(localPath)
    this.bucketName = bucketName
    this.client = new GoogleStorage(options)
  }

  async write(data: string, path: string): Promise<void> {
    await this.writeToFs(data, path)
    console.log('>>>', this.root, path)
    await this.client.bucket(this.bucketName).upload(this.root + path, {
      destination: path,
    })
  }
}
