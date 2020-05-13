# Mobile (Celo Wallet)

- [Mobile (Celo Wallet)](<#mobile-(celo-wallet)>)
  - [Overview](#overview)
  - [Architecture](#architecture)
  - [Setup](#setup)
    - [iOS](#ios)
      - [Enroll in the Apple Developer Program](#enroll-in-the-apple-developer-program)
      - [Install XCode](#install-xcode)
      - [Install Cocopods, Bundler, and download project dependencies](#install-cocopods-bundler-and-download-project-dependencies)
    - [Android](#android)
      - [Install Java](#install-java)
      - [Install Android Dev Tools](#install-android-dev-tools)
      - [Optional: Install an Android emulator](#optional-install-an-android-emulator)
  - [Running the mobile wallet](#running-the-mobile-wallet)
    - [iOS](#ios-1)
    - [Android](#android-1)
    - [Running in forno (data saver) mode](<#running-in-forno-(data-saver)-mode>)
  - [Debugging & App Profiling](#debugging-&-app-profiling)
    - [Debugging](#debugging)
      - [Optional: Install React Native Debugger](#optional-install-react-native-debugger)
    - [App Profiling](#app-profiling)
  - [Testing](#testing)
    - [Snapshot testing](#snapshot-testing)
    - [React component unit testing](#react-component-unit-testing)
    - [Saga testing](#saga-testing)
    - [End-to-End testing](#end-to-end-testing)
  - [Building APKs / Bundles](#building-apks-/-bundles)
    - [Creating a fake keystore](#creating-a-fake-keystore)
    - [Building an APK or Bundle](#building-an-apk-or-bundle)
  - [Other](#other)
    - [Configuring the SMS Retriever](#configuring-the-sms-retriever)
    - [Generating GraphQL Types](#generating-graphql-types)
    - [How we handle Geth crashes in wallet app on Android](#how-we-handle-geth-crashes-in-wallet-app-on-android)
    - [Why do we use http(s) provider?](<#why-do-we-use-http(s)-provider?>)
    - [Troubleshooting](#troubleshooting)
      - [`Activity class {org.celo.mobile.staging/org.celo.mobile.MainActivity} does not exist.`](#activity-class-orgcelomobilestagingorgcelomobilemainactivity-does-not-exist)

## Overview

This is a wallet application for the [Celo platform].
It's a self-soverign wallet that enables anyone to onboard onto the Celo network, manage their currencies, and send payments.

![](https://storage.googleapis.com/celo-website/docs/wallet-preview.png)

## Architecture

The app uses [React Native][react native] and a geth [light node][light node].

## Setup

**You must have the [celo-monorepo] successfully set up and built before setting up and running the mobile wallet.**

To do this, follow the [setup instructions][setup].

Next, install [watchman][watchman].

```bash
# On a mac
brew install watchman
```

### iOS

#### Enroll in the Apple Developer Program

In order to successfully set up your iOS development environment you will need to enroll in the [Apple Developer Program]. It is recommended that you enroll from an iOS device by downloading the Apple Developer App in the App Store. Using the app will result in the fastest processing of your enrollment.

_If you are a cLabs employee, please ask to be added to the cLabs iOS development team._

#### Install XCode

XCode is needed to build and deploy the mobile wallet to your iOS device. If you do not have an iOS device, Xcode can be used to emulate one.

Install [Xcode 11.4](https://developer.apple.com/download/more/?q=xcode) (an Apple Developer Account is needed to access this link).

We do not recommend installing Xcode through the App Store as it can auto update and become incompatible with our projects.

Note that using the method above, you can have multiple versions of Xcode installed in parallel if you'd like. Simply use different names for the different version of XCode in your computer's `Applications` folder (e.g., `Xcode10.3.app` and `Xcode11.app`).

#### Install Cocopods, Bundler, and download project dependencies

Make sure you are in the `ios` directory of the `mobile` package before running the following:

```bash
# install cocopods and bundler if you don't already have it
gem install cocoapods
gem install bundler
# download the project dependencies
bundle install
# run inside mobile/ios
bundle exec pod install
```

If your machine does not recognize the `gem` command, you may need to [download Ruby](https://rubyinstaller.org/) first.

### Android

#### Install Java

We need Java to be able to build and deploy the mobile app to Android devices. Android currently only builds correctly with Java 8. (Using OpenJDK because of [Oracle being Oracle][oracle being oracle]).

##### MacOS

Install by running the following:

```bash
brew install cask
brew tap homebrew/cask-versions
brew cask install homebrew/cask-versions/adoptopenjdk8
```

Alternatively, install Jenv to manage multiple Java versions:

```bash
brew install jenv
eval "$(jenv init -)"
jenv add /Library/Java/JavaVirtualMachines/<java8 version here>/Contents/Home
```

##### Linux

Install by running the following:

```
sudo apt install openjdk-8-jdk
```

#### Install Android Dev Tools

##### MacOS

Install the Android SDK and platform tools:

```bash
brew cask install android-sdk
brew cask install android-platform-tools
```

Next install [Android Studio][android studio] and add the [Android NDK][android ndk].

Execute the following (and make sure the lines are in your `~/.bash_profile`).

_Note that these paths may differ on your machine. You can find the path to the SDK and NDK via the [Android Studio menu](https://stackoverflow.com/questions/40520324/how-to-find-the-path-to-ndk)._
```bash
export ANDROID_HOME=/usr/local/share/android-sdk
export ANDROID_NDK=/usr/local/share/android-ndk
export ANDROID_SDK_ROOT=/usr/local/share/android-sdk
# this is an optional gradle configuration that should make builds faster
export GRADLE_OPTS='-Dorg.gradle.daemon=true -Dorg.gradle.parallel=true -Dorg.gradle.jvmargs="-Xmx4096m -XX:+HeapDumpOnOutOfMemoryError"'
```

Then install the Android 28 platform:

```bash
sdkmanager 'platforms;android-28'
```

##### Linux

You can download the complete Android Studio and SDK from the [Android Developer download site](https://developer.android.com/studio/#downloads).

The steps are:

1.  Unpack the .zip file you downloaded to an appropriate location for your applications, such as within `/usr/local/` for your user profile, or `/opt/` for shared users.

    If you're using a 64-bit version of Linux, make sure you first install the [required libraries for 64-bit machines](https://developer.android.com/studio/install#64bit-libs).

2.  To launch Android Studio, open a terminal, navigate to the `android-studio/bin/` directory, and execute `studio.sh`.

3.  Select whether you want to import previous Android Studio settings or not, then click OK.

4.  The Android Studio Setup Wizard guides you through the rest of the setup, which includes downloading Android SDK components that are required for development.

You can find the complete instructions about how to install the tools in Linux environments in the [Documentation page](https://developer.android.com/studio/install#linux).

#### Optional: Install an Android emulator

##### Configure an emulator using the Android SDK Manager

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

##### Install Genymotion Emulator Manager

Another Android emulator option is Genymotion.

###### MacOS

```bash
brew cask install genymotion
```

Under OSX High Sierra and later, you'll get a message that you need to
[approve it in System Preferences > Security & Privacy > General][approve kernel extension].

Do that, and then repeat the line above.

Then make sure the ADB path is set correctly in Genymotion — set
`Preferences > ADB > Use custom Android SDK tools` to
`/usr/local/share/android-sdk` (same as `$ANDROID_HOME`)

###### Linux

You can download the Linux version of Genymotion from the [fun zone!](https://www.genymotion.com/fun-zone/) (you need to sign in first).

After having the binary you only need to run the installer:

```
sudo ./genymotion-3.0.2-linux_x64.bin
```

## Running the mobile wallet

The below steps should help you successfully run the mobile wallet on either a USB connected or emulated device. For additional information and troublshooting see the [React Native docs][rn running on device].

**Note:** We've seen some issues running the metro bundler from iTerm

1. If you haven't already, run `yarn` from the monorepo root to install dependencies.

2. Attach your device or start an emulated one.

### iOS

3. Launch Xcode and use it to open the directory `celo.xcworkspace`. Confirm your iOS device has been detected by XCode.

4. Build the project by pressing the play button in the top left corner or selecting `Product > Build` from the XCode menu bar.

5. From the `mobile` directory run `yarn run dev:ios`.

### Android

3. Follow [these instructions to enable Developer Options][android dev options] on your Android device.

4. Unplug and replug your device. You'll be prompted to accept the connection and shown a public key (corresponding to the `abd_key.pub` file in `~/.android`)

5. To confirm your device is properly connected, running `adb devices` from the terminal should reflect your connected device. If it lists a device as "unauthorized", make sure you've accepted the prompt or [troubleshoot here][device unauthorized].

6. From the `mobile` directory run `yarn run dev:android`.

### Running in forno (data saver) mode

By default, the mobile wallet app runs geth in lightest sync mode where all the epoch headers are fetched. The default sync mode is defined in [packages/mobile/.env](https://github.com/celo-org/celo-monorepo/blob/master/packages/mobile/.env#L4) file.

To run the wallet in forno (Data Saver) mode, using a trusted node rather than the local geth node as a provider, turn it on from the Data Saver page in settings or update the `FORNO_ENABLED_INITIALLY` parameter in the .env file linked above. When forno mode is turned back off, the wallet will switch to the default sync mode as specified in the .env file. By default, the trusted node is `https://{TESTNET}-forno.celo-testnet.org`, however any trusted node can be used by updating `DEFAULT_FORNO_URL`. In forno mode, the wallet signs transactions locally in web3 then sends them to the trusted node.

To debug network requests in forno mode, we use Charles, a proxy for monitoring network traffic to see Celo JSON RPC calls and responses. Follow instructions [here](https://community.tealiumiq.com/t5/Tealium-for-Android/Setting-up-Charles-to-Proxy-your-Android-Device/ta-p/5121) to configure Charles to proxy a test device.

## Debugging & App Profiling

### Debugging

_To avoid debugging errors, ensure your device and laptop are connected to the same WiFi network even if they are connected via USB._

1. Either shake the device or run `yarn run dev:show-menu` (only for Android) to open up the developer menu.

2. Select `Debug` (iOS) or `Start Remote JS Debugging` (Android). This should open a new tab in your browser with React Native logger in the console. In order to get a full picture, the console's filter should be set to
   `All levels`.

3. For the fastest development experience, you likely want to open the developer menu again and ensure `Fast Reloading` (iOS) or `Live Reloading` and `Hot Reloading` (Android) is enabled.

#### Optional: Install React Native Debugger

The [React Native Debugger][rn debugger] bundles together the Redux and Chrome dev tools nicely and provides a clean debugging environment.

### App Profiling

Run `yarn run react-devtools`. It should automatically connect to the running app, and includes a profiler (second tab). Start recording with the profiler, use the app, and then stop recording.

The flame graph provides a view of each component and sub-component. The width is proportional to how long it took to load. If it is grey, it was not re-rendered at that 'commit' or DOM change. Details on the react native profiler are [here][rn profiler]. The biggest thing to look for are large number of renders when no state has changed. Reducing renders can be done via pure components in React or overloading the should component update method [example here][rn optimize example].

## Testing

To execute the suite of tests, run `yarn test`.

### Snapshot testing

We use Jest [snapshot testing][jest] to assert that no intentional changes to the
component tree have been made without explicit developer intention. See an
example at [`src/send/SendAmount.test.tsx`]. If your snapshot is expected
to deviate, you can update the snapshot with the `-u` or `--updateSnapshot`
flag when running the test.

### React component unit testing

We use [react-native-testing-library][react-native-testing-library] to unit test
react components. It allows for deep rendering and interaction with the rendered
tree to assert proper reactions to user interaction and input. See an example at
[`src/send/SendAmount.test.tsx`] or read more about the [docs][rntl-docs]

### Saga testing

We use [redux-saga-test-plan][redux-saga-test-plan] to test complex sagas.
See [`src/identity/verification.test.ts`] for an example.

### End-to-End testing

We use [Detox][detox] for E2E testing. In order to run the tests locally, you
must have the proper emulator set up. Follow the instrutions in [e2e/README.md][e2e readme].

Once setup is done, you can run the tests with `yarn test:e2e:android`

## Building APKs / Bundles

You can create your own custom build of the app via the command line or in Android Studio. For an exact set of commands, refer to the lanes in `fastlane/FastFile`. For convinience, the basic are described below:

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
bundle exec fastlane android build_apk env:YOUR_BUILDING_VARIANT

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

## Other

### Configuring the SMS Retriever

On Android, the wallet app uses the SMS Retriever API to automatically input codes during phone number verification. When creating a new app build type this needs to be properly configured.

The service that route SMS messages to the app needs to be configured to [append this app signature to the message][sms retriever]. The hash depends on both the bundle id and the signing certificate. Since we use Google Play signing, we need to download the certificate.

1.  Go to the play console for the relevant app, Release management > App signing, and download the App signing certificate.
2.  Use this script to generate the hash code: https://github.com/michalbrz/sms-retriever-hash-generator

### Generating GraphQL Types

We're using [GraphQL Code Generator][graphql code generator] to properly type GraphQL queries. If you make a change to a query, run `yarn build:gen-graphql-types` to update the typings in the `typings` directory.

### How we handle Geth crashes in wallet app on Android

Our Celo app has three types of codes.

1. Javascript code - generated from Typescript, this runs in Javascript interpreter.
2. Java bytecode - this runs on Dalvik/Art Virtual Machine.
3. Native code - Geth code is written in Golang which compiles to native code, this runs directly on the CPU, no virtual machines involved.

One should note that, on iOS, there is no byte code and therefore, there are only two layers, one is the Javascript code, and the other is the Native code. Till now, we have been blind towards native crashes except Google Playstore logs.

Sentry, the crash logging mechanism we use, can catch both Javascript Errors as well as unhandled Java exceptions. It, however, does not catch Native crashes. There are quite a few tools to catch native crashes like [Bugsnag](https://www.bugsnag.com) and [Crashlytics](https://firebase.google.com/products/crashlytics). They would have worked for us under normal circumstances. However, the Geth code produced by the Gomobile library and Go compiler logs a major chunk of information about the crash at Error level and not at the Fatal level. We hypothesize that this leads to incomplete stack traces showing up in Google Play store health checks. This issue is [publicly known](https://github.com/golang/go/issues/25035) but has not been fixed.

We cannot use libraries like [Bugsnag](https://www.bugsnag.com) since they do not allow us to extract logcat logs immediately after the crash. Therefore, We use [jndcrash](https://github.com/ivanarh/jndcrash), which uses [ndcrash](https://github.com/ivanarh/ndcrash) and enable us to log the logcat logs immediately after a native crash. We capture the results into a file and on next restart Sentry reads it. We need to do this two-step setup because once a native crash happens, running code to upload the data would be fragile. An error in sentry looks like [this](https://sentry.io/organizations/celo/issues/918120991/events/48285729031/)

Relevant code references:

1. [NDKCrashService](https://github.com/celo-org/celo-monorepo/blob/master/packages/mobile/android/app/src/main/java/org/celo/mobile/NdkCrashService.java)
2. [Initialization](https://github.com/celo-org/celo-monorepo/blob/8689634a1d10d74ba6d4f3b36b2484db60a95bdb/packages/mobile/android/app/src/main/java/org/celo/mobile/MainApplication.java#L156) of the NDKCrashService
3. [Sentry code](https://github.com/celo-org/celo-monorepo/blob/799d74675dc09327543c210e88cbf5cc796721a0/packages/mobile/src/sentry/Sentry.ts#L53) to read NDK crash logs on restart

There are two major differences in Forno mode:

1.  Geth won't run at all. Instead, web3 connects to <testnet>-forno.celo-testnet.org using an https provider, for example, [https://integration-forno.celo-testnet.org](https://integration-forno.celo-testnet.org).
2.  Transactions will be signed locally by contractkit.

### Why do we use http(s) provider?

Websockets (`ws`) would have been a better choice but we cannot use unencrypted `ws` provider since it would be bad to send plain-text data from a privacy perspective. Geth does not support `wss` by [default](https://github.com/ethereum/go-ethereum/issues/16423). And Kubernetes does not support it either. This forced us to use https provider.

### Troubleshooting

#### `Activity class {org.celo.mobile.staging/org.celo.mobile.MainActivity} does not exist.`

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
[celo-monorepo]: https://github.com/celo-org/celo-monorepo
[celo-blockchain]: https://github.com/celo-org/celo-blockchain
[apple developer program]: https://developer.apple.com/programs/
[detox]: https://github.com/wix/Detox
[e2e readme]: ./e2e/README.md
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
[android ndk]: https://developer.android.com/studio/projects/install-ndk
[android studio]: https://developer.android.com/studio
[approve kernel extension]: https://developer.apple.com/library/content/technotes/tn2459/_index.html
[oracle being oracle]: https://github.com/Homebrew/homebrew-cask-versions/issues/7253
[device unauthorized]: https://stackoverflow.com/questions/23081263/adb-android-device-unauthorized
[watchman]: https://facebook.github.io/watchman/docs/install/
