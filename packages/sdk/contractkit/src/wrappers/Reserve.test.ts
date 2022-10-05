import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import BigNumber from 'bignumber.js'
import { newKitFromWeb3 } from '../kit'
import { MultiSigWrapper } from './MultiSig'
import { ReserveWrapper } from './Reserve'

testWithGanache('Reserve Wrapper', (web3) => {
  const kit = newKitFromWeb3(web3)
  let accounts: string[] = []
  let reserve: ReserveWrapper
  let reserveSpenderMultiSig: MultiSigWrapper
  let otherReserveAddress: string
  let otherSpender: string
  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    otherReserveAddress = accounts[9]
    otherSpender = accounts[7]
    reserve = await kit.contracts.getReserve()
    const spenders = await reserve.getSpenders()
    // assumes that the multisig is the most recent spender in the spenders array
    const multiSigAddress = spenders.length > 0 ? spenders[spenders.length - 1] : ''
    reserveSpenderMultiSig = await kit.contracts.getMultiSig(multiSigAddress)
  })

  test('can get asset target weights which sum to 100%', async () => {
    const targets = await reserve.getAssetAllocationWeights()
    expect(targets.reduce((total, current) => total.plus(current), new BigNumber(0))).toEqual(
      new BigNumber(100 * 10_000_000_000_000_000_000_000)
    )
  })

  test('can get asset target symbols ', async () => {
    const targets = await reserve.getAssetAllocationSymbols()

    const expectation = ['cGLD', 'BTC', 'ETH', 'DAI']

    targets.forEach((sym, i) => {
      expect(sym).toEqual(expect.stringMatching(expectation[i]))
    })
  })

  test('can get reserve unfrozen balance ', async () => {
    const balance = await reserve.getUnfrozenBalance()
    expect(balance).toEqBigNumber('1e+26')
  })

  test('can get sum of reserve unfrozen balance + other reserve address balances', async () => {
    const balanceWithOtherAddresses = await reserve.getUnfrozenReserveCeloBalance()
    expect(balanceWithOtherAddresses).toEqBigNumber('3e+26')
  })

  test('test is spender', async () => {
    const tx = await reserve.isSpender(reserveSpenderMultiSig.address)
    expect(tx).toBeTruthy()
  })

  test('two spenders required to confirm transfers gold', async () => {
    const tx = await reserve.transferGold(otherReserveAddress, 10)
    const multisigTx = await reserveSpenderMultiSig.submitOrConfirmTransaction(
      reserve.address,
      tx.txo
    )
    const events = await (await multisigTx.sendAndWaitForReceipt()).events
    expect(events && events.Submission && events.Confirmation && !events.Execution)

    const tx2 = await reserve.transferGold(otherReserveAddress, 10)
    const multisigTx2 = await reserveSpenderMultiSig.submitOrConfirmTransaction(
      reserve.address,
      tx2.txo
    )
    const events2 = await (await multisigTx2.sendAndWaitForReceipt({ from: otherSpender })).events
    expect(events2 && !events2.Submission && events2.Confirmation && events2.Execution)
  })

  test('test does not transfer gold if not spender', async () => {
    const tx = await reserve.transferGold(otherReserveAddress, 10)
    const multisigTx = await reserveSpenderMultiSig.submitOrConfirmTransaction(
      reserve.address,
      tx.txo
    )
    await expect(multisigTx.sendAndWaitForReceipt({ from: accounts[2] })).rejects.toThrowError()
  })
})
