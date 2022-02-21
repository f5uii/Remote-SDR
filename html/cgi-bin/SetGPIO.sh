#!/bin/bash

echo "Content-type:text/html"
echo ""
x=$(sudo python3 SetGPIO.py $1)
