#!/bin/bash

if [ -d migrations.bak ]; then
  echo Replacing migrations
  rm -rf migrations
  mv migrations.bak migrations
else
  echo Backing up migrations
  mv migrations migrations.bak
  mkdir migrations

  # Migration 0 always needs to be present
  cp migrations.bak/00_initial_migration.* migrations/

  # Uncomment lines for whichever migrations you actually do need.
  # Note that some migrations depend on others (for example, many contracts
  # require libraries to have been migrated, so you might need migration 1 to be
  # uncommented).
  cp migrations.bak/01_libraries.* migrations/
  # cp migrations.bak/02_registry.* migrations/
  # cp migrations.bak/03_freezer.* migrations/
  # cp migrations.bak/03_transferwhitelist.* migrations/
  # cp migrations.bak/03_whitelist.* migrations/
  # cp migrations.bak/04_goldtoken.* migrations/
  # cp migrations.bak/05_sortedoracles.* migrations/
  # cp migrations.bak/06_gaspriceminimum.* migrations/
  # cp migrations.bak/07_reserve_spender_multisig.* migrations/
  # cp migrations.bak/08_reserve.* migrations/
  # cp migrations.bak/09_0_stabletoken_USD.* migrations/
  # cp migrations.bak/09_1_stableToken_EUR.* migrations/
  # cp migrations.bak/10_0_exchange_USD.* migrations/
  # cp migrations.bak/10_1_exchange_EUR.* migrations/
  # cp migrations.bak/11_accounts.* migrations/
  # cp migrations.bak/12_lockedgold.* migrations/
  # cp migrations.bak/13_validators.* migrations/
  # cp migrations.bak/14_election.* migrations/
  # cp migrations.bak/15_epoch_rewards.* migrations/
  # cp migrations.bak/16_random.* migrations/
  # cp migrations.bak/17_attestations.* migrations/
  # cp migrations.bak/18_escrow.* migrations/
  # cp migrations.bak/19_blockchainparams.* migrations/
  # cp migrations.bak/20_governance_slasher.* migrations/
  # cp migrations.bak/21_double_signing_slasher.* migrations/
  # cp migrations.bak/22_downtime_slasher.* migrations/
  # cp migrations.bak/23_governance_approver_multisig.* migrations/
  # cp migrations.bak/24_governance.* migrations/
  # cp migrations.bak/25_elect_validators.* migrations/
fi