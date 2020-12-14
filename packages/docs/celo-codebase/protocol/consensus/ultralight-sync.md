# Ultralight Sync

In addition to the “full”, “fast”, and “light” sync modes supported by Ethereum, Celo supports an “ultralight” sync mode. Ultralight nodes compute the validator set for the current epoch by downloading the last header of each previous epoch and applying the validator set diff. They then download the latest block header, which can be verified by checking that at least two-thirds of the validator set for the current epoch signed the block header. Ultralight nodes download approximately 30,000 times fewer headers than light nodes in order to sync the latest block \(assuming 3-second block periods and 1-day epochs\).

In the future, Celo will support zk-SNARK-based proofs of the ultralight sync mode, which will lower the sync time even more.

