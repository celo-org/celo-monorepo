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
  cp migrations.bak/00_initial_migration.ts migrations/
  
  # Uncomment lines for whichever migrations you actually do need.
  # Note that some migrations depend on others (for example, many contracts
  # require libraries to have been migrated, so you might need migration 1 to be
  # uncommented).
  # cp migrations.bak/01_libraries.ts migrations/
  # cp migrations.bak/02_registry.ts migrations/
  # cp migrations.bak/03_freezer.ts migrations/
  # cp migrations.bak/03_transferwhitelist.ts migrations/
  # cp migrations.bak/03_whitelist.ts migrations/
  # cp migrations.bak/04_goldtoken.ts migrations/
  # cp migrations.bak/05_sortedoracles.ts migrations/
  # cp migrations.bak/06_gaspriceminimum.ts migrations/
  # cp migrations.bak/07_reserve_spender_multisig.ts migrations/
  # cp migrations.bak/08_reserve.ts migrations/
  # cp migrations.bak/09_stabletoken.ts migrations/
  # cp migrations.bak/10_exchange.ts migrations/
  # cp migrations.bak/11_accounts.ts migrations/
  # cp migrations.bak/12_lockedgold.ts migrations/
  # cp migrations.bak/13_validators.ts migrations/
  # cp migrations.bak/14_election.ts migrations/
  # cp migrations.bak/15_epoch_rewards.ts migrations/
  # cp migrations.bak/16_random.ts migrations/
  # cp migrations.bak/17_attestations.ts migrations/
  # cp migrations.bak/18_escrow.ts migrations/
  # cp migrations.bak/19_blockchainparams.ts migrations/
  # cp migrations.bak/20_governance_slasher.ts migrations/
  # cp migrations.bak/21_double_signing_slasher.ts migrations/
  # cp migrations.bak/22_downtime_slasher.ts migrations/
  # cp migrations.bak/23_governance_approver_multisig.ts migrations/
  # cp migrations.bak/24_governance.ts migrations/
  # cp migrations.bak/25_elect_validators.ts migrations/
fi
