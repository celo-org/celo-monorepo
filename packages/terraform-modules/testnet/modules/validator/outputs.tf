output internal_ip_addresses {
  value = google_compute_address.validator_internal.*.address
}
