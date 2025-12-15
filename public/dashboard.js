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
  const hamburger = document.getElementById('hamburger-btn');
  const sidebarNav = document.querySelector('.sidebar-nav');
  
  let favoriteRecipes = [];
  let currentMenu = [];
  let savedMenus = [];
  let allRecipes = [];

  // ===================== Helpers =====================
  const getRecipeImage = (recipe) =>
    recipe?.image?.trim() ? recipe.image : "/Fotos/logo_.png";

  const shuffleArray = (array) =>
    array.map(v => ({ v, sort: Math.random() }))
         .sort((a, b) => a.sort - b.sort)
         .map(({ v }) => v);
         
  const orangeGradient = 'linear-gradient(90deg,#ff7f50,#ffb347)'; 
  const greenGradient = 'linear-gradient(90deg, #32cd32, #7fff00)'; 
  const copyIconPath = "/Fotos/copyicon.png"; 

  // 🔑 CONSTANTE VOOR ICON ACHTERGROND STIJL (met flexbox centrering)
  const iconBackgroundStyle = `
      position: absolute; 
      width: 30px; 
      height: 30px; 
      background: rgba(255, 255, 255, 0.85); 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      cursor: pointer; 
      z-index: 5; 
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  `;

  // 🔑 HELPER VOOR BEREIDINGSWIJZE (met de gewenste styling)
  const getInstructionsHTML = (instructions) => {
      // Controleer of het een array is en niet leeg
      if (Array.isArray(instructions) && instructions.length > 0) {
          // Maak gescheiden stappen met marges (vervangt <ol> en <li>)
          const stepsHtml = instructions.map(step => 
              // Gebruik een div voor elke stap met een duidelijke onderlinge marge
              `<div style="margin-bottom: 12px; padding: 8px 10px; background: #f9f9f9; border-left: 3px solid #ff7f50; border-radius: 4px; line-height: 1.4;">${step}</div>`
          ).join('');
          
          // Gebruik een container div
          return `<div style="padding: 5px 0;">${stepsHtml}</div>`;
      }
      
      // Terugval als het geen array is (bv. nog een enkele string)
      if (typeof instructions === 'string' && instructions.trim() !== '') {
           return `<p>${instructions}</p>`;
      }

      return `<p>Geen bereidingswijze beschikbaar.</p>`;
  };


  const getDietTagsHtml = (recipe) => {
    const tags = recipe.tags?.map(t => t.toLowerCase().trim()) || [];
    const macros = recipe.macros || {};
    const displayedTags = [];

    if (tags.includes("vegan")) {
        displayedTags.push({ label: "Vegan", color: "#2E8B57" });
    } else if (tags.includes("vegetarisch")) {
        displayedTags.push({ label: "Veggie", color: "#6B8E23" });
    }
    if (tags.includes("glutenvrij")) {
        displayedTags.push({ label: "Glutenvrij", color: "#FF8C00" });
    }
    if (macros.carbs !== undefined && macros.carbs <= 20) {
        displayedTags.push({ label: "Low-Carb", color: "#1E90FF" });
    }
    if (macros.protein !== undefined && macros.protein >= 20) {
        displayedTags.push({ label: "High-Protein", color: "#DC143C" });
    }
    if (displayedTags.length === 0) return '';

    const tagsHtml = displayedTags.map(tag => `
        <span style="
            background-color: ${tag.color}; color: white; padding: 4px 8px; 
            border-radius: 12px; font-size: 0.75rem; font-weight: 500; 
            margin: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); 
            white-space: nowrap; display: inline-block;
        ">${tag.label}</span>
    `).join('');

    return `<div class="tags-container" style="display: flex; flex-wrap: wrap; justify-content: center; margin-top: 5px; min-height: 25px; padding-bottom: 5px;">${tagsHtml}</div>`;
  };

  const getOwnRecipeDietTagsHtml = (recipe) => {
    const tags = recipe.tags?.map(t => t.toLowerCase().trim()) || [];
    const displayedTags = [];

    if (tags.includes("vegan")) {
        displayedTags.push({ label: "Vegan", color: "#2E8B57" });
    } else if (tags.includes("vegetarisch")) {
        displayedTags.push({ label: "Veggie", color: "#6B8E23" });
    }
    if (tags.includes("glutenvrij")) {
        displayedTags.push({ label: "Glutenvrij", color: "#FF8C00" });
    }
    
    if (displayedTags.length === 0) return '';

    const tagsHtml = displayedTags.map(tag => `
        <span style="
            background-color: ${tag.color}; color: white; padding: 4px 8px;
            border-radius: 12px; font-size: 0.75rem; font-weight: 500; 
            margin: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); 
            white-space: nowrap; display: inline-block;
        ">${tag.label}</span>
    `).join('');

    return `<div class="tags-container" style="display: flex; flex-wrap: wrap; justify-content: center; margin-top: 5px; min-height: 25px; padding-bottom: 5px;">${tagsHtml}</div>`;
  };
  
  // 🔑 GECORRIGEERDE HELPER: Retourneert altijd een lege string om de chef van de dashboardkaarten te verwijderen.
  const getChefHtml = (recipe) => {
    return ''; 
  };


  // ===================== Modals & Toasts =====================
  function showToast(message, background = 'linear-gradient(90deg, #32cd32, #7fff00)') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        // 🔑 Belangrijke aanpassing: z-index naar een zeer hoge waarde
        toastContainer.style.cssText = `
           position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); 
           max-width: 100%; width: 100%; z-index: 999999; display: flex;
           flex-direction: column; gap: 10px; align-items: center;
        `;
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        background: ${background}; color: white; padding: 0.8rem 1.2rem;
        border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        font-weight: bold; opacity: 0; transform: translateY(100%);
        transition: all 0.4s ease;
        z-index: 999999;
    `;

    toastContainer.prepend(toast); 

    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(100%)';
        setTimeout(() => toast.remove(), 400); 
    }, 2500);
  }

  function showSharedToast(email) {
    showToast(`Recept gedeeld met ${email}!`, "#ff7f50"); 
  }

  function promptEmail() {
    return new Promise(resolve => {
        const greenGradient = 'linear-gradient(90deg, #32cd32, #7fff00)'; 
        const orangeGradient = 'linear-gradient(90deg,#ff7f50,#ffb347)';

        const overlay = document.createElement("div");
        overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 100000; padding: 20px;`;

        const popup = document.createElement("div");
        popup.style.cssText = `background: white; padding: 25px; border-radius: 10px; max-width: 90%; width: 400px; box-shadow: 0 5px 15px rgba(0,0,0,0.5); text-align: center;`;
        
        popup.innerHTML = `
            <h3 style="margin-top:0; margin-bottom:15px;">Deel Recept</h3>
            <label for="emailInput" style="display:block; margin-bottom:5px; font-weight:bold;">E-mailadres van ontvanger:</label>
            <input type="email" id="emailInput" placeholder="naam@voorbeeld.nl" 
                style="width: 95%; padding: 10px; margin-bottom: 20px; border: 1px solid #ccc; border-radius: 5px; font-size: 16px; box-sizing: border-box;"
            >
            <div style="display:flex; justify-content:space-around;">
                <button id="sendEmailBtn" style="background: ${greenGradient}; color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 45%;">Verzenden</button>
                <button id="cancelEmailBtn" style="background: ${orangeGradient}; color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 45%;">Annuleren</button>
            </div>
            <p id="emailError" style="color: red; margin-top: 10px; display: none;">Voer een geldig e-mailadres in.</p>
        `;

        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        const input = document.getElementById("emailInput");
        const sendBtn = document.getElementById("sendEmailBtn");
        const cancelBtn = document.getElementById("cancelEmailBtn");
        const errorMsg = document.getElementById("emailError");

        input.focus();
        
        const cleanup = (value) => {
            overlay.remove();
            resolve(value);
        };
        
        const validateAndSend = () => {
            const email = input.value.trim();
            if (email && email.includes('@') && email.includes('.')) {
                cleanup(email);
            } else {
                errorMsg.style.display = 'block';
                input.focus();
            }
        };

        sendBtn.addEventListener("click", validateAndSend);
        cancelBtn.addEventListener("click", () => cleanup(null));
        input.addEventListener("keypress", (e) => {
            if (e.key === 'Enter') validateAndSend();
        });
        overlay.addEventListener("click", (e) => {
             if (e.target === overlay) cleanup(null);
        });
    });
  }

  function promptMenuName(defaultName) {
    return new Promise(resolve => {
        const greenGradient = 'linear-gradient(90deg, #32cd32, #7fff00)'; 
        const orangeGradient = 'linear-gradient(90deg,#ff7f50,#ffb347)';

        const overlay = document.createElement("div");
        overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 100000; padding: 20px;`;

        const popup = document.createElement("div");
        popup.style.cssText = `background: white; padding: 25px; border-radius: 10px; max-width: 90%; width: 400px; box-shadow: 0 5px 15px rgba(0,0,0,0.5); text-align: center;`;
        
        popup.innerHTML = `
            <h3 style="margin-top:0; margin-bottom:15px;">Naam voor Weekmenu</h3>
            <label for="menuNameInput" style="display:block; margin-bottom:5px; font-weight:bold;">Voer een naam in:</label>
            <input type="text" id="menuNameInput" value="${defaultName}" 
                style="width: 90%; padding: 10px; margin-bottom: 20px; border: 1px solid #ccc; border-radius: 5px; font-size: 16px;"
            >
            <div style="display:flex; justify-content:space-around;">
                <button id="confirmNameBtn" style="background: ${greenGradient}; color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 45%;">Opslaan</button>
                <button id="cancelNameBtn" style="background: ${orangeGradient}; color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 45%;">Annuleren</button>
            </div>
        `;

        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        const input = document.getElementById("menuNameInput");
        const confirmBtn = document.getElementById("confirmNameBtn");
        const cancelBtn = document.getElementById("cancelNameBtn");

        input.focus();
        input.select();

        const cleanup = (value) => {
            overlay.remove();
            resolve(value);
        };

        confirmBtn.addEventListener("click", () => cleanup(input.value.trim()));
        cancelBtn.addEventListener("click", () => cleanup(null));
        input.addEventListener("keypress", (e) => {
            if (e.key === 'Enter') confirmBtn.click();
        });
        overlay.addEventListener("click", (e) => {
             if (e.target === overlay) cleanup(null);
        });
    });
  }

  // ===================== User & News Load =====================
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
  
  async function loadNews() {
    const container = document.getElementById("news-container");
    if (!container) return;

    try {
      const res = await fetch("/api/news");
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

  // ===================== NIEUW: Agenda Maaltijd van Vandaag =====================

  // Functie om de datum te formatteren naar YYYY-MM-DD
  function formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  }

  async function loadAgendaMealForToday() {
      const todayMealContent = document.getElementById("today-meal-content");
      const todayDateDisplay = document.getElementById("today-date-display");
      
      if (!todayMealContent || !todayDateDisplay) return;

      const today = new Date();
      const todayFormatted = formatDate(today);
      
      // Weergave van de datum op het dashboard
      todayDateDisplay.textContent = today.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
      
      todayMealContent.innerHTML = `<p>Laden van de planning...</p>`;

      // Controleer of allRecipes al geladen is (zou moeten zijn via de Promise.then)
      if (allRecipes.length === 0) {
           todayMealContent.innerHTML = `<p style="color:orange;">Laden van receptdetails...</p>`;
      }


      try {
          // 1. Haal de opgeslagen planning op van de server
          const res = await fetch("/api/agenda/load");
          
          if (!res.ok) {
              todayMealContent.innerHTML = `<p style="color:red;">Fout bij het laden van de agenda.</p>`;
              return;
          }

          const data = await res.json();
          const plannedMeals = data.meals || {};
          
          // 2. Zoek maaltijden voor vandaag
          const todayMeals = plannedMeals[todayFormatted] || [];

          todayMealContent.innerHTML = ""; // Maak de container leeg
          
          // Als er geen maaltijden zijn of als de dag 'Vrij' is (recipeId: 'none')
          if (todayMeals.length === 0 || todayMeals.some(m => m.recipeId === 'none')) {
              const message = todayMeals.some(m => m.recipeId === 'none') 
                  ? 'Vandaag Vrij Gepland' 
                  : 'Geen maaltijden gepland in de agenda voor vandaag.';
                  
              todayMealContent.innerHTML = `
                  <div style="text-align:center; padding: 20px; background: #f0f0f0; border-radius: 10px;">
                      <p style="margin:0;">${message}</p>
                  </div>
              `;
              return;
          }

          // 3. Render de geplande maaltijden (die geen 'none' zijn)
          todayMeals.filter(meal => meal.recipeId !== 'none').forEach(meal => {
              // Zoek het volledige recept in de lokaal geladen allRecipes array
              const recipe = allRecipes.find(r => r._id === meal.recipeId); 
              
              // Fallbacks voor het geval het recept niet gevonden wordt
              const mealName = recipe ? recipe.name : meal.name;
              const imageSrc = (recipe && recipe.image?.trim()) ? recipe.image : '/Fotos/placeholder_food.png';
              const duration = recipe?.duration || '??';
              
              const backgroundColor = '#d4edda'; // Lichtgroen
              const textColor = '#155724';       // Donkergroen

              const mealCardHtml = `
                  <div class="agenda-meal-card" data-recipe-id="${meal.recipeId}" style="
                      background: ${backgroundColor}; 
                      color: ${textColor};
                      padding: 15px; border-radius: 10px; 
                      box-shadow: 0 4px 8px rgba(0,0,0,0.1); 
                      display: flex; gap: 15px; align-items: center; 
                      margin-bottom: 10px;
                      cursor: pointer; 
                  ">
                      <div class="image-wrapper" style="flex-shrink: 0; width: 60px; height: 60px;">
                          <img src="${imageSrc}" alt="${mealName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 5px;">
                      </div>
                      
                      <div class="content" style="flex-grow: 1;">
                          <h4 style="margin: 0; font-size: 0.9rem; text-transform: uppercase;">${meal.type || 'Maaltijd'}</h4>
                          <p style="margin: 3px 0 0; font-weight: bold; font-size: 1.1rem;">${mealName}</p>
                      </div>
                      
                      <span style="flex-shrink: 0; font-size: 0.8rem; color: ${textColor};">⏱ ${duration} min</span>
                  </div>
              `;
              todayMealContent.innerHTML += mealCardHtml;
          });
          
          // 4. Voeg event listeners toe aan de kaarten om de details te tonen
          todayMealContent.querySelectorAll('.agenda-meal-card[data-recipe-id]').forEach(card => {
              card.addEventListener('click', () => {
                  const recipeId = card.dataset.recipeId;
                  const recipe = allRecipes.find(r => r._id === recipeId);
                  if (recipe) {
                      showRecipeDetails("Agenda Maaltijd", recipe); 
                  } else {
                      showToast("Receptdetails niet gevonden.", "#ff4d4d");
                  }
              });
          });

      } catch (error) {
          console.error("Fout bij laden Agenda maaltijd:", error);
          todayMealContent.innerHTML = `<p style="color:red;">Kon de agenda-planning niet laden.</p>`;
      }
  }
  // ===================== EINDE NIEUWE FUNCTIES =====================


  // ===================== Eigen Recepten =====================
  async function loadOwnRecipes() {
    try {
      const res = await fetch("/api/myrecipes");
      if (!res.ok) return;
      let recipes = await res.json();
      
      // 🔑 SORTEREN: Sorteer op _id om de nieuwste eerst te krijgen (laatst toegevoegd)
      recipes.sort((a, b) => {
          if (a._id < b._id) return 1;  
          if (a._id > b._id) return -1; 
          return 0;
      });
      
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

        // 🔑 Iconen met ronde achtergrond (aangepaste grootte en margin-top)
        card.innerHTML = `
          <div class="image-container" style="position:relative;">
            <img src="${getRecipeImage(recipe)}" alt="${recipe.name}">
            <span class="duration-label" style="position:absolute; bottom:5px; left:5px; background: rgba(0,0,0,0.6); color:#fff; padding:2px 5px; font-size:12px; border-radius:3px;">
                    ⏱ ${recipe.duration} min
                </span>

                <div 
                    class="delete-btn-container" 
                    style="${iconBackgroundStyle} bottom:16px; right: 5px;" 
                >
                    <img 
                        src="/Fotos/prullenbakicon.png" 
                        alt="Verwijderen" 
                        class="delete-btn"
                        style="width: 70%; height: 70%; object-fit: contain; margin-top: 8px;"
                    >
                </div>

                <div 
                    class="share-btn-container" 
                    style="${iconBackgroundStyle} bottom:16px; right: 40px;"
                >
                    <img 
                        src="/Fotos/shareicon.png" 
                        alt="Delen" 
                        class="share-btn"
                        style="width: 70%; height: 70%; object-fit: contain; margin-top: 8px;"
                    >
                </div>
          </div>
        
          <p style="text-align:center; margin-top:0.2rem;">${recipe.name}</p>
          ${getOwnRecipeDietTagsHtml(recipe)} 
          ${getChefHtml(recipe)}
        `;


        // Verwijderen knop (Event listener op de container)
        const deleteBtn = card.querySelector(".delete-btn-container");
        deleteBtn.addEventListener("click", async e => {
          e.stopPropagation();
          if (!confirm(`Weet je zeker dat je "${recipe.name}" wilt verwijderen?`)) return;
          try {
            const res = await fetch(`/api/recipes/${recipe._id}`, { method: "DELETE" });
            if (res.ok) {
                // card.remove(); // Verwijder de kaart visueel
                showToast(`"${recipe.name}" verwijderd.`);
                loadOwnRecipes(); // Laad de lijst opnieuw om de sortering te behouden
            }
            else alert("Kon recept niet verwijderen.");
          } catch (err) {
            console.error(err);
            alert("Fout bij verbinden met server.");
          }
        });

        // Delen knop (Event listener op de container)
        const shareBtn = card.querySelector(".share-btn-container");
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

        wrapper.appendChild(card); // Gebruik appendChild na sortering van de array
      });

      ownRecipesContainer.appendChild(wrapper);
    } catch (err) {
      console.error("Fout bij laden eigen recepten:", err);
    }
  }


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

      // 🔑 AANGEPAST: Hart icoon met ronde achtergrond (redundante CSS verwijderd)
      card.innerHTML = `
        <div class="image-container" style="position:relative;">
          <img src="${getRecipeImage(recipe)}" alt="${recipe.name}">
          <span class="duration-label" style="position:absolute; bottom:5px; left:5px; background: rgba(0,0,0,0.6); color:#fff; padding:2px 5px; font-size:12px; border-radius:3px;">⏱ ${recipe.duration} min</span>
          
          <span class="heart" 
              style="${iconBackgroundStyle} bottom:16px; right:5px; color:red; font-size:1.2rem;"
          >❤️</span>
        </div>
        
          <p>${recipe.name}</p>
          ${getDietTagsHtml(recipe)}
          ${getChefHtml(recipe)} `;


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
      // 🔑 AANPASSING: Gebruik prepend om de laatst toegevoegde (gelikete) recepten bovenaan te tonen
      wrapper.prepend(card); 
    });

    favoriteRecipesContainer.appendChild(wrapper);
  }

  // ===================== Recepten Zoeken & Filteren =====================
  async function loadAllRecipes() {
    try {
      const res = await fetch("/api/recipes");
      if (!res.ok) return;
      allRecipes = await res.json();
      
      // 🔑 AANPASSING: Sorteer op _id om de nieuwste eerst te krijgen (laatst toegevoegd)
      allRecipes.sort((a, b) => {
          if (a._id < b._id) return 1;  
          if (a._id > b._id) return -1; 
          return 0;
      });
      
      renderSearchRecipes(allRecipes);
      // Return de promise om .then() in de initial load te ondersteunen
      return allRecipes; 
    } catch (err) {
      console.error("Fout bij laden recepten:", err);
      // Gooi de fout opnieuw om de ketting te breken als het laden mislukt
      throw err; 
    }
  }

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

      // 🔑 AANGEPAST: Hart icoon met ronde achtergrond (redundante CSS verwijderd)
      card.innerHTML = `
        <div class="image-container" style="position:relative;">
          <img src="${getRecipeImage(recipe)}" alt="${recipe.name}">
          <span class="duration-label" style="position:absolute; bottom:5px; left:5px; background: rgba(0,0,0,0.6); color:#fff; padding:2px 5px; font-size:12px; border-radius:3px;">
            ⏱ ${recipe.duration} min
          </span>

          <span class="heart" 
              style="${iconBackgroundStyle} bottom:16px; right:5px; color:${isFavorite ? "red" : "#888"}; font-size:1.2rem;"
          >
            ${isFavorite ? "❤️" : "♡"}
          </span>
        </div>

        <p style="text-align:center; margin-top:0.3rem;">${recipe.name}</p>
        ${getDietTagsHtml(recipe)} 
        ${getChefHtml(recipe)}
        `;

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

          renderSearchRecipes(recipes);
          renderFavoriteRecipes();
          renderMenu();
        } catch (err) {
          console.error("Fout bij togglen favoriet:", err);
        }
      });

      card.addEventListener("click", () => showRecipeDetails("", recipe));
      searchRecipesContainer.appendChild(card);
    });
  }

  function filterRecipes() {
    const query = searchInput.value.toLowerCase().trim();
    const diet = dietSelect.value;

    let filtered = allRecipes;

    if (query) {
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

  // ===================== Menu Generatie & Render =====================
  async function generateMenu(favorite, diet) {
    try {
      const response = await fetch("/api/recipes");
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) { alert("Geen recepten gevonden!"); return []; }

      let filtered = data;

      if (favorite) {
        const favList = favorite.split(",").map(f => f.trim()).filter(f => f).map(f => f.toLowerCase());
        filtered = filtered.filter(recipe => {
          const recipeName = recipe.name.toLowerCase();
          const recipeTags = recipe.tags?.map(tag => tag.toLowerCase()) || [];
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
            case "glutenvrij": return tags.includes("glutenvrij");
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
          
          // Stel het aantal personen standaard in op 1
          currentMenu[index] = menu[0] ? { ...menu[0], persons: 1 } : null;
          
          renderMenu();
        });
      } else {
        const isFavorite = favoriteRecipes.some(r => r._id === recipe._id);
        
        // 🔑 AANGEPAST: Hart icoon met ronde achtergrond (redundante CSS verwijderd)
        card.innerHTML = `
          <button class="remove-btn" style="position:absolute; top:5px; right:5px; z-index:2;">&times;</button>
          <h3>${days[index]}</h3>
          <div class="image-container" style="position:relative;">
            <img src="${getRecipeImage(recipe)}" alt="${recipe.name}">
            <span class="duration-label" style="position:absolute; bottom:5px; left:5px; background: rgba(0,0,0,0.6); color:#fff; padding:2px 5px; font-size:12px; border-radius:3px;">⏱ ${recipe.duration} min</span>
            
            <span class="heart" 
                  style="${iconBackgroundStyle} bottom:16px; right:5px; color:${isFavorite ? "red" : "#888"}; font-size:1.2rem;"
            >
                ${isFavorite ? "❤️" : "♡"}
            </span>
            
          </div>
          <p>${recipe.name}</p>
          ${getDietTagsHtml(recipe)}
          ${getChefHtml(recipe)} `;

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

  // ===================== Opgeslagen Menu's =====================
  
  function renderSavedMenus() {
    if (!savedMenusContainer) return;
    savedMenusContainer.innerHTML = "";
  
    if (savedMenus.length === 0) {
      savedMenusContainer.innerHTML = "<p>Hier komen je opgeslagen weekmenu's te staan.</p>";
      return;
    }
  
    const dayNames = ["Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag","Zondag"];
  
    // Sorteer de menu's, meest recente eerst
    const sortedMenus = savedMenus.sort((a, b) => new Date(b.savedDate) - new Date(a.savedDate));
    
    sortedMenus.forEach((menuData) => {
      
      const menuWrapper = document.createElement("div");
      menuWrapper.style.marginBottom = "1.5rem";
  
      const titleEl = document.createElement("h3");
      titleEl.textContent = menuData.name;
      titleEl.style.marginBottom = "0.5rem";
      menuWrapper.appendChild(titleEl);
      
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "🗑️ Verwijder menu";
      deleteBtn.style.cssText = `
        padding:0.3rem 0.6rem; border:none; border-radius:5px;
        background:#ff4d4d; color:#fff; cursor:pointer; margin-bottom:0.5rem;
        display:block;
      `;
      deleteBtn.addEventListener("click", async () => {
        if (!confirm("Weet je zeker dat je dit weekmenu wilt verwijderen?")) return;
        try {
          const res = await fetch(`/api/savedmenus/${menuData.id}`, { method: "DELETE" }); // Gebruik ID
          if (res.ok) {
            savedMenus = savedMenus.filter(m => m.id !== menuData.id);
            renderSavedMenus();
            showToast("Weekmenu verwijderd!", "#333");
          } else throw new Error("Kon weekmenu niet verwijderen");
        } catch (err) {
          console.error(err);
          showToast("Fout bij verwijderen weekmenu", "#ff4d4d");
        }
      });
      menuWrapper.appendChild(deleteBtn);
  
      const wrapper = document.createElement("div");
      wrapper.classList.add("saved-menu-wrapper");
      wrapper.style.display = "flex";
      wrapper.style.overflowX = "auto";
      wrapper.style.gap = "1rem";
  
      menuData.menu.forEach((recipe, dayIndex) => {
        // 'recipe' is nu het volledige receptobject (inclusief name, tags, chef) of null
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
          durationLabel.style.cssText = "position:absolute; bottom:5px; left:5px; background: rgba(0,0,0,0.6); color:#fff; padding:2px 5px; font-size:12px; border-radius:3px;";
          // CONTROLE: Zorg ervoor dat recipe.duration bestaat
          durationLabel.textContent = `⏱ ${recipe.duration || 0} min`;
          
          imgContainer.appendChild(img);
          imgContainer.appendChild(durationLabel);

          // 🔑 HART ICOON MET ACHTERGROND
          const isFavorite = favoriteRecipes.some(r => r._id === recipe._id);
          const heartSpan = document.createElement("span");
          heartSpan.classList.add("heart");
          
          heartSpan.style.cssText = `${iconBackgroundStyle} bottom:5px; right:5px; color:${isFavorite ? "red" : "white"}; font-size:1.2rem;`;
          heartSpan.innerHTML = isFavorite ? "❤️" : "♡";
          
          heartSpan.addEventListener("click", async (e) => {
              e.stopPropagation();
              try {
                  if (!favoriteRecipes.some(r => r._id === recipe._id)) {
                      await fetch(`/api/favorites/${recipe._id}`, { method: "POST" });
                      favoriteRecipes.push(recipe);
                  } else {
                      await fetch(`/api/favorites/${recipe._id}`, { method: "DELETE" });
                      favoriteRecipes = favoriteRecipes.filter(r => r._id !== recipe._id);
                  }
                  
                  renderFavoriteRecipes(); 
                  renderSavedMenus();
              } catch (err) {
                  console.error("Fout bij togglen favoriet:", err);
              }
          });
  
          imgContainer.appendChild(heartSpan); 
          card.appendChild(imgContainer);
  
          const nameP = document.createElement("p");
          nameP.style.textAlign = "center";
          nameP.style.marginTop = "0.3rem";
          // CONTROLE: Gebruik recipe.name
          nameP.textContent = recipe.name || "Onbekend gerecht";
          card.appendChild(nameP);
          
          // 🔑 FIX/CONTROLE: Deze functies moeten nu de receptdata die de server stuurt (met tags en chef) correct verwerken.
          // Als deze functies in een ander deel van uw JS staan, moeten ze controleren of de data is opgevuld.
          card.innerHTML += getDietTagsHtml(recipe);
          card.innerHTML += getChefHtml(recipe);
  
          // Stuur de dag en het recept (inclusief persons) naar de details popup
          card.addEventListener("click", () => showRecipeDetails(dayNames[dayIndex], recipe));
        } else {
          card.classList.add("placeholder");
          const plusContainer = document.createElement("div");
          plusContainer.style.cssText = "display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;";
  
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

  // ===================== Opgeslagen Menu's Laden (AANGEPAST) =====================
async function loadSavedMenu() {
  try {
    const res = await fetch("/api/savedmenus");
    if (!res.ok) return;
    const menus = await res.json();

    if (!Array.isArray(menus)) {
        console.error("API /api/savedmenus retourneerde geen array.");
        savedMenus = [];
        renderSavedMenus();
        return;
    }

    savedMenus = menus.map(savedMenuData => {
      // savedMenuData is nu een object {_id, name, menu: [ { _id: recipeId, name: 'ReceptNaam', persons: X, ... } ]}
      
      return {
        id: savedMenuData._id,
        name: savedMenuData.name,
        // 🔑 FIX: De menu array bevat nu al de volledige receptobjecten dankzij de server populatie.
        // We hoeven NIET meer te zoeken in allRecipes, we gebruiken de data direct.
        menu: savedMenuData.menu.map(fullRecipeObject => {
            if (!fullRecipeObject || !fullRecipeObject._id) return null;
            
            // De server heeft 'persons' al in het receptobject geplaatst (zie server.js)
            return fullRecipeObject; 
        }),
        savedDate: savedMenuData._id ? new Date(parseInt(savedMenuData._id.substring(0, 8), 16) * 1000) : new Date(0)
      };
    });

    renderSavedMenus();
  } catch (err) {
    console.error("Kon opgeslagen weekmenu niet laden:", err);
  }
}

  // ===================== Popup Functie (Show Recipe Details) =====================
  function showRecipeDetails(day, recipe) {
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");

    // Stel 'persons' in, met voorkeur voor de waarde uit het menu-item (of standaard 1)
    let persons = recipe.persons || 1; 

    // --- Helper functies (met veiligheidschecks) ---
    const getIngredientsText = () => {
        if (!recipe.ingredients || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
            return `Recept: ${recipe.name}\n\nGeen ingrediënten beschikbaar.`;
        }
      
        const ingredientsList = recipe.ingredients.map(i => {
            if (!i.amount) return i.item;
            
            const match = i.amount.match(/^([\d.,]+)\s*(.*)$/);
            let qty = i.amount;

            if (match) {
                const baseAmount = parseFloat(match[1].replace(",", "."));
                const unit = match[2] || "";
                
                // Bereken de hoeveelheid op basis van het ingestelde aantal personen
                const calculatedQty = (baseAmount * persons).toFixed(2).replace(/\.00$/, ''); 
                qty = `${calculatedQty.replace(/\./, ',')} ${unit}`.trim();
            }
            return `${i.item} - ${qty}`;
        }).join("\n"); 

        return `Ingrediënten voor ${persons} personen:\n${ingredientsList}`;
    };
    
    const getIngredientsHTML = () => {
        if (!recipe.ingredients || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
            return '<li>Geen ingrediënten beschikbaar.</li>';
        }

        return recipe.ingredients.map(i => {
            if (!i.amount) return `<li>${i.item}</li>`;
            
            const match = i.amount.match(/^([\d.,]+)\s*(.*)$/);
            let qty = i.amount;

            if (match) {
                const baseAmount = parseFloat(match[1].replace(",", "."));
                const unit = match[2] || "";
                
                // Bereken de hoeveelheid op basis van het ingestelde aantal personen
                const calculatedQty = (baseAmount * persons).toFixed(2).replace(/\.00$/, '');
                qty = `${calculatedQty.replace(/\./, ',')} ${unit}`.trim();
            }
            return `<li>${i.item} – ${qty}</li>`;
        }).join("");
    };

    const getMacrosHTML = () => {
      const macros = recipe.macros || {};
      const time = recipe.duration || 0;
      
      let html = '<div class="recipe-info-bar">'; 

      // 1. MACROS 
      html += `
          <div class="info-block macros-block">
              <h4 style="margin-top:0; margin-bottom: 0.5rem; font-size:1rem;">Voedingswaarden p.p.</h4>
              <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
                  <span class="protein">Eiwit: <strong>${(macros.protein || 0).toFixed(1)}g</strong></span>
                  <span class="carbs">Koolh.: <strong>${(macros.carbs || 0).toFixed(1)}g</strong></span>
                  <span class="fat">Vet: <strong>${(macros.fat || 0).toFixed(1)}g</strong></span>
              </div>
          </div>
      `;
      
      // 2. TIJD
      html += `
          <div class="info-block time-block">
              <h4 style="margin-top:0; margin-bottom: 0.5rem; font-size:1rem;">Tijd</h4>
              <p class="time-value" style="margin:0; font-size:1.1rem; font-weight:bold;">⏱ ${time} min</p>
          </div>
      `;

      // 3. PERSONEN
      html += `
          <div class="info-block persons-block">
              <h4 style="margin-top:0; margin-bottom: 0.5rem; font-size:1rem;">Personen</h4>
              <div class="persons-controls" style="display:flex; justify-content:center; align-items:center; gap:8px;">
                  <button id="decrement-persons" style="width:30px; height:30px; border-radius:50%; border:1px solid #ccc; background:#f0f0f0; cursor:pointer; font-size:1.2rem; font-weight:bold;">-</button>
                  <span id="persons-count" style="font-size:1.1rem; font-weight:bold;">${persons}</span>
                  <button id="increment-persons" style="width:30px; height:30px; border-radius:50%; border:1px solid #ccc; background:#f0f0f0; cursor:pointer; font-size:1.2rem; font-weight:bold;">+</button>
              </div>
          </div>
      `;

      html += '</div>';
      return html;
    };
    
    // ---------------------------------------------

    const isMobile = window.innerWidth <= 600;
    const greenGradient = 'linear-gradient(90deg, #32cd32, #7fff00)';
    const orangeGradient = 'linear-gradient(90deg,#ff7f50,#ffb347)';

    const greenGradientStyle = `
    padding: ${isMobile ? '8px 10px' : '10px 15px'}; 
    border: none; border-radius: 8px; color: white; font-weight: bold;
    cursor: pointer; font-size: ${isMobile ? '0.8rem' : '1rem'};
    width: 48%; text-align: center; background: ${greenGradient}; 
    transition: background 0.3s ease; box-sizing: border-box;
    `;
    
    const orangeGradientStyle = `
        padding: ${isMobile ? '8px 10px' : '10px 15px'}; 
        border: none; border-radius: 8px; color: white; font-weight: bold;
        cursor: pointer; font-size: ${isMobile ? '0.8rem' : '1rem'};
        width: ${isMobile ? '48%' : '48%'}; text-align: center;
        background: ${orangeGradient}; transition: background 0.3s ease;
    `;

    const copyButtonStyle = `
        position: absolute; top: 10px; right: 10px; padding: 5px 8px; 
        border-radius: 10px; background: ${greenGradient}; color: white;
        border: none; cursor: pointer; font-weight: bold; font-size: 15px;
        display: flex; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.4); 
        z-index: 10; width: 8rem;
    `;
    
    const iconSize = '25px'; 
    const copyButtonText = 'Kopieer';
    const iconMargin = '4px';

    // 🔑 GECORRIGEERDE CHEF-CONTROLE:
    // De chefHtml wordt alleen gegenereerd als recipe.chef NIET 'admin' is, en niet leeg is.
    const chefName = recipe.chef?.trim().toLowerCase();
    const chefHtml = chefName && chefName !== "admin" ? `
        <div style="
            background: #f8f8f8;
            padding: 15px 10px;
            border-radius: 10px;
            margin-top: 20px;
            margin-bottom: 20px; 
            text-align: center;
            box-shadow: 0 1px 4px rgba(0,0,0,0.05);
            border: 1px solid #eee;
        ">
            <h4 style="margin:0; font-size:1rem; color:#555;">Chef</h4>
            <p style="margin:5px 0 0; font-size:1.1rem; font-weight:bold; color:#ff7f50;">${recipe.chef}</p>
        </div>
    ` : '';


    overlay.innerHTML = `
    <div class="popup" style="
        max-width: 500px; 
        position:relative; 
        background:white; 
        padding:1rem; 
        border-radius:15px;
        max-height:85%; overflow-y:auto;
        box-shadow:0 10px 30px rgba(0,0,0,0.3); font-family:Arial,sans-serif;
    ">
        
        <h2>${recipe.name}</h2>
        ${day ? `<p class="popup-day">${day}</p>` : ""}
        
        <div class="image-container" style="position:relative; width:100%;">
            <img src="${getRecipeImage(recipe)}" alt="${recipe.name}" style="width:100%; height:auto; display:block; border-radius:10px;">
            
            <button id="copy-ingredients-btn" style="${copyButtonStyle}">
                <img src="/Fotos/copyicon.png" 
                     alt="Kopieer" 
                     style="width: ${iconSize}; height: ${iconSize}; margin-right: ${iconMargin};"> 
                     ${copyButtonText}
            </button>
        </div>
        
        ${getMacrosHTML()} 
        
        
        <h4 style="margin-bottom:10px; border-bottom:1px solid #ddd; padding-bottom:5px;">Ingrediënten:</h4>
        <ul class="ingredients-list" style="margin-bottom:20px;">${getIngredientsHTML()}</ul>
        
        <h4 style="margin-bottom:10px; border-bottom:1px solid #ddd; padding-bottom:5px;">Bereidingswijze:</h4>
        <div class="instructions-container" style="margin-bottom:20px;">
             ${getInstructionsHTML(recipe.instructions)} 
        </div>
        
        ${chefHtml} 
        
        <div class="popup-buttons" style="display:flex; gap:10px; margin-top:20px; justify-content: center;">
            <button class="add-to-menu-btn" style="${greenGradientStyle}">+ weekmenu</button> 
            <button class="close-popup-btn" style="${orangeGradientStyle}">Sluiten</button>
        </div>
    </div>
    `;

    document.body.appendChild(overlay);

    const ingredientsList = overlay.querySelector(".ingredients-list");
    
    const personsCountSpan = overlay.querySelector("#persons-count");
    const decrementBtn = overlay.querySelector("#decrement-persons");
    const incrementBtn = overlay.querySelector("#increment-persons");

    const copyBtn = overlay.querySelector("#copy-ingredients-btn"); 
    const addToMenuBtn = overlay.querySelector(".add-to-menu-btn"); 

    const updateRecipeDisplay = () => {
        personsCountSpan.textContent = persons;
        ingredientsList.innerHTML = getIngredientsHTML();
        recipe.persons = persons; // Update het recipe object in de DOM/Menu voor boodschappenlijst
    };

    decrementBtn.addEventListener("click", () => {
        if (persons > 1) {
            persons--;
            updateRecipeDisplay();
        }
    });

    incrementBtn.addEventListener("click", () => {
        persons++;
        updateRecipeDisplay();
    });
    
    copyBtn.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(getIngredientsText()); 
            showToast("Ingrediënten gekopieerd!", "linear-gradient(90deg, #32cd32, #7fff00)");
        } catch (err) {
            console.error("Fout bij kopiëren ingrediënten:", err);
            showToast("Kopiëren mislukt.", "#ff4d4d");
        }
    });
    
    addToMenuBtn.addEventListener("click", () => {
        const emptyIndex = currentMenu.findIndex(r => r === null);
        
        if (emptyIndex !== -1) {
            // Maak een kopie van het recept en voeg 'persons' toe
            currentMenu[emptyIndex] = { ...recipe, persons: persons }; 
            renderMenu();
            showToast(`${recipe.name} toegevoegd aan weekmenu!`, "linear-gradient(90deg, #32cd32, #7fff00)");
            overlay.remove();
            menuSection.scrollIntoView({ behavior: "smooth" });
        } else {
            showToast("Weekmenu is vol. Verwijder eerst een gerecht.", "#ff4d4d");
        }
    });
    
    overlay.querySelector(".close-popup-btn").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
  }


  // ===================== Boodschappenlijst =====================
  if (shoppingListBtn) {
    shoppingListBtn.addEventListener("click", () => {
      
      const hasValidMenu = currentMenu.some(recipe => recipe !== null);
      if (!hasValidMenu) {
          showToast("Genereer eerst een weekmenu voordat u de boodschappenlijst opent.", "#ff4d4d");
          return; 
      }

      const ingredientsMap = new Map();
      currentMenu.forEach(recipe => {
        if (recipe && recipe.ingredients) {
          // Gebruik de actuele 'persons' waarde uit het menu-item
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
            
            if (quantity !== null) {
              let merged = false;
              ingredientsMap.get(item).forEach(entry => {
                if (entry.unit === unit) {
                  entry.quantity += quantity;
                  merged = true;
                }
              });
              if (!merged) {
                ingredientsMap.get(item).push({ quantity, unit });
              }
            } else {
              ingredientsMap.get(item).push({ quantity: 1, unit: unit || "stk." });
            }

          });
        }
      });

      let listHTML = "";
      ingredientsMap.forEach((amounts, item) => {
        const itemAmounts = amounts.map(a => 
          a.unit ? `${a.quantity.toFixed(1).replace(/\.0$/, '').replace(/\./, ',')} ${a.unit}`.trim() : a.quantity
        ).join(" + ");

        listHTML += `<li>
          <input type="checkbox" id="item-${item.replace(/\s/g, '-')}" class="shopping-checkbox">
          <label for="item-${item.replace(/\s/g, '-')}" style="text-decoration:none;">
             ${item} – ${itemAmounts}
          </label>
        </li>`;
      });
      
      let listText = "Boodschappenlijst:\n";
      ingredientsMap.forEach((amounts, item) => {
          const itemAmounts = amounts.map(a => 
              a.unit ? `${a.quantity.toFixed(1).replace(/\.0$/, '').replace(/\./, ',')} ${a.unit}`.trim() : a.quantity
          ).join(" + ");
          listText += `- ${item} (${itemAmounts})\n`;
      });


      const isMobile = window.innerWidth <= 600;
      const greenGradient = 'linear-gradient(90deg, #32cd32, #7fff00)';
      
      const iconSize = '18px'; 
      const buttonPadding = '10px'; 
      const iconMargin = '5px';
      const copyButtonText = 'Kopieer'; 
      
      const copyButtonStyle = `
          padding: ${buttonPadding}; border: none; border-radius: 8px; color: white;
          font-weight: bold; cursor: pointer; font-size: ${isMobile ? '0.8rem' : '1rem'};
          display: flex; flex-direction: row; flex-wrap: nowrap; align-items: center;
          justify-content: center; gap: ${iconMargin}; width: 100%; margin-top: 20px; 
          margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.4); z-index: 10;
          background: ${greenGradient};
      `;
      
      const buttonContent = `
          <img src="/Fotos/copyicon.png" alt="Kopieer" style="width: ${iconSize}; height: ${iconSize};"> 
          <span>${copyButtonText}</span>
      `;


      const overlay = document.createElement("div");
      overlay.classList.add("overlay");
      overlay.innerHTML = `
        <div class="popup" style="max-width: 550px; position:relative;">
          
          <h2>Boodschappenlijst</h2>
          
          <button id="copy-shopping-btn" style="${copyButtonStyle}">
            ${buttonContent}
          </button>
          
          <ul class="shopping-list" style="list-style: none; padding: 0;">
            ${listHTML}
          </ul>

          <button class="close-popup-btn" style="
            background: #ff7f50; color: white; padding: 10px 20px; 
            border: none; border-radius: 8px; cursor: pointer; 
            margin-top: 15px; width: 100%; font-weight: bold;">
            Sluiten
          </button>
        </div>
      `;
      document.body.appendChild(overlay);

      overlay.querySelector("#copy-shopping-btn").addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(listText);
          showToast("Boodschappenlijst gekopieerd!", "linear-gradient(90deg, #32cd32, #7fff00)");
        } catch (err) {
          console.error("Fout bij kopiëren boodschappenlijst:", err);
          showToast("Kopiëren mislukt.", "#ff4d4d");
        }
      });
      
      overlay.querySelector(".close-popup-btn").addEventListener("click", () => overlay.remove());
      overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
      
    });
  }

  // ===================== Notificaties =====================
  async function checkNotifications() {
    try {
      const res = await fetch("/api/notifications");
      const notifications = await res.json();

      notifications.forEach(n => {
        const popup = document.createElement("div");
        popup.classList.add("notification-popup"); 
        
        popup.innerHTML = `
          <p>📩 ${n.fromUser} heeft een recept met je gedeeld: <strong>${n.recipeName}</strong></p>
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px;">
              <button class="close-btn" style="background: #ccc; color: black; padding: 5px 10px; border-radius: 5px; cursor: pointer; border: none;">Sluiten</button>
          </div>
        `;
        document.body.appendChild(popup);

        popup.querySelector(".close-btn").addEventListener("click", () => popup.remove());

        setTimeout(() => popup.remove(), 10000);
      });
    } catch (err) {
      console.error("Kon notificaties niet laden:", err);
    }
  }

  // ===================== Event Listeners =====================
  // Menu generatie
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const favorite = document.getElementById("favorite").value.trim();
    const diet = document.getElementById("diet").value;
    currentMenu = await generateMenu(favorite, diet);
    
    // Stel het aantal personen standaard in op 1 voor nieuwe recepten
    currentMenu = currentMenu.map(r => r ? { ...r, persons: 1 } : null); 
    
    renderMenu();
    menuSection.scrollIntoView({ behavior: "smooth" });
  });

  // Menu opslaan
  saveMenuBtn?.addEventListener("click", async () => {
    if (!currentMenu.some(r => r !== null)) {
      showToast("Je hebt nog geen menu samengesteld!", "#ff4d4d"); 
      return;
    }
  
    const name = await promptMenuName(`Weekmenu ${new Date().toLocaleDateString('nl-NL')}`);
    
    if (!name) return;

    try {
      const res = await fetch("/api/savedmenus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Stuur alleen de ID's en het actuele aantal personen terug
        body: JSON.stringify({ 
            name, 
            menu: currentMenu.map(r => r ? { recipeId: r._id, persons: r.persons || 1 } : null) 
        }),
        credentials: "include" 
      });
  
      if (!res.ok) throw new Error("Kon menu niet opslaan op server");
  
      loadSavedMenu();
      showToast("Weekmenu opgeslagen!", "linear-gradient(90deg, #32cd32, #7fff00)"); 

    } catch (err) {
      console.error(err);
      showToast("Fout bij opslaan weekmenu", "#ff4d4d"); 
    }
  });

  // Zoeken & Filteren
  searchInput.addEventListener("input", filterRecipes);
  dietSelect.addEventListener("change", filterRecipes);

  // Hamburger menu
  hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      sidebarNav.classList.toggle('open');
  });

  // ===================== Initial Load =====================
  loadUserName();
  loadFavorites(); // Roept loadSavedMenu() en renderFavoriteRecipes() aan
  loadOwnRecipes();
  loadNews();
  window.addEventListener("load", checkNotifications);
  
  // 🔑 Belangrijk: Wacht tot loadAllRecipes klaar is, roep dan de agenda functie aan
  loadAllRecipes()
      .then(() => {
          loadAgendaMealForToday(); // <-- Agenda-functie nu veilig aangeroepen
      })
      .catch(error => {
          console.error("Fout tijdens de hoofd-initialisatie na recepten:", error);
          loadAgendaMealForToday(); // Probeer de agenda maaltijd te laden, zelfs bij een fout
      });

});