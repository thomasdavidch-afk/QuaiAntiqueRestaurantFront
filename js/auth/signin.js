const mailInput = document.getElementById("EmailInput");
const passwordInput = document.getElementById("PasswordInput");
const signinForm = document.getElementById("signinForm");

signinForm.addEventListener("submit", checkCredentials);

async function checkCredentials(event) {
    event.preventDefault();

    mailInput.classList.remove("is-invalid");
    passwordInput.classList.remove("is-invalid");

    const dataForm = new FormData(signinForm);

    const donnees = {
        email: dataForm.get("email"),
        password: dataForm.get("mdp")
    };

    try {
        const response = await fetch(apiUrl + "login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(donnees)
        });

        const result = await response.json();

        if (!response.ok) {
            mailInput.classList.add("is-invalid");
            passwordInput.classList.add("is-invalid");

            console.error("Erreur de connexion :", result);
            return;
        }

        if (!result.apiToken) {
            console.error("Token absent dans la réponse :", result);
            return;
        }

        setToken(result.apiToken);

        let frontRole = "disconnected";
        const roles = result.roles || [];

        if (roles.includes("ROLE_ADMIN")) {
            frontRole = "admin";
        } else if (roles.includes("ROLE_USER")) {
            frontRole = "clients";
        }

        setCookie(RoleCookieName, frontRole, 7);

        window.location.replace("/");
    } catch (error) {
        console.error("Impossible de contacter l'API :", error);
    }
}