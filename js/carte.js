document.addEventListener("DOMContentLoaded", () => {
    fetchMenus();
    fetchCategoriesEtPlats();
});

/**
 * Fonction utilitaire pour formater les prix reçus en centimes (ex: 2800 -> 28,00 €)
 */
function formatPrice(priceInCents) {
    if (priceInCents === null || priceInCents === undefined) return "0,00 €";
    const euros = (priceInCents / 100).toFixed(2);
    return euros.replace('.', ',') + " €";
}

/**
 * Fonction utilitaire pour sécuriser les chaînes injectées dans le DOM (Anti-XSS)
 */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Récupère les menus et génère dynamiquement les cartes Bootstrap
 */
async function fetchMenus() {
    const menusContainer = document.getElementById("menusContainer");
    if (!menusContainer) return;

    try {
        const response = await fetch(apiUrl + "menus");
        if (!response.ok) {
            throw new Error(`Erreur lors du chargement des menus (HTTP ${response.status})`);
        }

        const menus = await response.json();
        menusContainer.innerHTML = ""; // Vider le contenu statique

        if (menus.length === 0) {
            menusContainer.innerHTML = `<div class="col-12 text-center text-muted"><p>Aucun menu disponible pour le moment.</p></div>`;
            return;
        }

        menus.forEach(menu => {
            // Si le menu a une description, on l'affiche. Sinon, on liste le titre de ses plats rattachés.
            let descriptionText = escapeHtml(menu.description);
            if (!descriptionText && menu.foods && menu.foods.length > 0) {
                descriptionText = menu.foods.map(f => escapeHtml(f.title)).join(', ');
            }

            const menuCol = document.createElement("div");
            menuCol.className = "col-md-4";
            menuCol.innerHTML = `
                <div class="card h-100 shadow-sm menu-card">
                    <div class="card-body d-flex flex-column">
                        <h3 class="card-title">${escapeHtml(menu.title)}</h3>
                        <p class="card-text flex-grow-1">
                            ${descriptionText || 'Aucune description disponible'}
                        </p>
                        <p class="fw-bold fs-5 mb-0">${formatPrice(menu.price)}</p>
                    </div>
                </div>
            `;
            menusContainer.appendChild(menuCol);
        });

    } catch (error) {
        console.error("Erreur fetchMenus:", error);
        menusContainer.innerHTML = `<div class="col-12 text-center text-danger"><p>Impossible de charger les menus.</p></div>`;
    }
}

/**
 * Récupère les catégories et leurs plats associés pour générer la carte
 */
async function fetchCategoriesEtPlats() {
    const cartePlats = document.getElementById("cartePlats");
    if (!cartePlats) return;

    try {
        const response = await fetch(apiUrl + "categories");
        if (!response.ok) {
            throw new Error(`Erreur lors du chargement des catégories (HTTP ${response.status})`);
        }

        const categories = await response.json();
        cartePlats.innerHTML = ""; // Vider le contenu statique

        if (categories.length === 0) {
            cartePlats.innerHTML = `<p class="text-center text-muted">Aucune catégorie ou plat disponible pour le moment.</p>`;
            return;
        }

        categories.forEach(category => {
            // Ignorer les catégories sans plat
            if (!category.foods || category.foods.length === 0) {
                return;
            }

            const categoryBloc = document.createElement("div");
            categoryBloc.className = "mb-5 categorie-bloc";

            // En-tête de catégorie
            let categoryHTML = `<h3 class="border-bottom pb-2 mb-3">${escapeHtml(category.title)}</h3>`;
            categoryHTML += `<div class="row">`;

            // Génération de chaque plat
            category.foods.forEach(food => {
                categoryHTML += `
                    <div class="col-md-6 plat-item d-flex justify-content-between mb-3">
                        <div>
                            <h5 class="mb-1">${escapeHtml(food.title)}</h5>
                            <p class="text-muted mb-0">${escapeHtml(food.description)}</p>
                        </div>
                        <div class="ps-3 fw-bold text-nowrap">${formatPrice(food.price)}</div>
                    </div>
                `;
            });

            categoryHTML += `</div>`;
            categoryBloc.innerHTML = categoryHTML;

            cartePlats.appendChild(categoryBloc);
        });

    } catch (error) {
        console.error("Erreur fetchCategoriesEtPlats:", error);
        cartePlats.innerHTML = `<p class="text-center text-danger">Impossible de charger les plats à la carte.</p>`;
    }
}

fetchMenus();
fetchCategoriesEtPlats();