import { enterPinUi, isElementVisible } from './utils/utils'
import { DEFAULT_RECIPIENT_ADDRESS } from './utils/consts'

const CELO_TO_SEND = '0.001'

export default Withdraw = () => {
  it('Go to CELO screen', async () => {
    await element(by.id('Hamburguer')).tap()
    await waitFor(element(by.id('DrawerItem/CELO')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('DrawerItem/CELO')).tap()
  })

  it('Go through onboarding and tap on the withdraw button', async () => {
    if (await isElementVisible('Education/progressButton')) {
      for (let i = 0; i < 4; i++) {
        await element(by.id('Education/progressButton')).tap()
      }
    }
    await waitFor(element(by.id('WithdrawCELO')))
      .toBeVisible()
      .whileElement(by.id('ExchangeScrollView'))
      .scroll(50, 'down')
    await element(by.id('WithdrawCELO')).tap()
  })

  it('Fill the information and confirm withdrawal', async () => {
    await waitFor(element(by.id('AccountAddress')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('AccountAddress')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
    await element(by.id('CeloAmount')).replaceText(CELO_TO_SEND)
    // Tap review to go to the review screen and confirm.
    await element(by.id('WithdrawReviewButton')).tap()
    await waitFor(element(by.id('ConfirmWithdrawButton')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('ConfirmWithdrawButton')).tap()
    // Uncomment if running this file only.
    // await enterPinUi()
  })

  it('Return to the Exchange CELO screen after confirming.', async () => {
    await waitFor(element(by.id('WithdrawCELO')))
      .toBeVisible()
      .withTimeout(10000)
  })
}
