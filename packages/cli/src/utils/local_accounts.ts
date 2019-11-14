import { ContractKit } from '@celo/contractkit'
import * as fs from 'fs-extra'
import * as path from 'path'

export interface CeloLocalKeys {
  files: string[]
}

const keyFileList = 'keys.json'

export const defaultKeyList: CeloLocalKeys = {
  files: [],
}

export function keyListPath(configDir: string) {
  return path.join(configDir, keyFileList)
}

export function addKeysToKit(kit: ContractKit, configDir: string) {
  const keyPaths = readKeyList(configDir)

  for (const kp of keyPaths.files) {
    if (fs.pathExistsSync(kp)) {
      kit.addAccount(fs.readFileSync(kp).toString())
    } else {
      console.error(`no key found at ${kp}, skipping...`)
    }
  }
}

export function readKeyList(configDir: string): CeloLocalKeys {
  if (fs.pathExistsSync(keyListPath(configDir))) {
    return fs.readJSONSync(keyListPath(configDir))
  } else {
    return defaultKeyList
  }
}

export function addPrivateKeyToConfig(configDir: string, keyPath: string) {
  const existingFiles = readKeyList(configDir).files
  fs.writeJSONSync(keyListPath(configDir), { files: existingFiles.concat(keyPath) })
}
