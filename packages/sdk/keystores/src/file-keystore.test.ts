import { trimLeading0x } from '@celo/utils/lib/address'
import { mkdirSync, readdirSync, readFileSync, rmdirSync, writeFileSync } from 'fs'
import path from 'path'
import { FileKeystore } from './file-keystore'
import { ADDRESS1, GETH_GEN_KEYSTORE1, KEYSTORE_NAME1, PASSPHRASE1, PK1 } from './test-constants'

jest.setTimeout(20000)

describe('FileKeystore tests', () => {
  const parentWorkdir = path.join(__dirname, 'wallet-keystore-workdir')
  let testWorkdir: string

  beforeAll(() => {
    mkdirSync(parentWorkdir, { recursive: true })
  })

  beforeEach(() => {
    testWorkdir = path.join(parentWorkdir, `test-${Math.random().toString(36).substring(2, 7)}`)
    mkdirSync(testWorkdir)
  })

  afterAll(() => {
    rmdirSync(parentWorkdir, { recursive: true })
  })
  it('initializes keystore, imports key into keystore file, and deletes', async () => {
    const keystore = new FileKeystore(testWorkdir)
    expect(readdirSync(testWorkdir)).toEqual(['keystore'])
    const keystorePath = path.join(testWorkdir, 'keystore')
    expect(readdirSync(keystorePath).length).toBe(0)
    await keystore.importPrivateKey(PK1, PASSPHRASE1)
    const keystoreFiles = readdirSync(keystorePath)
    expect(keystoreFiles.length).toBe(1)
    const keystoreName = await keystore.getKeystoreName(ADDRESS1)
    expect(readFileSync(path.join(keystorePath, keystoreFiles[0])).toString()).toEqual(
      keystore.getRawKeystore(keystoreName)
    )
    keystore.removeKeystore(keystoreName)
    expect(readdirSync(keystorePath).length).toBe(0)
  })

  it('reads key from file in existing keystore', async () => {
    const keystorePath = path.join(testWorkdir, 'keystore')
    mkdirSync(keystorePath)
    writeFileSync(path.join(keystorePath, KEYSTORE_NAME1), GETH_GEN_KEYSTORE1)
    const keystore = new FileKeystore(testWorkdir)
    expect(await keystore.getAllKeystoreNames()).toEqual([KEYSTORE_NAME1])
    expect(await keystore.listKeystoreAddresses()).toEqual([ADDRESS1])
    expect(trimLeading0x(await keystore.getPrivateKey(ADDRESS1, PASSPHRASE1))).toEqual(PK1)
  })
})
