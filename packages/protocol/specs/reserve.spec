pragma specify 0.1

methods {
  isSpender(address) returns bool envfree
  isExchangeSpender(address) returns bool envfree
  getExchangeAddress() returns address envfree
  contractBalance() returns uint256 envfree
}

rule nonspenderCantReduceBalance(address a, method f) {
  require(!isSpender(a));
  require(!isExchangeSpender(a));
  require(getExchangeAddress() != a);
  uint256 balanceBefore = invoke contractBalance();

  env e;
  require(e.msg.sender == a);
  calldataarg arg;
  sinvoke f(e, arg);

  uint256 balanceAfter = invoke contractBalance();
  if (f.isFallback) {
    assert balanceAfter >= balanceBefore;
  } else {
    assert balanceAfter == balanceBefore;
  }
}
