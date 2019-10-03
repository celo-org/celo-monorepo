# Celo Engineering Setup

- [Celo Engineering Setup](#celo-engineering-setup)
  - [Getting Everything Installed](#getting-everything-installed)
    - [MacOS](#macos)
      - [XCode](#xcode)
      - [Homebrew](#homebrew)
      - [Install Node, Yarn and friends](#install-node-yarn-and-friends)
      - [Java](#java)
      - [Install Android Dev Tools](#install-android-dev-tools)
    - [Linux](#linux)
      - [Install Node, Yarn and friends](#install-node-yarn-and-friends-1)
      - [Installing OpenJDK 8](#installing-openjdk-8)
      - [Install Android Dev Tools](#install-android-dev-tools-1)
    - [Some common stuff](#some-common-stuff)
      - [Optional: Install Rust](#optional-install-rust)
      - [Optional: Install an Android Emulator](#optional-install-an-android-emulator)
      - [Optional: Genymotion](#optional-genymotion)
        - [MacOS](#macos-1)
        - [Linux](#linux-1)
    - [Building celo-monorepo](#building-celo-monorepo)
  - [Using an Android test device locally](#using-an-android-test-device-locally)
    - [Deploying the user app](#deploying-the-user-app)

This is a living document! Please edit and update it as part of your onboarding process :-)

## Getting Everything Installed

Follow these steps to get everything that you need installed to develop and
build the celo-monorepo codebase.

### MacOS

#### XCode

Install XCode and its command line tools:

```bash
xcode-select --install
```

#### Homebrew

Install [Homebrew][homebrew], the best way of managing packages on OSX:

```bash
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

#### Install Node, Yarn and friends

We use Yarn to build all of the [celo-monorepo] repo.

Install `nvm` (allows you to manage multiple versions of Node), Node 8 and `yarn`:

```bash
brew install nvm
# follow the instructions from the command above to edit your .bash_profile
# then restart the terminal
nvm install 10
nvm alias default 10
brew install yarn
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
```

Then install the Android 28 platform:

```bash
sdkmanager 'platforms;android-28'
```

### Linux

#### Install Node, Yarn and friends

We use Yarn to build all of the [celo-monorepo] repo.

Install `nvm` (allows you to manage multiple versions of Node), Node 8 and `yarn`:

```bash
# Installing Node
sudo apt-get update
sudo apt-get install nodejs

# Installing Nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
source ~/.bashrc

# Setting up the right version of Nvm
nvm install 8
nvm alias default 8

# Installing Yarn - https://yarnpkg.com/en/docs/install#debian-stable
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get update && sudo apt-get install yarn
```

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

### Some common stuff

#### Optional: Install Rust

We use Rust to build the [bls-zexe](https://github.com/celo-org/bls-zexe) repo, which Geth depends on. If you only use the monorepo, you probably don't need this.

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Now lets add Rust to the PATH:

```
echo "export PATH=$PATH:~/.cargo/bin/" >> ~/.bashrc
source ~/.bashrc
```

With Rust binaries in your PATH you should be able to run:

```bash
rustup install 1.36.0
rustup default 1.36.0
```

If you're building Geth for Android, you require an NDK that has a cross-compilation toolchain. You can get it by appropriately defining the relevant environment variables, e.g.:

```bash
export NDK_VERSION=android-ndk-r19c
export ANDROID_NDK=ndk_bundle/android-ndk-r19c
```

and running `make ndk_bundle`. This will download the NDK for your platform.

#### Optional: Install an Android Emulator

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

#### Optional: Genymotion

Optionally, as alternative to other emulators you can install Genymotion, a nice emulator manager:

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

> When removing a dependency via `yarn remove some-package`, be sure to also run `yarn postinstall` so
> you aren't left with freshly unpackaged modules. This is because we use `patch-package`
> and the `postinstall` step which uses it is not automatically run after using `yarn remove`.

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
