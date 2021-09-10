import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import GetBuyAmount from './get-buy-amount'

testWithGanache('grandamento:get-buy-amount cmd', () => {
  it('shows proposals', async () => {
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
