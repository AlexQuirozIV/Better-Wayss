/**
 * Script gestione mappa e menu... e tutto il resto
*/

"use strict";

//! Costante che contiene LA MAPPA
const map = L.map('map', {zoomControl: false}).setView([45.309062, 9.501200], 14);


//! Icona markers
function createMarkerIcon(url) {
    return L.icon({
        iconUrl: url,
    
        iconSize:     [48, 48],     // Grandezza icona
        iconAnchor:   [35, 60],     // Punto dell'icona che indicherà il punto preciso sulla mappa
        popupAnchor:  [-10, -60]    // Punto da dove il popup si apre
    });
}


//! Costanti globali
const markerIconDark = createMarkerIcon('../img/marker-icone/markerIcona-dark.png');
const markerIcon = createMarkerIcon('../img/marker-icone/markerIcona.png');
const menus = [         // ID di ogni singolo menu esistente  //TODO: Aggiungere altri menu se mai verranno creati
    "addSingleMarkerMenu",
    "packagesMenu",
    "chiSiamoMenu",
    "accessibilityMenu",
    "settingsMenu",
    "accountMenu"
];
const languagesList = [ // Lista lingue supportate
    "🇮🇹 - Italiano",
    "🇬🇧 - English",
    "🇫🇷 - Français",
    "🇪🇸 - Español",
    "🇩🇪 - Deutsch",
    "🇵🇹 - Português"
];


//! Variabili globali e flags
var openedMenuId;                       // Contiene l'id del menu aperto in quel momento
var availablePlace = [];                // Flag se il marker esiste già o no (prevenire spam)
var singleMarkers = {};                 // Contiene i singoli markers creati
var isPackageLaid = false;              // C'è un pacchetto iniziato?
var currentPackageRouting;              // Quale pacchetto è "piazzato"?
var informations;                       // Contiene le informazioni presi dai JSON
var currentLanguage = languagesList[0]; // Lingua selezionata (default Italiano)
var currentLanguageID = 'it';           // ID della lingua selezionata (per le indicazioni di Leaflet)

//! Fetch e inizializzazione informazioni
/* Prendi informazioni dai JSON... */
async function fetchInfos(currentLanguage) {
    // Resetta tutto...
    availablePlace = [];
    singleMarkers = {};
    currentPackageRouting = undefined;
    informations = undefined;

    // Prendi dal JSON giusto...
    switch (currentLanguage) {
        case "🇮🇹 - Italiano":
            var response = await fetch('../JSON/languageTranslations/italiano.json');
            informations = await response.json();
            availablePlaceLanguageRefill();     // Refilla 'availablePlace'

            break;
        
        case "🇬🇧 - English":
            var response = await fetch('../JSON/languageTranslations/english.json');
            informations = await response.json();
            availablePlaceLanguageRefill();

            break;
        
        case "🇪🇸 - Español":
            var response = await fetch('../JSON/languageTranslations/espanol.json');
            informations = await response.json();
            availablePlaceLanguageRefill();

            break;
        
        case "🇩🇪 - Deutsch":
            var response = await fetch('../JSON/languageTranslations/deutsch.json');
            informations = await response.json();
            availablePlaceLanguageRefill();

            break;
        
        case "🇫🇷 - Français":
            var response = await fetch('../JSON/languageTranslations/francais.json');
            informations = await response.json();
            availablePlaceLanguageRefill();

            break;
        
        case "🇵🇹 - Português":
            var response = await fetch('../JSON/languageTranslations/portugues.json');
            informations = await response.json();
            availablePlaceLanguageRefill();

            break;
                        
        default:
            var response = await fetch('../JSON/languageTranslations/italiano.json');
            informations = await response.json();
            availablePlaceLanguageRefill();

            break;
    }

    // Funzione per refillare 'availablePlace'
    function availablePlaceLanguageRefill() {
        Object.keys(informations.placesNames).forEach(place => {
            availablePlace.push(place);
        });
    }

    // Notifica di quale è stato fetchato
    console.log('Information fetched successfully for\n',
                (currentLanguage == undefined) ? "🇮🇹 - Italiano" : currentLanguage);
}

/* Attendiamo di aver preso i dati prima di procedere all'avvio della pagina... */
async function startWebsite() {
    await fetchInfos();
}
startWebsite();


//! Funzioni mappa
/* Inizializza 'onLoad' */
function initializeMap() {
    const bounds = [
        [45.346958, 9.47382],
        [45.277182, 9.52927]
    ];

    // Funzioni necessarie (+ min e max zoom)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 14,
        maxZoom: 19
    }).addTo(map);

    // Imposta limiti
    map.setMaxBounds(bounds);

    // Controlli zoom pulsanti
    L.control.zoom({
        position: 'topright'
    }).addTo(map);
}

//* Per debugging */
function coordinatesOnClick() {
    // Click e output coordinate in console
    map.on('click', (e) => {
        console.log('[' + e.latlng.lat.toFixed(6) + ', ' + e.latlng.lng.toFixed(6) + ']');
    });
}
function markerFromConsole([latitude, longitude]) {
    let coords = [latitude, longitude];
    let output = "[" + coords[0] + ", " + coords[1] + "]";
    L.marker(coords).addTo(map).bindPopup(output);
}

/* Avvia mappa a caricamento pagina */
document.body.onload = () => {
    console.log('Initializing map...');
    initializeMap();
    coordinatesOnClick();
    map.on('click', () => { closeOpenMenus(); });
    markerFromConsole([45.346958, 9.47382]);
    markerFromConsole([45.277182, 9.52927]);
};

/* Genera 'div' con 'img' in base al valore inserito sono 'piene' o no (necessaria per 'bindPopupInfos') */
function rate(fullStarsNumber) {
    let rating = '';
    for (let i = 0; i < fullStarsNumber; i++) {
        rating += '<img src="../img/popup-rating-stars/fullStar.png" class="popupStars">';
    }
    for (let i = 0; i < (5 - fullStarsNumber); i++) {
        rating += '<img src="../img/popup-rating-stars/emptyStar.png" class="popupStars">';
    }
    rating = '<div class="popupRating">' + rating + '</div>'
    
    return rating;
}
/* Genera le 'info' necessarie da aggiungere a ciascun popup tramite '.bindPopup(info)' */
function bindPopupInfos(title, rating, description, imageLink) {
    if (title === undefined || title == '') { title = 'Titolo inesistente'; }
    if (imageLink === undefined || imageLink == '') { imageLink = 'Torre-Zucchetti.jpg'; }
    if (description === undefined || description == '') { description = 'Descrizione di "' + title + '" inesistente'; }
    if (rating === undefined || rating < 0) { rating = 4; }

    imageLink = '<img src="' + imageLink + '" alt="' + title + '" style="color: white" class="popupImage">';
    title = '<p class="popupTitle">' + title + '</p>';
    rating = rate(rating);
    description = '<p class="popupDescription">' + description + '</p>';

    let info = title + rating + description + imageLink;
    return info;
}


//! Funzionalità menu
/* Chiudi tutti menu aperti */
function closeOpenMenus() {
    menus.forEach(menu => {
        document.getElementById(menu).classList.remove('activeMenu');
    });
    openedMenuId = undefined;   // Svuota flag
}
/* Chiusura / apertura menu a click del rispettivo pulsante */
function handleMenuButtonPress(menu) {
    // Se attivo, allora chiudilo
    if (menu.classList.contains('activeMenu')) {
        closeOpenMenus();
        return 'yes';   // Restituisce 'yes' (si, fai 'return') al menu che l'ha invocato (altrimenti lo apre comunque)
    }

    // Chiusura dei menu al click del pulsante di un altro menu (solo uno aperto alla volta)
    if (openedMenuId != undefined) {
        closeOpenMenus();
    }
}


//! Marker singoli
function addSingleMarkerMenu() {
    let id = 'addSingleMarkerMenu';

    
    /* Funzioni necessarie gestione menu */
    let menu = document.getElementById(id);
    let shouldThisMenuClose = handleMenuButtonPress(menu);
    if (shouldThisMenuClose == 'yes') { return; }


    /* Titolo */
    menu.querySelector('span').textContent = informations.menuNames[0];

    /* Opzioni per il select */
    let select = menu.querySelector('select');
    let selectedIndex = select.selectedIndex;   // Salva l'index, così rimane alla prossima apertura

    // Svuota il select...
    if (select.hasChildNodes()) {
        while (select.firstChild) {
            select.removeChild(select.firstChild);
        }
    }

    // ... e riempilo con i "nuovi" options
    let optionsNames = Object.values(informations.placesNames).map(array => array[1]);
    for (let i = 0; i < optionsNames.length; i++) {
        let option = document.createElement('option');
        option.value = Object.keys(informations.placesNames)[i];
        option.text = optionsNames[i];
        select.appendChild(option);
    }
    // Ripristina l'index per l'apertura
    if (selectedIndex >= 0 && selectedIndex < select.options.length) {
        select.selectedIndex = selectedIndex;
    }

    /* Pulsanti */
    let buttons = menu.querySelectorAll('div button')

    // Testo e funzione per ciascuno
    buttons[0].textContent = informations.menuNames[1];
    buttons[0].setAttribute('onclick', 'singleMarkerMenuPlace()');

    buttons[1].textContent = informations.menuNames[2];
    buttons[1].setAttribute('onclick', 'singleMarkerMenuRemove()');

    buttons[2].textContent = informations.menuNames[3];
    buttons[2].setAttribute('onclick', 'singleMarkerMenuAddAll()');

    buttons[3].textContent = informations.menuNames[4];
    buttons[3].setAttribute('onclick', 'singleMarkerMenuRemoveAll()');

    /* Attiva il menu */
    menu.classList.toggle('activeMenu');

    /* Update flag */
    openedMenuId = id;
}

//* Funzioni */
/* Genera un singolo marker */
function newSingleMarker([latitude, longitude], info) {
    if ([latitude, longitude] == undefined) {
        console.log('Could not place marker, coordinates undefined!');
        return null;
    }

    // Crea marker...
    let marker = L.marker([latitude, longitude], {icon: markerIcon}).addTo(map).bindPopup(info);

    // ... e in output per salvarlo in 'markers' nella funzione 'addSingleMarkerMenu'...
    return marker;
}
/* Metti / togli marker singolo piazzato */
function singleMarkerMenuPlace() {
    var selectedPlace = document.querySelector('#addSingleMarkerMenu select').value;
    
    // Crea il nuovo marker se non già piazzato e lo salva dentro 'markers'
    if (availablePlace.includes(selectedPlace)) {
        // Genera le informazioni da aggiungere al popup con le informazioni da 'informations'
        var bindingInfos = bindPopupInfos(informations.placesNames[selectedPlace][1],
                                          informations.placesNames[selectedPlace][2],
                                          informations.placesNames[selectedPlace][3],
                                          informations.placesNames[selectedPlace][4]);

        // Piazza il menu e salvalo in 'singleMarkers'
        singleMarkers[selectedPlace] = newSingleMarker(informations.placesNames[selectedPlace][0], bindingInfos);
        // Svuota lo spazio da 'availablePlace'
        availablePlace[availablePlace.indexOf(selectedPlace)] = null;
    }
}
function singleMarkerMenuRemove() {
    var selectedPlace = document.querySelector('#addSingleMarkerMenu select').value;
    
    // Se il marker non è piazzato, lo toglie
    if (!(availablePlace.includes(selectedPlace))) {
        map.removeLayer(singleMarkers[selectedPlace]);

        // Il valore viene ripristinato, invece di 'null'
        availablePlace[availablePlace.indexOf(null)] = selectedPlace;
    }
}
/* Metti / togli TUTTI i marker piazzati */
function singleMarkerMenuAddAll() {
    // Se sono tutti piazzati, esci dalla funzione...
    if (availablePlace.every(element => element === null)) {
        return;
    }

    // ... altrimenti, lo piazza
    for (let i = 0; i < availablePlace.length; i++) {
        let marker = availablePlace[i];

        if (marker === null) {
            continue; // Skippa al prossimo se il corrente è 'null'
        }

        // Genera le informazioni da aggiungere al popup con le informazioni da 'informations'
        var bindingInfos = bindPopupInfos(informations.placesNames[marker][1],
                                          informations.placesNames[marker][2],
                                          informations.placesNames[marker][3],
                                          informations.placesNames[marker][4]);

        // Piazza il menu e salvalo in 'singleMarkers'
        singleMarkers[marker] = newSingleMarker(informations.placesNames[marker][0], bindingInfos);
        // Svuota lo spazio da 'availablePlace'
        availablePlace[i] = null;
    }
}
function singleMarkerMenuRemoveAll() {
    // Per ogni 'marker' in 'singleMarkers', rimuovi dalla mappa con funzione Leaflet
    for (const marker in singleMarkers) {
        map.removeLayer(singleMarkers[marker]);
    }
    singleMarkers = {};
    // Svuota e riempi 'availablePlace' con i posti (resettati)
    availablePlace = [];
    Object.keys(informations.placesNames).forEach(place => {
        availablePlace.push(place);
    });
}


//! Account menu
function accountMenu() {
    let id = 'accountMenu';
    
    /* Funzioni necessarie gestione menu */
    let menu = document.getElementById(id);
    let shouldThisMenuClose = handleMenuButtonPress(menu);
    if (shouldThisMenuClose == 'yes') { return; }

    /* Titolo */
    menu.querySelector('div').textContent = informations.menuNames[5];

    /* Attiva il menu */
    menu.classList.toggle('activeMenu');

    /* Update flag */
    openedMenuId = id;
}


//! Pacchetti
function packagesMenu() {
    let id = 'packagesMenu';
    
    /* Funzioni necessarie gestione menu */
    let menu = document.getElementById(id);
    let shouldThisMenuClose = handleMenuButtonPress(menu);
    if (shouldThisMenuClose == 'yes') { return; }

    /* Titolo */
    menu.querySelector('span').textContent = informations.menuNames[6];

    /* Opzioni per il select */
    let select = menu.querySelector('select');
    let selectedIndex = select.selectedIndex;   // Salva l'index, così rimane alla prossima apertura

    // Svuota il select...
    if (select.hasChildNodes()) {
        while (select.firstChild) {
            select.removeChild(select.firstChild);
        }
    }

    // ... e riempilo con i "nuovi" options
    let optionsNames = Object.keys(informations.itineraryNames);
    for (let i = 0; i < optionsNames.length; i++) {
        let option = document.createElement('option');
        option.value = optionsNames[i];
        option.text = optionsNames[i];
        select.appendChild(option);
    }
    
    // Ripristina l'index per l'apertura
    if (selectedIndex >= 0 && selectedIndex < select.options.length) {
            select.selectedIndex = selectedIndex;
    }

    /* Pulsanti */
    let buttons = menu.querySelectorAll('div button')

    // Testo e funzione per ciascuno
    buttons[0].textContent = informations.menuNames[7];
    buttons[0].setAttribute('onclick', 'layPackage()');

    buttons[1].textContent = informations.menuNames[8];
    buttons[1].setAttribute('onclick', 'removeLaidPackage()');

    /* Attiva il menu */
    menu.classList.toggle('activeMenu');

    /* Update flag */
    openedMenuId = id;
}

//* Funzioni */
/* Metti / togli itinerario piazzato */
function layPackage() {
    removeLaidPackage();

    const selectedPackage = document.querySelector('#packagesMenu select').value;
    /* Prendi il 'pacchetto' da 'informations.itineraryNames' in base al parametro mandato */
    var packagePlacesList = informations.itineraryNames[selectedPackage];

    var places = [];
    packagePlacesList.forEach(element => {
        places.push(informations.placesNames[element]);
    });

    /* Preleva le coordinate da 'places' e le salva in 'waypoints' */
    var waypoints = places.map((place) => {
        return place[0];
    });

    /* Preleva titoli */
    var titles = places.map((title) => { return title[1]; });

    /* Preleva rating */
    var ratings = places.map((rating) => { return rating[2]; });

    /* Preleva description */
    var descriptions = places.map((description) => { return description[3]; });

    /* Preleva imageLink */
    var imageLinks = places.map((imageLink) => { return imageLink[4]; });

    /* Aggiungi alla mappa */
    currentPackageRouting = L.Routing.control({
        // Per ogni singolo 'waypoint'
        waypoints: waypoints,
        language: currentLanguageID,
        // Impostazioni per evitare 'dragging' dei waypoints e 'lines' (percorsi in rosso)
        draggableWaypoints: false,
        addWaypoints: false,
        // Effettiva creazione (_i è un contatore necessario alla funzione)
        createMarker: function(_i, waypoint) {
            var icon = _i === 0 ? markerIconDark :
                       _i === waypoints.length - 1 ? markerIconDark :
                       markerIcon;

            return L.marker(waypoint.latLng, {
                draggable: false,
                icon: icon
            }).bindPopup(bindPopupInfos(titles[_i], ratings[_i], descriptions[_i], imageLinks[_i])); // Aggiungi pop-ups
        }
    }).addTo(map);

    /* Update flag */
    isPackageLaid = true;
}
function removeLaidPackage() {
    // Se non c'è un itinerario piazzato o non stiamo analizzando un itinerario, esci...
    if (!isPackageLaid || !currentPackageRouting) {
        return;
    }
    // ...altrimenti, rimuovi il pacchetto piazzato a 'currentPackageRouting'
    map.removeControl(currentPackageRouting);

    // Resetta i valori
    isPackageLaid = false;
    currentPackageRouting = undefined;
}


//! Accessibilità menu
function accessibilityMenu() {
    let id = 'accessibilityMenu';
    
    /* Funzioni necessarie gestione menu */
    let menu = document.getElementById(id);
    let shouldThisMenuClose = handleMenuButtonPress(menu);
    if (shouldThisMenuClose == 'yes') { return; }

    /* Titolo */
    menu.querySelector('div').textContent = informations.menuNames[9];

    /* Opzioni */
    let option = document.getElementsByClassName('accessibility_text');

    option[0].textContent = informations.menuNames[18];
    option[1].textContent = informations.menuNames[19];
    option[2].textContent = informations.menuNames[20];

    /* Attiva il menu */
    menu.classList.toggle('activeMenu');

    /* Update flag */
    openedMenuId = id;
}


//! Settings menu
function settingsMenu() {
    let id = 'settingsMenu';
    
    /* Funzioni necessarie gestione menu */
    let menu = document.getElementById(id);
    let shouldThisMenuClose = handleMenuButtonPress(menu);
    if (shouldThisMenuClose == 'yes') { return; }

    /* Titolo */
    menu.querySelector('div:first-child').textContent = informations.menuNames[10];

    /* Legenda */
    document.getElementById('legendTitle').textContent = informations.menuNames[11];

    let legendContentTexts = document.getElementsByClassName('legendContentText');
    for (let i = 0; i < legendContentTexts.length; i++) {
        let legendContentText = legendContentTexts[i];
        legendContentText.textContent = informations.menuNames[i + 12];
    }

    /* Sezione 'cambia lingua' */
    let languageSwitch = document.getElementById('languageSwitch');
    languageSwitch.querySelector('span').textContent = informations.menuNames[15];

    /* Opzioni per il select (lista delle lingue da 'languagesList') */
    let select = languageSwitch.querySelector('select');

    for (let language of languagesList) {
        let isOptionPresent = false;
    
        // Controlla se l'opzione c'è già
        for (let option of select.options) {
            if (option.value === language || option.text === language) {
                isOptionPresent = true;
                break;
            }
        }
    
        // Se non c'è aggiungila
        if (!isOptionPresent) {
            let option = document.createElement('option');
            option.value = language;
            option.text = language;
            select.appendChild(option);
        }
    }

    /* Attiva il menu */
    menu.classList.toggle('activeMenu');

    /* Controlla cambiamento lingua */
    languageChangeListener();

    /* Update flag */
    openedMenuId = id;
}

//* Funzioni */
/* Sente quando viene cambiata la lingua e chiama 'handleLanguageChange' per cambiarla */
function languageChangeListener() {
    // Rimuove il listener precedente (altrimenti rifarà il fetch esponenzialmente)
    document.querySelector('#languageSwitch select').removeEventListener('change', handleLanguageChange);

    // Aggiungine uno nuovo
    document.querySelector('#languageSwitch select').addEventListener('change', handleLanguageChange);
}
/* Gestisce il cambiamento della lingua */
function handleLanguageChange(event) {
    var selectedOption = event.target.value;    // Il valore di cosa ('target') ha triggerato l'evento
    
    // Setta 'currentLanguage' e 'currentLanguageID'
    currentLanguage = selectedOption;
    switch (selectedOption) {
        case "🇬🇧 - English":
            currentLanguageID = 'en';
            break;
        
        case "🇪🇸 - Español":
            currentLanguageID = 'es';
            break;

        case "🇩🇪 - Deutsch":
            currentLanguageID = 'de';
            break;
        
        case "🇫🇷 - Français":
            currentLanguageID = 'fr';
            break;

        case "🇵🇹 - Português":
            currentLanguageID = 'pt-BR';
            break;

        default:
            currentLanguageID = 'it';
            break;
    }

    // Chiudi tutto per aggiornare la lingua
    singleMarkerMenuRemoveAll();
    removeLaidPackage();
    
    // Prendi le nuove informazioni (dato che ora abbiamo aggiornato 'currentLanguage' e 'currentLanguageID')
    fetchInfos(currentLanguage);

    // Resetta il menu delle impostazioni
    resetSettingsMenu();
}

/* Reset del menu dopo aver cambiato lingua */
function resetSettingsMenu() {
    closeOpenMenus();
    setTimeout(() => {
        settingsMenu();
    }, 300);
}


//! Chi siamo? menu
function chiSiamoMenu() {
    let id = 'chiSiamoMenu';
    
    /* Funzioni necessarie gestione menu */
    let menu = document.getElementById(id);
    let shouldThisMenuClose = handleMenuButtonPress(menu);
    if (shouldThisMenuClose == 'yes') { return; }
    
    /* Titolo */
    menu.querySelector('div').textContent = informations.menuNames[16];

    /* La nostra bellissima presentazione */
    menu.querySelector('span').innerHTML = informations.menuNames[17];

    /* Attiva il menu */
    menu.classList.toggle('activeMenu');

    /* Update flag */
    openedMenuId = id;
}