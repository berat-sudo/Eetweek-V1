const form = document.getElementById("preferences-form");
const menuContainer = document.getElementById("menu-container");
const menuSection = document.querySelector(".menu");

let currentMenu = [];

// Shuffle helper
function shuffleArray(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

// Fetch recepten via backend en filteren
async function generateMenu(favorite, diet) {
  try {
    const response = await fetch("/api/recipes");
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      alert("Geen recepten gevonden!");
      return [];
    }

    // Meerdere zoekwoorden splitsen
    const terms = favorite
      ? favorite.split(",").map(t => t.trim().toLowerCase())
      : [];

    // Filter op zoektermen
    let filtered = data;
    if (terms.length > 0) {
      filtered = data.filter(recipe => {
        const name = recipe.name.toLowerCase();
        const tags = recipe.tags?.map(t => t.toLowerCase().trim()) || [];
        return terms.some(term => name.includes(term) || tags.includes(term));
      });
    }

    // Filter op dieet of macros
    if (diet) {
      filtered = filtered.filter(recipe => {
        const tags = recipe.tags?.map(t => t.toLowerCase().trim()) || [];
        const macros = recipe.macros || {};
        switch (diet) {
          case "vegetarian":
            return tags.includes("vegetarisch");
          case "vegan":
            return tags.includes("vegan");
          case "lowcarb":
            return macros.carbs !== undefined && macros.carbs <= 20;
          case "highprotein":
            return macros.protein !== undefined && macros.protein >= 15;
          case "glutenfree":
            return tags.includes("glutenvrij");
          default:
            return true;
        }
      });
    }

    if (filtered.length === 0) {
      alert("Geen recepten gevonden die passen bij jouw voorkeur.");
      return [];
    }

    // Shuffle lijst
    filtered = shuffleArray(filtered);

    // Vul unieke gerechten voor 7 dagen
    const menu = [];
    const usedNames = new Set();
    for (let r of filtered) {
      if (!usedNames.has(r.name)) {
        menu.push(r);
        usedNames.add(r.name);
      }
      if (menu.length === 7) break;
    }

    while (menu.length < 7) menu.push(null);

    return menu;
  } catch (err) {
    console.error("Fout bij ophalen recepten:", err);
    alert("Er ging iets mis bij het laden van recepten.");
    return [];
  }
}

// Form submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const favorite = document.getElementById("favorite").value.trim();
  const diet = document.getElementById("diet").value;

  currentMenu = await generateMenu(favorite, diet);
  renderMenu();
  menuSection.scrollIntoView({ behavior: "smooth" });
});

// Render menu
function renderMenu() {
  menuContainer.innerHTML = "";
  const days = ["Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag","Zondag"];

  currentMenu.forEach((recipe, index) => {
    const card = document.createElement("div");
    card.classList.add("day-card");
    card.dataset.index = index;

    if (recipe) card.setAttribute("draggable", true);

    if (!recipe) {
      card.classList.add("placeholder");
      card.innerHTML = `
        <div class="plus-container">
          <div class="plus">+</div>
          <div class="plus-text">Voeg gerecht toe</div>
        </div>
      `;
    } else {
      card.innerHTML = `
        <button class="remove-btn">&times;</button>
        <h3>${days[index]}</h3>
        <div class="image-container" style="position:relative;">
          <img src="${recipe.image}" alt="${recipe.name}">
          <span class="duration-label" style="
            position:absolute;
            bottom:5px;
            left:5px;
            background: rgba(0,0,0,0.6);
            color: #fff;
            padding: 2px 5px;
            font-size: 12px;
            border-radius: 3px;
          ">⏱ ${recipe.duration} min</span>
        </div>
        <p>${recipe.name}</p>
      `;
    }

    // Drag events
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", index);
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
    card.addEventListener("dragover", (e) => { e.preventDefault(); card.classList.add("drag-over"); });
    card.addEventListener("dragleave", () => card.classList.remove("drag-over"));
    card.addEventListener("drop", (e) => {
      e.preventDefault();
      card.classList.remove("drag-over");
      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
      const toIndex = index;
      [currentMenu[fromIndex], currentMenu[toIndex]] = [currentMenu[toIndex], currentMenu[fromIndex]];
      renderMenu();
    });

    menuContainer.appendChild(card);
  });
}

// Klik op kaarten
menuContainer.addEventListener("click", async (e) => {
  const card = e.target.closest(".day-card");
  if (!card) return;

  const index = parseInt(card.dataset.index);

  if (e.target.classList.contains("remove-btn")) {
    currentMenu[index] = null;
    renderMenu();
    return;
  }

  if (e.target.closest(".plus-container")) {
    const favorite = document.getElementById("favorite").value.trim();
    const diet = document.getElementById("diet").value;
    const newRecipes = await generateMenu(favorite, diet);

    // Alleen gerechten die nog niet in currentMenu zitten
    const available = newRecipes.filter(r => r && !currentMenu.some(c => c && c.name === r.name));

    if (available.length > 0) {
      currentMenu[index] = available[Math.floor(Math.random() * available.length)];
      renderMenu();
    } else {
      alert("Geen nieuwe gerechten beschikbaar om toe te voegen!");
    }
    return;
  }

  if (currentMenu[index]) {
    const days = ["Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag","Zondag"];
    showRecipeDetails(days[index], currentMenu[index]);
  }
});

// Popup voor gerecht
function showRecipeDetails(day, recipe) {
  const overlay = document.createElement("div");
  overlay.classList.add("overlay");

  let persons = recipe.persons || 1;

  const getIngredientsHTML = () => {
    return recipe.ingredients.map(i => {
      const amountMatch = i.amount.match(/^([\d.,]+)\s*(.*)$/);
      let qty = i.amount;
      if (amountMatch) {
        qty = parseFloat(amountMatch[1].replace(",", ".")) * persons + " " + (amountMatch[2] || "");
      }
      return `<li>${i.item} – ${qty}</li>`;
    }).join("");
  };

  const getMacrosHTML = () => {
    if (!recipe.macros) return "";
    const protein = recipe.macros.protein * persons;
    const carbs = recipe.macros.carbs * persons;
    const fat = recipe.macros.fat * persons;
    return `
      <span class="protein">Eiwitten: ${protein} g</span>
      <span class="carbs">Koolhydraten: ${carbs} g</span>
      <span class="fat">Vetten: ${fat} g</span>
    `;
  };

  const recipeInfoHTML = `
    <div class="recipe-info" style="display:flex; justify-content:space-between; align-items:center;">
      <span class="duration">⏱ ${recipe.duration} min</span>
      <span class="macros">${getMacrosHTML()}</span>
    </div>
  `;

  overlay.innerHTML = `
    <div class="popup">
      <h2>${day} – ${recipe.name}</h2>
      <img src="${recipe.image}" alt="${recipe.name}">
      ${recipeInfoHTML}
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
        <label for="persons">Aantal personen:</label>
        <input type="number" id="persons" min="1" value="${persons}" style="width:60px;">
      </div>
      <h4>Ingrediënten:</h4>
      <ul class="ingredients-list">
        ${getIngredientsHTML()}
      </ul>
      <h4>Bereidingswijze:</h4>
      <p>${recipe.instructions}</p>
      <button id="close-popup">Sluiten</button>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector("#persons").addEventListener("input", (e) => {
    persons = parseInt(e.target.value) || 1;
    overlay.querySelector(".ingredients-list").innerHTML = getIngredientsHTML();
    overlay.querySelector(".macros").innerHTML = getMacrosHTML();
    recipe.persons = persons;
  });

  overlay.querySelector("#close-popup").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
}

// Boodschappenlijst
const shoppingListBtn = document.getElementById("shopping-list-btn");

if (shoppingListBtn) {
  shoppingListBtn.addEventListener("click", () => {
    const ingredientsMap = new Map();

    currentMenu.forEach(recipe => {
      if (recipe && recipe.ingredients) {
        const persons = recipe.persons || 1;
        recipe.ingredients.forEach(({ item, amount }) => {
          const match = amount.match(/^([\d.,]+)\s*(.*)$/);
          let quantity = null;
          let unit = "";
          if (match) {
            quantity = parseFloat(match[1].replace(",", ".")) * persons;
            unit = match[2] || "";
          } else {
            unit = amount;
          }

          if (!ingredientsMap.has(item)) ingredientsMap.set(item, []);
          ingredientsMap.get(item).push({ quantity, unit });
        });
      }
    });

    if (ingredientsMap.size === 0) {
      alert("Er staan nog geen gerechten in je weekmenu!");
      return;
    }

    const listItems = [];
    ingredientsMap.forEach((entries, item) => {
      const totals = {};
      entries.forEach(({ quantity, unit }) => {
        if (quantity != null) {
          if (!totals[unit]) totals[unit] = 0;
          totals[unit] += quantity;
        } else {
          totals[unit] = null;
        }
      });

      const totalStr = Object.entries(totals).map(([unit, total]) => total != null ? `${total} ${unit}`.trim() : unit).join(" + ");

      listItems.push(`
        <li class="shopping-item" style="display:flex; align-items:center; margin:0.3rem 0;">
          <input type="checkbox" class="ingredient-checkbox" style="margin-right:10px; flex:0 0 20px;">
          <span class="ingredient-name" style="flex:1;">${item}</span>
          <span class="ingredient-amount" style="flex:1; text-align:right;">${totalStr}</span>
        </li>
      `);
    });

    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    overlay.innerHTML = `
      <div class="popup">
        <h2>🛒 Jouw boodschappenlijst</h2>
        <ul>
          <li style="display:flex; justify-content:space-between; font-weight:bold; margin-bottom:0.5rem;">
            <span style="flex:0 0 20px;">Verwijder Product</span>
            <span style="flex:1; text-align:right;">Hoeveelheid</span>
          </li>
          ${listItems.join("")}
        </ul>
        <button id="close-list">Sluiten</button>
      </div>
    `;
    document.body.appendChild(overlay);

    // Checkbox functionaliteit: doorstrepen bij aanvinken
    overlay.querySelectorAll(".ingredient-checkbox").forEach(checkbox => {
      checkbox.addEventListener("change", (e) => {
        const li = e.target.closest(".shopping-item");
        if (e.target.checked) {
          li.style.textDecoration = "line-through";
          li.style.opacity = "0.6";
        } else {
          li.style.textDecoration = "none";
          li.style.opacity = "1";
        }
      });
    });

    overlay.querySelector("#close-list").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
  });

  // Hamburger menu
  const hamburger = document.querySelector(".hamburger");
  const navRight = document.querySelector(".nav-right");

  if (hamburger && navRight) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      navRight.classList.toggle("active");
    });
  }
}
