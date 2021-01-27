# Developer Guide

## Running Tests

To run test, we first need to generate a devchain snapshot:

`yarn test:reset`

and then:

`yarn test`

### Testing Azure HSM Signer

The tests include an in-memory mock implementation which tests a majority of the functionality. In the case that changes are made to any of the wallet/signing logic, the HSM signer should be tested end-to-end by using an Azure KeyVault. To test against the KeyVault, environment variables are used to provide the client ID and client secret for authentication. Please see the .env file for the required variables. After deploying your KeyVault and generating an ECDSA-SECP256k1 key, you must create a service principal account and provide it signing access to the KeyVault. Instructions on how to do this can be found here: https://www.npmjs.com/package/@azure/keyvault-keys#configuring-your-key-vault. If the .env variables are specified, the tests will automatically switch from using the mock client to the actual KeyVault.

## Testing Ledger Signer

Similarly, the tests include an in-memory mock implementation of the Ledger signer. To run the tests using an actual Ledger device:
- Set `USE_PHYSICAL_LEDGER` to `true` in ledger-wallet.test.ts
- Install libusb-dev `apt-get install lsb-release libudev-dev libusb-dev libusb-1.0-0 -y`
- Add reference to package: `@ledgerhq/hw-transport-node-hid@5.11.0`
  - Note that this package should not be added to contractkit since it forces all contract kit users to add libusb-dev

## Documenting Code

To generate docs from [TSdoc](https://github.com/microsoft/tsdoc) annotations using [typedoc](https://typedoc.org/):

`yarn docs`

To customize this generation, see the [linkdocs](./scripts/linkdocs.ts) script.