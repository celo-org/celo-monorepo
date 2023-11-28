certoraRun specs/harnesses/GovernanceHarness.sol contracts/common/Accounts.sol \
  --verify GovernanceHarness:specs/governancePrivileged.spec \
  --cache governance \
  --optimistic_loop \
  --short_output \
  --msg "Governance privilege check"
