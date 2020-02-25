module "ami" {
  source = "../ami"
}

resource "aws_instance" "celo_proxy" {
  for_each = var.proxies

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
    templatefile("${path.module}/../startup-scripts/run-proxy-node.sh", {
      celo_image               = var.celo_image
      celo_network_id          = var.celo_network_id
      ethstats_host            = var.ethstats_host
      validator_name           = each.value.validator_name
      validator_signer_address = each.value.validator_signer_address
    }),
    file("${path.module}/../startup-scripts/final-hardening.sh")
  ])

  tags = {
    Name = "celo-proxy-${each.value.validator_name}"
  }
}