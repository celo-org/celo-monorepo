import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { newKitFromWeb3 } from '../kit'
import { ReserveWrapper } from './Reserve'
import { ReserveSpenderMultiSigWrapper } from './ReserveSpenderMultiSig'

testWithGanache('Reserve Wrapper', (web3) => {
  const kit = newKitFromWeb3(web3)
  let accounts: string[] = []
  let reserve: ReserveWrapper
  let reserveSpenderMultiSig: ReserveSpenderMultiSigWrapper
  const otherAddress = '0x91c987bf62D25945dB517BDAa840A6c661374402'
  // TODO @amyslawson will ganache always give same proxy address for testing?  can we ensure that?
  const multiSigAddress = '0xf23276778860e420acfc18ebeebf7e829b06965c'
  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    reserve = await kit.contracts.getReserve()
    reserveSpenderMultiSig = await kit.contracts.getReserveSpenderMultiSig(multiSigAddress)
  })

  test('test is spender', async () => {
    const tx = await reserve.isSpender(reserveSpenderMultiSig.address)
    expect(tx).toBeTruthy()
  })

  test('test spender transfers gold', async () => {
    const tx = await reserve.transferGold(otherAddress, 10)
    const multisigTx = await reserveSpenderMultiSig.submitOrConfirmTransaction(
      reserve.address,
      tx.txo
    )
    await multisigTx.sendAndWaitForReceipt()
  })

  test('test does not transfers gold if not spender', async () => {
    const tx = await reserve.transferGold(otherAddress, 10)
    const multisigTx = await reserveSpenderMultiSig.submitOrConfirmTransaction(
      reserve.address,
      tx.txo
    )
    await expect(multisigTx.sendAndWaitForReceipt({ from: accounts[2] })).rejects.toThrowError()
  })
})
