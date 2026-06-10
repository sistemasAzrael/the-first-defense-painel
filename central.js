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

function compressDataUrl(dataUrl) {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith("data:image/")) return resolve(dataUrl);

    const img = new Image();
    img.onload = () => {
      const maxSize = 420;
      const quality = 0.55;
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);

      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function makePayloadSafe(panelData) {
  if (!panelData) return {};

  if (panelData.portrait && panelData.portrait.startsWith("data:image/")) {
    panelData.portrait = await compressDataUrl(panelData.portrait);

    // Última proteção: se ainda ficar grande demais, não deixa quebrar o salvamento.
    if (panelData.portrait.length > 650000) {
      alert("A foto ainda está muito pesada. O personagem será salvo sem a foto. Use uma imagem menor ou recortada.");
      delete panelData.portrait;
    }
  }

  return panelData;
}

document.getElementById("saveBtn").onclick = async () => {
  if (!currentCharacterId) return alert("Selecione um personagem primeiro.");

  frame.contentWindow.postMessage({ type: "REQUEST_TFD_EXPORT" }, "*");
};

window.addEventListener("message", async (event) => {
  if (event.data?.type !== "TFD_EXPORT_DATA") return;
  if (!currentCharacterId) return;

  try {
    const panelData = await makePayloadSafe(event.data.payload || {});

    await setDoc(doc(db, "characters", currentCharacterId), {
      name: panelData.nameInput || "Sem Nome",
      ownerEmail: panelData.ownerEmail || currentUser.email,
      panelData,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    alert("Personagem salvo no banco.");
  } catch (e) {
    console.error(e);
    alert("Não foi possível salvar. Provável causa: foto muito pesada ou permissão do Firestore.");
  }
});

document.getElementById("logoutBtn").onclick = () => signOut(auth);
