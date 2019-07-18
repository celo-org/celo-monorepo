import { getRandomTxNodeIP } from 'src/lib/kubernetes'
import Web3 from 'web3'

export async function getWeb3Client(celoEnv: string) {
  const transactionNodeIP = await getRandomTxNodeIP(celoEnv)
  return new Web3(`ws://${transactionNodeIP}:8546`)
}
