import { newKitFromWeb3 } from '@celo/contractkit'
import { getContractFromEvent, testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import Register from '../account/register'
import TransferDollars from '../transfer/dollars'
import CreateAccount from './create-account'
import RGTransferDollars from './transfer-dollars'

process.env.NO_SYNCCHECK = 'true'

// Lots of commands, sometimes times out
jest.setTimeout(15000)

testWithGanache('releasegold:transfer-dollars cmd', (web3: Web3) => {
  let accounts: string[] = []
  let contractAddress: any
  let kit: any

  beforeEach(async () => {
    const contractCanValidate = false
    contractAddress = await getContractFromEvent(
      'ReleaseGoldInstanceCreated(address,address)',
      web3,
      contractCanValidate
    )
    kit = newKitFromWeb3(web3)
    accounts = await web3.eth.getAccounts()
    await Register.run(['--from', accounts[0]])
    await CreateAccount.run(['--contract', contractAddress])
  })

  test('can transfer dollars out of the ReleaseGold contract', async () => {
    const balanceBefore = await kit.getTotalBalance(accounts[0])
    const cUSDToTransfer = '500000000000000000000'
    // Send cUSD to RG contract
    await TransferDollars.run([
      '--from',
      accounts[0],
      '--to',
      contractAddress,
      '--value',
      cUSDToTransfer,
    ])
    // RG cUSD balance should match the amount sent
    const contractBalance = await kit.getTotalBalance(contractAddress)
    expect(contractBalance.usd.toFixed()).toEqual(cUSDToTransfer)
    // Attempt to send cUSD back
    await RGTransferDollars.run([
      '--contract',
      contractAddress,
      '--to',
      accounts[0],
      '--value',
      cUSDToTransfer,
    ])
    const balanceAfter = await kit.getTotalBalance(accounts[0])
    expect(balanceBefore.usd).toEqual(balanceAfter.usd)
  })

  test('should fail if contract has no celo dollars', async () => {
    await expect(
      RGTransferDollars.run(['--contract', contractAddress, '--to', accounts[0], '--value', '1'])
    ).rejects.toThrow()
  })
})
