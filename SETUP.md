# Celo Engineering Setup

This is a living document! Please edit and update it as part of your onboarding process :-)

## Getting Everything Installed

Follow these steps to get everything that you need installed to develop and
build the celo-monorepo codebase.

### XCode

Install XCode and its command line tools:

```bash
xcode-select --install
```

### Homebrew

Install [Homebrew][homebrew], the best way of managing packages on OSX:

```bash
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

### Install Node, Yarn and friends

We use Yarn to build all of the [celo-monorepo] repo.

Install `nvm` (allows you to manage multiple versions of Node), Node 8 and `yarn`:

```bash
brew install nvm
# follow the instructions from the command above to edit your .bash_profile
# then restart the terminal
nvm install 8
nvm alias default 8
brew install yarn
```

### Java

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

### Install Android Dev Tools

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
```

Then install the Android 28 platform:

```bash
sdkmanager 'platforms;android-28'
```

### (_Optional_) Install an Android Emulator

Install the Android 28 system image and create an Android Virtual Device:

```bash
sdkmanager "system-images;android-28;google_apis;x86"
avdmanager create avd --force --name Nexus_5X_API_28 --device "Nexus 5X" -k "system-images;android-28;google_apis;x86" --abi "google_apis/x86"
```

Execute the following and add it to your `~/.bash_profile`:

```bash
export PATH=$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$PATH
```

Run the emulator with:

```bash
emulator -avd Nexus_5X_API_28
```

### Genymotion

Alternatively, you can install Genymotion, a nice emulator manager:

```bash
brew cask install genymotion
```

Under OSX High Sierra and later, you'll get a message that you need to
[approve it in System Preferences > Security & Privacy > General][approve kernel extension].

Do that, and then repeat the line above.

Then make sure the ADB path is set correctly in Genymotion — set
`Preferences > ADB > Use custom Android SDK tools` to
`/usr/local/share/android-sdk` (same as `$ANDROID_HOME`)

### Building celo-monorepo

Clone the [celo-monorepo] repo:

```bash
mkdir ~/celo
cd celo
git clone git@github.com:celo-org/celo-monorepo.git
```

Then install packages:

```bash
cd celo-monorepo
yarn
```

> Note that if you do your checkouts with a different method, Yarn will fail if
> you haven’t used git with ssh at least once previously to confirm the
> github.com host key. Clone a repo or add the github host key to
> `~/.ssh/known_hosts` and then try again.

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

### Deploying the user app

To deploy the app to your connected Android device:

```bash
cd packages/mobile
# install packages
yarn
# install app and start dev server
yarn dev
```

[android dev options]: https://developer.android.com/studio/debug/dev-options
[android ndk]: https://developer.android.com/ndk/guides
[android studio]: https://developer.android.com/studio
[approve kernel extension]: https://developer.apple.com/library/content/technotes/tn2459/_index.html
[celo-monorepo]: https://github.com/celo-org/celo-monorepo
[device unauthorized]: https://stackoverflow.com/questions/23081263/adb-android-device-unauthorized
[homebrew]: https://brew.sh
[oracle being oracle]: https://github.com/Homebrew/homebrew-cask-versions/issues/7253
