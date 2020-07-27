module "ami" {
  source = "../ami"
}

resource "aws_instance" "celo_validator" {
  for_each = var.validators

  ami                    = module.ami.ami_ids.ubuntu_18_04
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [var.security_group_id]
  key_name               = var.key_pair_name
  iam_instance_profile   = var.iam_instance_profile

  root_block_device {
    volume_size = var.volume_size
  }

  user_data = join("\n", [
    file("${path.module}/../startup-scripts/install-base.sh"),
    var.cloudwatch_collect_disk_and_memory_usage ? file("${path.module}/../startup-scripts/install-cloudwatch-agent.sh") : "",
    file("${path.module}/../startup-scripts/install-docker.sh"),
    file("${path.module}/../startup-scripts/install-chrony.sh"),
    templatefile("${path.module}/../startup-scripts/run-validator-node.sh", {
      celo_image                                 = var.celo_image
      celo_network_id                            = var.celo_network_id
      ethstats_host                              = var.ethstats_host
      validator_signer_address                   = each.value.signer_address
      validator_signer_private_key_file_contents = each.value.signer_private_key_file_contents
      validator_signer_private_key_filename      = each.value.signer_private_key_filename
      validator_signer_private_key_password      = each.value.signer_private_key_password
      validator_name                             = each.value.name
      proxy_enode                                = each.value.proxy_enode
      proxy_internal_ip                          = each.value.proxy_private_ip
      proxy_external_ip                          = each.value.proxy_public_ip
      cloudwatch_log_group_name                  = var.cloudwatch_log_group_name
      cloudwatch_log_stream_name                 = "celo_validator_${each.key}"
    }),
    file("${path.module}/../startup-scripts/final-hardening.sh")
  ])

  tags = {
    Name = "celo-validator-${each.value.name}"
  }

  lifecycle {
    ignore_changes = [
      ami,
      user_data
    ]
  }
}