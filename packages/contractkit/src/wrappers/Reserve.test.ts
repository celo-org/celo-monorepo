import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { newKitFromWeb3 } from '../kit'
import { ReserveWrapper } from './Reserve'

testWithGanache('Reserve Wrapper', (web3) => {
  const kit = newKitFromWeb3(web3)
  let accounts: string[] = []
  let reserve: ReserveWrapper
  const otherAddress = '0x91c987bf62D25945dB517BDAa840A6c661374402'

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    reserve = await kit.contracts.getReserve()
  })

  test('test is spender', async () => {
    const tx = await reserve.isSpender(accounts[0])
    expect(tx).toBeTruthy()
  })

  test('test spender transfers gold', async () => {
    const tx = await reserve.transferGold(otherAddress, 10)
    await tx.sendAndWaitForReceipt()
  })

  test('test does not transfers gold if not spender', async () => {
    const tx = await reserve.transferGold(otherAddress, 10)
    await expect(tx.sendAndWaitForReceipt({ from: accounts[2] })).rejects.toThrowError()
  })
})
