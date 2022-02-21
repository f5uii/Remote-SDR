#!/usr/bin/python3  

import socket

# Hamlib / Gpredict / Doppler correction 
# **************************************
class HamlibHandler:
  
  def __init__(self, sock, address):
    self.sock = sock
    sock.settimeout(0.0)
    self.address = address
    self.received = ''
    self.F_Audio =  0
    self.F_Gpredict = 0

   
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
  def Process(self,F_Audio):
    self.F_Gpredict = 0
    self.F_Audio = F_Audio
    if not self.sock:
      return 0,self.F_Gpredict
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
      return 1,self.F_Gpredict
    valid = 1
    cmd = cmd.strip()		# Here is our command			
    self.params = cmd[1:].strip()
    cmd = cmd[0:1] # single-letter command
    if cmd  == "F" : #Frequency provided by Gpredict when Track engaged
        x = float(self.params)
        self.Reply(0)
        self.F_Gpredict = int(x + 0.5) 
            
        
        print   ("F_Gpredict_in",self.F_Gpredict)
    elif cmd  == "f" : #Gpredict ask for current audio frequency
        
        self.Reply('Frequency', self.F_Audio, 0)
    elif cmd == "q" :
        #print("Stop Engage")
        self.Reply(0)
    else:
        valid = 0
    return valid ,self.F_Gpredict
  

def hamlib_loop(hamlib_socket,hamlib_client,F_Audio) :

      F_Gpredict = 0
      try:
        conn, address = hamlib_socket.accept()
      except socket.error:
        pass
      else:
        print ('Connection from', address)      
        hamlib_client=HamlibHandler( conn, address) #One  client only
      if hamlib_client !="":
          ret ,F_Gpredict=  hamlib_client.Process(F_Audio)
          if not ret:		# False return indicates a closed connection; remove the server
            hamlib_client="" 
      return hamlib_client,F_Gpredict      
      
      
def create_hamlib_socket(port_hamlib) :        
    hamlib_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    hamlib_socket.bind(("", port_hamlib))
    hamlib_socket.settimeout(0.0)
    hamlib_socket.listen(0)
    return hamlib_socket    