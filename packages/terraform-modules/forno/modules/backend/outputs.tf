# map of context -> backend id
output backend_ids {
  value = { for k, v in google_compute_backend_service.backend_service : k => v.id }
}
