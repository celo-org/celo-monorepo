## OpenPGP WKD

This directory exists to support OpenPGP Web Key Directory on `celo.org`, which allows publishing and retrieval of developer public keys.

### How to publish a key

Refer to `developer_key_publishing.md` in the root of this repository for a guide to publishing OpenPGP keys.

### How to review a publishing PR

Keys are added to this directory by PR on Github. Verifying that only the correct person is editing their keys, and only their key, is an important part of the review process.

#### Confirm that the added key is valid

1. Confirm that the PR includes a single binary file, for example a PR to include a new key for `mariano@clabs.co` will add:

```bash
$ git diff --name-only origin/master...
packages/web/openpgpkey/clabs.co/hu/qu8o7gthfqer78nrk7ah5ufuh58dhup8
```

2. Verify the self-signature on the file by running `gpg --show-keys`.

```bash
$ gpg packages/web/openpgpkey/clabs.co/hu/qu8o7gthfqer78nrk7ah5ufuh58dhup8
pub   rsa2048 2020-07-16 [SC] [expires: 2022-07-16]
      C32F530123A87FF9FDF8FAB70C108219CB5052F9
uid                      Mariano Cortesi <mariano@clabs.co>
sub   rsa2048 2020-07-16 [A] [expires: 2022-07-16]
sub   rsa2048 2020-07-16 [E] [expires: 2022-07-16]
```

3. Confirm that the author of the Github PR owns the email listed in the key.

4. Confirm that the hash of the email uid on the key, as outputted by the following command,  matches the file name of the added key.

```bash
$ $(gpgconf --list-dirs libexecdir)/gpg-wks-client --print-wkd-hash mariano@clabs.co
qu8o7gthfqer78nrk7ah5ufuh58dhup8 mariano@clabs.co
# qu8o7gthfqer78nrk7ah5ufuh58dhup8 matches the file name of the added key. 
```
