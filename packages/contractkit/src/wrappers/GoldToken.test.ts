import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { newKitFromWeb3 } from '../kit'
import { GoldTokenWrapper } from './GoldTokenWrapper'

testWithGanache('GoldToken Wrapper', (web3) => {
  const ONE_GOLD = web3.utils.toWei('1', 'ether')

  const kit = newKitFromWeb3(web3)
  let accounts: string[] = []
  let goldToken: GoldTokenWrapper

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    goldToken = await kit.contracts.getGoldToken()
  })

  test('SBAT check balance', () =>
    expect(goldToken.balanceOf(accounts[0])).resolves.toBeBigNumber())
  test('SBAT check decimals', () => expect(goldToken.decimals()).resolves.toBe(18))
  test('SBAT check name', () => expect(goldToken.name()).resolves.toBe('Celo Gold'))
  test('SBAT check symbol', () => expect(goldToken.symbol()).resolves.toBe('cGLD'))
  test('SBAT check totalSupply', () => expect(goldToken.totalSupply()).resolves.toBeBigNumber())

  test('SBAT transfer', async () => {
    const before = await goldToken.balanceOf(accounts[1])
    const tx = await goldToken.transfer(accounts[1], ONE_GOLD).send()
    await tx.waitReceipt()

    const after = await goldToken.balanceOf(accounts[1])
    expect(after.minus(before)).toEqBigNumber(ONE_GOLD)
  })

  test('SBAT approve spender', async () => {
    const before = await goldToken.allowance(accounts[0], accounts[1])
    expect(before).toEqBigNumber(0)

    await goldToken.approve(accounts[1], ONE_GOLD).send()
    const after = await goldToken.allowance(accounts[0], accounts[1])
    expect(after).toEqBigNumber(ONE_GOLD)
  })

  test('SBAT tranfer from', async () => {
    const before = await goldToken.balanceOf(accounts[3])
    // account1 approves account0
    await goldToken.approve(accounts[0], ONE_GOLD).send({ from: accounts[1] })

    const tx = await goldToken.transferFrom(accounts[1], accounts[3], ONE_GOLD).send()
    await tx.waitReceipt()
    const after = await goldToken.balanceOf(accounts[3])
    expect(after.minus(before)).toEqBigNumber(ONE_GOLD)
  })
})
