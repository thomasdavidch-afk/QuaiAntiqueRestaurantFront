const galerieImage = document.getElementById("allImages");

// Sécurité au cas où sanitizeHtml n'est pas définie ailleurs
if (typeof sanitizeHtml !== "function") {
    window.sanitizeHtml = function (str) {
        let temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    };
}

// Helper pour reconstruire l'URL absolue du fichier image
function getFullImageUrl(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    // Si apiUrl se termine par /api/, on nettoie pour obtenir la base (ex: http://127.0.0.1:8000)
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');
    return baseUrl + (path.startsWith('/') ? '' : '/') + path;
}

// ==========================================
// 1. CHARGEMENT DES IMAGES DEPUIS L'API
// ==========================================
function loadPictures() {
    fetch(apiUrl + "pictures")
        .then(response => {
            if (!response.ok) throw new Error("Erreur HTTP: " + response.status);
            return response.json();
        })
        .then(data => {
            const imagesFormattees = data.map(pic => ({
                uuid: pic.uuid,
                titre: pic.title,
                src: getFullImageUrl(pic.path)
            }));
            afficherGalerie(imagesFormattees);
        })
        .catch(error => console.error("Erreur lors du chargement des images :", error));
}

// Lancement direct
loadPictures();
attacherEvenementsModales();

function afficherGalerie(listeImages) {
    if (!galerieImage) return;

    galerieImage.innerHTML = "";

    listeImages.forEach(image => {
        galerieImage.innerHTML += getImage(image.uuid, image.titre, image.src);
    });

    if (typeof showAndHideElementsForRoles === "function") {
        showAndHideElementsForRoles();
    }
}

// ==========================================
// 2. PRÉPARATION DES MODALES (OUVERTURE)
// ==========================================
// Attachement du clic sur le bouton "Ajouter une photo"
const btnAjouterPhoto = document.getElementById("btnAjouterPhoto");
if (btnAjouterPhoto) {
    btnAjouterPhoto.addEventListener("click", function (e) {
        e.preventDefault();
        document.getElementById("NamePhotoInput").value = "";
        document.getElementById("ImageInput").value = "";
        document.getElementById("EditionPhotoModalLabel").innerText = "Ajouter une photo";

        const btnSave = document.getElementById("btnSavePhoto");
        if (btnSave) {
            btnSave.dataset.mode = "add";
        }

        const modalElement = document.getElementById('EditionPhotoModal');
        const myModal = bootstrap.Modal.getOrCreateInstance(modalElement);
        myModal.show();
    });
}

window.prepareEditModal = function(uuid, titre) {
    document.getElementById("NamePhotoInput").value = titre;
    document.getElementById("ImageInput").value = ""; // Réinitialise le champ fichier
    document.getElementById("EditionPhotoModalLabel").innerText = "Édition photo";

    const btnSave = document.getElementById("btnSavePhoto");
    if (btnSave) {
        btnSave.dataset.mode = "edit";
        btnSave.dataset.uuid = uuid;
    }

    const modalElement = document.getElementById('EditionPhotoModal');
    const myModal = bootstrap.Modal.getOrCreateInstance(modalElement);
    myModal.show();
};

window.prepareDeleteModal = function(uuid, titre, urlImage) {
    document.getElementById("DeletePhotoTitle").innerText = titre;
    document.getElementById("DeletePhotoImage").src = urlImage;

    const btnDelete = document.getElementById("btnConfirmDelete");
    if (btnDelete) {
        btnDelete.dataset.uuid = uuid;
    }

    const modalElement = document.getElementById('DeletePhotoModal');
    const myModal = bootstrap.Modal.getOrCreateInstance(modalElement);
    myModal.show();
};

function getImage(uuid, titre, urlImage) {
    const titreSanitise = sanitizeHtml(titre);
    const urlSanitisee = sanitizeHtml(urlImage);
    const titrePourJS = titreSanitise.replace(/'/g, "\\'").replace(/"/g, '\\"');

    return `
    <div class="col p-2">
        <div class="image-card text-white">
            <img src="${urlSanitisee}" class="rounded w-100" alt="${titreSanitise}"/>
            <p class="titre-image">${titreSanitise}</p>
            <div class="action-image-buttons" data-show="admin">
                <button type="button" class="btn btn-outline-light btn-sm" onclick="prepareEditModal('${uuid}', '${titrePourJS}')">
                    <i class="bi bi-pencil-square"></i>
                </button>
                <button type="button" class="btn btn-outline-light btn-sm" onclick="prepareDeleteModal('${uuid}', '${titrePourJS}', '${urlSanitisee}')">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    </div>`;
}

// ==========================================
// 3. ACTIONS VERS L'API (AJOUTER, MODIFIER & SUPPRIMER)
// ==========================================
function attacherEvenementsModales() {
    // Bouton de suppression
    const btnConfirmDelete = document.getElementById("btnConfirmDelete");
    if (btnConfirmDelete) {
        const newBtnConfirmDelete = btnConfirmDelete.cloneNode(true);
        btnConfirmDelete.parentNode.replaceChild(newBtnConfirmDelete, btnConfirmDelete);

        newBtnConfirmDelete.addEventListener("click", function () {
            const uuid = this.dataset.uuid; 
            const token = typeof getToken === "function" ? getToken() : null;

            fetch(apiUrl + "admin/pictures/" + uuid, {
                method: 'DELETE',
                headers: {
                    "X-AUTH-TOKEN": token,
                    "Accept": "application/json"
                }
            })
            .then(response => {
                if (response.ok || response.status === 204) {
                    const modalEl = document.getElementById('DeletePhotoModal');
                    const modalInstance = bootstrap.Modal.getInstance(modalEl);
                    if (modalInstance) modalInstance.hide();
                    loadPictures();
                } else {
                    alert("Erreur lors de la suppression");
                }
            })
            .catch(err => console.error("Erreur suppression :", err));
        });
    }

    // Clic sur le bouton Enregistrer (Ajout / Modif)
    const btnSavePhoto = document.getElementById("btnSavePhoto");
    if (btnSavePhoto) {
        const newBtnSavePhoto = btnSavePhoto.cloneNode(true);
        btnSavePhoto.parentNode.replaceChild(newBtnSavePhoto, btnSavePhoto);

        newBtnSavePhoto.addEventListener("click", function () {
            const titre = document.getElementById("NamePhotoInput").value;
            const fileInput = document.getElementById("ImageInput");
            const file = fileInput ? fileInput.files[0] : null;
            const mode = this.dataset.mode;
            const token = typeof getToken === "function" ? getToken() : null;

            if (!titre) {
                alert("Veuillez renseigner un titre.");
                return;
            }

            const headers = {
                'Accept': 'application/json'
            };
            if (token) {
                headers['X-AUTH-TOKEN'] = token;
            }

            if (mode === "add") {
                if (!file) {
                    alert("Veuillez sélectionner un fichier image.");
                    return;
                }

                const formData = new FormData();
                formData.append('title', titre);
                formData.append('image', file);

                fetch(apiUrl + "admin/pictures", {
                    method: 'POST',
                    headers: headers,
                    body: formData
                })
                .then(async response => {
                    if (response.ok || response.status === 201) {
                        document.getElementById("NamePhotoInput").value = "";
                        fileInput.value = "";

                        const modalEl = document.getElementById('EditionPhotoModal');
                        const modalInstance = bootstrap.Modal.getInstance(modalEl);
                        if (modalInstance) modalInstance.hide();

                        loadPictures();
                    } else {
                        const err = await response.json();
                        alert("Erreur lors de l'ajout : " + (err.message || err.error || "Erreur serveur"));
                    }
                })
                .catch(err => {
                    console.error("Erreur d'envoi :", err);
                    alert("Une erreur est survenue lors de l'envoi.");
                });
            } 
            else if (mode === "edit") {
                const uuid = this.dataset.uuid;
                const formData = new FormData();
                formData.append('title', titre);

                // Si une nouvelle image est sélectionnée, on l'ajoute
                if (file) {
                    formData.append('image', file);
                }

                fetch(apiUrl + "admin/pictures/" + uuid, {
                    method: 'POST',
                    headers: headers,
                    body: formData
                })
                .then(async response => {
                    if (response.ok) {
                        document.getElementById("NamePhotoInput").value = "";
                        if (fileInput) fileInput.value = "";

                        const modalEl = document.getElementById('EditionPhotoModal');
                        const modalInstance = bootstrap.Modal.getInstance(modalEl);
                        if (modalInstance) modalInstance.hide();

                        loadPictures();
                    } else {
                        const err = await response.json();
                        alert("Erreur lors de la modification : " + (err.message || err.error || "Erreur serveur"));
                    }
                })
                .catch(err => {
                    console.error("Erreur de modification :", err);
                    alert("Une erreur est survenue lors de la modification.");
                });
            }
        });
    }
}