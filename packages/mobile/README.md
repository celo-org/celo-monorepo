# Mobile (Celo Wallet)

## Overview

This is a wallet application for the [Celo platform].
It's a self-soverign wallet that enables anyone to onboard onto the Celo network, manage their currencies, and send payments.

![](https://storage.googleapis.com/celo-website/docs/wallet-preview.png)

## Architecture

The app uses [React Native][react native] and a geth [light node][light node].

## Setup

You need to install Java 8, the Android SDK, Yarn, and Node 8 to run the app.

To do this, follow the [setup instructions][setup]

### (_Optional_) Gradle improvement

This makes Gradle faster:

```bash
export GRADLE_OPTS='-Dorg.gradle.daemon=true -Dorg.gradle.parallel=true -Dorg.gradle.jvmargs="-Xmx4096m -XX:+HeapDumpOnOutOfMemoryError"'
```

## Running

1.  If you haven't already, run `yarn` from the monorepo root to install dependencies.

2.  Attach your device or start an emulated one.

    You can verify if your device is properly connecting to ADB with `adb devices`.
    More information about running the app on Android devices can be found on the
    [React Native docs][rn running on device].

3.  Compile the project and start the bundler with

    ```bash
    yarn run dev
    ```

    This will build the app in a device (physical or emulated) and open a
    terminal with a js server.

    **Note:** We've seen some issues running the metro bundler from iTerm

### Debugging

In order to debug, you should run:

```bash
yarn run dev:show-menu
```

A menu will pop-up in the app and you should hit `Start Remote JS Debugging`.
This will open a new tab in your browser with React Native logger in the
console. In order to get a full picture, the console's filter should be set to
`All levels`.

You will probably want to open the dev menu again and enable `Live Reloading`
and `Hot Reloading` to make development faster.

#### (_Optional_) React Native debugger app

The [RN debugger app][rn debugger] bundles together the Redux and Chrome dev
tools nicely.

### App Profiling

Start the emulator and load up the app. Then run the following to start react
devtools.

```bash
yarn run react-devtools
```

It should automatically connect to the running app, and includes a profiler
(second tab). Start recorder with the profiler, using the app, and the stop
recording. The flame graph provides a view of each component and sub-component.
The width is proportional to how long it took to load. If it is grey, it was not
re-rendered at that 'commit' or DOM change. Details on the react native profiler
are [here][rn profiler]. The biggest thing to look for are large number of
renders when no state has changed. Reducing renders can be done via pure
components in react or overloading the should component update method
[example here][rn optimize example].

### Connecting to networks

By default, we have the `alfajores` network set up. If you have other testnets
that you want to use with the app, update `.env.ENV-NAME` and `packages/mobile/.env.ENV-NAME` with the new network name and settings, then run

```bash
yarn run build-sdk TESTNET
```

before rebuilding the app. Note that this will assume the testnets have a corresponding `/blockchain-api` and `/notification-service` set up.

## Testing

To execute the suite of tests, run `yarn test`

### Snapshot testing

We use Jest [snapshot testing][jest] to assert that no intentional changes to the
component tree have been made without explicit developer intention. See an
example at [`src/send/SendAmount.test.tsx`]. If your snapshot is expected
to deviate, you can update the snapshot with the `-u` or `--updateSnapshot`
flag when running the test.

### React Component Unit Testing

We use [react-native-testing-library][react-native-testing-library] to unit test
react components. It allows for deep rendering and interaction with the rendered
tree to assert proper reactions to user interaction and input. See an example at
[`src/send/SendAmount.test.tsx`] or read more about the [docs][rntl-docs]

### Saga testing

We use [redux-saga-test-plan][redux-saga-test-plan] to test complex sagas.
See [`src/identity/verification.test.ts`] for an example.

### E2E testing

We use [Detox][detox] for E2E testing. In order to run the tests locally, you
must have the proper emulator set up. Emulator installation instructions are in
the [setup instructions][setup#emulator].

Please set `123456` as the pin code in the emulator, since the e2e tests rely on
that.

Next, the VM snapshot settings should be modified:

1.  Close all apps and lock the emulator (go to lock screen).
2.  Power off the emulator
3.  Power it back on and go to emulator settings (... button) -> Snapshots -> Settings
4.  Set Auto-Save to No

For information on how to run and extend the e2e tests, refer to the
[e2e readme][e2e readme].

## Building APKs / Bundles

The app can be build via the command line or in Android Studio.
For an exact set of commands, refer to the lanes in `fastlane/FastFile`.
For convinience, the basic are described below:

### Creating a fake keystore

If you have not yet created a keystore, one will be required to generate a release APKs / bundles:

```sh
cd android/app
keytool -genkey -v -keystore celo-release-key.keystore -alias celo-key-alias -storepass celoFakeReleaseStorePass -keypass celoFakeReleaseKeyPass -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
export CELO_RELEASE_STORE_PASSWORD=celoFakeReleaseStorePass
export CELO_RELEASE_KEY_PASSWORD=celoFakeReleaseKeyPass
```

### Building an APK or Bundle

```sh
# With fastlane:
bundle install
bundle exec fastlane android build_apk env:YOUR_BUILDING_VARIANT sdkEnv:YOUR_SDK_ENV

# Or, manually
cd android/
./gradlew clean
./gradlew bundle{YOUR_BUILDING_VARIANT}JsAndAssets
# For an APK:
./gradlew assemble{YOUR_BUILDING_VARIANT} -x bundle{YOUR_BUILDING_VARIANT}JsAndAssets
# Or for a bundle:
./gradlew bundle{YOUR_BUILDING_VARIANT} -x bundle{YOUR_BUILDING_VARIANT}JsAndAssets
```

Where `YOUR_BUILD_VARIANT` can be any of the app's build variants, such as debug or release.

## Generating GraphQL Types

We're using [GraphQL Code Generator][graphql code generator] to properly type
GraphQL queries. If you make a change to a query, run `yarn build:gen-graphql-types` to update the typings in the `typings` directory.

## Running Wallet app in ZeroSync mode

By default, the mobile wallet app runs geth in ultralight sync mode where all the epoch headers are fetched. The default sync mode is defined in [packages/mobile/.env](https://github.com/celo-org/celo-monorepo/blob/master/packages/mobile/.env#L4) file.

# To run wallet in zero sync mode, where it would connect to the remote nodes and sign transactions in web3, change the default sync mode in the aforementioned file to -1. The mode has only been tested on Android and is hard-coded to be [crash](https://github.com/celo-org/celo-monorepo/blob/aeddeefbfb230db51d2ef76d50c5f882644a1cd3/packages/mobile/src/web3/contracts.ts#L73) on iOS.

## How we handle Geth crashes in wallet app on Android

Our Celo app has three types of codes.

1.  Javascript code - generated from Typescript, this runs in Javascript interpreter.
2.  Java bytecode - This runs on Dalvik/Art Virtual Machine.
3.  Native code - Geth code is written in Golang which compiles to native code - this runs directly on the
    CPU, no virtual machines involved.

One should note that, on iOS, there is no byte code and therefore, there are only two layers, one is the Javascript code, and the other is the Native code. Till now, we have been blind towards native crashes except Google Playstore logs.

Sentry, the crash logging mechanism we use, can catch both Javascript Errors as well as unhandled Java exceptions. It, however, does not catch Native crashes. There are quite a few tools to catch native crashes like [Bugsnag](https://www.bugsnag.com) and [Crashlytics](https://firebase.google.com/products/crashlytics). They would have worked for us under normal circumstances. However, the Geth code produced by the Gomobile library and Go compiler logs a major chunk of information about the crash at Error level and not at the Fatal level. We hypothesize that this leads to incomplete stack traces showing up in Google Play store health checks. This issue is [publicly known](https://github.com/golang/go/issues/25035) but has not been fixed.

We cannot use libraries like [Bugsnag](https://www.bugsnag.com) since they do not allow us to extract logcat logs immediately after the crash. Therefore, We use [jndcrash](https://github.com/ivanarh/jndcrash), which uses [ndcrash](https://github.com/ivanarh/ndcrash) and enable us to log the logcat logs immediately after a native crash. We capture the results into a file and on next restart Sentry reads it. We need to do this two-step setup because once a native crash happens, running code to upload the data would be fragile. An error in sentry looks like [this](https://sentry.io/organizations/celo/issues/918120991/events/48285729031/)

Relevant code references:

1.  [NDKCrashService](https://github.com/celo-org/celo-monorepo/blob/master/packages/mobile/android/app/src/main/java/org/celo/mobile/NdkCrashService.java)
2.  [Initialization](https://github.com/celo-org/celo-monorepo/blob/8689634a1d10d74ba6d4f3b36b2484db60a95bdb/packages/mobile/android/app/src/main/java/org/celo/mobile/MainApplication.java#L156) of the NDKCrashService
3.  [Sentry code](https://github.com/celo-org/celo-monorepo/blob/799d74675dc09327543c210e88cbf5cc796721a0/packages/mobile/src/sentry/Sentry.ts#L53) to read NDK crash logs on restart

There are two major differencs in ZeroSync mode:

1.  Geth won't run at all. The web3 would instead connect to <testnet>-infura.celo-testnet.org using an https provider, for example, [https://integration-infura.celo-testnet.org](https://integration-infura.celo-testnet.org).
2.  Changes to [sendTransactionAsyncWithWeb3Signing](https://github.com/celo-org/celo-monorepo/blob/8689634a1d10d74ba6d4f3b36b2484db60a95bdb/packages/walletkit/src/contract-utils.ts#L362) in walletkit to poll after sending a transaction for the transaction to succeed. This is needed because http provider, unliked web sockets and IPC provider, does not support subscriptions.

#### Why http(s) provider?

Websockets (`ws`) would have been a better choicee but we cannot use unencrypted `ws` provider since it would be bad to send plain-text data from a privacy perspective. Geth does not support `wss` by [default](https://github.com/ethereum/go-ethereum/issues/16423). And Kubernetes does not support it either. This forced us to use https provider.

## Troubleshooting

### `Activity class {org.celo.mobile.staging/org.celo.mobile.MainActivity} does not exist.`

From time to time the app refuses to start showing this error:

```text
557 actionable tasks: 525 executed, 32 up-to-date
info Running /usr/local/share/android-sdk/platform-tools/adb -s PL2GARH861213542 reverse tcp:8081 tcp:8081
info Starting the app on PL2GARH861213542 (/usr/local/share/android-sdk/platform-tools/adb -s PL2GARH861213542 shell am start -n org.celo.mobile.staging/org.celo.mobile.MainActivity)...
Starting: Intent { cmp=org.celo.mobile.staging/org.celo.mobile.MainActivity }
Error type 3
Error: Activity class {org.celo.mobile.staging/org.celo.mobile.MainActivity} does not exist.
```

Solution:

```bash
$ adb kill-server && adb start-server
* daemon not running; starting now at tcp:5037
* daemon started successfully
```

[celo platform]: https://celo.org
[`src/components/bottombutton.test.tsx`]: ./src/components/BottomButton.test.tsx
[detox]: https://github.com/wix/Detox
[e2e readme]: ./e2e/README.md
[enzyme]: https://airbnb.io/enzyme/docs/guides/react-native.html
[graphql code generator]: https://github.com/dotansimha/graphql-code-generator
[light node]: https://github.com/ethereum/wiki/wiki/Light-client-protocol
[protocol readme]: ../protocol/README.md
[react native]: https://facebook.github.io/react-native/
[rn debugger]: https://github.com/jhen0409/react-native-debugger
[rn optimize example]: https://reactjs.org/docs/optimizing-performance.html#examples
[rn profiler]: https://reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html
[rn running on device]: https://facebook.github.io/react-native/docs/running-on-device
[setup]: ../../SETUP.md
[setup#emulator]: ../../SETUP.md#optional-install-an-android-emulator
[react-native-testing-library]: https://github.com/callstack/react-native-testing-library
[rntl-docs]: https://callstack.github.io/react-native-testing-library/
[jest]: https://jestjs.io/docs/en/snapshot-testing
[redux-saga-test-plan]: https://github.com/jfairbank/redux-saga-test-plan
