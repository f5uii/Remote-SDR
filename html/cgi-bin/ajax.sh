#!/bin/bash

echo "Content-type:text/html"
echo ""
echo "<div style='width:100%;background-color: black;color:white;'>"

if [ $1 == "USB" ]
	then	
	x=$(lsusb)
fi
if [ $1 == "HackRFinfo" ]
	then	
	x=$(sudo python3 HackRFinfo.py)
fi

if [ $1 == "testpin26" ]
	then	
	x=$(sudo python3 test_pin_Oscillo.py)
fi

if [ $1 == "RTLSDRinfo" ]
	then	
	x=$(sudo python3 RTLSDRinfo.py)
fi


if [ $1 == "RebootOPI" ]
	then	
	x=$(sudo python3 RebootOPI.py)
fi

if [ $1 == "Shutdown" ]
	then	
	x=$(sudo python3 Shutdown.py)
fi

if [ $1 == "SA818test" ]
	then	
	x=$(sudo python3 SA818test.py)
fi
if [ $1 == "RxGpredict" ]
	then	
	x=$(sudo python3 Gpredict.py RX)
fi
if [ $1 == "TxGpredict" ]
	then	
	x=$(sudo python3 Gpredict.py TX)
fi
if [ $1 == "OmniRigTest" ]
	then	
	x=$(sudo python3 OmnirigTest.py)
fi

echo "${x//$'\n'/<br>}"
echo "</div>"
