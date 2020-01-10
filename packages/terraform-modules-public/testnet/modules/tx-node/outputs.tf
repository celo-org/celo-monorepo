output internal_ip_addresses {
  value = google_compute_address.tx_node_internal.*.address
}

output ip_addresses {
  value = google_compute_address.tx_node.*.address
}

output self_links {
  value = google_compute_instance.tx_node.*.self_link
}
