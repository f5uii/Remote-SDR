// ***********************************
// *           REMOTE SDR            *
// *              F1ATB              *
// * GNU General Public Licence v3.0 *
// ***********************************
//Variables Transmitter
var SDR_TX = {
    Freq: 145100000,
    GainRF: 50,
    GainIF: 50,
    GainBB: 40,
    Xtal_Error: 0,
    Bande: 0,
    Fmin: 0,
    Fmax: 0,
    Decal_RX: 0,
    IP: "",
    relay_auto: false,
    invert: false,
    TXeqRX: false,
    sdr: "",
    Fduplex: true
};
var tx_python_gnuradio_script = "";
var recal_auto_relay = -1;
var timer_auto_relay = 0;
var timer_refresh_TXfreq = 0;
var timer_AutoCorrect;
var TX_GPIO_state = "";
var last_TX_Freq = {
    time_: 0,
    wait_: false
};
var TX_Xtal_Errors = new Array(); //Errors Xtal frequency
var TXconverter = {
    fixed_offset: 0,
    invSpectra: false
};
var audioParaTX = {
    Compresse: 1,
    VolMic: 1,
    VolAux: 0,
    In_aux: 0
};
//Variables CW
var CW = {
    state: false,
    levelRC: 0,
    alpha: 1 / 20,
    out_phase: 0,
    display: false,
    spot: false,
    lastT: 0
}
// Variables websockets
var websocket = {
    audioTX: null,
    paraTX: null,
    audioTXpret: false,
    paraTXpret: false
};
//Gpredict
var GPredictTXcount = 0;
//Table for CTCSS  channels
var CTCSS = {
    freq: 0,
    channels: []
};
CTCSS.channels = [0, 67, 71.9, 74.4, 77, 79.7, 82.5, 85.4, 88.5, 91.5, 94.8, 97.4, 100, 103.5, 107.2, 110.9, 114.8, 118.8, 123, 127.3, 131.8, 136.5, 141.3, 146.2, 151.4, 156.7, 162.2, 167.9, 173.8, 179.9, 186.2, 192.8, 203.5, 210.7, 218.1, 225.7, 233.6, 241.8, 250.3]
//Websocket Para
//***************
function Lance_websocket_paraTX() {
    //Initialisation du websocket_spectre
    // serveur de test public
    console.log(Date.now()-T0_remsdr,"TX parameters socket setting");
    Watch_dog.TXpara = 0;
    var adresse = "ws://" + Host_IP.TX + ":" + (parseInt(SDR_RX.port_audio) + 3).toString() + "/"; //Basic Port number +3 for the parameters
    websocket.paraTX = new WebSocket(adresse);
    $("#TX_para_set").css("background-color", "LightGreen");
    $("#TXonLed").css("background-color", "Red");
    // code à déclencher quand le connexion est ouverte
    websocket.paraTX.onopen = function (evt) {
        $("#TX_para_con").css("background-color", "LightGreen");
        $("#TXonLed").css("background-color", "Orange");
        websocket.paraTXpret = true;
        console.log(Date.now()-T0_remsdr,"TX parameters socket open")
        setTimeout("init_para_sdrTX();", 3000); //  On ne peut pas envoyer immediatement deriere l'ouverture du websocket
    };
    // code à déclencher si le serveur nous envoie spontanément
    // un message
    websocket.paraTX.onmessage = function (evt) {
        // The server send messages
        //write('The server send (' + evt.data + ')');
        $("#TXonLed").css("background-color", "LightGreen");
        Watch_dog.TXpara = 0;
        if (evt.data.indexOf("F_Gpredict=") == 0) {
            var TF = evt.data.split("=");
            var F_Gpredict = parseInt(TF[1]);
            GPredictTXcount = Math.min(GPredictTXcount, 0);
            var V = "hidden";
            if (GPredictTXcount >= 0) { //Take into account Freq doppler correction from Gpredict
                SDR_TX.Freq = F_Gpredict;
                freq_TX();
                Affich_freq_champs(SDR_TX.Freq, "#FRT");
                Affich_Curs_TX();
                V = "visible"
            }
            $("#TXgpredict").css("visibility", V);
        }
    };
    // en cas d'erreur
    websocket.paraTX.onerror = function (evt) {
        console.log(evt);
    };
}
function init_para_sdrTX() {
	console.log(Date.now()-T0_remsdr,"TX parameters init");
    TXeqRX();
    Mode_TX();
    recal_auto_relay = -1;
    Test_si_relais_TX();
    freq_TX();
    GainRF_TX();
    GainIF_TX();
    GainBB_TX();
}
function choixBandeTX() { //Suivant freq TX defini les limites
    for (var i = 0; i < BandesTX.length; i++) {
        if (BandesTX[i][0] <= SDR_TX.Freq && BandesTX[i][1] >= SDR_TX.Freq) {
            SDR_TX.Bande = i;
            SDR_TX.Fmin = BandesTX[i][0];
            SDR_TX.Fmax = BandesTX[i][1];
            SDR_TX.Decal_RX = BandesTX[i][3];
            SDR_TX.Xtal_Error = TX_Xtal_Errors[i];
        }
    }
    Affich_freq_champs(SDR_TX.Freq, "#FRT");
    Affich_freq_champs(SDR_TX.Xtal_Error, "#OFT");
    TXconverter.fixed_offset = 0;
    for (var i = 0; i < TX_FixedOffset.length; i++) {
        if (SDR_TX.Freq > TX_FixedOffset[i][0] && SDR_TX.Freq < TX_FixedOffset[i][1]) {
            TXconverter.fixed_offset = TX_FixedOffset[i][2];
        }
    }
    freq_TX();
    Trace_EchelleTX();
    ListRelay();
    Set_TX_GPIO();
}
function newBandTX(t) {
    Transmit_On_Off(false); // Stop any transmission
    GPredictTXcount = -6;
    SDR_TX.Freq = Math.floor((BandesTX[t.value][0] + BandesTX[t.value][1]) / 2);
    choixBandeTX();
    $("#slider_Fr_TX").slider("option", "min", SDR_TX.Fmin);
    $("#slider_Fr_TX").slider("option", "max", SDR_TX.Fmax);
    $("#slider_Fr_TX").slider("option", "value", SDR_TX.Freq);
    TXeqRX();
}
// PARAMETERS TO PASS TO SDR
//***************************
function freq_TX() {
    SDR_TX.Freq = Math.floor(SDR_TX.Freq);
    if (SDR_TX.Freq > SDR_TX.Fmin && SDR_TX.Freq < SDR_TX.Fmax) { //Frequence autorisée
        var Fcorrige = SDR_TX.Freq + SDR_TX.Xtal_Error + TXconverter.fixed_offset;
        TXconverter.invSpectra = (Fcorrige < 0) ? true : false;
        Fcorrige = Math.abs(Math.floor(Fcorrige));
        var now_ = Date.now();
        if (websocket.paraTXpret && (now_ - last_TX_Freq.time_) > 200) { // To avoid to overload TX SDR (SA818)
            websocket.paraTX.send('{"Fr_TX":"' + Fcorrige + '"}'); //Frequency send to SDR corrected with any TCXO error and fixed offset due to upconverter
            $("#TXonLed").css("background-color", "Blue");
            last_TX_Freq.wait_ = false;
            last_TX_Freq.time_ = now_;
            Affich_freq_champs(Fcorrige, "#SDT");
        } else {
            if (!last_TX_Freq.wait_) {
                last_TX_Freq.wait_ = true;
                setTimeout(freq_TX(), 200);
            }
        }
        $("#val_Fr_TX").css("background-color", "#555");
    } else {
        $("#val_Fr_TX").css("background-color", "#F00");
    }
    Affich_Curs_TX();
    if (ZoomFreq.id == "FRT")
        Affich_freq_champs(SDR_TX.Freq, "#ZFr"); //Zoom display
    Save_TX_Para();
}
function update_freq_TX_Audio() {
    if (websocket.paraTXpret)
        websocket.paraTX.send('{"F_AudioTX":"' + SDR_TX.Freq + '"}'); //Requested by Gpredict
    GPredictTXcount++;
    if (GPredictTXcount > 10 || GPredictTXcount <= 0)
        $("#TXgpredict").css("visibility", "hidden"); //No Frequency order received fron Gpredict
}
function display_GTX(t) {
    if (t) {
        $("#fen_GainsTX").css({
            "height": "auto",
            "overflow": "auto",
            "padding": "6px",
            "background-color": "#88f"
        });
        $("#titre_fen_GTX").css("display", "block");
        $("#fleche_GTX").css("display", "none");
        $("#bloc_GIF").css("margin", "6px");
    } else {
        var hei = "80%";
        if (!ecran.large) {
            hei = "30%";
        }
        $("#fen_GainsTX").css({
            "height": hei,
            "overflow": "hidden",
            "padding": "0px",
            "background-color": "#88f"
        });
        $("#fleche_GTX").css("display", "block");
        $("#titre_fen_GTX").css("display", "none");
        $("#bloc_GIF").css("margin", "0px");
    }
    $("#bloc_GRF").css("display", SDR_TX.sdr == "TXpluto" ? "none" : "block");
    $("#fen_GainsTX").css("display", SDR_TX.sdr == "TXsa818" ? "none" : "block");
}
function GainRF_TX() {
    if (websocket.paraTXpret)
        websocket.paraTX.send('{"GRF_TX":"' + SDR_TX.GainRF + '"}'); //Gain RF
}
function GainIF_TX() {
    if (audioTX.Transmit) {
        if (websocket.paraTXpret)
            websocket.paraTX.send('{"GIF_TX":"' + SDR_TX.GainIF + '"}'); //Gain IF. // Attention we can have a delay up to 1.2s to pass the level to SDR Pluto
    } else {
        if (websocket.paraTXpret)
            websocket.paraTX.send('{"GIF_TX":"0"}'); //Gain IF a zero pour stopper puissance
    }
}
function CTCSS_SA818(channel) {
    if (websocket.paraTXpret)
        websocket.paraTX.send('{"CTCSS_TX":"' + channel + '"}');
}
function GainBB_TX() {
    //	if (websocket.paraTXpret) websocket.paraTX.send( '{"GBB_TX":"' + SDR_TX.GainBB+'"}'); //Osmocom parameter Gain BB not used with HackRF and Pluto
}
function Mode_TX() {
    Watch_dog.TXpara = 0;
    SDR_RX.mode = $("input[name='mode']:checked").val();
    var choix_python_script = "tx_stop";
    if ((SDR_RX.mode < 2 || SDR_RX.mode == 3 || SDR_RX.mode > 4) && SDR_TX.sdr == "TXhackrf")
        choix_python_script = "hack_tx_ssbnbfm_v3.py";
    if ((SDR_RX.mode < 2 || SDR_RX.mode == 3 || SDR_RX.mode > 4) && SDR_TX.sdr == "TXpluto")
        choix_python_script = "pluto_tx_ssbnbfm_v3.py";
    if (SDR_RX.mode == 3 && SDR_TX.sdr == "TXsa818")
        choix_python_script = "sa818_tx_nbfm_v3.py";
    if (SDR_RX.mode > 4) { // CW
        $("#para_TX_CW").css("display", "block");
        $("#para_TX_SSB_FM").css("display", "none");
    } else {
        $("#para_TX_CW").css("display", "none");
        $("#para_TX_SSB_FM").css("display", "block");
    }
    if (choix_python_script != tx_python_gnuradio_script && SDR_TX.IP.length > 3) {
        Transmit_On_Off(false); //Transmit Off
        $("#start-audioTX").html("TX Audio Off");
        $("#start-audioTX").removeClass('bt_on').addClass('bt_off');
        if (websocket.audioTXpret) {
            websocket.audioTX.close();
            websocket.audioTXpret = false;
        }
        if (websocket.paraTXpret) {
            websocket.paraTX.close();
            websocket.paraTXpret = false;
        }
        tx_python_gnuradio_script = choix_python_script;
        console.log(Date.now()-T0_remsdr,'TX Start New Mode +TX+TX+TX+TX+TX+');
        $("#TXonLed").css("background-color", "Grey");
        if (SDR_TX.IP.length > 3) {
            var adresse = "http://" + SDR_TX.IP + "/cgi-bin/SelectRadio.py";
            var fct = "console.log('TX stopped');"; // TX Stop
            if (tx_python_gnuradio_script != "tx_stop") {
                $("#TXonLed").css("background-color", "DarkSlateGray");
                var delay = 100; //100ms
                if (SDR_RX.sdr == "pluto" && SDR_TX.sdr == "TXpluto")
                    delay = 2500; //2500ms RX pluto and TX pluto cannot be launched simultaneously
                fct = fct + "setTimeout('choix_new_modulation_TX();'," + delay + ");" //Pour laisser le temps arret radio en cours
            }
            var loader = '<iframe src="' + adresse + '?tx_stop" onload="' + fct + '"></iframe>'
                $("#TX_loader").html(loader);
        }
    }
    choice_TX_Source()
    Mode_LSB_NBFM_USB_CW();
    TX_init = true;
}
var sauve_para_RX = false;
function choix_new_modulation_TX() {
    console.log(Date.now()-T0_remsdr,"TX launch : gnuradio script = " + tx_python_gnuradio_script)
    sauve_para_RX = web_socket.para_on;
    web_socket.para_on = false; //To stop exchange with RX when TX is loaded . It's for the Pluto
    var fct = "setTimeout('TX_Sockets_launcher();', 3500);";
    var adresse = "http://" + SDR_TX.IP + "/cgi-bin/SelectRadio.py"
        var loader = '<iframe src="' + adresse + '?' + tx_python_gnuradio_script + '" onload="' + fct + '"></iframe>'
        $("#TX_loader").html(loader);
}
function TX_Sockets_launcher() {
    if (sauve_para_RX)
        web_socket.para_on = sauve_para_RX;
    console.log(Date.now()-T0_remsdr,"TX launched : gnuradio script = " + tx_python_gnuradio_script)
    Lance_websocket_paraTX();
}
// GPIO Set to switch any device On the Orange Pi managing the Transmitter. Refer to configurationTX.js file. Not necessary for RPI4
function Set_TX_GPIO() {
    var s = "";
    var v = "";
    for (var i = 0; i < TX_GPIO.length; i++) {
        if (SDR_TX.Freq >= TX_GPIO[i][0] && SDR_TX.Freq <= TX_GPIO[i][1] && (!audioTX.Transmit && TX_GPIO[i][4] || audioTX.Transmit && TX_GPIO[i][5])) {
            s += v + TX_GPIO[i][2] + "," + TX_GPIO[i][3];
            v = "*";
        }
    }
    if (s != "" && TX_GPIO_state != s) {
        var adresse = "http://" + SDR_TX.IP + "/cgi-bin/SetGPIO.sh?" + s;
        var setgpio = '<iframe src="' + adresse + '" ></iframe>'
            console.log(Date.now()-T0_remsdr,"Set TX GPIO");
        $("#TX_GPIO").html(setgpio);
        TX_GPIO_state = s;
    }
}
//RESIZE
//**********
function window_resize_TX() {
    var W = $("#echelleTX").innerWidth();
    var H = $("#echelleTX").innerHeight();
    $("#echelleTX").html('<canvas id="myEchelleTX" width="' + W + '" height="' + H + '" ></canvas><div id="TXFSDR">SDR Freq.: <div id="TXfreqSDR"></div></div><div id="curseurTX"></div>');
    Trace_EchelleTX();
    Init_champs_freq("SDT", "#TXfreqSDR");
    Affich_freq_champs(SDR_TX.Freq, "#FRT");
    var W = $("#visus_TX").innerWidth() / 2;
    var H = $("#visus_TX").innerHeight();
    $("#visus_TXt").html('<canvas id="canvasT" width="' + W + '" height="' + H + '" ></canvas>');
    $("#visus_TXf").html('<canvas id="canvasF" width="' + W + '" height="' + H + '" ></canvas>');
    Affich_Curs_TX();
    display_GTX(false);
}
function Init_Page_TX() {
    console.log(Date.now()-T0_remsdr,"Init_Page_TX()");
    window_resize_TX();
    var S = '<label for="bandSelect">Select frequency band:</label>';
    S += '<select name="bandSelect" id="bandSelect" onchange="newBandTX(this);">';
    for (var i = 0; i < BandesTX.length; i++) {
        S += '<option value=' + i + '>' + BandesTX[i][2] + '</option>';
        TX_Xtal_Errors[i] = 0;
    }
    S += '</select>';
    $("#BandeTX").html(S);
    Recall_ParaTX();
    Init_champs_freq("FRT", "#val_Fr_TX");
    Init_champs_freq("OFT", "#val_Of_TX");
    choixBandeTX();
    $("#BandeTX option[value='" + SDR_TX.Bande + "']").prop('selected', true);
    Init_Sliders_TX();
    Init_Sliders_TX_Audio();
    Affich_freq_champs(SDR_TX.Freq, "#FRT");
    Affich_freq_champs(SDR_TX.Xtal_Error, "#OFT");
    for (var i = 1; i < 13; i++) {
        $('#FRT' + i).on('mousewheel', function (event) {
            Mouse_Freq_TX(event)
        });
        $('#OFT' + i).on('mousewheel', function (event) {
            Mouse_deltaOffsetTX(event)
        });
        $('#FRT' + i).on('click', function (event) {
            OpenZoomFreq(event)
        }); //see remote_sdr.js
        $('#OFT' + i).on('click', function (event) {
            OpenZoomFreq(event)
        });
    }
    Affich_Curs_TX();
    ValideIP();
    disp_CPU(SDR_TX.IP, "TX_CPU");
    display_GTX(false);
    Mode_TX();
    setInterval("update_freq_TX_Audio();", 700); //Requested by Gpredict to compensate the Doppler
    //First local storage of parameters
    if (!Local_Storage) {
        Save_SDR_Para();
        Save_visus();
        Save_RX_Para();
        Save_Gains();
        Save_TX_Para();
    }

}
function ListRelay() {
    //Relays list
    var S = '<label for="relay">Relays :</label>';
    S += '<select name="relay" id="relay" onchange="ForceRelay(this.value);" onclick="ForceRelay(this.value);">';
    for (var i = 0; i < RelayTX.length; i++) {
        if (SDR_RX.BandeRXmin <= RelayTX[i][0] && SDR_RX.BandeRXmax >= RelayTX[i][0]) {
            RelayTX[i][4] = true; //on valide ce relais
            S += '<option value=' + i + '>' + RelayTX[i][3] + '</option>';
        } else {
            RelayTX[i][4] = false;
        }
    }
    S += '<option value=' + RelayTX.length + ' selected></option>';
    S += '</select>';
    $("#Relays").html(S);
}
function ForceRelay(v) {
    var S = "";
    $("#Relays_info").css("display", "none");
    if (v < RelayTX.length) {
        S = "<div>Frequency : " + RelayTX[v][0] + " Hz</div>";
        S += "<div>TX Shift : " + RelayTX[v][1] + " Hz</div>";
        CTCSS.freq = 0;
        if (RelayTX[v][2] > 0) {
            CTCSS.freq = RelayTX[v][2];
            console.log("CTCSS.freq", CTCSS.freq)
            S += "<div>CTCSS : " + CTCSS.freq + " Hz</div>";
            if (SDR_TX.sdr == "TXsa818") {
                //SA818 reject frequencies below 300Hz. CTCSS generated directly by SA818
                for (var i = 0; i < CTCSS.channels.length; i++) {
                    if (CTCSS.channels[i] == CTCSS.freq)
                        CTCSS_SA818(i); //SA818 request a channel instead a frequency
                }
            }
        }
        choice_TX_Source();
        $("#Relays_info").css("display", "block");
        var deltaF = RelayTX[v][0] - SDR_RX.Audio_RX
            Recal_fine_centrale(deltaF);
        SDR_TX.Freq = RelayTX[v][0] + RelayTX[v][1];
        var Fr = SDR_RX.fine + SDR_TX.Decal_RX + SDR_RX.centrale_RX; // Freq RX = Freq TX
        if (Fr != SDR_TX.Freq) {
            SDR_TX.TXeqRX = false;
            $("#txeqrx").prop("checked", SDR_TX.TXeqRX);
            TXeqRX();
        }
        freq_TX();
        Affich_Curs_TX();
        Affich_freq_champs(SDR_TX.Freq, "#FRT");
        $("#slider_Fr_TX").slider('value', SDR_TX.Freq);
    }
    $("#Relays_info").html(S);
    timer_info = 2;
}
function AutoRelay() {
    SDR_TX.relay_auto = $("#relay_auto").prop("checked");
    Save_TX_Para();
}
function Mode_LSB_NBFM_USB_CW() {
    var Invert = SDR_TX.invert;
    var M = 0; // NBFM
    //The TX needs -1 or 1 for LSB / USB and 0 for NBFM
    if (SDR_RX.mode == 0)
        M = -1; //Mode TX = Mode RX = LSB
    if (SDR_RX.mode == 1)
        M = 1; //Mode TX = Mode RX = USB
    if (TXconverter.invSpectra)
        !Invert;
    if (Invert)
        M = -1 * M; // Inversion LSB / USB in case of inverted transponder
    if (SDR_RX.mode == 5 || SDR_RX.mode == 6)
        M = 2; //Mode TX = CW
    if (websocket.paraTXpret)
        websocket.paraTX.send('{"LSB_NBFM_USB_CW" :"' + M + '"}'); //-1 ou +1
    Save_TX_Para();
    $("#AutoCorect").css("visibility", M == 0 || !SDR_TX.TXeqRX || !audioTX.Transmit || audioTX.Mic_or_Aux ==1 ? "hidden" : "visible");
}
function TXeqRX() {
    SDR_TX.TXeqRX = $("#txeqrx").prop("checked");
    Mode_LSB_NBFM_USB_CW();
    if (SDR_TX.TXeqRX)
        rxvtx();
    $("#TX_RX").css("display", SDR_TX.TXeqRX ? "none" : "block");
}
function Duplex() {
    SDR_TX.Fduplex = $("#full_duplex").prop("checked");
    Save_TX_Para();
}
function Test_si_relais_TX() {
    var its_a_relay = -1;
    for (var i = 0; i < RelayTX.length; i++) {
        if (RelayTX[i][4]) { //Relays in the band
            if (Math.abs(RelayTX[i][0] - SDR_RX.Audio_RX) < 2000) {
                its_a_relay = i;
            }
        }
    }

    if (its_a_relay == -1)
        CTCSS.freq = 0;
    if (SDR_TX.relay_auto) {
        if (its_a_relay != -1 && recal_auto_relay != its_a_relay) {
            ForceRelay(its_a_relay); //To force freq only once.
            $("#Relays_info").css("display", "none");
            $("#relay").val(its_a_relay);
        }
        if (its_a_relay == -1 && recal_auto_relay >= 0) {
            $("#relay").val(RelayTX.length); //We leave the relay
        }
        recal_auto_relay = its_a_relay;
    }

    if (SDR_TX.sdr == "TXsa818" && CTCSS.freq == 0)
        CTCSS_SA818(0);
}
function AutoCorTX(x) {
    audioTX.AutoCorrection = x;
    choice_TX_Source();
    if (x) {
        timer_AutoCorrect = setInterval("AutoRecal();", 1000);
    } else {
        clearInterval(timer_AutoCorrect);
    }

}
function AutoRecal() { // TX freq steers to RX freq
    if (F_Audio_Top > 0) {
        let deltaF = Math.floor((800 - F_Audio_Top) / 3);
        var Invert = SDR_TX.invert;
        if (SDR_RX.mode == 0 || SDR_RX.mode == 5) //LSB
            deltaF = -deltaF;
        if (Invert)
            deltaF = -deltaF; // Inversion LSB / USB in case of inverted transponder
        Recal_OFT(deltaF)
    }
}
function Mouse_Freq_TX(ev) { //modif des digits
    ZoomFreq.col = parseInt(ev.target.id.substr(3)) - 1;
    var deltaF = ev.deltaY * Math.pow(10, ZoomFreq.col);
    Recal_FTX(deltaF);
    GPredictTXcount = -6;
}
function Recal_FTX(deltaF) {
    SDR_TX.Freq = SDR_TX.Freq + deltaF;
    Affich_freq_champs(SDR_TX.Freq, "#FRT");
    freq_TX();
    Affich_Curs_TX();
    if (SDR_TX.TXeqRX)
        txvrx();
    GPredictTXcount = -6;
}
function Mouse_deltaOffsetTX(ev) {
    ZoomFreq.col = parseInt(ev.target.id.substr(3)) - 1;
    var deltaF = ev.deltaY * Math.pow(10, ZoomFreq.col);
    Recal_OFT(deltaF);
    GPredictTXcount = -6;
}
function Recal_OFT(deltaF) {
    SDR_TX.Xtal_Error = SDR_TX.Xtal_Error + deltaF;
    TX_Xtal_Errors[SDR_TX.Bande] = SDR_TX.Xtal_Error;
    Affich_freq_champs(SDR_TX.Xtal_Error, "#OFT");
    if (ZoomFreq.id == "OFT")
        Affich_freq_champs(SDR_TX.Xtal_Error, "#ZFr"); //Zoom display
    freq_TX();
    Affich_Curs_TX();
}
function txvrx() { //Frequence TX envoyé au RX
    SDR_RX.fine = SDR_TX.Freq - SDR_TX.Decal_RX - SDR_RX.centrale_RX - SDR_RX.CW_shiftRXTX;
    choix_freq_fine();
    Affiche_Curseur();
}
function rxvtx() {
    SDR_TX.Freq = SDR_RX.fine + SDR_TX.Decal_RX + SDR_RX.centrale_RX + SDR_RX.CW_shiftRXTX;
    freq_TX();
    Affich_Curs_TX();
    Affich_freq_champs(SDR_TX.Freq, "#FRT");
    $("#slider_Fr_TX").slider('value', SDR_TX.Freq);
    timer_refresh_TXfreq = 1;
}
//AFFICHAGES
function Affich_Curs_TX() {
    var W = $("#echelleTX").innerWidth();
    var X = (SDR_TX.Freq - SDR_TX.Fmin) * W / (SDR_TX.Fmax - SDR_TX.Fmin);
    $("#curseurTX").css("left", X);
    //Curseur TX dans la zone RX
    var F = SDR_TX.Freq - SDR_TX.Decal_RX - SDR_RX.centrale_RX;
    var p = ecran.innerW * (0.5 + F / (SDR_RX.bande)) + ecran.border;
    $("#Curseur_TX").css("left", p);
}
//TRACE DES CANVAS
function Trace_EchelleTX() {
    var canvasEchelle = document.getElementById("myEchelleTX");
    var ctxE = canvasEchelle.getContext("2d");
    var W = $("#echelleTX").innerWidth();
    var H = $("#echelleTX").innerHeight();
    var band = SDR_TX.Fmax - SDR_TX.Fmin;
    ctxE.beginPath();
    ctxE.strokeStyle = "#FFFFFF";
    ctxE.fillStyle = "#FFFFFF";
    ctxE.lineWidth = 1;
    ctxE.clearRect(0, 0, W, H);
    ctxE.font = "9px Arial";
    var DF = 100000;
    var df = 50000;
    if (band > 500000) {
        DF = 500000;
        df = 100000;
    }
    if (band > 5000000) {
        DF = 1000000;
        df = 200000;
    }
    if (band > 10000000) {
        DF = 10000000;
        df = 2000000;
    }
    for (var f = SDR_TX.Fmin; f <= SDR_TX.Fmax; f = f + df) {
        var Fint = df * Math.floor(f / df);
        var X = (Fint - SDR_TX.Fmin) * W / band;
        ctxE.moveTo(X, 0);
        var Y = 4;
        var Fintk = Fint / 1000;
        if (Fint % DF == 0) {
            ctxE.fillText(Fintk, X - ctxE.measureText(Fintk).width / 2, 14);
            Y = 6;
        }
        ctxE.lineTo(X, Y); //traits
    }
    ctxE.stroke(); // Fin graduations
    //Ecriture Labels
    ctxE.beginPath();
    ctxE.font = "8px Arial";
    ctxE.strokeStyle = "#AAF";
    ctxE.fillStyle = "#AAF";
    for (var i = 0; i < LabelTX.length; i++) {
        if (LabelTX[i][0] >= SDR_TX.Fmin && LabelTX[i][0] <= SDR_TX.Fmax) {
            var X = (LabelTX[i][0] - SDR_TX.Fmin) * W / band;
            ctxE.moveTo(X, 17);
            ctxE.fillText(LabelTX[i][1], X + 5, 22);
            ctxE.lineTo(X, 23); //traits
        }
    }
    ctxE.stroke(); // Fin labels
    //Ecriture bande en couleur
    ctxE.lineWidth = 2;
    for (var i = 0; i < ZoneTX.length; i++) {
        if ((ZoneTX[i][0] >= SDR_TX.Fmin && ZoneTX[i][0] <= SDR_TX.Fmax) || (ZoneTX[i][1] >= SDR_TX.Fmin && ZoneTX[i][1] <= SDR_TX.Fmax)) {
            ctxE.beginPath();
            ctxE.strokeStyle = ZoneTX[i][2];
            var X0 = (ZoneTX[i][0] - SDR_TX.Fmin) * W / band;
            var X1 = (ZoneTX[i][1] - SDR_TX.Fmin) * W / band;
            ctxE.moveTo(X0, 0);
            ctxE.lineTo(X1, 0); //traits
            ctxE.stroke();
        }
    }
}
function Init_Sliders_TX() {
    $(function () {
        $("#slider_Fr_TX").slider({
            value: SDR_TX.Freq,
            min: SDR_TX.Fmin,
            max: SDR_TX.Fmax,
            step: 10,
            slide: function (event, ui) {
                SDR_TX.Freq = ui.value;
                Affich_freq_champs(SDR_TX.Freq, "#FRT");
                freq_TX();
                timer_refresh_TXfreq = 1;
                GPredictTXcount = -6;
                if (SDR_TX.TXeqRX)
                    txvrx();
                Save_TX_Para();
            }
        });
    });
    $(function () {
        $("#slider_GRF_TX").slider({
            value: SDR_TX.GainRF,
            min: 0,
            max: 10,
            step: 10,
            slide: function (event, ui) {
                SDR_TX.GainRF = ui.value;
                $("#val_GRF_TX").html(SDR_TX.GainRF < 5 ? "A" : "B");
                GainRF_TX();
                Save_TX_Para();
            }
        });
    });
    $("#val_GRF_TX").html(SDR_TX.GainRF < 5 ? "A" : "B");
    $(function () {
        $("#slider_GIF_TX").slider({
            value: SDR_TX.GainIF,
            min: 0,
            max: 50,
            step: 1,
            slide: function (event, ui) {
                SDR_TX.GainIF = ui.value;
                $("#val_GIF_TX").html(ui.value);
                GainIF_TX();
                Save_TX_Para();
            }
        });
    });
    $("#val_GIF_TX").html(SDR_TX.GainIF);
    $(function () {
        $("#slider_GBB_TX").slider({
            value: SDR_TX.GainBB,
            min: 0,
            max: 150,
            step: 1,
            slide: function (event, ui) {
                SDR_TX.GainBB = ui.value;
                $("#val_GBB_TX").html(ui.value);
                GainBB_TX();
                Save_TX_Para();
            }
        });
    });
    $("#val_GBB_TX").html(SDR_TX.GainBB);
}
//OLD PARAMETERS
function Recall_ParaTX() {
    if (Local_Storage) { // On a d'anciens parametres en local
        SDR_TX = JSON.parse(localStorage.getItem("Para_SDR_TX"));
        audioParaTX = JSON.parse(localStorage.getItem("Para_Audio_TX"));
		$("input:radio[name~='VolumeTX']").filter("[value='" + audioParaTX.Compresse + "']").prop('checked', true);
        $("#TX_IP").val(SDR_TX.IP);
        $("#relay_auto").prop("checked", SDR_TX.relay_auto);
        $("#txeqrx").prop("checked", SDR_TX.TXeqRX);
        $("#TXinvLsbUsb").prop("checked", SDR_TX.invert);
        $("#full_duplex").prop("checked", SDR_TX.Fduplex);
        $("#" + SDR_TX.sdr).prop("checked", true);
        var Old_TX_Xtal_Errors = JSON.parse(localStorage.getItem("TX_Xtal_Errors"));
        var idx_min = Math.min(Old_TX_Xtal_Errors.length, TX_Xtal_Errors.length);
        for (var i = 0; i < idx_min; i++) {
            TX_Xtal_Errors[i] = Old_TX_Xtal_Errors[i];
        }
        FilterTX = JSON.parse(localStorage.getItem("FilterTX"));
        FilterTX.display = false;
    }
}
function Save_TX_Para() {
    SDR_TX.TXeqRX = $("#txeqrx").prop("checked");
    SDR_TX.invert = $("#TXinvLsbUsb").prop("checked");
    localStorage.setItem("Para_SDR_TX", JSON.stringify(SDR_TX));
    localStorage.setItem("TX_Xtal_Errors", JSON.stringify(TX_Xtal_Errors));
    localStorage.setItem("Para_Audio_TX", JSON.stringify(audioParaTX));
    localStorage.setItem("FilterTX", JSON.stringify(FilterTX));
}
function TX_Compress() {
    audioParaTX.Compresse = $("input[name='VolumeTX']:checked").val();
    if (audioParaTX.Compresse == 0) { //Manuel
        $("#slider_Vol_TX").css("display", "block");
        $("#val_Vol_TX").css("display", "inline-block");
        audioParaTX.VolMic = DBtoV($("#slider_Vol_TX").slider("option", "value")); //dB
    } else { // Auto
        $("#slider_Vol_TX").css("display", "none");
        $("#val_Vol_TX").css("display", "none");
        audioParaTX.VolMic = 1; //Input Micro Gain
    }
    choice_TX_Source();
    Para_To_AudioProcessor();
    Save_TX_Para();
}
console.log("End loading remote_TX.js");
