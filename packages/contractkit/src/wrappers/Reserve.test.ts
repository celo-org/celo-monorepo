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
  const otherSpender = '0x4404ac8bd8F9618D27Ad2f1485AA1B2cFD82482D'
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

  test('two spenders required to confirm transfers gold', async () => {
    const tx = await reserve.transferGold(otherAddress, 10)
    const multisigTx = await reserveSpenderMultiSig.submitOrConfirmTransaction(
      reserve.address,
      tx.txo
    )
    const events = await (await multisigTx.sendAndWaitForReceipt()).events
    expect(events && events.Submission && events.Confirmation && !events.Execution)

    const tx2 = await reserve.transferGold(otherAddress, 10)
    const multisigTx2 = await reserveSpenderMultiSig.submitOrConfirmTransaction(
      reserve.address,
      tx2.txo
    )
    const events2 = await (await multisigTx2.sendAndWaitForReceipt({ from: otherSpender })).events
    expect(events2 && !events2.Submission && events2.Confirmation && events2.Execution)
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
