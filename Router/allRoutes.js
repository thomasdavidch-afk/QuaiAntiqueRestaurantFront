import Route from "./Route.js";

// Définir ici vos routes
export const allRoutes = [
	new Route("/", "Accueil", "/pages/home.html"),
	new Route("/galerie", "Galerie", "/pages/galerie.html"),
	new Route("/signin", "Connexion", "/pages/auth/signin.html"),
	new Route("/signup", "Inscription", "/pages/auth/signup.html"),
	new Route("/account", "Mon Compte", "/pages/auth/account.html"),
	new Route("/editpassword", "Changement mot de passe", "/pages/auth/editpassword.html"),
];

// Le titre s'affiche comme ceci : Route.titre - websitename
export const websiteName = "Quai Antique";