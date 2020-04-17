# Mobile (Celo Wallet)
      - [Java](#java)
      - [Install Android Dev Tools](#install-android-dev-tools)
      - [Install iOS Dev Tools](#install-ios-dev-tools)



            - [Installing OpenJDK 8](#installing-openjdk-8)
      - [Install Android Dev Tools](#install-android-dev-tools-1)






      - [Optional: Install an Android Emulator](#optional-install-an-android-emulator)
      - [Optional: Genymotion](#optional-genymotion)
        - [MacOS](#macos-1)
        - [Linux](#linux-1)
    - [Building celo-monorepo](#building-celo-monorepo)
  - [Using an Android test device locally](#using-an-android-test-device-locally)

  // MacOS


#### Optional: Install an Android Emulator

Install the Android 28 system image and create an Android Virtual Device:

```bash
sdkmanager "system-images;android-28;google_apis;x86"
avdmanager create avd --force --name Nexus_5X_API_28_x86 --device "Nexus 5X" -k "system-images;android-28;google_apis;x86" --abi "google_apis/x86"
```

Execute the following and add it to your `~/.bash_profile`:

```bash
export PATH=$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$PATH
```

Run the emulator with:

```bash
emulator -avd Nexus_5X_API_28_x86
```

#### Optional: Install Genymotion Emulator Manager

Optionally, as alternative to other emulators you can install Genymotion

##### MacOS

```bash
brew cask install genymotion
```

Under OSX High Sierra and later, you'll get a message that you need to
[approve it in System Preferences > Security & Privacy > General][approve kernel extension].

Do that, and then repeat the line above.

Then make sure the ADB path is set correctly in Genymotion — set
`Preferences > ADB > Use custom Android SDK tools` to
`/usr/local/share/android-sdk` (same as `$ANDROID_HOME`)

##### Linux

You can download the Linux version of Genymotion from the [fun zone!](https://www.genymotion.com/fun-zone/) (you need to sign in first).

After having the binary you only need to run the installer:

```
sudo ./genymotion-3.0.2-linux_x64.bin
```

  #### Java

We need Java to be able to build and run Android to deploy the mobile app to
test devices. Android currently only builds correctly with Java 8. (Using
OpenJDK because of [Oracle being Oracle][oracle being oracle])

```bash
brew install cask
brew tap homebrew/cask-versions
brew cask install homebrew/cask-versions/adoptopenjdk8
```

Optionally, install Jenv to manage multiple Java versions

```bash
brew install jenv
eval "$(jenv init -)"
jenv add /Library/Java/JavaVirtualMachines/<java8 version here>/Contents/Home
```

#### Install Android Dev Tools

Install the Android SDK and platform tools:

```bash
brew cask install android-sdk
brew cask install android-platform-tools
```

Next install [Android Studio][android studio] and add the [Android NDK][android ndk]

Execute the following (and make sure the lines are in your `~/.bash_profile`):

```bash
export ANDROID_HOME=/usr/local/share/android-sdk
export ANDROID_NDK=/usr/local/share/android-ndk
export ANDROID_SDK_ROOT=/usr/local/share/android-sdk
export GRADLE_OPTS='-Dorg.gradle.daemon=true -Dorg.gradle.parallel=true -Dorg.gradle.jvmargs="-Xmx4096m -XX:+HeapDumpOnOutOfMemoryError"'
```

Then install the Android 28 platform:

```bash
sdkmanager 'platforms;android-28'
```

#### Install iOS Dev Tools

Install [Xcode 10.3](https://download.developer.apple.com/Developer_Tools/Xcode_10.3/Xcode_10.3.xip) (an Apple Developer Account is needed to access this link).
(If after signing in the the direct link does not work try finding on https://developer.apple.com/download/more/)

We do not recommend installing Xcode through the App Store as it can auto update and become incompatible with our projects (until we decide to upgrade).

Note that using the method above, you can have multiple versions of Xcode installed in parallel by using different app names. For instance `Xcode10.3.app` and `Xcode11.app` inside the `/Applications` folder.

Install Cocopods `gem install cocoapods`

From ios folder in mobile package run `bundle exec pod install`

//

// linux

#### Installing OpenJDK 8

```
sudo apt install openjdk-8-jdk
```

#### Install Android Dev Tools

You can download the complete Android Studio and SDK from the [Android Developer download site](https://developer.android.com/studio/#downloads).

The steps are:

1.  Unpack the .zip file you downloaded to an appropriate location for your applications, such as within `/usr/local/` for your user profile, or `/opt/` for shared users.

    If you're using a 64-bit version of Linux, make sure you first install the [required libraries for 64-bit machines](https://developer.android.com/studio/install#64bit-libs).

1.  To launch Android Studio, open a terminal, navigate to the `android-studio/bin/` directory, and execute `studio.sh`.

1.  Select whether you want to import previous Android Studio settings or not, then click OK.

1.  The Android Studio Setup Wizard guides you through the rest of the setup, which includes downloading Android SDK components that are required for development.

You can find the complete instructions about how to install the tools in Linux environments in the [Documentation page](https://developer.android.com/studio/install#linux).

//

## Using an Android test device locally

First, follow [these instructions to enable Developer Options][android dev options]
on your Android.

Plug in a USB cable and you'll be prompted to accept the connection and shown a
public key (corresponding to the `abd_key.pub` file in `~/.android`)

Then, running:

```bash
adb devices
```

should show something like:

```text
List of devices attached
8XEBB18414424157    device
```

If it lists a device as "unauthorized", make sure you've accepted the prompt or
[troubleshoot here][device unauthorized].

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

## Running the App

1.  If you haven't already, run `yarn` from the monorepo root to install dependencies.

2.  Attach your device or start an emulated one.

    You can verify if your device is properly connecting to ADB with `adb devices`.
    More information about running the app on Android devices can be found on the
    [React Native docs][rn running on device].

3.  Compile the project and start the bundler with

    ```bash
    yarn run dev:android
    OR
    yarn run dev:ios
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

### Running Wallet app in forno (Data Saver) mode

By default, the mobile wallet app runs geth in ultralight sync mode where all the epoch headers are fetched. The default sync mode is defined in [packages/mobile/.env](https://github.com/celo-org/celo-monorepo/blob/master/packages/mobile/.env#L4) file.

To run the wallet in forno (Data Saver) mode, using a trusted node rather than the local geth node as a provider, turn it on from the Data Saver page in settings or update the `FORNO_ENABLED_INITIALLY` parameter in the .env file linked above. When forno mode is turned back off, the wallet will switch to the default sync mode as specified in the .env file. By default, the trusted node is `https://{TESTNET}-forno.celo-testnet.org`, however any trusted node can be used by updating `DEFAULT_FORNO_URL`. In forno mode, the wallet signs transactions locally in web3 then sends them to the trusted node.

To debug network requests in forno mode, we use Charles, a proxy for monitoring network traffic to see Celo JSON RPC calls and responses. Follow instructions [here](https://community.tealiumiq.com/t5/Tealium-for-Android/Setting-up-Charles-to-Proxy-your-Android-Device/ta-p/5121) to configure Charles to proxy a test device.

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
must have the proper emulator set up. Follow the instrutions in [e2e/README.md][e2e readme].

Once setup is done, you can run the tests with `yarn test:e2e:android`

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

## Configuring the SMS Retriever

On android, the wallet app uses the SMS Retriever API to automatically input codes during phone number verification.

The service that route SMS messages to the app needs to be configured to [append this app signature to the message][sms retriever].
The hash depends on both the bundle id and the signing certificate. Since we use Google Play signing, we need to download the certificate.

1.  Go to the play console for the relevant app, Release management > App signing, and download the App signing certificate.
2.  Use this script to generate the hash code: https://github.com/michalbrz/sms-retriever-hash-generator

## Generating GraphQL Types

We're using [GraphQL Code Generator][graphql code generator] to properly type
GraphQL queries. If you make a change to a query, run `yarn build:gen-graphql-types` to update the typings in the `typings` directory.

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

There are two major differences in Forno mode:

1.  Geth won't run at all. Instead, web3 connects to <testnet>-forno.celo-testnet.org using an https provider, for example, [https://integration-forno.celo-testnet.org](https://integration-forno.celo-testnet.org).

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
[react-native-testing-library]: https://github.com/callstack/react-native-testing-library
[rntl-docs]: https://callstack.github.io/react-native-testing-library/
[jest]: https://jestjs.io/docs/en/snapshot-testing
[redux-saga-test-plan]: https://github.com/jfairbank/redux-saga-test-plan
[sms retriever]: https://developers.google.com/identity/sms-retriever/verify#1_construct_a_verification_message
[android dev options]: https://developer.android.com/studio/debug/dev-options
[android ndk]: https://developer.android.com/ndk/guides
[android studio]: https://developer.android.com/studio
[approve kernel extension]: https://developer.apple.com/library/content/technotes/tn2459/_index.html
[oracle being oracle]: https://github.com/Homebrew/homebrew-cask-versions/issues/7253
[device unauthorized]: https://stackoverflow.com/questions/23081263/adb-android-device-unauthorized
