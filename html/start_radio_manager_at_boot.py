import asyncio
import time
import sys
import os
import subprocess

# This program starts and stops any signal processing defined with Gnu Radio
# As example, it starts RX in SSB/NFM/WBFM/AM, TX in SSB/NBFM and then stop them if requested
# The orders are received internally on port 9000, from SelectRadio.py in cgi-bin, launched by the  client web browser.
# It controls also the temperature of the processor

HOST = '127.0.0.1'  # The server's hostname or IP address
PORT = 9000         # The port used by the local server

#Redirection messages
adr_log='/var/www/html/log/remote_radio.log'
f_log = open(adr_log, 'w')
f_log.write(time.asctime()+" : Start of radio manager at boot. \n")  
f_log.close() 
f_log = open(adr_log, 'a')                      
sys.stdout = f_log 
sys.stderr = f_log

# copy authorization to apache to access GPIO as root
os.system("cp /var/www/html/cgi-bin/python_web /etc/sudoers.d/python_web")

#Read HackRF Serial number in case of 2 HackRF connected on Raspberry
def HackSerialExtract (Hack) :
    adr_conf = '/var/www/html/configuration' + Hack + '.js'
    s=""
    with open(adr_conf) as f:
         s = s+ f.read()
         
    p = s.find( Hack + "_HackRF_Serial")
    if p>0 :
        s = s[p:]
        if s.find(";") > 0 :
            s = s[:s.find(";")]
        if s.find("/") > 0 :
            s = s[:s.find("/")]
        if s.find("\n") > 0 :
            s = s[:s.find("\n")]
        if s.find("'") > 0 :
            s = s[s.find("'")+1:]
            s = s[:s.find("'")]
        if s.find('"') > 0 :
            s = s[s.find('"')+1:]
            s = s[:s.find('"')]   
    return s


# CPU Model and SDR HackRF Serial Number if any    
RX_HackRF_Serial = ""
TX_HackRF_Serial = ""
CPU_Model = ""
GPIO_Fan = "73" # Pin 7 on Orange Pi Zero 2(when CPU overheats) or Pin 12 Orange Pi One Plus
 
CPU = subprocess.run(['lscpu'], stdout=subprocess.PIPE) # which cpu
CPU.stdout.decode('utf-8')
if CPU.stdout.find(b"armv7l")>0 : # It' a Raspberry 4
    CPU_Model ="CPU_Model = 'Raspberry PI';"
    Hack = 'RX'
    RX_HackRF_Serial=  HackSerialExtract (Hack) 
    print(time.asctime()+" : RX Hack RF last digits Serial Number : " + RX_HackRF_Serial )
    Hack = 'TX'
    TX_HackRF_Serial=  HackSerialExtract (Hack)  
    print(time.asctime()+" : TX Hack RF last digits Serial Number : " + TX_HackRF_Serial )
    GPIO_Fan = "4" # Pin 7 on Raspberry

    
if CPU.stdout.find(b"aarch64")>0 : # It' an Orange PI One plus or Zero 2
    CPU_Model ="CPU_Model = 'Orange PI One Plus';"
    if CPU.stdout.find(b"1512.0")>0 :
        CPU_Model ="CPU_Model = 'Orange PI Zero 2';"

 
print(time.asctime()+" : " + CPU_Model ) 
#Store CPU for Javascript, client side.
adr_cpu='/var/www/html/log/CPU.js'
f_cpu = open(adr_cpu, 'w')
f_cpu.write(CPU_Model)  
f_cpu.close() 

# GPIO to control a fan when the CPU overheats
adr_thermal = '/sys/class/thermal/thermal_zone0/temp'
timer_client_connected = 0
os.system("sudo echo "+GPIO_Fan+" > /sys/class/gpio/unexport") # Clean GPIO 
os.system("sudo echo "+GPIO_Fan+" > /sys/class/gpio/export")
os.system("sudo echo out > /sys/class/gpio/gpio"+GPIO_Fan+"/direction") 



in_progress_rx = ""
in_progress_tx = ""
f_log.flush();

def Launch_Radio_Process(message): 
    global in_progress_rx
    global rx_gnuradio
    global rx_para
    global rx_audio
    global rx_spectre
    
    global in_progress_tx
    global tx_gnuradio
    global tx_para
    global tx_audio
    
    global RX_HackRF_Serial
    global TX_HackRF_Serial  


    print(time.asctime()+" : Order received : " + message )
    
    if "rx_" in message :
        demand_rx = message
        if demand_rx != in_progress_rx :
            if in_progress_rx !="" :
                rx_gnuradio.kill() #terminate doesn't work with Pluto IIO, need to kill
                rx_para.kill() #terminate()
                rx_audio.kill() #terminate()
                rx_spectre.kill() #terminate()
                print(time.asctime()+" : Terminate RX",in_progress_rx," due to ",demand_rx)
                in_progress_rx = ""
               
                
            # launch new RX radio
            if demand_rx !="" and demand_rx != "rx_stop":
                print(time.asctime() + " : Launch RX : ",demand_rx)
                rx_audio=subprocess.Popen(["python3","/var/www/html/PY/remote_rx_audio.py"])
                rx_spectre=subprocess.Popen(["python3","/var/www/html/PY/remote_rx_spectre.py"])
                rx_para=subprocess.Popen(["python3","/var/www/html/PY/remote_rx_para.py"])
              
                if "hack" in demand_rx and len(RX_HackRF_Serial) > 3:
                    rx_gnuradio=subprocess.Popen(["python3" , "/var/www/html/PY/" + demand_rx,"--device=hackrf=" + RX_HackRF_Serial ])
                else :
                    rx_gnuradio=subprocess.Popen(["python3" , "/var/www/html/PY/" + demand_rx ])
                in_progress_rx = demand_rx
                print(time.asctime()+" : Start RX : ",in_progress_rx)
   
    if "tx_" in message :
        demand_tx = message
        if demand_tx != in_progress_tx :
       
            if in_progress_tx !="" :
                tx_gnuradio.kill() #terminate doesn't work with Pluto IIO, need to kill
                tx_para.kill() #terminate()
                tx_audio.kill() #terminate()
                print(time.asctime() + " : Terminate TX",in_progress_tx," due to ",demand_tx)
                in_progress_tx = ""
            
            # launch new TX radio
            if demand_tx !="" and demand_tx != "tx_stop":
                print(time.asctime() + " : Launch TX : ",demand_tx," and ocillator pin 26 or pin 10")
                # TX Audio management
                tx_audio=subprocess.Popen(["sudo","python3","/var/www/html/PY/remote_tx_audio.py"]) #sudo to have access to GPIO from apache
                # TX parameters management
                if "sa818" in demand_tx : 
                    tx_para=subprocess.Popen(["python3","/var/www/html/PY/remote_tx_para_sa818.py"])  
                else :
                    tx_para=subprocess.Popen(["python3","/var/www/html/PY/remote_tx_para.py"])
                # Signal processing Management by GNU Radio Script
                if "hack" in demand_tx and len(TX_HackRF_Serial) > 3:
                    tx_gnuradio=subprocess.Popen(["python3" , "/var/www/html/PY/" + demand_tx , "--device=hackrf=" + TX_HackRF_Serial ])
                else :
                    tx_gnuradio=subprocess.Popen(["python3" , "/var/www/html/PY/" + demand_tx ])
                in_progress_tx = demand_tx
                print(time.asctime()+" : Start TX : ",in_progress_tx)
    
        
         

async def handle_Local_Server(reader, writer): 
    global timer_client_connected
    
    data = await reader.read(500)
    message = data.decode().strip()
    addr = writer.get_extra_info('peername')
    timer_client_connected = 0
    Launch_Radio_Process(message)
   
    writer.write(bytes("Client Order received : "+message,'ascii'))
    await writer.drain()

    writer.close()
    
    Flusher()

async def main_Temperature():
    global adr_thermal
    global GPIO_Fan
    global timer_client_connected
    while True :        
        with open(adr_thermal) as f: 
            T = int(int(f.read())/1000 ) 
            print('Temperature :',T)
            etat = "0"
            if T >= 65 :
                etat = "1"                 
            os.system("echo "+ etat +" > /sys/class/gpio/gpio"+GPIO_Fan+"/value")
        
        timer_client_connected += 1
        if timer_client_connected > 2 :
            Launch_Radio_Process("rx_stop") # No client. Stop radio process to avoid overheat and consumption
            Launch_Radio_Process("tx_stop")
            timer_client_connected = 0
            Flusher()
        await asyncio.sleep(30) # Test temperature every 30s
   

async def main_Local_Server():
    server = await asyncio.start_server(handle_Local_Server, HOST, PORT)
    addr = server.sockets[0].getsockname()
    print(f'Serving on IP,Port : {addr}')
    
    async with server:          
        await server.serve_forever()
    
def Flusher():
    f_log.flush();  
    if int(os.stat(adr_log).st_size)> 10000 :    
            f_log2 = open(adr_log, 'w')
            f_log2.write(time.asctime()+" : --- Clear log too long ---") 
            f_log2.close()     
        

loop = asyncio.get_event_loop()
#loop.run_until_complete(main_Local_Server())

loop.run_until_complete(asyncio.gather(main_Local_Server(),main_Temperature()))


loop.run_forever()

loop.close()
