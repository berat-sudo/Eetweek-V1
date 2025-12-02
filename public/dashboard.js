document.addEventListener("DOMContentLoaded", () => {
  // ===================== Variabelen =====================
  const userNameEl = document.getElementById("user-name");
  const userNameSidebarEl = document.getElementById("user-name-sidebar");
  const favoriteRecipesContainer = document.getElementById("favorite-recipes-container");
  const ownRecipesContainer = document.getElementById("own-recipes-container");
  const savedMenusContainer = document.getElementById("saved-menus-container");
  const form = document.getElementById("preferences-form");
  const menuContainer = document.getElementById("menu-container");
  const menuSection = document.querySelector(".menu");
  const shoppingListBtn = document.getElementById("shopping-list-btn");
  const saveMenuBtn = document.getElementById("save-menu-btn");
  const searchInput = document.getElementById("recipe-search-input");
  const searchRecipesContainer = document.getElementById("search-recipes-container");
  const dietSelect = document.getElementById("recipe-diet");
  

  
  let favoriteRecipes = [];
  let currentMenu = [];
  let savedMenus = [];


 

let allRecipes = [];

// Recepten ophalen
async function loadAllRecipes() {
  try {
    const res = await fetch("/api/recipes");
    if (!res.ok) return;
    allRecipes = await res.json();
    renderSearchRecipes(allRecipes);
  } catch (err) {
    console.error("Fout bij laden recepten:", err);
  }
}

// Render functie
function renderSearchRecipes(recipes) {
  searchRecipesContainer.innerHTML = "";
  if (recipes.length === 0) {
    searchRecipesContainer.innerHTML = "<p>Geen recepten gevonden.</p>";
    return;
  }

  recipes.forEach(recipe => {
    const isFavorite = favoriteRecipes.some(r => r._id === recipe._id);

    const card = document.createElement("div");
    card.classList.add("day-card");
    card.style.minWidth = "180px";
    card.style.flex = "0 0 auto";
    card.style.position = "relative";

    card.innerHTML = `
      <div class="image-container" style="position:relative;">
        <img src="${getRecipeImage(recipe)}" alt="${recipe.name}">
        <span class="duration-label" style="
          position:absolute; bottom:5px; left:5px;
          background: rgba(0,0,0,0.6); color:#fff;
          padding:2px 5px; font-size:12px; border-radius:3px;">
          ⏱ ${recipe.duration} min
        </span>

        <span class="heart" style="
          position:absolute; bottom:5px; right:5px;
          cursor:pointer; font-size:20px;
          color:${isFavorite ? "red" : "white"};
        ">${isFavorite ? "❤️" : "♡"}</span>
      </div>

      <p style="text-align:center; margin-top:0.3rem;">${recipe.name}</p>
    `;

    // ❤️ Like functionaliteit
    const heart = card.querySelector(".heart");
    heart.addEventListener("click", async (e) => {
      e.stopPropagation();

      try {
        if (!favoriteRecipes.some(r => r._id === recipe._id)) {
          await fetch(`/api/favorites/${recipe._id}`, { method: "POST" });
          favoriteRecipes.push(recipe);
        } else {
          await fetch(`/api/favorites/${recipe._id}`, { method: "DELETE" });
          favoriteRecipes = favoriteRecipes.filter(r => r._id !== recipe._id);
        }

        renderSearchRecipes(recipes);      // update hartje
        renderFavoriteRecipes();           // update favorietenlijst
        renderMenu();                      // update weekmenu hartjes

      } catch (err) {
        console.error("Fout bij togglen favoriet:", err);
      }
    });

    // Klik op recept → popup
    card.addEventListener("click", () => showRecipeDetails("", recipe));

    searchRecipesContainer.appendChild(card);
  });
}




// Zoek functionaliteit
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase().trim();
  const filtered = allRecipes.filter(r =>
    r.name.toLowerCase().includes(query) ||
    (r.tags?.some(tag => tag.toLowerCase().includes(query)))
  );
  renderSearchRecipes(filtered);
});

// Initial load
loadFavorites();
loadAllRecipes();


  // ===================== Helpers =====================
  const getRecipeImage = (recipe) =>
    recipe?.image?.trim() ? recipe.image : "/Fotos/logo_.png";

  const shuffleArray = (array) =>
    array.map(v => ({ v, sort: Math.random() }))
         .sort((a, b) => a.sort - b.sort)
         .map(({ v }) => v);

  // ===================== Gebruikersnaam laden =====================
  async function loadUserName() {
    try {
      const res = await fetch("/api/user");
      if (!res.ok) return;
      const data = await res.json();
  
      userNameEl.textContent = data.name;
      userNameSidebarEl.textContent = data.name;
  
      const profileCircle = document.getElementById("profile-circle");
      profileCircle.textContent = data.name.charAt(0).toUpperCase();
  
    } catch (err) {
      console.error("Fout bij laden gebruikersnaam:", err);
    }
  }
  
  loadUserName();

 // ===================== Eigen recepten laden =====================
async function loadOwnRecipes() {
  try {
    const res = await fetch("/api/myrecipes");
    if (!res.ok) return;
    const recipes = await res.json();
    if (!ownRecipesContainer) return;
    ownRecipesContainer.innerHTML = "";

    if (recipes.length === 0) {
      ownRecipesContainer.innerHTML = "<p>Hier komen je eigen recepten te staan.</p>";
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.overflowX = "auto";
    wrapper.style.gap = "1rem";
    wrapper.style.padding = "0.5rem 0";

    recipes.forEach(recipe => {
      const card = document.createElement("div");
      card.classList.add("day-card");
      card.style.minWidth = "180px";
      card.style.flex = "0 0 auto";
      card.style.position = "relative";

      card.innerHTML = `
        <div class="image-container" style="position:relative;">
          <img src="${getRecipeImage(recipe)}" alt="${recipe.name}">
          <span class="duration-label" style="position:absolute; bottom:5px; left:5px; background: rgba(0,0,0,0.6); color:#fff; padding:2px 5px; font-size:12px; border-radius:3px;">
                  ⏱ ${recipe.duration} min
              </span>

              <img 
                  src="/Fotos/prullenbakicon.png" 
                  alt="Verwijderen" 
                  class="delete-btn"
                  style="
                      position:absolute; 
                      bottom:5px; 
                      right:5px; 
                      width:40%;   
                      height:auto; 
                      cursor:pointer;
                      max-width:25px;
                  "
              >

              <img 
                  src="/Fotos/shareicon.png" 
                  alt="Delen" 
                  class="share-btn"
                  style="
                      position:absolute; 
                      bottom:5px; 
                      right:35px; 
                      width:40%;
                      height:auto;
                      cursor:pointer;
                      max-width:25px;
                  "
              >
        </div>
        <p style="text-align:center; margin-top:0.3rem;">${recipe.name}</p>
      `;

      // Verwijderen knop
      const deleteBtn = card.querySelector(".delete-btn");
      deleteBtn.addEventListener("click", async e => {
        e.stopPropagation();
        if (!confirm(`Weet je zeker dat je "${recipe.name}" wilt verwijderen?`)) return;
        try {
          const res = await fetch(`/api/recipes/${recipe._id}`, { method: "DELETE" });
          if (res.ok) card.remove();
          else alert("Kon recept niet verwijderen.");
        } catch (err) {
          console.error(err);
          alert("Fout bij verbinden met server.");
        }
      });

      // Delen knop
      const shareBtn = card.querySelector(".share-btn");
      shareBtn.addEventListener("click", async e => {
        e.stopPropagation();
        const targetUser = await promptEmail();
if (!targetUser) return;


        try {
          const res = await fetch("/api/share-recipe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipeId: recipe._id,
              targetEmail: targetUser
            })
          });

          if (res.ok) {
            showSharedToast(targetUser);

          } else {
            alert("Kon het recept niet delen (bestaat de gebruiker wel?)");
          }
        } catch (err) {
          console.error(err);
          alert("Fout bij delen van recept.");
        }
      });

      // Klik op de kaart → details popup
      card.addEventListener("click", () => showRecipeDetails("", recipe));

      wrapper.appendChild(card);
    });

    ownRecipesContainer.appendChild(wrapper);
  } catch (err) {
    console.error("Fout bij laden eigen recepten:", err);
  }
}

loadOwnRecipes();


  // ===================== Favorieten =====================
  async function loadFavorites() {
    try {
      const res = await fetch("/api/favorites");
      if (!res.ok) return;
      favoriteRecipes = await res.json();
      renderFavoriteRecipes();
      loadSavedMenu();
    } catch (err) {
      console.error("Fout bij laden favorieten:", err);
    }
  }

  function renderFavoriteRecipes() {
    if (!favoriteRecipesContainer) return;
    favoriteRecipesContainer.innerHTML = "";

    if (favoriteRecipes.length === 0) {
      favoriteRecipesContainer.innerHTML = "<p>Hier komen je favoriete recepten te staan.</p>";
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.overflowX = "auto";
    wrapper.style.gap = "1rem";
    wrapper.style.padding = "0.5rem 0";

    favoriteRecipes.forEach(recipe => {
      const card = document.createElement("div");
      card.classList.add("day-card");
      card.style.minWidth = "180px";
      card.style.flex = "0 0 auto";
      card.style.position = "relative";

      card.innerHTML = `
        <div class="image-container" style="position:relative;">
          <img src="${getRecipeImage(recipe)}" alt="${recipe.name}">
          <span class="duration-label" style="position:absolute; bottom:5px; left:5px; background: rgba(0,0,0,0.6); color:#fff; padding:2px 5px; font-size:12px; border-radius:3px;">⏱ ${recipe.duration} min</span>
          <span class="heart" style="position:absolute; bottom:5px; right:5px; cursor:pointer; font-size:20px; color:red;">❤️</span>
        </div>
        <p style="text-align:center; margin-top:0.3rem;">${recipe.name}</p>
      `;

      const heart = card.querySelector(".heart");
      heart.addEventListener("click", async e => {
        e.stopPropagation();
        try {
          if (!favoriteRecipes.some(r => r._id === recipe._id)) {
            const res = await fetch(`/api/favorites/${recipe._id}`, { method: "POST" });
            if (!res.ok) throw new Error("Kon favoriet niet toevoegen");
            favoriteRecipes.push(recipe);
          } else {
            const res = await fetch(`/api/favorites/${recipe._id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Kon favoriet niet verwijderen");
            favoriteRecipes = favoriteRecipes.filter(r => r._id !== recipe._id);
          }
          renderFavoriteRecipes();
          renderMenu();
        } catch (err) {
          console.error("Fout bij updaten favoriet:", err);
        }
      });

      card.addEventListener("click", () => showRecipeDetails("", recipe));
      wrapper.appendChild(card);
    });

    favoriteRecipesContainer.appendChild(wrapper);
  }

  loadFavorites();

  // ===================== Menu generatie =====================
  async function generateMenu(favorite, diet) {
    try {
      const response = await fetch("/api/recipes");
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) { alert("Geen recepten gevonden!"); return []; }

      let filtered = data;

      if (favorite) {
        // Split de input op komma's en trim spaties
        const favList = favorite.split(",").map(f => f.toLowerCase().trim()).filter(f => f);
      
        filtered = filtered.filter(recipe => {
          const recipeName = recipe.name.toLowerCase();
          const recipeTags = recipe.tags?.map(tag => tag.toLowerCase()) || [];
          // Check of één van de favorieten in de naam of tags voorkomt
          return favList.some(fav => recipeName.includes(fav) || recipeTags.includes(fav));
        });
      }
      

      if (diet) {
        filtered = filtered.filter(recipe => {
          const tags = recipe.tags?.map(t => t.toLowerCase().trim()) || [];
          const macros = recipe.macros || {};
          switch(diet) {
            case "vegetarian": return tags.includes("vegetarisch");
            case "vegan": return tags.includes("vegan");
            case "lowcarb": return macros.carbs !== undefined && macros.carbs <= 20;
            case "highprotein": return macros.protein !== undefined && macros.protein >= 15;
            case "glutenvrij": return tags.includes("glutenvrij"); // nieuwe case
            default: return true;
          }
        });
      }
      

      if (filtered.length === 0) { alert("Geen recepten gevonden die passen bij jouw voorkeur."); return []; }

      filtered = shuffleArray(filtered);

      const menu = [];
      const usedNames = new Set();
      for (let r of filtered) {
        if (!usedNames.has(r.name)) { menu.push(r); usedNames.add(r.name); }
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

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const favorite = document.getElementById("favorite").value.trim();
    const diet = document.getElementById("diet").value;
    currentMenu = await generateMenu(favorite, diet);
    renderMenu();
    menuSection.scrollIntoView({ behavior: "smooth" });
  });

  // ===================== Menu render =====================
  function renderMenu() {
    if (!menuContainer) return;
    menuContainer.innerHTML = "";
    const days = ["Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag","Zondag"];

    currentMenu.forEach((recipe, index) => {
      const card = document.createElement("div");
      card.classList.add("day-card");
      card.dataset.index = index;
      if (recipe) card.setAttribute("draggable", true);

      if (!recipe) {
        card.classList.add("placeholder");
        card.innerHTML = `<div class="plus-container" style="cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%;">
          <div class="plus" style="font-size:2rem;">+</div>
          <div class="plus-text" style="font-size:0.9rem;">Voeg gerecht toe</div>
        </div>`;
        const plusContainer = card.querySelector(".plus-container");
        plusContainer.addEventListener("click", async () => {
          const favorite = document.getElementById("favorite").value.trim();
          const diet = document.getElementById("diet").value;
          const menu = await generateMenu(favorite, diet);
          currentMenu[index] = menu[0] || null;
          renderMenu();
        });
      } else {
        const isFavorite = favoriteRecipes.some(r => r._id === recipe._id);
        card.innerHTML = `
          <button class="remove-btn" style="position:absolute; top:5px; right:5px; z-index:2;">&times;</button>
          <h3>${days[index]}</h3>
          <div class="image-container" style="position:relative;">
            <img src="${getRecipeImage(recipe)}" alt="${recipe.name}">
            <span class="duration-label" style="position:absolute; bottom:5px; left:5px; background: rgba(0,0,0,0.6); color:#fff; padding:2px 5px; font-size:12px; border-radius:3px;">⏱ ${recipe.duration} min</span>
            <span class="heart" style="position:absolute; bottom:5px; right:5px; cursor:pointer; font-size:20px; color:${isFavorite ? "red" : "white"};">${isFavorite ? "❤️" : "♡"}</span>
          </div>
          <p>${recipe.name}</p>`;

        const heart = card.querySelector(".heart");
        heart.addEventListener("click", async e => {
          e.stopPropagation();
          try {
            if (!favoriteRecipes.some(r => r._id === recipe._id)) {
              await fetch(`/api/favorites/${recipe._id}`, { method: "POST" });
              favoriteRecipes.push(recipe);
            } else {
              await fetch(`/api/favorites/${recipe._id}`, { method: "DELETE" });
              favoriteRecipes = favoriteRecipes.filter(r => r._id !== recipe._id);
            }
            renderMenu();
            renderFavoriteRecipes();
          } catch (err) {
            console.error("Fout bij updaten favoriet:", err);
          }
        });

        card.querySelector(".remove-btn")?.addEventListener("click", e => {
          e.stopPropagation();
          currentMenu[index] = null;
          renderMenu();
        });
      }

      // Drag & drop
      card.addEventListener("dragstart", e => { e.dataTransfer.setData("text/plain", index); card.classList.add("dragging"); });
      card.addEventListener("dragend", () => card.classList.remove("dragging"));
      card.addEventListener("dragover", e => { e.preventDefault(); card.classList.add("drag-over"); });
      card.addEventListener("dragleave", () => card.classList.remove("drag-over"));
      card.addEventListener("drop", e => {
        e.preventDefault(); card.classList.remove("drag-over");
        const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
        [currentMenu[fromIndex], currentMenu[index]] = [currentMenu[index], currentMenu[fromIndex]];
        renderMenu();
      });

      card.addEventListener("click", () => { if (recipe) showRecipeDetails(days[index], recipe); });
      menuContainer.appendChild(card);
    });
  }

  // ===================== Geslagen weekmenu render =====================
  function renderSavedMenus() {
    if (!savedMenusContainer) return;
    savedMenusContainer.innerHTML = "";
  
    if (savedMenus.length === 0) {
      savedMenusContainer.innerHTML = "<p>Hier komen je opgeslagen weekmenu's te staan.</p>";
      return;
    }
  
    const dayNames = ["Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag","Zondag"];
  
    savedMenus.forEach((menu, menuIndex) => {
      const menuWrapper = document.createElement("div");
      menuWrapper.style.marginBottom = "1.5rem";
  
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "🗑️ Verwijder menu";
      deleteBtn.style.cssText = `
        padding:0.3rem 0.6rem;
        border:none;
        border-radius:5px;
        background:#ff4d4d;
        color:#fff;
        cursor:pointer;
        margin-bottom:0.5rem;
      `;
      deleteBtn.addEventListener("click", async () => {
        if (!confirm("Weet je zeker dat je dit weekmenu wilt verwijderen?")) return;
        try {
          const res = await fetch(`/api/savedmenus/${menuIndex}`, { method: "DELETE" });
          if (res.ok) {
            savedMenus.splice(menuIndex, 1);
            renderSavedMenus();
            alert("Weekmenu verwijderd!");
          } else throw new Error("Kon weekmenu niet verwijderen");
        } catch (err) {
          console.error(err);
          alert("Fout bij verwijderen weekmenu");
        }
      });
  
      menuWrapper.appendChild(deleteBtn);
  
      const wrapper = document.createElement("div");
      wrapper.classList.add("saved-menu-wrapper");
      wrapper.style.display = "flex";
      wrapper.style.overflowX = "auto";
      wrapper.style.gap = "1rem";
  
      menu.forEach((recipe, dayIndex) => {
        const card = document.createElement("div");
        card.classList.add("day-card");
        card.style.minWidth = "180px";
        card.style.flex = "0 0 auto";
        card.style.position = "relative";
        card.style.cursor = recipe ? "pointer" : "default";
  
        const title = document.createElement("h3");
        title.style.textAlign = "center";
        title.style.marginBottom = "0.3rem";
        title.textContent = dayNames[dayIndex];
        card.appendChild(title);
  
        if (recipe) {
          const imgContainer = document.createElement("div");
          imgContainer.classList.add("image-container");
          imgContainer.style.position = "relative";
  
          const img = document.createElement("img");
          img.src = getRecipeImage(recipe);
          img.alt = recipe.name;
          img.style.width = "100%";
          img.style.borderRadius = "8px";
  
          const durationLabel = document.createElement("span");
          durationLabel.classList.add("duration-label");
          durationLabel.style.position = "absolute";
          durationLabel.style.bottom = "5px";
          durationLabel.style.left = "5px";
          durationLabel.style.background = "rgba(0,0,0,0.6)";
          durationLabel.style.color = "#fff";
          durationLabel.style.padding = "2px 5px";
          durationLabel.style.fontSize = "12px";
          durationLabel.style.borderRadius = "3px";
          durationLabel.textContent = `⏱ ${recipe.duration || 0} min`;
  
          imgContainer.appendChild(img);
          imgContainer.appendChild(durationLabel);
          card.appendChild(imgContainer);
  
          const nameP = document.createElement("p");
          nameP.style.textAlign = "center";
          nameP.style.marginTop = "0.3rem";
          nameP.textContent = recipe.name || "Onbekend gerecht";
          card.appendChild(nameP);
  
          // ✅ Popup listener
          card.addEventListener("click", () => showRecipeDetails(dayNames[dayIndex], recipe));
        } else {
          card.classList.add("placeholder");
          const plusContainer = document.createElement("div");
          plusContainer.style.display = "flex";
          plusContainer.style.flexDirection = "column";
          plusContainer.style.alignItems = "center";
          plusContainer.style.justifyContent = "center";
          plusContainer.style.height = "100%";
  
          const plus = document.createElement("div");
          plus.style.fontSize = "2rem";
          plus.textContent = "+";
          const plusText = document.createElement("div");
          plusText.style.fontSize = "0.9rem";
          plusText.textContent = "Leeg";
  
          plusContainer.appendChild(plus);
          plusContainer.appendChild(plusText);
          card.appendChild(plusContainer);
        }
  
        wrapper.appendChild(card);
      });
  
      menuWrapper.appendChild(wrapper);
      savedMenusContainer.appendChild(menuWrapper);
    });
  }

  async function loadSavedMenu() {
    try {
      const res = await fetch("/api/savedmenus");
      if (!res.ok) return;
      const menus = await res.json();
  
      // Vervang de opgeslagen menu-items door volledige recepten
      savedMenus = menus.map(menu => {
        return menu.map(recipe => {
          if (!recipe) return null;
          return allRecipes.find(r => r._id === recipe._id) || recipe;
        });
      });
  
      renderSavedMenus();
    } catch (err) {
      console.error("Kon opgeslagen weekmenu niet laden:", err);
    }
  }
  

  

  saveMenuBtn?.addEventListener("click", async () => {
    if (!currentMenu.length) {
      showToast("Je hebt nog geen menu samengesteld!", "#ff4d4d");
      return;
    }
  
    const name = await promptMenuName(`Weekmenu ${Date.now()}`);
if (!name) return;

  
    try {
      const res = await fetch("/api/savedmenus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, menu: currentMenu }),
        credentials: "include"  // cookies meegestuurd als je sessie gebruikt
      });
  
      if (!res.ok) throw new Error("Kon menu niet opslaan op server");
  
      const data = await res.json();
      savedMenus = data.savedMenus || [];
      renderSavedMenus();
      showToast("Weekmenu opgeslagen!");
    } catch (err) {
      console.error(err);
      showToast("Fout bij opslaan weekmenu", "#ff4d4d");
    }
  
  
    
  
    // ✅ Toast tonen
    showToast("Weekmenu opgeslagen!");
  });
  

  
  

  // ===================== Popup functie =====================
  function showRecipeDetails(day, recipe) {
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");

    let persons = recipe.persons || 1;

    const getIngredientsHTML = () => (recipe.ingredients || []).map(i => {
      if (!i.amount) return `<li>${i.item}</li>`;
      const match = i.amount.match(/^([\d.,]+)\s*(.*)$/);
      let qty = i.amount;
      if (match) qty = parseFloat(match[1].replace(",", ".")) * persons + " " + (match[2] || "");
      return `<li>${i.item} – ${qty}</li>`;
    }).join("");

    const getMacrosHTML = () => {
      if (!recipe.macros) return "";
      return `<span class="protein">Eiwitten: ${recipe.macros.protein * persons} g</span>
              <span class="carbs">Koolhydraten: ${recipe.macros.carbs * persons} g</span>
              <span class="fat">Vetten: ${recipe.macros.fat * persons} g</span>`;
    };

    overlay.innerHTML = `
    <div class="popup" style="max-width: 500px;>
  <div class="popup">
    <h2>${recipe.name}</h2>
    ${day ? `<p class="popup-day">${day}</p>` : ""}
    <img src="${getRecipeImage(recipe)}" alt="${recipe.name}">
    <div class="recipe-info">
      <span class="duration">⏱ ${recipe.duration} min</span>
      <span class="macros">${getMacrosHTML()}</span>
    </div>
    <div class="persons-input">
      <label for="persons">Aantal personen:</label>
      <input type="number" id="persons" min="1" value="${persons}">
    </div>
    <h4>Ingrediënten:</h4>
    <ul class="ingredients-list">${getIngredientsHTML()}</ul>
    <h4>Bereidingswijze:</h4>
    <p>${recipe.instructions || "Geen bereidingswijze beschikbaar"}</p>
    <div class="popup-buttons">
      <button class="add-to-menu-btn">Voeg toe aan weekmenu</button>
      <button class="close-popup-btn">Sluiten</button>
    </div>
  </div>
`;


    document.body.appendChild(overlay);

    overlay.querySelector("#persons").addEventListener("input", e => {
      persons = parseInt(e.target.value) || 1;
      overlay.querySelector(".ingredients-list").innerHTML = getIngredientsHTML();
      overlay.querySelector(".macros").innerHTML = getMacrosHTML();
      recipe.persons = persons;
    });

    overlay.querySelector(".close-popup-btn").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });

    // Voeg toe aan weekmenu
    overlay.querySelector(".add-to-menu-btn").addEventListener("click", () => {
      // Voeg recept toe op de eerste lege plek
      const emptyIndex = currentMenu.indexOf(null);
      if (emptyIndex === -1) {
        alert("Er is geen lege dag meer in je weekmenu!");
        return;
      }
    
      currentMenu[emptyIndex] = { ...recipe };
      renderMenu();
      overlay.remove();
    
      // Toast tonen
      showRecipeAddedToast(["Ma","Di","Wo","Do","Vr","Za","Zo"][emptyIndex]);
    
      // Scroll terug naar weekmenu
      const menuSection = document.querySelector(".menu");
      if (menuSection) menuSection.scrollIntoView({ behavior: "smooth" });
    });
    

  }

  // ===================== Boodschappenlijst =====================
  if (shoppingListBtn) {
    shoppingListBtn.addEventListener("click", () => {
      const ingredientsMap = new Map();
      currentMenu.forEach(recipe => {
        if (recipe && recipe.ingredients) {
          const persons = recipe.persons || 1;
          recipe.ingredients.forEach(({ item, amount }) => {
            if (!amount) amount = "";
            const match = amount.match(/^([\d.,]+)\s*(.*)$/);
            let quantity = null, unit = "";
            if (match) {
              quantity = parseFloat(match[1].replace(",", ".")) * persons;
              unit = match[2] || "";
            } else unit = amount;
            if (!ingredientsMap.has(item)) ingredientsMap.set(item, []);
            ingredientsMap.get(item).push({ quantity, unit });
          });
        }
      });
  
      if (ingredientsMap.size === 0) { 
        // 🛑 HIER IS DE alert() VERVANGEN 🛑
        showToast("Er staan nog geen gerechten in je weekmenu!", "#ff4d4d"); 
        return; 
      }
  
      const listItems = [];
      ingredientsMap.forEach((entries, item) => {
        const totals = {};
        entries.forEach(({ quantity, unit }) => {
          if (quantity != null) { 
            if (!totals[unit]) totals[unit] = 0; 
            totals[unit] += quantity; 
          } else totals[unit] = null;
        });
        const totalStr = Object.entries(totals)
          .map(([unit, total]) => total != null ? `${total} ${unit}`.trim() : unit)
          .join(" + ");
        listItems.push(`<li class="shopping-item" style="display:flex; align-items:center; margin:0.3rem 0;">
          <input type="checkbox" class="ingredient-checkbox" style="margin-right:10px; flex:0 0 20px;">
          <span class="ingredient-name" style="flex:1;">${item}</span>
          <span class="ingredient-amount" style="flex:1; text-align:right;">${totalStr}</span>
        </li>`);
      });
  
      const overlay = document.createElement("div");
      overlay.classList.add("overlay");
      overlay.innerHTML = `<div class="popup">
        <h2 style="margin-bottom:15px; color:#4caf50; display:flex; justify-content:space-between; align-items:center;">
          <span style="display:flex; align-items:center;">
            <img src="/Fotos/winkelmandjeblack.png" alt="Boodschappen" style="width:20px; height:20px; margin-right:6px;">
            Boodschappenlijst
          </span>
          <button id="copy-list-btn" style="
            padding:0.3rem 0.8rem;
      border-radius:12px;
      background:#32cd32;
      border:none;
      color:white;
      font-weight:bold;
      cursor:pointer;
      display:flex;
      align-items:center;
      font-size:0.9rem;
          ">
            <img src="/Fotos/copyicon.png" alt="Kopieer" style="width:16px; height:16px; margin-right:5px;">
            Kopieer
          </button>
        </h2>
        <ul style="padding:0; list-style:none; margin:0 0 20px 0;">
            ${listItems.join("")}
        </ul>
        <button id="close-list" style="
            display:block; width:100%; padding:0.6rem; border:none;
            border-radius:12px; background:linear-gradient(90deg,#ff7f50,#ffb347);
            color:white; font-weight:bold; cursor:pointer; font-size:1rem;
        ">Sluiten</button>
      </div>`;
      document.body.appendChild(overlay);
  
      // Checkbox functionaliteit
      overlay.querySelectorAll(".ingredient-checkbox").forEach(checkbox => {
        checkbox.addEventListener("change", e => {
          const li = e.target.closest(".shopping-item");
          if (e.target.checked) { li.style.textDecoration = "line-through"; li.style.opacity = "0.6"; }
          else { li.style.textDecoration = "none"; li.style.opacity = "1"; }
        });
      });
  
      // Sluitknop
      overlay.querySelector("#close-list").addEventListener("click", () => overlay.remove());
      overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
  
      const copyBtn = overlay.querySelector("#copy-list-btn");
  
      // Zet knop onder de lijst op mobiel
      function adjustCopyButton() {
        const ul = overlay.querySelector("ul");
        if (window.innerWidth <= 600) {
          ul.after(copyBtn);
          copyBtn.style.width = "100%";
          copyBtn.style.marginTop = "10px";
        }
else {
          overlay.querySelector("h2").appendChild(copyBtn); // terug naar header op desktop
          copyBtn.style.width = "auto";
          copyBtn.style.marginTop = "0";
        }
      }
  
      adjustCopyButton();
      window.addEventListener("resize", adjustCopyButton);
  
      // Kopieer knop functionaliteit
      copyBtn.addEventListener("click", () => {
        const itemsText = Array.from(overlay.querySelectorAll(".shopping-item"))
          .map(li => {
            const name = li.querySelector(".ingredient-name").textContent;
            const amount = li.querySelector(".ingredient-amount").textContent;
            return `${name}: ${amount}`;
          }).join("\n");
  
        navigator.clipboard.writeText(itemsText)
          .then(() => showCopiedToast())
          .catch(() => showCopiedToast("Kon lijst niet kopiëren ❌"));
      });
    });
  }
  


function showToast(msg, color = "#4caf50") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.style.background = color;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
  }, 2500);
}

async function loadNews() {
  const container = document.getElementById("news-container");
  if (!container) return;

  try {
    const res = await fetch("/api/news");  // 🔹 correct endpoint
    if (!res.ok) throw new Error("Kon nieuws niet ophalen");
    const news = await res.json();

    container.innerHTML = "";

    function truncateText(text, maxLength = 150) {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + "...";
    }

    news.forEach(item => {
      const shortText = truncateText(item.text, 150);

      container.innerHTML += `
        <div class="news-item">
            <img src="${item.image || '/placeholder.png'}" alt="Nieuws afbeelding">
            <div class="news-content">
                <h3>${item.title}</h3>
                <p>${shortText}</p>
                <a class="news-btn" href="/nieuws.html?id=${item._id}">Lees meer</a>
            </div>
        </div>
      `;
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Kon nieuws niet laden.</p>";
  }
}


loadNews();



function filterRecipes() {
  const query = searchInput.value.toLowerCase().trim();
  const diet = dietSelect.value;

  let filtered = allRecipes;

  if (query) {
    // Alleen filteren als er iets in de zoekbalk staat
    const queryList = query.split(",").map(q => q.trim()).filter(q => q);

    filtered = filtered.filter(recipe => {
      const matchesQuery = queryList.some(qWord =>
        recipe.name.toLowerCase().includes(qWord) ||
        (recipe.tags?.some(tag => tag.toLowerCase().includes(qWord)))
      );

      const matchesDiet = (() => {
        if (!diet) return true;
        const tags = recipe.tags?.map(t => t.toLowerCase().trim()) || [];
        const macros = recipe.macros || {};
        switch(diet) {
          case "vegetarian": return tags.includes("vegetarisch");
          case "vegan": return tags.includes("vegan");
          case "lowcarb": return macros.carbs !== undefined && macros.carbs <= 20;
          case "highprotein": return macros.protein !== undefined && macros.protein >= 15;
          case "glutenvrij": return tags.includes("glutenvrij");
          default: return true;
        }
      })();

      return matchesQuery && matchesDiet;
    });
  } else if (diet) {
    // Als zoekbalk leeg is maar dieet is geselecteerd, filter alleen op dieet
    filtered = filtered.filter(recipe => {
      const tags = recipe.tags?.map(t => t.toLowerCase().trim()) || [];
      const macros = recipe.macros || {};
      switch(diet) {
        case "vegetarian": return tags.includes("vegetarisch");
        case "vegan": return tags.includes("vegan");
        case "lowcarb": return macros.carbs !== undefined && macros.carbs <= 20;
        case "highprotein": return macros.protein !== undefined && macros.protein >= 15;
        case "glutenvrij": return tags.includes("glutenvrij");
        default: return true;
      }
    });
  }

  renderSearchRecipes(filtered);
}



// Event listeners
searchInput.addEventListener("input", filterRecipes);
dietSelect.addEventListener("change", filterRecipes);

const hamburger = document.getElementById('hamburger-btn');
const sidebarNav = document.querySelector('.sidebar-nav');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    sidebarNav.classList.toggle('open');
});

// ===================== Notificaties =====================
async function checkNotifications() {
  try {
    const res = await fetch("/api/notifications");
    const notifications = await res.json();

    notifications.forEach(n => {
      const popup = document.createElement("div");
      popup.classList.add("notification-popup"); // hier dus je nieuwe class
      popup.innerHTML = `
        <p>📩 ${n.fromUser} heeft een recept met je gedeeld: <strong>${n.recipeName}</strong></p>
        <button class="close-btn">Sluiten</button>
      `;
      document.body.appendChild(popup);

      popup.querySelector(".close-btn").addEventListener("click", () => popup.remove());

      // Automatisch verdwijnen na 10 seconden
      setTimeout(() => popup.remove(), 10000);
    });
  } catch (err) {
    console.error("Kon notificaties niet laden:", err);
  }
}

function showSharedToast(email) {
  const toast = document.createElement("div");
  toast.textContent = `Recept gedeeld met ${email}!`;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";   // rechts onder
  toast.style.right = "20px";
  toast.style.background = "#4caf50";  // groen voor succes
  toast.style.color = "#fff";
  toast.style.padding = "0.8rem 1.2rem";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
  toast.style.fontWeight = "bold";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(20px)"; // start onder
  toast.style.transition = "all 0.4s ease";
  toast.style.zIndex = "1000";

  document.body.appendChild(toast);

  // Fade in
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  // Fade out na 2,5 seconden
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";  // naar onder
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}


function showRecipeAddedToast(dayAbbreviation) {
  const toast = document.createElement("div");
  toast.textContent = `Recept toegevoegd aan ${dayAbbreviation}!`;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";  // onderaan
  toast.style.right = "20px";   // rechts
  toast.style.background = "#4caf50";
  toast.style.color = "#fff";
  toast.style.padding = "0.8rem 1.2rem";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
  toast.style.fontWeight = "bold";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(20px)"; // start onder
  toast.style.transition = "all 0.4s ease";
  toast.style.zIndex = "1000";

  document.body.appendChild(toast);

  // Fade in
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  // Fade out na 2,5 seconden
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)"; // naar onder
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

function showCopiedToast(message = "Boodschappenlijst gekopieerd! 📋") {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";  // rechts onder
  toast.style.right = "20px";
  toast.style.background = "#4caf50";  // groen
  toast.style.color = "#fff";
  toast.style.padding = "0.8rem 1.2rem";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
  toast.style.fontWeight = "bold";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(20px)";  // start onder
  toast.style.transition = "all 0.4s ease";
  toast.style.zIndex = "1000";

  document.body.appendChild(toast);

  // Fade in
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  // Fade out na 2,5 seconden
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";  // naar onder
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

async function promptEmail(defaultEmail = "") {
  return new Promise((resolve) => {
    // Overlay maken
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.5)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "1000";

    // Modal zelf
    const modal = document.createElement("div");
    modal.style.background = "#fff";
    modal.style.padding = "1.5rem";
    modal.style.borderRadius = "10px";
    modal.style.minWidth = "300px";
    modal.style.boxShadow = "0 4px 15px rgba(0,0,0,0.3)";
    modal.innerHTML = `
      <h3 style="margin-top:0; margin-bottom:1rem;">Met welk e-mailadres wil je dit recept delen?</h3>
      <input type="email" style="width:100%; padding:0.5rem; font-size:1rem; margin-bottom:1rem; border:1px solid #ccc; border-radius:5px;" value="${defaultEmail}" placeholder="voorbeeld@email.com">
      <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
        <button class="cancel-btn" style="padding:0.5rem 1rem; border:none; background:#ccc; border-radius:5px; cursor:pointer;">Annuleer</button>
        <button class="send-btn" style="padding:0.5rem 1rem; border:none; background:#4caf50; color:white; border-radius:5px; cursor:pointer;">Verstuur</button>
      </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const input = modal.querySelector("input");

    modal.querySelector(".cancel-btn").addEventListener("click", () => {
      overlay.remove();
      resolve(null);
    });

    modal.querySelector(".send-btn").addEventListener("click", () => {
      overlay.remove();
      resolve(input.value.trim() || null);
    });

    // Enter key ook laten werken
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        overlay.remove();
        resolve(input.value.trim() || null);
      }
    });

    input.focus();
  });
}




async function promptMenuName(defaultName = "") {
  return new Promise((resolve) => {
    // Overlay maken
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.5)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "1000";

    // Modal zelf
    const modal = document.createElement("div");
    modal.style.background = "#fff";
    modal.style.padding = "1.5rem";
    modal.style.borderRadius = "10px";
    modal.style.minWidth = "300px";
    modal.style.boxShadow = "0 4px 15px rgba(0,0,0,0.3)";
    modal.innerHTML = `
      <h3 style="margin-top:0; margin-bottom:1rem;">Geef een naam aan dit weekmenu</h3>
      <input type="text" style="width:100%; padding:0.5rem; font-size:1rem; margin-bottom:1rem; border:1px solid #ccc; border-radius:5px;" value="${defaultName}">
      <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
        <button class="cancel-btn" style="padding:0.5rem 1rem; border:none; background:#ccc; border-radius:5px; cursor:pointer;">Annuleer</button>
        <button class="save-btn" style="padding:0.5rem 1rem; border:none; background:#4caf50; color:white; border-radius:5px; cursor:pointer;">Opslaan</button>
      </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const input = modal.querySelector("input");

    modal.querySelector(".cancel-btn").addEventListener("click", () => {
      overlay.remove();
      resolve(null);
    });

    modal.querySelector(".save-btn").addEventListener("click", () => {
      overlay.remove();
      resolve(input.value.trim() || null);
    });

    // Enter key ook laten werken
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        overlay.remove();
        resolve(input.value.trim() || null);
      }
    });

    input.focus();
  });
}


// ✅ Run bij load
window.addEventListener("load", checkNotifications);


});




