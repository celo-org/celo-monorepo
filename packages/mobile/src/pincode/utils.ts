import { UNLOCK_DURATION } from 'src/geth/consts'
import { getWalletAsync } from 'src/web3/contracts'

export const PIN_LENGTH = 6

export function isPinValid(pin: string) {
  return pin.length === PIN_LENGTH
}

export async function isPinCorrect(pin: string, currentAccount: string): Promise<typeof pin> {
  const wallet = await getWalletAsync()
  await wallet.unlockAccount(currentAccount, pin, UNLOCK_DURATION)
  return pin
}
