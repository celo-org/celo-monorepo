import { execSync } from 'child_process'
import { mkdirSync, writeFile } from 'fs'
import { normalize, parse } from 'path'

export abstract class StorageWriter {
  abstract write(_data: Buffer, _dataPath: string): Promise<void>
}

export class LocalStorageWriter extends StorageWriter {
  constructor(readonly root: string) {
    super()
  }
  async write(data: Buffer, dataPath: string): Promise<void> {
    return this.writeToFs(data, dataPath)
  }

  protected async writeToFs(data: string | Buffer, dataPath: string): Promise<void> {
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
  async write(data: Buffer, dataPath: string): Promise<void> {
    await this.writeToFs(data, dataPath)
    execSync(`git add ${dataPath}`, {
      cwd: this.root,
    })
    execSync(`git commit --message "Upload ${dataPath}"`, { cwd: this.root })
    execSync(`git push origin master`, { cwd: this.root })
    return
  }
}

export class GoogleStorageWriter extends LocalStorageWriter {
  private readonly bucket: string

  constructor(readonly local: string, bucket: string) {
    super(local)
    this.bucket = bucket
  }

  async write(data: Buffer, dataPath: string): Promise<void> {
    await this.writeToFs(data, dataPath)
    execSync(`gsutil cp ${normalize(this.root + '/' + dataPath)} gs://${this.bucket}${dataPath}`, {
      cwd: this.root,
    })
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
}

export class MockStorageWriter extends LocalStorageWriter {
  constructor(readonly root: string, readonly mockedStorageRoot: string, readonly fetchMock: any) {
    super(root)
  }
  async write(data: Buffer, dataPath: string): Promise<void> {
    await this.writeToFs(data, dataPath)
    this.fetchMock.mock(this.mockedStorageRoot + dataPath, data, {
      sendAsJson: false,
      overwriteRoutes: true,
    })
  }
}
