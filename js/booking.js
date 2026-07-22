console.log("1. Le fichier booking.js est bien chargé");

// Récupération des éléments du DOM
const bookingForm = document.getElementById("bookingForm");
const inputNom = document.getElementById("NomInput");
const inputPrenom = document.getElementById("PrenomInput");
const inputAllergies = document.getElementById("AllergiesInput");
const inputConvives = document.getElementById("ConvivesInput");
const inputDate = document.getElementById("DateInput");
const selectHour = document.getElementById("selectHour");

// Définition des listes d'heures toutes les demi-heures
const hoursMidi = ["12:00", "12:30", "13:00", "13:30", "14:00"];
const hoursSoir = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00"];

// 2. Récupération des nouveaux éléments du DOM correspondants à votre HTML
const midiRadio = document.getElementById("midiRadio");
const soirRadio = document.getElementById("soirRadio");

// Configuration des restrictions de date dès le chargement du script
if (inputDate) {
    // 1. Bloquer la sélection des dates passées (minimum = aujourd'hui)
    const today = new Date().toISOString().split('T')[0];
    inputDate.setAttribute('min', today);

    // 2. Bloquer la saisie d'un lundi
    inputDate.addEventListener("input", function () {
        if (this.value) {
            const dateSelectionnee = new Date(this.value);
            const jourSemaine = dateSelectionnee.getDay(); // 0 = Dimanche, 1 = Lundi, 2 = Mardi...

            if (jourSemaine === 1) { // 1 = Lundi
                alert("Le restaurant est fermé le lundi. Veuillez choisir un autre jour (du mardi au dimanche).");
                this.value = ""; // Vide le champ pour forcer une nouvelle sélection
            }
        }
    });
}

// 1. Exécuter la récupération des infos utilisateur au chargement de la page
if (document.readyState !== 'loading') {
    console.log("2. Le DOM est DÉJÀ chargé, lancement immédiat");
    fetchUserInfo();
} else {
    document.addEventListener("DOMContentLoaded", () => {
        console.log("2. Le DOM vient de charger, lancement de fetchUserInfo");
        fetchUserInfo();
    });
}

async function fetchUserInfo() {
    const token = getToken();

    console.log("Token récupéré :", token);

    if (!token) {
        console.log("4. ARRÊT : Aucun token trouvé. L'utilisateur n'est pas connecté ou le cookie est absent.");
        return; // Si pas de token, on ne fait rien
    }

    console.log("5. Token trouvé, on va tenter de récupérer les infos de l'utilisateur avec ce token.");

    try {
        const response = await fetch(apiUrl + "account/me", {
            method: "GET",
            headers: {
                "X-AUTH-TOKEN": token, 
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const user = await response.json();

            // Pré-remplir le nom et le prénom
            if(inputNom) inputNom.value = user.lastName || user.nom || "";
            if(inputPrenom) inputPrenom.value = user.firstName || user.prenom || "";

            // Pré-remplir les allergies habituelles
            if(inputAllergies && user.allergy) {
                inputAllergies.value = user.allergy;
            }

            // Pré-remplir le nombre de convives habituel
            if(inputConvives && user.guestNumber) { 
                inputConvives.value = user.guestNumber;
            }

        } else {
            console.error("Impossible de récupérer les informations de l'utilisateur.");
        }
    } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur :", error);
    }
}

// 2. Gestion de la soumission du formulaire
bookingForm.addEventListener("submit", async function(event) {
    event.preventDefault(); // Empêche le rechargement de la page

    // Vérification basique des champs obligatoires
    if (!inputDate.value || !selectHour.value) {
        alert("Veuillez sélectionner une date et une heure.");
        return;
    }

    // Double sécurité : Vérification que la date n'est pas un lundi avant l'envoi
    const dateSelectionnee = new Date(inputDate.value);
    const jourSemaine = dateSelectionnee.getDay();

    if (jourSemaine === 1) {
        alert("Réservation impossible : le restaurant est fermé le lundi.");
        return; // Bloque la soumission
    }

    const token = getToken();

    // Construction de l'objet de données
    const bookingData = {
        guestNumber: parseInt(inputConvives.value, 10),
        allergy: inputAllergies.value,
        date: inputDate.value,
        time: selectHour.value,
    };

    try {
        const response = await fetch(apiUrl + "booking", {
            method: "POST",
            headers: {
                "X-AUTH-TOKEN": token,
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(bookingData)
        });

        if (response.ok) {
            alert("Votre réservation a bien été enregistrée !");

            //Redirection vers la page de toutes les réservations
            window.location.href = "/allResa";

            // On vide le formulaire
            bookingForm.reset();
            // On rappelle fetchUserInfo() pour remettre le nom/prénom/etc. de base sans recharger la page
            fetchUserInfo(); 

        } else {
            const error = await response.json();
            alert("Erreur lors de la réservation : " + (error.message || "Veuillez réessayer."));
        }
    } catch (error) {
        console.error("Erreur réseau :", error);
        alert("Une erreur est survenue lors de la communication avec le serveur.");
    }
});

// Optionnel: Gestion du bouton annuler pour vider le formulaire
const btnCancel = document.querySelector(".btn-danger");
if (btnCancel) {
    btnCancel.addEventListener("click", (e) => {
        e.preventDefault(); // Pour éviter que le bouton ne soumette le formulaire par erreur
        bookingForm.reset();
        fetchUserInfo(); // On remet les infos de l'utilisateur connecté après le reset
    });
}

// 3. Fonction pour mettre à jour les options du select d'heures
function updateHourOptions(service) {
    // On vide le contenu actuel du select
    selectHour.innerHTML = '';

    // On choisit la liste d'heures appropriée
    const hoursToDisplay = (service === "midi") ? hoursMidi : hoursSoir;

    // On remplit le select avec les nouvelles options
    hoursToDisplay.forEach(hour => {
        const option = document.createElement("option");
        option.value = hour;
        option.textContent = hour;
        selectHour.appendChild(option);
    });
}

// 4. Écouteurs d'événements sur les boutons radio de votre HTML
if (midiRadio && soirRadio) {
    midiRadio.addEventListener("change", () => {
        if (midiRadio.checked) {
            updateHourOptions("midi");
        }
    });

    soirRadio.addEventListener("change", () => {
        if (soirRadio.checked) {
            updateHourOptions("soir");
        }
    });

    // Comportement par défaut (ex: si le midi est pré-coché au chargement ou inversement)
    if (midiRadio.checked) {
        updateHourOptions("midi");
    } else if (soirRadio.checked) {
        updateHourOptions("soir");
    }
}