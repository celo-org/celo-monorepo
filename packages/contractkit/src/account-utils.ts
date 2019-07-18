// TODO(asa): Fix Web3 type here
export async function unlockAccount(
  web3: any,
  duration: number,
  password: string,
  accountAddress: string | null = null
) {
  if (accountAddress === null) {
    const accounts = await web3.eth.getAccounts()
    accountAddress = accounts[0]
  }
  await web3.eth.personal.unlockAccount(accountAddress!, password, duration)
  return accountAddress!
}
