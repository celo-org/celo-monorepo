pragma specify 0.1

methods {
  isSpender(address) returns bool envfree
  isExchangeSpender(address) returns bool envfree
  getExchangeAddress() returns address envfree
  contractBalance() returns uint256 envfree
}

rule nonspenderCantReduceBalance(address nonspender, method f) {
  require(!isSpender(nonspender));
  require(!isExchangeSpender(nonspender));
  require(getExchangeAddress() != nonspender);

  uint256 balanceBefore = contractBalance();

  env e;
  require(e.msg.sender == nonspender);
  calldataarg arg;
  f(e, arg);

  uint256 balanceAfter = contractBalance();

  if (f.isFallback) {
    assert balanceAfter >= balanceBefore;
  } else {
    assert balanceAfter == balanceBefore;
  }
}
