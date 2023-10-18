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
  return celoEnv === 'rc1'
    ? `https://forno.celo.org`
    : `https://${celoEnv}-forno.${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}.org`
}

export function getFornoWebSocketUrl(celoEnv: string) {
  return celoEnv === 'rc1'
    ? `wss://forno.celo.org/ws`
    : `wss://${celoEnv}-forno.${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}.org/ws`
}

export function getFullNodeHttpRpcInternalUrl(celoEnv: string) {
  return `http://${celoEnv}-fullnodes-rpc.${celoEnv}.svc.cluster.local:8545`
}

export function getFullNodeWebSocketRpcInternalUrl(celoEnv: string) {
  return `ws://${celoEnv}-fullnodes-rpc.${celoEnv}.svc.cluster.local:8546`
}

export function getLightNodeHttpRpcInternalUrl(celoEnv: string) {
  return `http://${celoEnv}-lightnodes-rpc.${celoEnv}.svc.cluster.local:8545`
}

export function getLightNodeWebSocketRpcInternalUrl(celoEnv: string) {
  return `ws://${celoEnv}-lightnodes-rpc.${celoEnv}.svc.cluster.local:8546`
}
