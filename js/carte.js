// js/carte.js (squelette)
document.addEventListener("DOMContentLoaded", () => {
    fetchMenus();
    fetchCategoriesEtPlats();
});

async function fetchMenus() {
    // GET /api/menus
    // Générer dynamiquement les 3 cards dans #menusContainer
}

async function fetchCategoriesEtPlats() {
    // GET /api/categories (avec plats inclus ou GET /api/plats séparé)
    // Générer dynamiquement les blocs .categorie-bloc dans #cartePlats
}