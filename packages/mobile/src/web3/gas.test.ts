import { getGasPrice } from 'src/web3/gas'

jest.mock('@celo/walletkit', () => ({
  ContractUtils: {
    getGasPrice: jest.fn(() => 10000),
  },
}))

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe('getGasPrice', () => {
  it('refreshes the gas price correctly', async () => {
    const gasPrice = await getGasPrice()
    expect(gasPrice.toNumber()).toBe(10000)
  })
})
