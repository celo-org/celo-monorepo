pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "./UsingRegistryV2.sol";

import "../common/interfaces/ICeloVersionedContract.sol";

import "../common/interfaces/ICeloToken.sol";
import "../common/Initializable.sol";

import "../stability/StableToken.sol";
import "../stability/interfaces/IExchange.sol";

// import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

// TODO maybe add an upperbound so that you can't trade more
// multisig that owns this and have a killswitch
// Non-Mento assets do it permisionless.

/**
 * @title TODO

 */
contract FeeBurner is Ownable, Initializable, UsingRegistryV2, ICeloVersionedContract {
  using SafeMath for uint256;

  // event CeloBalance(uint256 celoBalance);
  event SoldAndBurnedToken(address token, uint256 value);

  uint256 public constant MIN_BURN = 200;
  mapping(address => uint256) public pastBurn;

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   */
  function initialize(address _registryAddress) external initializer {
    // TODO
    _transferOwnership(msg.sender);
    setRegistry(_registryAddress);
  }

  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 0, 0, 0);
  }

  // chose the best price from options

  function burnAllCelo() private {
    ICeloToken celo = ICeloToken(getCeloTokenAddress());
    celo.burn(celo.balanceOf(address(this)));
  }

  // this function is permionless
  function burnMentoAssets() private {
    // 1. reserve contrac
    address[] memory mentoTokens = getReserve().getTokens();
    // shall this be fee token whitelist?
    // here we could also check that the tokens is whitelisted, but we assume everything that has already been sent here is
    // due for burning

    // require(false, "start"); // TODO remove me

    for (uint256 i = 0; i < mentoTokens.length; i++) {
      address tokenAddress = mentoTokens[i];
      StableToken stableToken = StableToken(tokenAddress);
      uint256 balanceToBurn = stableToken.balanceOf(address(this));

      // small numbers cause rounding errors
      // zero case should be skiped
      // TODO make this LT

      // add a check Mento is on-check

      if (balanceToBurn < 100) {
        continue;
      }
      address exchangeAddress = registryContract.getAddressForOrDie(
        stableToken.getExchangeRegistryId()
      );

      IExchange exchange = IExchange(exchangeAddress);
      // TODO update burned amounts here

      // minBuyAmount is zero because this functions is meant to be called reguarly with small amounts
      // TODO calculate a max of slipagge

      stableToken.approve(exchangeAddress, balanceToBurn);
      exchange.sell(balanceToBurn, 0, false);

      pastBurn[tokenAddress] += balanceToBurn;
      emit SoldAndBurnedToken(tokenAddress, balanceToBurn);

      // uint256 celoBalance = celo.balanceOf(address(this));
      // emit CeloBalance(celoBalance);
      // require(celoBalance > 0, "Celo Balance not bigger than zero"); // TODO remove me

    }

    // TODO add some accounting about the amounts burned
    // TODO send an event

  }

  function burnNonMentoTokens() private {}

  // this function is permionless
  function burn() external {
    burnMentoAssets();
    burnAllCelo();
    burnNonMentoTokens();
    // burn other assets
    // TODO:
    // 1. Make swap (Meto for stables, for other Uniswap)
    // 2. burn
  }

  function transfer(address poolAddress, address recipient, uint256 value) external onlyOwner {
    // meant for governance to trigger use cases not contemplated in this contract
    IERC20 token = IERC20(poolAddress);
    token.transfer(recipient, value);
  }

  function setExchange(address poolAddress, address token) external onlyOwner {
    _setExchange(poolAddress, token);
  }

  function _setExchange(address poolAddress, address token) private {}

  // TODO FUCTIONS HERE

}

// TODO onlyOwner transfer out

