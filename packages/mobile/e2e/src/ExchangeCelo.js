import { enterPinUi, isElementVisible, sleep } from './utils/utils'
import { DEFAULT_RECIPIENT_ADDRESS } from './utils/consts'

const CELO_TO_EXCHANGE = 1.1
const CELO_TO_SEND = '0.001'

// Android doesn't support the getAttributes method, so we can't get the balance.
const shouldVerifyBalance = device.getPlatform() === 'ios'

let balance

// DANGER: If fees get higher the calculation might start failing.
// The test is assuming 0 influence from fees on hte visible number.
const verifyBalance = async (expectedBalance) => {
  if (!shouldVerifyBalance) {
    return
  }
  await waitFor(element(by.id('CeloBalance')))
    .toHaveText(expectedBalance.toString())
    .withTimeout(30000)
}

export default ExchangeCelo = () => {
  it('Go to CELO screen and through onboarding', async () => {
    await element(by.id('Hamburguer')).tap()
    await element(by.id('DrawerItem/CELO')).tap()

    if (await isElementVisible('Education/progressButton')) {
      for (let i = 0; i < 4; i++) {
        await element(by.id('Education/progressButton')).tap()
      }
    }
  })

  it('Buy CELO', async () => {
    // First, save balance for checking later.
    if (shouldVerifyBalance) {
      const attributes = await element(by.id('CeloBalance')).getAttributes()
      balance = parseFloat(attributes.text)
    }

    await waitFor(element(by.id('BuyCelo')))
      .toBeVisible()
      .withTimeout(10000)

    // Tap on the buy button, fill the amount, review and confirm.
    await element(by.id('BuyCelo')).tap()
    await element(by.id('ExchangeInput')).replaceText(CELO_TO_EXCHANGE.toString())
    await element(by.id('ExchangeReviewButton')).tap()
    await element(by.id('ConfirmExchange')).tap()

    // Uncomment if running this file only.
    // await enterPinUi()

    // Return to the Exchange CELO screen and check balance
    await waitFor(element(by.id('BuyCelo')))
      .toBeVisible()
      .withTimeout(10000)
    await verifyBalance(balance + CELO_TO_EXCHANGE)
  })

  it('Sell CELO', async () => {
    // Tap on the sell button, fill the amount, review and confirm.
    await element(by.id('SellCelo')).tap()
    await element(by.id('ExchangeInput')).replaceText(CELO_TO_EXCHANGE.toString())
    await element(by.id('ExchangeReviewButton')).tap()
    await element(by.id('ConfirmExchange')).tap()

    // Return to the Exchange CELO screen and check balance
    await waitFor(element(by.id('BuyCelo')))
      .toBeVisible()
      .withTimeout(10000)
    await verifyBalance(balance)
  })

  it('Withdraw CELO', async () => {
    await waitFor(element(by.id('WithdrawCELO')))
      .toBeVisible()
      .whileElement(by.id('ExchangeScrollView'))
      .scroll(50, 'down')

    // Tap on withdraw, fill data, review and confirm.
    await element(by.id('WithdrawCELO')).tap()
    await waitFor(element(by.id('AccountAddress')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('AccountAddress')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
    await element(by.id('CeloAmount')).replaceText(CELO_TO_SEND)
    await element(by.id('WithdrawReviewButton')).tap()
    await waitFor(element(by.id('ConfirmWithdrawButton')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('ConfirmWithdrawButton')).tap()

    // Uncomment if running this test only.
    // await enterPinUi()

    // Return to the Exchange CELO screen after confirming.
    await waitFor(element(by.id('WithdrawCELO')))
      .toBeVisible()
      .withTimeout(10000)
  })
}
