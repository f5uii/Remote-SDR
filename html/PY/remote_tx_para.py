#!/usr/bin/python3           # This is client.py file

import os
import time
import asyncio
import websockets
import json
import xmlrpc.client
import sys

from remote_Gpredict_para import *

# get local machine name
host = 'localhost'                           

port_para_Web = 8004
port_hamlib = 8007 #to communicate with Gpredict
adr_local = "http://localhost:9004"

Sxml = xmlrpc.client.ServerProxy(adr_local)

# Variables for Gpredict (Doppler correction)
F_AudioTX=0
F_Gpredict=0

# Variable to inform main process that a web client is still connected
timer_client_connected = 0



print("Bridge to pass TX parameter from WEB cient to OPI and pin26 oscillator")


async def consumer_handler(websocket_p, path):
    global F_AudioTX
    global F_Gpredict
    global hamlib_socket
    global hamlib_client
    global timer_client_connected
    async for message_recu in websocket_p:
        F=json.loads(message_recu)
        
        if "Fr_TX" in F :
              print(time.asctime(),"Fr_TX ",F["Fr_TX"])
              Sxml.set_Fr_TX(float(F["Fr_TX"]))              
       

        if "GRF_TX" in F :
              print(time.asctime(),"GainRF TX ",F["GRF_TX"])
              Sxml.set_GainRF_TX(float(F["GRF_TX"]))
              
        if "GIF_TX" in F :
              print(time.asctime(),"GainIF TX ",F["GIF_TX"])
              Sxml.set_GainIF_TX(float(F["GIF_TX"]))	

        if "GBB_TX" in F :
              print(time.asctime(),"GainBB TX ",F["GBB_TX"])
              Sxml.set_GainBB_TX(float(F["GBB_TX"]))	  
              
        if "LSB_NBFM_USB_CW" in F :
              print(time.asctime(),"LSB_NBFM_USB_CW ",F["LSB_NBFM_USB_CW"])
              Sxml.set_LSB_NBFM_USB_CW(float(F["LSB_NBFM_USB_CW"]))
              
        if "F_AudioTX" in F :
              print(time.asctime(),"F_AudioTX ",F["F_AudioTX"])
              F_AudioTX = int(F["F_AudioTX"])  # Requested for Gpredict
              hamlib_client,F_Gpredict = hamlib_loop(hamlib_socket,hamlib_client,F_AudioTX)
              timer_client_connected += 1
              if timer_client_connected >30 :
                os.system("python3 /var/www/html/cgi-bin/SelectRadio.py HelloTX") # inform main process client connected
                timer_client_connected = 0
        
        response="OK"
        if F_Gpredict >0 :
            response = "F_Gpredict="+str(F_Gpredict)
            F_Gpredict = 0        

        await websocket_p.send(response)			  
            
  
hamlib_client = ""
hamlib_socket = create_hamlib_socket(port_hamlib)
 


start_server_para = websockets.serve(consumer_handler, "", port_para_Web)

loop = asyncio.get_event_loop()

try:
    loop.run_until_complete(start_server_para)
    loop.run_forever()
except KeyboardInterrupt:
    print(time.asctime(),"Keyboard Interrupt")
finally:
    loop.close()
    print(time.asctime(),"Stop Para TX service.")
    
