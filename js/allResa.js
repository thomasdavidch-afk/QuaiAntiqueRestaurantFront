const reservationsContainer = document.getElementById("reservationsContainer");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

// On stocke maintenant l'UUID (chaîne de caractères) et non plus un ID (entier)
let bookingUuidToDelete = null;

fetchMyBookings(); // On charge les réservations dès que la page est prête

async function fetchMyBookings() {
    const token = getToken();
    console.log("Token récupéré pour fetchMyBookings :", token);

    if (!token) {
        reservationsContainer.innerHTML = "<p>Vous devez être connecté pour voir vos réservations.</p>";
        return;
    }
    try {
        // L'URL de votre GET est "/api/booking" (sans "s")
        const response = await fetch(apiUrl + "booking", {
            method: "GET",
            headers: {
                "X-AUTH-TOKEN": token, 
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const bookings = await response.json();
            displayBookings(bookings);
        } else {
            reservationsContainer.innerHTML = "<p>Impossible de charger vos réservations.</p>";
        }
    } catch (error) {
        console.error("Erreur réseau :", error);
    }
}

function displayBookings(bookings) {
    reservationsContainer.innerHTML = ""; 

    if (bookings.length === 0) {
        reservationsContainer.innerHTML = "<p>Vous n'avez aucune réservation à venir.</p>";
        return;
    }

    bookings.forEach(booking => {
        // Votre API renvoie déjà 'date' (Y-m-d) et 'time' (H:i)
        // On va juste reformater la date en mode français (JJ/MM/AAAA)
        const dateParts = booking.date.split('-');
        const dateFR = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`; 
        
        const allergyText = booking.allergy ? booking.allergy : "Pas d'allergie";

        const bookingElement = document.createElement("div");
        bookingElement.classList.add("pb-3", "pt-3", "border-bottom");
        
        // Attention : on passe bien le 'booking.uuid' entre guillemets car c'est un string !
        bookingElement.innerHTML = `
            <div class="mb-2">
                <span>${dateFR}</span> |
                <span>${booking.time}</span> |
                <span>${booking.guestNumber} personnes</span> |
                <span>${allergyText}</span>
            </div>
            <button type="button" class="btn btn-danger" onclick="prepareDelete('${booking.uuid}')" data-bs-toggle="modal" data-bs-target="#AnnulationReservationModal">
                Annuler ma réservation
            </button>
        `;
        
        reservationsContainer.appendChild(bookingElement);
    });
}

window.prepareDelete = function(uuid) {
    bookingUuidToDelete = uuid;
};

confirmDeleteBtn.addEventListener("click", async function() {
    if (!bookingUuidToDelete) return;

    const activeToken = getToken();

    try {
        // L'URL de suppression prend l'UUID à la fin
        const response = await fetch(apiUrl + "booking/" + bookingUuidToDelete, {
            method: "DELETE",
            headers: {
                "X-AUTH-TOKEN": activeToken, 
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            // 1. On retire le focus du bouton d'annulation pour éviter l'avertissement ARIA
            confirmDeleteBtn.blur();

            const modalElement = document.getElementById('AnnulationReservationModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
            
            // 3. On réinitialise et rafraîchit la liste
            bookingUuidToDelete = null; 
            fetchMyBookings(); 

            // 4. On utilise un tout petit délai (setTimeout) pour l'alert.
            // Cela permet à Bootstrap de finir son animation de fermeture sans être interrompu.
            setTimeout(() => {
                alert("Réservation annulée avec succès.");
            }, 150);

        } else {
            alert("Erreur lors de l'annulation.");
        }
    } catch (error) {
        console.error("Erreur :", error);
        alert("Une erreur est survenue.");
    }
});