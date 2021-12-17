output internal_ip_addresses {
  value = google_compute_address.backup_node_internal.*.address
}

output ip_addresses {
  value = google_compute_address.backup_node.*.address
}

output self_links {
  value = google_compute_instance.backup_node.*.self_link
}
