# Locking Up Funds

To lock-up funds, Celo Gold account holders must put up a staking value and define a notice period. The notice period is the time interval between a withdrawal request and the release of the staked value. Since locked funds are referenced by notice period, each account holder has at most one locked fund per each notice period.

Locked Gold account holders must also vote for validators and participate in governance to earn rewards.

An account’s voting power and rewards are determined by its commitment weight”, which is defined as:

`Commitment weight = Amount of Celo Gold locked * 1 + sqrt(notice period in days) / 30`
