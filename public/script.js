const form = document.getElementById("preferences-form");
const menuContainer = document.getElementById("menu-container");
const menuSection = document.querySelector(".menu");

let currentMenu = [];

/* ============================
   GLOBALE HULPDEFINITIES
============================ */
// Definieer de stijlen die nodig zijn voor de tags en popups
const dummyLogo = "/Fotos/logo_.png"; 
const greenGradient = 'linear-gradient(90deg, #32cd32, #7fff00)'; 
const orangeGradient = 'linear-gradient(90deg,#ff7f50,#ffb347)'; 
const copyIconPath = "/Fotos/copyicon.png"; 

// 🔑 ShowToast functie
/**
 * Toont een tijdelijke melding (toast) onderaan het scherm.
 * @param {string} msg De te tonen tekst.
 * @param {string} color De achtergrondkleur of gradiënt.
 */
function showToast(msg, color = greenGradient) {
    let toast = document.getElementById("toast");
    const isGradient = color.includes('gradient');
    const isMobileView = window.innerWidth <= 600;

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.style.position = "fixed";
      toast.style.bottom = "20px";
      toast.style.left = "50%"; 
      toast.style.right = "auto";
      
      toast.style.padding = "0.75rem 1.25rem";
      toast.style.color = "#fff";
      toast.style.borderRadius = "8px";
      toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
      toast.style.textAlign = "center";
      toast.style.fontSize = "1rem";
      toast.style.fontWeight = "bold";
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      toast.style.zIndex = "10000";
      
      document.body.appendChild(toast);
    }

    toast.textContent = msg;
    
    if (isGradient) {
        toast.style.background = color;
        toast.style.backgroundColor = 'transparent';
    } else {
        toast.style.background = 'none';
        toast.style.backgroundColor = color;
    }
    
    if (isMobileView) {
        toast.style.width = "90%";
        toast.maxWidth = "none";
    } else {
        toast.style.width = "auto";
        toast.maxWidth = "400px"; 
    }

    toast.style.transform = "translate(-50%, 20px)"; 

    toast.style.opacity = "1";
    toast.style.transform = "translate(-50%, 0)";

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translate(-50%, 20px)";
    }, 2500);
}


/**
 * Genereert de HTML-string voor dieetgerelateerde tags.
 * @param {object} recipe Het receptobject.
 * @returns {string} De HTML-string met gestylede tags.
 */
function getDietTagsHtml(recipe) {
    const tags = recipe.tags?.map(t => t.toLowerCase().trim()) || [];
    const macros = recipe.macros || {};
    const displayedTags = [];

    // 1. Vegetarisch & Vegan
    if (tags.includes("vegan")) {
        displayedTags.push({ label: "Vegan", color: "#2E8B57" });
    } else if (tags.includes("vegetarisch")) {
        displayedTags.push({ label: "Veggie", color: "#6B8E23" });
    }

    // 2. Glutenvrij
    if (tags.includes("glutenvrij")) {
        displayedTags.push({ label: "Glutenvrij", color: "#FF8C00" });
    }
    
    // 3. Low-Carb
    if (macros.carbs !== undefined && macros.carbs <= 20) {
        displayedTags.push({ label: "Low-Carb", color: "#4682B4" });
    }
    
    // 4. High-Protein
    if (macros.protein !== undefined && macros.protein >= 15) {
        displayedTags.push({ label: "High-Protein", color: "#DC143C" });
    }
    
    if (displayedTags.length === 0) return '';

    // Creëer de HTML voor de tags-container
    const tagsHtml = displayedTags.map(tag => `
        <span style="
            background-color: ${tag.color}; 
            color: white; 
            padding: 4px 8px; 
            border-radius: 12px; 
            font-size: 0.75rem;
            font-weight: 500;
            margin: 3px; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.2); 
            white-space: nowrap;
            display: inline-block;
        ">${tag.label}</span>
    `).join('');

    return `
        <div class="tags-container" style="
            display: flex; 
            flex-wrap: wrap; 
            justify-content: center;
            margin-top: 5px; 
            min-height: 25px;
            padding-bottom: 5px;
        ">${tagsHtml}</div>
    `;
}

// Shuffle helper
function shuffleArray(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

// Fetch recepten via backend en filteren (Ongewijzigd)
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

// Form submit (Ongewijzigd)
if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const favorite = document.getElementById("favorite").value.trim();
      const diet = document.getElementById("diet").value;

      currentMenu = await generateMenu(favorite, diet);
      renderMenu();
      if (menuSection) {
        menuSection.scrollIntoView({ behavior: "smooth" });
      }
    });
}


// Render menu (MET CORRECTIE)
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
      // 🔑 CORRECTIE: Bepaal de URL. Gebruik de dummyLogo als recipe.image leeg is.
      const imageUrl = recipe.image || dummyLogo; 
      
      // Gebruik de CSS-klas voor de duration-label (was inline)
      card.innerHTML = `
        <button class="remove-btn">&times;</button>
        <h3>${days[index]}</h3>
        <div class="image-container" style="position:relative;">
          <img src="${imageUrl}" alt="${recipe.name}">
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
        ${getDietTagsHtml(recipe)}
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

// Klik op kaarten (Ongewijzigd)
if (menuContainer) {
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
        // De dag is niet nodig in de nieuwe showRecipeDetails
        showRecipeDetails(currentMenu[index]); 
      }
    });
}


// ==========================================================
// 🔑 GECORRIGEERD: Geavanceerde Recept-popup (showRecipeDetails)
// ==========================================================
function showRecipeDetails(recipe) {
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    
    // Zorg dat persons bestaat. BaseAmount wordt hier ook ingesteld als het ontbreekt.
    if (recipe.persons === undefined) recipe.persons = 1;
    let persons = recipe.persons;
    
    const isMobile = window.innerWidth <= 600;

    (recipe.ingredients || []).forEach(i => {
        if (!i.baseAmount) i.baseAmount = i.amount;
    });

    const getIngredientsTextToCopy = () => {
        let text = `--- Ingrediënten voor ${recipe.name} (${persons} porties) ---\n`;
        
        (recipe.ingredients || []).forEach(i => {
            let qty = i.baseAmount || "";
            const match = i.baseAmount?.match(/^([\d.,]+)\s*(.*)$/);
            if (match) {
                const baseAmount = parseFloat(match[1].replace(",", "."));
                const unit = match[2] || "";
                const calculatedQty = (baseAmount * persons).toFixed(2).replace(/\.00$/, '').replace(/\./, ',');
                qty = `${calculatedQty} ${unit}`.trim();
            }
            text += `${i.item}: ${qty}\n`;
        });
        
        return text.trim();
    };


    const getIngredientsHTML = () =>
      (recipe.ingredients || []).map(i => {
        let qty = i.baseAmount || "";
        const match = i.baseAmount?.match(/^([\d.,]+)\s*(.*)$/);
        if (match) {
            const baseAmount = parseFloat(match[1].replace(",", "."));
            const unit = match[2] || "";
            const calculatedQty = (baseAmount * persons).toFixed(2).replace(/\.00$/, '').replace(/\./, ','); 
            qty = `${calculatedQty} ${unit}`.trim();
        }
        return `
            <li>
                <span>${i.item}</span> 
                <span>${qty}</span>
            </li>`;
      }).join("");
      
    // Helper: Converteert instructies
    const getInstructionsHTML = () => {
        let instructions = recipe.instructions;
        let steps = [];

        if (Array.isArray(instructions) && instructions.length > 0) {
            steps = instructions;
        } else if (typeof instructions === 'string' && instructions.trim() !== '') {
             steps = instructions.split('\n').filter(s => s.trim() !== '');
        } else {
             return `<p>Geen bereidingswijze beschikbaar.</p>`;
        }

        const stepsHtml = steps.map(step => 
            `<div>${step}</div>` 
        ).join('');
        
        return `<div class="instructions-container">${stepsHtml}</div>`;
    };

    // 🔑 HELPER: Genereert alleen de HTML voor de Macro's
    const getMacrosHTML = () => {
        const macros = recipe.macros || {};
        
        // De macro's p.p. blijven statisch
        const proteinPP = (macros.protein || 0).toFixed(1);
        const carbsPP = (macros.carbs || 0).toFixed(1);
        const fatPP = (macros.fat || 0).toFixed(1);
        
        return `
            <h4>Voedingswaarden p.p.</h4>
            <div>
                <span style="color:#4CAF50;">Eiwit: ${proteinPP}g</span>
                <span style="color:#FF9800;">Koolh.: ${carbsPP}g</span>
                <span style="color:#F44336;">Vet: ${fatPP}g</span>
            </div>
        `;
    };


    // 🔑 GECORRIGEERD: Genereert de complete info-bar met alle 3 de blokken naast elkaar.
    const getMacrosAndControlsHTML = () => {
        const time = recipe.duration || 0;
        
        // Gebruikt de .recipe-info-bar klasse uit CSS
        // Alle drie de blokken staan nu als directe kinderen in de flexibele container.
        let html = `
            <div class="recipe-info-bar">
        `; 

        // 1. TIJD (Statisch)
        html += `
            <div class="info-block time-block">
                <h4>Tijd</h4>
                <p class="time-value">⏱ ${time} min</p>
            </div>
        `;

        // 2. PERSONEN (met de knoppen)
        html += `
            <div class="info-block persons-block">
                <h4>Personen</h4>
                <div class="persons-controls">
                    <button id="decrement-persons" class="persons-control-btn">-</button>
                    <span id="persons-count">${persons}</span>
                    <button id="increment-persons" class="persons-control-btn">+</button>
                </div>
            </div>
        `;
        
        // 3. MACROS P.P.
        html += `
            <div class="info-block macros-block" id="macro-data-block">
                ${getMacrosHTML()}
            </div>
        `;


        html += '</div>'; // Sluit recipe-info-bar
        return html;
    };
    
    // De stijlen voor de knoppen zijn in de CSS gedefinieerd (.login-btn en .popup button)
    
    // 🔑 Gebruik de `copyButtonStyle` en `copyButtonContent` zoals gedefinieerd in de CSS context
    const copyButtonStyle = `
        position: absolute; 
        top: 10px;        
        right: 10px;       
        padding: ${isMobile ? '8px 8px' : '8px 10px'}; 
        border-radius: 8px;
        background: ${greenGradient}; 
        color: white;
        border: none;
        cursor: pointer;
        font-weight: bold;
        z-index: 10;
        font-size: 14px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center; 
        gap: 5px;
    `;
    
    const copyButtonContent = `
        <img src="${copyIconPath}" alt="Kopieer" style="width: 25px; height: 25px;"> 
        ${isMobile ? '' : '<span>Kopiëren</span>'}
    `;

    const closeButtonStyle = `
        padding: 20px 20px; 
        font-size: 1.1rem; 
        width: 100%; 
        border:none; 
        border-radius:10px; 
        background:${orangeGradient}; 
        color:white; 
        cursor:pointer;
        margin-top:20px;
    `;
    
    // 🔑 Chef-blok HTML (Conditioneel)
    let chefBlockHTML = '';
    
    const chefValue = recipe.chef ? recipe.chef.trim().toLowerCase() : '';

    if (chefValue !== "" && chefValue !== "admin") {
        // Gebruikt de .chef-block klasse uit CSS
        // Zorgt dat de <strong> tag om 'Chef' zit voor de CSS styling.
        chefBlockHTML = `
            <div class="chef-block">
                <h4><strong>Chef</strong></h4>
                <p>${recipe.chef}</p>
            </div>
        `;
    }


    overlay.innerHTML = `
      <div id="recipe-popup-content" class="popup">
        <h2 style="margin-bottom:5px;">${recipe.name}</h2>
        
        <div style="position:relative; margin-bottom:15px;"> 
            <img src="${recipe.image || dummyLogo}" alt="${recipe.name}" style="width:100%; border-radius:10px; display:block;">
            
            <button id="copy-recipe-btn" title="Kopieer Ingrediënten" style="${copyButtonStyle}">
                ${copyButtonContent}
            </button>
        </div>
        
        ${getMacrosAndControlsHTML()} 
        
        <h4 style="margin-bottom:10px; border-bottom:1px solid #ddd; padding-bottom:5px;">Ingrediënten:</h4>
        <ul class="ingredients-list">${getIngredientsHTML()}</ul>
        
        <h4 style="margin-bottom:10px; border-bottom:1px solid #ddd; padding-bottom:5px;">Bereidingswijze:</h4>
        ${getInstructionsHTML()} 
        
        ${chefBlockHTML} 

        <button id="close-recipe" style="${closeButtonStyle}">Sluiten</button>
      </div>
    `;

    document.body.appendChild(overlay);

    // Koppel elementen NA toevoegen aan de DOM
    // 🔑 Nieuwe element selecties
    const personsCountSpan = overlay.querySelector("#persons-count");
    // We selecteren deze nog steeds, maar de inhoud hoeft niet echt geüpdatet te worden (want het is p.p.).
    const macroDataBlock = overlay.querySelector("#macro-data-block"); 
    
    const ingredientsList = overlay.querySelector(".ingredients-list");
    const copyBtn = overlay.querySelector("#copy-recipe-btn");
    const closeBtn = overlay.querySelector("#close-recipe");

    // Functie om de popup-inhoud te updaten
    const updateRecipeDisplay = () => {
        // Update het receptobject met de nieuwe 'persons'
        recipe.persons = persons; 
        
        // 1. Update Ingrediëntenlijst (essentieel)
        ingredientsList.innerHTML = getIngredientsHTML();

        // 2. Update Porties teller (ALLEEN de tekst)
        if (personsCountSpan) {
            personsCountSpan.textContent = persons;
        }

        // 3. Update Macro's (niet nodig tenzij de macro's niet p.p. waren, maar we laten de functie bestaan voor de zekerheid)
        if (macroDataBlock) {
             // Let op: getMacrosHTML() is statisch omdat het p.p. is. Als het de totale macro's moest tonen, zou dit veranderd moeten worden.
             // macroDataBlock.innerHTML = getMacrosHTML();
        }
    };
    
    // Hulpfunctie om de Portie-knoppen te koppelen (blijft ongewijzigd)
    const setupPersonControls = () => {
        const decrementBtn = overlay.querySelector("#decrement-persons");
        const incrementBtn = overlay.querySelector("#increment-persons");
        
        // Knoppen zijn al in de DOM, dus we kunnen de listeners nu direct koppelen
        if (decrementBtn) {
            decrementBtn.addEventListener("click", () => {
                if (persons > 1) { persons--; updateRecipeDisplay(); }
            });
        }
        if (incrementBtn) {
            incrementBtn.addEventListener("click", () => {
                persons++; updateRecipeDisplay();
            });
        }
    };
    
    // Koppel de knoppen bij initialisatie
    setupPersonControls();
    
    // Kopiëren functionaliteit
    copyBtn.addEventListener("click", async () => {
        try {
            const ingredientsText = getIngredientsTextToCopy(); 
            await navigator.clipboard.writeText(ingredientsText);
            showToast("Ingrediënten gekopieerd! Je kunt ze nu plakken.", greenGradient); 
        } catch (err) {
            console.error("Fout bij kopiëren:", err);
            showToast("Kopiëren mislukt.", "#ff4d4d");
        }
    });

    // Sluiten functionaliteit
    closeBtn.addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", e => { 
        if (e.target === overlay) overlay.remove(); 
    });
}


/* =======================================
   INITIALISATIE EN CLICK LISTENERS (DOMContentLoaded)
======================================= */
document.addEventListener('DOMContentLoaded', function() {
  
  // 1. HAMBURGER MENU LOGICA (Ongewijzigd)
  const hamburger = document.querySelector(".hamburger");
  const navRight = document.querySelector(".nav-right");
  
  if (hamburger && navRight) {

    function toggleMenu(open) {
      const willOpen = open === undefined ? !navRight.classList.contains("active") : !!open;
      if (willOpen) {
        navRight.classList.add("active");
        hamburger.classList.add("active");
        document.body.classList.add("drawer-open");
      } else {
        navRight.classList.remove("active");
        hamburger.classList.remove("active");
        document.body.classList.remove("drawer-open");
      }
    }
    hamburger.addEventListener("click", () => toggleMenu());
  }

  // 2. BOODSCHAPPENLIJST KNOP LOGICA (Ongewijzigd)
  const shoppingListBtn = document.getElementById("shopping-list-btn");

  if (shoppingListBtn) {
    // Definieer de stijl die nodig is voor de knop in de popup (hergebruik)
    const closeButtonStyle = `
        padding: 15px 15px; 
        border: none;
        border-radius: 12px;
        color: white;
        font-weight: bold;
        cursor: pointer;
        font-size: 1.1rem;
        width: 100%;
        text-align: center;
        background: ${orangeGradient};
        transition: background 0.3s ease;
        margin-top: 20px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;

    shoppingListBtn.addEventListener("click", () => {
      const ingredientsMap = new Map();

      currentMenu.forEach(recipe => {
        if (recipe && recipe.ingredients) {
          // Gebruik de opgeslagen persons waarde, die door showRecipeDetails is geüpdatet
          const persons = recipe.persons || 1; 
          recipe.ingredients.forEach(i => {
            // Gebruik baseAmount van de popup of de oorspronkelijke amount
            const amount = i.baseAmount || i.amount; 
            
            const match = amount.match(/^([\d.,]+)\s*(.*)$/);
            let quantity = null;
            let unit = "";
            
            if (match) {
              quantity = parseFloat(match[1].replace(",", ".")) * persons;
              unit = match[2] || "";
            } else {
              unit = amount; 
            }

            const itemKey = i.item.trim();
            if (!ingredientsMap.has(itemKey)) ingredientsMap.set(itemKey, []);
            ingredientsMap.get(itemKey).push({ quantity, unit });
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
          if (quantity != null && !isNaN(quantity)) {
            if (!totals[unit]) totals[unit] = 0;
            totals[unit] += quantity;
          } else {
            if (!totals[unit]) totals[unit] = unit;
            else if (totals[unit] !== unit) totals[unit] += ` + ${unit}`;
          }
        });

        const totalStr = Object.entries(totals).map(([unit, total]) => {
          if (typeof total === 'number') {
             const formattedTotal = total.toFixed(2).replace(/\.00$/, '').replace(/\./, ',');
             return `${formattedTotal} ${unit}`.trim();
          }
          return total; 
        }).join(" + ");


        listItems.push(`
          <li class="shopping-item" style="
            display:flex; align-items:center; margin:0.3rem 0; 
            background:#fff; padding:12px 15px; border-radius:10px;
            box-shadow:0 2px 5px rgba(0,0,0,0.15);
            transition: all 0.2s;
          ">
            <input type="checkbox" class="ingredient-checkbox" style="margin-right:10px; flex:0 0 20px; width:18px; height:18px; cursor:pointer;">
            <span class="ingredient-name" style="flex:1;">${item}</span>
            <span class="ingredient-amount" style="flex:1; text-align:right; font-weight:bold;">${totalStr}</span>
          </li>
        `);
      });

      const overlay = document.createElement("div");
      overlay.classList.add("overlay");
      overlay.innerHTML = `
        <div class="popup" style="max-width: 500px; padding: 25px;">
          <h2>🛒 Jouw boodschappenlijst</h2>
          <ul style="list-style: none; padding: 0;">
            ${listItems.join("")}
          </ul>
          <button id="close-list" style="${closeButtonStyle}">Sluiten</button>
        </div>
      `;
      document.body.appendChild(overlay);

      // Checkbox functionaliteit: doorstrepen bij aanvinken
      overlay.querySelectorAll(".ingredient-checkbox").forEach(checkbox => {
        checkbox.addEventListener("change", (e) => {
          const li = e.target.closest(".shopping-item");
          const nameSpan = li.querySelector('.ingredient-name');
          const amountSpan = li.querySelector('.ingredient-amount');
          
          if (e.target.checked) {
            nameSpan.style.textDecoration = "line-through";
            amountSpan.style.textDecoration = "line-through";
            li.style.opacity = "0.6";
          } else {
            nameSpan.style.textDecoration = "none";
            amountSpan.style.textDecoration = "none";
            li.style.opacity = "1";
          }
        });
      });

      overlay.querySelector("#close-list").addEventListener("click", () => overlay.remove());
      overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
    });
  }
});