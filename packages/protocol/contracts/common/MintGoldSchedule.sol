pragma solidity ^0.5.13;

import "forge-std/console2.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";

import "../common/FixidityLib.sol";
import "../common/libraries/ReentrancyGuard.sol";
import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "../common/interfaces/IGoldToken.sol";
import "../../contracts-0.8/common/IsL2Check.sol";

/**
 * @title Contract for minting new CELO token based on a schedule.
 */
contract MintGoldSchedule is UsingRegistry, ReentrancyGuard, Initializable, IsL2Check {
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;
  using Address for address payable; // prettier-ignore

  // uint256(-1) == 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
  uint256 internal constant MAX_UINT = uint256(-1);

  address payable constant BURN_ADDRESS = address(0x000000000000000000000000000000000000dEaD);

  // Beneficiaries of the CELO minted by this contract.
  address payable public beneficiary;

  // TODO:(soloseng) make this a list of beneficiaries.
  // address payable[] public beneficiaries;

  uint256 constant GENESIS_GOLD_SUPPLY = 600000000 ether; // 600 million Gold
  uint256 constant GOLD_SUPPLY_CAP = 1000000000 ether; // 1 billion Gold
  uint256 constant YEARS_LINEAR = 15;
  uint256 constant SECONDS_LINEAR = YEARS_LINEAR * 365 * 1 days;

  uint256 public startTime = 1587587214; // Copied over from `EpochRewards().startTime()`.

  // Indicates how much of the CELO has been minted so far.
  uint256 public totalMinted;

  event MintGoldInstanceCreated(address indexed beneficiary, address indexed atAddress);
  event MintGoldInstanceDestroyed(address indexed contractAddress);
  event DistributionLimitSet(address indexed beneficiary, uint256 maxDistribution);
  event BeneficiarySet(address indexed beneficiary);

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice A constructor for initialising a new instance of a MintGold contract.
   * @param _beneficiary Address of the beneficiary to whom minted CELO are transferred.
   * @param _mintGoldScheduleOwner Final Owner of the MintGoldSchedule contract.
   * @param registryAddress Address of the deployed contracts registry.
   */
  function initialize(
    address payable _beneficiary,
    address _mintGoldScheduleOwner,
    address registryAddress
  ) external initializer {
    _transferOwnership(msg.sender);

    require(
      _beneficiary != address(0),
      "The minting schedule beneficiary cannot be the zero addresss"
    );
    require(registryAddress != address(0), "The registry address cannot be the zero address");

    setRegistry(registryAddress);
    _setBeneficiary(_beneficiary);

    _transferOwnership(_mintGoldScheduleOwner);
    emit MintGoldInstanceCreated(beneficiary, address(this));
  }

  //  XXX: add new beneficiaries
  /**
   * @notice Sets the beneficiary of the instance
   * @param newBeneficiary The address of the new beneficiary
   */
  function setBeneficiary(address payable newBeneficiary) external onlyOwner {
    _setBeneficiary(newBeneficiary);
  }

  /**
   * @notice Mints CELO to the beneficiaries according to the predefined schedule.
   */
  function mintAccordingToSchedule() external nonReentrant onlyL2 {
    uint256 mintableAmount = getMintableAmount();
    require(mintableAmount > 0, "Mintable amount must be greater than zero");
    require(
      getRemainingBalanceToMint() >= mintableAmount,
      "Insufficient unlocked balance to mint amount"
    );
    totalMinted = totalMinted.add(mintableAmount);
    IGoldToken goldToken = IGoldToken(address(getGoldToken()));
    require(goldToken.mint(beneficiary, mintableAmount));
  }

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return Storage version of the contract.
   * @return Major version of the contract.
   * @return Minor version of the contract.
   * @return Patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 0, 0, 0);
  }

  /**
   * @notice Calculates remaining CELO balance to mint.
   * @return The remaining CELO balance to mint.
   */
  function getRemainingBalanceToMint() public view returns (uint256) {
    return GOLD_SUPPLY_CAP.sub(getGoldToken().totalSupply());
  }

  function getTotalMintedBySchedule() public view returns (uint256) {
    return totalMinted;
  }

  /**
   * @return The currently mintable amount.
   */
  function getMintableAmount() public view returns (uint256) {
    return getTargetGoldTotalSupply().sub(getGoldToken().totalSupply());
  }

  /**
   * @notice Returns the target Gold supply according to the target schedule.
   * @return The target Gold supply according to the target schedule.
   */
  function getTargetGoldTotalSupply() public view returns (uint256) {
    require(now > startTime, "StartTime has now yet been reached.");
    uint256 timeSinceGenesis = now.sub(startTime);

    // Pay out half of all block rewards linearly.
    uint256 linearRewards = GOLD_SUPPLY_CAP.sub(GENESIS_GOLD_SUPPLY).div(2);
    if (timeSinceGenesis < SECONDS_LINEAR) {
      uint256 targetRewards = linearRewards.mul(timeSinceGenesis).div(SECONDS_LINEAR);
      return targetRewards.add(GENESIS_GOLD_SUPPLY);
    } else {
      uint256 targetRewards = linearRewards.mul(SECONDS_LINEAR.sub(1)).div(SECONDS_LINEAR);
      if (totalMinted.add(GENESIS_GOLD_SUPPLY) < targetRewards.add(GENESIS_GOLD_SUPPLY)) {
        return targetRewards.add(GENESIS_GOLD_SUPPLY);
      }
      require(false, "Block reward calculation for years 15-30 unimplemented");
      return 0;
    }
  }

  // XXX: _addBeneficiary
  /**
   * @notice Sets the beneficiary of the instance
   * @param newBeneficiary The address of the new beneficiary
   */
  function _setBeneficiary(address payable newBeneficiary) private {
    require(newBeneficiary != address(0x0), "Can't set the beneficiary to the zero address");
    beneficiary = newBeneficiary;
    emit BeneficiarySet(newBeneficiary);
  }
}
