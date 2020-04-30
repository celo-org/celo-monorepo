# Developer Guide

## Running Tests

To run test, we first need to generate a devchain snapshot:

`yarn test:prepare`

and then:

`yarn test`

### Testing Azure HSM Signer

The tests include an in-memory mock implementation which tests a majority of the functionality. In the case that changes are made to any of the wallet/signing logic, the HSM signer should be tested end-to-end by using an Azure KeyVault. To test against the KeyVault, environment variables are used to provide the client ID and client secret for authentication. Please see the .env file for the required variables. After deploying your KeyVault and generating an ECDSA-SECP256k1 key, you must create a service principal account and provide it signing access to the KeyVault. Instructions on how to do this can be found here: https://www.npmjs.com/package/@azure/keyvault-keys#configuring-your-key-vault. If the .env variables are specified, the tests will automatically switch from using the mock client to the actual KeyVault.

## Documenting Code

To generate docs from [TSdoc](https://github.com/microsoft/tsdoc) annotations using [typedoc](https://typedoc.org/):

`yarn docs`

To customize this generation, see the [linkdocs](./scripts/linkdocs.ts) script.