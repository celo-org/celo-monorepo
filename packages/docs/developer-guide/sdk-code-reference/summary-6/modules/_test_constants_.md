# test-constants

## Index

### Variables

* [ADDRESS1](_test_constants_.md#const-address1)
* [ADDRESS2](_test_constants_.md#const-address2)
* [GETH\_GEN\_KEYSTORE1](_test_constants_.md#const-geth_gen_keystore1)
* [GETH\_GEN\_KEYSTORE2](_test_constants_.md#const-geth_gen_keystore2)
* [KEYSTORE\_NAME1](_test_constants_.md#const-keystore_name1)
* [KEYSTORE\_NAME2](_test_constants_.md#const-keystore_name2)
* [PASSPHRASE1](_test_constants_.md#const-passphrase1)
* [PASSPHRASE2](_test_constants_.md#const-passphrase2)
* [PK1](_test_constants_.md#const-pk1)
* [PK2](_test_constants_.md#const-pk2)

## Variables

### `Const` ADDRESS1

• **ADDRESS1**: _string_ = normalizeAddressWith0x\(privateKeyToAddress\(PK1\)\)

_Defined in_ [_test-constants.ts:8_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/test-constants.ts#L8)

### `Const` ADDRESS2

• **ADDRESS2**: _string_ = normalizeAddressWith0x\(privateKeyToAddress\(PK2\)\)

_Defined in_ [_test-constants.ts:13_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/test-constants.ts#L13)

### `Const` GETH\_GEN\_KEYSTORE1

• **GETH\_GEN\_KEYSTORE1**: _"{"address":"8233d802bdc645d0d1b9b2e6face6e5825905081","blspublickey":"ed2ed9b2670458d01df329a4c750e7a6f89ec0e86676d4e093b2f32b4f3b603b6927b8dfe12e9fdf5c9f4bbbc504770052d816dbcaae90f4ef0af19333965b29f29b069c1f28eaa4bcaa62b27459855e4ad201aac245de05c3cb51dcab118080","crypto":{"cipher":"aes-128-ctr","ciphertext":"7b2ccdede461b9f7cc33fbbd7a9bfe23fdf455f3d4a8558cb10e86c5a4c5cc39","cipherparams":{"iv":"a78b8382da088a544edef093e922947b"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"2007752e0c72eed75a793cddba6a9e3c698b95a259002b32443d8c0430038505"},"mac":"e1599623f8957e538e17512e39693bf1a85fc4eab10fdb243c7d33fd18f9c766"},"id":"3b9465ac-eca1-4923-84e6-4624bd41ab0b","version":3}"_ = `{"address":"8233d802bdc645d0d1b9b2e6face6e5825905081","blspublickey":"ed2ed9b2670458d01df329a4c750e7a6f89ec0e86676d4e093b2f32b4f3b603b6927b8dfe12e9fdf5c9f4bbbc504770052d816dbcaae90f4ef0af19333965b29f29b069c1f28eaa4bcaa62b27459855e4ad201aac245de05c3cb51dcab118080","crypto":{"cipher":"aes-128-ctr","ciphertext":"7b2ccdede461b9f7cc33fbbd7a9bfe23fdf455f3d4a8558cb10e86c5a4c5cc39","cipherparams":{"iv":"a78b8382da088a544edef093e922947b"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"2007752e0c72eed75a793cddba6a9e3c698b95a259002b32443d8c0430038505"},"mac":"e1599623f8957e538e17512e39693bf1a85fc4eab10fdb243c7d33fd18f9c766"},"id":"3b9465ac-eca1-4923-84e6-4624bd41ab0b","version":3}`

_Defined in_ [_test-constants.ts:6_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/test-constants.ts#L6)

### `Const` GETH\_GEN\_KEYSTORE2

• **GETH\_GEN\_KEYSTORE2**: _"{"address":"b81a82696018fd9d8b43431966b60c31bdcdc2e8","blspublickey":"b9f862e2ced58bb2eef8ffde7020189ab2bb050603630eceec9b80c1636d98f8c3b9bd517d673937a0551c3a0698a00086bda4db1f0d859912a91988775ae388886013e7eb254d195871f9ced6643e288755da0b483ebe6dda448fea2eb75481","crypto":{"cipher":"aes-128-ctr","ciphertext":"6f3cd02b2d3d81b2bbf76743396c9c3c1685ddc6cfafbba34195ab03476831d3","cipherparams":{"iv":"af1f9853e0ff20ee5d495cf7d9461e1c"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"cf0446914e5d214f2a312c08ef24e7e3dd15e948d2ca67d59b3bb97903a96147"},"mac":"58348f6d843d28b3ac8cf40542d10da198016f28f132c32389ab56a945c858e1"},"id":"b224dac6-c089-4b47-8557-e04ae60b3506","version":3}"_ = `{"address":"b81a82696018fd9d8b43431966b60c31bdcdc2e8","blspublickey":"b9f862e2ced58bb2eef8ffde7020189ab2bb050603630eceec9b80c1636d98f8c3b9bd517d673937a0551c3a0698a00086bda4db1f0d859912a91988775ae388886013e7eb254d195871f9ced6643e288755da0b483ebe6dda448fea2eb75481","crypto":{"cipher":"aes-128-ctr","ciphertext":"6f3cd02b2d3d81b2bbf76743396c9c3c1685ddc6cfafbba34195ab03476831d3","cipherparams":{"iv":"af1f9853e0ff20ee5d495cf7d9461e1c"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"cf0446914e5d214f2a312c08ef24e7e3dd15e948d2ca67d59b3bb97903a96147"},"mac":"58348f6d843d28b3ac8cf40542d10da198016f28f132c32389ab56a945c858e1"},"id":"b224dac6-c089-4b47-8557-e04ae60b3506","version":3}`

_Defined in_ [_test-constants.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/test-constants.ts#L12)

### `Const` KEYSTORE\_NAME1

• **KEYSTORE\_NAME1**: _"PK1 keystore name"_ = "PK1 keystore name"

_Defined in_ [_test-constants.ts:7_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/test-constants.ts#L7)

### `Const` KEYSTORE\_NAME2

• **KEYSTORE\_NAME2**: _"PK2 keystore name"_ = "PK2 keystore name"

_Defined in_ [_test-constants.ts:11_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/test-constants.ts#L11)

### `Const` PASSPHRASE1

• **PASSPHRASE1**: _"test- passwøörd1!"_ = "test- passwøörd1!"

_Defined in_ [_test-constants.ts:3_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/test-constants.ts#L3)

### `Const` PASSPHRASE2

• **PASSPHRASE2**: _"test-password2 !!"_ = "test-password2 !!"

_Defined in_ [_test-constants.ts:9_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/test-constants.ts#L9)

### `Const` PK1

• **PK1**: _"d72f6c0b0d7348a72eaa7d3c997bd49293bdc7d4bf79eba03e9f7ca9c5ac6b7f"_ = "d72f6c0b0d7348a72eaa7d3c997bd49293bdc7d4bf79eba03e9f7ca9c5ac6b7f"

_Defined in_ [_test-constants.ts:4_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/test-constants.ts#L4)

### `Const` PK2

• **PK2**: _"bb6f3fa4a83b7b06e72e580a3b09df5dd6fb4fa745ee2b0d865413ad6299e64e"_ = "bb6f3fa4a83b7b06e72e580a3b09df5dd6fb4fa745ee2b0d865413ad6299e64e"

_Defined in_ [_test-constants.ts:10_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/test-constants.ts#L10)

