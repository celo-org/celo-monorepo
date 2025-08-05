# Celo Engineering Setup

- [Celo Engineering Setup](#celo-engineering-setup)
  - [Getting everything installed](#getting-everything-installed)
    - [Install Node](#install-node)
    - [Install Yarn](#install-yarn)
  - [Building celo-monorepo](#building-celo-monorepo)

This is a living document! Please edit and update it as part of your onboarding process :-)

## Getting everything installed

Follow these steps to get everything that you need installed to build the celo-monorepo codebase on your computer.

### Install Node

Currently Node.js v18 is required in order to work with this repo.

Install `nvm` (allows you to manage multiple versions of Node) by following the [instructions here](https://github.com/nvm-sh/nvm).

Once `nvm` is successfully installed, restart the terminal and run the following commands to install the `npm` versions that [celo-monorepo](https://github.com/celo-org/celo-monorepo) will need:

```bash
# restart the terminal after installing nvm
nvm install 18
nvm alias default 18
```

### Install Yarn

We use [Yarn](https://yarnpkg.com/getting-started/install) to build all of the celo-monorepo repo.

## Building celo-monorepo

Clone the [celo-monorepo](https://github.com/celo-org/celo-monorepo) repo:

```bash
mkdir ~/celo
cd celo
git clone https://github.com/celo-org/celo-monorepo.git
```

Then install the packages:

```bash
cd celo-monorepo
# install dependencies and run post-install script
yarn
# build all packages
yarn build --ignore docs
```

> Note that if you do your checkouts with a different method, Yarn will fail if
> you haven’t used git with ssh at least once previously to confirm the
> github.com host key. Clone a repo or add the github host key to
> `~/.ssh/known_hosts` and then try again.
