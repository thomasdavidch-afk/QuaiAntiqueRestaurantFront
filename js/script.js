const tokenCookieName = "accesstoken";
const signoutBtn = document.getElementById("signout-btn");
const RoleCookieName = "role";
const apiUrl = "http://127.0.0.1:8000/api/";

if (signoutBtn) {
    signoutBtn.addEventListener("click", signout);
}

function getRole() {
    return getCookie(RoleCookieName);
}

function signout() {
    // Supprimer le token du cookie
    eraseCookie(tokenCookieName);
    eraseCookie(RoleCookieName); // Supprimer le cookie de rôle également
    globalThis.location.reload(); // Recharger la page pour mettre à jour l'état de connexion
}

function setToken(token) {
    // Placer le token en cookie
    setCookie(tokenCookieName, token, 7); // Le cookie expire dans 7 jours
}

function getToken() {
    // Récupérer le token depuis le cookie
    return getCookie(tokenCookieName);
}

function setCookie(name,value,days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for(const element of ca) {
        let c = element;
        while (c.startsWith(' ')) c = c.substring(1,c.length);
        if (c.startsWith(nameEQ)) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {   
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function isConnected() {
    if(getToken() == null || getToken() == undefined) {
        return false;
    }
    else {
        return true;
    }
}

/*
disconnected
connected (admin ou client)
    - admin : accès à la page d'administration
    - client : accès à la page de compte
*/

function showAndHideElementsForRoles() {
    const userConnected = isConnected();
    const role = getRole();

    let allElementsToEdit = document.querySelectorAll("[data-show]");

    allElementsToEdit.forEach(element =>{
        switch(element.dataset.show){
            case 'disconnected':
                if(userConnected){
                    element.classList.add("d-none");
                }
                break;
            case 'connected':
                if(!userConnected){
                    element.classList.add("d-none");
                }
                break;
            case 'admin':
                if(!userConnected || role != "admin"){
                    element.classList.add("d-none");
                }
                break;
            case 'client':
                if(!userConnected || role != "client"){
                    element.classList.add("d-none");
                }
                break;
        }
    })
}

function sanitizeHtml(text) {
    const tempHtml = document.createElement('div');
    tempHtml.textContent = text;
    return tempHtml.innerHTML;
}

function getInfosUser() {

    let myHeaders = new Headers();
    myHeaders.append("X-AUTH-TOKEN", getToken());

    let requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    fetch(apiUrl+"account/me", requestOptions)
        .then(response =>{
            if(response.ok){
                return response.json();
            }
            else{
                console.log("Impossible de récupérer les informations de l'utilisateur")
            }
        })
        .then(result => {
            return result;
        })
        .catch(error =>{ console.error("Erreur lors de la récupération des informations utilisateur :", error)});
}

// --------------------------------------------------------
// Chargement dynamique des horaires dans le footer
// --------------------------------------------------------

async function loadFooterSchedules() {
    const schedulesEl = document.getElementById("footer-schedules");
    if (!schedulesEl) return;

    try {
        // On appelle la route /api/restaurant/config définie dans votre controller
        const response = await fetch(apiUrl + "restaurant/config", {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        if (response.ok) {
            const data = await response.json();

            // Vérifier si des horaires ont été trouvés (le controller renvoie '' si vide)
            const horaireMidi = data.horaireMidi ? data.horaireMidi : "Fermé le midi";
            const horaireSoir = data.horaireSoir ? data.horaireSoir : "Fermé le soir";

            // Formatage de l'affichage pour le footer
            const horairesHtml = `
                Midi : ${sanitizeHtml(horaireMidi)} <br>
                Soir : ${sanitizeHtml(horaireSoir)}
            `;
            
            schedulesEl.innerHTML = horairesHtml;

        } else {
            console.error("Erreur serveur lors de la récupération de la configuration du restaurant.");
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des horaires pour le footer :", error);
    }
}

// Déclenchement de la fonction une fois que tout le HTML est chargé
document.addEventListener("DOMContentLoaded", () => {
    loadFooterSchedules();
});