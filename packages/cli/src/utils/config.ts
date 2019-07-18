// tslint:disable:class-name max-classes-per-file
// TODO: investigate tslint issues
import * as fs from 'fs-extra'
import * as path from 'path'

export interface CeloConfig {
  nodeUrl: string
}

export const localGeth: CeloConfig = {
  nodeUrl: 'http://localhost:8545',
}

const configFile = 'config.json'

export function configPath(configDir: string) {
  return path.join(configDir, configFile)
}

export function readConfig(configDir: string): CeloConfig {
  if (fs.pathExistsSync(configPath(configDir))) {
    return fs.readJSONSync(configPath(configDir))
  } else {
    return localGeth
  }
}

export function getNodeUrl(configDir: string): string {
  return readConfig(configDir).nodeUrl
}

export function writeConfig(configDir: string, configObj: CeloConfig) {
  fs.outputJSONSync(configPath(configDir), configObj)
}
