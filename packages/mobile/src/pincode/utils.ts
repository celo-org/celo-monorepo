import { RpcWallet } from '@celo/contractkit/lib/wallets/rpc-wallet'
import { sleep } from '@celo/utils/lib/async'
import { UNLOCK_DURATION } from 'src/geth/consts'
import { getWallet } from 'src/web3/contracts'

export const PIN_LENGTH = 6

export function isPinValid(pin: string) {
  return pin.length === PIN_LENGTH
}

export async function isPinCorrect(pin: string, currentAccount: string): Promise<typeof pin> {
  let walletIterator = getWallet().next()
  while (!walletIterator.done) {
    await sleep(100)
    walletIterator = getWallet().next()
    console.log(walletIterator)
  }
  const wallet = walletIterator.value as RpcWallet
  debugger
  await wallet.unlockAccount(currentAccount, pin, UNLOCK_DURATION)
  return pin
}
