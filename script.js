console.log("Supabase connecté ?", supabaseClient);

const checkboxes = document.querySelectorAll("input[type='checkbox']");
const scoreMoiDisplay = document.getElementById("score-moi");
const totalMoiDisplay = document.getElementById("total-moi");
const scoreChatsDisplay = document.getElementById("score-chats");
const totalChatsDisplay = document.getElementById("total-chats");
const historyDisplay = document.getElementById("history");
const moodButtons = document.querySelectorAll(".mood-button");
const selectedMoodDisplay = document.getElementById("selected-mood");

const today = new Date().toISOString().split("T")[0];

const labels = {
    eau: "Boire de l’eau",
    bouger: "Bouger",
    air: "Prendre l’air",
    lire: "Lire",
    craft: "Craft",
    nourriture: "Eau / nourriture",
    litiere: "Litière"
};

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

async function saveData() {
    const todayData = {};

    checkboxes.forEach((checkbox) => {
        todayData[checkbox.id] = checkbox.checked;
    });

    todayData.mood = selectedMood;

    const payload = {
        date: today,
        data: todayData,
        user_key: "nekonimbus"
    };

    console.log("DATA ENVOYÉE :", payload);

    const { data, error } = await supabaseClient
        .from("hibi_entries")
        .insert([payload]);

    if (error) {
        console.error("Erreur sauvegarde :", error);
    } else {
        console.log("Sauvegardé dans Supabase");
    }
}

async function loadData() {
    const { data, error } = await supabaseClient
        .from("hibi_entries")
        .select("*")
        .eq("user_key", "nekonimbus")
        .order("date", { ascending: false });

    if (error) {
        console.error("Erreur chargement :", error);
        return;
    }

    console.log("Données Supabase :", data);

    const cloudData = {};

    data.forEach((entry) => {
        cloudData[entry.date] = entry.data;
    });

    console.log("Données transformées :", cloudData);
}

function getDateKey(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split("T")[0];
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

    const moodLine = data.mood
        ? data.mood + "<br>"
        : "";

    const summary = "Moi : " + scoreMoi + " / " + totalMoi +
        " | Chats : " + scoreChats + " / " + totalChats;

    const details = doneItems.length > 0
        ? "<br><span class='details'>✔ " + doneItems.join(" ✔ ") + "</span>"
        : "";

    return moodLine + summary + details;
}

function displayHistory() {
    const allData = JSON.parse(localStorage.getItem("hibi")) || {};
    historyDisplay.innerHTML = "";

    for (let i = 0; i < 3; i++) {
        const dateKey = getDateKey(i);
        const dayData = allData[dateKey];

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
        displayHistory();
    });
});

moodButtons.forEach((button) => {
    button.addEventListener("click", () => {
        selectedMood = button.textContent;
        selectedMoodDisplay.textContent = selectedMood;

        moodButtons.forEach((b) => b.classList.remove("active"));
        button.classList.add("active");

        saveData();
        displayHistory();
    });
});

updateScore();
displayHistory();
loadData();