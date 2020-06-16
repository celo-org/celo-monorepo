#!/usr/bin/env bash

openssl req -new -newkey rsa:4096 -days 1000 -nodes -x509 \
    -subj "/C=US/ST=CA/L=SF/O=Dis/CN=celo.org" \
    -keyout server.key -out server.cert