#!/usr/bin/python3
# -*- coding: utf-8 -*-

import sys
import urllib.parse
import time
import json
import socket

HOST = '127.0.0.1'  # The server's hostname or IP address
PORT = 9000 

output = sys.argv[1]
output = urllib.parse.unquote(output)

if "Hello" in output :
    print("Internal Message Hello")
else :
    print("Content-type:text/html\n\n")
    print("Radio Selected<br>")
    print(output)
with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((HOST, PORT))
        s.sendall(bytes(output,'ascii'))
        data = s.recv(32768)   # 
        print(data.decode())

