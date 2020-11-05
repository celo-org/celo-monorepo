output ami_ids {
  value = {
    ubuntu_18_04 = data.aws_ami.ubuntu.id
  }
}