output security_group_ids {
  value = {
    attestation_service = aws_security_group.attestation_service.id
    attestation_db      = aws_security_group.attestation_db.id
    bastion             = aws_security_group.bastion.id
    full_node           = aws_security_group.full_node.id
    validator           = aws_security_group.validator.id
    proxy               = aws_security_group.proxy.id
  }
}

output subnet_ids {
  value = {
    az1 = {
      private = module.celo_private_subnet_az1.id
      public  = module.celo_public_subnet_az1.id
    }
    az2 = {
      private = module.celo_private_subnet_az2.id
      public  = module.celo_public_subnet_az2.id
    }
  }
}

output id {
  value = aws_vpc.celo.id
}