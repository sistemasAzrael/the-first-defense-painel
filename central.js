import { firebaseConfig, MASTER_EMAIL } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let currentCharacterId = null;
const frame = document.getElementById("panelFrame");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;
  const isMaster = user.email === MASTER_EMAIL;
  document.getElementById("userInfo").innerHTML = `<small>${user.email}</small>`;
  document.getElementById("accessBadge").textContent = isMaster ? "Acesso do Mestre" : "Acesso do Jogador";

  await loadCharacters(isMaster);
});

async function loadCharacters(isMaster) {
  const list = document.getElementById("characterList");
  list.innerHTML = "";

  let snap;
  if (isMaster) {
    snap = await getDocs(collection(db, "characters"));
  } else {
    snap = await getDocs(query(collection(db, "characters"), where("ownerEmail", "==", currentUser.email)));
  }

  snap.forEach((d) => {
    const data = d.data();
    const btn = document.createElement("button");
    btn.className = "char-btn";
    btn.textContent = data.name || d.id;
    btn.onclick = () => openCharacter(d.id);
    list.appendChild(btn);
  });
}

async function openCharacter(id) {
  currentCharacterId = id;
  const ref = doc(db, "characters", id);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};
  frame.contentWindow.postMessage({ type: "LOAD_TFD_CHARACTER", payload: data.panelData || {} }, "*");
}

document.getElementById("saveBtn").onclick = async () => {
  if (!currentCharacterId) return alert("Selecione um personagem primeiro.");
  frame.contentWindow.postMessage({ type: "REQUEST_TFD_EXPORT" }, "*");
};

window.addEventListener("message", async (event) => {
  if (event.data?.type !== "TFD_EXPORT_DATA") return;
  if (!currentCharacterId) return;

  const panelData = event.data.payload;
  await setDoc(doc(db, "characters", currentCharacterId), {
    name: panelData.nameInput || "Sem Nome",
    ownerEmail: panelData.ownerEmail || currentUser.email,
    panelData,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  alert("Personagem salvo no banco.");
});

document.getElementById("logoutBtn").onclick = () => signOut(auth);
