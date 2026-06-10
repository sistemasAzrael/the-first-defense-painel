import { firebaseConfig, MASTER_EMAIL } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage, ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let currentUser = null;
let currentCharacterId = null;
let currentOwnerEmail = null;
const frame = document.getElementById("panelFrame");
const saveStatus = document.getElementById("saveStatus");

function setStatus(text) {
  saveStatus.textContent = text || "";
}

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

  if (snap.empty) {
    list.innerHTML = "<small>Nenhum personagem vinculado.</small>";
    return;
  }

  snap.forEach((d) => {
    const data = d.data();
    const btn = document.createElement("button");
    btn.className = "char-btn";
    btn.textContent = data.name || d.id;
    btn.onclick = () => {
      document.querySelectorAll(".char-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      openCharacter(d.id);
    };
    list.appendChild(btn);
  });
}

async function openCharacter(id) {
  currentCharacterId = id;
  setStatus("Carregando...");
  const refDoc = doc(db, "characters", id);
  const snap = await getDoc(refDoc);
  const data = snap.exists() ? snap.data() : {};
  currentOwnerEmail = data.ownerEmail || currentUser.email;
  frame.contentWindow.postMessage({ type: "LOAD_TFD_CHARACTER", payload: data.panelData || {} }, "*");
  setStatus("Selecionado");
}

function dataUrlIsImage(dataUrl) {
  return typeof dataUrl === "string" && dataUrl.startsWith("data:image/");
}

async function uploadPortraitIfNeeded(characterId, panelData) {
  if (!panelData || !dataUrlIsImage(panelData.portrait)) return panelData;

  setStatus("Enviando foto...");
  const path = `characters/${characterId}/portrait.jpg`;
  const storageRef = ref(storage, path);

  await uploadString(storageRef, panelData.portrait, "data_url");
  const url = await getDownloadURL(storageRef);

  panelData.portraitUrl = url;
  delete panelData.portrait;
  return panelData;
}

document.getElementById("saveBtn").onclick = async () => {
  if (!currentCharacterId) return alert("Selecione um personagem primeiro.");
  setStatus("Preparando...");
  frame.contentWindow.postMessage({ type: "REQUEST_TFD_EXPORT" }, "*");
};

window.addEventListener("message", async (event) => {
  if (event.data?.type !== "TFD_EXPORT_DATA") return;
  if (!currentCharacterId) return alert("Selecione um personagem primeiro.");

  try {
    setStatus("Salvando...");
    let panelData = event.data.payload || {};
    panelData = await uploadPortraitIfNeeded(currentCharacterId, panelData);

    await setDoc(doc(db, "characters", currentCharacterId), {
      name: panelData.nameInput || "Sem Nome",
      ownerEmail: currentOwnerEmail || currentUser.email,
      panelData,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    setStatus("Salvo");
    alert("Personagem salvo no banco.");
  } catch (e) {
    console.error(e);
    setStatus("Erro ao salvar");
    alert("Não foi possível salvar. Verifique se o Firebase Storage está ativado e se as regras foram aplicadas.");
  }
});

document.getElementById("logoutBtn").onclick = () => signOut(auth);
