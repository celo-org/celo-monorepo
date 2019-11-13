output tx_node_internal_ip_addresses {
  value = module.tx_node.internal_ip_addresses
}

output tx_node_ip_addresses {
  value = module.tx_node.ip_addresses
}

output tx_node_lb_ip_address {
  value = module.tx_node_lb.ip_address
}

output validator_internal_ip_addresses {
  value = module.validator.internal_ip_addresses
}
