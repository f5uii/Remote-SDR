// ****************
// * REMOTE SDR   *
// *    F1ATB     *
// ****************
var ecran = {
    large: true,
    largeur: 1,
    hauteur: 1,
    innerW: 1,
    innerH: 1,
    border: 5
};
var SDR = {
    RX_IP: "RX Ip",
    TX_IP: "TX Ip",
    MY_IP: ""
};
var audioTX = {
    Ctx: null,
    mic_stream: null,
    node_gain: null,
    node_proces_sortie: null,
    node_proces_analyse: null,
    node_analyseur: null,
    node_filtre: null
};
var CPU_Model = "";
var CPU_Models = [];
//RESIZE
//**********
function Init_Page_Tools() {
    SDR.MY_IP = window.location.host;
    SDR.RX_IP = SDR.MY_IP;
    SDR.TX_IP = SDR.RX_IP;
    if (localStorage.getItem("SDR_RX") != null) { // On a d'anciens parametres en local
        SDR_RX = JSON.parse(localStorage.getItem("SDR_RX"));
        SDR.RX_IP = SDR_RX.IP;
    }
    if (localStorage.getItem("Para_SDR_TX") != null) { // On a d'anciens parametres en local
        SDR_TX = JSON.parse(localStorage.getItem("Para_SDR_TX"));
        SDR.TX_IP = SDR_TX.IP;
    }
    $("#RX_IP").html(SDR.RX_IP);
    $("#TX_IP").html(SDR.TX_IP);
    $("#RT_IP").html(SDR.RX_IP);
    if (SDR.RX_IP == SDR.TX_IP) {
        $(".RX").css("display", "none");
        $(".TX").css("display", "none");
        disp_CPU(SDR.RX_IP, "CPU_RT")
        disp_temperature(SDR.RX_IP, "Temp_RT");
		StopRX();
		StopTX();
    } else {
        $(".RT").css("display", "none");
        if (SDR.RX_IP.length > 3) {
            disp_CPU(SDR_RX.IP, "CPU_RX");
            disp_temperature(SDR_RX.IP, "Temp_RX");
			StopRX();
        } else {
            $(".RX").css("display", "none");
        }
        if (SDR.TX_IP.length > 3) {
            disp_CPU(SDR.TX_IP, "CPU_TX");
            disp_temperature(SDR.TX_IP, "Temp_TX");
			StopTX();
        } else {
            $(".TX").css("display", "none");
        }
    }
    if (SDR.RX_IP == SDR.MY_IP) {
        $(".actif_dis").css({
            "background-color": "#bbb",
            color: "grey",
            "border-color": "grey"
        });
    }
    if (SDR.TX_IP == SDR.MY_IP) {
        $(".actif_dis").css({
            "background-color": "#bbb",
            color: "grey",
            "border-color": "grey"
        });
    }
    window_resize();
}
function StopTX(){
	var adresse = "http://" + SDR_TX.IP + "/cgi-bin/SelectRadio.py";
	var loader = '<iframe src="' + adresse + '?tx_stop" ></iframe>';
	$("#TX_loader").html(loader);
}
function StopRX(){
	var adresse = "http://" + SDR_RX.IP + "/cgi-bin/SelectRadio.py";
	var loader = '<iframe src="' + adresse + '?rx_stop" ></iframe>';
	$("#RX_loader").html(loader);
}
function disp_CPU(ip, id) {
    if (ip.length > 3) {
        var url_ = "http://" + ip + "/log/CPU.js";
        var s = document.createElement("script");
        s.setAttribute("type", "text/javascript");
        s.setAttribute("src", url_);
        s.setAttribute("onload", " DISP_CPU_('" + id + "' ,CPU_Model);");
        document.body.appendChild(s);
    }
}
function DISP_CPU_(id, cpu) {
    CPU_Models.push([id, cpu]);
    for (var i = 0; i < CPU_Models.length; i++) {
        $("#" + CPU_Models[i][0]).html(CPU_Models[i][1]);
        console.log(CPU_Models[i][0], CPU_Models[i][1]);
    }
}
function disp_temperature(ip, id) {
    if (ip.length > 3) {
        var url_ = "http://" + ip + "/cgi-bin/ajax.py?Temperature";
        $("#" + id).html("<iframe src='" + url_ + "' scrolling='no' style='width:50px;height:30px;overflow: clip;background-color:#000;'></iframe>"); //Allow access even in cross origin
    }
}
function disp_sh(sdr, x) {
    if (x == "USB") {
        var EN = "The name of the connected SDR must appear in the list of USB devices";
        var FR = "Le nom du SDR connecté doit apparaitre dans la liste des appareils USB";
    }
    if (x == "HackRFinfo") {
        var EN = "Info on HackRF(s) One SDR connected to USB. All infos available only if Remote SDR never starts after a boot.";
        var FR = "Info sur le HackRF One connecté à l'USB. Infos disponibles si Remote SDR n'a pas été actif après le boot.";
    }
    if (x == "RTLSDRinfo") {
        var EN = "Infos on RTL-SDR connected to USB. All infos available only if Remote SDR never starts after a boot.";
        var FR = "Infos sur le RTL-SDR connecté à l'USB.  Infos disponibles si Remote SDR n'a pas été actif après le boot";
    }
    if (x == "testpin26") {
        var EN = "50Hz square Oscillator on pin 26 or pin 10 for 10s (wait)";
        var FR = "Oscillateur signal carré de 50Hz pendant 10s sur la pin 26 ou la pin 10 (patientez)";
    }
    if (x == "RebootOPI") {
        var EN = "Reboot Orange PI or Raspberry PI";
        var FR = "Reboot Orange PI ou Raspberry PI";
    }
    if (x == "Shutdown") {
        var EN = "Shutdown Orange PI or Raspberry PI";
        var FR = "Arrêt Orange PI ou Raspberry PI";
    }
    if (x == "SA818test") {
        var EN = "Test communication to SA818. Response should be :b'+DMOCONNECT:0'";
        var FR = "Test communication avec le SA818. La réponse doit être : b'+DMOCONNECT:0'";
    }
    if (x == "RxGpredict") {
        var EN = "Test communication with Gpredixt on RX frequency.<br>Click on 'Engage' in Gpredict and wait 10s.";
        var FR = "Test communication avec Gpredict pour la frequence du RX.<br> Cliquez sur 'Engage' dans Gpredict et patientez 10s.";
    }
    if (x == "TxGpredict") {
        var EN = "Test communication with Gpredixt on TX frequency.<br>Click on 'Engage' in Gpredict and wait 10s.";
        var FR = "Test communication avec Gpredict pour la frequence du TX.<br> Cliquez sur 'Engage' dans Gpredict et patientez 10s.";
    }
    if (x == "OmniRigTest") {
        var EN = "Start OmniRig Test. Listen on port 8008.<br>";
        EN += "Messages from Omnirig are passed to the RX Raspberry/Orange pi and returned here to the web browser.";
		EN += "Messages as 'INIT;', 'FA;', 'TX;' should be displayed.";
		EN += "The Omnirig application must be on and visible."
		EN += "<br>Wait 10s, please.";
        var FR = "Lancement du test sur OmniRig. Ecoute du port 8008.<br>";
        FR += "Les messages d'Omnirig sont transmis  au Raspberry/Orange pi du RX puis retournés vers le navigateur web.";
		FR += "Messages attendus : 'INIT;', 'FA;', 'TX;'.";
		FR += "La fenetre du logiciel Omnirig doit être visible."
		FR +="<br>Attendez 10s , s'il vous plait."
    }
    $("#info_en").html(EN);
    $("#info_fr").html(FR);
    setTimeout(function () {
        var url_ = "http://" + SDR.RX_IP + "/cgi-bin/ajax.sh?" + x;
        if (sdr == "Tx")
            url_ = "http://" + SDR.TX_IP + "/cgi-bin/ajax.sh?" + x;
        var r = true;
        if (x == "RebootOPI")
            r = confirm("Confirm Orange/Raspberry Pi Reboot!");
        if (x == "Shutdown")
            r = confirm("Confirm Orange/Raspberry Pi Shutdown!");
        if (r == true) {
            $("#terminal").html("<iframe src='" + url_ + "' style='width:100%;position:absolute;top:0px;height:100%;'></iframe>"); //Allow access even in cross origin
        } else {
            $("#info_en").html("");
            $("#info_fr").html("");
        }
    }, 10);
}
function disp_py(sdr, x) {
    if (x == "RxConf") {
        var EN = "Use a text editor to edit the /var/www/html/configurationRX.js file as needed.";
        var FR = "Utilisez un éditeur de texte pour modifier si besoin le fichier /var/www/html/configurationRX.js.";
    }
    if (x == "TxConf") {
        var EN = "Use a text editor to edit the /var/www/html/configurationTX.js file as needed.";
        var FR = "Utilisez un éditeur de texte pour modifier si besoin le fichier /var/www/html/configurationTX.js.";
    }
    if (x == "ApacheError") {
        var EN = "List of errors of Apache server";
        var FR = "Liste des erreurs du serveur Apache";
    }
    if (x == "ChangesLog") {
        var EN = "Changes Log";
        var FR = "Journal des modifications";
    }
    if (x == "PlutoHelp") {
        var EN = "List of Pluto commands (ip: 192.168.2.1) to test its response";
        var FR = "Liste des commandes Pluto (ip: 192.168.2.1) pour tester sa réponse";
    }
    if (x == "PlutoReboot") {
        var EN = "Adalm-Pluto reboot (ip: 192.168.2.1). Please wait 10s.";
        var FR = "Reboot de l'Adalm Pluto (ip: 192.168.2.1). Patientez 10s.";
    }
    if (x == "Historic") {
        var EN = "List of the last parameters sent to the radios manager.";
        var FR = "Liste des derniers paramètres envoyés au gestionnaire des radios.";
    }
    if (x == "USB") {
        var EN = "The name of the connected SDR must appear in the list of USB devices";
        var FR = "Le nom du SDR connecté doit apparaitre dans la liste des appareils USB";
    }
    $("#info_en").html(EN);
    $("#info_fr").html(FR);
    var url_ = "http://" + SDR.RX_IP + "/cgi-bin/ajax.py?" + x;
    if (sdr == "Tx")
        url_ = "http://" + SDR.TX_IP + "/cgi-bin/ajax.py?" + x;
    $("#terminal").html("<iframe src='" + url_ + "' style='width:100%;position:absolute;top:0px;height:100%;'></iframe>"); //Allow access even in cross origin
}
function window_resize() {
    ecran.largeur = window.innerWidth; // parametre qui gere le changement des css'
    ecran.hauteur = window.innerHeight;
    var Fs = Math.max(12, ecran.largeur / 100);
    $("body").css("font-size", Fs); //Main Font-Size
}
//Traitement Audio du Microphone
function test_micro() {
    var EN = "Test access to the microphone. Requires the Orange/Raspberry PI site to be declared secure.";
    var FR = "Test l'accès au microphone. Nécessite d'avoir le site de l'Orange/Raspberry PI déclaré sécurisé.";
    $("#info_en").html(EN);
    $("#info_fr").html(FR);
    $("#terminal").html("");
    audioTX.Ctx = new AudioContext({
        sampleRate: 10000
    }); // On force 10kHz pour le micro
    if (!navigator.getUserMedia)
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia;
    if (navigator.getUserMedia) {
        //On se connecte à l'audio input par defaut, le micro
        navigator.getUserMedia({
            audio: true
        },
            function (stream) {
            start_microphone(stream);
        },
            function (e) {
            alert('Error capturing audio.May be no microphone connected');
        });
    } else {
        alert('getUserMedia not supported in this browser or access to a non secure server(not https)');
    }
}
function start_microphone(stream) {
    console.log("stream", stream);
    //Flux du micro
    audioTX.mic_stream = audioTX.Ctx.createMediaStreamSource(stream);
    //Creation des Nodes de traitement
    audioTX.node_gain = audioTX.Ctx.createGain();
    audioTX.node_filtre = audioTX.Ctx.createBiquadFilter();
    audioTX.node_filtre.type = "lowpass";
    audioTX.node_filtre.frequency.value = 3500; //Fc de 3500Hz
    //Connection des Nodes entre eux.
    audioTX.mic_stream.connect(audioTX.node_gain);
    audioTX.node_gain.connect(audioTX.node_filtre);
    audioTX.node_filtre.connect(audioTX.Ctx.destination); //Pour s'ecouter
    audioTX.node_gain.gain.value = 0.1;
}
function reset_storage() {
    var EN = "Reset of all parameters. Back to initial configuration.";
    var FR = "RAZ des paramètres. Retour à la configuration de base.";
    $("#info_en").html(EN);
    $("#info_fr").html(FR);
    setTimeout(function () {
        var r = true;
        r = confirm("Confirm Local Storage reset!");
        if (r == true) {
            localStorage.setItem("Local_Storage_", JSON.stringify(""));
            localStorage.setItem("date_Last_Check", JSON.stringify(""));
        }
    }, 10);
}
//Serial USB
var USB = {
    port: undefined,
    lineBuffer: ''
};
function test_USBserial() {
    var EN = "Test USB interface for Rotating Knob (F+,F-), Transmitt push Button (B0,B1) and CW keyer (L0,L1,R0,R1). Responses should be F+, F-, B0, B1,L0, L1, R0 or R1 ";
    var FR = "Test de l'interafece USB pour le bouton rotatif (F+,F-), le poussoir de transmission (B0,B1) et le manipulateur Morse (L0,L1,R0,R1). Les résponses doivent être F+, F-, B0, B1,L0, L1, R0 ou R1";
    $("#info_en").html(EN);
    $("#info_fr").html(FR);
    if (USB.port) {
        USB.port.close();
        USB.port = undefined;
    } else {
        console.log("Look for Serial Port")
        getReader();
    }
}
//Asynchronus reader of the Serial port on USB
async function getReader() {
    USB.port = await navigator.serial.requestPort({});
    await USB.port.open({
        baudRate: 115200
    });
    const appendStream = new WritableStream({ //Messages from Erduino
        write(chunk) {
            USB.lineBuffer += chunk;
            var lines = USB.lineBuffer.split('\n');
            while (lines.length > 1) {
                var message = lines.shift();
                var old_message = $("#terminal").html();
                $("#terminal").html(old_message + message);
            }
            USB.lineBuffer = lines.pop();
        }
    });
    USB.port.readable
    .pipeThrough(new TextDecoderStream())
    .pipeTo(appendStream);
}
//Page FULL SCREEN
var FS_On = false;
function switch_page() {
    FS_On = !FS_On;
    var elem = document.documentElement;
    if (FS_On) {
        /* View in fullscreen */
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) { /* Firefox */
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE/Edge */
            elem.msRequestFullscreen();
        }
    } else {
        /* Close fullscreen */
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
            document.msExitFullscreen();
        }
    }
}
