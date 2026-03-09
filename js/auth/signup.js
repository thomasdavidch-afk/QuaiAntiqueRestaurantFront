// Implémenter le javascript de ma page d'inscription ici

const inputNom = document.getElementById("NomInput");
const inputPrenom = document.getElementById("PrenomInput");
const inputEmail = document.getElementById("EmailInput");
const inputPassword = document.getElementById("PasswordInput");
const inputValidatePassword = document.getElementById("ValidatePasswordInput");
const btnValidationInscription = document.getElementById("btn-validation-inscription");
const formulaireInscription = document.getElementById("formulaireInscription");

inputNom.addEventListener("keyup", validateform);
inputPrenom.addEventListener("keyup", validateform);
inputEmail.addEventListener("keyup", validateform);
inputPassword.addEventListener("keyup", validateform);
inputValidatePassword.addEventListener("keyup", validateform);

btnValidationInscription.addEventListener("click", InscrireUtilisateur);

//Fonction permettant de valider tout le formulaire
function validateform(){
    const nomOk = validateRequired(inputNom);
    const prenomOk = validateRequired(inputPrenom);
    const emailOk = validateEmail(inputEmail);
    const passwordOk = validatePassword(inputPassword);
    const validatePasswordOk = validatePasswordConfirmation(inputPassword, inputValidatePassword);

    if(nomOk && prenomOk && emailOk && passwordOk && validatePasswordOk){
        btnValidationInscription.disabled = false;
    }
    else{
        btnValidationInscription.disabled = true;
    }
}

function validateEmail(input){
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mailUser = input.value;
    if(mailUser.match(regexEmail)){
        input.classList.add("is-valid");
        input.classList.remove("is-invalid");
        return true;
    }
    else{
        input.classList.remove("is-valid");
        input.classList.add("is-invalid");
        return false;
    }

}

function validatePasswordConfirmation(inputPwd, inputValidatePwd){
    if(inputPwd.value == inputValidatePwd.value){
        inputValidatePwd.classList.add("is-valid");
        inputValidatePwd.classList.remove("is-invalid");
        return true;
    }
    else{
        inputValidatePwd.classList.remove("is-valid");
        inputValidatePwd.classList.add("is-invalid");
        return false;
    }
}

function validatePassword(input){
    //Définir mon regex
    const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const passwordUser = input.value;
    if(passwordUser.match(regexPassword)){
        input.classList.add("is-valid");
        input.classList.remove("is-invalid");
        return true;
    }
    else{
        input.classList.remove("is-valid");
        input.classList.add("is-invalid");
        return false;
    }

}

function validateRequired(input){
    if(input.value != ""){
        input.classList.add("is-valid");
        input.classList.remove("is-invalid");
        return true;
    }
    else{
        input.classList.remove("is-valid");
        input.classList.add("is-invalid");
        return false;
    }
}

function InscrireUtilisateur(){
    let dataForm = new FormData(formulaireInscription);

    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    let raw = JSON.stringify({
        "firstName": dataForm.get("nom"),
        "lastName": dataForm.get("prenom"),
        "email": dataForm.get("email"),
        "password": dataForm.get("mdp")
    });

    let requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };

    fetch(apiUrl+"registration", requestOptions)
    .then(response => {
        if(response.ok){
            return response.json();
        }
        else{
            alert("Erreur lors de l'inscription");  
        } 
    })

    .then(result => {
        alert("Bravo "+dataForm.get("prenom")+" vous allez être redirigé vers la page de connexion");
        document.location.href = "/signin";
    })

    .catch((error) => console.error(error));
}