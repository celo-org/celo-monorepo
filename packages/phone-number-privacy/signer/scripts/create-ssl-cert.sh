#!/usr/bin/env bash

echo 'Creating a self-signed cert'
echo 'USE ONLY FOR DEVELOPMENT OR TESTING'

openssl req -new -newkey rsa:4096 -days 1000 -nodes -x509 \
    -subj "/C=US/ST=CA/L=SF/O=Dis/CN=celo.org" \
    -keyout server.key -out server.cert