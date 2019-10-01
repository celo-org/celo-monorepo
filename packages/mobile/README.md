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
