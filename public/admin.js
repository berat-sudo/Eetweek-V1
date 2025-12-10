const usersTable = document.querySelector("#users-table tbody");
const recipesTable = document.querySelector("#recipes-table tbody");
const addRecipeForm = document.getElementById("add-recipe-form");

const newsTable = document.querySelector("#news-table tbody");
const addNewsForm = document.getElementById("add-news-form");


// --- Laden van nieuwsberichten ---
async function loadNewsAdmin() {
  try {
    const res = await fetch("/api/admin/news");
    const news = await res.json();
    newsTable.innerHTML = "";
    news.forEach(n => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${n.title}</td>
        <td>${n.image ? `<img src="${n.image}" alt="${n.title}" width="100">` : "Geen afbeelding"}</td>
        <td>
          <button data-id="${n._id}" class="delete-news">Verwijder</button>
        </td>
      `;
      newsTable.appendChild(tr);
    });
  } catch (err) {
    console.error("Kon nieuws niet laden", err);
  }
}

// --- Nieuwsbericht verwijderen ---
newsTable.addEventListener("click", async e => {
  if (e.target.classList.contains("delete-news")) {
    const id = e.target.dataset.id;
    if (confirm("Weet je zeker dat je dit nieuwsbericht wilt verwijderen?")) {
      try {
        const res = await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Kon nieuwsbericht niet verwijderen");
        loadNewsAdmin();
      } catch (err) {
        console.error(err);
        alert(err.message);
      }
    }
  }
});

// --- Nieuw nieuwsbericht toevoegen ---
addNewsForm.addEventListener("submit", async e => {
  e.preventDefault();

  const formData = new FormData(addNewsForm);

  try {
    const res = await fetch("/api/admin/news", {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Kon nieuwsbericht niet opslaan");

    alert("Nieuwsbericht succesvol toegevoegd!");
    addNewsForm.reset();
    loadNewsAdmin();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});

// --- Init ---
loadNewsAdmin();


// --- Laden van gebruikers ---
async function loadUsers() {
  try {
    const res = await fetch("/api/admin/users");
    const users = await res.json();
    usersTable.innerHTML = "";
    users.forEach(u => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.isAdmin ? "Ja" : "Nee"}</td>
        <td>
          <button data-id="${u._id}" class="delete-user">Verwijder</button>
        </td>
      `;
      usersTable.appendChild(tr);
    });
  } catch (err) {
    console.error("Kon gebruikers niet laden", err);
  }
}

// --- Laden van recepten ---
async function loadRecipes() {
  try {
    const res = await fetch("/api/admin/recipes");
    const recipes = await res.json();
    recipesTable.innerHTML = "";
    recipes.forEach(r => {
      const tr = document.createElement("tr");
      // Voeg hier eventueel een kolom toe om de chef te tonen
      tr.innerHTML = `
        <td>${r.name}</td>
        <td>${r.userId ? r.userId.name : "Algemeen"}</td>
        <td>${r.image ? `<img src="${r.image}" alt="${r.name}" width="100">` : "Geen foto"}</td>
        <td>
          <button data-id="${r._id}" class="delete-recipe">Verwijder</button>
        </td>
      `;
      recipesTable.appendChild(tr);
    });
  } catch (err) {
    console.error("Kon recepten niet laden", err);
  }
}

// --- Delete knoppen ---
recipesTable.addEventListener("click", async e => {
  if (e.target.classList.contains("delete-recipe")) {
    const id = e.target.dataset.id;
    if (confirm("Weet je zeker dat je dit recept wilt verwijderen?")) {
      try {
        const res = await fetch(`/api/admin/recipes/${id}`, { method: "DELETE" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Kon recept niet verwijderen");
        loadRecipes();
      } catch (err) {
        console.error(err);
        alert(err.message);
      }
    }
  }
});

usersTable.addEventListener("click", async e => {
  if (e.target.classList.contains("delete-user")) {
    const id = e.target.dataset.id;
    if (confirm("Weet je zeker dat je deze gebruiker wilt verwijderen?")) {
      try {
        const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Kon gebruiker niet verwijderen");
        loadUsers();
      } catch (err) {
        console.error(err);
        alert(err.message);
      }
    }
  }
});

// --- Nieuw recept toevoegen met afbeelding ---
addRecipeForm.addEventListener("submit", async e => {
  e.preventDefault();

  const formData = new FormData(addRecipeForm);

  try {
    const res = await fetch("/api/admin/recipes", {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Kon recept niet opslaan");

    alert("Recept succesvol toegevoegd!");
    addRecipeForm.reset();
    loadRecipes();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});

// --- Init ---
loadUsers();
loadRecipes();