// *******************************************************
// * Fichier de configuration TX / TX Configuration file *
// *******************************************************

// SDR parameters
//****************
var SDR_paraTX = {
    Name: "HackRF One or Pluto or SA818",
    Fmin: 1000000,
    Fmax: 6000000000
};

//Ham Radio Bands
var BandesTX = new Array();
//BandesTX.push([Fmin,Fmax,"Text",Offset(F_TX- F_RX)]);
BandesTX.push([3500000, 3800000, "80 M", 0]);
BandesTX.push([5351500, 5366500, "60 M", 0]);
BandesTX.push([7000000, 7200000, "40 M", 0]);
BandesTX.push([10100000, 10150000, "30 M", 0]);
BandesTX.push([14000000, 14350000, "20 M", 0]);
BandesTX.push([18068000, 18168000, "17 M", 0]);
BandesTX.push([21000000, 21450000, "15 M", 0]);
BandesTX.push([24890000, 24990000, "12 M", 0]);
BandesTX.push([28000000, 29700000, "10 M", 0]);
BandesTX.push([50000000, 52000000, "6 M", 0]);
BandesTX.push([144000000, 146000000, "2 M", 0]);
BandesTX.push([430000000, 440000000, "70 cm", 0]);
BandesTX.push([1240000000, 1300000000, "23 cm", 0]);
BandesTX.push([2400000000, 2400500000, "QO-100 Up", -8089500000]);
BandesTX.push([10368000000, 10369000000, "10ghz 2568 IF", 0]);


// Etiquettes / Labels
//*********************
var LabelTX = new Array();
//Label.push([Frequency,"Text"]);
LabelTX.push([144300000, "Call USB"]);
LabelTX.push([2400000000, "Lower Beacon"]);
LabelTX.push([2400250000, "Mid Beacon"]);
LabelTX.push([2400360000, "Emergency"]);
LabelTX.push([2400500000, "Upper Beacon"]);

// Zones / Areas in colour
//*************************
var ZoneTX = new Array();
//Zone.push([Fmin,Fmax,"CSS colour");
ZoneTX.push([3500000, 3800000, "green"]);
ZoneTX.push([5351500, 5366500, "green"]);
ZoneTX.push([7000000, 7200000, "green"]);
ZoneTX.push([10100000, 10150000, "green"]);
ZoneTX.push([14000000, 14350000, "green"]);
ZoneTX.push([18068000, 18168000, "green"]);
ZoneTX.push([21000000, 21450000, "green"]);
ZoneTX.push([24890000, 24990000, "green"]);
ZoneTX.push([28000000, 29700000, "green"]);
ZoneTX.push([50000000, 52000000, "green"]);
ZoneTX.push([144150000, 144399000, "green"]);
ZoneTX.push([2400150000, 2400245000, "green"]);
ZoneTX.push([2400255000, 2400350000, "green"]);
ZoneTX.push([2400350000, 2400495000, "yellow"]);

//Relays Shift
//**************
var RelayTX = new Array();
//RelayTX.push([RX Frequency,TX shift,CTCSS freq,"Name"]);
RelayTX.push([145275000, 0, 123, "F1ZSX"]);
RelayTX.push([145675000, -600000, 88.5, "R3 Mt Agel"]);
RelayTX.push([430350000, 9400000, 88.5, "St Jeannet"]);

// Offset in case of up or down converter / Décallage en fréquence
//****************************************************************
var TX_FixedOffset = new Array();
// Values in  Hz
// Band limits TX_Fmin and TX_Fmax in which an offset is applicable
// Freq._to_SDR = Math.abs(Freq.TX + Offset) .
// Negative value for (Freq.TX + Offset) is allowed. It adresses down/up converters which invert the spectrum.
// TX_FixedOffset.push([TX_Fmin,TX_Fmax,Offset]);
TX_FixedOffset.push([10368000000, 10369000000, -7800000000]); //upconverter 2568 IF


// GPIO of the Orange PI in charge of the transmitter
// Set to switch any device in RX Mode or TX mode according to SDR TX frequency
//**********************************************************************
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

//Raspberry 4B
// NumGPIO 4 or pin 7 reserved fo Fan control. 1 = overheat (65°C)
// NumGPIO 7 or pin 26 reserved for Transmit security Oscillator

var TX_GPIO = new Array();

//  TX_GPIO.push([Fmin,Fmax,NumGPIO,state,RX_Mode,TX_Mode]);
// Fmin,Fmax in Hz. Output  state 0 or 1. RX_mode, TX_mode true or false
//TX_GPIO.push([0,6000000000,72,1,false,true]); //1 in Tx mode
//TX_GPIO.push([0,6000000000,72,0,true,false]); //0 in RX mode
//TX_GPIO.push([150000001,500000000,79,0,true,true]);    //Pins for VHF-UHF NBFM with SA818-V and SA818-U and OpiZ2
//TX_GPIO.push([0,430000000,78,0,true,true]);           //Pins for VHF-UHF NBFM with SA818-V and SA818-U and OpiZ2
//TX_GPIO.push([0,150000000,79,1,true,true]);          //Pins for VHF-UHF NBFM with SA818-V and SA818-U and OpiZ2
//TX_GPIO.push([430000001,500000000,78,1,true,true]); //Pins for VHF-UHF NBFM with SA818-V and SA818-U and OpiZ2
//The orders are executed in the order of the array


// Raspberry 4 with 2 HackRF One
// Identification by Serial Number
//********************************
var TX_HackRF_Serial = ""; // Leave a blank string if only One or no Hack RF  connected.
// Put last 4 digits of the HackRF serial number obtained by
// the command hackrf_info in a terminal or Remote SDR tools page.
