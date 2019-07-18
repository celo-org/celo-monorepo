# Celo Verifier App

## Setup steps

### Install Packages

You need to install Java 8, the android sdk, the react native cli, and the proper android sdk version to run the app.

```sh
brew cask install caskroom/versions/java8
brew cask install android-sdk
yarn global add react-native-cli
sdkmanager 'platforms;android-27'
```

Add the following to your .rc file

```
export ANDROID_HOME=/usr/local/share/android-sdk
export PATH=/usr/local/share/android-sdk/platform-tools:$PATH
```

Follow all instructions mentioned in building projects with native code/android: https://facebook.github.io/react-native/docs/getting-started.html

### Device Setup

You can run the app on an android phone, or in Genymotion. To run on your phone, you must [enable developer mode.](https://developer.android.com/studio/debug/dev-options) Otherwise you can install Genymotion as follows:

```
brew cask install genymotion
```

Make sure to approve virtualbox here: https://developer.apple.com/library/content/technotes/tn2459/_index.html

## Deployment

### Build and deploy on device

Deploy to device with

```
yarn run dev
```

### Debug

If you are going to use Android Studio to build or debug, make sure that in the SDK manager, you set the Android SDK Location to

```
/usr/local/Caskroom/android-sdk/{version-number}
```

### Integration/Staging/Release

The project is setup to have CircleCi automatically deploy the app builds to the playstore via Fastlane. See ./fastlane and config.yml in the monorepo root.
