const galerieImage = document.getElementById("allImages");

// Exemple de données d'images (pouvant venir plus tard d'une API ou d'une base de données)
const imagesData = [
    {
        id: 1,
        titre: "Lasagnes à la bolognese",
        src: "../images/food.jpg"
    }
];

// Affichage initial de la galerie
afficherGalerie(imagesData);

/**
 * Génère et affiche toutes les images dans le conteneur
 * @param {Array} listeImages 
 */
function afficherGalerie(listeImages) {
    galerieImage.innerHTML = "";

    listeImages.forEach(image => {
        galerieImage.innerHTML += getImage(image.id, image.titre, image.src);
    });

    // Appliquer le contrôle d'accès visuel (masque les éléments `data-show="admin"` pour les non-admins)
    if (typeof showAndHideElementsForRoles === "function") {
        showAndHideElementsForRoles();
    }
}

/**
 * Génère le composant HTML pour une image
 * @param {number|string} id 
 * @param {string} titre 
 * @param {string} urlImage 
 * @returns {string} HTML de la carte d'image
 */
function getImage(id, titre, urlImage) {
    // Sanitisation des données pour prévenir toute injection XSS
    const titreSanitise = sanitizeHtml(titre);
    const urlSanitisee = sanitizeHtml(urlImage);

    return `
    <div class="col p-2">
        <div class="image-card text-white">
            <img src="${urlSanitisee}" class="rounded w-100" alt="${titreSanitise}"/>
            <p class="titre-image">${titreSanitise}</p>
            <div class="action-image-buttons" data-show="admin">
                <button type="button" class="btn btn-outline-light btn-sm" data-bs-toggle="modal" data-bs-target="#EditionPhotoModal" onclick="prepareEditModal(${id}, '${titreSanitise}')">
                    <i class="bi bi-pencil-square"></i>
                </button>
                <button type="button" class="btn btn-outline-light btn-sm" data-bs-toggle="modal" data-bs-target="#DeletePhotoModal" onclick="prepareDeleteModal(${id})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    </div>`;
}

// Fonctions utilitaires pour préremplir les modales lors d'un clic admin
function prepareEditModal(id, titre) {
    const inputTitre = document.getElementById("NamePhotoInput");
    if (inputTitre) {
        inputTitre.value = titre;
    }
}

function prepareDeleteModal(id) {
    // Logique pour passer l'ID de la photo à supprimer à la modale
}