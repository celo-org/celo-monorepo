// SPDX-License-Identifier: GPL-3.0-or-later
// solhint-disable func-name-mixedcase, var-name-mixedcase, state-visibility
// solhint-disable const-name-snakecase, max-states-count, contract-name-camelcase
pragma solidity ^0.5.13;

import { Test, console2 as console } from "celo-foundry/Test.sol";

import { SortedLinkedListWithMedian } from "contracts/common/linkedlists/SortedLinkedListWithMedian.sol";
import { FixidityLib } from "contracts/common/FixidityLib.sol";

import { IBreakerBox } from "@celo-contracts/stability/interfaces/IBreakerBox.sol";
import { SortedOracles } from "@celo-contracts/stability/SortedOracles.sol";

contract MockBreakerBox is IBreakerBox {
  uint256 public tradingMode;

  function setTradingMode(uint256 _tradingMode) external {
    tradingMode = _tradingMode;
  }

  function getBreakers() external view returns (address[] memory) {
    return new address[](0);
  }

  function isBreaker(address) external view returns (bool) {
    return true;
  }

  function getRateFeedTradingMode(address) external view returns (uint8) {
    return 0;
  }

  function checkAndSetBreakers(address) external {}
}

contract SortedOraclesTest is Test {
  // Declare SortedOracles events for matching
  event ReportExpirySet(uint256 reportExpiry);
  event TokenReportExpirySet(address token, uint256 reportExpiry);
  event OracleAdded(address indexed token, address indexed oracleAddress);
  event OracleRemoved(address indexed token, address indexed oracleAddress);
  event OracleReportRemoved(address indexed token, address indexed oracle);
  event MedianUpdated(address indexed token, uint256 value);
  event OracleReported(
    address indexed token,
    address indexed oracle,
    uint256 timestamp,
    uint256 value
  );
  event BreakerBoxUpdated(address indexed newBreakerBox);

  SortedOracles sortedOracles;
  address owner;
  address notOwner;
  address rando;
  address token;
  uint256 aReportExpiry = 3600;
  uint256 fixed1 = FixidityLib.unwrap(FixidityLib.fixed1());

  address oracle;

  bytes32 constant MOCK_EXCHANGE_ID = keccak256(abi.encodePacked("mockExchange"));

  MockBreakerBox mockBreakerBox;

  function setUp() public {
    sortedOracles = new SortedOracles(true);
    sortedOracles.initialize(aReportExpiry);

    owner = address(this);
    notOwner = address(10);
    rando = address(2);
    token = address(3);
    oracle = address(4);

    mockBreakerBox = new MockBreakerBox();
    sortedOracles.setBreakerBox(IBreakerBox(mockBreakerBox));
    vm.startPrank(owner);
    currentPrank = owner;
  }

  /**
   * @notice Test helper function. Submits n Reports for a token from n different Oracles.
   */

  function submitNReports(uint256 n) public {
    sortedOracles.addOracle(token, oracle);
    changePrank(oracle);
    sortedOracles.report(token, fixed1 * 10, address(0), address(0));
    for (uint256 i = 5; i < 5 + n - 1; i++) {
      address anotherOracle = address(i);
      changePrank(owner);
      sortedOracles.addOracle(token, anotherOracle);
      changePrank(address(i));
      sortedOracles.report(token, fixed1 * 10, oracle, address(0));
    }
    changePrank(owner);
  }
}

/**
 * @notice Tests
 */
contract SortedOracles_initialize is SortedOraclesTest {
  function test_initialize_shouldHaveSetTheOwner() public {
    assertEq(sortedOracles.owner(), owner);
  }

  function test_initialize_shouldHaveSetReportExpiryToAReportExpiry() public {
    assertEq(sortedOracles.reportExpirySeconds(), aReportExpiry);
  }

  function test_initialize_whenCalledAgain_shouldRevert() public {
    vm.expectRevert("contract already initialized");
    sortedOracles.initialize(aReportExpiry);
  }
}

contract SortedOracles_setReportExpiry is SortedOraclesTest {
  function test_setReportExpiry_shouldUpdateReportExpiry() public {
    sortedOracles.setReportExpiry(aReportExpiry + 1);
    assertEq(sortedOracles.reportExpirySeconds(), aReportExpiry + 1);
  }

  function test_setReportExpiry_shouldEmitEvent() public {
    vm.expectEmit(true, true, true, true, address(sortedOracles));
    emit ReportExpirySet(aReportExpiry + 1);
    sortedOracles.setReportExpiry(aReportExpiry + 1);
  }

  function test_setReportExpiry_whenCalledByNonOwner_shouldRevert() public {
    vm.expectRevert("Ownable: caller is not the owner");
    changePrank(rando);
    sortedOracles.setReportExpiry(aReportExpiry + 1);
  }
}

contract SortedOracles_setTokenReportExpiry is SortedOraclesTest {
  uint256 aNewReportExpiry = aReportExpiry + 1;

  function test_setTokenReportExpiry_shouldUpdateTokenReportExpiry() public {
    sortedOracles.setTokenReportExpiry(token, aNewReportExpiry);
    assertEq(sortedOracles.tokenReportExpirySeconds(token), aNewReportExpiry);
  }

  function test_setTokenReportExpiry_shouldEmitTokenReportExpirySetEvent() public {
    vm.expectEmit(true, true, true, true, address(sortedOracles));
    emit TokenReportExpirySet(token, aNewReportExpiry);
    sortedOracles.setTokenReportExpiry(token, aNewReportExpiry);
  }

  function test_setTokenReportExpiry_whenCalledByNonOwner_shouldRevert() public {
    vm.expectRevert("Ownable: caller is not the owner");
    changePrank(rando);
    sortedOracles.setTokenReportExpiry(token, aNewReportExpiry);
  }
}

contract SortedOracles_getTokenReportExpiry is SortedOraclesTest {
  function test_getTokenReportExpirySeconds_whenNoTokenLevelExpiryIsSet_shouldReturnContractLevel()
    public
  {
    assertEq(sortedOracles.getTokenReportExpirySeconds(token), aReportExpiry);
  }

  function test_getTokenReportExpirySeconds_whenTokenLevelExpiryIsSet_shouldReturnTokenLevel()
    public
  {
    sortedOracles.setTokenReportExpiry(token, aReportExpiry + 1);
    assertEq(sortedOracles.getTokenReportExpirySeconds(token), aReportExpiry + 1);
  }
}

contract SortedOracles_addOracles is SortedOraclesTest {
  function test_addOracle_shouldAddAnOracle() public {
    sortedOracles.addOracle(token, oracle);
    assertTrue(sortedOracles.isOracle(token, oracle));
  }

  function test_addOracle_shouldEmitEvent() public {
    vm.expectEmit(true, true, true, true, address(sortedOracles));
    emit OracleAdded(token, oracle);
    sortedOracles.addOracle(token, oracle);
  }

  function test_addOracle_whenTokenIsTheNullAddress_shouldRevert() public {
    vm.expectRevert(
      "token addr was null or oracle addr was null or oracle addr is already an oracle for token addr"
    );
    sortedOracles.addOracle(address(0), oracle);
  }

  function test_addOracle_whenOracleIsTheNullAddress_shouldRevert() public {
    vm.expectRevert(
      "token addr was null or oracle addr was null or oracle addr is already an oracle for token addr"
    );
    sortedOracles.addOracle(token, address(0));
  }

  function test_addOracle_whenOracleHasBeenAdded_shouldRevert() public {
    sortedOracles.addOracle(token, oracle);
    vm.expectRevert(
      "token addr was null or oracle addr was null or oracle addr is already an oracle for token addr"
    );
    sortedOracles.addOracle(token, oracle);
  }

  function test_addOracle_whenCalledByNonOwner_shouldRevert() public {
    vm.expectRevert("Ownable: caller is not the owner");
    changePrank(rando);
    sortedOracles.addOracle(token, oracle);
  }
}

contract SortedOracles_breakerBox is SortedOraclesTest {
  function test_setBreakerBox_whenCalledByNonOwner_shouldRevert() public {
    changePrank(notOwner);
    vm.expectRevert("Ownable: caller is not the owner");
    sortedOracles.setBreakerBox(MockBreakerBox(address(0)));
  }

  function test_setBreakerBox_whenGivenAddressIsNull_shouldRevert() public {
    vm.expectRevert("BreakerBox address must be set");
    sortedOracles.setBreakerBox(MockBreakerBox(address(0)));
  }

  function test_setBreakerBox_shouldUpdateAndEmit() public {
    sortedOracles = new SortedOracles(true);
    assertEq(address(sortedOracles.breakerBox()), address(0));
    vm.expectEmit(true, true, true, true);
    emit BreakerBoxUpdated(address(mockBreakerBox));

    sortedOracles.setBreakerBox(mockBreakerBox);
    assertEq(address(sortedOracles.breakerBox()), address(mockBreakerBox));
  }
}

contract SortedOracles_RemoveOracles is SortedOraclesTest {
  function test_removeOracle_shouldRemoveAnOracle() public {
    sortedOracles.addOracle(token, oracle);
    sortedOracles.removeOracle(token, oracle, 0);
    assertFalse(sortedOracles.isOracle(token, oracle));
  }

  function test_removeOracle_whenMoreThanOneReportExists_shouldDecreaseNumberOfRates() public {
    submitNReports(2);
    sortedOracles.removeOracle(token, oracle, 0);
    assertEq(sortedOracles.numRates(token), 1);
  }

  function test_removeOracle_whenMoreThanOneReportExists_shouldDecreaseNumberOfTimestamps() public {
    submitNReports(2);
    sortedOracles.removeOracle(token, oracle, 0);
    assertEq(sortedOracles.numTimestamps(token), 1);
  }

  function test_removeOracle_whenMoreThanOneReportExists_shouldEmitOracleRemovedOracleReportRemovedMedianUpdatedEvent()
    public
  {
    submitNReports(1);
    sortedOracles.addOracle(token, address(6));
    changePrank(address(6));
    sortedOracles.report(token, fixed1 * 12, oracle, address(0));

    vm.expectEmit(true, true, true, true, address(sortedOracles));
    emit OracleReportRemoved(token, address(6));
    vm.expectEmit(true, true, true, true, address(sortedOracles));
    emit MedianUpdated(token, fixed1 * 10);
    vm.expectEmit(true, true, true, true, address(sortedOracles));
    emit OracleRemoved(token, address(6));

    changePrank(owner);
    sortedOracles.removeOracle(token, address(6), 1);
  }

  function test_removeOracle_whenOneReportExists_shouldNotDecreaseNumberOfRates() public {
    submitNReports(1);
    sortedOracles.removeOracle(token, oracle, 0);
    assertEq(sortedOracles.numRates(token), 1);
  }

  function test_removeOracle_whenOneReportExists_shouldNotResetTheMedianRate() public {
    submitNReports(1);
    (uint256 numeratorBefore, ) = sortedOracles.medianRate(token);
    sortedOracles.removeOracle(token, oracle, 0);
    (uint256 numeratorAfter, ) = sortedOracles.medianRate(token);
    assertEq(numeratorBefore, numeratorAfter);
  }

  function test_removeOracle_whenOneReportExists_shouldNotDecreaseNumberOfTimestamps() public {
    submitNReports(1);
    sortedOracles.removeOracle(token, oracle, 0);
    assertEq(sortedOracles.numTimestamps(token), 1);
  }

  function test_removeOracle_whenOneReportExists_shouldNotResetTheMedianTimestamp() public {
    submitNReports(1);
    uint256 medianTimestampBefore = sortedOracles.medianTimestamp(token);
    sortedOracles.removeOracle(token, oracle, 0);
    uint256 medianTimestampAfter = sortedOracles.medianTimestamp(token);
    assertEq(medianTimestampBefore, medianTimestampAfter);
  }

  function testFail_removeOracle_whenOneReportExists_shouldNotEmitTheOracleReportedAndMedianUpdatedEvent()
    public
  {
    // testFail feals impricise here.
    // TODO: Better way of testing this case :)
    submitNReports(1);
    vm.expectEmit(true, true, true, true, address(sortedOracles));
    emit OracleReportRemoved(token, oracle);
    vm.expectEmit(true, true, true, true, address(sortedOracles));
    emit MedianUpdated(token, 0);
    sortedOracles.removeOracle(token, oracle, 0);
  }

  function test_removeOracle_whenOneReportExists_shouldEmitTheOracleRemovedEvent() public {
    submitNReports(1);
    vm.expectEmit(true, true, true, true, address(sortedOracles));
    emit OracleRemoved(token, oracle);
    sortedOracles.removeOracle(token, oracle, 0);
  }

  function test_removeOracle_whenIndexIsWrong_shouldRevert() public {
    submitNReports(1);
    vm.expectRevert(
      "token addr null or oracle addr null or index of token oracle not mapped to oracle addr"
    );
    sortedOracles.removeOracle(token, oracle, 1);
  }

  function test_removeOracle_whenAddressIsWrong_shouldRevert() public {
    submitNReports(1);
    vm.expectRevert(
      "token addr null or oracle addr null or index of token oracle not mapped to oracle addr"
    );
    sortedOracles.removeOracle(token, address(15), 0);
  }

  function test_removeOracle_whenCalledByNonOwner_shouldRevert() public {
    submitNReports(1);
    vm.expectRevert("Ownable: caller is not the owner");
    changePrank(rando);
    sortedOracles.removeOracle(token, address(15), 0);
  }
}

contract SortedOracles_removeExpiredReports is SortedOraclesTest {
  function test_removeExpiredReports_whenNoReportExists_shouldRevert() public {
    sortedOracles.addOracle(token, oracle);
    vm.expectRevert("token addr null or trying to remove too many reports");
    sortedOracles.removeExpiredReports(token, 1);
  }

  function test_removeExpiredReports_whenOnlyOneReportExists_shouldRevert() public {
    sortedOracles.addOracle(token, oracle);
    changePrank(oracle);
    sortedOracles.report(token, fixed1, address(0), address(0));
    vm.expectRevert("token addr null or trying to remove too many reports");
    sortedOracles.removeExpiredReports(token, 1);
  }

  function test_removeExpiredReports_whenOldestReportIsNotExpired_shouldDoNothing() public {
    submitNReports(5);
    sortedOracles.removeExpiredReports(token, 3);
    assertEq(sortedOracles.numTimestamps(token), 5);
  }

  function test_removeExpiredReports_whenLessThanNReportsAreExpired_shouldRemoveAllExpiredAndStop()
    public
  {
    //first 5 expired reports
    submitNReports(5);
    skip(aReportExpiry);
    //two reports that aren't expired
    sortedOracles.addOracle(token, address(10));
    changePrank(address(10));
    sortedOracles.report(token, fixed1 * 10, oracle, address(0));
    changePrank(owner);
    sortedOracles.addOracle(token, address(11));
    changePrank(address(11));
    sortedOracles.report(token, fixed1 * 10, oracle, address(0));

    changePrank(owner);
    sortedOracles.removeExpiredReports(token, 6);
    assertEq(sortedOracles.numTimestamps(token), 2);
  }

  function test_removeExpiredReports_whenNLargerThanNumberOfTimestamps_shouldRevert() public {
    submitNReports(5);
    vm.expectRevert("token addr null or trying to remove too many reports");
    sortedOracles.removeExpiredReports(token, 7);
  }

  function test_removeExpiredReports_whenNReportsAreExpired_shouldRemoveNReports() public {
    submitNReports(6);
    skip(aReportExpiry);
    sortedOracles.removeExpiredReports(token, 5);
    assertEq(sortedOracles.numTimestamps(token), 1);
  }

  function test_removeExpiredReports_whenMoreThanOneReportExistsAndMedianUpdated_shouldCallCheckAndSetBreakers()
    public
  {
    submitNReports(2);
    sortedOracles.addOracle(token, address(6));
    changePrank(address(6));

    vm.warp(now + aReportExpiry);
    sortedOracles.report(token, fixed1 * 12, oracle, address(0));

    vm.expectEmit(false, false, false, false, address(sortedOracles));
    emit OracleReportRemoved(token, rando);
    vm.expectEmit(true, true, true, true, address(sortedOracles));
    emit MedianUpdated(token, fixed1 * 12);
    vm.expectCall(
      address(mockBreakerBox),
      abi.encodeWithSelector(mockBreakerBox.checkAndSetBreakers.selector)
    );

    sortedOracles.removeExpiredReports(token, 2);
  }
}

contract SortedOracles_isOldestReportExpired is SortedOraclesTest {
  function test_isOldestReportExpired_whenNoReportsExist_shouldReturnTrue() public {
    //added this skip because foundry starts at a block time of 0
    //without the skip isOldestReortExpired would return false when no reports exist
    skip(aReportExpiry);
    sortedOracles.addOracle(token, oracle);
    (bool isReportExpired, ) = sortedOracles.isOldestReportExpired(token);
    assertTrue(isReportExpired);
  }

  function test_isOldestReportExpired_whenReportIsExpired_shouldReturnTrue() public {
    submitNReports(1);
    skip(aReportExpiry);
    (bool isReportExpired, ) = sortedOracles.isOldestReportExpired(token);
    assertTrue(isReportExpired);
  }

  function test_isOldestReportExpired_whenReportIsntExpired_shouldReturnFalse() public {
    submitNReports(1);
    (bool isReportExpired, ) = sortedOracles.isOldestReportExpired(token);
    assertFalse(isReportExpired);
  }

  function test_isOldestReportExpired_whenTokenSpecificExpiryIsntExceeded_shoulReturnFalse()
    public
  {
    submitNReports(1);
    sortedOracles.setTokenReportExpiry(token, aReportExpiry * 2);
    //neither general nor specific Expiry expired
    (bool isReportExpired, ) = sortedOracles.isOldestReportExpired(token);
    assertFalse(isReportExpired);
    //general Expiry expired but not specific
    skip(aReportExpiry);
    (isReportExpired, ) = sortedOracles.isOldestReportExpired(token);
    assertFalse(isReportExpired);
  }

  function test_isOldestReportExpired_whenSpecificTokenExpiryIsExceeded_shouldReturnTrue() public {
    submitNReports(1);
    sortedOracles.setTokenReportExpiry(token, aReportExpiry * 2);
    skip(aReportExpiry * 2);
    (bool isReportExpired, ) = sortedOracles.isOldestReportExpired(token);
    assertTrue(isReportExpired);
  }

  function test_isOldestReportExpired_whenSpecificExpiryIsLowerButNotExpired_shouldReturnFalse()
    public
  {
    submitNReports(1);
    sortedOracles.setTokenReportExpiry(token, (aReportExpiry * 1) / 2);
    (bool isReportExpired, ) = sortedOracles.isOldestReportExpired(token);
    assertFalse(isReportExpired);
  }

  function test_isOldestReportExpired_whenSpecificExpiryIsLowerAndGeneralExpiryIsExceeded_shouldReturnTrue()
    public
  {
    submitNReports(1);
    sortedOracles.setTokenReportExpiry(token, (aReportExpiry * 1) / 2);
    skip(aReportExpiry);
    (bool isReportExpired, ) = sortedOracles.isOldestReportExpired(token);
    assertTrue(isReportExpired);
  }

  function test_isOldestReportExpired_whenSpecificExpiryIsLowerAndSpecificExpiryIsExceeded_shouldReturnTrue()
    public
  {
    submitNReports(1);
    sortedOracles.setTokenReportExpiry(token, (aReportExpiry * 1) / 2);
    skip((aReportExpiry * 1) / 2);
    (bool isReportExpired, ) = sortedOracles.isOldestReportExpired(token);
    assertTrue(isReportExpired);
  }
}

contract SortedOracles_report is SortedOraclesTest {
  address oracleB = actor("oracleB");
  address oracleC = actor("oracleC");

  function test_report_shouldIncreaseTheNumberOfRates() public {
    assertEq(sortedOracles.numRates(token), 0);
    submitNReports(1);
    assertEq(sortedOracles.numRates(token), 1);
  }

  function test_report_shouldSetTheMedianRate() public {
    sortedOracles.addOracle(token, oracle);
    changePrank(oracle);
    sortedOracles.report(token, fixed1 * 10, address(0), address(0));
    (uint256 numerator, uint256 denominator) = sortedOracles.medianRate(token);
    assertEq(numerator, fixed1 * 10);
    assertEq(denominator, fixed1);
  }

  function test_report_shouldIncreaseTheNumberOfTimestamps() public {
    assertEq(sortedOracles.numTimestamps(token), 0);
    submitNReports(1);
    assertEq(sortedOracles.numTimestamps(token), 1);
  }

  function test_report_shouldSetTheMedianTimestamp() public {
    submitNReports(1);
    assertEq(block.timestamp, sortedOracles.medianTimestamp(token));
  }

  function test_report_shouldEmitTheOracleReportedAndMedianUpdatedEvent() public {
    sortedOracles.addOracle(token, oracle);
    vm.expectEmit(true, true, true, true, address(sortedOracles));
    emit OracleReported(token, oracle, block.timestamp, fixed1 * 10);
    emit MedianUpdated(token, fixed1 * 10);
    changePrank(oracle);
    sortedOracles.report(token, fixed1 * 10, address(0), address(0));
  }

  function test_report_whenCalledByNonOracle_shouldRevert() public {
    changePrank(rando);
    vm.expectRevert("sender was not an oracle for token addr");
    sortedOracles.report(token, fixed1, address(0), address(0));
  }

  function test_report_whenOneReportBySameOracleExists_shouldResetMedianRate() public {
    submitNReports(1);
    (uint256 numerator, uint256 denominator) = sortedOracles.medianRate(token);
    assertEq(numerator, fixed1 * 10);
    assertEq(denominator, fixed1);

    changePrank(oracle);
    sortedOracles.report(token, fixed1 * 20, address(0), address(0));
    (numerator, denominator) = sortedOracles.medianRate(token);
    assertEq(numerator, fixed1 * 20);
    assertEq(denominator, fixed1);
  }

  function test_report_whenOneReportBySameOracleExists_shouldNotChangeNumberOfTotalReports()
    public
  {
    submitNReports(1);
    uint256 initialNumberOfReports = sortedOracles.numRates(token);
    changePrank(oracle);
    sortedOracles.report(token, fixed1 * 20, address(0), address(0));
    assertEq(initialNumberOfReports, sortedOracles.numRates(token));
  }

  function test_report_whenMultipleReportsExistTheMostRecent_shouldUpdateListOfRatesCorrectly()
    public
  {
    address anotherOracle = address(5);
    uint256 oracleValue1 = fixed1;
    uint256 oracleValue2 = fixed1 * 2;
    uint256 oracleValue3 = fixed1 * 3;
    sortedOracles.addOracle(token, anotherOracle);
    sortedOracles.addOracle(token, oracle);

    changePrank(anotherOracle);
    sortedOracles.report(token, oracleValue1, address(0), address(0));
    changePrank(oracle);
    sortedOracles.report(token, oracleValue2, anotherOracle, address(0));

    //confirm correct setUp
    changePrank(owner);
    (address[] memory oracles, uint256[] memory rates, ) = sortedOracles.getRates(token);
    assertEq(oracle, oracles[0]);
    assertEq(oracleValue2, rates[0]);
    assertEq(anotherOracle, oracles[1]);
    assertEq(oracleValue1, rates[1]);

    changePrank(oracle);
    sortedOracles.report(token, oracleValue3, anotherOracle, address(0));

    changePrank(owner);
    (oracles, rates, ) = sortedOracles.getRates(token);
    assertEq(oracle, oracles[0]);
    assertEq(oracleValue3, rates[0]);
    assertEq(anotherOracle, oracles[1]);
    assertEq(oracleValue1, rates[1]);
  }

  function test_report_whenMultipleReportsExistTheMostRecent_shouldUpdateTimestampsCorrectly()
    public
  {
    address anotherOracle = address(5);
    uint256 oracleValue1 = fixed1;
    uint256 oracleValue2 = fixed1 * 2;
    uint256 oracleValue3 = fixed1 * 3;
    sortedOracles.addOracle(token, anotherOracle);
    sortedOracles.addOracle(token, oracle);

    changePrank(anotherOracle);
    uint256 timestamp0 = block.timestamp;
    sortedOracles.report(token, oracleValue1, address(0), address(0));
    skip(5);

    uint256 timestamp1 = block.timestamp;
    changePrank(oracle);
    sortedOracles.report(token, oracleValue2, anotherOracle, address(0));
    skip(5);

    //confirm correct setUp
    changePrank(owner);
    (address[] memory oracles, uint256[] memory timestamps, ) = sortedOracles.getTimestamps(token);
    assertEq(oracle, oracles[0]);
    assertEq(timestamp1, timestamps[0]);
    assertEq(anotherOracle, oracles[1]);
    assertEq(timestamp0, timestamps[1]);

    changePrank(oracle);
    uint256 timestamp3 = block.timestamp;
    sortedOracles.report(token, oracleValue3, anotherOracle, address(0));

    changePrank(owner);
    (oracles, timestamps, ) = sortedOracles.getTimestamps(token);
    assertEq(oracle, oracles[0]);
    assertEq(timestamp3, timestamps[0]);

    assertEq(anotherOracle, oracles[1]);
    assertEq(timestamp0, timestamps[1]);
  }

  function test_report_shouldCallBreakerBoxWithRateFeedID() public {
    // token is a legacy reference of rateFeedID
    sortedOracles.addOracle(token, oracle);
    sortedOracles.setBreakerBox(mockBreakerBox);

    vm.expectCall(
      address(mockBreakerBox),
      abi.encodeWithSelector(mockBreakerBox.checkAndSetBreakers.selector, token)
    );

    changePrank(oracle);

    sortedOracles.report(token, 9999, address(0), address(0));
  }
}
