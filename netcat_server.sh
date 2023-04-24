#!/bin/bash

handle_exit() {
  echo "Exiting..."
  exit 0
}

trap handle_exit SIGINT

PORT=$1
while true; do
  request=$(echo -e "HTTP/1.1 200 OK\r\n\r\n" | nc -l $PORT)
  payload=$(echo "$request" | sed -n '/{/,/}/p')
  echo "$payload" | /usr/bin/python3 -m json.tool
done