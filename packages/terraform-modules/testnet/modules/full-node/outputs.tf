output ip_addresses {
  value = google_compute_address.full_node.*.address
}

output internal_ip_addresses {
  value = google_compute_instance.full_node.*.network_interface.0.network_ip
}

output self_links {
  value = google_compute_instance.full_node.*.self_link
}
