// tslint:disable:class-name max-classes-per-file
// TODO: investigate tslint issues
import * as fs from 'fs-extra'
import * as path from 'path'

export interface CeloConfig {
  node?: string
  useLedger?: boolean
  ledgerAddresses?: number
  ledgerCustomAddresses?: string
  ledgerConfirmAddress?: boolean
  useAKV?: boolean
  azureVaultName?: string
  privateKey?: string
}

export const defaultCeloConfig: CeloConfig = {
  node: 'http://localhost:8545',
}
const defaultConfigFile = 'config.json'

// Just in case the types are avoided
const allowedKeysToSearch = [
  'node',
  'useLedger',
  'ledgerAddress',
  'ledgerCustomAddresses',
  'ledgerConfirmAddress',
  'useAKV',
  'azureVaultName',
  'privateKey',
]
export class ConfigRetriever {
  private celoConfig: any
  private configPath: string
  constructor(readonly configDir: string, readonly configFile: string = defaultConfigFile) {
    this.configPath = this.getConfigPath(configDir, configFile)
    this.celoConfig = this.readConfig()
  }

  writeConfig(configObj: CeloConfig) {
    this.celoConfig = configObj
    fs.outputJSONSync(this.configPath, configObj)
  }

  resetConfig() {
    fs.removeSync(this.configPath)
    this.celoConfig = defaultCeloConfig
  }

  mergeConfig(configObj: CeloConfig) {
    this.celoConfig = { ...this.celoConfig, ...configObj }
    this.writeConfig(this.celoConfig)
  }

  getKey(key: keyof CeloConfig) {
    return allowedKeysToSearch.includes(key) ? this.celoConfig[key] : undefined
  }

  getConfig(): CeloConfig {
    return this.celoConfig
  }

  private readConfig(): CeloConfig {
    if (fs.pathExistsSync(this.configPath)) {
      const fileResponse = fs.readJSONSync(this.configPath)
      // for backward compatibility
      fileResponse.node = fileResponse.node || fileResponse.nodeUrl
      delete fileResponse.nodeUrl
      return { ...defaultCeloConfig, ...fileResponse }
    } else {
      return defaultCeloConfig
    }
  }

  private getConfigPath(configDir: string, configFile: string) {
    return path.join(configDir, configFile)
  }
}
