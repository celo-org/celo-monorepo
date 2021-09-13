import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import GetBuyAmount from './get-buy-amount'

testWithGanache('grandamento:get-buy-amount cmd', () => {
  it('gets the buy amount', async () => {
    await GetBuyAmount.run([
      '--sellCelo',
      'true',
      '--stableToken',
      'cusd',
      '--value',
      '100000000000000000000000',
    ])
  })
})
