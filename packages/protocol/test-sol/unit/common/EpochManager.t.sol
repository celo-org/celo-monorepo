// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

// import "celo-foundry-8/Test.sol";
// import "@celo-contracts-8/common/EpochManager.sol";

// contract EpochManagerTest is Test {
//   EpochManager epochManager;

//   uint256 firstEpochNumber = 100;
//   uint256 firstEpochBlock = 100;
//   address[] firstElected;

//   function setUp() public virtual {
//     epochManager = new EpochManager();
//      firstElected.push(actor("validator1"));
//      firstElected.push(actor("validator2"));

//   }
// }

// contract EpochManagerinitializeSystem is EpochManagerTest {

//   function test_processCanBeStarted() public virtual{
//     // vm.prank(initializerAddress);
//     epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
//   }

//   function test_Reverts_processCannotBeStartedAgain() public virtual {
//     // vm.prank(initializerAddress);
//     epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);
//     vm.expectRevert("Epoch system already initialized");
//     epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);

//   }

//   function test_Reverts_WhenSystemInitializedByOtherContract() public virtual {
//     vm.expectRevert("Not the initializer");
//     epochManager.initializeSystem(firstEpochNumber, firstEpochBlock, firstElected);

//   }

// }
