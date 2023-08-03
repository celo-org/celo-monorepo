##### Gathering dependencies
FROM scratch AS packages

# Copy phone-number-privacy package and its dependency closure.
# Assemble all dependencies into the packages folder so the second stage can select whether to
# include all packages, or just the phone-number-privacy packages.
WORKDIR /celo-phone-number-privacy/
COPY packages/typescript packages/typescript
COPY packages/dev-utils packages/dev-utils
COPY packages/phone-number-privacy/signer packages/phone-number-privacy/signer
COPY packages/phone-number-privacy/common packages/phone-number-privacy/common
COPY packages/protocol packages/protocol
COPY packages/sdk/base packages/sdk/base
COPY packages/sdk/connect packages/sdk/connect
COPY packages/sdk/contractkit packages/sdk/contractkit
COPY packages/sdk/cryptographic-utils packages/sdk/cryptographic-utils
COPY packages/sdk/utils packages/sdk/utils
COPY packages/sdk/phone-utils packages/sdk/phone-utils
COPY packages/sdk/wallets/wallet-base packages/sdk/wallets/wallet-base
COPY packages/sdk/wallets/wallet-hsm packages/sdk/wallets/wallet-hsm
COPY packages/sdk/wallets/wallet-hsm-azure packages/sdk/wallets/wallet-hsm-azure
COPY packages/sdk/wallets/wallet-local packages/sdk/wallets/wallet-local
COPY packages/sdk/wallets/wallet-remote packages/sdk/wallets/wallet-remote

##### Main stage
FROM node:18

WORKDIR /celo-phone-number-privacy/

# Copy monorepo settings
COPY lerna.json package.json yarn.lock ./
COPY scripts/ scripts/
COPY patches/ patches/

# Makes build fail if it doesn't copy git, will be removed after build
COPY .git .git 
COPY .gitmodules .gitmodules 

# Setting ONLY_PUBLISHED_DEPENDENCIES to true or any non-empty string results in only the
# phone-number-privacy package being copied into the image, and therefore it will only build using
# published dependencies. Setting ONLY_PUBLISHED_DEPENDENCIES to "" will copy in all dependecies.
ARG ONLY_PUBLISHED_DEPENDENCIES=""
ARG PACKAGE_SELECTOR=${ONLY_PUBLISHED_DEPENDENCIES:+phone-number-privacy/signer}
COPY --from=packages celo-phone-number-privacy/packages/${PACKAGE_SELECTOR} packages/${PACKAGE_SELECTOR}

# Install dependencies and build.
RUN yarn install --network-timeout 100000 --frozen-lockfile && yarn cache clean
RUN yarn build

RUN rm -r .git
RUN rm .gitmodules

# Setup and run the signer application.
ENV NODE_ENV production
WORKDIR /celo-phone-number-privacy/packages/phone-number-privacy/signer
EXPOSE 8080
ENTRYPOINT ["yarn", "start:docker"]
