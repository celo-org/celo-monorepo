import { getContractKitOutsideGenerator } from 'src/web3/contracts'

export const PIN_LENGTH = 6

export function isPinValid(pin: string) {
  return pin.length === PIN_LENGTH
}

export function isPinCorrect(
  pin: string,
  fornoMode: boolean,
  currentAccount: string
): Promise<typeof pin> {
  return new Promise((resolve, reject) => {
    // TODO(yorke: fix
    if (fornoMode) {
      // readPrivateKeyFromLocalDisk(currentAccount, pin)
      //   .then(() => resolve(pin))
      //   .catch(reject)
    } else {
      getContractKitOutsideGenerator()
        .then((contractKit: any) =>
          contractKit.web3.eth.personal
            .unlockAccount(currentAccount, pin, 1)
            .then((result: boolean) => (result ? resolve(pin) : reject()))
        )
        .catch(reject)
    }
  })
}
