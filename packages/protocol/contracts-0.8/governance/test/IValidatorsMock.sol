pragma solidity >=0.5.13 <0.9.0;

interface IValidatorsMockFactory {
  function deployValidatorsMock(bool test) external returns (address);
}
