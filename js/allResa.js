const reservationsContainer = document.getElementById("reservationsContainer");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const adminFilterContainer = document.getElementById("adminFilterContainer");
const filterDateInput = document.getElementById("filterDateInput");
const resetFilterBtn = document.getElementById("resetFilterBtn");
const pageTitle = document.getElementById("pageTitle");

let bookingUuidToDelete = null;
let isAdminUser = false;

// Initialisation
initPage();

async function initPage() {
    const token = getToken();
    if (!token) {
        if (reservationsContainer) {
            reservationsContainer.innerHTML = "<p class='text-center my-4'>Vous devez être connecté pour voir vos réservations.</p>";
        }
        return;
    }

    // Récupération des infos utilisateur
    try {
        const response = await fetch(apiUrl + "account/me", {
            method: "GET",
            headers: {
                "X-AUTH-TOKEN": token,
                "Accept": "application/json"
            }
        });

        if (response.ok) {
            const user = await response.json();
            console.log("Données de l'utilisateur /me :", user);

            // 1. Récupération des rôles s'ils existent dans une propriété (roles, role, etc.)
            const roles = user.roles || (user.role ? [user.role] : []);
            
            // 2. Détection de l'admin (soit via les rôles, soit via l'email "admin@email.com")
            const isRoleAdmin = roles.includes("ROLE_ADMIN") || roles.includes("ROLE_RESTAURATEUR");
            const isEmailAdmin = user.email && user.email.toLowerCase().includes("admin");

            isAdminUser = isRoleAdmin || isEmailAdmin;
            console.log("Est Admin ?", isAdminUser);
        } else {
            console.warn("Impossible de récupérer les informations de l'utilisateur.");
            isAdminUser = false;
        }
    } catch (error) {
        console.error("Erreur lors de la vérification de l'utilisateur :", error);
        isAdminUser = false;
    }

    // Configuration de l'affichage selon le rôle
    if (isAdminUser) {
        if (pageTitle) pageTitle.textContent = "Gestion des réservations";
        if (adminFilterContainer) adminFilterContainer.classList.remove("d-none");

        if (filterDateInput) {
            filterDateInput.value = ""; 
            filterDateInput.addEventListener("change", fetchBookings);
        }

        if (resetFilterBtn) {
            resetFilterBtn.addEventListener("click", () => {
                if (filterDateInput) filterDateInput.value = "";
                fetchBookings();
            });
        }
    } else {
        if (pageTitle) pageTitle.textContent = "Vos réservations";
        if (adminFilterContainer) adminFilterContainer.classList.add("d-none");
    }

    // Chargement des réservations après la vérification du rôle
    fetchBookings();
}

async function fetchBookings() {
    const token = getToken();
    if (!token) return;

    let url = apiUrl + "booking";

    // Si admin ET qu'une date est renseignée dans le champ filtre, on l'ajoute à l'URL
    if (isAdminUser && filterDateInput && filterDateInput.value) {
        url += `?date=${filterDateInput.value}`;
    }

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "X-AUTH-TOKEN": token, 
                "Accept": "application/json"
            }
        });

        if (response.ok) {
            const bookings = await response.json();
            displayBookings(bookings);
        } else {
            reservationsContainer.innerHTML = "<p class='text-center my-4'>Impossible de charger les réservations.</p>";
        }
    } catch (error) {
        console.error("Erreur réseau :", error);
        reservationsContainer.innerHTML = "<p class='text-center my-4'>Erreur réseau lors de la récupération.</p>";
    }
}

function displayBookings(bookings) {
    reservationsContainer.innerHTML = ""; 

    if (!bookings || bookings.length === 0) {
        if (isAdminUser) {
            const hasFilter = filterDateInput && filterDateInput.value;
            reservationsContainer.innerHTML = hasFilter 
                ? "<p class='text-center my-4'>Aucune réservation pour cette date.</p>" 
                : "<p class='text-center my-4'>Aucune réservation à venir pour l'ensemble des clients.</p>";
        } else {
            reservationsContainer.innerHTML = "<p class='text-center my-4'>Vous n'avez aucune réservation à venir.</p>";
        }
        return;
    }

    bookings.forEach(booking => {
        const dateParts = booking.date.split('-');
        const dateFR = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`; 
        const allergyText = booking.allergy ? booking.allergy : "Pas d'allergie";

        // Infos du client visible si admin
        const clientInfo = (isAdminUser && booking.user) 
            ? `<strong>Client :</strong> ${booking.user.firstName || ''} ${booking.user.lastName || booking.user.email || ''} | ` 
            : "";

        const bookingElement = document.createElement("div");
        bookingElement.classList.add("card", "mb-3", "p-3", "shadow-sm");

        bookingElement.innerHTML = `
            <div class="d-flex flex-wrap justify-content-between align-items-center">
                <div class="text-start mb-2 mb-md-0">
                    <div>${clientInfo}<strong>Date :</strong> ${dateFR} à <strong>${booking.time}</strong></div>
                    <div><strong>Couverts :</strong> ${booking.guestNumber} pers. | <strong>Allergies :</strong> ${allergyText}</div>
                </div>
                <div class="d-flex gap-2">
                    ${isAdminUser ? `
                        <button class="btn btn-sm btn-outline-secondary" onclick="editBooking('${booking.uuid}', ${booking.guestNumber}, '${booking.allergy || ''}')">
                            Modifier
                        </button>
                    ` : ''}
                    <button type="button" class="btn btn-sm btn-danger" onclick="prepareDelete('${booking.uuid}')" data-bs-toggle="modal" data-bs-target="#AnnulationReservationModal">
                        ${isAdminUser ? 'Supprimer' : 'Annuler'}
                    </button>
                </div>
            </div>
        `;

        reservationsContainer.appendChild(bookingElement);
    });
}

// Préparation de la suppression
window.prepareDelete = function(uuid) {
    bookingUuidToDelete = uuid;
};

// Action de suppression
if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async function() {
        if (!bookingUuidToDelete) return;
        const activeToken = getToken();

        try {
            const response = await fetch(apiUrl + "booking/" + bookingUuidToDelete, {
                method: "DELETE",
                headers: {
                    "X-AUTH-TOKEN": activeToken, 
                    "Accept": "application/json"
                }
            });

            if (response.ok) {
                confirmDeleteBtn.blur();
                const modalElement = document.getElementById('AnnulationReservationModal');
                if (modalElement) {
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) modalInstance.hide();
                }

                bookingUuidToDelete = null; 
                fetchBookings(); 

                setTimeout(() => { alert("Réservation supprimée avec succès."); }, 150);
            } else {
                alert("Erreur lors de la suppression.");
            }
        } catch (error) {
            console.error("Erreur :", error);
            alert("Une erreur est survenue.");
        }
    });
}

// Modification d'une réservation (Admin)
window.editBooking = async function(uuid, currentGuests, currentAllergy) {
    const newGuests = prompt("Nombre de personnes :", currentGuests);
    if (newGuests === null) return; // Annulé

    const newAllergy = prompt("Allergies :", currentAllergy);
    if (newAllergy === null) return;

    const token = getToken();

    try {
        const response = await fetch(apiUrl + "booking/" + uuid, {
            method: "PUT",
            headers: {
                "X-AUTH-TOKEN": token,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                guestNumber: parseInt(newGuests, 10),
                allergy: newAllergy
            })
        });

        if (response.ok) {
            alert("Réservation mise à jour.");
            fetchBookings();
        } else {
            const err = await response.json();
            alert("Erreur : " + (err.message || "Mise à jour impossible."));
        }
    } catch (e) {
        console.error(e);
        alert("Erreur serveur lors de la modification.");
    }
};