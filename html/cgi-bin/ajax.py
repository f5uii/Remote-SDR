#!/usr/bin/python3


import os
import sys
import subprocess


def clear_print(x) :
    print( x.replace('\n','<br>'))

argument = sys.argv[1]
print("Content-type:text/html\n\n")

print("<div style='width:100%;background-color: black;color:white;'>")
if  argument=="RxConf" :
    adr_conf = '/var/www/html/configurationRX.js'
    with open(adr_conf) as f:
         clear_print( f.read())
         
if  argument=="TxConf" :
    adr_conf = '/var/www/html/configurationTX.js'
    with open(adr_conf) as f:
         clear_print( f.read())

if  argument=="ApacheError" :
    adr_log='/var/log/apache2/error.log'
    with open(adr_log) as g:
        clear_print( g.read())
        
if  argument=="ChangesLog" :
    adr_log='/var/www/html/log/changes_log.log'
    with open(adr_log) as g:
        clear_print( g.read())
    
if  argument=="PlutoHelp" :
    import paramiko
    client = paramiko.SSHClient()
    client.load_system_host_keys()

    client.set_missing_host_key_policy(paramiko.WarningPolicy())
    clear_print("Connecting to Pluto...Wait\n")

    client.connect('192.168.2.1', 22, username='root', password='analog')
    stdin, stdout, stderr = client.exec_command('help')
    for line in stdout:
        clear_print(line)
    client.close()
    clear_print("-----------------<br>Done")

    

    
if  argument=="PlutoReboot" :
    import paramiko
    client = paramiko.SSHClient()
    client.load_system_host_keys()

    client.set_missing_host_key_policy(paramiko.WarningPolicy())
    clear_print("Connecting to Pluto...Wait\n")

    client.connect('192.168.2.1', 22, username='root', password='analog')
    stdin, stdout, stderr = client.exec_command('reboot')
    clear_print('Pluto reboot in progress')
    
if  argument=="Historic" :  
    clear_print("-- Historic orders received by the radio manager ---<br>")      
    adr_log='/var/www/html/log/remote_radio.log'
    with open(adr_log) as g:
        clear_print( g.read())
        

        
if  argument=="Temperature" :
    adr_conf = '/sys/class/thermal/thermal_zone0/temp'
    with open(adr_conf) as f: 
        T = int(int(f.read())/1000 )  
        clear_print( str(T)+"&ring;C")


    
print("</div>")    
 
