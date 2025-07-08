# Collection of tools useful during Op releases

Sections:
- `fork` - scripts for forking & mocking networks (most useful: `fork_l1.sh` & `mock-mainnet.sh`)
- `op-deployer` - scripts for interacting with op-deployer upgrade pipeline (most useful: `run_upgrade.sh`)
- `safe` - scripts for interacting with Safe API tx submission (requires delegatecall creation not disabled over API)
- `exec-mocked.sh` - useful script for simplified & mocked simulation of network upgrade with support for providing an arbitrary account with signature
- `exec-v2v3.sh` - final script used for migration from `1.8.0` to `2.0.0` & `3.0.0`
- `exec.sh` - generalized upgrade script for future migrations
