const checkboxes = document.querySelectorAll("input[type='checkbox']");
const scoreMoiDisplay = document.getElementById("score-moi");
const totalMoiDisplay = document.getElementById("total-moi");
const scoreChatsDisplay = document.getElementById("score-chats");
const totalChatsDisplay = document.getElementById("total-chats");
const historyDisplay = document.getElementById("history");
const moodButtons = document.querySelectorAll(".mood-button");
const selectedMoodDisplay = document.getElementById("selected-mood");

const today = new Date().toISOString().split("T")[0];

const allData = JSON.parse(localStorage.getItem("hibi")) || {};
const todayData = allData[today] || {};

const labels = {
    eau: "Boire de l’eau",
    bouger: "Bouger",
    air: "Prendre l’air",
    lire: "Lire",
    craft: "Craft",
    nourriture: "Eau / nourriture",
    litiere: "Litière"
};

let selectedMood = todayData.mood || null;

if (selectedMood) {
    selectedMoodDisplay.textContent = selectedMood;
}

checkboxes.forEach((checkbox) => {
    if (todayData[checkbox.id] === true) {
        checkbox.checked = true;
    }
});

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

function saveData() {
    const allData = JSON.parse(localStorage.getItem("hibi")) || {};
    const todayData = {};

    checkboxes.forEach((checkbox) => {
        todayData[checkbox.id] = checkbox.checked;
    });

    todayData.mood = selectedMood;

    allData[today] = todayData;
    localStorage.setItem("hibi", JSON.stringify(allData));
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
const summary = "Moi : " + scoreMoi + " / " + totalMoi +
    " | Chats : " + scoreChats + " / " + totalChats;
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
