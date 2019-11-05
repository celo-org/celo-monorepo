output ip_addresses {
  value = google_compute_address.full_node.*.address
}

output self_links {
  value = google_compute_instance.full_node.*.self_link
}
