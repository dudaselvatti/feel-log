import {
  auth,
  db
} from "./firebase.js";


import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// ==========================================================
// ELEMENTOS - LOGIN
// ==========================================================

const loginScreen =
  document.querySelector("#login-screen");

const loginForm =
  document.querySelector("#login-form");

const emailInput =
  document.querySelector("#email");

const passwordInput =
  document.querySelector("#password");

const loginError =
  document.querySelector("#login-error");


// ==========================================================
// ELEMENTOS - APP
// ==========================================================

const appScreen =
  document.querySelector("#app-screen");

const editorScreen =
  document.querySelector("#editor-screen");

const todayDate =
  document.querySelector("#today-date");

const latestEntry =
  document.querySelector("#latest-entry");

const noLatestEntry =
  document.querySelector("#no-latest-entry");

const entriesList =
  document.querySelector("#entries-list");

const emptyState =
  document.querySelector("#empty-state");

const userEmail =
  document.querySelector("#user-email");

const logoutButton =
  document.querySelector("#logout-button");

const newEntryButton =
  document.querySelector("#new-entry-button");


// ==========================================================
// ELEMENTOS - NAVEGAÇÃO
// ==========================================================

const navButtons =
  document.querySelectorAll(".nav-button");

const views = {
  today:
    document.querySelector("#view-today"),

  archive:
    document.querySelector("#view-archive"),

  settings:
    document.querySelector("#view-settings")
};


// ==========================================================
// ELEMENTOS - EDITOR
// ==========================================================

const closeEditorButton =
  document.querySelector("#close-editor");

const editorMode =
  document.querySelector("#editor-mode");

const editorDate =
  document.querySelector("#editor-date");

const titleInput =
  document.querySelector("#entry-title");

const contentInput =
  document.querySelector("#entry-content");

const saveButton =
  document.querySelector("#save-entry");

const saveStatus =
  document.querySelector("#save-status");

const draftStatus =
  document.querySelector("#draft-status");

const moodButtons =
  document.querySelectorAll(".mood-button");


// ==========================================================
// ESTADO
// ==========================================================

let currentUser = null;

let entriesCache = [];

let selectedMoods =
  new Set();

let editingEntryId = null;

let unsubscribeEntries = null;

let draftTimer = null;

let currentView = "today";


// ==========================================================
// DATA
// ==========================================================

function showTodayDate() {

  const formatter =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        weekday: "long",
        day: "numeric",
        month: "long"
      }
    );

  todayDate.textContent =
    formatter.format(
      new Date()
    );

}


function showEditorDate() {

  const formatter =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );

  editorDate.textContent =
    formatter.format(
      new Date()
    );

}


showTodayDate();
showEditorDate();


// ==========================================================
// LOGIN
// ==========================================================

loginForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    loginError.textContent = "";

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;


    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      passwordInput.value = "";

    }

    catch (error) {

      console.error(
        "Erro no login:",
        error
      );

      loginError.textContent =
        "E-mail ou senha incorretos.";

    }

  }
);


// ==========================================================
// LOGOUT
// ==========================================================

logoutButton.addEventListener(
  "click",
  async () => {

    try {

      await signOut(auth);

    }

    catch (error) {

      console.error(
        "Erro ao sair:",
        error
      );

    }

  }
);


// ==========================================================
// AUTENTICAÇÃO
// ==========================================================

onAuthStateChanged(
  auth,

  (user) => {

    if (user) {

      currentUser = user;

      loginScreen.hidden = true;
      editorScreen.hidden = true;
      appScreen.hidden = false;

      userEmail.textContent =
        user.email || "conta conectada";

      activateView("today");

      updateDraftButton();

      startEntriesListener();

    }

    else {

      currentUser = null;

      entriesCache = [];

      loginScreen.hidden = false;

      appScreen.hidden = true;
      editorScreen.hidden = true;

      entriesList.innerHTML = "";
      latestEntry.innerHTML = "";

      if (unsubscribeEntries) {

        unsubscribeEntries();

        unsubscribeEntries = null;

      }

    }

  }
);


// ==========================================================
// NAVEGAÇÃO
// ==========================================================

navButtons.forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        activateView(
          button.dataset.view
        );

      }
    );

  }
);


function activateView(viewName) {

  currentView = viewName;


  Object.entries(
    views
  ).forEach(
    ([name, element]) => {

      element.classList.toggle(
        "active",
        name === viewName
      );

    }
  );


  navButtons.forEach(
    (button) => {

      button.classList.toggle(
        "active",
        button.dataset.view === viewName
      );

    }
  );


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


// ==========================================================
// ABRIR NOVA ENTRADA
// ==========================================================

newEntryButton.addEventListener(
  "click",
  () => {

    openEditor();

  }
);


// ==========================================================
// ABRIR EDITOR
// ==========================================================

function openEditor(entry = null) {

  appScreen.hidden = true;

  editorScreen.hidden = false;

  saveStatus.textContent = "";

  selectedMoods.clear();


  if (entry) {

    editingEntryId = entry.id;

    editorMode.textContent =
      "editar registro";

    titleInput.value =
      entry.title || "";

    contentInput.value =
      entry.content || "";

    normalizeMoods(
      entry
    ).forEach(
      (mood) => {

        selectedMoods.add(mood);

      }
    );

    draftStatus.textContent = "";

  }

  else {

    editingEntryId = null;

    editorMode.textContent =
      "novo registro";

    restoreDraft();

  }


  updateMoodButtons();

  showEditorDate();


  setTimeout(
    () => {

      contentInput.focus();

    },
    100
  );

}


// ==========================================================
// FECHAR EDITOR
// ==========================================================

closeEditorButton.addEventListener(
  "click",
  () => {

    closeEditor();

  }
);


function closeEditor() {

  editorScreen.hidden = true;

  appScreen.hidden = false;

  editingEntryId = null;

  saveStatus.textContent = "";

  activateView(currentView);

}


// ==========================================================
// SENTIMENTOS
// ==========================================================

moodButtons.forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        const mood =
          button.dataset.mood;


        if (
          selectedMoods.has(mood)
        ) {

          selectedMoods.delete(mood);

        }

        else {

          selectedMoods.add(mood);

        }


        updateMoodButtons();

        scheduleDraftSave();

      }
    );

  }
);


function updateMoodButtons() {

  moodButtons.forEach(
    (button) => {

      button.classList.toggle(
        "selected",
        selectedMoods.has(
          button.dataset.mood
        )
      );

    }
  );

}


// ==========================================================
// COMPATIBILIDADE COM ENTRADAS ANTIGAS
// ==========================================================

function normalizeMoods(entry) {

  if (
    Array.isArray(entry.moods)
  ) {

    return entry.moods;

  }


  if (entry.mood) {

    return [entry.mood];

  }


  return [];

}


// ==========================================================
// SALVAR ENTRADA
// ==========================================================

saveButton.addEventListener(
  "click",
  saveEntry
);


async function saveEntry() {

  if (!currentUser) {
    return;
  }


  const title =
    titleInput.value.trim();

  const content =
    contentInput.value.trim();


  if (!content) {

    saveStatus.textContent =
      "escreva alguma coisa primeiro";

    contentInput.focus();

    return;

  }


  saveButton.disabled = true;

  saveStatus.textContent =
    "salvando...";


  const data = {

    title,

    content,

    moods:
      [...selectedMoods],

    updatedAt:
      serverTimestamp()

  };


  try {

    if (editingEntryId) {

      const entryReference =
        doc(
          db,
          "users",
          currentUser.uid,
          "entries",
          editingEntryId
        );


      await updateDoc(
        entryReference,
        data
      );

    }

    else {

      const entriesReference =
        collection(
          db,
          "users",
          currentUser.uid,
          "entries"
        );


      await addDoc(
        entriesReference,
        {
          ...data,

          createdAt:
            serverTimestamp()
        }
      );


      clearDraft();

    }


    saveStatus.textContent =
      "salvo";


    setTimeout(
      () => {

        closeEditor();
        resetEditor();

      },
      450
    );

  }

  catch (error) {

    console.error(
      "Erro ao salvar:",
      error
    );

    saveStatus.textContent =
      "não foi possível salvar";

  }

  finally {

    saveButton.disabled = false;

  }

}


// ==========================================================
// RESET DO EDITOR
// ==========================================================

function resetEditor() {

  titleInput.value = "";

  contentInput.value = "";

  selectedMoods.clear();

  editingEntryId = null;

  updateMoodButtons();

}


// ==========================================================
// RASCUNHO AUTOMÁTICO
// ==========================================================

titleInput.addEventListener(
  "input",
  scheduleDraftSave
);


contentInput.addEventListener(
  "input",
  scheduleDraftSave
);


function scheduleDraftSave() {

  if (
    editingEntryId ||
    !currentUser
  ) {

    return;

  }


  draftStatus.textContent =
    "salvando rascunho...";


  clearTimeout(
    draftTimer
  );


  draftTimer =
    setTimeout(
      saveDraft,
      450
    );

}


function getDraftKey() {

  if (!currentUser) {
    return null;
  }


  return (
    `feel-log-draft-${currentUser.uid}`
  );

}


function saveDraft() {

  if (
    editingEntryId ||
    !currentUser
  ) {

    return;

  }


  const draft = {

    title:
      titleInput.value,

    content:
      contentInput.value,

    moods:
      [...selectedMoods],

    savedAt:
      new Date().toISOString()

  };


  const hasContent =
    draft.title.trim() ||
    draft.content.trim() ||
    draft.moods.length;


  if (!hasContent) {

    clearDraft();

    return;

  }


  localStorage.setItem(
    getDraftKey(),
    JSON.stringify(draft)
  );


  draftStatus.textContent =
    "rascunho salvo";

  updateDraftButton();

}


// ==========================================================
// RESTAURAR RASCUNHO
// ==========================================================

function restoreDraft() {

  resetEditor();


  const key =
    getDraftKey();


  if (!key) {
    return;
  }


  const storedDraft =
    localStorage.getItem(key);


  if (!storedDraft) {

    draftStatus.textContent = "";

    return;

  }


  try {

    const draft =
      JSON.parse(storedDraft);


    titleInput.value =
      draft.title || "";

    contentInput.value =
      draft.content || "";


    selectedMoods =
      new Set(
        draft.moods || []
      );


    updateMoodButtons();


    draftStatus.textContent =
      "rascunho recuperado";

  }

  catch (error) {

    console.error(
      "Erro ao recuperar rascunho:",
      error
    );

    clearDraft();

  }

}


// ==========================================================
// LIMPAR RASCUNHO
// ==========================================================

function clearDraft() {

  const key =
    getDraftKey();


  if (key) {

    localStorage.removeItem(key);

  }


  draftStatus.textContent = "";

  updateDraftButton();

}


// ==========================================================
// INDICADOR DE RASCUNHO NA HOME
// ==========================================================

function updateDraftButton() {

  if (!currentUser) {
    return;
  }


  const hasDraft =
    Boolean(
      localStorage.getItem(
        getDraftKey()
      )
    );


  const label =
    newEntryButton.querySelector(
      "span"
    );


  label.textContent =
    hasDraft
      ? "continuar escrevendo"
      : "escrever sobre hoje";

}


// ==========================================================
// LISTENER FIRESTORE
// ==========================================================

function startEntriesListener() {

  if (!currentUser) {
    return;
  }


  if (unsubscribeEntries) {

    unsubscribeEntries();

  }


  const entriesReference =
    collection(
      db,
      "users",
      currentUser.uid,
      "entries"
    );


  const entriesQuery =
    query(
      entriesReference,

      orderBy(
        "createdAt",
        "desc"
      )
    );


  unsubscribeEntries =
    onSnapshot(

      entriesQuery,

      (snapshot) => {

        entriesCache = [];


        snapshot.forEach(
          (documentSnapshot) => {

            entriesCache.push({

              id:
                documentSnapshot.id,

              ...documentSnapshot.data()

            });

          }
        );


        renderEntries();

        renderLatestEntry();

      },

      (error) => {

        console.error(
          "Erro ao carregar entradas:",
          error
        );

      }

    );

}


// ==========================================================
// ÚLTIMA ENTRADA
// ==========================================================

function renderLatestEntry() {

  latestEntry.innerHTML = "";


  if (!entriesCache.length) {

    noLatestEntry.hidden = false;

    return;

  }


  noLatestEntry.hidden = true;


  const entry =
    entriesCache[0];


  const card =
    createEntryCard(
      entry,
      true
    );


  latestEntry.appendChild(
    card
  );

}


// ==========================================================
// ARQUIVO
// ==========================================================

function renderEntries() {

  entriesList.innerHTML = "";


  if (!entriesCache.length) {

    emptyState.hidden = false;

    return;

  }


  emptyState.hidden = true;


  entriesCache.forEach(
    (entry) => {

      entriesList.appendChild(
        createEntryCard(entry)
      );

    }
  );

}


// ==========================================================
// CRIAR CARD
// ==========================================================

function createEntryCard(
  entry,
  isLatest = false
) {

  const card =
    document.createElement(
      "article"
    );


  card.className =
    "entry-card";


  // META

  const meta =
    document.createElement(
      "div"
    );


  meta.className =
    "entry-meta";


  const date =
    document.createElement(
      "span"
    );


  date.textContent =
    formatEntryDate(
      entry.createdAt
    );


  meta.appendChild(date);

  card.appendChild(meta);


  // TÍTULO

  if (entry.title) {

    const heading =
      document.createElement(
        isLatest
          ? "h2"
          : "h3"
      );


    heading.textContent =
      entry.title;


    card.appendChild(
      heading
    );

  }


  // CONTEÚDO

  const content =
    document.createElement(
      "p"
    );


  content.className =
    "entry-preview";


  content.textContent =
    entry.content;


  card.appendChild(
    content
  );


  // SENTIMENTOS

  const moods =
    normalizeMoods(entry);


  if (moods.length) {

    const moodsContainer =
      document.createElement(
        "div"
      );


    moodsContainer.className =
      "entry-moods";


    moods.forEach(
      (mood) => {

        const tag =
          document.createElement(
            "span"
          );


        tag.className =
          "entry-mood-tag";


        tag.textContent =
          mood;


        moodsContainer.appendChild(
          tag
        );

      }
    );


    card.appendChild(
      moodsContainer
    );

  }


  // AÇÕES

  const actions =
    document.createElement(
      "div"
    );


  actions.className =
    "entry-actions";


  const editButton =
    document.createElement(
      "button"
    );


  editButton.type =
    "button";


  editButton.className =
    "entry-action";


  editButton.textContent =
    "editar";


  editButton.addEventListener(
    "click",
    () => {

      openEditor(entry);

    }
  );


  const deleteButton =
    document.createElement(
      "button"
    );


  deleteButton.type =
    "button";


  deleteButton.className =
    "entry-action delete-action";


  deleteButton.textContent =
    "excluir";


  deleteButton.addEventListener(
    "click",
    () => {

      deleteEntry(entry);

    }
  );


  actions.append(
    editButton,
    deleteButton
  );


  card.appendChild(
    actions
  );


  return card;

}


// ==========================================================
// EXCLUIR ENTRADA
// ==========================================================

async function deleteEntry(entry) {

  if (!currentUser) {
    return;
  }


  const confirmed =
    window.confirm(
      "Excluir este registro? Essa ação não poderá ser desfeita."
    );


  if (!confirmed) {
    return;
  }


  try {

    const entryReference =
      doc(
        db,
        "users",
        currentUser.uid,
        "entries",
        entry.id
      );


    await deleteDoc(
      entryReference
    );

  }

  catch (error) {

    console.error(
      "Erro ao excluir:",
      error
    );


    window.alert(
      "Não foi possível excluir o registro."
    );

  }

}


// ==========================================================
// FORMATAR DATA
// ==========================================================

function formatEntryDate(timestamp) {

  if (!timestamp) {

    return "agora";

  }


  const date =
    timestamp.toDate();


  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(date);

}