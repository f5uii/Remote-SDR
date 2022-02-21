#!/usr/bin/python3           address Python 3 environment


import sys, time, socket
import urllib.parse


RXorTX = sys.argv[1]
RXorTX = urllib.parse.unquote(RXorTX)  #RX or TX


PORT = 8006
HOST=""
if RXorTX == "TX" :
    PORT=8007
print("Wait on Gpredict client for : ",RXorTX," on port : ",PORT)

class HamlibHandler:
 
  def __init__(self, sock, address):
   		
    self.sock = sock
    sock.settimeout(0.0)
    self.address = address
    self.received = ''
    self.freq = 145000000
   
  def Send(self, text):
      self.sock.sendall(text.encode())
  def Reply(self, *args):	# args is name, value, name, value, ..., int
   
    if len(args) > 1:		# any argument
      t = ''
      for i in range(1, len(args) - 1, 2):
        t = "%s%s\n" % (t, args[i])
    else:		# No names; just the required integer code
      t = "RPRT %d\n" % args[0]
    
    print ('Reply', t)
    self.Send(t)
  def Process(self):
    if not self.sock:
      return 0
    try:	# Read any data from the socket
      text = self.sock.recv(1024)
     
    except socket.timeout:	# This does not work
      pass
    except socket.error:	# Nothing to read
      pass
    else:					# We got some characters
      self.received += str(text.decode())
      print("Demand received : ",text.decode().strip())
  
  
      
    if '\n' in self.received:	# A complete command ending with newline is available    
      cmd, self.received = self.received.split('\n', 1)	# Split off the command, save any further characters
    else:
      return 1
    valid = 1
    cmd = cmd.strip()		# Here is our command			
    self.params = cmd[1:].strip()
    cmd = cmd[0:1] # single-letter command
    if cmd  == "F" :
        self.SetFreq()   
    elif cmd  == "f" :
        self.GetFreq()
    elif cmd == "q" :
        self.GetQ()
    else:
        valid = 0
    return valid 
  # These are the handlers for each request
 
  def GetFreq(self):
  
    self.Reply('Frequency', self.freq, 0)
    
  def SetFreq(self):
    
      x = float(self.params)
      self.Reply(0)
  
      x = int(x + 0.5)
      self.freq = x
  
  def GetQ(self):
    print("Stop Engage")
    self.Reply(0)
 
    
      





hamlib_client = ""
hamlib_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
hamlib_socket.bind((HOST, PORT))
hamlib_socket.settimeout(0.0)
hamlib_socket.listen(0)
address=""
T0=time.time()+10
while time.time()<T0:
      time.sleep(0.5)
      try:
        conn, address = hamlib_socket.accept()
      except socket.error:
        pass
      else:
        print ('Connection from', address)
      
        hamlib_client=HamlibHandler( conn, address) #One  client only
      if hamlib_client !="":
          ret =  hamlib_client.Process()
          if not ret:		# False return indicates a closed connection; remove the server
              
              break
hamlib_client=""
print ('Remove', address)