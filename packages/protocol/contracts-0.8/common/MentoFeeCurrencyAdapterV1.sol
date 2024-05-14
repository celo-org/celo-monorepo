import "../../contracts/common/Initializable.sol";
import "../../contracts/stability/interfaces/ISortedOracles.sol";
import "./interfaces/IOracle.sol";
import "@openzeppelin/contracts8/access/Ownable.sol";

contract MentoFeeCurrencyAdapterV1 is IOracle, Initializable, Ownable {
  ISortedOracles public sortedOracles;

  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Initializes the contract with the owner set.
   */
  function initialize(address _sortedOracles) public initializer {
    _transferOwnership(msg.sender);
    sortedOracles = ISortedOracles(_sortedOracles);
  }

  /**
   * @notice Retrieves exchange rate between token and CELO.
   * @param token The token address whose price is to be fetched.
   * @return numerator The exchange rate numerator.
   * @return denominator The exchange rate denominator.
   */
  function getExchangeRate(
    address token
  ) public view returns (uint256 numerator, uint256 denominator) {
    (numerator, denominator) = sortedOracles.medianRate(token);
  }

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return Storage version of the contract.
   * @return Major version of the contract.
   * @return Minor version of the contract.
   * @return Patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 0, 0);
  }
}
