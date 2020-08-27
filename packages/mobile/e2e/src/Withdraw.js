import { enterPinUi } from './utils/utils'
import { DEFAULT_RECIPIENT_ADDRESS } from './utils/consts'

const CELO_TO_SEND = '0.001'

export default Withdraw = () => {
  it('Wallet Home -> Exchange CELO', async () => {
    // Open Hamburguer menu and go to CELO screen.
    await element(by.id('Hamburguer')).tap()
    await waitFor(element(by.id('DrawerItem/CELO')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('DrawerItem/CELO')).tap()
    // Go through the education flow.
    for (let i = 0; i < 4; i++) {
      await element(by.id('Education/progressButton')).tap()
    }
    await waitFor(element(by.id('WithdrawCELO')))
      .toBeVisible()
      .whileElement(by.id('ExchangeScrollView'))
      .scroll(50, 'down')
    // Go to the Withdraw Celo screen and fill the data.
    await element(by.id('WithdrawCELO')).tap()
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
    // Make sure we return to the Exchange CELO screen after confirming.
    await waitFor(element(by.id('WithdrawCELO')))
      .toBeVisible()
      .withTimeout(10000)
  })
}
