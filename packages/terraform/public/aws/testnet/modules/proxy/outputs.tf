output internal_ip_addresses {
  value = aws_instance.validator.*.private_ip
}

output external_ip_addresses {
  value = aws_instance.validator.*.public_ip
}
