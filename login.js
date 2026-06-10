import { firebaseConfig, MASTER_EMAIL } from "./firebase-config.js";
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
    const cred = await signInWithEmailAndPassword(auth, email.value, password.value);
    const userEmail = cred.user.email;
    localStorage.setItem("tfd_user_email", userEmail);
    localStorage.setItem("tfd_is_master", String(userEmail === MASTER_EMAIL));
    window.location.href = "central.html";
  } catch (e) {
    msg.textContent = "E-mail ou senha inválidos.";
  }
};
