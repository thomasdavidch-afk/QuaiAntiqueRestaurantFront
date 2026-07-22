const formulaireCompte = document.getElementById("formulaireCompte");
const inputNom = document.getElementById("NomInput");
const inputPrenom = document.getElementById("PrenomInput");
const inputAllergies = document.getElementById("AllergiesInput");
const inputConvives = document.getElementById("ConvivesInput");

function getToken() {
    return getCookie(tokenCookieName);
}

function getCookie(name) {
    const cookies = document.cookie.split(";");

    for (let cookie of cookies) {
        cookie = cookie.trim();

        if (cookie.startsWith(name + "=")) {
            return cookie.substring(name.length + 1);
        }
    }

    return null;
}

async function getInfosUser() {
    const token = getToken();

    if (!token) {
        window.location.href = "/signin";
        return;
    }

    try {
        const response = await fetch(apiUrl + "account/me", {
            method: "GET",
            headers: {
                "X-AUTH-TOKEN": token,
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Impossible de récupérer les informations utilisateur");
        }

        const user = await response.json();

        console.log("Utilisateur reçu :", user);

        inputNom.value = user.lastName ?? "";
        inputPrenom.value = user.firstName ?? "";
        inputAllergies.value = user.allergy ?? "";
        inputConvives.value = user.guestNumber ?? "";
    } catch (error) {
        console.error(error);
    }
}

getInfosUser();

// On écoute la soumission du formulaire
formulaireCompte.addEventListener("submit", async function(event) {
    // 1. On empêche le rechargement classique de la page
    event.preventDefault();

    const token = getToken();

    if (!token) {
        window.location.href = "/signin";
        return;
    }

    // 2. On prépare les données modifiées dans un objet
    // Attention : Assurez-vous que les clés (lastName, firstName) correspondent 
    // exactement à ce qu'attend le Serializer de Symfony.
    const userData = {
        lastName: inputNom.value,
        firstName: inputPrenom.value,
        allergy: inputAllergies.value,
        guestNumber: parseInt(inputConvives.value) || 0 
    };

    try {
        // 3. On envoie les données à votre route account/edit
        const response = await fetch(apiUrl + "account/edit", {
            method: "PUT", 
            headers: {
                "X-AUTH-TOKEN": token,
                "Accept": "application/json",
                "Content-Type": "application/json" 
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error("Erreur lors de la mise à jour");
        }

        // --- CORRECTION ICI ---
        // On vérifie si la réponse est bien 204 No Content
        if (response.status === 204) {
            console.log("Mise à jour réussie avec succès (204 No Content) !");
            // Petit message pour confirmer à l'utilisateur
            alert("Vos informations ont bien été mises à jour !");
        } else {
            // Au cas où l'API renvoie autre chose qu'un 204 dans le futur
            const result = await response.text();
            console.log("Mise à jour réussie :", result ? JSON.parse(result) : "Aucun contenu");
            alert("Vos informations ont bien été mises à jour !");
        }

    } catch (error) {
        console.error(error);
        alert("Une erreur est survenue lors de la mise à jour.");
    }
});