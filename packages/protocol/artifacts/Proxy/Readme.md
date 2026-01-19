# About this folder

This folder has files for the init code and bytecode used with the Celo smart contracts.

Leaving a note for future reference:

1. The `proxyInitCode...` file seems to be require the bytecode for `Proxy.sol`. I'm not sure if this is the correct way to do it, but I simply copy/pasted the JSON value at `packages/protocol/out/Proxy.sol/Proxy.json` > `bytecode.object.` which is from the Foundry build artifacts.
1. The `proxyBytecode...` file seems to be require the deployed bytecode for `Proxy.sol`. I'm not sure if this is the correct way to do it, but I simply copy/pasted the JSON value at `packages/protocol/out/Proxy.sol/Proxy.json` > `deployedBytecode.object.` which is from the Foundry build artifacts.

Unless the bytecodes in these manual artifacts matches the actual Foundry artifacts, the `test_verifyArtifacts()` test in [`ProxyFactory08.t.sol`](../../test-sol/unit/common/ProxyFactory08.t.sol) will fail.

I didn't have time to investigate this further or question why manual artifacts are needed in the first place. But, I'm leaving a note here for future reference.
