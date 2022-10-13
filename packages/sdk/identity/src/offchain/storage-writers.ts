import { spawnSync } from 'child_process'
import { promises } from 'fs'
import { join, parse } from 'path'
import { resolvePath } from './utils'
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
    const directory = parse(dataPath).dir
    await promises.mkdir(join(this.root, directory), { recursive: true })
    await promises.writeFile(join(this.root, dataPath), data)
  }
}

export class GitStorageWriter extends LocalStorageWriter {
  async write(data: Buffer, dataPath: string): Promise<void> {
    await this.writeToFs(data, dataPath)
    spawnSync('git', ['add', dataPath], {
      cwd: this.root,
    })
    spawnSync('git', ['commit', '--message', `"Upload ${dataPath}"`], { cwd: this.root })
    spawnSync('git', ['push', 'origin', 'master'], { cwd: this.root })
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
    spawnSync('gsutil', ['cp', join(this.root, dataPath), `gs://${this.bucket}${dataPath}`], {
      cwd: this.root,
    })
  }
}

export class AwsStorageWriter extends LocalStorageWriter {
  private readonly bucket: string

  constructor(readonly local: string, bucket: string) {
    super(local)
    this.bucket = bucket
  }

  async write(data: Buffer, dataPath: string): Promise<void> {
    await this.writeToFs(data, dataPath)
    spawnSync('aws', ['s3', 'cp', join(this.root, dataPath), `s3://${this.bucket}${dataPath}`], {
      cwd: this.root,
    })
  }
}

export class MockStorageWriter extends LocalStorageWriter {
  constructor(readonly root: string, readonly mockedStorageRoot: string, readonly fetchMock: any) {
    super(root)
  }
  async write(data: Buffer, dataPath: string): Promise<void> {
    await this.writeToFs(data, dataPath)
    this.fetchMock.mock(resolvePath(this.mockedStorageRoot, dataPath), data, {
      sendAsJson: false,
      overwriteRoutes: true,
    })
  }
}
