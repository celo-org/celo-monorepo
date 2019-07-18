pragma solidity ^0.5.8;


 /**
 * @title A mock BondedDeposits for testing.
 */
contract MockBondedDeposits {
  mapping(address => mapping(uint256 => uint256)) public bonded;
  mapping(address => uint256) public weights;
  mapping(address => bool) public frozen;
  // Maps a delegating address to an account.
  mapping(address => address) public delegations;
  // Maps an account address to their voting delegate.
  mapping(address => address) public voters;
  // Maps an account address to their validating delegate.
  mapping(address => address) public validators;

  function setWeight(address account, uint256 weight) external {
    weights[account] = weight;
  }

  function setBondedDeposit(address account, uint256 noticePeriod, uint256 value) external {
    bonded[account][noticePeriod] = value;
  }

  function setVotingFrozen(address account) external {
    frozen[account] = true;
  }

  function delegateVoting(address account, address delegate) external {
    delegations[delegate] = account;
    voters[account] = delegate;
  }

  function delegateValidating(address account, address delegate) external {
    delegations[delegate] = account;
    validators[account] = delegate;
  }

  function getAccountWeight(address account) external view returns (uint256) {
    return weights[account];
  }

  function getValidatorFromAccount(address account) external view returns (address) {
    address delegate = validators[account];
    return delegate == address(0) ? account : delegate;
  }

  function getBondedDeposit(
    address account,
    uint256 noticePeriod
  )
    external
    view
    returns (uint256, uint256)
  {
    // Always return 0 for the index.
    return (bonded[account][noticePeriod], 0);
  }

  function isVotingFrozen(address account) external view returns (bool) {
    return frozen[account];
  }

  function getAccountFromVoter(address accountOrDelegate) external view returns(address) {
    address account = delegations[accountOrDelegate];
    if (account == address(0)) {
      return accountOrDelegate;
    } else {
      require(voters[account] == accountOrDelegate);
      return account;
    }
  }

  function getAccountFromValidator(address accountOrDelegate) external view returns(address) {
    address account = delegations[accountOrDelegate];
    if (account == address(0)) {
      return accountOrDelegate;
    } else {
      require(validators[account] == accountOrDelegate);
      return account;
    }
  }
}
