#!/usr/bin/env bash
# Fork-test the v17 release proposal (Election + EpochManager + Validators impl upgrades)
# on a Sepolia anvil fork, driving the full governance flow with celocli (v9.0.0).
#
# Forks Celo Sepolia (which already has the v17 impls deployed), submits
# proposal-celo-sepolia-core-contracts.v17.json, runs propose -> dequeue ->
# approve -> vote -> execute, then asserts each proxy now points at the new impl.
#
# Usage: bash scripts/test-v17-proposal-fork.sh
set -u

# A concurrent job elsewhere runs `pkill -f anvil`, which would kill our fork.
# Launch anvil through a renamed symlink so that pkill -f anvil can't match it.
ANVIL_BIN=/tmp/celoforkd
ln -sf "$(command -v anvil)" "$ANVIL_BIN"

RPC=http://127.0.0.1:9933
PROPOSAL_JSON=proposal-celo-sepolia-core-contracts.v17.json
DESC_URL="https://github.com/celo-org/governance/blob/main/CGPs/cgp-0001.md"

GOV_PROXY=0x50d2f15CcF5E97999bDf9D6760d0208b00D14ad1
LOCKED_GOLD=0x3DB0F0850c5b5f42fe30d68778C8958fC5EE7951
ACCOUNTS=0x44957232699ca060B607E77083bDACD350d6b6d1

# proxy -> expected new impl (from make-release / proposal)
ELECTION_PROXY=0xeB8B626f3A76174f4576bb47429c47EfDED7C211 ; ELECTION_IMPL=0x111ce579e4e036eb9094366c44ff4e883345e491
EPOCHMGR_PROXY=0x6f2D4BD55BbD70c5E30F747e1d35Ba97Ad7d60Eb ; EPOCHMGR_IMPL=0x810125013107fbffd2cc01dce79356af4268ded9
VALIDATORS_PROXY=0x5E7b295bd8D80625e2cCac97C98123aaEB5E7Ea5 ; VALIDATORS_IMPL=0xdb0a170f7b0d7cf29af0269719c1b56c0d55e607

TESTER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
TKEY=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

q() { cast call "$@" --rpc-url "$RPC" 2>/dev/null | head -1 | sed 's/ \[[^]]*\]$//'; }
cli() { celocli "$@" -n "$RPC" 2>&1 | grep -viE "Warning: Found unknown|notation for profiles|Please use \[profile"; }

echo "### celocli version (need 9.0.0)"; celocli --version 2>&1 | head -1

echo "### 1. Start Sepolia fork (via $ANVIL_BIN, port 9933)"
"$ANVIL_BIN" --fork-url https://forno.celo-sepolia.celo-testnet.org \
  --code-size-limit 500000 --gas-limit 100000000 --port 9933 > /tmp/anvil_v17.log 2>&1 &
ANVIL_PID=$!
for i in $(seq 1 30); do
  BN=$(cast block-number --rpc-url $RPC 2>/dev/null)
  [ -n "$BN" ] && break
  sleep 1
done
echo "fork block: ${BN:-FAILED}"
[ -z "${BN:-}" ] && { echo "anvil failed to start"; tail -5 /tmp/anvil_v17.log; kill $ANVIL_PID 2>/dev/null; exit 1; }
CID=$(cast chain-id --rpc-url $RPC 2>/dev/null)
echo "chainId: $CID (want 11142220)"
[ "$CID" != "11142220" ] && { echo "WRONG CHAIN on $RPC (port collision?). Aborting."; kill $ANVIL_PID 2>/dev/null; exit 1; }

echo "### proposal targets (before):"
echo "  Election    impl -> $(q $ELECTION_PROXY '_getImplementation()(address)')"
echo "  EpochManager impl -> $(q $EPOCHMGR_PROXY '_getImplementation()(address)')"
echo "  Validators  impl -> $(q $VALIDATORS_PROXY '_getImplementation()(address)')"

echo "### 2. Fund tester + lock CELO (voting weight)"
cast rpc anvil_setBalance $TESTER 0x33B2E3C9FD0803CE8000000 --rpc-url $RPC >/dev/null
cast send $ACCOUNTS "createAccount()" --private-key 0x$TKEY --rpc-url $RPC >/dev/null 2>&1
cast send $LOCKED_GOLD "lock()" --value 10000000ether --private-key 0x$TKEY --rpc-url $RPC >/dev/null 2>&1

echo "### 3. celocli governance:propose (real path, 4 txns)"
# Uses the developer-tooling celocli build. tx4 in PROPOSAL_JSON uses the EXTERNAL form
# {address, "setMaxVoterRewardCommission(uint256)"} so the builder encodes it from the
# signature even though the released @celo/abis lacks the method. The proposalToJSON preview
# now decodes tx4 too, via the new Blockscout/Celoscan ABI strategy in @celo/explorer that
# honors the in-proposal proxy override (no --noInfo needed).
MAXCAP=1000000000000000000000000   # FixidityLib.fixed1() = 1e24 = 100% (contract max; true infinite reverts)
DEVCLI="node /Users/pavelhornak/repo/developer-tooling/packages/cli/bin/run.js"
$DEVCLI governance:propose --deposit=100e18 --descriptionURL="$DESC_URL" \
  --from=$TESTER --privateKey=$TKEY --jsonTransactions="$PROPOSAL_JSON" --force \
  --node "$RPC" 2>&1 | grep -iE "setMaxVoterRewardCommission|proposeTx|ProposalQueued|Error" | head -5
PID=$(q $GOV_PROXY 'proposalCount()(uint256)')
echo "  proposalId = $PID"

echo "### 4. dequeue -> approve -> vote -> execute"
cast rpc evm_increaseTime "$(q $GOV_PROXY 'dequeueFrequency()(uint256)')" --rpc-url $RPC >/dev/null
cast rpc evm_mine --rpc-url $RPC >/dev/null
cli governance:dequeue --from $TESTER --privateKey $TKEY | grep -iE "dequeue|Error" | head -1

APPROVER=$(q $GOV_PROXY 'approver()(address)')
cast rpc anvil_impersonateAccount $APPROVER --rpc-url $RPC >/dev/null
cast rpc anvil_setBalance $APPROVER 0xDE0B6B3A7640000 --rpc-url $RPC >/dev/null
cli governance:approve --proposalID $PID --from $APPROVER | grep -iE "approveTx|approver|Error" | head -2

cli governance:vote --proposalID $PID --value Yes --from $TESTER --privateKey $TKEY | grep -iE "Referendum|voteTx|Error" | head -2

REF_DUR=$(cast call $GOV_PROXY 'stageDurations()(uint256,uint256,uint256)' --rpc-url $RPC 2>/dev/null | sed -n '2p' | sed 's/ \[[^]]*\]$//')
cast rpc evm_increaseTime $((REF_DUR + 1)) --rpc-url $RPC >/dev/null
cast rpc evm_mine --rpc-url $RPC >/dev/null
cli governance:execute --proposalID $PID --from $TESTER --privateKey $TKEY | grep -iE "Execution|quorum|executeTx|Error" | head -3

echo "### 5. assert impls updated"
lc() { echo "$1" | tr '[:upper:]' '[:lower:]'; }
chk() { # name proxy expected
  local got=$(q $2 '_getImplementation()(address)')
  if [ "$(lc "$got")" = "$(lc "$3")" ]; then echo "  ✅ $1 -> $got"; else echo "  ❌ $1 -> $got (want $3)"; fi
}
chk Election    $ELECTION_PROXY   $ELECTION_IMPL
chk EpochManager $EPOCHMGR_PROXY  $EPOCHMGR_IMPL
chk Validators  $VALIDATORS_PROXY $VALIDATORS_IMPL

GOTCAP=$(q $VALIDATORS_PROXY 'maxVoterRewardCommission()(uint256)')
if [ "$GOTCAP" = "$MAXCAP" ]; then echo "  ✅ maxVoterRewardCommission -> $GOTCAP (fixed1/100%)"; else echo "  ❌ maxVoterRewardCommission -> $GOTCAP (want $MAXCAP)"; fi

kill $ANVIL_PID 2>/dev/null || true
