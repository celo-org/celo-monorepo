output nat_gateway_id {
  value = aws_nat_gateway.nat.id
}

output id {
  value = aws_subnet.public.id
}