console.log("Supabase connecté ?", supabaseClient);

const checkboxes = document.querySelectorAll("input[type='checkbox']");
const scoreMoiDisplay = document.getElementById("score-moi");
const totalMoiDisplay = document.getElementById("total-moi");
const scoreChatsDisplay = document.getElementById("score-chats");
const totalChatsDisplay = document.getElementById("total-chats");
const historyDisplay = document.getElementById("history");
const moodButtons = document.querySelectorAll(".mood-button");
const selectedMoodDisplay = document.getElementById("selected-mood");

function getDateKey(daysAgo = 0) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

const today = getDateKey(0);

const labels = {
    eau: "Boire de l’eau",
    bouger: "Bouger",
    air: "Prendre l’air",
    lire: "Lire",
    craft: "Craft",
    nourriture: "Eau / nourriture",
    litiere: "Litière"
};

let appData = {};
let selectedMood = null;

function updateScore() {
    let scoreMoi = 0;
    let totalMoi = 0;
    let scoreChats = 0;
    let totalChats = 0;

    checkboxes.forEach((checkbox) => {
        const id = checkbox.id;

        if (id === "nourriture" || id === "litiere") {
            totalChats++;
            if (checkbox.checked) scoreChats++;
        } else {
            totalMoi++;
            if (checkbox.checked) scoreMoi++;
        }
    });

    scoreMoiDisplay.textContent = scoreMoi;
    totalMoiDisplay.textContent = totalMoi;
    scoreChatsDisplay.textContent = scoreChats;
    totalChatsDisplay.textContent = totalChats;
}

function getTodayDataFromScreen() {
    const todayData = {};

    checkboxes.forEach((checkbox) => {
        todayData[checkbox.id] = checkbox.checked;
    });

    todayData.mood = selectedMood;

    return todayData;
}

function applyTodayData() {
    const todayData = appData[today] || {};

    checkboxes.forEach((checkbox) => {
        checkbox.checked = todayData[checkbox.id] === true;
    });

    selectedMood = todayData.mood || null;
    selectedMoodDisplay.textContent = selectedMood || "aucune";

    moodButtons.forEach((button) => {
        button.classList.remove("active");

        if (button.textContent === selectedMood) {
            button.classList.add("active");
        }
    });

    updateScore();
}

async function saveData() {
    const todayData = getTodayDataFromScreen();

    const payload = {
        date: today,
        data: todayData,
        user_key: "nekonimbus"
    };

    console.log("DATA ENVOYÉE :", payload);

    const { error } = await supabaseClient
        .from("hibi_entries")
        .upsert([payload], { onConflict: "date,user_key" })

    if (error) {
        console.error("Erreur sauvegarde :", error);
        return;
    }

    appData[today] = todayData;
    displayHistory();

    console.log("Sauvegardé dans Supabase");
}

async function loadData() {
    const { data, error } = await supabaseClient
        .from("hibi_entries")
        .select("*")
        .eq("user_key", "nekonimbus")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Erreur chargement :", error);
        return;
    }

    console.log("Données Supabase :", data);

    appData = {};

    data.forEach((entry) => {
        appData[entry.date] = entry.data;
    });

    console.log("Données transformées :", appData);

    applyTodayData();
    displayHistory();
}

function getDayLabel(daysAgo) {
    if (daysAgo === 0) return "Aujourd’hui";
    if (daysAgo === 1) return "Hier";
    if (daysAgo === 2) return "Avant-hier";
    return "Il y a " + daysAgo + " jours";
}

function summarizeDay(data) {
    let scoreMoi = 0;
    let totalMoi = 0;
    let scoreChats = 0;
    let totalChats = 0;
    let doneItems = [];

    Object.keys(data).forEach((id) => {
        if (id === "mood") return;

        const isChecked = data[id];

        if (id === "nourriture" || id === "litiere") {
            totalChats++;
            if (isChecked) {
                scoreChats++;
                doneItems.push(labels[id]);
            }
        } else {
            totalMoi++;
            if (isChecked) {
                scoreMoi++;
                doneItems.push(labels[id]);
            }
        }
    });

    const moodLine = data.mood ? data.mood + "<br>" : "";

    const summary = "Moi : " + scoreMoi + " / " + totalMoi +
        " | Chats : " + scoreChats + " / " + totalChats;

    const details = doneItems.length > 0
        ? "<br><span class='details'>✔ " + doneItems.join(" ✔ ") + "</span>"
        : "";

    return moodLine + summary + details;
}

function displayHistory() {
    historyDisplay.innerHTML = "";

    for (let i = 0; i < 3; i++) {
        const dateKey = getDateKey(i);
        const dayData = appData[dateKey];

        const paragraph = document.createElement("p");

        if (!dayData) {
            paragraph.innerHTML = getDayLabel(i) + " : rien enregistré";
        } else {
            paragraph.innerHTML = getDayLabel(i) + " : " + summarizeDay(dayData);
        }

        historyDisplay.appendChild(paragraph);
    }
}

checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
        updateScore();
        saveData();
    });
});

moodButtons.forEach((button) => {
    button.addEventListener("click", () => {
        selectedMood = button.textContent;
        selectedMoodDisplay.textContent = selectedMood;

        moodButtons.forEach((b) => b.classList.remove("active"));
        button.classList.add("active");

        saveData();
    });
});

loadData();