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

  subnet_id         = module.celo_vpc.subnet_ids.az1.public
  security_group_id = module.celo_vpc.security_group_ids.bastion
  key_pair_name     = var.key_pair_name
  name              = "celo-bastion-az1"
  instance_type     = var.instance_types.bastion
}

module "celo_bastion_az2" {
  source = "./modules/bastion"

  subnet_id         = module.celo_vpc.subnet_ids.az2.public
  security_group_id = module.celo_vpc.security_group_ids.bastion
  key_pair_name     = var.key_pair_name
  name              = "celo-bastion-az2"
  instance_type     = var.instance_types.bastion
}

module "celo_proxy_az1" {
  source = "./modules/proxy"

  subnet_id         = module.celo_vpc.subnet_ids.az1.public
  security_group_id = module.celo_vpc.security_group_ids.proxy
  key_pair_name     = var.key_pair_name
  instance_type     = var.instance_types.proxy
  celo_image        = var.celo_image
  celo_network_id   = var.celo_network_id

  proxies = var.proxies.az1
}

module "celo_proxy_az2" {
  source = "./modules/proxy"

  subnet_id         = module.celo_vpc.subnet_ids.az2.public
  security_group_id = module.celo_vpc.security_group_ids.proxy
  key_pair_name     = var.key_pair_name
  instance_type     = var.instance_types.proxy
  celo_image        = var.celo_image
  celo_network_id   = var.celo_network_id

  proxies = var.proxies.az2
}

module "celo_validator_az1" {
  source = "./modules/validator"

  subnet_id         = module.celo_vpc.subnet_ids.az1.private
  security_group_id = module.celo_vpc.security_group_ids.validator
  key_pair_name     = var.key_pair_name
  instance_type     = var.instance_types.validator
  celo_image        = var.celo_image
  celo_network_id   = var.celo_network_id

  validators = var.validators.az1
}

module "celo_validator_az2" {
  source = "./modules/validator"

  subnet_id         = module.celo_vpc.subnet_ids.az2.private
  security_group_id = module.celo_vpc.security_group_ids.validator
  key_pair_name     = var.key_pair_name
  instance_type     = var.instance_types.validator
  celo_image        = var.celo_image
  celo_network_id   = var.celo_network_id

  validators = var.validators.az2
}

resource "random_password" "password" {
  length      = 50
  special     = false
  min_lower   = 1
  min_upper   = 1
  min_numeric = 1
}

resource "aws_db_subnet_group" "attestation" {
  name       = "celo-db-subnet-group"
  subnet_ids = [module.celo_vpc.subnet_ids.az1.private, module.celo_vpc.subnet_ids.az2.private]
}

resource "aws_db_instance" "attestation" {
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
  db_subnet_group_name   = aws_db_subnet_group.attestation.name
  vpc_security_group_ids = [module.celo_vpc.security_group_ids.attestation_db]
}

locals {
  attestation_db_url = format("postgresql://%s:%s@%s/%s",
    aws_db_instance.attestation.username,
    aws_db_instance.attestation.password,
    aws_db_instance.attestation.endpoint,
    aws_db_instance.attestation.name
  )
}

module "celo_attestation_service_az1" {
  source = "./modules/attestation-service"

  subnet_id                    = module.celo_vpc.subnet_ids.az1.public
  security_group_id            = module.celo_vpc.security_group_ids.attestation_service
  key_pair_name                = var.key_pair_name
  instance_type                = var.instance_types.attestation_service
  celo_image                   = var.celo_image
  celo_network_id              = var.celo_network_id
  celo_image_attestation       = var.celo_image_attestation
  database_url                 = local.attestation_db_url
  twilio_messaging_service_sid = var.twilio_messaging_service_sid
  twilio_account_sid           = var.twilio_account_sid
  twilio_blacklist             = var.twilio_blacklist
  twilio_auth_token            = var.twilio_auth_token

  attestation_services = var.attestation_services.az1
}

module "celo_attestation_service_az2" {
  source = "./modules/attestation-service"

  subnet_id                    = module.celo_vpc.subnet_ids.az2.public
  security_group_id            = module.celo_vpc.security_group_ids.attestation_service
  key_pair_name                = var.key_pair_name
  instance_type                = var.instance_types.attestation_service
  celo_image                   = var.celo_image
  celo_network_id              = var.celo_network_id
  celo_image_attestation       = var.celo_image_attestation
  database_url                 = local.attestation_db_url
  twilio_messaging_service_sid = var.twilio_messaging_service_sid
  twilio_account_sid           = var.twilio_account_sid
  twilio_blacklist             = var.twilio_blacklist
  twilio_auth_token            = var.twilio_auth_token

  attestation_services = var.attestation_services.az2
}