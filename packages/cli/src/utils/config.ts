// tslint:disable:class-name max-classes-per-file
// TODO: investigate tslint issues
import * as fs from 'fs-extra'
import * as path from 'path'
import { gasOptions } from '../base'

export interface CeloConfig {
  node: string
  gasCurrency: string
}

export const defaultConfig: CeloConfig = {
  node: 'http://localhost:8545',
  gasCurrency: 'auto',
}

const configFile = 'config.json'

export function configPath(configDir: string) {
  return path.join(configDir, configFile)
}

export function readConfig(configDir: string): CeloConfig {
  if (fs.pathExistsSync(configPath(configDir))) {
    const existingConfig = fs.readJSONSync(configPath(configDir))
    const combinedConfig = { ...defaultConfig, ...existingConfig }
    if (combinedConfig.hasOwnProperty('nodeUrl')) {
      combinedConfig.node = combinedConfig.nodeUrl
    }
    return combinedConfig
  } else {
    return defaultConfig
  }
}

export function getNodeUrl(configDir: string): string {
  return readConfig(configDir).node
}

export function getGasCurrency(configDir: string): string {
  return readConfig(configDir).gasCurrency
}

export function writeConfig(configDir: string, configObj: CeloConfig) {
  if (!Object.keys(gasOptions).includes(configObj.gasCurrency)) {
    throw new Error('Invalid gas option')
  }
  fs.outputJSONSync(configPath(configDir), configObj)
}
