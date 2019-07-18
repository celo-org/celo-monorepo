# Bonding Funds

To lock-up funds, Celo Gold account holders must put up a staking value and define a notice period. The notice period is the time interval between a withdrawal request and the release of the staked value. Since bonded funds are referenced by notice period, each account holder has at most one bonded fund per each notice period.

An account’s voting power and rewards are determined by its “bonded weight”, which is defined as:

`Bonded weight = Amount of Celo Gold bonded * 1 + sqrt(notice period in days) / 30`
