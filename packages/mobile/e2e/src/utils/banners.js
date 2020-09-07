// clicks an element if it sees it
async function bannerDismiss(inElement, tapElement) {
  try {
    await waitFor(element(inElement))
      .toBeVisible()
      .withTimeout(500)
    if (tapElement) {
      await element(tapElement).tap()
    } else {
      await element(inElement).tap()
    }
  } catch (e) {
    // TODO take a screenshot
  }
}

export default dismissBanners = async () => {
  await bannerDismiss(by.id('errorBanner'))
  await bannerDismiss(by.id('SmartTopAlertButton'))
}
