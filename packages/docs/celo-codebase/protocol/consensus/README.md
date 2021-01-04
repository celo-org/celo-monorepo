# Consensus

Celo’s consensus protocol is based on an implementation called Istanbul, or IBFT. IBFT was developed by AMIS and [proposed](https://github.com/ethereum/EIPs/issues/650) as an extension to [go-ethereum](https://github.com/ethereum/go-ethereum) but never merged. Variants of IBFT exist in both the [Quorum](https://github.com/jpmorganchase/quorum) and [Pantheon](https://github.com/PegaSysEng/pantheon) clients. We’ve modified Istanbul to bring it up to date with the latest [go-ethereum](https://github.com/ethereum/go-ethereum) releases and we’re fixing [correctness and liveness issues](https://arxiv.org/abs/1901.07160) and improving its scalability and security.

Celo’s consensus protocol is performed by nodes that are selected as validators. There is a maximum cap on the number of active validators that can be changed by governance proposal, which is currently set at a 100 validators. The active validator set is determined via the proof-of-stake process and is updated at the end of each epoch, a fixed period of approximately one day.

