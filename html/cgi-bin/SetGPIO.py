#!/usr/bin/python3


import os
import sys
import subprocess



CPU = subprocess.run(['lscpu'], stdout=subprocess.PIPE)
CPU.stdout.decode('utf-8')

clean = True                  # OK for Orange Pi One Plus H6 
if CPU.stdout.find(b"1512.0")>0 : # Orange Pi Zero 2
    clean = False
if CPU.stdout.find(b"armv7l")>0 : #Raspberry Pi4
    clean = True

argument = sys.argv[1].strip()
print("Content-type:text/html\n\n")
                    
argument = argument.replace("\\","")
print(argument)
s=argument.split("*")
for x in s:
   
    y=x.split(",")
    print(y[0])
    print(y[1])
    numgpio=str( y[0])
    etat = str(y[1])
    
    
    print("sudo echo "+numgpio+" > /sys/class/gpio/export")
    os.system("sudo echo "+numgpio+" > /sys/class/gpio/export")   #generate an error with opiz2 but no input mode during few ms as if you clean
    os.system("sudo echo out > /sys/class/gpio/gpio"+numgpio+"/direction")       
    os.system("echo "+ etat +" > /sys/class/gpio/gpio"+numgpio+"/value")
    
    if clean :
        os.system("sudo echo "+numgpio+" > /sys/class/gpio/unexport") # Clean GPIO 
        
        
   
      
