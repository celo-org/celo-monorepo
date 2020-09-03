# End-to-End tests

[![e2e test status](https://storage.googleapis.com/celo-e2e-data/e2e-banner.svg)](https://console.cloud.google.com/storage/browser/celo-e2e-data?project=celo-testnet)

These are the End-to-End (e2e) tests for the wallet mobile app. They run an emulator and simulate a user clicking through the app.

## Setting up the VM

### Android

First install the emulator as described in the [SETUP readme](../../../SETUP.md#optional-install-an-android-emulator).

By default, the e2e scripts will assume the VM name of `Pixel_API_29_AOSP_x86_64` recommended in the instructions but you can rename the VM as you like.

Next, to improve reliability of the tests, configure the VM as described in the [Detox best practices doc](https://github.com/wix/Detox/blob/master/docs/Introduction.AndroidEmulatorsBestPractices.md).

### iOS

Ensure you have Xcode installed.

Install [AppleSimulatorUtils](https://github.com/wix/AppleSimulatorUtils#installing) which is used in e2e scripts to launch the iOS simulator.

## Running the tests

Simply run `yarn test:e2e:android` or `yarn test:e2e:ios`

The run_e2e.sh script will take care of configuring and building the app for you.

## Adding a test

There is one main file called `TestRunner.spec.js` which calls the specific tests for each use case which live in the root of the `src` folder.

While developing and adding new tests, it's useful to run only the ones we are working on and not go through the onboading on each run. To do this, the following strategy might be useful:
- First, go to `TestRunner` and comment out or skip all tests except the `Onboarding` one.
- Run `yarn test:e2e:ios`. Wait while the app goes through the onboarding process.
- If the tests passes you should see the Wallet Home screen.
- Run `yarn test:e2e:packager` to start the packager.
- Comment out or skip the `Onboarding` test and uncomment or unskip whatever test you would like to run or develop against.
- Run `yarn test:e2e:ios -d`. The `-d` flag will prevent the app from reinstalling and reuse the previous install and will not restart the packager.

When doing the steps above note that some tests will require the PIN if run standalone but not require it if run after the rest of the tests because a previous one already set it.

For most e2e tests you will only need to do three things:

- Finding elements using `element(by.id('SomeTestID'))`: You give the element you want to find a testID, then you can reliably find it, if it's on screen.
- Performing actions on the element like `element.tap()` or `element.typeText('Some Text ')`. Detox will automatically wait for these actions to finish.
- Testing properties of the element using expectations, like `expect(element).toBeVisible()`. You will mostly need `.toBeVisible()` and `.toHaveText()`.

For more information about Detox, check out the [API reference](https://github.com/wix/Detox/blob/master/docs/README.md#api-reference)

### Example

A simple test might look like this:

```javascript
it('has a button to select the language', async () => {
  await element(by.id('ChooseLanguage/en-US')).tap()
  await element(by.id('ChooseLanguageButton')).tap()
  await expect(element(by.id(`ButtonSkipToInvite`))).toBeVisible()
})
```

Detox will now look for an element with the testID 'ChooseLanguage/en-US' and then tap on it. Detox will automatically wait for the app to react to the action. Since we are performing an action with this test, this is an 'actions' test.
After english was selected, detox will tap the button to submit our language of choice. Detox will now wait until the next screen (the sync screen). On that screen is a button to skip to the Invite screen, and the last line checks that the button is there. If the button is there, we know that pressing the 'ChooseLanguageButton' worked.

The function needs to be `async`, and you will need to `await` all calls to detox functions.

## Adding TestIDs

A TestID is a unique string that you should give to the components you want to test. The build-in components from react native support adding testIDs like this:

```jsx
<button testID='SubmitButtonOnPaymentScreen'>
```

You should try to make your testIDs unique by describing the purpose of the element with reference to the screen it is on.

### Adding TestIDs to custom components

Usually, you will want to pass the testID as a prop from your custom component to some child component. Sometimes is makes sense to automatically generate the testID based on existing props. If you need to identify multiple child components, you should generate their testID from the testID of your custom component, for example:

```jsx
class ExampleInput extends React.Component {
  render() {
    return (
      <View testID={this.props.testID}>
        <Field testID={`${this.props.testID}/InputField`} />
        <Button testID={`${this.props.testID}/SubmitButton`} />
      </View>
    )
  }
}
```

It is recommended to follow the scheme parentID/ChildDescription.

## Mocks for the e2e tests

The e2e tests should use as few mocks as possible, since they are supposed to be as close to the real app as possible. They also don't change in between tests. all e2e test use the same build of the app. But sometimes it is necessary to mock a module.

The mocks are only used, when the environment variable `CELO_TEST_CONFIG` is set too 'e2e'. This variable will be read in `mobile/rn-cli.config.js` and will modify what the metro bundler will include in the bundle. If you're mocking a module from node_nodules, put the mock in `e2e/mocks/`. Use the file extension `.e2e.ts` or `.e2e.js`.

## The e2e banner

In the readme files (in the root, mobile, and this one), there are banners for the e2e tests. The test status is saved in a [google cloud storage bucket](https://console.cloud.google.com/storage/browser/celo-e2e-data?project=celo-testnet).
There is also a log file for the last test run.

Too see all the versions of the log file:

```bash
gsutil ls -al  gs://celo-e2e-data/last_run_log
```

Too display a specific version of the log file:

```bash
gsutil cat  gs://celo-e2e-data/last_run_log#<version_number>
gsutil cat  gs://celo-e2e-data/last_run_log   #specify no version number to get the latest
```

If you need to have a more detailed look, there is a collection of log files and even screenshots for the failing tests saved in `detailed_logs.tar.gz`. Download with:

```bash
  gsutil cp gs://celo-e2e-data/detailed_logs.tar.gz .
  tar -xvf detailed_logs.tar.gz
```

These files are uploaded by by the [a script](../scripts/ci-e2e.sh), that is executed regularly. Don't use this script to run the tests locally.

## Troubleshooting

If tests are failing, and you don't know why:

- Rebuild, re-yarn and rerun. Sometimes the problem just goes away.
- Delete snapshots in the emulator
- Look at the emulator while the tests are running. Can you see anything obvious going wrong?
