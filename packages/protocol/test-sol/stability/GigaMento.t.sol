// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "celo-foundry/Test.sol";
import "../utils/WithRegistry.sol";
import "../utils/TokenHelpers.sol";
import "contracts/stability/GigaMento.sol";
import "contracts/common/FixidityLib.sol";

contract GigamentoTest is Test, WithRegistry, TokenHelpers {
  using SafeMath for uint256;
  using FixidityLib for FixidityLib.Fraction;

  address deployer;
  address rando;

  GigaMento gigamento;

  function setUp() public {
    deployer = actor("deployer");
    rando = actor("rando");
    changePrank(deployer);
    gigamento = new GigaMento(true);

    registry.setAddressFor("GigaMento", address(gigamento));

    gigamento.initialize(address(registry));
  }
}
