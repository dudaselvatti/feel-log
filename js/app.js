import {
  login,
  logout,
  observeAuth
} from "./auth.js";


const loginScreen =
  document.querySelector("#login-screen");

const appScreen =
  document.querySelector("#app-screen");

const loginForm =
  document.querySelector("#login-form");

const loginError =
  document.querySelector("#login-error");

const logoutButton =
  document.querySelector("#logout-button");


loginForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    loginError.textContent = "";

    const email =
      document.querySelector("#email").value;

    const password =
      document.querySelector("#password").value;

    try {

      await login(
        email,
        password
      );

    } catch (error) {

      console.error(error);

      loginError.textContent =
        "Não foi possível entrar.";

    }

  }
);


logoutButton.addEventListener(
  "click",
  async () => {

    await logout();

  }
);


observeAuth((user) => {

  if (user) {

    loginScreen.hidden = true;

    appScreen.hidden = false;

  } else {

    loginScreen.hidden = false;

    appScreen.hidden = true;

  }

});