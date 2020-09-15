import { enterPinUiIfNecessary, inputNumberKeypad, sleep } from '../utils/utils'
import { DEFAULT_RECIPIENT_ADDRESS } from '../utils/consts'

const AMOUNT_TO_SEND = '0.1'
const RANDOM_COMMENT = 'poker night winnings'

export default Send = () => {
  it('Send cUSD to address', async () => {
    await element(by.id('SendOrRequestBar/SendButton')).tap()

    // Look for an address and tap on it.
    await element(by.id('SearchInput')).tap()
    await element(by.id('SearchInput')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
    await element(by.id('SearchInput')).tapReturnKey()
    await element(by.id('RecipientItem')).tap()

    // Enter the amount and review
    await inputNumberKeypad(AMOUNT_TO_SEND)
    await element(by.id('Review')).tap()

    // Write a comment.
    await element(by.id('commentInput/send')).replaceText(RANDOM_COMMENT)
    await element(by.id('commentInput/send')).tapReturnKey()

    if (device.getPlatform() === 'android') {
      // Workaround keyboard remaining open on Android (tapReturnKey doesn't work there and just adds a new line)
      // so we tap something else in the scrollview to hide the soft keyboard
      await element(by.id('HeaderText')).tap()
    }

    // Wait for the confirm button to be clickable. If it takes too long this test
    // will be flaky :(
    await sleep(3000)

    // Confirm and input PIN if necessary.
    await element(by.id('ConfirmButton')).tap()
    await enterPinUiIfNecessary()

    // Return to home.
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible()
    // TODO(erdal): look for the latest transaction and
    // make sure it was successful
  })

  // TODO: implement Request path
}
