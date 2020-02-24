provider "aws" {
    region = var.region
}

module "celo_cluster" {
  source             = "../testnet"

  region             = var.region
  cidr_blocks         = var.cidr_blocks
}