
## Naming Convention

Our tests generally follow the Foundry Book best [practices](https://book.getfoundry.sh/tutorials/best-practices#general-test-guidance), however, a few notable exepctions are enforced:

1. Naming of contracts. Contract names for test are called `ContractTest_functionToTest_[When|After]`. In case necesary, a contract with setUp `ContractTest` and basic general test are created. Most other contracts are expected to inherit from this.
2. Function naming.
   1. In case of a emit expected `test_Emits_EventName_[When|After]`
   2. In case of a revert expected `test_Reverts_EventName_[When|After]`


Generally, words as "should" are expected to be omitted. The world `If` is generally not used in favor of `When`.

