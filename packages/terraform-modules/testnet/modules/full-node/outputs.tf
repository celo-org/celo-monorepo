output ip_addresses {
  value = [for v in google_compute_address.full_node : v.address]
}

output internal_ip_addresses {
  value = [for v in google_compute_instance.full_node : v.network_interface.0.network_ip]
}

output self_links {
  value = [for v in google_compute_instance.full_node : v.self_link]
}

output ip_addresses_map {
  value = { for k, v in google_compute_address.full_node : k => v.address }
}

output internal_ip_addresses_map {
  value = { for k, v in google_compute_instance.full_node : k => v.network_interface.0.network_ip }
}
