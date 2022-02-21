// ***********************************
// *           REMOTE SDR            *
// *              F1ATB              *
// * GNU General Public Licence v3.0 *
// ***********************************
//
// Variable Port socket reference
//*******************************

// Variables websockets spectrum and parameters
var websocket_spectre;
var websocket_para;
var web_socket = {
    audio_on: false,
    spectre_on: false,
    para_on: false,
    spectre_in: false
};
var Watch_dog = {
    RXpara: -2,
    RXspectre: -2,
    RXaudio: -2,
    TXpara: -2,
    Last_Refresh: 0,
    Omnirig: 0
};
//Parametres GNU Radio
var rx_python_gnuradio_script = "";
var SDR_RX = {
    Audio_RX: 145100000,
    fine: 0,
    centrale_RX: 145000000,
    FrRX: 0,
    Xtal_Error: 0,
    CW_shiftRXTX: 0,
    echant: 2400000,
    min: 0,
    max: 0,
    bande: 1,
    idx_bande: 2,
    mode: 1,
    auto_offset: true,
    bandeRX: 0,
    BandeRXmin: 0,
    BandeRXmax: 0,
    IP: "",
	port_audio:8001,
    squelch: -80,
    sdr: "RTL"
};
var Gain_RX = {
    RF: 10,
    IF: 20,
    BB: 20
};
var bandes = new Array();
var RXconverter = {
    fixed_offset: 0,
    invSpectra: false
};
//bande affichée,LP_bande reelle/2,decimLP
bandes.push(["125 kHz", 65000, 16]);
bandes.push(["250 kHz", 130000, 8]);
bandes.push(["500 kHz", 260000, 4]);
bandes.push(["1 MHz", 520000, 2]);
bandes.push(["2 MHz", 1040000, 1]);
//Reception/Transmission modes
//Mode,HF Band,Freq. step
var RX_modes = new Array();
RX_modes.push(["LSB", 3000, 10]);
RX_modes.push(["USB", 3000, 10]);
RX_modes.push(["AM", 7500, 10]);
RX_modes.push(["NBFM", 10000, 2500]);
RX_modes.push(["WBFM", 150000, 10000]);
RX_modes.push(["CW-LSB", 3000, 10]);
RX_modes.push(["CW-USB", 3000, 10]);
//Python script according to mode and SDR (
var RX_script = new Array();
RX_script.push("hack_rx_sanw_v3.py", "pluto_rx_sanw_v3.py");
var timer_info = 0;
var F_Audio_Top = 0; //Frequency of maximum
//Gpredict
var GPredictRXcount = 0;
var TX_init = false;
var RXfreqRefresh = false;
// 
// Spectrum Websocket
function Lance_Websocket_spectre() {
    //Initialisation du websocket_spectre
    // serveur
    console.log(Date.now()-T0_remsdr,"RX spectra socket setting");
    $("#RXonLed").css("background-color", "Red");
    var adresse = "ws://" + Host_IP.RX + ":" + (parseInt(SDR_RX.port_audio) + 1).toString() + "/"; //Port serveur web de base +1 pour le spectre
    websocket_spectre = new WebSocket(adresse);
    $("#RX_spec_set").css("background-color", "LightGreen");
    // code à déclencher quand le connexion est ouverte
    websocket_spectre.onopen = function (evt) {
        $("#RX_spec_con").css("background-color", "LightGreen"); //Connected
        web_socket.spectre_on = true;
        first_spectre = true
            console.log(Date.now()-T0_remsdr,"RX spectra socket open");
    };
    // code à déclencher si le serveur nous envoie spontanément
    // un message
    websocket_spectre.onmessage = function (evt) {
        if (!web_socket.spectre_in) { //First messages arrive. GNU RADIO launched
            $("#RXonLed").css("background-color", "Pink");
			console.log(Date.now()-T0_remsdr,"RX spectra first data received")
            Lance_Websocket_para();
        }
        Trace_Audio();
        var canvasOscillo = document.getElementById("myOscillo");
        var ctx = canvasOscillo.getContext("2d");
        ctx.beginPath();
        ctx.strokeStyle = "lightgreen";
        ctx.lineWidth = 4
            ctx.moveTo(TraceAudio.X, TraceAudio.H + 2);
        ctx.lineTo(TraceAudio.X, TraceAudio.H + 7);
        ctx.stroke();
        web_socket.spectre_in = true;
        var DataSpectre_blob = evt.data; //Data Spectre recues en Blob
        var reader = new FileReader(); // A lire comme un fichier
        reader.addEventListener("loadend", function () {
            // reader.result contient le contenu du
            // blob sous la forme d'un tableau typé
            var spectre = new Int16Array(reader.result);
            if (!audioTX.Transmit || SDR_TX.Fduplex) {
                Trace_Spectre(spectre);
                Trace_Waterfall();
            }
            balise.nb_voies = spectre.length;
            balise.voie_recu = true;
        });
        reader.readAsArrayBuffer(DataSpectre_blob);
        Watch_dog.RXspectre = 0;
    };
    // in case of errors
    websocket_spectre.onerror = function (evt) {
        console.log(evt);
    };
}
function Lance_Websocket_para() {
    //Initialisation du websocket_para
    // serveur
    console.log(Date.now()-T0_remsdr,"RX parameters socket setting")
    var adresse = "ws://" + Host_IP.RX + ":" + (parseInt(SDR_RX.port_audio) + 2).toString() + "/"; //Port serveur web de base +2 pour les parametres
    websocket_para = new WebSocket(adresse);
    $("#RX_para_set").css("background-color", "LightGreen");
    // code à déclencher quand le connexion est ouverte
    websocket_para.onopen = function (evt) {
        $("#RX_para_con").css("background-color", "LightGreen");
        web_socket.para_on = true;
        console.log(Date.now()-T0_remsdr,"RX parameters socket open");
        $("#RXonLed").css("background-color", "Orange");
        setTimeout("init_para_sdrRX();", 130);
    };
    // code when server send data
    // Return is 'OK' or Gpredict directive to compensate Doppler
    websocket_para.onmessage = function (evt) {
        // le serveur envoi des messages
        web_socket.para_on = true;
        $("#RXonLed").css("background-color", "LightGreen");
        Watch_dog.RXpara = 0;
        //Return from Gpredict
        if (evt.data.indexOf("F_Gpredict=") == 0) {
            var TF = evt.data.split("=");
            var F_Gpredict = parseInt(TF[1]);
            GPredictRXcount = Math.min(GPredictRXcount, 0);
            var V = "hidden";
            if (GPredictRXcount >= 0) { //Take into account Freq doppler correction from Gpredict
                SDR_RX.fine = F_Gpredict - SDR_RX.centrale_RX;
                choix_freq_fine();
                Affiche_Curseur();
                V = "visible"
            }
            $("#RXgpredict").css("visibility", V);
        }
        //Return from Omnirig
        if (evt.data.indexOf("Omnirig=") == 0) {
            Watch_dog.Omnirig = 3;
            var Omni = evt.data.split("=");
            if (Omni[1] == "TX1;" && audioTXnode.process_out) { //Demand to TX
                Transmit_On_Off(true);
                if (audioTX.Transmit) {
                    websocket_para.send('{"Omnirig":"TX1"}'); //TX accepted
                } else {
                    websocket_para.send('{"Omnirig":"TX0"}'); //TX refused
                }
            }
            if (Omni[1] == "TX0;" && audioTXnode.process_out) { //Demand to RX
                Transmit_On_Off(false);
                websocket_para.send('{"Omnirig":"TX0"}'); //RX OK
            }
            if (Omni[1].indexOf("FA") == 0) { //Omni want to set the frequency
                var newFreq = parseInt(Omni[1].substring(2, Omni[1].length - 1));
                if (newFreq > 0) {
                    var deltaF = newFreq - SDR_RX.Audio_RX;
                    Recal_fine_centrale(deltaF); //Rough tune
                    choixBandeRX();
                    newBandRX(SDR_RX.bandeRX);
                    $("#bandSelectRX option[value='" + SDR_RX.bandeRX + "']").prop('selected', true);
                    for (let i = 0; i < 2; i++) { //Fine tune
                        deltaF = newFreq - SDR_RX.Audio_RX;
                        if (deltaF != 0)
                            Recal_fine_centrale(deltaF);
                    }
                }
            }
        }
    };
    // en cas d'erreur
    websocket_para.onerror = function (evt) {
        console.log(evt);
    };
}
function init_para_sdrRX() {
    //On initialise les parametres du  traitement SDR
	console.log(Date.now()-T0_remsdr,'RX parameters init');
    choix_freq_fine();
    choix_freq_central();
    choix_bande();
    choix_mode();
    choix_GainRX();
}
// PARAMETERS TO PASS TO THE RX SDR
//*********************************
function choix_freq_central() {
    SDR_RX.centrale_RX = 10000 * Math.floor(SDR_RX.centrale_RX / 10000); //10kHz step
    //Offset in case of Up or Down Converter
    RXconverter.fixed_offset = 0;
    for (var i = 0; i < RX_FixedOffset.length; i++) {
        if (SDR_RX.centrale_RX > RX_FixedOffset[i][0] && SDR_RX.centrale_RX < RX_FixedOffset[i][1]) {
            RXconverter.fixed_offset = RX_FixedOffset[i][2];
        }
    }
    SDR_RX.FrRX = SDR_RX.centrale_RX + RXconverter.fixed_offset + SDR_RX.Xtal_Error;
    RXconverter.invSpectra = (SDR_RX.FrRX < 0) ? true : false; // ex: Converter with an oscillator higher than the received frequency
    SDR_RX.FrRX = Math.abs(Math.floor(SDR_RX.FrRX));
    if (SDR_RX.FrRX > SDR_para.Fmin && SDR_RX.FrRX < SDR_para.Fmax) { //Frequency allowed
        if (web_socket.para_on && web_socket.spectre_in) {
            websocket_para.send('{"FrRX":"' + SDR_RX.FrRX + '"}'); //Frequency send to the SDR
            $("#RXonLed").css("background-color", "blue");
            Affich_freq_champs(SDR_RX.FrRX, "#SFr")
            Watch_dog.Last_Refresh = 0;
            Set_RX_GPIO();
        }
        $("#Frequence_AudioRX").css("background-color", "#555");
    } else {
        $("#Frequence_AudioRX").css("background-color", "#F00");
    }
    Trace_Echelle();
    Affich_freq_Audio_RX();
    Affich_freq_champs(RXconverter.fixed_offset, "#OFS");
    Affich_freq_champs(SDR_RX.Xtal_Error, "#DOF");
    if (ZoomFreq.id == "DOF")
        Affich_freq_champs(SDR_RX.Xtal_Error, "#ZFr"); //Zoom display
}
function Audio_Bandwidth() { // Green Cursor width
    var bw = RX_modes[SDR_RX.mode][1];
    var Hz_by_pix = SDR_RX.bande / fenetres.spectreW;
    var wp = bw / Hz_by_pix;
    $("#curseur_w").css("width", wp + "px");
    var left = 10 - wp / 2;
    if (RX_modes[SDR_RX.mode][0] == "LSB" || RX_modes[SDR_RX.mode][0] == "CW-LSB")
        left = 10 - wp;
    if (RX_modes[SDR_RX.mode][0] == "USB" || RX_modes[SDR_RX.mode][0] == "CW-USB")
        left = 10;
    $("#curseur_w").css("left", left + "px");
}
function choix_mode() { //MODE
    SDR_RX.mode = parseInt($("input[name='mode']:checked").val());
    var choix_python_script = RX_script[0]; //HackRF or RTL-SDR
    if (SDR_RX.sdr == "pluto")
        choix_python_script = RX_script[1]; //Pluto SDR
    if (choix_python_script != rx_python_gnuradio_script && SDR_RX.IP.length > 3) {
        rx_python_gnuradio_script = choix_python_script;
        // Stop sending parameters
        if (web_socket.para_on) {
            websocket_para.close();
            web_socket.para_on = false;
        }
        if (web_socket.spectre_on) {
            websocket_spectre.close();
            web_socket.spectre_on = false;
            web_socket.spectre_in = false;
        }
        if (web_socket.audio_on) {
            websocket_audio.close();
            web_socket.audio_on = false;
            for (var j = 0; j < audioRX.nbFrames; j++) {
                audioRX.Tampon[j] = 0; //Reset audio Buffer when off
            }
        }
        //Stop any  RX radio process on Orange PI/Raspberry PI at init
        RX_Scan.count = -20; // Stop any scanning
        console.log(Date.now()-T0_remsdr,"RX Start New Mode -RX-RX-RX-RX-RX-");
        var adresse = "http://" + SDR_RX.IP + "/cgi-bin/SelectRadio.py";
        var fct = "setTimeout('GRadio_Script_Launcher();', 40);console.log('RX stopped');"; // RX Stop and wait
        var loader = '<iframe src="' + adresse + '?rx_stop" onload="' + fct + '"></iframe>';
        $("#RX_loader").html(loader);
    }
    Audio_Bandwidth();
    if (web_socket.para_on && web_socket.spectre_in) {
        var M = SDR_RX.mode;
        var M = (RXconverter.invSpectra) ? 1 - SDR_RX.mode : SDR_RX.mode; //LSB or USB inverted or not
        if (SDR_RX.mode == 5 || SDR_RX.mode == 6) {
            M = SDR_RX.mode - 5; //CW-LSB and CW-USB
            M = (RXconverter.invSpectra) ? 6 - SDR_RX.mode : M; //inversion CW-LSB and CW-USB
        }
        websocket_para.send('{"Modulation":"' + M + '"}');
        if (RX_modes[SDR_RX.mode][0] == "NBFM" || RX_modes[SDR_RX.mode][0] == "WBFM" || RX_modes[SDR_RX.mode][0] == "AM")
            websocket_para.send('{"Squelch":"' + SDR_RX.squelch + '"}');
    }
    Save_RX_Para();
    if (TX_init)
        Mode_TX();
    Affich_freq_Audio_RX();
    if (SDR_TX.TXeqRX)
        rxvtx();
}
function GRadio_Script_Launcher() {
    console.log(Date.now()-T0_remsdr,"RX launch : gnuradio script = " + rx_python_gnuradio_script)
    var adresse = "http://" + SDR_RX.IP + "/cgi-bin/SelectRadio.py"
        var loader = '<iframe src="' + adresse + '?' + rx_python_gnuradio_script + '" onload="Sockets_launcher();"></iframe>'
        $("#RX_loader").html(loader);
}
function Sockets_launcher() {
    console.log(Date.now()-T0_remsdr,"RX launched : gnuradio script = " + rx_python_gnuradio_script)
    $("#RXonLed").css("background-color", "Brown");
    setTimeout("Lance_Websocket_spectre();", 500); //Delay for smartphone browsers to obtain green LED
    if (!web_socket.audio_on && audioRX.on)
        setTimeout("Lance_Websocket_audio();", 120);
}
function click_squelch() {
    $("#val_squelch").html(SDR_RX.squelch);
    $("#fen_squelch").css("display", "block");
    timer_info = 2;
}
function choix_bande() { //Decimation done in GNU Radio
    if (SDR_RX.sdr == "pluto")
        SDR_RX.idx_bande = Math.min(SDR_RX.idx_bande, bandes.length - 2); //Pluto Max bandwidth 1MHz
    if (web_socket.para_on && web_socket.spectre_in)
        websocket_para.send('{"decim_LP":"' + bandes[SDR_RX.idx_bande][2] + '"}');
    $("#Bande_RX").html(bandes[SDR_RX.idx_bande][0]);
}
function choix_freq_fine() { //Frequency for audio channel
    var step = RX_modes[SDR_RX.mode][2];
    if (step >= 2500)
        SDR_RX.fine = step * Math.floor(SDR_RX.fine / step + 0.5); // rounded values for NBFM and WBFM
    var deltaF = (SDR_RX.bande) / 2;
    SDR_RX.fine = Math.max(SDR_RX.fine, -deltaF);
    SDR_RX.fine = Math.min(SDR_RX.fine, deltaF);
    SDR_RX.fine = Math.floor(SDR_RX.fine);
    RXfreqRefresh = true;
}
function Refresh_Freq_Fine() { //This function to mimit the number of messages to SDR when cursor moving
    if (RXfreqRefresh) {
        var FreqFine = (RXconverter.invSpectra) ? -SDR_RX.fine : SDR_RX.fine; // Case of spectra inverted
        if (web_socket.para_on && web_socket.spectre_in)
            websocket_para.send('{"F_Fine":"' + FreqFine + '"}');
        if (SDR_TX.TXeqRX)
            rxvtx();
        timer_auto_relay = 2;
        RXfreqRefresh = false;
        Affich_freq_Audio_RX();
    }
}
function update_freq_RX_Audio() {
    if (web_socket.para_on)
        websocket_para.send('{"F_AudioRX":"' + SDR_RX.Audio_RX + '"}'); //Requested by Gpredict
    GPredictRXcount++;
    if (GPredictRXcount > 10 || GPredictRXcount <= 0)
        $("#RXgpredict").css("visibility", "hidden"); //No Frequency order received fron Gpredict
}
function choix_GainRX() { //Gains for RX SDR
    if (web_socket.para_on && web_socket.spectre_in) {
        websocket_para.send('{"Gain_RF":"' + Gain_RX.RF + '"}');
        if (SDR_RX.sdr == "hackrf") {
            websocket_para.send('{"Gain_IF":"' + Gain_RX.IF + '"}');
            websocket_para.send('{"Gain_BB":"' + Gain_RX.BB + '"}');
        }
    }
    $("#bloc_GIB").css("display", SDR_RX.sdr == "hackrf" ? "block" : "none");
    var Vgrf = Gain_RX.RF;
    if (SDR_RX.sdr == "hackrf") {
        Vgrf = Vgrf < 5 ? "A" : "B"; // 2 gains only for HackRF
    } else {
        Vgrf = Vgrf + "dB";
    }
    $("#GRFRX").html(Vgrf);
    $("#GIFRX").html(Gain_RX.IF);
    $("#GBBRX").html(Gain_RX.BB);
    Save_Gains();
}
// GPIO Set to switch any device On the Orange Pi/Raspberry Pi managing the receiver. Refer to configurationRX.js file
function Set_RX_GPIO() {
    var s = "";
    var v = "";
    for (var i = 0; i < RX_GPIO.length; i++) {
        if (SDR_RX.FrRX >= RX_GPIO[i][0] && SDR_RX.FrRX <= RX_GPIO[i][1] && (!audioTX.Transmit && RX_GPIO[i][4] || audioTX.Transmit && RX_GPIO[i][5])) {
            s += v + RX_GPIO[i][2] + "," + RX_GPIO[i][3];
            v = "*";
        }
    }
    if (s != "" && RX_GPIO_state != s) {
        var adresse = "http://" + SDR_RX.IP + "/cgi-bin/SetGPIO.sh?" + s;
        var setgpio = '<iframe src="' + adresse + '" ></iframe>'
            console.log(Date.now()-T0_remsdr,"Set RX GPIO");
        $("#RX_GPIO").html(setgpio);
        RX_GPIO_state = s;
    }
}
// Initialisation RX
// *****************
function Init_Page_RX() {
    console.log(Date.now()-T0_remsdr,"Init_Page_RX()");
    Recall_Gains();
    // Init Tracking eventuel des beacons pour compenser les offsets
    setInterval("Track_Beacon();", 1000);
    setInterval("WatchDog();", 900);
    setInterval("update_freq_RX_Audio();", 600); //Requested by Gpredict to compensate the Doppler
	setInterval("Refresh_Freq_Fine();", 115);
    choix_mode();
    Save_RX_Para();
}
function Recall_RX_Para() {
    if (Local_Storage) { // On a d'anciens parametres en local
        SDR_RX = JSON.parse(localStorage.getItem("SDR_RX"));
        $("#Auto_Offset_On").prop("checked", SDR_RX.auto_offset);
        $("#" + SDR_RX.sdr).prop("checked", true);
        var Old_RX_Xtal_Errors = JSON.parse(localStorage.getItem("RX_Xtal_Errors"));
        var idx_min = Math.min(Old_RX_Xtal_Errors.length, RX_Xtal_Errors.length);
        for (var i = 0; i < idx_min; i++) {
            RX_Xtal_Errors[i] = Old_RX_Xtal_Errors[i];
        }
        $("#" + RX_modes[SDR_RX.mode][0]).prop("checked", true);
    }
}
function Save_RX_Para() {
    SDR_RX.auto_offset = $("#Auto_Offset_On").prop("checked");
    if (SDR_RX.IP.length < 4)
        SDR_RX.IP = "*"; //Case TX only, no RX
    localStorage.setItem("SDR_RX", JSON.stringify(SDR_RX));
    localStorage.setItem("RX_Xtal_Errors", JSON.stringify(RX_Xtal_Errors));
}
function Recall_Gains() {
    if (Local_Storage) {
        Gain_RX = JSON.parse(localStorage.getItem("Gains_RX"));
    }
}
function Save_Gains() {
    localStorage.setItem("Gains_RX", JSON.stringify(Gain_RX));
}
function Track_Beacon() {
    var coul = "grey";
    SDR_RX.auto_offset = $("#Auto_Offset_On").prop("checked");
    Watch_dog.Last_Refresh++;
    if (web_socket.para_on && web_socket.spectre_in) {
        if (balise.voie_recu && SDR_RX.auto_offset) { //On s'assure d'avoir reçu des données recemment
            var Ecart = 0;
            var Nb_valide = 0;
            coul = "Orange";
            for (var i = 0; i < balise.nb; i++) {
                for (var v = -1; v <= 1; v++) {
                    balise.Voies[i][v + 1] = 0.1 * Beam.Mean[balise.Idx[i] + v] + 0.9 * balise.Voies[i][v + 1]; //Integration longue niveau voie
                }
                //Recherche grossière de la voie la plus forte
                var Max = -1000000;
                var K = 0;
                for (var j = balise.Idx_zone[i][0]; j <= balise.Idx_zone[i][1]; j++) {
                    if (Beam.Mean[j] > Max) {
                        Max = Beam.Mean[j];
                        K = j;
                    }
                }
                var alpha = 0.02; //RC filter
                if (Math.abs(balise.Idx[i] - K) <= 1) { //voie centrale, gauche ou droite
                    if (balise.Voies[i][1] > 100) { //Niveau voie centrale suffisant
                        var Vg = Math.pow(10, balise.Voies[i][0] / 10000); //On quitte les log
                        var Vc = Math.pow(10, balise.Voies[i][1] / 10000);
                        var Vd = Math.pow(10, balise.Voies[i][2] / 10000);
                        Ecart += (Vg * balise.K[i][0] + Vc * balise.K[i][1] + Vd * balise.K[i][2]) / Vc; //Ecart normalisé
                        Nb_valide++;
                        coul = "Lime";
                    }
                } else {
                    if (Max > 100) { //Niveau voie suffisant
                        alpha = 0.2;
                        var big_step = 2 * Math.abs(balise.Idx[i] - K) / (balise.Idx_zone[i][1] - balise.Idx_zone[i][0])
                            if (K < balise.Idx[i]) {
                                Ecart +=  - big_step //0.1; // On force un saut de 100Hz
                            } else {
                                Ecart += big_step;
                            }
                            Nb_valide++;
                        coul = "LightSeaGreen";
                    }
                }
            }
            if (Nb_valide > 0) { // On a des ecarts par rapport aux balises
                var dF = 300 * Ecart / Nb_valide; //Coef de decalage en frequence
                balise.meanDelta = alpha * dF + (1 - alpha) * balise.meanDelta; //Fitre decalage
                dF = Math.floor(balise.meanDelta);
                if (dF != 0) {
                    RX_Xtal_Errors[SDR_RX.bandeRX] += dF;
                    SDR_RX.Xtal_Error = RX_Xtal_Errors[SDR_RX.bandeRX];
                    choix_freq_central();
                }
                $("#F_df").html(dF + " Hz");
            }
        } else {
            $("#F_df").html("");
        }
        if (Watch_dog.Last_Refresh > 5) {
            choix_freq_central(); //On rafraichi
        }
    }
    balise.voie_recu = false;
    $("#F_Offset_locked").css("background-color", coul);
}
//Watchdog Data Exchanges and timer_info
//**************************************
function WatchDog() {
    if (SDR_RX.IP.length > 3) {
        Watch_dog.RXpara++;
        Watch_dog.RXspectre = Watch_dog.RXspectre + 3;
        if (audioRX.on)
            Watch_dog.RXaudio++;
        if (Math.max(Watch_dog.RXpara, Watch_dog.RXspectre, Watch_dog.RXaudio) > 7)
            $("#RXonLed").css("background-color", "Red"); //Alerte messages n'arrivent pas
    }
    if (SDR_TX.IP.length > 3) {
        Watch_dog.TXpara++;
        if (Watch_dog.TXpara > 8 && tx_python_gnuradio_script != "tx_stop") {
            $("#TXonLed").css("background-color", "Red");
            console.log("Watchdog: TX return messages not received");
        } //Alerte messages n'arrivent pas
    }
    if (timer_info > 0) {
        timer_info--;
    } else {
        $("#fen_squelch").css("display", "none");
        $("#Relays_info").css("display", "none");
    }
    if (timer_auto_relay > 0) {
        timer_auto_relay--;
    } else {
        Test_si_relais_TX();
    }
    timer_refresh_TXfreq--;
    if (timer_refresh_TXfreq <= 0) {
        timer_refresh_TXfreq = 5;
        freq_TX();
    }
    Watch_dog.Omnirig--;
    if (Watch_dog.Omnirig > 0) {
        var V = "visible";
    } else {
        var V = "hidden";
    }
    $("#Omnirig").css("visibility", V);
}
console.log("End loading remote_RX.js");
