certoraRun specs/harnesses/AccountsHarness.sol \
  --verify AccountsHarness:specs/accounts.spec \
  --optimistic_loop \
  --loop_iter 2 \
  --cache accounts \
  --short_output \
  --msg "Accounts"
