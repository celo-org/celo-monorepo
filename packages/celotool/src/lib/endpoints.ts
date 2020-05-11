import { envVar, fetchEnv } from './env-utils'

export function getBlockscoutUrl(celoEnv: string) {
  return `https://${celoEnv}-blockscout.${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}.org`
}

export function getBlockscoutClusterInternalUrl(celoEnv: string) {
  return `${celoEnv}-blockscout-web`
}

export function getEthstatsUrl(celoEnv: string) {
  return `https://${celoEnv}-ethstats.${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}.org`
}

export function getBlockchainApiUrl(celoEnv: string) {
  return `https://${celoEnv}-dot-${fetchEnv(envVar.TESTNET_PROJECT_NAME)}.appspot.com`
}

export function getGenesisGoogleStorageUrl(celoEnv: string) {
  return `https://www.googleapis.com/storage/v1/b/genesis_blocks/o/${celoEnv}?alt=media`
}

export function getFornoUrl(celoEnv: string) {
  return `https://${celoEnv}-forno.${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}.org`
}

export function getFullNodeRpcInternalUrl(celoEnv: string) {
  return `http://${celoEnv}-fullnodes-rpc.${celoEnv}.svc.cluster.local:8545`
}
