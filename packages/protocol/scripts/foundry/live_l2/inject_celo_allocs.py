#!/usr/bin/env python3
"""Adds the Celo core-contract proxies and the funded admin to the L2 allocs held in an op-deployer
state.json, so that `op-deployer inspect genesis` and `inspect rollup` both include them. The result
has the same shape as the chaos testnet's genesis: five proxies owned by the admin, 500M CELO for the
admin and 500M for the unreleased treasury.

usage: inject_celo_allocs.py <state.json> <Proxy artifact json> <admin address> <fee currency directory address>
"""
import base64, gzip, json, sys

state_path, proxy_artifact, admin, fcd = sys.argv[1:5]
OWNER_SLOT = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"   # eip1967.proxy.admin
CELO_500M = hex(500_000_000 * 10**18)
PROXIES = {   # address -> genesis balance
    "0x000000000000000000000000000000000000ce10": "0x0",        # Registry
    "0x471ece3750da237f93b8e339c536989b8978a438": "0x0",        # CeloToken
    "0xcd437749e43a154c07f3553504c68fbfd56b8778": "0x0",        # FeeHandler
    fcd.lower(): "0x0",                                         # FeeCurrencyDirectory
    "0xb76d502ad168f9d545661ea628179878dca92fd5": CELO_500M,    # CeloUnreleasedTreasury
}
admin = admin.lower()
assert admin.startswith("0x") and len(admin) == 42
code = json.load(open(proxy_artifact))["deployedBytecode"]["object"]
assert code.startswith("0x") and len(code) > 1000 and "__$" not in code, "proxy runtime must be linked, non-empty bytecode"

st = json.load(open(state_path))
chain = st["opChainDeployments"][0]
allocs = json.loads(gzip.decompress(base64.b64decode(chain["allocs"])))
before = len(allocs)
clash = [a for a in list(PROXIES) + [admin] if a in {k.lower() for k in allocs}]
assert not clash, f"already present in allocs: {clash}"

owner_word = "0x" + admin[2:].rjust(64, "0")
for addr, balance in PROXIES.items():
    allocs[addr] = {"balance": balance, "code": code, "storage": {OWNER_SLOT: owner_word}}
allocs[admin] = {"balance": CELO_500M}

chain["allocs"] = base64.b64encode(gzip.compress(json.dumps(allocs, separators=(",", ":")).encode(), mtime=0)).decode()
json.dump(st, open(state_path, "w"), indent=2)
print(f"allocs: {before} -> {len(allocs)} accounts; 5 proxies owned by {admin}, admin and treasury hold 500M CELO each")
