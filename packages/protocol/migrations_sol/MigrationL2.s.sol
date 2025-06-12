pragma solidity >=0.8.7 <0.8.20;

import { Script } from "forge-std-8/Script.sol";
import { MigrationsConstants } from "@migrations-sol/constants.sol";

import { MigrationsHelper } from "@migrations-sol/MigrationsHelper.sol";
import "@test-sol/utils/SECP256K1.sol";

import "@celo-contracts-8/common/EpochManagerEnablerMockMigrations.sol"; // imported  just to force the compilation

// Foundry imports
import "forge-std/console.sol";
import "forge-std/StdJson.sol";

import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts-8/common/UsingRegistry.sol";
import "@celo-contracts/common/interfaces/IEpochManagerEnabler.sol";

contract ForceTx {
  // event to trigger so a tx can be processed
  event VanillaEvent(string);

  // helper used to know the account broadcasting a tx
  function identity() public returns (address) {
    emit VanillaEvent("nop");
    return msg.sender;
  }
}

contract MigrationL2 is Script, MigrationsConstants, UsingRegistry, MigrationsHelper {
  using FixidityLib for FixidityLib.Fraction;
  using stdJson for string;

  /**
   * Entry point of the script
   */
  function run() external {
    string memory json = vm.readFile("./migrations_sol/migrationsConfig.json");
    vm.startBroadcast(DEPLOYER_ACCOUNT);

    setupUsingRegistry();

    dealToCeloUnreleasedTreasuryAndReserve(json);

    vm.stopBroadcast();

    vm.startBroadcast(DEPLOYER_ACCOUNT);

    initializeEpochManagerSystem();

    vm.stopBroadcast();

    electValidators(json);
  }

  function setupUsingRegistry() public {
    _transferOwnership(DEPLOYER_ACCOUNT);
    setRegistry(REGISTRY_ADDRESS);
  }

  function dealToCeloUnreleasedTreasuryAndReserve(string memory json) public {
    bytes memory bytecode = address(REGISTRY_ADDRESS).code;
    // Check if bytecode is empty
    if (bytecode.length == 0) {
      console.log("Registry bytecode is empty");
    } else {
      console.log("Registry bytecode length:", bytecode.length);
    }
    vm.deal(address(getCeloUnreleasedTreasury()), L2_INITIAL_STASH_BALANCE);
    uint256 initialBalance = abi.decode(json.parseRaw(".reserve.initialBalance"), (uint256));
    vm.deal(registry.getAddressForOrDie(RESERVE_REGISTRY_ID), initialBalance);
  }

  function initializeEpochManagerSystem() public {
    console.log("Initializing EpochManager system");
    address epochManagerEnablerAddress = registry.getAddressForOrDie(
      EPOCH_MANAGER_ENABLER_REGISTRY_ID
    );

    EpochManagerEnablerMockMigrations epochManagerEnabler = EpochManagerEnablerMockMigrations(
      epochManagerEnablerAddress
    );

    epochManagerEnabler.initEpochManager(1, 1);
  }

  function lockGold(uint256 value) public {
    getAccounts().createAccount();
    getLockedGold().lock{ value: value }();
  }

  function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
    // 32 is the length in bytes of hash,
    // enforced by the type signature above
    return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
  }

  function actor(string memory name) internal returns (address) {
    return vm.addr(uint256(keccak256(abi.encodePacked(name))));
  }

  function getValidatorKeyIndex(
    uint256 groupCount,
    uint256 groupIndex,
    uint256 validatorIndex,
    uint256 membersInAGroup
  ) public returns (uint256) {
    return groupCount + groupIndex * membersInAGroup + validatorIndex;
  }

  function addressToPublicKey(
    bytes32 message,
    uint8 _v,
    bytes32 _r,
    bytes32 _s
  ) public returns (bytes memory) {
    address SECP256K1Address = actor("SECP256K1Address");
    deployCodeTo("SECP256K1.sol:SECP256K1", SECP256K1Address);
    ISECP256K1 sECP256K1 = ISECP256K1(SECP256K1Address);

    string memory header = "\x19Ethereum Signed Message:\n32";
    bytes32 _message = keccak256(abi.encodePacked(header, message));
    (uint256 x, uint256 y) = sECP256K1.recover(
      uint256(_message),
      _v - 27,
      uint256(_r),
      uint256(_s)
    );
    return abi.encodePacked(x, y);
  }

  function getParsedSignatureOfAddress(
    address _address,
    uint256 privateKey
  ) public pure returns (uint8, bytes32, bytes32) {
    bytes32 addressHash = keccak256(abi.encodePacked(_address));
    bytes32 prefixedHash = toEthSignedMessageHash(addressHash);
    return vm.sign(privateKey, prefixedHash);
  }

  function _generateEcdsaPubKeyWithSigner(
    address _validator,
    uint256 _signerPk
  ) internal returns (bytes memory ecdsaPubKey, uint8 v, bytes32 r, bytes32 s) {
    (v, r, s) = getParsedSignatureOfAddress(_validator, _signerPk);

    bytes32 addressHash = keccak256(abi.encodePacked(_validator));

    ecdsaPubKey = addressToPublicKey(addressHash, v, r, s);
  }

  function registerValidator(
    uint256 validatorIndex,
    uint256 validatorKey,
    uint256 amountToLock,
    address groupToAffiliate
  ) public returns (address) {
    vm.startBroadcast(validatorKey);
    lockGold(amountToLock);
    address accountAddress = (new ForceTx()).identity();

    (bytes memory ecdsaPubKey, , , ) = _generateEcdsaPubKeyWithSigner(accountAddress, validatorKey);
    // console.log("Initialized?", EpochManager(address(getEpochManager())).isSystemInitialized());
    getValidators().registerValidatorNoBls(ecdsaPubKey);
    getValidators().affiliate(groupToAffiliate);
    console.log("Done registering validators");

    vm.stopBroadcast();
    return accountAddress;
  }

  function registerValidatorGroup(
    uint256 validator0Key,
    uint256 amountToLock,
    uint256 commission,
    string memory json
  ) public returns (address accountAddress) {
    string memory groupName = abi.decode(json.parseRaw(".validators.groupName"), (string));
    vm.startBroadcast(validator0Key);
    lockGold(amountToLock);
    getAccounts().setName(groupName);
    getValidators().registerValidatorGroup(commission);

    accountAddress = (new ForceTx()).identity();
    vm.stopBroadcast();
  }

  function electValidators(string memory json) public {
    console.log("Electing validators: ");

    uint256 commission = abi.decode(json.parseRaw(".validators.commission"), (uint256));
    uint256 minElectableValidators = abi.decode(
      json.parseRaw(".election.minElectableValidators"),
      (uint256)
    );
    uint256[] memory valKeys = abi.decode(json.parseRaw(".validators.valKeys"), (uint256[]));
    uint256 maxGroupSize = abi.decode(json.parseRaw(".validators.maxGroupSize"), (uint256));
    uint256 validatorLockedGoldRequirements = abi.decode(
      json.parseRaw(".validators.validatorLockedGoldRequirements.value"),
      (uint256)
    );
    // attestationKeys not migrated

    if (valKeys.length == 0) {
      console.log("  No validators to register");
    }

    if (valKeys.length < minElectableValidators) {
      console.log(
        "Warning: Have ${valKeys.length} Validator keys but require a minimum of ${config.election.minElectableValidators} Validators in order for a new validator set to be elected."
      );
    }

    uint256 groupCount = 3;
    console.log("groupCount", groupCount);

    address[] memory groups = new address[](groupCount);

    // register 3 validator groups
    for (uint256 groupIndex = 0; groupIndex < groupCount; groupIndex++) {
      address groupAddress = registerValidatorGroup(
        valKeys[groupIndex],
        maxGroupSize * validatorLockedGoldRequirements,
        commission,
        json
      );
      groups[groupIndex] = groupAddress;
      console.log("registered group: ", groupAddress);
    }

    console.log("  * Registering validators ... Count: ", valKeys.length - groupCount);
    // Split the validator keys into groups that will fit within the max group size.

    // TODO change name of variable amount of groups for amount in group
    for (uint256 groupIndex = 0; groupIndex < groupCount; groupIndex++) {
      address groupAddress = groups[groupIndex];
      console.log("Registering members for group: ", groupAddress);
      for (uint256 validatorIndex = 0; validatorIndex < maxGroupSize; validatorIndex++) {
        uint256 validatorKeyIndex = getValidatorKeyIndex(
          groupCount,
          groupIndex,
          validatorIndex,
          maxGroupSize
        );
        console.log("Registering validator #: ", validatorIndex);
        address validator = registerValidator(
          validatorIndex,
          valKeys[validatorKeyIndex],
          validatorLockedGoldRequirements,
          groupAddress
        );
        // TODO start broadcast
        console.log("Adding to group...");

        vm.startBroadcast(groups[groupIndex]);
        address greater = groupIndex == 0 ? address(0) : groups[groupIndex - 1];

        if (validatorIndex == 0) {
          getValidators().addFirstMember(validator, address(0), greater);
          console.log("Making group vote for itself");
        } else {
          getValidators().addMember(validator);
        }
        getElection().vote(groupAddress, validatorLockedGoldRequirements, address(0), greater);

        vm.stopBroadcast();
      }
    }
  }
}
