const formulairePassword = document.getElementById("formulairePassword");
const inputPassword = document.getElementById("PasswordInput");
const inputValidatePassword = document.getElementById("ValidatePasswordInput");

// On récupère le token (en utilisant votre fonction existante)
function getToken() {
    return getCookie(tokenCookieName); // Assurez-vous que tokenCookieName est bien défini (ex: dans script.js)
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

if (formulairePassword) {
    formulairePassword.addEventListener("submit", async function(event) {
        // 1. Empêcher le rechargement de la page
        event.preventDefault();

        const token = getToken();

        if (!token) {
            window.location.href = "/signin";
            return;
        }

        // 2. Vérification que les mots de passe sont identiques
        if (inputPassword.value !== inputValidatePassword.value) {
            alert("Les mots de passe ne correspondent pas. Veuillez réessayer.");
            return;
        }

        // 3. Préparation des données pour l'API Symfony
        const passwordData = {
            password: inputPassword.value
        };

        try {
            // 4. Envoi des données (assurez-vous que apiUrl est bien défini dans script.js)
            const response = await fetch(apiUrl + "account/edit", {
                method: "PUT",
                headers: {
                    "X-AUTH-TOKEN": token,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(passwordData)
            });

            if (!response.ok) {
                throw new Error("Erreur lors de la mise à jour du mot de passe");
            }

            // 5. Gestion de la réponse 204 No Content de Symfony
            if (response.status === 204) {
                console.log("Mot de passe mis à jour avec succès !");
                alert("Votre mot de passe a bien été modifié !");
                
                // On vide les champs par sécurité
                inputPassword.value = ""; 
                inputValidatePassword.value = "";
                
                // Optionnel : on redirige vers le compte
                window.location.href = "/account";
            } else {
                alert("Votre mot de passe a été modifié !");
            }

        } catch (error) {
            console.error(error);
            alert("Une erreur est survenue lors du changement de mot de passe.");
        }
    });
}