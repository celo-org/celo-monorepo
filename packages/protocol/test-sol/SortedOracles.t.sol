// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Test } from "celo-foundry/Test.sol";
import { SortedOracles } from "../contracts/stability/SortedOracles.sol";
import "../contracts/common/FixidityLib.sol";
import "../contracts/common/linkedlists/AddressSortedLinkedListWithMedian.sol";
import "../contracts/common/linkedlists/SortedLinkedListWithMedian.sol";
import "forge-std/console.sol";

contract SortedOraclesTest is Test {
  using FixidityLib for FixidityLib.Fraction;
  using AddressSortedLinkedListWithMedian for SortedLinkedListWithMedian.List;

  SortedOracles sortedOracle;

  address oracleAccount;
  address aToken = 0x00000000000000000000000000000000DeaDBeef;
  uint256 reportExpiry = 3600;

  uint256 constant YEAR_IN_SECONDS = 31536000;

  event OracleAdded(address indexed token, address indexed oracleAddress);
  event OracleRemoved(address indexed token, address indexed oracleAddress);
  event OracleReported(
    address indexed token,
    address indexed oracle,
    uint256 timestamp,
    uint256 value
  );
  event OracleReportRemoved(address indexed token, address indexed oracle);
  event MedianUpdated(address indexed token, uint256 value);
  event ReportExpirySet(uint256 reportExpiry);
  event TokenReportExpirySet(address token, uint256 reportExpiry);

  function setUp() public {
    vm.warp(YEAR_IN_SECONDS);
    sortedOracle = new SortedOracles(true);
    oracleAccount = actor("oracleAccount");
    sortedOracle.initialize(reportExpiry);
  }
}

contract Initialize is SortedOraclesTest {
  function setUp() public {
    super.setUp();
  }

  function test_ownerSet() public {
    assertEq(sortedOracle.owner(), address(this));
  }

  function test_ShouldSetReportExpiry() public {
    assertEq(sortedOracle.reportExpirySeconds(), reportExpiry);
  }

  function test_ShouldRevertWhenCalledAgain() public {
    vm.expectRevert("contract already initialized");
    sortedOracle.initialize(reportExpiry);
  }
}

contract SetReportExpiry is SortedOraclesTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldSetReportExpiry() public {
    uint256 newReportExpiry = 7200;
    sortedOracle.setReportExpiry(newReportExpiry);
    assertEq(sortedOracle.reportExpirySeconds(), newReportExpiry);
  }

  function test_ShouldEmitReportExpirySetEvent() public {
    uint256 newReportExpiry = 7200;
    vm.expectEmit(true, true, true, true);
    emit ReportExpirySet(newReportExpiry);
    sortedOracle.setReportExpiry(newReportExpiry);
  }

  function test_ShouldRevertWhenNotOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(oracleAccount);
    sortedOracle.setReportExpiry(7200);
  }
}

contract SetTokenReportExpiry is SortedOraclesTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldSetTokenReportExpiry() public {
    uint256 newReportExpiry = 7200;
    sortedOracle.setTokenReportExpiry(aToken, newReportExpiry);
    assertEq(sortedOracle.tokenReportExpirySeconds(aToken), newReportExpiry);
  }

  function test_ShouldEmitTokenReportExpirySetEvent() public {
    uint256 newReportExpiry = 7200;
    vm.expectEmit(true, true, true, true);
    emit TokenReportExpirySet(aToken, newReportExpiry);
    sortedOracle.setTokenReportExpiry(aToken, newReportExpiry);
  }

  function test_ShouldRevertWhenNotOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(oracleAccount);
    sortedOracle.setTokenReportExpiry(aToken, 7200);
  }
}

contract AddOracle is SortedOraclesTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldAddOracle() public {
    sortedOracle.addOracle(aToken, oracleAccount);
    assertEq(sortedOracle.isOracle(aToken, oracleAccount), true);
  }

  function test_ShouldEmitOracleAddedEvent() public {
    vm.expectEmit(true, true, true, true);
    emit OracleAdded(aToken, oracleAccount);
    sortedOracle.addOracle(aToken, oracleAccount);
  }

  function test_ShouldRevertWhenNotOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(oracleAccount);
    sortedOracle.addOracle(aToken, oracleAccount);
  }

  function test_ShouldRevertWhenAlreadyOracle() public {
    sortedOracle.addOracle(aToken, oracleAccount);
    vm.expectRevert(
      "token addr was null or oracle addr was null or oracle addr is not an oracle for token addr"
    );
    sortedOracle.addOracle(aToken, oracleAccount);
  }

  function test_ShouldRevertWhenOracleIsZeroAddress() public {
    vm.expectRevert(
      "token addr was null or oracle addr was null or oracle addr is not an oracle for token addr"
    );
    sortedOracle.addOracle(aToken, address(0));
  }

  function test_ShouldRevertWhenTokenIsZeroAddress() public {
    vm.expectRevert(
      "token addr was null or oracle addr was null or oracle addr is not an oracle for token addr"
    );
    sortedOracle.addOracle(address(0), oracleAccount);
  }
}

contract GetTokenReportExpirySeconds is SortedOraclesTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldGetTokenReportExpirySeconds_WhenNoTokenLevelExpiryIsSet() public {
    assertEq(sortedOracle.getTokenReportExpirySeconds(aToken), reportExpiry);
  }

  function test_ShouldGetTokenReportExpirySeconds_WhenTokenLevelExpiryIsSet() public {
    uint256 newReportExpiry = 7200;
    sortedOracle.setTokenReportExpiry(aToken, newReportExpiry);
    assertEq(sortedOracle.getTokenReportExpirySeconds(aToken), newReportExpiry);
  }
}

contract RemoveExpiredReports is SortedOraclesTest {
  function setUp() public {
    super.setUp();
    sortedOracle.addOracle(aToken, oracleAccount);
  }

  function test_ShouldRevertWhenNoReportExists() public {
    vm.expectRevert("token addr null or trying to remove too many reports");
    sortedOracle.removeExpiredReports(aToken, 1);
  }

  function test_ShouldRevertWhenReportIsNotExpired() public {
    vm.prank(oracleAccount);
    sortedOracle.report(
      aToken,
      FixidityLib.newFixedFraction(1, 1).unwrap(),
      address(0),
      address(0)
    );
    vm.expectRevert("token addr null or trying to remove too many reports");
    sortedOracle.removeExpiredReports(aToken, 1);
  }

  function helper_AddMultipleReports(uint256 numReports) public {
    vm.warp(YEAR_IN_SECONDS + reportExpiry / 2);
    for (uint256 i = 0; i < numReports; i++) {
      address oracle = actor(string(abi.encode("oracle", i)));
      sortedOracle.addOracle(aToken, oracle);
      vm.prank(oracle);
      sortedOracle.report(
        aToken,
        FixidityLib.newFixedFraction(2, 1).unwrap(),
        oracleAccount,
        address(0)
      );
    }
  }

  function test_ShouldDoNothingWhenOldestReportIsNotExpired() public {
    vm.prank(oracleAccount);
    sortedOracle.report(
      aToken,
      FixidityLib.newFixedFraction(1, 1).unwrap(),
      address(0),
      address(0)
    );
    helper_AddMultipleReports(4);
    sortedOracle.removeExpiredReports(aToken, 3);
    assertEq(sortedOracle.numTimestamps(aToken), 5);
  }

  function test_ShouldRemoveKAndStopWhenKIsLessThanNReportsAreExpired() public {
    vm.prank(oracleAccount);
    sortedOracle.report(
      aToken,
      FixidityLib.newFixedFraction(1, 1).unwrap(),
      address(0),
      address(0)
    );
    helper_AddMultipleReports(4);
    vm.warp(YEAR_IN_SECONDS + reportExpiry + 1);
    sortedOracle.removeExpiredReports(aToken, 3);
    assertEq(sortedOracle.numTimestamps(aToken), 4);
  }

  function test_ShouldRevertWhenNGreaterOrEqualToNumTimestamps() public {
    vm.prank(oracleAccount);
    sortedOracle.report(
      aToken,
      FixidityLib.newFixedFraction(1, 1).unwrap(),
      address(0),
      address(0)
    );
    helper_AddMultipleReports(4);
    vm.expectRevert("token addr null or trying to remove too many reports");
    sortedOracle.removeExpiredReports(aToken, 5);
  }

  function test_ShouldRemoveNWhenNIsLesserThanNumTimestamps() public {
    vm.prank(oracleAccount);
    sortedOracle.report(
      aToken,
      FixidityLib.newFixedFraction(1, 1).unwrap(),
      address(0),
      address(0)
    );
    helper_AddMultipleReports(4);
    vm.warp(YEAR_IN_SECONDS + 2 * reportExpiry);
    sortedOracle.removeExpiredReports(aToken, 3);
    assertEq(sortedOracle.numTimestamps(aToken), 2);
  }
}

contract IsOldestReportExpired is SortedOraclesTest {
  function setUp() public {
    super.setUp();
    sortedOracle.addOracle(aToken, oracleAccount);
  }

  function test_ShouldReturnTrueWhenNoReportExists() public {
    (bool expired, ) = sortedOracle.isOldestReportExpired(aToken);
    assertEq(expired, true);
  }

  function test_ShouldReturnTrueWhenOldestReportIsExpired() public {
    vm.prank(oracleAccount);
    sortedOracle.report(
      aToken,
      FixidityLib.newFixedFraction(1, 1).unwrap(),
      address(0),
      address(0)
    );
    vm.warp(YEAR_IN_SECONDS + reportExpiry + 1);
    (bool expired, ) = sortedOracle.isOldestReportExpired(aToken);
    assertEq(expired, true);
  }

  function test_ShouldReturnFalseWhenOldestReportIsNotExpired() public {
    vm.prank(oracleAccount);
    sortedOracle.report(
      aToken,
      FixidityLib.newFixedFraction(1, 1).unwrap(),
      address(0),
      address(0)
    );
    vm.warp(YEAR_IN_SECONDS + reportExpiry - 1);
    (bool expired, ) = sortedOracle.isOldestReportExpired(aToken);
    assertEq(expired, false);
  }

  function test_ShouldNotExpire_WhenNoTimeHasPassedAndPerTokenExpiryIsSetToHigherThanDefault()
    public
  {
    uint256 newReportExpiry = reportExpiry * 2;
    vm.prank(oracleAccount);
    sortedOracle.report(
      aToken,
      FixidityLib.newFixedFraction(1, 1).unwrap(),
      address(0),
      address(0)
    );
    sortedOracle.setTokenReportExpiry(aToken, newReportExpiry);
    (bool expired, ) = sortedOracle.isOldestReportExpired(aToken);
    assertEq(expired, false);
  }

  function test_ShouldNotExpire_WhenDefaultExpiryHasPassedAndPerTokenExpiryIsSetToHigherThanDefault()
    public
  {
    uint256 newReportExpiry = reportExpiry * 2;
    vm.prank(oracleAccount);
    sortedOracle.report(
      aToken,
      FixidityLib.newFixedFraction(1, 1).unwrap(),
      address(0),
      address(0)
    );
    sortedOracle.setTokenReportExpiry(aToken, newReportExpiry);
    vm.warp(YEAR_IN_SECONDS + reportExpiry + 1);
    (bool expired, ) = sortedOracle.isOldestReportExpired(aToken);
    assertEq(expired, false);
  }

  function test_ShouldNotExpire_WhenNoTimeHasPassedAndPerTokenExpiryIsSetToLowerThanDefault()
    public
  {
    uint256 newReportExpiry = reportExpiry / 2;
    vm.prank(oracleAccount);
    sortedOracle.report(
      aToken,
      FixidityLib.newFixedFraction(1, 1).unwrap(),
      address(0),
      address(0)
    );
    sortedOracle.setTokenReportExpiry(aToken, newReportExpiry);
    (bool expired, ) = sortedOracle.isOldestReportExpired(aToken);
    assertEq(expired, false);
  }

  function test_ShouldExpire_WhenDefaultExpiryHasPassedAndPerTokenExpiryIsSetToLowerThanDefault()
    public
  {
    uint256 newReportExpiry = reportExpiry / 2;
    vm.prank(oracleAccount);
    sortedOracle.report(
      aToken,
      FixidityLib.newFixedFraction(1, 1).unwrap(),
      address(0),
      address(0)
    );
    sortedOracle.setTokenReportExpiry(aToken, newReportExpiry);
    vm.warp(YEAR_IN_SECONDS + reportExpiry + 1);
    (bool expired, ) = sortedOracle.isOldestReportExpired(aToken);
    assertEq(expired, true);
  }

  function test_ShouldExpire_WhenTokenExpiryHasPassedAndPerTokenExpiryIsSetToLowerThanDefault()
    public
  {
    uint256 newReportExpiry = reportExpiry / 2;
    vm.prank(oracleAccount);
    sortedOracle.report(
      aToken,
      FixidityLib.newFixedFraction(1, 1).unwrap(),
      address(0),
      address(0)
    );
    sortedOracle.setTokenReportExpiry(aToken, newReportExpiry);
    vm.warp(YEAR_IN_SECONDS + newReportExpiry + 1);
    (bool expired, ) = sortedOracle.isOldestReportExpired(aToken);
    assertEq(expired, true);
  }
}

contract RemoveOracle is SortedOraclesTest {
  address oracleAccount2 = actor("oracleAccount2");

  function setUp() public {
    super.setUp();
    sortedOracle.addOracle(aToken, oracleAccount);
  }

  function test_ShouldRemoveOracle() public {
    sortedOracle.removeOracle(aToken, oracleAccount, 0);
    assertEq(sortedOracle.isOracle(aToken, oracleAccount), false);
  }

  function helper_WhenThereIsMoreThanOneReportMade() public {
    sortedOracle.addOracle(aToken, oracleAccount2);
    vm.prank(oracleAccount);
    sortedOracle.report(
      aToken,
      FixidityLib.newFixedFraction(1, 1).unwrap(),
      address(0),
      address(0)
    );
    vm.prank(oracleAccount2);
    sortedOracle.report(
      aToken,
      FixidityLib.newFixedFraction(5, 1).unwrap(),
      oracleAccount,
      address(0)
    );
  }

  function test_ShouldDecreaseTheNumberOfRates_WhenThereIsMoreThanOneReportMade() public {
    helper_WhenThereIsMoreThanOneReportMade();
    sortedOracle.removeOracle(aToken, oracleAccount, 0);
    assertEq(sortedOracle.numRates(aToken), 1);
  }

  function test_ShouldDecreaseTheNumberOfTimestamps_WhenThereIsMoreThanOneReportMade() public {
    helper_WhenThereIsMoreThanOneReportMade();
    sortedOracle.removeOracle(aToken, oracleAccount, 0);
    assertEq(sortedOracle.numTimestamps(aToken), 1);
  }

  function test_ShouldEmitOracleRemoved_WhenTHereIsMOreThanOneReportMade() public {
    helper_WhenThereIsMoreThanOneReportMade();
    vm.expectEmit(true, true, true, true);
    emit OracleRemoved(aToken, oracleAccount2);
    sortedOracle.removeOracle(aToken, oracleAccount2, 1);
  }

  function test_OracleReportRemoved_WhenTHereIsMOreThanOneReportMade() public {
    helper_WhenThereIsMoreThanOneReportMade();

    vm.expectEmit(true, true, true, true);
    emit OracleReportRemoved(aToken, oracleAccount2);
    sortedOracle.removeOracle(aToken, oracleAccount2, 1);
  }

  function test_MedianUpdatedEvents_WhenTHereIsMOreThanOneReportMade() public {
    helper_WhenThereIsMoreThanOneReportMade();
    vm.expectEmit(true, true, true, true);
    emit MedianUpdated(aToken, FixidityLib.newFixedFraction(1, 1).unwrap());
    sortedOracle.removeOracle(aToken, oracleAccount2, 1);
  }

  function test_ShouldNotDecreaseTheNumberOfRates_WhenThereIsASingleReportLeft() public {
    vm.prank(oracleAccount);
    sortedOracle.report(
      aToken,
      FixidityLib.newFixedFraction(10, 1).unwrap(),
      address(0),
      address(0)
    );
    sortedOracle.removeOracle(aToken, oracleAccount, 0);
    assertEq(sortedOracle.numRates(aToken), 1);
  }

  function test_ShouldNotResetTheMedianRate_WhenThereIsASingleReportLeft() public {
    vm.prank(oracleAccount);
    sortedOracle.report(
      aToken,
      FixidityLib.newFixedFraction(10, 1).unwrap(),
      address(0),
      address(0)
    );
    (uint256 originalMedianRate, uint256 originalNumOfRates) = sortedOracle.medianRate(aToken);

    sortedOracle.removeOracle(aToken, oracleAccount, 0);
    (uint256 newMedianRate, uint256 newNumOfRates) = sortedOracle.medianRate(aToken);
    assertEq(originalMedianRate, newMedianRate);
    assertEq(originalNumOfRates, newNumOfRates);
  }

  function test_ShouldNotDecreaseTheNumberOfTimestamps_WhenThereIsASingleReportLeft() public {
    vm.prank(oracleAccount);
    sortedOracle.report(
      aToken,
      FixidityLib.newFixedFraction(10, 1).unwrap(),
      address(0),
      address(0)
    );
    sortedOracle.removeOracle(aToken, oracleAccount, 0);
    assertEq(sortedOracle.numTimestamps(aToken), 1);
  }

  function test_ShouldNotResetTheMedianTimestamp_WhenThereIsASingleReportLeft() public {
    vm.prank(oracleAccount);
    sortedOracle.report(
      aToken,
      FixidityLib.newFixedFraction(10, 1).unwrap(),
      address(0),
      address(0)
    );
    uint256 originalMedianTimestamp = sortedOracle.medianTimestamp(aToken);

    sortedOracle.removeOracle(aToken, oracleAccount, 0);
    uint256 newMedianTimestamp = sortedOracle.medianTimestamp(aToken);
    assertEq(originalMedianTimestamp, newMedianTimestamp);
  }

  // TODO: add test for not emitting any of the remove events once we migrate to 0.8

  function test_ShouldEmitOracleRemovedEvent() public {
    vm.expectEmit(true, true, true, true);
    emit OracleRemoved(aToken, oracleAccount);
    sortedOracle.removeOracle(aToken, oracleAccount, 0);
  }

  function test_ShouldRevertWhenWrongIndexIsProvided() public {
    vm.expectRevert(
      "token addr null or oracle addr null or index of token oracle not mapped to oracle addr"
    );
    sortedOracle.removeOracle(aToken, oracleAccount, 1);
  }

  function test_ShouldRevertWhenWrongAddressIsProvided() public {
    vm.expectRevert(
      "token addr null or oracle addr null or index of token oracle not mapped to oracle addr"
    );
    sortedOracle.removeOracle(aToken, address(this), 0);
  }

  function test_ShouldRevertWhenCalledByNonOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(oracleAccount);
    sortedOracle.removeOracle(aToken, oracleAccount, 0);
  }
}

contract Report is SortedOraclesTest {
  uint256 value = FixidityLib.newFixedFraction(10, 1).unwrap();
  uint256 newValue = FixidityLib.newFixedFraction(12, 1).unwrap();

  address anotherOracle = actor("anotherOracle");
  uint256 oracleValue1 = FixidityLib.newFixedFraction(2, 1).unwrap();
  uint256 oracleValue2 = FixidityLib.newFixedFraction(3, 1).unwrap();
  uint256 anotherOracleValue = FixidityLib.newFixedFraction(1, 1).unwrap();

  function setUp() public {
    super.setUp();
    sortedOracle.addOracle(aToken, oracleAccount);
  }

  function test_ShouldIncreaseTheNumberOfRates() public {
    vm.prank(oracleAccount);
    sortedOracle.report(aToken, value, address(0), address(0));
    assertEq(sortedOracle.numRates(aToken), 1);
  }

  function test_ShouldSetTheMedianRate() public {
    vm.prank(oracleAccount);
    sortedOracle.report(aToken, value, address(0), address(0));
    (uint256 medianRate, uint256 denominator) = sortedOracle.medianRate(aToken);
    assertEq(medianRate, value);
    assertEq(denominator, FixidityLib.newFixedFraction(1, 1).unwrap());
  }

  function test_ShouldIncreaseTheNumberOfTimestamps() public {
    vm.prank(oracleAccount);
    sortedOracle.report(aToken, value, address(0), address(0));
    assertEq(sortedOracle.numTimestamps(aToken), 1);
  }

  function test_ShouldEmitOracleReportedEvent() public {
    vm.expectEmit(true, true, true, true);
    emit OracleReported(aToken, oracleAccount, now, value);
    vm.prank(oracleAccount);
    sortedOracle.report(aToken, value, address(0), address(0));
  }

  function test_ShouldEmitMedianUpdatedEvent() public {
    vm.expectEmit(true, true, true, true);
    emit MedianUpdated(aToken, value);
    vm.prank(oracleAccount);
    sortedOracle.report(aToken, value, address(0), address(0));
  }

  function test_ShouldRevertWhenCalledByNonOracle() public {
    vm.expectRevert("sender was not an oracle for token addr");
    sortedOracle.report(aToken, value, address(0), address(0));
  }

  function test_ShouldSetTheMedianRate_WhenThereIsTwoReportsFromSameOracle() public {
    vm.prank(oracleAccount);
    sortedOracle.report(aToken, value, address(0), address(0));
    (uint256 medianRateOriginal, uint256 denominatorOriginal) = sortedOracle.medianRate(aToken);
    assertEq(medianRateOriginal, value);
    assertEq(denominatorOriginal, FixidityLib.newFixedFraction(1, 1).unwrap());
    vm.prank(oracleAccount);
    sortedOracle.report(aToken, newValue, address(0), address(0));
    (uint256 medianRate, uint256 denominator) = sortedOracle.medianRate(aToken);
    assertEq(medianRate, newValue);
    assertEq(denominator, FixidityLib.newFixedFraction(1, 1).unwrap());
  }

  function test_ShouldNotChangeTheNumberOfTotalReports_WhenThereIsTwoReportsFromSameOracle()
    public
  {
    vm.prank(oracleAccount);
    sortedOracle.report(aToken, value, address(0), address(0));
    vm.prank(oracleAccount);
    sortedOracle.report(aToken, newValue, address(0), address(0));
    assertEq(sortedOracle.numRates(aToken), 1);
  }

  function helper_WhenThereAreMultipleReportsTheMostRecentOneDoneByThisOracle() public {
    sortedOracle.addOracle(aToken, anotherOracle);
    vm.prank(anotherOracle);
    sortedOracle.report(aToken, anotherOracleValue, address(0), address(0));
    vm.warp(YEAR_IN_SECONDS + 5);
    vm.prank(oracleAccount);
    sortedOracle.report(aToken, oracleValue1, anotherOracle, address(0));
    vm.warp(YEAR_IN_SECONDS + 10);
    (, uint256[] memory rateValues, ) = sortedOracle.getRates(aToken);
    assertEq(rateValues[0], oracleValue1);
    assertEq(rateValues[1], anotherOracleValue);

  }

  function test_ShouldUpdateTheLIstOfRatesCorrectly_WhenThereAreMultipleReportsTheMostRecentOneDoneByThisOracle()
    public
  {
    helper_WhenThereAreMultipleReportsTheMostRecentOneDoneByThisOracle();

    vm.prank(oracleAccount);
    sortedOracle.report(aToken, oracleValue2, anotherOracle, address(0));

    (, uint256[] memory rateValues, ) = sortedOracle.getRates(aToken);
    assertEq(rateValues[0], oracleValue2);
    assertEq(rateValues[1], anotherOracleValue);
  }

  function test_ShouldUpdateTheLAtestTimestamp_WhenThereAreMultipleReportsTheMostRecentOneDoneByThisOracle()
    public
  {
    helper_WhenThereAreMultipleReportsTheMostRecentOneDoneByThisOracle();

    (, uint256[] memory timestampValuesBefore, ) = sortedOracle.getTimestamps(aToken);

    vm.prank(oracleAccount);
    sortedOracle.report(aToken, oracleValue2, anotherOracle, address(0));

    (, uint256[] memory timestampValuesAfter, ) = sortedOracle.getTimestamps(aToken);

    assertGt(timestampValuesAfter[0], timestampValuesBefore[0]);
    assertEq(timestampValuesBefore[1], timestampValuesAfter[1]);
  }

}
