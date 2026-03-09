import Route from "./Route.js";

// Définir ici vos routes 
export const allRoutes = [
	new Route("/", "Accueil", "/pages/home.html", []),
	new Route("/galerie", "Galerie", "/pages/galerie.html", [], "/js/galerie.js"),
	new Route("/signin", "Connexion", "/pages/auth/signin.html", ["disconnected"], "/js/auth/signin.js"),
	new Route("/signup", "Inscription", "/pages/auth/signup.html", ["disconnected"], "/js/auth/signup.js"),
	new Route("/account", "Mon Compte", "/pages/auth/account.html", ["clients", "admin"], "/js/auth/account.js"),
	new Route("/editpassword", "Changement mot de passe", "/pages/auth/editpassword.html", ["clients", "admin"]),
	new Route("/allResa", "Vos Réservations", "/pages/reservations/allresa.html", ["clients"]),
	new Route("/reserver", "Réserver", "/pages/reservations/reserver.html", ["clients"]),
];

// Le titre s'affiche comme ceci : Route.titre - websitename
export const websiteName = "Quai Antique";