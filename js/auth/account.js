const formulaireCompte = document.getElementById("formulaireCompte");
const inputNom = document.getElementById("NomInput");
const inputPrenom = document.getElementById("PrenomInput");
const inputAllergies = document.getElementById("AllergiesInput");
const inputConvives = document.getElementById("ConvivesInput");

// Éléments du formulaire d'administration du restaurant
const formRestaurantInfo = document.getElementById("formRestaurantInfo");
const inputMaxConvives = document.getElementById("maxConvives");
const inputHoraireMidi = document.getElementById("horaireMidi");
const inputHoraireSoir = document.getElementById("horaireSoir");

// Conteneur de la liste des plats (s'adaptera s'il s'appelle listePlats ou foodsContainer)
const containerPlats = document.getElementById("listePlats") || document.getElementById("foodsContainer");

// Variable globale pour stocker l'ID du restaurant à modifier
let currentRestaurantId = null;

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

// Fonction pour récupérer les infos de l'utilisateur connecté
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

        if (inputNom) inputNom.value = user.lastName ?? "";
        if (inputPrenom) inputPrenom.value = user.firstName ?? "";
        if (inputAllergies) inputAllergies.value = user.allergy ?? "";
        if (inputConvives) inputConvives.value = user.guestNumber ?? "";

        // Si l'utilisateur a le rôle admin, on charge la config du restaurant ET la liste des plats
        if (typeof isConnected === "function" && isConnected() && getRole() === "admin") {
            await getRestaurantConfig();
            await getFoods(); // <-- Chargement des plats
        }

    } catch (error) {
        console.error(error);
    }
}

// Initialisation
if (typeof showAndHideElementsForRoles === "function") {
    showAndHideElementsForRoles();
}
getInfosUser();

// On écoute la soumission du formulaire compte utilisateur
if (formulaireCompte) {
    formulaireCompte.addEventListener("submit", async function(event) {
        event.preventDefault();

        const token = getToken();

        if (!token) {
            window.location.href = "/signin";
            return;
        }

        const userData = {
            lastName: inputNom.value,
            firstName: inputPrenom.value,
            allergy: inputAllergies.value,
            guestNumber: parseInt(inputConvives.value) || 0 
        };

        try {
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

            if (response.status === 204) {
                console.log("Mise à jour réussie avec succès (204 No Content) !");
                alert("Vos informations ont bien été mises à jour !");
            } else {
                const result = await response.text();
                console.log("Mise à jour réussie :", result ? JSON.parse(result) : "Aucun contenu");
                alert("Vos informations ont bien été mises à jour !");
            }

        } catch (error) {
            console.error(error);
            alert("Une erreur est survenue lors de la mise à jour.");
        }
    });
}

// =========================================================================
// PARTIE ADMINISTRATION : Horaires & Capacité du restaurant
// =========================================================================

// Récupérer la configuration actuelle du restaurant
async function getRestaurantConfig() {
    const token = getToken();

    const headers = {
        "Accept": "application/json"
    };

    if (token) {
        headers["X-AUTH-TOKEN"] = token;
    }

    try {
        const response = await fetch(apiUrl + "restaurant/config", {
            method: "GET",
            headers: headers
        });

        if (response.ok) {
            const config = await response.json();

            currentRestaurantId = config.id;

            if (inputMaxConvives) inputMaxConvives.value = config.maxConvives ?? config.maxGuest ?? "";
            if (inputHoraireMidi) inputHoraireMidi.value = config.horaireMidi ?? config.amOpeningTime ?? "";
            if (inputHoraireSoir) inputHoraireSoir.value = config.horaireSoir ?? config.pmOpeningTime ?? "";
        } else {
            console.error("Erreur HTTP lors de la récupération de la config :", response.status);
        }
    } catch (error) {
        console.error("Erreur lors de la récupération de la configuration :", error);
    }
}

// Mettre à jour la configuration du restaurant
if (formRestaurantInfo) {
    formRestaurantInfo.addEventListener("submit", async function(event) {
        event.preventDefault();

        const token = getToken();

        if (!token) {
            window.location.href = "/signin";
            return;
        }

        if (!currentRestaurantId) {
            alert("Aucun restaurant à modifier en base de données.");
            return;
        }

        const configData = {
            maxGuest: parseInt(inputMaxConvives.value) || 0,
            amOpeningTime: inputHoraireMidi.value,
            pmOpeningTime: inputHoraireSoir.value
        };

        try {
            const response = await fetch(apiUrl + "restaurant/" + currentRestaurantId, {
                method: "PUT",
                headers: {
                    "X-AUTH-TOKEN": token,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(configData)
            });

            if (!response.ok) {
                throw new Error("Erreur lors de la mise à jour de la configuration");
            }

            alert("Les informations du restaurant ont été mises à jour avec succès !");

        } catch (error) {
            console.error(error);
            alert("Erreur lors de la mise à jour des informations du restaurant.");
        }
    });
}

// =========================================================================
// PARTIE ADMINISTRATION : Gestion des Plats
// =========================================================================

// Récupérer la liste des plats depuis l'API
async function getFoods() {
    const token = getToken();

    const headers = {
        "Accept": "application/json"
    };

    if (token) {
        headers["X-AUTH-TOKEN"] = token;
    }

    try {
        const response = await fetch(apiUrl + "card", {
            method: "GET",
            headers: headers
        });

        if (response.ok) {
            const categories = await response.json();
            console.log("Données de la carte reçues :", categories);
            renderFoodsList(categories);
        } else {
            console.error("Erreur lors du chargement des plats, statut :", response.status);
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des plats :", error);
    }
}

// Fonction d'affichage dynamique des plats dans le DOM
function renderFoodsList(categories) {
    const targetContainer = document.getElementById("listePlats") || document.getElementById("foodsContainer");

    if (!targetContainer) {
        console.warn("Aucun conteneur HTML trouvé pour afficher la liste des plats.");
        return;
    }

    targetContainer.innerHTML = "";

    if (!categories || categories.length === 0) {
        targetContainer.innerHTML = "<p class='text-light mt-3'>Aucune catégorie disponible pour le moment.</p>";
        return;
    }

    let html = "<div class='mt-3'>";

    categories.forEach(category => {
        html += `
            <div class="category-block mb-4 p-3 bg-secondary rounded text-white">
                <h4 class="border-bottom border-warning pb-2 text-warning">${category.title || category.name || "Catégorie"}</h4>
        `;

        const foods = category.foods || [];

        if (foods.length === 0) {
            html += "<p class='text-light small fst-italic'>Aucun plat dans cette catégorie.</p>";
        } else {
            html += "<div class='row mt-3'>";

            foods.forEach(food => {
                const rawPrice = Number(food.price) || 0;
                const priceFormatted = (rawPrice / 100).toFixed(2);
                const foodIdentifier = food.uuid || food.id;

                html += `
                    <div class="col-md-6 col-lg-4 mb-3">
                        <div class="card h-100 shadow-sm bg-dark text-white border-light">
                            <div class="card-body d-flex flex-column justify-content-between">
                                <div>
                                    <h5 class="card-title d-flex justify-content-between align-items-center">
                                        <span>${food.title || "Plat sans nom"}</span>
                                        <span class="badge bg-warning text-dark">${priceFormatted} €</span>
                                    </h5>
                                    <p class="card-text text-light small mt-2 opacity-75">${food.description || ""}</p>
                                </div>
                                <div class="text-end mt-3 border-top pt-2 border-secondary d-flex justify-content-end gap-2">
                                    <button class="btn btn-sm btn-outline-warning edit-food-btn" 
                                            data-id="${foodIdentifier}"
                                            data-title="${food.title || ''}"
                                            data-price="${priceFormatted}"
                                            data-description="${food.description || ''}">
                                        <i class="bi bi-pencil"></i> Modifier
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger delete-food-btn" data-id="${foodIdentifier}">
                                        <i class="bi bi-trash"></i> Supprimer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            html += "</div>";
        }

        html += "</div>";
    });

    html += "</div>";

    targetContainer.innerHTML = html;

    // Événement : Bouton Supprimer
    targetContainer.querySelectorAll(".delete-food-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const foodId = e.currentTarget.getAttribute("data-id");
            if (confirm("Voulez-vous vraiment supprimer ce plat ?")) {
                await deleteFood(foodId);
            }
        });
    });

    // Événement : Bouton Modifier (Ouverture du modal avec pré-remplissage)
    targetContainer.querySelectorAll(".edit-food-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const button = e.currentTarget;
            document.getElementById("editFoodId").value = button.getAttribute("data-id");
            document.getElementById("editFoodTitle").value = button.getAttribute("data-title");
            document.getElementById("editFoodPrice").value = button.getAttribute("data-price");
            document.getElementById("editFoodDescription").value = button.getAttribute("data-description");

            const modalElement = document.getElementById("editFoodModal");
            const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
            modal.show();
        });
    });
}

// Soumission du formulaire du Modal de Modification
const editFoodForm = document.getElementById("editFoodForm");
if (editFoodForm) {
    editFoodForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const foodId = document.getElementById("editFoodId").value;
        const title = document.getElementById("editFoodTitle").value;
        const priceInEuros = parseFloat(document.getElementById("editFoodPrice").value) || 0;
        const description = document.getElementById("editFoodDescription").value;

        // Conversion du prix en centimes pour l'API (ex: 9.50 € -> 950)
        const priceInCents = Math.round(priceInEuros * 100);

        const payload = {
            title: title,
            price: priceInCents,
            description: description
        };

        await updateFood(foodId, payload);
    });
}

// Fonction d'appel à l'API pour modifier un plat
async function updateFood(foodId, payload) {
    const token = getToken();

    if (!token) {
        window.location.href = "/signin";
        return;
    }

    try {
        const response = await fetch(apiUrl + "food/" + foodId, {
            method: "PUT",
            headers: {
                "X-AUTH-TOKEN": token,
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Plat modifié avec succès !");

            // Fermeture du Modal
            const modalElement = document.getElementById("editFoodModal");
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();

            // Rafraîchir les plats
            getFoods();
        } else {
            alert("Erreur lors de la modification du plat.");
        }
    } catch (error) {
        console.error("Erreur réseau :", error);
        alert("Erreur lors de la connexion au serveur.");
    }
}

// Fonction d'appel à l'API pour supprimer un plat
async function deleteFood(foodId) {
    const token = getToken();

    if (!token) {
        window.location.href = "/signin";
        return;
    }

    try {
        const response = await fetch(apiUrl + "food/" + foodId, {
            method: "DELETE",
            headers: {
                "X-AUTH-TOKEN": token,
                "Accept": "application/json"
            }
        });

        if (response.ok) {
            alert("Plat supprimé avec succès !");
            getFoods();
        } else {
            alert("Erreur lors de la suppression du plat.");
        }
    } catch (error) {
        console.error("Erreur réseau :", error);
        alert("Erreur lors de la connexion au serveur.");
    }
}