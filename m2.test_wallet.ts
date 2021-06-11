import { TransactionResult } from '@celo/connect'
import { AzureHSMWallet } from '@celo/wallet-hsm-azure'

// process.env.AZURE_CLIENT_ID='56cc0dbf-f334-4efd-9bdc-e2f0435eb596'
process.env.AZURE_TENANT_ID = '7cb7628a-e37c-4afb-8332-2029e418980e'
// process.env.AZURE_CLIENT_SECRET='Z~Yw610uYbkrP193E3E_F1G-rTGscE2.~D'
process.env.AZURE_VAULT_NAME = 'staging-komenci-weu'

const vaultPrefixes = [
  'weu0',
  'weu1',
  'weu2',
  'weu3',
  'weu5',
  'wus0',
  'wus1',
  'wus2',
  'wus3',
  'wus4',
]

const fornoURLForEnv = (env) => 'https://' + env + '-forno.celo-testnet.org'

const waitFor = async (tr: TransactionResult) => {
  console.log(await tr.getHash())
}

async function run() {
  const vaultName = `staging-komenci-eus`
  const azureWallet = new AzureHSMWallet(vaultName)
  await azureWallet.init()
  console.log(azureWallet)
  // const kit = newKit(fornoURLForEnv('alfajores'), azureWallet)
  // const celo = await kit.contracts.getGoldToken()
  // const cUSD = await kit.contracts.getStableToken()
  // const bn1e18 = new BigNumber(10).pow(18)
  // const val = (n: number) => new BigNumber(n).multipliedBy(bn1e18).toFixed()

  // waitFor(await celo.transfer("0x1ecb1a5ab430467f43afd3c4c944bd5637274821", val(400)).send({from: "0x00454cac6dae53f8800f71395b9a174f07a784b1"}))
  // waitFor(await cUSD.transfer("0x1ecb1a5ab430467f43afd3c4c944bd5637274821", val(4400)).send({from: "0x00454cac6dae53f8800f71395b9a174f07a784b1"}))
  // waitFor(await celo.transfer("0x1ecb1a5ab430467f43afd3c4c944bd5637274821", val(400)).send({from: "0xc6f0f9bfb1aed83620ece3eac0add98a65a8574e"}))
  // waitFor(await celo.transfer("0x03CC93cB5D3c1829F4B26F201b0E13ec30264E15", val(799)).send({from: "0x1ecb1a5ab430467f43afd3c4c944bd5637274821"}))
  // waitFor(await cUSD.transfer("0x03CC93cB5D3c1829F4B26F201b0E13ec30264E15", val(4400)).send({from: "0x1ecb1a5ab430467f43afd3c4c944bd5637274821"}))
}

run()
