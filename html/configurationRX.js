// ************************************************
// * Fichier de configuration RX / RX Configuration file *
// *************************************************

// SDR parameters
//****************
var SDR_para = {
    Name: "HackRF One or RTL-SDR or Adalm-Pluto",
    Fmin: 1000000,
    Fmax: 6000000000
};

//Ham Radio Bands
var BandesRX = new Array();
//BandesRX.push([Fmin,Fmax,"Text"]);
BandesRX.push([3500000, 3800000, "80 M"]);
BandesRX.push([5351500, 5366500, "60 M"]);
BandesRX.push([7000000, 7200000, "40 M"]);
BandesRX.push([10100000, 10150000, "30 M"]);
BandesRX.push([14000000, 14350000, "20 M"]);
BandesRX.push([18068000, 18168000, "17 M"]);
BandesRX.push([21000000, 21450000, "15 M"]);
BandesRX.push([24890000, 24990000, "12 M"]);
BandesRX.push([28000000, 29700000, "10 M"]);
BandesRX.push([50000000, 52000000, "6 M"]);
BandesRX.push([87600000, 107900000, "FM"]);
BandesRX.push([117975000, 137000000, "Air"]);
BandesRX.push([144000000, 146000000, "2 M"]);
BandesRX.push([430000000, 440000000, "70 cm"]);
BandesRX.push([1240000000, 1300000000, "23 cm"]);
BandesRX.push([2400000000, 2400500000, "QO-100 Up"]);
BandesRX.push([10368000000, 10369000000, "10 ghz 2568 IF"]);
BandesRX.push([10489500000, 10490000000, "QO-100 Down"]);
BandesRX.push([10490000000, 10500000000, "QO-100 WB Down"]);

// Offset in case of up or down converter / Décallage en fréquence (ex:Antenne parabolique)
//*****************************************************************************************
var RX_FixedOffset = new Array();
//Values in  Hz
//Band limits Fmin and Fmax in which an offset is applicable
// Freq._to_SDR = Math.abs(Freq.RX + Offset) .
// Negative value for (Freq.RX + Offset) is allowed. It adresses down/up converters which invert the spectrum.
// RX_FixedOffset.push([Fmin,Fmax,Offset]);
RX_FixedOffset.push([10368000000, 10369000000, -7800000000]); //transverter 2568 IF
RX_FixedOffset.push([10489000000, 10500000000, -9750000000]); //QO-100 Dish


// Etiquettes / Labels
//*********************
var Label = new Array();
//Label.push([Frequency,"Text"]);
Label.push([3568600, "WSPR"]);
Label.push([3573000, "FT8"]);
Label.push([3760000, "Emergency"]);
Label.push([5357000, "FT8"]);
Label.push([7033000, "SSTV"]);
Label.push([7038600, "WSPR"]);
Label.push([7074000, "FT8"]);
Label.push([7110000, "Emergency"]);
Label.push([10136000, "FT8"]);
Label.push([10138700, "WSPR"]);
Label.push([14074000, "FT8"]);
Label.push([14095600, "WSPR"]);
Label.push([14230000, "SSTV"]);
Label.push([14300000, "Emergency"]);
Label.push([18100000, "FT8"]);
Label.push([18104600, "WSPR"]);
Label.push([18160000, "Emergency"]);
Label.push([21074000, "FT8"]);
Label.push([21094600, "WSPR"]);
Label.push([21340000, "SSTV"]);
Label.push([21360000, "Emergency"]);
Label.push([24915000, "FT8"]);
Label.push([24924600, "WSPR"]);
Label.push([28074000, "FT8"]);
Label.push([28124600, "WSPR"]);
Label.push([28680000, "SSTV"]);
Label.push([50293000, "WSPR"]);
Label.push([50313000, "FT8"]);
Label.push([144074000, "FT8"]);
Label.push([144300000, "SSB Call"]);
Label.push([144489000, "WSPR"]);
Label.push([144500000, "SSTV"]);
Label.push([432174000, "FT8"]);
Label.push([432300000, "WSPR"]);
Label.push([1296174000, "FT8"]);
Label.push([1296500000, "WSPR"]);
Label.push([10489500000, "Lower Beacon"]);
Label.push([10489750000, "Mid Beacon"]);
Label.push([10490000000, "Upper Beacon"]);
Label.push([10489860000, "Emergency"]);

// Zones / Areas in colour
//*************************
var Zone = new Array();
//Zone.push([Fmin,Fmax,"CSS colour"]);
Zone.push([3500000, 3800000, "green"]);
Zone.push([5351500, 5366500, "green"]);
Zone.push([7000000, 7200000, "green"]);
Zone.push([10100000, 10150000, "green"]);
Zone.push([14000000, 14350000, "green"]);
Zone.push([18068000, 18168000, "green"]);
Zone.push([21000000, 21450000, "green"]);
Zone.push([24890000, 24990000, "green"]);
Zone.push([28000000, 29700000, "green"]);
Zone.push([50000000, 52000000, "green"]);
Zone.push([87600000, 107900000, "green"]);
Zone.push([117975000, 137000000, "green"]);
Zone.push([144000000, 146000000, "green"]);
Zone.push([430000000, 440000000, "green"]);
Zone.push([1240000000, 1300000000, "green"]);
Zone.push([2400000000, 2400500000, "green"]);
Zone.push([10489500000, 10489505000, "#f00"]);
Zone.push([10489505000, 10489540000, "#0f0"]);
Zone.push([10489540000, 10489650000, "#88c"]);
Zone.push([10489650000, 10489745000, "#8ff"]);
Zone.push([10489745000, 10489755000, "#f00"]);
Zone.push([10489755000, 10489850000, "#8ff"]);
Zone.push([10489995000, 10490000000, "#f00"]);

// Balises / Beacons Clocks Synchronisation
//*****************************************
var BeaconSync = new Array();
//BeaconSync.push([Frequency,"Info Text"]);
BeaconSync.push([10489500000, "Lower Beacon Q0100"]);
BeaconSync.push([10489750000, "Mid Beacon Q0100"]);
BeaconSync.push([10490000000, "Upper Beacon Q0100"]);

// GPIO of the Orange PI or RPI4 in charge of the receiver
// Set to switch any device in RX Mode or TX mode according to SDR RX frequency
//*****************************************************************************
//NumGPIO		Pin Opi One Plus	Pin Opi Zero2
//69					24					13
//71					18					22
//72					16					15
//73					12					7    Reserved for FAN control when the CPU overheats . 1 = overheat (65°C)
//74										26   Reserved for Transmit security Oscillator on Opi Zero 2
//227					26					10   Reserved for Transmit security Oscillator on Opi One Plus
//228					7					5
//229					5					3
//230					3					23
//Other NumGPIO available but not common to One Plus and Zero2. See documentation

//Raspberry 4b
// NumGPIO 4 or pin 7 reserved fo Fan control. 1 = overheat (65°C)
// NumGPIO 7 or pin 26 reserved for Transmit security Oscillator

var RX_GPIO = new Array()

//  RX_GPIO.push([Fmin,Fmax,NumGPIO,state,RX_Mode,TX_Mode]);
// Fmin,Fmax in Hz. Output  state 0 or 1. RX_mode, TX_mode true or false
//RX_GPIO.push([1000000,150000000,71,0,true,false]);
//RX_GPIO.push([1000000,150000000,71,1,false,true]);
//RX_GPIO.push([0,150000000,230,0,true,false]);
//RX_GPIO.push([0,150000000,230,1,false,true]);
//RX_GPIO.push([150000000,500000000,230,1,true,true]);

//For a Raspberry 4b type in a terminal 'pinout' to have the correspondance GPIO number and pin number
//RX_GPIO.push([1000000,150000000,21,0,true,false]);
//RX_GPIO.push([1000000,150000000,21,1,false,true]);


// Raspberry 4 with 2 HackRF One
// Identification by Serial Number
//********************************
var RX_HackRF_Serial = ""; // Leave a blank string if only One or no Hack RF  connected.
// Put last 4 digits of the HackRF serial number obtained by
// the command hackrf_info in a terminal or Remote SDR tools page.
//

//External web pages displayed in iframe
//**************************************
var Iframes = new Array();
//Iframes.push(["Page address","Title"]);
// Remove or Put // at the beginning of the line to display or not the external page
//Iframes.push(["/iframes/gs232/html/rotator.html","GS 232 Rotator"]); //GS 232 Rotator control
//Iframes.push(["/iframes/HFpropag/index.html","Propagation"]); //HF propagation
