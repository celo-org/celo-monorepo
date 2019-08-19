output "ip_addresses" {
  value = google_compute_address.tx_node.*.address
}
