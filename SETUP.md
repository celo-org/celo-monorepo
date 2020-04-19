# Celo Engineering Setup

- [Celo Engineering Setup](#celo-engineering-setup)
  - [Reading](#reading)
  - [Getting everything installed](#getting-everything-installed)
    - [MacOS](#macos)
      - [Xcode CLI](#xcode-CLI)
      - [Homebrew](#homebrew)
      - [Install Node, Yarn and friends](#install-node-yarn-and-friends)
    - [Linux](#linux)
      - [Install Node, Yarn and friends](#install-node-yarn-and-friends-1)
    - [Common stuff](#common-stuff)
      - [Install Go](#install-go)
      - [Install gcloud CLI](#install-gcloud-CLI)
      - [Optional: Install Rust](#optional-install-rust)
  - [Building celo-monorepo](#building-celo-monorepo)
  - [Deploying the mobile wallet](#deploying-the-mobile-wallet)

This is a living document! Please edit and update it as part of your onboarding process :-)


## Reading

Review the README from each directory in [packages](packages/). The [protocol](packages/protocol) and [mobile](packages/mobile) packages are good starting points.


## Getting everything installed

Follow these steps to get everything that you need installed to build the celo-monorepo codebase on your computer.

### MacOS

#### Xcode CLI

Install the Xcode command line tools:

```bash
xcode-select --install
```

#### Homebrew

Install [Homebrew], the best way of managing packages on OSX:

```bash
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

#### Install Node, Yarn and friends

Install `nvm` (allows you to manage multiple versions of Node) by following the instructions here: [https://github.com/nvm-sh/nvm].

Once `nvm` is successfully installed, restart the terminal and run the following commands to install the `npm` versions and typescript package that [celo-monorepo] will need:

```bash
# restart the terminal after installing nvm
nvm install 8
nvm install 10
nvm alias default 10
npm install -g typescript
```

We use Yarn to build all of the [celo-monorepo] repo. Install it using [Homebrew](#homebrew):

```bash
brew install yarn
```

### Linux

#### Install Node, Yarn and friends

Install NodeJS:

```bash
# Installing NodeJS
sudo apt-get update
sudo apt-get install nodejs
```

Install `nvm` (allows you to manage multiple versions of Node) by following the instructions here: [https://github.com/nvm-sh/nvm].

Once `nvm` is successfully installed, restart the terminal and run the following commands to install the `npm` versions and typescript package that [celo-monorepo] will need:

```bash
# restart the terminal after installing nvm
nvm install 8
nvm install 10
nvm alias default 10
npm install -g typescript
```

We use Yarn to build all of the [celo-monorepo] repo. Install it by running the following:

```bash
# for documentation on yarn visit https://yarnpkg.com/en/docs/install#debian-stable
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get update && sudo apt-get install yarn
```

### Common stuff

#### Install Go

We need Go for [celo-blockchain], the Go Celo implementation, and `gobind` to build Java language bindings to Go code for the Android Geth client).

Note: We currently use Go 1.11. Brew installs Go 1.12 by default, which is not entirely compatible with our repositories. [Install Go 1.11 manually](https://golang.org/dl/), then run

```
go get golang.org/x/mobile/cmd/gobind
```

Execute the following (and make sure the lines are in your `~/.bash_profile`):

```
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin
```

#### Install gcloud CLI

_Required for cLabs employees only._

[Install the gcloud SDK](https://cloud.google.com/sdk/docs#install_the_latest_cloud_tools_version_cloudsdk_current_version), which includes the command line tools. Once installed, initialize `gcloud` and log in.

#### Optional: Install Rust

We use Rust to build the [celo-blockchain] and [bls-zexe] repos. You will need to install Rust if you'd like to run the Celo blockchain locally. This is not required if you only want use the monorepo and mobile wallet.

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
rustup install 1.42.0
rustup default 1.42.0
```

If you're building Geth for Android, you need a NDK that has a cross-compilation toolchain. You can get it by appropriately defining the relevant environment variables, e.g.:

```bash
export NDK_VERSION=android-ndk-r19c
export ANDROID_NDK=ndk_bundle/android-ndk-r19c
```

and running `make ndk_bundle`. This will download the NDK for your platform.


## Building celo-monorepo

Clone the [celo-monorepo] repo:

```bash
mkdir ~/celo
cd celo
git clone https://github.com/celo-org/celo-monorepo.git
```

Then install the packages:

```bash
cd celo-monorepo
npm install lerna
# install dependencies and run post-install script
yarn
# build all packages
yarn build
```

> Note that if you do your checkouts with a different method, Yarn will fail if
> you haven’t used git with ssh at least once previously to confirm the
> github.com host key. Clone a repo or add the github host key to
> `~/.ssh/known_hosts` and then try again.

> When removing a dependency via `yarn remove some-package`, be sure to also run `yarn postinstall` so
> you aren't left with freshly unpackaged modules. This is because we use `patch-package`
> and the `postinstall` step which uses it is not automatically run after using `yarn remove`.


## Deploying the mobile wallet

To deploy the mobile wallet to your iOS or Android devices see the guide in the [mobile](packages/mobile) directory.


[celo-monorepo]: https://github.com/celo-org/celo-monorepo
[celo-blockchain]: https://github.com/celo-org/celo-blockchain
[bls-zexe]: https://github.com/celo-org/bls-zexe
[Homebrew]: https://brew.sh
[https://github.com/nvm-sh/nvm]: https://github.com/nvm-sh/nvm
