provider "aws" {
  region = var.region
}

module "celo_vpc" {
  source = "./modules/vpc"

  name        = "celo-vpc"
  cidr_blocks = var.cidr_blocks
}

module "celo_bastion_az1" {
  source = "./modules/bastion"

  subnet_id            = module.celo_vpc.subnet_ids.az1.public
  security_group_id    = module.celo_vpc.security_group_ids.bastion
  key_pair_name        = var.key_pair_name
  name                 = "celo-bastion-az1"
  instance_type        = var.instance_types.bastion
  iam_instance_profile = var.iam_instance_profiles.bastion
}

module "celo_bastion_az2" {
  source = "./modules/bastion"

  subnet_id            = module.celo_vpc.subnet_ids.az2.public
  security_group_id    = module.celo_vpc.security_group_ids.bastion
  key_pair_name        = var.key_pair_name
  name                 = "celo-bastion-az2"
  instance_type        = var.instance_types.bastion
  iam_instance_profile = var.iam_instance_profiles.bastion
}

module "celo_proxy_az1" {
  source = "./modules/proxy"

  subnet_id                                = module.celo_vpc.subnet_ids.az1.public
  security_group_id                        = module.celo_vpc.security_group_ids.proxy
  key_pair_name                            = var.key_pair_name
  instance_type                            = var.instance_types.proxy
  celo_image                               = var.celo_image
  celo_network_id                          = var.celo_network_id
  ethstats_host                            = var.ethstats_host
  iam_instance_profile                     = var.iam_instance_profiles.proxy
  cloudwatch_log_group_name                = var.cloudwatch_log_group_names.proxy
  cloudwatch_collect_disk_and_memory_usage = var.cloudwatch_collect_disk_and_memory_usage

  proxies = var.proxies.az1
}

module "celo_proxy_az2" {
  source = "./modules/proxy"

  subnet_id                                = module.celo_vpc.subnet_ids.az2.public
  security_group_id                        = module.celo_vpc.security_group_ids.proxy
  key_pair_name                            = var.key_pair_name
  instance_type                            = var.instance_types.proxy
  celo_image                               = var.celo_image
  celo_network_id                          = var.celo_network_id
  ethstats_host                            = var.ethstats_host
  iam_instance_profile                     = var.iam_instance_profiles.proxy
  cloudwatch_log_group_name                = var.cloudwatch_log_group_names.proxy
  cloudwatch_collect_disk_and_memory_usage = var.cloudwatch_collect_disk_and_memory_usage

  proxies = var.proxies.az2
}

locals {
  validator_proxy_settings = {
    az1 = zipmap(
      keys(var.proxies.az1),
      [for k, v in var.proxies.az1 : {
        proxy_enode      = var.proxies.az1[k].proxy_enode
        proxy_private_ip = lookup(module.celo_proxy_az1.instances, k, { private_ip = "" }).private_ip
        proxy_public_ip  = lookup(module.celo_proxy_az1.eips, k, { public_ip = "" }).public_ip
        }
      ]
    )
    az2 = zipmap(
      keys(var.proxies.az2),
      [for k, v in var.proxies.az2 : {
        proxy_enode      = var.proxies.az2[k].proxy_enode
        proxy_private_ip = lookup(module.celo_proxy_az2.instances, k, { private_ip = "" }).private_ip
        proxy_public_ip  = lookup(module.celo_proxy_az2.eips, k, { public_ip = "" }).public_ip
        }
      ]
    )
  }
  validator_params = {
    az1 = zipmap(
      keys(var.validators.az1),
      [for k, v in var.validators.az1 : merge(var.validators.az1[k], lookup(local.validator_proxy_settings.az1, k, {}))]
    )
    az2 = zipmap(
      keys(var.validators.az2),
      [for k, v in var.validators.az2 : merge(var.validators.az2[k], lookup(local.validator_proxy_settings.az2, k, {}))]
    )
  }
}

module "celo_validator_az1" {
  source = "./modules/validator"

  subnet_id                                = module.celo_vpc.subnet_ids.az1.private
  security_group_id                        = module.celo_vpc.security_group_ids.validator
  key_pair_name                            = var.key_pair_name
  instance_type                            = var.instance_types.validator
  celo_image                               = var.celo_image
  celo_network_id                          = var.celo_network_id
  ethstats_host                            = var.ethstats_host
  iam_instance_profile                     = var.iam_instance_profiles.validator
  cloudwatch_log_group_name                = var.cloudwatch_log_group_names.validator
  cloudwatch_collect_disk_and_memory_usage = var.cloudwatch_collect_disk_and_memory_usage

  validators = local.validator_params.az1
}

module "celo_validator_az2" {
  source = "./modules/validator"

  subnet_id                                = module.celo_vpc.subnet_ids.az2.private
  security_group_id                        = module.celo_vpc.security_group_ids.validator
  key_pair_name                            = var.key_pair_name
  instance_type                            = var.instance_types.validator
  celo_image                               = var.celo_image
  celo_network_id                          = var.celo_network_id
  ethstats_host                            = var.ethstats_host
  iam_instance_profile                     = var.iam_instance_profiles.validator
  cloudwatch_log_group_name                = var.cloudwatch_log_group_names.validator
  cloudwatch_collect_disk_and_memory_usage = var.cloudwatch_collect_disk_and_memory_usage

  validators = local.validator_params.az2
}

resource "random_password" "password" {
  length      = 50
  special     = false
  min_lower   = 1
  min_upper   = 1
  min_numeric = 1
}

resource "aws_db_subnet_group" "attestation" {
  count      = (length(var.attestation_services.az1) > 0 || length(var.attestation_services.az2) > 0) ? 1 : 0
  name       = "celo-db-subnet-group"
  subnet_ids = [module.celo_vpc.subnet_ids.az1.private, module.celo_vpc.subnet_ids.az2.private]
}

resource "aws_db_instance" "attestation" {
  count                  = (length(var.attestation_services.az1) > 0 || length(var.attestation_services.az2) > 0) ? 1 : 0
  identifier             = "celo-attestation-db"
  allocated_storage      = 32
  storage_type           = "gp2"
  engine                 = "postgres"
  engine_version         = "9.6"
  instance_class         = "db.t3.small"
  name                   = "attestation"
  username               = "attestation"
  password               = random_password.password.result
  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.attestation[0].name
  vpc_security_group_ids = [module.celo_vpc.security_group_ids.attestation_db]
  skip_final_snapshot    = true
}

locals {
  attestation_db_url = length(aws_db_instance.attestation) > 0 ? format("postgresql://%s:%s@%s/%s",
    aws_db_instance.attestation[0].username,
    aws_db_instance.attestation[0].password,
    aws_db_instance.attestation[0].endpoint,
    aws_db_instance.attestation[0].name
  ) : ""
}

module "celo_attestation_service_az1" {
  source = "./modules/attestation-service"

  subnet_id                                     = module.celo_vpc.subnet_ids.az1.public
  security_group_id                             = module.celo_vpc.security_group_ids.attestation_service
  key_pair_name                                 = var.key_pair_name
  instance_type                                 = var.instance_types.attestation_service
  celo_image                                    = var.celo_image
  celo_network_id                               = var.celo_network_id
  celo_image_attestation                        = var.celo_image_attestation
  database_url                                  = local.attestation_db_url
  twilio_messaging_service_sid                  = var.twilio_messaging_service_sid
  twilio_account_sid                            = var.twilio_account_sid
  twilio_blacklist                              = var.twilio_blacklist
  twilio_auth_token                             = var.twilio_auth_token
  iam_instance_profile                          = var.iam_instance_profiles.attestation_service
  cloudwatch_attestation_node_log_group_name    = var.cloudwatch_log_group_names.attestation_node
  cloudwatch_attestation_service_log_group_name = var.cloudwatch_log_group_names.attestation_service
  cloudwatch_collect_disk_and_memory_usage      = var.cloudwatch_collect_disk_and_memory_usage

  attestation_services = var.attestation_services.az1
}

module "celo_attestation_service_az2" {
  source = "./modules/attestation-service"

  subnet_id                                     = module.celo_vpc.subnet_ids.az2.public
  security_group_id                             = module.celo_vpc.security_group_ids.attestation_service
  key_pair_name                                 = var.key_pair_name
  instance_type                                 = var.instance_types.attestation_service
  celo_image                                    = var.celo_image
  celo_network_id                               = var.celo_network_id
  celo_image_attestation                        = var.celo_image_attestation
  database_url                                  = local.attestation_db_url
  twilio_messaging_service_sid                  = var.twilio_messaging_service_sid
  twilio_account_sid                            = var.twilio_account_sid
  twilio_blacklist                              = var.twilio_blacklist
  twilio_auth_token                             = var.twilio_auth_token
  iam_instance_profile                          = var.iam_instance_profiles.attestation_service
  cloudwatch_attestation_node_log_group_name    = var.cloudwatch_log_group_names.attestation_node
  cloudwatch_attestation_service_log_group_name = var.cloudwatch_log_group_names.attestation_service
  cloudwatch_collect_disk_and_memory_usage      = var.cloudwatch_collect_disk_and_memory_usage

  attestation_services = var.attestation_services.az2
}