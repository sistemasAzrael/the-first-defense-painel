import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const email = document.getElementById("email");
const password = document.getElementById("password");
const msg = document.getElementById("loginMsg");

document.getElementById("loginBtn").onclick = async () => {
  msg.textContent = "Verificando credenciais...";
  try {
    await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
    window.location.href = "central.html";
  } catch (e) {
    console.error(e);
    msg.textContent = "E-mail ou senha inválidos.";
  }
};
