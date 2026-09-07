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
// LOGIN
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
// APP
// ==========================================================

const appScreen =
    document.querySelector("#app-screen");

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
// ARCHIVE
// ==========================================================

const archiveSearch =
    document.querySelector("#archive-search");

const archiveMoodFilters =
    document.querySelector("#archive-mood-filters");

const archiveSummary =
    document.querySelector("#archive-summary");


// ==========================================================
// CALENDAR
// ==========================================================

const calendarContainer =
    document.querySelector("#calendar-container");

const calendarGrid =
    document.querySelector("#calendar-grid");

const calendarMonthLabel =
    document.querySelector("#calendar-month");

const calendarPrevious =
    document.querySelector("#calendar-previous");

const calendarNext =
    document.querySelector("#calendar-next");

const showAllDatesButton =
    document.querySelector("#show-all-dates");

const chooseDateButton =
    document.querySelector("#choose-date");


// ==========================================================
// DETAIL
// ==========================================================

const entryDetailScreen =
    document.querySelector("#entry-detail-screen");

const closeEntryDetailButton =
    document.querySelector("#close-entry-detail");

const detailDate =
    document.querySelector("#detail-date");

const detailTitle =
    document.querySelector("#detail-title");

const detailMoods =
    document.querySelector("#detail-moods");

const detailContent =
    document.querySelector("#detail-content");

const detailEditButton =
    document.querySelector("#detail-edit-button");

const detailDeleteButton =
    document.querySelector("#detail-delete-button");


// ==========================================================
// NAVEGAÇÃO
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
// EDITOR
// ==========================================================

const editorScreen =
    document.querySelector("#editor-screen");

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

let detailEntryId = null;

let unsubscribeEntries = null;

let draftTimer = null;

let currentView = "today";

let archiveSearchTerm = "";

let archiveMood = null;

let selectedCalendarDay = null;


// calendário começa no mês atual

const now =
    new Date();

let calendarYear =
    now.getFullYear();

let calendarMonth =
    now.getMonth();


// ==========================================================
// DATAS
// ==========================================================

function showTodayDate() {

    todayDate.textContent =
        new Intl.DateTimeFormat(
            "pt-BR",
            {
                weekday: "long",
                day: "numeric",
                month: "long"
            }
        ).format(
            new Date()
        );

}


function showEditorDate() {

    editorDate.textContent =
        new Intl.DateTimeFormat(
            "pt-BR",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        ).format(
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
            entryDetailScreen.hidden = true;
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
            entryDetailScreen.hidden = true;

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


    if (
        viewName === "archive"
    ) {

        renderArchive();

        renderCalendar();

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ==========================================================
// NOVA ENTRADA
// ==========================================================

newEntryButton.addEventListener(
    "click",
    () => {

        openEditor();

    }
);


// ==========================================================
// EDITOR
// ==========================================================

function openEditor(entry = null) {

    appScreen.hidden = true;

    entryDetailScreen.hidden = true;

    editorScreen.hidden = false;

    saveStatus.textContent = "";

    selectedMoods.clear();


    if (entry) {

        editingEntryId =
            entry.id;

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

                selectedMoods.add(
                    mood
                );

            }
        );

        draftStatus.textContent =
            "";

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
    closeEditor
);


function closeEditor() {

    editorScreen.hidden = true;

    appScreen.hidden = false;

    editingEntryId = null;

    saveStatus.textContent = "";

    activateView(
        currentView
    );

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

                    selectedMoods.delete(
                        mood
                    );

                }

                else {

                    selectedMoods.add(
                        mood
                    );

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
// COMPATIBILIDADE COM mood ANTIGO
// ==========================================================

function normalizeMoods(entry) {

    if (
        Array.isArray(
            entry.moods
        )
    ) {

        return entry.moods;

    }


    if (entry.mood) {

        return [
            entry.mood
        ];

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

                resetEditor();

                editorScreen.hidden =
                    true;

                appScreen.hidden =
                    false;

                activateView(
                    currentView
                );

            },
            350
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

        saveButton.disabled =
            false;

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
// RASCUNHO
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


function restoreDraft() {

    resetEditor();


    const key =
        getDraftKey();


    if (!key) {
        return;
    }


    const storedDraft =
        localStorage.getItem(
            key
        );


    if (!storedDraft) {

        draftStatus.textContent =
            "";

        return;

    }


    try {

        const draft =
            JSON.parse(
                storedDraft
            );


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


function clearDraft() {

    const key =
        getDraftKey();


    if (key) {

        localStorage.removeItem(
            key
        );

    }


    draftStatus.textContent = "";

    updateDraftButton();

}


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
// FIRESTORE
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


                renderLatestEntry();

                renderMoodFilters();

                renderArchive();

                renderCalendar();

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

        noLatestEntry.hidden =
            false;

        return;

    }


    noLatestEntry.hidden =
        true;


    latestEntry.appendChild(
        createEntryCard(
            entriesCache[0],
            true
        )
    );

}


// ==========================================================
// BUSCA
// ==========================================================

archiveSearch.addEventListener(
    "input",
    () => {

        archiveSearchTerm =
            archiveSearch.value
                .trim()
                .toLocaleLowerCase(
                    "pt-BR"
                );

        renderArchive();

    }
);


// ==========================================================
// FILTROS DE SENTIMENTO
// ==========================================================

function renderMoodFilters() {

    archiveMoodFilters.innerHTML =
        "";


    const allMoods =
        new Set();


    entriesCache.forEach(
        (entry) => {

            normalizeMoods(
                entry
            ).forEach(
                (mood) => {

                    allMoods.add(mood);

                }
            );

        }
    );


    const allButton =
        createMoodFilterButton(
            "todos",
            null
        );


    archiveMoodFilters.appendChild(
        allButton
    );


    [...allMoods]
        .sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    "pt-BR"
                )
        )
        .forEach(
            (mood) => {

                archiveMoodFilters.appendChild(
                    createMoodFilterButton(
                        mood,
                        mood
                    )
                );

            }
        );

}


function createMoodFilterButton(
    label,
    mood
) {

    const button =
        document.createElement(
            "button"
        );


    button.type = "button";

    button.className =
        "archive-filter-button";


    button.textContent =
        label;


    button.classList.toggle(
        "active",
        archiveMood === mood
    );


    button.addEventListener(
        "click",
        () => {

            archiveMood =
                mood;

            renderMoodFilters();

            renderArchive();

        }
    );


    return button;

}


// ==========================================================
// FILTRAR ENTRADAS
// ==========================================================

function getFilteredEntries() {

    return entriesCache.filter(
        (entry) => {

            const title =
                (entry.title || "")
                    .toLocaleLowerCase(
                        "pt-BR"
                    );


            const content =
                (entry.content || "")
                    .toLocaleLowerCase(
                        "pt-BR"
                    );


            const matchesSearch =
                !archiveSearchTerm ||
                title.includes(
                    archiveSearchTerm
                ) ||
                content.includes(
                    archiveSearchTerm
                );


            const moods =
                normalizeMoods(entry);


            const matchesMood =
                !archiveMood ||
                moods.includes(
                    archiveMood
                );


            const matchesDay =
                !selectedCalendarDay ||
                isSameCalendarDay(
                    entry,
                    selectedCalendarDay
                );


            return (
                matchesSearch &&
                matchesMood &&
                matchesDay
            );

        }
    );

}


// ==========================================================
// ARQUIVO
// ==========================================================

function renderArchive() {

    entriesList.innerHTML = "";


    const filteredEntries =
        getFilteredEntries();


    updateArchiveSummary(
        filteredEntries.length
    );


    if (!filteredEntries.length) {

        emptyState.hidden =
            false;

        return;

    }


    emptyState.hidden =
        true;


    const groups =
        groupEntriesByMonth(
            filteredEntries
        );


    Object.entries(
        groups
    ).forEach(
        ([monthKey, entries]) => {

            const section =
                document.createElement(
                    "section"
                );


            section.className =
                "month-group";


            const heading =
                document.createElement(
                    "div"
                );


            heading.className =
                "month-heading";


            const title =
                document.createElement(
                    "h2"
                );


            title.textContent =
                formatMonthKey(
                    monthKey
                );


            const count =
                document.createElement(
                    "span"
                );


            count.textContent =
                entries.length === 1
                    ? "1 registro"
                    : `${entries.length} registros`;


            heading.append(
                title,
                count
            );


            section.appendChild(
                heading
            );


            entries.forEach(
                (entry) => {

                    section.appendChild(
                        createEntryCard(
                            entry
                        )
                    );

                }
            );


            entriesList.appendChild(
                section
            );

        }
    );

}


// ==========================================================
// AGRUPAR POR MÊS
// ==========================================================

function groupEntriesByMonth(
    entries
) {

    const groups = {};


    entries.forEach(
        (entry) => {

            const date =
                getEntryDate(entry);


            if (!date) {
                return;
            }


            const key =
                `${date.getFullYear()}-${String(
                    date.getMonth() + 1
                ).padStart(2, "0")}`;


            if (!groups[key]) {

                groups[key] = [];

            }


            groups[key].push(
                entry
            );

        }
    );


    return groups;

}


function formatMonthKey(
    key
) {

    const [year, month] =
        key.split("-");


    const date =
        new Date(
            Number(year),
            Number(month) - 1,
            1
        );


    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            month: "long",
            year: "numeric"
        }
    ).format(date);

}


// ==========================================================
// RESUMO
// ==========================================================

function updateArchiveSummary(
    count
) {

    if (selectedCalendarDay) {

        const dateText =
            new Intl.DateTimeFormat(
                "pt-BR",
                {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            ).format(
                selectedCalendarDay
            );


        archiveSummary.textContent =
            count === 1
                ? `1 registro em ${dateText}`
                : `${count} registros em ${dateText}`;

        return;

    }


    archiveSummary.textContent =
        count === 1
            ? "1 registro"
            : `${count} registros`;

}


// ==========================================================
// CARD
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


    const main =
        document.createElement(
            "div"
        );


    main.className =
        "entry-card-main";


    main.addEventListener(
        "click",
        () => {

            openEntryDetail(
                entry
            );

        }
    );


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


    meta.appendChild(
        date
    );


    main.appendChild(
        meta
    );


    if (entry.title) {

        const heading =
            document.createElement(
                isLatest
                    ? "h2"
                    : "h3"
            );


        heading.textContent =
            entry.title;


        main.appendChild(
            heading
        );

    }


    const content =
        document.createElement(
            "p"
        );


    content.className =
        "entry-preview";


    content.textContent =
        entry.content;


    main.appendChild(
        content
    );


    const moods =
        normalizeMoods(
            entry
        );


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


        main.appendChild(
            moodsContainer
        );

    }


    card.appendChild(
        main
    );


    return card;

}


// ==========================================================
// DETAIL
// ==========================================================

function openEntryDetail(
    entry
) {

    detailEntryId =
        entry.id;


    appScreen.hidden =
        true;

    editorScreen.hidden =
        true;

    entryDetailScreen.hidden =
        false;


    detailDate.textContent =
        formatDetailDate(
            entry.createdAt
        );


    detailTitle.textContent =
        entry.title || "";


    detailContent.textContent =
        entry.content || "";


    detailMoods.innerHTML =
        "";


    normalizeMoods(
        entry
    ).forEach(
        (mood) => {

            const tag =
                document.createElement(
                    "span"
                );


            tag.className =
                "entry-mood-tag";


            tag.textContent =
                mood;


            detailMoods.appendChild(
                tag
            );

        }
    );


    window.scrollTo({
        top: 0,
        behavior: "instant"
    });

}


closeEntryDetailButton.addEventListener(
    "click",
    closeEntryDetail
);


function closeEntryDetail() {

    entryDetailScreen.hidden =
        true;

    appScreen.hidden =
        false;

    detailEntryId =
        null;

    activateView(
        currentView === "today"
            ? "today"
            : "archive"
    );

}


// ==========================================================
// EDITAR NO DETAIL
// ==========================================================

detailEditButton.addEventListener(
    "click",
    () => {

        const entry =
            entriesCache.find(
                (item) =>
                    item.id ===
                    detailEntryId
            );


        if (entry) {

            openEditor(
                entry
            );

        }

    }
);


// ==========================================================
// EXCLUIR NO DETAIL
// ==========================================================

detailDeleteButton.addEventListener(
    "click",
    async () => {

        const entry =
            entriesCache.find(
                (item) =>
                    item.id ===
                    detailEntryId
            );


        if (!entry) {
            return;
        }


        const deleted =
            await deleteEntry(
                entry
            );


        if (deleted) {

            detailEntryId =
                null;

            entryDetailScreen.hidden =
                true;

            appScreen.hidden =
                false;

            activateView(
                "archive"
            );

        }

    }
);


// ==========================================================
// DELETE
// ==========================================================

async function deleteEntry(
    entry
) {

    if (!currentUser) {
        return false;
    }


    const confirmed =
        window.confirm(
            "Excluir este registro? Essa ação não poderá ser desfeita."
        );


    if (!confirmed) {

        return false;

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


        return true;

    }

    catch (error) {

        console.error(
            "Erro ao excluir:",
            error
        );


        window.alert(
            "Não foi possível excluir o registro."
        );


        return false;

    }

}

// ==========================================================
// FILTRO POR DATA
// ==========================================================

showAllDatesButton.addEventListener(
    "click",
    () => {

        selectedCalendarDay = null;

        calendarContainer.hidden = true;

        showAllDatesButton.classList.add(
            "active"
        );

        chooseDateButton.classList.remove(
            "active"
        );

        chooseDateButton.textContent =
            "escolher data";

        renderCalendar();

        renderArchive();

    }
);


chooseDateButton.addEventListener(
    "click",
    () => {

        /*
         * Se já existe uma data selecionada,
         * tocar novamente permite escolher outra.
         */

        calendarContainer.hidden =
            !calendarContainer.hidden;

    }
);


// ==========================================================
// CALENDÁRIO
// ==========================================================

calendarPrevious.addEventListener(
    "click",
    () => {

        calendarMonth--;


        if (calendarMonth < 0) {

            calendarMonth = 11;

            calendarYear--;

        }


        renderCalendar();

    }
);


calendarNext.addEventListener(
    "click",
    () => {

        calendarMonth++;


        if (calendarMonth > 11) {

            calendarMonth = 0;

            calendarYear++;

        }


        renderCalendar();

    }
);



function renderCalendar() {

    calendarGrid.innerHTML = "";


    const displayedMonth =
        new Date(
            calendarYear,
            calendarMonth,
            1
        );


    calendarMonthLabel.textContent =
        new Intl.DateTimeFormat(
            "pt-BR",
            {
                month: "long",
                year: "numeric"
            }
        ).format(
            displayedMonth
        );


    const firstDay =
        new Date(
            calendarYear,
            calendarMonth,
            1
        ).getDay();


    const daysInMonth =
        new Date(
            calendarYear,
            calendarMonth + 1,
            0
        ).getDate();


    for (
        let index = 0;
        index < firstDay;
        index++
    ) {

        const empty =
            document.createElement(
                "span"
            );


        empty.className =
            "calendar-day empty";


        calendarGrid.appendChild(
            empty
        );

    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "calendar-day";


        button.textContent =
            day;


        const date =
            new Date(
                calendarYear,
                calendarMonth,
                day
            );


        const hasEntry =
            entriesCache.some(
                (entry) =>
                    isSameCalendarDay(
                        entry,
                        date
                    )
            );


        if (hasEntry) {

            button.classList.add(
                "has-entry"
            );

        }


        if (
            isSameDate(
                date,
                new Date()
            )
        ) {

            button.classList.add(
                "today"
            );

        }


        if (
            selectedCalendarDay &&
            isSameDate(
                date,
                selectedCalendarDay
            )
        ) {

            button.classList.add(
                "selected"
            );

        }


        button.addEventListener(
            "click",
            () => {

                selectedCalendarDay =
                    date;


                showAllDatesButton.classList.remove(
                    "active"
                );


                chooseDateButton.classList.add(
                    "active"
                );


                chooseDateButton.textContent =
                    new Intl.DateTimeFormat(
                        "pt-BR",
                        {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        }
                    ).format(date);


                /*
                 * Depois de escolher,
                 * fecha automaticamente.
                 */

                calendarContainer.hidden =
                    true;


                renderCalendar();

                renderArchive();

            }
        );


        calendarGrid.appendChild(
            button
        );

    }

}


// ==========================================================
// COMPARAÇÃO DE DATAS
// ==========================================================

function isSameCalendarDay(
    entry,
    targetDate
) {

    const date =
        getEntryDate(
            entry
        );


    if (!date) {
        return false;
    }


    return isSameDate(
        date,
        targetDate
    );

}


function isSameDate(
    first,
    second
) {

    return (
        first.getFullYear() ===
        second.getFullYear() &&

        first.getMonth() ===
        second.getMonth() &&

        first.getDate() ===
        second.getDate()
    );

}


// ==========================================================
// DATA DE UMA ENTRY
// ==========================================================

function getEntryDate(
    entry
) {

    if (
        !entry.createdAt
    ) {

        return null;

    }


    if (
        typeof entry.createdAt.toDate ===
        "function"
    ) {

        return entry.createdAt.toDate();

    }


    return new Date(
        entry.createdAt
    );

}


// ==========================================================
// FORMATAÇÕES
// ==========================================================

function formatEntryDate(
    timestamp
) {

    if (!timestamp) {

        return "agora";

    }


    const date =
        typeof timestamp.toDate ===
            "function"
            ? timestamp.toDate()
            : new Date(timestamp);


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


function formatDetailDate(
    timestamp
) {

    if (!timestamp) {

        return "agora";

    }


    const date =
        typeof timestamp.toDate ===
            "function"
            ? timestamp.toDate()
            : new Date(timestamp);


    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);

}