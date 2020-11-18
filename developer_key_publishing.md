# Developer Key Publishing

In the development life cycle, there are a number of points where it is useful to have a published [public key](https://en.wikipedia.org/wiki/Public-key_cryptography). Examples include build signing, Git commit signing, and communicating with other community members securely. Build signing in particular is a required part of the release process for the Celo blockchain client.

In support of these uses, [OpenPGP](https://www.openpgp.org/) public keys can be published to [celo.org](https://celo.org), where they can downloaded securely by anyone.

If you want to read more about OpenPGP keys, including their structure and metadata, check out [Anatomy of a GPG Key by Dave Steele](https://davesteele.github.io/gpg/2014/09/20/anatomy-of-a-gpg-key/).

> Note: This guide assumes you have an @clabs.co email address, but if you do not, simply change the email domain to your primary developer email (e.g. @example.com for alice@example.com) Some additional setup will be required in the DNS records for your domain to configure [OpenPGP WKD]((https://gnupg.org/blog/20161027-hosting-a-web-key-directory.html)).

## Setup

[GnuPG](https://gnupg.org), or `gpg`, is by far the most popular implementation of OpenPGP, and it is what we will be using here.

Install `gpg` on MacOS with Homebrew using `brew install gpg` or visit [gnupg.org/download](https://gnupg.org/download/) for other options.

#### Environment variables

In this guide, a couple of environment variables are used in the commands. Set the following for convenience:

```bash
export USER_NAME='your name on the clabs.co email domain. e.g. alice for alice@clabs.co'
export REAL_NAME='your first and last name. e.g. Alice Turing'
```

## Key Generation

#### Algorithm
OpenPGP supports a number of cryptographic algorithms including [RSA](https://en.wikipedia.org/wiki/RSA_(cryptosystem)) and [ECC](https://en.wikipedia.org/wiki/Elliptic-curve_cryptography).

Here we recommend `secp256k1`, which is the algorithm underlying identity on the Celo blockchain, because it is fast, secure, and promotes interoperability within the Celo ecosystem. (e.g. Your OpenPGP key could be used to take actions on-chain, which is pretty neat.)

> Note: When using a YubiKey with firmware version less than 5.2.3, `secp256k1` is not available. Instead, we recommend using `rsa2048`. Github does have limited support for [signing algorithms](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/adding-a-new-gpg-key-to-your-github-account#supported-gpg-key-algorithms).

#### User Identifier
In OpenPGP, each key is associated with a user identity, which is commonly an email address and your name (e.g. "Alice Turing <alice@example.com>"). A public key created by `gpg` will automatically include the username, in addition to the cryptographic public key information, so when someone downloads your public key, they will know it is intended for your email address.

By publishing keys on [celo.org](https://celo.org), users can securely download developer keys from their `@clabs.co` email address, and know that it is the correct one because publishing to [celo.org](https://celo.org) requires approval of the Celo core developers.

### On your YubiKey

We recommend generating your developer key pair with a YubiKey. Generating your key on a YubiKey provides higher security by making it virtually impossible for an attacker to steal your private key by hacking your computer.

> Warning: Losing your YubiKey will result in the permanent loss of any keys stored on it. It is not possible to create a backup of a private key created with this method.

> Note: When asked for the admin PIN, it is 12345678 by default. If asked for the user PIN, it is 123456 by default.

1. Insert the YubiKey into the USB port.
2. Run `gpg --card-edit --expert`
3. At the `gpg/card>` prompt, enter the following commands:
    1. `admin`
    2. `key-attr`
        1. `2` to select `ECC` on the signature key.
        2. `9` to select `secp256k1` on the signature key.
        3. Repeat this selection for the encryption and authentication keys.
    3. `generate`
        1. When asked if you want to backup your encryption key, specify `n` for no.
        2. Specify an expiration date, for example `2y` for 2 years.
        3. Enter you full name and `@clabs.co` email address when prompted.
        4. You may add a comment, but it is not required.
    4. `quit`

See the [official YubiKey documentation](https://support.yubico.com/support/solutions/articles/15000006420-using-your-yubikey-with-openpgp) for more information.

### On your machine

Use the following command, replacing the environment variables, to generate a new key on your machine:

```bash
gpg --quick-generate-key "${REAL_NAME} <${USER_NAME}@clabs.co>" secp256k1
```

You now have a secret key and public key, on `secp256k1` and with a 2 year expiration, associated with your `@clabs.co` email address.

See `man gpg` for more information on key generation options.

#### Import to a Yubikey

If you've generated a key on your local machine, it can be imported onto your YubiKey with the following steps.

> Note: When asked for the admin PIN, it is 12345678 by default. If asked for the user PIN, it is 123456 by default.

1. Insert the YubiKey into the USB port.
2. `gpg --edit-key ${USER_NAME}@clabs.co`
3. At the `gpg` prompt enter the following commands:
    2. `keytocard` and select `1` to set the signature key on the YubiKey.
    7. `keytocard` and select `3` to set the authentication key on the YubiKey.
    8. `quit` and save your changes.

See the [official YubiKey documentation](https://support.yubico.com/support/solutions/articles/15000006420-using-your-yubikey-with-openpgp)

#### Verify your signing key

Use the following command as a quick way to verify that your new key can be used to produce a valid signature:

```bash
gpg -u ${USER_NAME}@clabs.co -o - --sign <(head -c 256 /dev/urandom) | gpg --verify -
```

> Note: The command above works by signing 256 bytes of random data with your new key, then verifying the signature over that data.

You should see `Good signature from ...` with your real name and email.

## Key Publishing

Keys are published to [celo.org](https://celo.org) using [OpenPGP WKD](https://gnupg.org/blog/20161027-hosting-a-web-key-directory.html), which is essentially just a hosted folder of public keys. Published keys are managed by submitting a pull request to the `master` branch of `celo-monorepo` on [GitHub](https://github.com/celo-org/celo-monorepo).

#### Adding your key to the repository

Adding your key to the `@celo/web` package of `celo-monorepo` will allow them to be available on [celo.org](https://celo.org) with the next website deployment.

Running the following command from the root of `celo-monorepo` will add your key to the `packages/web/openpgpkey` directory:

```bash
gpg --list-options show-only-fpr-mbox -k ${USER_NAME}@clabs.co | $(gpgconf --list-dirs libexecdir)/gpg-wks-client -v --install-key -C packages/web/openpgpkey
```

You should confirm that new key files were added to the `packages/web/openpgpkey/` directory and open a pull request with the changes. You should see new files in the `packages/web/openpgpkey/clabs.co/hu` folder, if you followed the directions above.

#### Verifying the published key

Once a new version of [celo.org](https://celo.org) is published, you will be able to verify your keys are published correctly with the key lookup instructions below.

## Key Lookup

Users can lookup keys on the `@clabs.co` domain with the following command:

```bash
gpg --auto-key-locate wkd --locate-external-keys ${USER_NAME}@clabs.co
```

This command will query [celo.org](https://celo.org) over HTTPS and retrieve the latest key for `${USER_NAME}@clabs.co`.

## Document Signing

A [signature](https://en.wikipedia.org/wiki/Digital_signature) can be produced over a document with a number of options using `gpg`.

Use the following command to produce an ASCII encoded detached signature with your `@clabs.co` key:

```bash
gpg -u ${USER_NAME}@clabs.co -o doc.txt.asc --armor --detach-sign doc.txt
```

This command will produce the signature file `doc.txt.asc` for `doc.txt`. The signature file can be distributed along side the document, and be verified by any user with access to the document and your public key.

#### Signature Verification

A signature file produced with the method above can be verified by any user that possesses your public key with the following command.

```bash
gpg --verify doc.txt.asc doc.txt
```

See the `gpg` [manual entry on signatures](https://www.gnupg.org/gph/en/manual/x135.html) for more information.
