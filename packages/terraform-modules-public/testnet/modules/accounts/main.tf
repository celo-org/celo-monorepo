module "mnemonic" {
  source  = "matti/resource/shell"
  command = "mnemonic=$(celocli account:new  | grep 'mnemonic:'); echo $${mnemonic:10}"
}

module "account" {
  source  = "matti/resource/shell"
  command = "mnemonic=$(celocli account:new  | grep 'mnemonic:'); echo $${mnemonic:10}"
}
