output ip_addresses {
  # value = length(google_compute_address.full_node)[*].address
  value = [ for v in google_compute_address.full_node : v.address ]
}

output internal_ip_addresses {
  # value = values(google_compute_instance.full_node)[*].network_interface.0.network_ip
  value = [ for v in google_compute_instance.full_node : v.network_interface.0.network_ip ]
}

output self_links {
  # value = values(google_compute_instance.full_node)[*].self_link
  value = [ for v in google_compute_instance.full_node : v.self_link ]
}

output ip_addresses_map {
  # value = length(google_compute_address.full_node)[*].address
  value = { for k, v in google_compute_address.full_node : k => v.address }
}

output internal_ip_addresses_map {
  # value = values(google_compute_instance.full_node)[*].network_interface.0.network_ip
  value = { for k, v in google_compute_instance.full_node : k => v.network_interface.0.network_ip }
}

output self_links_map {
  # value = values(google_compute_instance.full_node)[*].self_link
  value = { for k, v in google_compute_instance.full_node : k => v.self_link }
}
