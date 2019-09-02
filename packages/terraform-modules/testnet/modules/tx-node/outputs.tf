output self_links {
  value = google_compute_instance.tx_node.*.self_link
}
