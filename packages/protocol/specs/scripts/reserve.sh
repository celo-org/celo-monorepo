certoraRun contracts/common/Registry.sol specs/harnesses/ReserveHarness.sol \
  --link ReserveHarness:registry=Registry \
  --verify ReserveHarness:specs/reserve.spec \
  --optimistic_loop \
  --settings -ciMode=true \
  --msg "Reserve" \
  --solc_args "['--evm-version', 'istanbul']"
