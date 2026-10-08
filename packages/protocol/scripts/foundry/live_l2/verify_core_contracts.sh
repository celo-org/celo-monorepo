#!/usr/bin/env bash

### Checks a core contracts deployment made with migrate_live_l2.sh.
### usage: verify_core_contracts.sh <rpc url> <expected owner> [fee currency directory address]
### The expected owner is the deployer / admin EOA (the migration is run with skipTransferOwnership).
### Prints "RESULT: all checks passed" and exits 0, or flags what is wrong and exits 1.

R=${1:?usage: verify_core_contracts.sh <rpc url> <expected owner> [fee currency directory address]}
ADMIN=${2:?missing expected owner}
FCD_ADDRESS=${3:-0x15F344b9E6c3Cb6F0376A36A64928b13F62C6276}
REG=0x000000000000000000000000000000000000ce10
IMPL_SLOT=0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc
ZERO=0x0000000000000000000000000000000000000000

reg() { cast call $REG 'getAddressForString(string)(address)' "$1" -r $R 2>/dev/null | head -1; }
impl() { cast storage $1 $IMPL_SLOT -r $R | sed -E 's/^0x0{24}/0x/'; }
lc() { echo "$1" | tr 'A-F' 'a-f'; }

echo "chain id $(cast chain-id -r $R), block $(cast block-number -r $R)"
BAD=0

echo "--- fixed-address contracts ---"
for PAIR in "Registry:$REG" \
  "CeloToken:0x471EcE3750Da237f93B8E339c536989b8978a438" \
  "GoldToken:0x471EcE3750Da237f93B8E339c536989b8978a438" \
  "FeeHandler:0xcD437749E43A154C07F3553504c68fBfD56B8778" \
  "FeeCurrencyDirectory:$FCD_ADDRESS" \
  "CeloUnreleasedTreasury:0xB76D502Ad168F9D545661ea628179878DcA92FD5"; do
  NAME=${PAIR%%:*}; WANT=${PAIR#*:}; GOT=$(reg $NAME); IMPL=$(impl $WANT)
  OK="ok"
  [ "$(lc "$GOT")" = "$(lc $WANT)" ] || { OK="WRONG ADDRESS ($GOT)"; BAD=1; }
  [ "$IMPL" = "$ZERO" ] && { OK="$OK NO IMPLEMENTATION"; BAD=1; }
  printf "  %-24s %s impl=%s %s\n" $NAME $WANT "${IMPL:0:12}…" "$OK"
done

echo "--- registry entries, implementation and owner ---"
for NAME in Accounts Election EpochManager EpochRewards Escrow FederatedAttestations Freezer Governance \
  GovernanceSlasher LockedGold OdisPayments ScoreManager SortedOracles Validators MentoFeeHandlerSeller \
  UniswapFeeHandlerSeller Reserve StableToken StableTokenEUR StableTokenBRL Registry CeloToken FeeHandler \
  FeeCurrencyDirectory CeloUnreleasedTreasury; do
  ADDR=$(reg $NAME)
  if [ -z "$ADDR" ] || [ "$ADDR" = "$ZERO" ]; then
    printf "  %-24s NOT REGISTERED\n" $NAME; BAD=1; continue
  fi
  OWNER=$(cast call $ADDR 'owner()(address)' -r $R 2>/dev/null | head -1); IMPL=$(impl $ADDR)
  FLAG=""
  [ "$(lc "$OWNER")" = "$(lc $ADMIN)" ] || { FLAG="OWNER IS NOT THE EXPECTED ONE ($OWNER)"; BAD=1; }
  [ "$IMPL" = "$ZERO" ] && { FLAG="$FLAG NO IMPLEMENTATION"; BAD=1; }
  printf "  %-24s %s impl=%s owner ok: %s %s\n" $NAME $ADDR "${IMPL:0:12}…" "$([ -z "$FLAG" ] && echo yes || echo NO)" "$FLAG"
done

VAL=$(reg Validators); EM=$(reg EpochManager); LG=$(reg LockedGold); CT=$(reg CeloToken)
TR=$(reg CeloUnreleasedTreasury); FH=$(reg FeeHandler); FCD=$(reg FeeCurrencyDirectory); EL=$(reg Election)

echo "--- validators and epochs ---"
NV=$(cast call $VAL 'getRegisteredValidators()(address[])' -r $R | tr ',' '\n' | grep -c 0x)
NG=$(cast call $VAL 'getRegisteredValidatorGroups()(address[])' -r $R | tr ',' '\n' | grep -c 0x)
echo "  registered validators $NV, groups $NG, elected $(cast call $EM 'numberOfElectedInCurrentSet()(uint256)' -r $R | head -1), epoch duration $(cast call $EM 'epochDuration()(uint256)' -r $R | head -1 | cut -d' ' -f1) s, current epoch $(cast call $EM 'getCurrentEpochNumber()(uint256)' -r $R | head -1)"
[ "$NV" -gt 0 ] && [ "$NG" -gt 0 ] || BAD=1
for GROUP in $(cast call $VAL 'getRegisteredValidatorGroups()(address[])' -r $R | tr -d '[],'); do
  echo "  group $GROUP locked $(cast call $LG 'getAccountTotalLockedGold(address)(uint256)' $GROUP -r $R | head -1 | cut -d' ' -f2) votes $(cast call $EL 'getTotalVotesForGroup(address)(uint256)' $GROUP -r $R | head -1 | cut -d' ' -f2) members $(cast call $VAL 'getGroupNumMembers(address)(uint256)' $GROUP -r $R | head -1)"
done

echo "--- supply and fees ---"
echo "  CeloToken totalSupply $(cast call $CT 'totalSupply()(uint256)' -r $R | head -1 | cut -d' ' -f2) | treasury balance $(cast balance $TR --ether -r $R | cut -c1-12) | owner balance $(cast balance $ADMIN --ether -r $R | cut -c1-14)"
echo "  FeeHandler carbon beneficiary $(cast call $FH 'carbonFeeBeneficiary()(address)' -r $R 2>/dev/null | head -1) | fee currencies $(cast call $FCD 'getCurrencies()(address[])' -r $R 2>/dev/null | head -1)"

if [ $BAD = 0 ]; then
  echo "RESULT: all checks passed"
else
  echo "RESULT: PROBLEMS FOUND (see flags above)"
  exit 1
fi
