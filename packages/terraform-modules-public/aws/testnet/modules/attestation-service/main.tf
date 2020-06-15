module "ami" {
  source = "../ami"
}

resource "aws_instance" "attestation_service" {
  for_each = var.attestation_services

  ami                         = module.ami.ami_ids.ubuntu_18_04
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = [var.security_group_id]
  key_name                    = var.key_pair_name
  associate_public_ip_address = true

  root_block_device {
    volume_size = var.volume_size
  }

  user_data = join("\n", [
    file("${path.module}/../startup-scripts/install-base.sh"),
    file("${path.module}/../startup-scripts/install-docker.sh"),
    file("${path.module}/../startup-scripts/install-chrony.sh"),
    file("${path.module}/../startup-scripts/install-postgres-client.sh"),
    templatefile("${path.module}/../startup-scripts/run-attestation-service.sh", {
      validator_address                            = each.value.validator_address
      attestation_signer_address                   = each.value.attestation_signer_address
      attestation_signer_private_key_filename      = each.value.attestation_signer_private_key_filename
      attestation_signer_private_key_file_contents = each.value.attestation_signer_private_key_file_contents
      attestation_signer_private_key_password      = each.value.attestation_signer_private_key_password
      database_url                                 = var.database_url
      twilio_messaging_service_sid                 = var.twilio_messaging_service_sid
      twilio_account_sid                           = var.twilio_account_sid
      twilio_blacklist                             = var.twilio_blacklist
      twilio_auth_token                            = var.twilio_auth_token
      celo_image                                   = var.celo_image
      celo_network_id                              = var.celo_network_id
      celo_image_attestation                       = var.celo_image_attestation
    }),
    file("${path.module}/../startup-scripts/final-hardening.sh")
  ])

  tags = {
    Name = "celo-attestation-service-${each.value.validator_name}"
  }
}