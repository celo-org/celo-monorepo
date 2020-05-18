# Validator Set Differences

The validator set for a given epoch is elected at the end of the last block of the previous epoch. The new validator set is written to the “extradata” field of the header for this block. As an optimization, the validator set is encoded as the difference between the new and previous validator sets. Nodes that join the network are able to compute the validator set for the current epoch by starting with the initial validator set \(encoded in the genesis block\) and iteratively applying these diffs.

