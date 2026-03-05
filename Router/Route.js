export default class Route {
	constructor(url, title, pathHtml, authorize, pathJS = "") {
		this.url = url;
		this.title = title;
		this.pathHtml = pathHtml;
		this.pathJS = pathJS;
		this.authorize = authorize;
	}
}

/*
[] -> Tout le monde peut accéder à la page
["disconnected"] -> Seuls les utilisateurs non connectés peuvent accéder à la page
["clients"] -> Seuls les clients peuvent accéder à la page
["admin"] -> Seuls les utilisateurs avec le rôle "admin" peuvent accéder à la page
["admin", "clients"] -> Seuls les utilisateurs avec le rôle "admin" ou "client" peuvent accéder à la page

*/