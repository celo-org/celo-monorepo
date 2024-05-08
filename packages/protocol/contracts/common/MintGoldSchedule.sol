pragma solidity ^0.5.13;

// import "forge-std/console2.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";

import "../common/FixidityLib.sol";
import "../common/libraries/ReentrancyGuard.sol";
import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "../../contracts-0.8/common/IsL2Check.sol";

contract MintGoldSchedule is UsingRegistry, ReentrancyGuard, Initializable, IsL2Check {
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;
  using Address for address payable; // prettier-ignore

  struct MintingSchedule {
    // Timestamp (in UNIX time) that minting begins.
    uint256 mintStartTime;
    // Timestamp (in UNIX time) of the minting cliff.
    uint256 mintCliffTime;
    // Number of minting periods.
    uint256 numMintingPeriods;
    // Duration (in seconds) of one period.
    uint256 mintingPeriod;
  }

  // uint256(-1) == 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
  uint256 internal constant MAX_UINT = uint256(-1);

  address payable constant BURN_ADDRESS = address(0x000000000000000000000000000000000000dEaD);

  // Beneficiaries of the CELO minted by this contract.
  address payable public beneficiary;

  // TODO:(soloseng) make this a list of beneficiaries.
  // address payable[] public beneficiaries;

  // Indicates how much of the CELO has been minted so far.
  uint256 public totalMinted;

  // Indicates the maximum CELO currently available for distribution, regardless of schedule.
  // Only settable by the owner.
  uint256 public maxDistribution;

  // Public struct housing params pertaining to minting CELO.
  MintingSchedule public mintingSchedule;

  // Total amount of CELO that should be minted by this contract.
  uint256 public totalAmountToMint;

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
   * @param mintStartTime The time (in Unix time) at which point releasing starts.
   * @param mintCliffTime Duration (in seconds) after `mintStartTime` of the CELO cliff.
   * @param numMintingPeriods Number of Minting periods.
   * @param mintingPeriod Duration (in seconds) of each minting period.
   * @param _totalAmountToMint Amount of CELO to mint
   * @param _beneficiary Address of the beneficiary to whom minted CELO are transferred.
   * @param _mintGoldScheduleOwner Final Owner of the MintGoldSchedule contract.
   * @param initialDistributionRatio Amount in range [0, 1000] (3 significant figures)
   *                                 indicating % of total balance available for distribution.
   * @param registryAddress Address of the deployed contracts registry.
   */
  function initialize(
    uint256 mintStartTime,
    uint256 mintCliffTime,
    uint256 numMintingPeriods,
    uint256 mintingPeriod,
    uint256 _totalAmountToMint,
    address payable _beneficiary,
    address _mintGoldScheduleOwner,
    uint256 initialDistributionRatio,
    address registryAddress
  ) external initializer {
    _transferOwnership(msg.sender);
    mintingSchedule.numMintingPeriods = numMintingPeriods;
    mintingSchedule.mintingPeriod = mintingPeriod;
    mintingSchedule.mintCliffTime = mintStartTime.add(mintCliffTime);
    mintingSchedule.mintStartTime = mintStartTime;

    require(_totalAmountToMint > 0, "Total amount to mint cannot be zero.");
    require(_totalAmountToMint < MAX_UINT, "Total amount to mint cannot be infinite.");
    require(mintingSchedule.numMintingPeriods >= 1, "There must be at least one minting period");
    require(
      _beneficiary != address(0),
      "The minting schedule beneficiary cannot be the zero addresss"
    );
    require(registryAddress != address(0), "The registry address cannot be the zero address");
    require(initialDistributionRatio <= 1000, "Initial distribution ratio out of bounds");

    setRegistry(registryAddress);
    _setBeneficiary(_beneficiary);

    totalAmountToMint = _totalAmountToMint;

    if (initialDistributionRatio < 1000) {
      // Initial ratio is expressed to 3 significant figures: [0, 1000].
      maxDistribution = totalAmountToMint.mul(initialDistributionRatio).div(1000);
    } else {
      maxDistribution = MAX_UINT;
    }
    _transferOwnership(_mintGoldScheduleOwner);
    emit MintGoldInstanceCreated(beneficiary, address(this));
  }

  /**
   * @notice Controls the maximum distribution ratio.
   *         Calculates `distributionRatio`/1000 of current `totalAmountToMint`
   *         and sets this value as the maximum allowed CELO to be currently Minted.
   * @param distributionRatio Amount in range [0, 1000] (3 significant figures)
   *                          indicating % of total balance available for distribution.
   */
  function setMaxDistribution(uint256 distributionRatio) external onlyOwner {
    require(distributionRatio <= 1000, "Max distribution ratio must be within bounds");
    require(
      maxDistribution != MAX_UINT,
      "Cannot set max distribution lower if already set to 1000"
    );
    // If ratio is 1000, we set maxDistribution to maxUint to account for future rewards.
    if (distributionRatio == 1000) {
      maxDistribution = MAX_UINT;
    } else {
      require(
        totalAmountToMint > 0,
        "Cannot set max distribution before totalAmountToMint is set."
      );
      maxDistribution = totalAmountToMint.mul(distributionRatio).div(1000);
    }
    emit DistributionLimitSet(beneficiary, maxDistribution);
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
   * @param amount The requested CELO amount.
   */
  function mintAccordingToSchedule(uint256 amount) external nonReentrant {
    require(amount > 0, "Requested amount to mint must be greater than zero");

    uint256 mintedAmount;

    mintedAmount = getCurrentReleasedTotalAmount();

    require(
      mintedAmount.sub(totalMinted) >= amount,
      "Requested amount is greater than available mintable funds"
    );
    require(
      maxDistribution >= totalMinted.add(amount),
      "Requested amount exceeds current alloted maximum distribution"
    );
    require(getRemainingBalanceToMint() >= amount, "Insufficient unlocked balance to mint amount");
    totalMinted = totalMinted.add(amount);

    getGoldToken().mint(beneficiary, amount);
    if (getRemainingBalanceToMint() == 0) {
      emit MintGoldInstanceDestroyed(address(this));
      selfdestruct(BURN_ADDRESS);
    }
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

  function increaseTotalAmountToMint(uint256 amount) public {
    totalAmountToMint = totalAmountToMint.add(amount);
  }

  /**
   * @notice Calculates remaining CELO balance to mint.
   * @return The remaining CELO balance to mint.
   */
  function getRemainingBalanceToMint() public view returns (uint256) {
    return totalAmountToMint.sub(totalMinted);
  }

  /**
   * @dev Calculates the total amount that has already released for minting up to now.
   * @return The mint balance already released up to the point of call.
   */
  function getCurrentReleasedTotalAmount() public view returns (uint256) {
    if (block.timestamp < mintingSchedule.mintCliffTime) {
      return 0;
    }

    if (
      block.timestamp >=
      mintingSchedule.mintStartTime.add(
        mintingSchedule.numMintingPeriods.mul(mintingSchedule.mintingPeriod)
      )
    ) {
      return totalAmountToMint;
    }

    uint256 timeSinceStart = block.timestamp.sub(mintingSchedule.mintStartTime);
    uint256 periodsSinceStart = timeSinceStart.div(mintingSchedule.mintingPeriod);

    return totalAmountToMint.mul(periodsSinceStart).div(mintingSchedule.numMintingPeriods);
  }

  /**
   * @return The currently mintable amount.
   */
  function getMintableAmount() public view returns (uint256) {
    return
      Math.min(
        Math.min(maxDistribution, getCurrentReleasedTotalAmount()).sub(totalMinted),
        getRemainingBalanceToMint()
      );
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
