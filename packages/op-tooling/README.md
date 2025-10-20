# Collection of tools useful during Op releases

Sections:
- [exec](./exec/) - scripts for executing upgrade transactions 
- [fork](./fork/) - scripts for forking & mocking networks (most useful: `fork_l1.sh` & `mock-mainnet.sh`)
- [impls](./impls/) - scripts for deployment & upgrade of individual OpStack contracts
- [op-deployer](./op-deployer/) - scripts for interacting with op-deployer upgrade pipeline (most useful: `run_upgrade.sh`)
- [safe](./safe/) - scripts for interacting with Safe API tx submission (requires delegatecall creation not disabled over API)
- [verify](./verify/) - scripts for performing smart contract verification for OpStack
- [withdrawal](./withdrawal/) - scripts for performing L2 to L1 withdrawal via L2L1MessagePasser & OptimismPortal
