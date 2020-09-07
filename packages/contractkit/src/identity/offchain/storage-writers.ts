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

export class MockStorageWriter extends LocalStorageWriter {
  constructor(readonly root: string, readonly mockedStorageRoot: string, readonly fetchMock: any) {
    super(root)
  }
  async write(data: string, dataPath: string): Promise<void> {
    await this.writeToFs(data, dataPath)
    this.fetchMock.mock(this.mockedStorageRoot + dataPath, data)
  }
}
