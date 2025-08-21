#!/bin/bash

if [ -d migrations_ts.bak ]; then
  echo Replacing migrations
  rm -rf migrations_ts
  mv migrations_ts.bak migrations_ts
else
  echo Backing up migrations
  mv migrations_ts migrations_ts.bak
  mkdir migrations_ts

  # Migration 0 always needs to be present
  cp migrations_ts.bak/00_initial_migration.* migrations_ts/

  # Uncomment lines for whichever migrations you actually do need.
  # Note that some migrations depend on others (for example, many contracts
  # require libraries to have been migrated, so you might need migration 1 to be
  # uncommented).
  cp migrations_ts.bak/01_libraries.* migrations_ts/
  # cp migrations_ts.bak/02_registry.* migrations_ts/
  # cp migrations_ts.bak/03_freezer.* migrations_ts/
  # cp migrations_ts.bak/03_whitelist.* migrations_ts/
  # cp migrations_ts.bak/04_goldtoken.* migrations_ts/
  # cp migrations_ts.bak/05_sortedoracles.* migrations_ts/
  # cp migrations_ts.bak/06_gaspriceminimum.* migrations_ts/
  # cp migrations_ts.bak/07_reserve_spender_multisig.* migrations_ts/
  # cp migrations_ts.bak/08_reserve.* migrations_ts/
  # cp migrations_ts.bak/09_0_stabletoken_USD.* migrations_ts/
  # cp migrations_ts.bak/09_01_stableToken_EUR.* migrations_ts/
  # cp migrations_ts.bak/09_02_stableToken_BRL.* migrations_ts/
  # cp migrations_ts.bak/10_0_exchange_USD.* migrations_ts/
  # cp migrations_ts.bak/10_01_exchange_EUR.* migrations_ts/
  # cp migrations_ts.bak/10_02_exchange_BRL.* migrations_ts/
  # cp migrations_ts.bak/11_accounts.* migrations_ts/
  # cp migrations_ts.bak/12_lockedgold.* migrations_ts/
  # cp migrations_ts.bak/13_validators.* migrations_ts/
  # cp migrations_ts.bak/14_election.* migrations_ts/
  # cp migrations_ts.bak/15_epoch_rewards.* migrations_ts/
  # cp migrations_ts.bak/16_random.* migrations_ts/
  # cp migrations_ts.bak/17_attestations.* migrations_ts/
  # cp migrations_ts.bak/18_escrow.* migrations_ts/
  # cp migrations_ts.bak/19_blockchainparams.* migrations_ts/
  # cp migrations_ts.bak/20_governance_slasher.* migrations_ts/
  # cp migrations_ts.bak/21_double_signing_slasher.* migrations_ts/
  # cp migrations_ts.bak/22_downtime_slasher.* migrations_ts/
  # cp migrations_ts.bak/23_governance_approver_multisig.* migrations_ts/
  # cp migrations_ts.bak/24_grandamento.* migrations_ts/
  # cp migrations_ts.bak/25_federated_attestations.* migrations_ts/
  # cp migrations_ts.bak/26_00_mento_fee_handler_seller.* migrations_ts/
  # cp migrations_ts.bak/26_01_uniswap_fee_handler_seller.* migrations_ts/
  # cp migrations_ts.bak/26_100_fee_currency_directory.* migrations_ts/
  # cp migrations_ts.bak/26_101_score_manager.* migrations_ts/
  # cp migrations_ts.bak/26_102_epoch_manager_enabler.* migrations_ts/
  # cp migrations_ts.bak/26_103_epoch_manager.* migrations_ts/
  # cp migrations_ts.bak/26_99_fee_handler.* migrations_ts/
  # cp migrations_ts.bak/27_odispayments.* migrations_ts/
  # cp migrations_ts.bak/28_celo_unreleased_treasury.* migrations_ts/
  # cp migrations_ts.bak/29_governance.* migrations_ts/
  # cp migrations_ts.bak/30_elect_validators.* migrations_ts/
fi
