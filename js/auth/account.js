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

// Conteneur de la liste des plats
const containerPlats = document.getElementById("listePlats") || document.getElementById("foodsContainer");

// Variable globale pour stocker l'ID du restaurant à modifier
let currentRestaurantId = null;

// Variable globale pour stocker la liste de TOUS les plats enregistrés en BDD
let allAvailableFoods = [];

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

        // Si l'utilisateur a le rôle admin, on charge la config, les plats ET les menus
        if (typeof isConnected === "function" && isConnected() && getRole() === "admin") {
            await getRestaurantConfig();
            await getFoods(); // Chargement des plats et catégories (qui alimente aussi les <select> des menus)
            await getMenus(); // Chargement des menus
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
// PARTIE ADMINISTRATION : Gestion des Plats & Catégories
// =========================================================================

// Récupérer la liste des plats et catégories depuis l'API
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

            // Remplir le tableau global de tous les plats
            allAvailableFoods = [];
            categories.forEach(cat => {
                if (cat.foods && Array.isArray(cat.foods)) {
                    cat.foods.forEach(food => {
                        allAvailableFoods.push({
                            ...food,
                            categoryTitle: cat.title || cat.name || ""
                        });
                    });
                }
            });

            renderFoodsList(categories);
            populateCategorySelect(categories);
            populateMenuFoodSelects(); // Alimente les déroulants de création / modification de menu
        } else {
            console.error("Erreur lors du chargement des plats, statut :", response.status);
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des plats :", error);
    }
}

// Remplit le menu déroulant des catégories dans le formulaire d'ajout de plat
function populateCategorySelect(categories) {
    const select = document.getElementById("addDishCategorySelect");
    if (!select) return;

    select.innerHTML = '<option value="">-- Choisissez une catégorie --</option>';

    categories.forEach(category => {
        const categoryId = category.id !== undefined ? category.id : category.uuid;
        const option = document.createElement("option");
        option.value = categoryId;
        option.textContent = category.title || category.name;
        select.appendChild(option);
    });
}

// Alimente les <select> de choix de plats dans les modales des menus
function populateMenuFoodSelects() {
    const selectIds = [
        "addMenuEntreeSelect", "addMenuPlatSelect", "addMenuDessertSelect",
        "editMenuEntreeSelect", "editMenuPlatSelect", "editMenuDessertSelect"
    ];

    selectIds.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;

        const currentValue = select.value;
        let defaultLabel = "-- Sélectionner un élément --";
        if (id.includes("Entree")) defaultLabel = "-- Sélectionner une entrée --";
        if (id.includes("Plat")) defaultLabel = "-- Sélectionner un plat principal --";
        if (id.includes("Dessert")) defaultLabel = "-- Sélectionner un dessert --";

        select.innerHTML = `<option value="">${defaultLabel}</option>`;

        allAvailableFoods.forEach(food => {
            const option = document.createElement("option");
            // On stocke l'UUID de la food comme valeur
            option.value = food.uuid || food.id; 
            option.textContent = `${food.title}${food.categoryTitle ? ' (' + food.categoryTitle + ')' : ''}`;
            select.appendChild(option);
        });

        if (currentValue) select.value = currentValue;
    });
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
                const priceFormatted = (rawPrice > 100 ? rawPrice / 100 : rawPrice).toFixed(2);
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

    // Événement : Bouton Supprimer plat
    targetContainer.querySelectorAll(".delete-food-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const foodId = e.currentTarget.getAttribute("data-id");
            if (confirm("Voulez-vous vraiment supprimer ce plat ?")) {
                await deleteFood(foodId);
            }
        });
    });

    // Événement : Bouton Modifier plat
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

// -------------------------------------------------------------------------
// GESTION ET AFFICHAGE DES CATÉGORIES DANS LA MODALE
// -------------------------------------------------------------------------

async function loadCategoriesInModal() {
    const listContainer = document.getElementById("categoriesList");
    if (!listContainer) return;

    listContainer.innerHTML = '<li class="list-group-item bg-secondary text-white border-dark text-center">Chargement...</li>';

    try {
        const response = await fetch(apiUrl + "categories", {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) throw new Error("Erreur lors de la récupération des catégories");

        const categories = await response.json();
        listContainer.innerHTML = "";

        if (categories.length === 0) {
            listContainer.innerHTML = '<li class="list-group-item bg-secondary text-white border-dark text-center">Aucune catégorie existante.</li>';
            return;
        }

        categories.forEach(category => {
            const categoryIdentifier = category.uuid || category.id;
            const li = document.createElement("li");
            li.className = "list-group-item bg-secondary text-white border-dark d-flex justify-content-between align-items-center mb-2 rounded";
            li.innerHTML = `
                <span class="fw-bold">${category.title || category.name}</span>
                <button type="button" class="btn btn-outline-danger btn-sm delete-category-btn" data-id="${categoryIdentifier}">
                    <i class="bi bi-trash"></i> Supprimer
                </button>
            `;
            listContainer.appendChild(li);
        });

        listContainer.querySelectorAll(".delete-category-btn").forEach(btn => {
            btn.addEventListener("click", function() {
                const categoryId = this.getAttribute("data-id");
                deleteCategory(categoryId);
            });
        });

    } catch (error) {
        console.error(error);
        listContainer.innerHTML = '<li class="list-group-item bg-danger text-white text-center">Impossible de charger les catégories.</li>';
    }
}

async function deleteCategory(identifier) {
    if (!confirm("Voulez-vous vraiment supprimer cette catégorie ? (Les plats associés pourraient être impactés)")) {
        return;
    }

    const token = getToken();
    if (!token) {
        window.location.href = "/signin";
        return;
    }

    try {
        const response = await fetch(apiUrl + "categories/" + identifier, {
            method: "DELETE",
            headers: {
                "X-AUTH-TOKEN": token,
                "Accept": "application/json"
            }
        });

        if (response.ok || response.status === 204) {
            loadCategoriesInModal();
            getFoods();
        } else {
            const errorData = await response.json().catch(() => null);
            alert("Erreur : " + (errorData?.message || "Impossible de supprimer la catégorie."));
        }
    } catch (error) {
        console.error("Erreur lors de la suppression :", error);
        alert("Erreur de connexion lors de la suppression de la catégorie.");
    }
}

const categoryModalEl = document.getElementById('categoryModal');
if (categoryModalEl) {
    categoryModalEl.addEventListener('show.bs.modal', function () {
        loadCategoriesInModal();
    });
}

// Soumission Ajouter une Catégorie
const formAddCategory = document.getElementById("formAddCategory");
if (formAddCategory) {
    formAddCategory.addEventListener("submit", async function (e) {
        e.preventDefault();

        const token = getToken();
        if (!token) {
            window.location.href = "/signin";
            return;
        }

        const categoryTitle = document.getElementById("addCategoryTitle").value.trim();

        if (!categoryTitle) return;

        try {
            const response = await fetch(apiUrl + "categories", {
                method: "POST",
                headers: {
                    "X-AUTH-TOKEN": token,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ title: categoryTitle })
            });

            if (response.ok || response.status === 201) {
                document.getElementById("addCategoryTitle").value = "";
                loadCategoriesInModal();
                getFoods();
            } else {
                alert("Erreur lors de la création de la catégorie.");
            }
        } catch (error) {
            console.error("Erreur réseau :", error);
        }
    });
}

// Soumission Ajouter un Plat
const formAddFood = document.getElementById("formAddFood");
if (formAddFood) {
    formAddFood.addEventListener("submit", async function (e) {
        e.preventDefault();

        const token = getToken();
        if (!token) {
            window.location.href = "/signin";
            return;
        }

        const title = document.getElementById("addDishTitle").value;
        const priceInput = document.getElementById("addDishPrice").value.replace(",", ".");
        const priceEuros = parseFloat(priceInput) || 0;
        const priceCents = Math.round(priceEuros * 100);

        const rawCategoryValue = document.getElementById("addDishCategorySelect").value;
        const categoryId = !isNaN(rawCategoryValue) ? parseInt(rawCategoryValue, 10) : rawCategoryValue;

        const description = document.getElementById("addDishDescription").value;

        const payload = {
            title: title,
            price: priceCents,
            category_id: categoryId,
            category: categoryId,
            description: description
        };

        try {
            const response = await fetch(apiUrl + "card/foods", {
                method: "POST",
                headers: {
                    "X-AUTH-TOKEN": token,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Plat ajouté avec succès !");
                formAddFood.reset();

                const modalEl = document.getElementById("dishModal");
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();

                getFoods();
            } else {
                const errorData = await response.json().catch(() => null);
                alert("Erreur lors de l'ajout : " + (errorData?.message || "Erreur serveur"));
            }
        } catch (error) {
            console.error("Erreur réseau :", error);
        }
    });
}

// Soumission Modifier un Plat
const editFoodForm = document.getElementById("editFoodForm");
if (editFoodForm) {
    editFoodForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const foodId = document.getElementById("editFoodId").value;
        const title = document.getElementById("editFoodTitle").value;
        const priceInEuros = parseFloat(document.getElementById("editFoodPrice").value) || 0;
        const description = document.getElementById("editFoodDescription").value;

        const priceInCents = Math.round(priceInEuros * 100);

        const payload = {
            title: title,
            price: priceInCents,
            description: description
        };

        await updateFood(foodId, payload);
    });
}

async function updateFood(foodId, payload) {
    const token = getToken();

    if (!token) {
        window.location.href = "/signin";
        return;
    }

    try {
        const response = await fetch(apiUrl + "card/foods/" + foodId, {
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

            const modalElement = document.getElementById("editFoodModal");
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();

            getFoods();
        } else {
            alert("Erreur lors de la modification du plat.");
        }
    } catch (error) {
        console.error("Erreur réseau :", error);
        alert("Erreur lors de la connexion au serveur.");
    }
}

async function deleteFood(foodId) {
    const token = getToken();

    if (!token) {
        window.location.href = "/signin";
        return;
    }

    try {
        const response = await fetch(apiUrl + "card/foods/" + foodId, {
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

// =========================================================================
// PARTIE ADMINISTRATION : Gestion des Menus
// =========================================================================

async function getMenus() {
    const token = getToken();

    const headers = {
        "Accept": "application/json"
    };

    if (token) {
        headers["X-AUTH-TOKEN"] = token;
    }

    try {
        const response = await fetch(apiUrl + "menus", {
            method: "GET",
            headers: headers
        });

        if (response.ok) {
            const menus = await response.json();
            console.log("Données des menus reçues :", menus);
            renderMenuList(menus);
        } else {
            console.error("Erreur HTTP lors de la récupération des menus :", response.status);
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des menus :", error);
    }
}

function renderMenuList(menus) {
    const container = document.getElementById("adminMenuList");
    if (!container) return;

    container.innerHTML = "";

    if (!menus || menus.length === 0) {
        container.innerHTML = "<p class='text-light italic'>Aucun menu disponible pour le moment.</p>";
        return;
    }

    let html = "<div class='row'>";

    menus.forEach(menu => {
        const rawPrice = Number(menu.price) || 0;
        const priceFormatted = (rawPrice > 100 ? rawPrice / 100 : rawPrice).toFixed(2);
        const menuIdentifier = menu.uuid || menu.id;

        const starter = menu.starter || menu.entree || "Entrée non spécifiée";
        const mainCourse = menu.mainCourse || menu.plat || "Plat principal non spécifié";
        const dessert = menu.dessert || "Dessert non spécifié";

        html += `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100 bg-secondary text-white border-light shadow">
                    <div class="card-header border-bottom border-warning d-flex justify-content-between align-items-center">
                        <h5 class="mb-0 text-warning">${menu.title || "Menu sans nom"}</h5>
                        <span class="badge bg-warning text-dark fs-6">${priceFormatted} €</span>
                    </div>
                    <div class="card-body">
                        <ul class="list-unstyled mb-0">
                            <li class="mb-2"><strong><i class="bi bi-egg-fried me-1"></i> Entrée :</strong> ${starter}</li>
                            <li class="mb-2"><strong><i class="bi bi-pie-chart-fill me-1"></i> Plat :</strong> ${mainCourse}</li>
                            <li><strong><i class="bi bi-cup-hot-fill me-1"></i> Dessert :</strong> ${dessert}</li>
                        </ul>
                    </div>
                    <div class="card-footer border-top border-dark d-flex justify-content-end gap-2">
                        <button class="btn btn-sm btn-outline-warning edit-menu-btn"
                                data-id="${menuIdentifier}"
                                data-title="${menu.title || ''}"
                                data-price="${priceFormatted}"
                                data-starter="${starter}"
                                data-main="${mainCourse}"
                                data-dessert="${dessert}">
                            <i class="bi bi-pencil"></i> Modifier
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-menu-btn" data-id="${menuIdentifier}">
                            <i class="bi bi-trash"></i> Supprimer
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    html += "</div>";
    container.innerHTML = html;

    // Événement : Bouton Supprimer un menu
    container.querySelectorAll(".delete-menu-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const menuId = e.currentTarget.getAttribute("data-id");
            if (confirm("Voulez-vous vraiment supprimer ce menu ?")) {
                await deleteMenu(menuId);
            }
        });
    });

    // Événement : Bouton Modifier un menu
    container.querySelectorAll(".edit-menu-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const button = e.currentTarget;
            document.getElementById("editMenuId").value = button.getAttribute("data-id");
            document.getElementById("editMenuTitle").value = button.getAttribute("data-title");
            document.getElementById("editMenuPrice").value = button.getAttribute("data-price");

            const selectEntree = document.getElementById("editMenuEntreeSelect");
            const selectPlat = document.getElementById("editMenuPlatSelect");
            const selectDessert = document.getElementById("editMenuDessertSelect");

            if (selectEntree) selectEntree.value = button.getAttribute("data-starter");
            if (selectPlat) selectPlat.value = button.getAttribute("data-main");
            if (selectDessert) selectDessert.value = button.getAttribute("data-dessert");

            const modalElement = document.getElementById("editMenuModal");
            const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
            modal.show();
        });
    });
}

// -------------------------------------------------------------------------
// SOUMISSION : AJOUTER UN MENU
// -------------------------------------------------------------------------
const formAddMenu = document.getElementById("formAddMenu");
if (formAddMenu) {
    formAddMenu.addEventListener("submit", async function (e) {
        e.preventDefault();

        const token = getToken();
        if (!token) return window.location.href = "/signin";

        if (!currentRestaurantId) {
            alert("Impossible de créer le menu : Identifiant du restaurant indisponible.");
            return;
        }

        const title = document.getElementById("addMenuTitle").value;
        const priceInput = document.getElementById("addMenuPrice").value.replace(",", ".");
        const priceEuros = parseFloat(priceInput) || 0;
        const priceCents = Math.round(priceEuros * 100);

        const starterUuid = document.getElementById("addMenuEntreeSelect").value;
        const mainUuid = document.getElementById("addMenuPlatSelect").value;
        const dessertUuid = document.getElementById("addMenuDessertSelect").value;

        // Construire le tableau des UUIDs de plats sélectionnés
        const foodUuids = [starterUuid, mainUuid, dessertUuid].filter(uuid => uuid !== "");

        const payload = {
            title: title,
            price: priceCents,
            restaurantUuid: currentRestaurantId,
            foodUuids: foodUuids
        };

        try {
            const response = await fetch(apiUrl + "admin/menus", {
                method: "POST",
                headers: {
                    "X-AUTH-TOKEN": token,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (response.ok || response.status === 201) {
                alert("Menu créé avec succès !");
                formAddMenu.reset();

                const modalEl = document.getElementById("menuModal");
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();

                getMenus();
            } else {
                const errorData = await response.json().catch(() => null);
                alert("Erreur lors de la création : " + (errorData?.error || errorData?.message || "Erreur serveur"));
            }
        } catch (error) {
            console.error("Erreur réseau :", error);
            alert("Erreur de connexion lors de la création du menu.");
        }
    });
}

// -------------------------------------------------------------------------
// SOUMISSION : MODIFIER UN MENU
// -------------------------------------------------------------------------
const editMenuForm = document.getElementById("editMenuForm");
if (editMenuForm) {
    editMenuForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const menuUuid = document.getElementById("editMenuId").value;
        const title = document.getElementById("editMenuTitle").value;
        const priceInput = document.getElementById("editMenuPrice").value.replace(",", ".");
        const priceEuros = parseFloat(priceInput) || 0;
        const priceCents = Math.round(priceEuros * 100);

        const starterUuid = document.getElementById("editMenuEntreeSelect").value;
        const mainUuid = document.getElementById("editMenuPlatSelect").value;
        const dessertUuid = document.getElementById("editMenuDessertSelect").value;

        const foodUuids = [starterUuid, mainUuid, dessertUuid].filter(uuid => uuid !== "");

        const payload = {
            title: title,
            price: priceCents,
            foodUuids: foodUuids
        };

        await updateMenu(menuUuid, payload);
    });
}

async function updateMenu(menuUuid, payload) {
    const token = getToken();

    if (!token) {
        window.location.href = "/signin";
        return;
    }

    try {
        const response = await fetch(apiUrl + "admin/menus/" + menuUuid, {
            method: "PUT",
            headers: {
                "X-AUTH-TOKEN": token,
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Menu modifié avec succès !");

            const modalElement = document.getElementById("editMenuModal");
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();

            getMenus();
        } else {
            const errorData = await response.json().catch(() => null);
            alert("Erreur : " + (errorData?.error || "Erreur lors de la modification du menu."));
        }
    } catch (error) {
        console.error("Erreur réseau :", error);
        alert("Erreur de connexion lors de la modification du menu.");
    }
}

async function deleteMenu(menuUuid) {
    const token = getToken();

    if (!token) {
        window.location.href = "/signin";
        return;
    }

    try {
        const response = await fetch(apiUrl + "admin/menus/" + menuUuid, {
            method: "DELETE",
            headers: {
                "X-AUTH-TOKEN": token,
                "Accept": "application/json"
            }
        });

        if (response.ok || response.status === 204) {
            alert("Menu supprimé avec succès !");
            getMenus();
        } else {
            alert("Erreur lors de la suppression du menu.");
        }
    } catch (error) {
        console.error("Erreur réseau :", error);
        alert("Erreur de connexion lors de la suppression du menu.");
    }
}