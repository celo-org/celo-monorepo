import { CeloEnvArgv, envVar, fetchEnv } from 'src/lib/utils'

export function getBlockscoutUrl(argv: CeloEnvArgv) {
  return `https://${argv.celoEnv}-blockscout.${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}.org`
}

export function getBlockscoutClusterInternalUrl(argv: CeloEnvArgv) {
  return `${argv.celoEnv}-blockscout-web`
}

export function getEthstatsUrl(argv: CeloEnvArgv) {
  return `https://${argv.celoEnv}-ethstats.${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}.org`
}

export function getBlockchainApiUrl(argv: CeloEnvArgv) {
  return `https://${argv.celoEnv}-dot-${fetchEnv(envVar.TESTNET_PROJECT_NAME)}.appspot.com`
}
