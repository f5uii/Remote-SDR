#!/usr/bin/python3           # This is client.py file


import time
import asyncio
import websockets
import json
import xmlrpc.client
import os
import sys
import socket


from remote_Gpredict_para import *



# get local machine name
host = 'localhost'                           

port_para_Web = 8003
port_hamlib = 8006 # To communicate with Gpredict
port_OmniRig =  8008 # To communicate with OmniRig via network
adr_local = "http://localhost:9003"

# XMLRPC Server
Sxml = xmlrpc.client.ServerProxy(adr_local)

# Variables for Gpredict (Doppler correction)
F_AudioRX=0
F_Gpredict=0

# Variable to inform main process that a web client is still connected
timer_client_connected = 0
                             
print("Bridge to pass RX parameters from client WEB to OPI")

The_Websocket=None

async def consumer_handler(websocket_p, path):
    global F_AudioRX
    global F_Gpredict
    global hamlib_socket
    global hamlib_client
    global timer_client_connected
    global The_Websocket
    global addrClientWeb
    The_Websocket=websocket_p
    async for message_recu in websocket_p:
        
        F=json.loads(message_recu)
        
            
        if "F_Fine" in F :
              print(time.asctime(),"F_Fine ",F["F_Fine"])
              Sxml.set_F_Fine(float(F["F_Fine"]))
              
        if "FrRX" in F :
              print(time.asctime(),"FrRX ",F["FrRX"])
              Sxml.set_FrRX(float(F["FrRX"]))
              
        if "decim_LP" in F :
              print(time.asctime(),"decim_LP ",F["decim_LP"])
              Sxml.set_decim_LP(float(F["decim_LP"]))
              
        if "Modulation" in F :
              print(time.asctime(),"Modulation ",F["Modulation"])
              Sxml.set_Modulation(float(F["Modulation"]))
              
        if "Gain_RF" in F :
              print(time.asctime(),"Gain_RF ",F["Gain_RF"])
              Sxml.set_Gain_RF(float(F["Gain_RF"]))
              
        if "Gain_IF" in F :
              print(time.asctime(),"Gain_IF ",F["Gain_IF"])
              Sxml.set_Gain_IF(float(F["Gain_IF"]))
              
        if "Gain_BB" in F :
              print(time.asctime(),"Gain_BB ",F["Gain_BB"])
              Sxml.set_Gain_BB(float(F["Gain_BB"]))
        
        if "Squelch" in F :
              print(time.asctime(),"Squelch ",F["Squelch"])
              Sxml.set_Squelch(float(F["Squelch"]))
              
        if "F_AudioRX" in F :
              print(time.asctime(),"F_AudioRX ",F["F_AudioRX"])
              F_AudioRX = int(F["F_AudioRX"])  # Requested for Gpredict
              hamlib_client,F_Gpredict = hamlib_loop(hamlib_socket,hamlib_client,F_AudioRX)
              timer_client_connected += 1
              if timer_client_connected >30 :
                os.system("python3 /var/www/html/cgi-bin/SelectRadio.py HelloRX") # inform main process client connected
                timer_client_connected = 0
        
        if "Omnirig" in F : # We send  to Omirig TX status on or off
            print(time.asctime(),"Omnirig ",F["Omnirig"])
            sout_OmniRig.sendto(str.encode(F["Omnirig"]), (addrClientWeb,port_OmniRig))
            
        response="OK"
        
        if F_Gpredict >0 :
            response = "F_Gpredict="+str(F_Gpredict)
            F_Gpredict = 0
        
        await websocket_p.send(response)


async def Main_OmniRig():
    global F_AudioRX
    global addrClientWeb
    global message

    while True:    
        try:	# Read any data from the socket
            data, addr = sin_OmniRig.recvfrom(1024)
            message=message + data.decode('utf8')
            addrClientWeb=addr[0]

            if ";" in message :
                if (The_Websocket!=None) :
                    await The_Websocket.send("Omnirig="+message)
                if message=="IF;"  : # Freeze return when Frequency changes              
                    F="0000000000000"+str(F_AudioRX)
                    L=len(F)         
                    Fs=F[L-12:L]   #RX frequency on 12 digits 
                    sout_OmniRig.sendto(str.encode("IF"+Fs+";"), (addrClientWeb,port_OmniRig))                
                else:
                    print(str.encode(";"),(addrClientWeb,port_OmniRig))
                    sout_OmniRig.sendto(str.encode(";"),(addrClientWeb,port_OmniRig))
                message = ""
        except :	
            pass            
        await asyncio.sleep(0.01) # 
        
    
        
    


#Interface to Omnirig - UDP

addrClientWeb=""
message=""
sout_OmniRig = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sin_OmniRig = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sin_OmniRig.bind(("0.0.0.0",port_OmniRig)) #Listen to Omirig
sin_OmniRig.settimeout(0.0)



#Interface to Gpredict
hamlib_client = ""
hamlib_socket = create_hamlib_socket(port_hamlib)
 

        

start_server_para = websockets.serve(consumer_handler, "", port_para_Web)

loop = asyncio.get_event_loop()

try:
    #loop.run_until_complete(start_server_para)
    loop.run_until_complete(asyncio.gather(start_server_para,Main_OmniRig()))
    loop.run_forever()
   
    
    
    
except KeyboardInterrupt:
    print(time.asctime(),"Keyboard Interrupt")
finally:
    loop.close()
    print(time.asctime(),"Stop Para RX service.")
        
