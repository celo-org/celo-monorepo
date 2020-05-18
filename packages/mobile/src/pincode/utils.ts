import { gethWallet } from 'src/web3/contracts'

export const PIN_LENGTH = 6

export function isPinValid(pin: string) {
  return pin.length === PIN_LENGTH
}

export async function isPinCorrect(pin: string, currentAccount: string): Promise<typeof pin> {
  await gethWallet.unlockAccount(currentAccount, pin, 1)
  return pin
}
