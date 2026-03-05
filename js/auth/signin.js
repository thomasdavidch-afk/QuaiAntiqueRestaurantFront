const mailInput = document.getElementById("EmailInput");
const passwordInput = document.getElementById("PasswordInput");
const btnSignin = document.getElementById("btnSignin");

btnSignin.addEventListener("click", checkCredentials);

function checkCredentials() {
    // Ici il faudra appeler l'API pour connecter les credentials en BDD

    if (mailInput.value === "test@mail.com" && passwordInput.value === "123") {
        // Remplacez ceci par le token réel reçu de l'API
        const token = "token123";
        setToken(token);
        // Placer ce token en cookie

        setCookie(RoleCookieName, "admin", 7); // Exemple de cookie pour le rôle de l'utilisateur
        window.location.replace("/account");
    } else {
        mailInput.classList.add("is-invalid");
        passwordInput.classList.add("is-invalid");
    }
}