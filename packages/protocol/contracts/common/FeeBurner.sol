pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../common/interfaces/ICeloVersionedContract.sol";

import "../common/Initializable.sol";

import "./UsingRegistryV2.sol";
import "../stability/StableToken.sol";
import "../stability/interfaces/IExchange.sol";

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

/**
 * @title TODO

 */
contract FeeBurner is Ownable, Initializable, UsingRegistryV2, ICeloVersionedContract {
  // address[] public whitelist;

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   */
  function initialize() external initializer {
    // TODO
    _transferOwnership(msg.sender);
  }

  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 0, 0, 0);
  }

  function burnAllCelo() private {
    IERC20 celo = IERC20(getCeloToken());
    //  celo.burn(celo.balanceOf(this.address)); TODO remove after burn is done
  }

  // this function is permionless
  function burnMentoAssets() external {
    // 1. reserve contrac
    address[] memory mentoTokens = getReserve().getTokens();

    for (uint256 i = 0; i < mentoTokens.length; i++) {
      StableToken stableToken = StableToken(mentoTokens[i]);
      address exchangeAddress = registryContract.getAddressForOrDie(
        stableToken.getExchangeRegistryId()
      );

      IExchange exchange = IExchange(exchangeAddress);
      uint256 balance = stableToken.balanceOf(address(this));
      // TODO update burned amounts here

      // minBuyAmount is zero because this functions is meant to be called reguarly with small amounts
      exchange.sell(balance, 0, false);
    }

    // TODO add some accounting about the amounts burned
    // TODO send an event

    burnAllCelo();
  }

  // this function is permionless
  function burn() external {
    burnAllCelo();
    // TODO:
    // 1. Make swap (Meto for stables, for other Uniswap)
    // 2. burn
  }

  function setExchange(address poolAddress, address token) external onlyOwner {
    _setExchange(poolAddress, token);
  }

  function _setExchange(address poolAddress, address token) private {}

  // TODO FUCTIONS HERE

}
