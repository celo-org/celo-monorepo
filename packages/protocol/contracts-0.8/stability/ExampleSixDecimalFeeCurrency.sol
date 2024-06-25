// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/access/Ownable.sol";
import "@openzeppelin/contracts8/token/ERC20/ERC20.sol";
import "@celo-contracts/common/Initializable.sol";
import "@celo-contracts-8/stability/interfaces/IFeeCurrency.sol";

contract ExampleSixDecimalFeeCurrency is IFeeCurrency, ERC20, Ownable, Initializable {
  string internal name_;
  string internal symbol_;
  uint8 internal decimals_;

  address public feeCaller;

  uint256 debited; // TODO(Arthur): Do I need this? 

  event FeeCallerChanged(address indexed newAddress);

  modifier onlyFeeCaller() virtual {
    require(msg.sender == feeCaller, "ExampleAdaptedFeeCurrency: caller is not the fee caller");
    _;
  }

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param _name The name of the token.
   * @param _symbol The symbol of the token.
   * @param _initialSupply The initial supply of the token.
   */
  function initialize(
    string calldata _name,
    string calldata _symbol,
    uint8 _decimals,
    uint256 _initialSupply
  ) public virtual initializer {
    name_ = _name;
    symbol_ = _symbol;
    decimals_ = _decimals;
    _mint(msg.sender, _initialSupply);
  }
  
  // constructor(uint256 initialSupply) ERC20("ExampleSixDecimalFeeCurrency", "SIXDECIMAL") {
  //   _mint(msg.sender, initialSupply);
  // }

  function updateFeeCaller(address _newFeeCaller) external onlyOwner {
    feeCaller = _newFeeCaller;
    emit FeeCallerChanged(_newFeeCaller);
  }

  function debitGasFees(address from, uint256 value) external onlyFeeCaller {
    _burn(from, value);
  }

  function creditGasFees(
    address[] calldata recipients,
    uint256[] calldata amounts
  ) external onlyFeeCaller {
    require(recipients.length == amounts.length, "Recipients and amounts must be the same length.");

    uint256 totalSum = 0;

    for (uint256 i = 0; i < recipients.length; i++) {
      _mint(recipients[i], amounts[i]);
      totalSum += amounts[i];
    }

    require(debited == totalSum, "Cannot credit more than debited.");
    debited = 0;
  }

  /**
   * @return The number of decimal places to which StableToken is divisible.
   */
  function decimals() external view returns (uint8) {
    return decimals_;
  }
}
