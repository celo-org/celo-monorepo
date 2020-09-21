// tslint:disable:class-name max-classes-per-file
// TODO: investigate tslint issues
import * as fs from 'fs-extra'
import * as path from 'path'
import { GasOptions } from '../base'

export interface CeloConfig {
  node: string
  gasCurrency: GasOptions
}

export const defaultConfig: CeloConfig = {
  node: 'http://localhost:8545',
  gasCurrency: 'auto' as GasOptions,
}

const configFile = 'config.json'

export function configPath(configDir: string) {
  return path.join(configDir, configFile)
}

export function readConfig(configDir: string): CeloConfig {
  if (fs.pathExistsSync(configPath(configDir))) {
    var existingJSON = fs.readJSONSync(configPath(configDir))
    var jsonCombined = Object.assign({}, existingJSON, defaultConfig)
    if (jsonCombined.hasOwnProperty('nodeUrl')) {
      jsonCombined['node'] = jsonCombined['nodeUrl']
    }
    return jsonCombined
  } else {
    return defaultConfig
  }
}

export function getNodeUrl(configDir: string): string {
  return readConfig(configDir).node
}

export function getGasCurrency(configDir: string): GasOptions {
  return readConfig(configDir).gasCurrency
}

export function writeConfig(configDir: string, configObj: CeloConfig) {
  fs.outputJSONSync(configPath(configDir), configObj)
}
