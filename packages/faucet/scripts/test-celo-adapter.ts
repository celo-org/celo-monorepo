import { privateKeyToAddress } from '@celo/utils/lib/address'
import Web3 from 'web3'
import { CeloAdapter } from '../src/celo-adapter'

// Obtained from `yarn cli config:get --net alfajores`
const Config = {
  stable_token_address: '0xd4b4fcaCAc9e23225680e89308E0a4C41Dd9C6B4',
  node_url: 'https://alfajores-forno.celo-testnet.org',
  escrow_address: '0xEa1B07eb5E3D3f3b93bf0d0ca7e6E2ba6F566Af4',
  gold_token_address: '0x11CD75C45638Ec9f41C0e8Df78fc756201E48ff2',
}

const FAUCET_ADDR = '0x22579CA45eE22E2E16dDF72D955D6cf4c767B0eF'

async function main() {
  if (process.argv.length !== 4) {
    console.log(`Call with: <privateKey> <recipientAddress>`)
    process.exit(1)
  }

  const pk = process.argv[2]
  const to = process.argv[3]

  if (privateKeyToAddress(pk).toLowerCase() !== FAUCET_ADDR.toLowerCase()) {
    console.log(
      `PrivateKey for invalid address. Expected: ${FAUCET_ADDR}, GOT: ${privateKeyToAddress(pk)}`
    )
    process.exit(1)
  }

  // Escrow address is an empty string, because we don't need that contract in this function
  const celo = new CeloAdapter({
    pk,
    nodeUrl: Config.node_url,
  })

  const printBalance = async (name: string, addr: string) => {
    console.log(`Account ${name}: ${addr}`)
    console.log(`USD: ${await celo.getDollarsBalance(addr)}`)
    console.log(`Gold: ${await celo.getGoldBalance(addr)}`)
    console.log('-------------------------------------------')
  }

  await printBalance('Funder', celo.defaultAddress)
  await printBalance('Recipient', to)

  const goldAmount = Web3.utils.toWei('1', 'ether')
  const dollarAmount = Web3.utils.toWei('1', 'ether')

  const goldTx = await celo.transferGold(to, goldAmount)
  console.log('txhash', await goldTx.sendAndWaitForReceipt())
  console.log('receipt', await goldTx.sendAndWaitForReceipt)

  const dollarTx = await celo.transferDollars(to, dollarAmount)
  console.log('txhash', await dollarTx.sendAndWaitForReceipt())
  console.log('receipt', await dollarTx.sendAndWaitForReceipt())

  await printBalance('Funder', celo.defaultAddress)
  await printBalance('Recipient', to)
}

main().catch((err) => {
  console.log(err)
  process.exit(1)
})
