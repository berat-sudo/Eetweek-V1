document.addEventListener("DOMContentLoaded", () => {

  /* ============================
     GLOBALE HULPDEFINITIES (Onveranderd)
  ============================ */
  const dummyLogo = "/Fotos/logo_.png";
  const greenGradient = 'linear-gradient(90deg, #32cd32, #7fff00)'; 
  const orangeGradient = 'linear-gradient(90deg,#ff7f50,#ffb347)'; 
  const copyIconPath = "/Fotos/copyicon.png"; 

  const days = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];
  
  const isMobileGlobal = window.innerWidth <= 600; 

  // Helper voor toast/meldingen (Onveranderd)
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
  
  // Gebruikersnaam laden (Onveranderd)
  const userNameEl = document.getElementById("user-name");
  const userNameSidebarEl = document.getElementById("user-name-sidebar");
  const profileCircleEl = document.getElementById("profile-circle");

  async function loadUserName() {
    try {
      const res = await fetch("/api/user", { credentials: "include" });
      if (!res.ok) throw new Error("Kan gebruikersnaam niet ophalen");

      const data = await res.json();
      const name = data.name || "Gebruiker";

      if (userNameEl) userNameEl.textContent = name;
      if (userNameSidebarEl) userNameSidebarEl.textContent = name;
      if (profileCircleEl) profileCircleEl.textContent = name.charAt(0).toUpperCase();
    } catch (err) {
      console.error("Fout bij laden gebruikersnaam:", err);
      if (profileCircleEl) profileCircleEl.textContent = "U";
    }
  }
  loadUserName();
  
  // TAG FUNCTIE (Verfijnd om tags als lege array te behandelen indien undefined)
  function getRecipeTagsHtml(recipe) {
    // 🔑 EXTRA VEILIGHEID: Zorg ervoor dat recipe.tags een array is
    let tags = [];
    if (Array.isArray(recipe.tags)) {
        tags = recipe.tags.map(t => t.toLowerCase().trim());
    }
    
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

    // 3. Low-Carb (minder dan 20g koolhydraten per portie aangenomen)
    if (macros.carbs !== undefined && macros.carbs <= 20) {
        displayedTags.push({ label: "Low-Carb", color: "#4682B4" });
    }
    
    // 4. High-Protein (meer dan 15g eiwitten per portie aangenomen)
    if (macros.protein !== undefined && macros.protein >= 20) {
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

  // ===================== Opgeslagen weekmenu's =====================
  const container = document.getElementById("saved-menus-container");
  if (!container) return;

  // loadSavedMenus (Onveranderd, behalve de reverse van de array)
  async function loadSavedMenus() {
    try {
      const res = await fetch("/api/savedmenus", { credentials: "include" });
      if (!res.ok) throw new Error("Kon weekmenu's niet ophalen");
      let savedMenus = await res.json(); 

      if (!Array.isArray(savedMenus)) {
        savedMenus = [];
      }

      container.innerHTML = "";
      if (savedMenus.length === 0) {
        container.innerHTML = "<p>Hier komen je opgeslagen weekmenu's te staan.</p>";
        return;
      }

      const menusToDisplay = [...savedMenus].reverse();
      menusToDisplay.forEach((saved) => addSavedMenuToDOM(saved));

    } catch (err) {
      console.error("Fout bij laden weekmenu's:", err);
      container.innerHTML = "<p>Kon weekmenu's niet laden. Probeer later opnieuw of zie console.</p>";
    }
  }

  // 🔑 addSavedMenuToDOM (Weergave van naam is nu de meest robuuste versie)
  function addSavedMenuToDOM(saved) {
    const kaft = document.createElement("div");
    kaft.classList.add("saved-menu-kaft");
    kaft.style = `
      cursor:pointer; padding:10px; margin-bottom:10px;
      background:white; border-radius:10px; box-shadow:0 4px 10px rgba(0,0,0,0.1);
      transition: transform 0.2s; position:relative;
    `;
    kaft.addEventListener("mouseenter", () => kaft.style.transform = "scale(1.02)");
    kaft.addEventListener("mouseleave", () => kaft.style.transform = "scale(1)");

    // Titel
    const title = document.createElement("h3");
    title.textContent = saved.name || "Weekmenu";
    kaft.appendChild(title);

    // Dag-preview gerechten
    const preview = document.createElement("div");
    preview.classList.add("day-preview");
    preview.style.display = "flex";
    preview.style.gap = "5px";

    (saved.menu || []).forEach(recipe => {
      
      // 🔑 MEEST ROBUUSTE FIX voor de naam:
      // Check of recipe bestaat EN of het een object is, én of name een niet-lege string is.
      let recipeName = "-";
      if (recipe && typeof recipe === 'object' && recipe.name && typeof recipe.name === 'string' && recipe.name.trim() !== '') {
          recipeName = recipe.name;
      }
      
      if (recipe && recipe.persons === undefined) recipe.persons = 1;
      const span = document.createElement("span");
      span.textContent = recipeName; 
      span.style = `
        background:#f0f0f0; 
        color:rgb(45, 45, 45); 
        padding:2px 6px; 
        border-radius:6px;
        font-size:0.9rem;
      `;
      preview.appendChild(span);
    });
    kaft.appendChild(preview);

    // Prullenbakje (Onveranderd)
    const trash = document.createElement("img");
    trash.src = "/Fotos/prullenbakicon.png";
    trash.alt = "Verwijder weekmenu";
    trash.title = "Verwijder weekmenu";
    trash.style = `
      position: absolute;
      top: 10px;
      right: 10px;
      width: 20px;
      height: 20px;
      cursor: pointer;
    `;
    trash.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm(`Weet je zeker dat je "${saved.name}" wilt verwijderen?`)) return;
      try {
        const delRes = await fetch(`/api/savedmenus/${saved._id}`, {
          method: "DELETE",
          credentials: "include"
        });
        if (!delRes.ok) throw new Error("Kon weekmenu niet verwijderen");
        kaft.remove();
        showToast("Weekmenu verwijderd!", orangeGradient);
      } catch (err) {
        console.error("Fout bij verwijderen:", err);
        showToast("Kon weekmenu niet verwijderen", "#ff4d4d");
      }
    });
    kaft.appendChild(trash);

    // Boodschappenlijst knop (Onveranderd)
    const listBtn = document.createElement("button");
    listBtn.style = `
      margin-top:10px;
      padding: 0.3rem 0.7rem;
      font-size: 0.85rem;
      border-radius: 8px;
      background: linear-gradient(90deg, #32cd32, #7fff00);
      border: none;
      color: white;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
    `;
    const icon = document.createElement("img");
    icon.src = "/Fotos/winkelmandjeicon.png";
    icon.alt = "🛒";
    icon.style.width = "16px";
    icon.style.height = "16px";
    const text = document.createTextNode("Boodschappenlijstje");
    listBtn.appendChild(icon);
    listBtn.appendChild(text);
    listBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showShoppingList(saved);
    });
    kaft.appendChild(listBtn);

    // Klik op kaft → weekmenu-popup (Onveranderd)
    kaft.addEventListener("click", () => showMenuPopup(saved));

    container.appendChild(kaft);
  }

  loadSavedMenus();

  // ===================== Weekmenu-popup =====================
  function showMenuPopup(saved) {
    const overlay = document.createElement("div");
    overlay.style = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.7); display:flex; 
      justify-content:center; align-items:center; z-index:1000; padding:10px;
    `;

    const popup = document.createElement("div");
    popup.style = `
      background:white; padding:20px; border-radius:12px;
      max-width:600px; width:90%; max-height:80%; overflow-y:auto;
      box-shadow:0 8px 20px rgba(0,0,0,0.2); position:relative;
    `;

    const title = document.createElement("h2");
    title.textContent = saved.name || "Weekmenu";
    title.style.marginBottom = "15px";
    popup.appendChild(title);

    const grid = document.createElement("div");
    grid.style = "display:grid; grid-template-columns:1fr 1fr; gap:10px;";

    (saved.menu || []).forEach((recipe, i) => {
      const card = document.createElement("div");
      card.style = `
        background:#f8f8f8; border-radius:10px; padding:10px;
        box-shadow:0 2px 6px rgba(0,0,0,0.1); cursor:${recipe ? "pointer" : "default"};
        display:flex; flex-direction:column; align-items:center; text-align:center;
        transition: transform 0.2s;
      `;
      if (recipe && recipe.name) {
        card.addEventListener("mouseenter", () => card.style.transform = "scale(1.03)");
        card.addEventListener("mouseleave", () => card.style.transform = "scale(1)");
        card.addEventListener("click", e => {
          e.stopPropagation();
          showRecipeDetails(recipe);
        });
      }

      const dayName = document.createElement("strong");
      dayName.textContent = days[i] || "";
      dayName.style.marginBottom = "5px";
      card.appendChild(dayName);

      const recipeName = document.createElement("span");
      recipeName.textContent = recipe?.name || "Leeg";
      recipeName.style.fontSize = "0.95rem";
      recipeName.style.color = recipe?.name ? "#ff7f50" : "#999"; // Pas kleur aan als naam bestaat
      card.appendChild(recipeName);
      
      // 🔑 Extra controle bij toevoegen van tags:
      if (recipe && recipe.name) {
          card.innerHTML += getRecipeTagsHtml(recipe);
      }

      grid.appendChild(card);
    });

    popup.appendChild(grid);

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Sluiten";
    closeBtn.style = `
      margin-top:15px; 
      padding:1rem 1.5rem; 
      font-size: 1.1rem;    
      width: 100%;          
      border:none; border-radius:10px;
      background:linear-gradient(90deg,#ff7f50,#ffb347); color:white; cursor:pointer;
    `;
    closeBtn.addEventListener("click", () => overlay.remove());
    popup.appendChild(closeBtn);

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    overlay.addEventListener("click", e => {
      if (e.target === overlay) overlay.remove();
    });
  }

  // ==========================================================
  // Recept-popup (showRecipeDetails)
  // ==========================================================
  function showRecipeDetails(recipe) {
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    overlay.style = `
        position:fixed; top:0; left:0; width:100%; height:100%;
        background:rgba(0,0,0,0.0); 
        display:flex; justify-content:center; align-items:center; 
        z-index:1001; padding:10px;
    `;


    if (recipe.persons === undefined) recipe.persons = 1;
    let persons = recipe.persons;
    
    const isMobile = window.innerWidth <= 600;

    // Zorg ervoor dat baseAmount bestaat voor schaling (BELANGRIJK!)
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
        return `<li>${i.item} – ${qty}</li>`;
      }).join("");
      
    // Converteert instructies (Array) naar gescheiden DIV's (zonder nummers)
    const getInstructionsHTML = () => {
        let instructions = recipe.instructions;

        // Controleer of het een array is en niet leeg
        if (Array.isArray(instructions) && instructions.length > 0) {
            // Maak gescheiden stappen met marges
            const stepsHtml = instructions.map(step => 
                `<div style="margin-bottom: 12px; padding: 8px 10px; background: #f9f9f9; border-left: 3px solid #ff7f50; border-radius: 4px; line-height: 1.4;">${step}</div>`
            ).join('');
            
            return `<div style="padding: 5px 0;">${stepsHtml}</div>`;
        }
        
        if (typeof instructions === 'string' && instructions.trim() !== '') {
             return `<p>${instructions}</p>`;
        }

        return `<p>Geen bereidingswijze beschikbaar.</p>`;
    };


    // Genereert de complete info-bar met knoppen en tijd
    const getMacrosAndControlsHTML = () => {
        const macros = recipe.macros || {};
        const time = recipe.duration || 0;
        
        const proteinPP = (macros.protein || 0).toFixed(1);
        const carbsPP = (macros.carbs || 0).toFixed(1);
        const fatPP = (macros.fat || 0).toFixed(1);
        
        let html = '<div class="recipe-info-bar">'; 

        // 1. MACROS
        html += `
            <div class="info-block macros-block">
                <h4 style="margin-top:0; margin-bottom: 0.5rem; font-size:1rem;">Voedingswaarden p.p.</h4>
                <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
                    <span class="protein">Eiwit: <strong>${proteinPP}g</strong></span>
                    <span class="carbs">Koolh.: <strong>${carbsPP}g</strong></span>
                    <span class="fat">Vet: <strong>${fatPP}g</strong></span>
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

        // 3. PERSONEN (met de knoppen)
        html += `
            <div class="info-block persons-block">
                <h4 style="margin-top:0; margin-bottom: 0.5rem; font-size:1rem;">Personen</h4>
                <div class="persons-controls" style="display:flex; justify-content:center; align-items:center; gap:8px;">
                    <button id="decrement-persons" style="width:30px; height:30px; border-radius:50%; border:1px solid #ccc; cursor:pointer; font-size:1.2rem; font-weight:bold;">-</button>
                    <span id="persons-count" style="font-size:1.1rem; font-weight:bold;">${persons}</span>
                    <button id="increment-persons" style="width:30px; height:30px; border-radius:50%; border:1px solid #ccc; cursor:pointer; font-size:1.2rem; font-weight:bold;">+</button>
                </div>
            </div>
        `;

        html += '</div>'; // Sluit recipe-info-bar
        return html;
    };
    
    // Stijlen voor de Kopieerknop (Onveranderd)
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
    
    // 🔑 Chef-blok HTML (Extra robuuste controle)
    let chefBlockHTML = '';
    let validChef = false;
    let chefName = '';
    
    // Check of recipe.chef bestaat en een niet-lege string is, en niet "admin" (case-insensitive)
    if (recipe.chef && typeof recipe.chef === 'string' && recipe.chef.trim() !== '') {
        chefName = recipe.chef.trim();
        if (chefName.toLowerCase() !== 'admin') {
            validChef = true;
        }
    }

    if (validChef) {
        chefBlockHTML = `
            <div class="info-block chef-block" style="
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
                <p style="margin:5px 0 0; font-size:1.1rem; font-weight:bold; color:#ff7f50;">${chefName}</p>
            </div>
        `;
    }


    overlay.innerHTML = `
      <div id="recipe-popup-content" class="popup" style="
        background:white; padding:1rem; border-radius:15px;
        max-width:600px; 
        width:100%;       
        max-height:85%; overflow-y:auto;
        box-shadow:0 10px 30px rgba(0,0,0,0.3); font-family:Arial,sans-serif;
      ">
        <h2 style="margin-bottom:5px;">${recipe.name}</h2>
        
        <div style="position:relative; margin-bottom:15px;"> 
            <img src="${recipe.image || dummyLogo}" alt="${recipe.name}" style="width:100%; border-radius:10px; display:block;">
            
            <button id="copy-recipe-btn" title="Kopieer Ingrediënten" style="${copyButtonStyle}">
                ${copyButtonContent}
            </button>
        </div>
        
        ${getMacrosAndControlsHTML()} 
        
        <h4 style="margin-bottom:10px; border-bottom:1px solid #ddd; padding-bottom:5px;">Ingrediënten:</h4>
        <ul class="ingredients-list" style="margin-bottom:20px;">${getIngredientsHTML()}</ul>
        
        <h4 style="margin-bottom:10px; border-bottom:1px solid #ddd; padding-bottom:5px;">Bereidingswijze:</h4>
        <div class="instructions-container" style="margin-bottom:20px;">
            ${getInstructionsHTML()} 
        </div>
        
        ${chefBlockHTML} 

        <button id="close-recipe" style="${closeButtonStyle}">Sluiten</button>
      </div>
    `;

    document.body.appendChild(overlay);

    const personsCountSpan = overlay.querySelector("#persons-count");
    const decrementBtn = overlay.querySelector("#decrement-persons");
    const incrementBtn = overlay.querySelector("#increment-persons");
    const ingredientsList = overlay.querySelector(".ingredients-list");
    const copyBtn = overlay.querySelector("#copy-recipe-btn");

    // Functie om de popup-inhoud te updaten
    const updateRecipeDisplay = () => {
        personsCountSpan.textContent = persons;
        ingredientsList.innerHTML = getIngredientsHTML();
        recipe.persons = persons; 
    };

    // Event Listeners voor de knoppen (Onveranderd)
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
            const ingredientsText = getIngredientsTextToCopy(); 
            await navigator.clipboard.writeText(ingredientsText);
            showToast("Ingrediënten gekopieerd! Je kunt ze nu plakken.", greenGradient); 
        } catch (err) {
            console.error("Fout bij kopiëren:", err);
            showToast("Kopiëren mislukt.", "#ff4d4d");
        }
    });

    overlay.querySelector("#close-recipe").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", e => { 
        if (e.target === overlay) overlay.remove(); 
    });
  }

  // Boodschappenlijst-popup (Onveranderd)
  function showShoppingList(saved) {
    document.querySelectorAll(".force-popup-overlay").forEach(el => el.remove());
  
    const overlay = document.createElement("div");
    overlay.className = "force-popup-overlay";
    overlay.style = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.7);
      display:flex; justify-content:center; align-items:center;
      z-index:999999; padding:20px;
    `;
  
    const popup = document.createElement("div");
    popup.style = `
      background:linear-gradient(145deg, #e4e4e4, #f2f2f2); padding:25px; border-radius:18px;
      max-width:500px; width:95%;
      max-height:80%; overflow-y:auto;
      box-shadow:0 10px 30px rgba(0,0,0,0.30);
      position:relative; z-index:1000000;
    `;
  
    const titleContainer = document.createElement("div");
    titleContainer.style = `
      display:flex;
      flex-wrap: wrap;         
      justify-content: space-between;
      align-items: center;
      gap: 10px;               
      margin-bottom: 15px;
    `;

  
    const title = document.createElement("h2");
    title.textContent = `Boodschappenlijstje: ${saved.name}`;
    title.style.margin = "0";
  
    const copyBtn = document.createElement("button");
    copyBtn.style = `
      display:flex; align-items:center; gap:5px;
      background:#32cd32; color:white; border:none; padding:5px 10px;
      border-radius:8px; cursor:pointer; font-weight:bold;
    `;
  
    const copyIcon = document.createElement("img");
    copyIcon.src = "/Fotos/winkelmandjeicon.png"; 
    copyIcon.alt = "Kopiëren";
    copyIcon.style.width = "16px";
    copyIcon.style.height = "16px";
  
    copyBtn.appendChild(copyIcon);
    copyBtn.appendChild(document.createTextNode("Kopiëren"));
  
    // Functionaliteit kopiëren (Boodschappenlijst)
    copyBtn.addEventListener("click", () => {
      const ingredientsList = [];
      (saved.menu || []).forEach(recipe => {
        const multiplier = recipe.persons || 1;
        (recipe.ingredients || []).forEach(i => {
          let amount = i.amount || "";
          if (amount) {
            const match = amount.match(/^([\d.,]+)\s*(.*)$/);
            if (match) {
              let qty = parseFloat(match[1].replace(",", ".")) * multiplier;
              qty = Math.round((qty + Number.EPSILON) * 100) / 100;
              amount = `${qty} ${match[2]}`.trim();
            }
          }
          ingredientsList.push(`${i.item}${amount ? " – " + amount : ""}`);
        });
      });
  
      navigator.clipboard.writeText(ingredientsList.join("\n")).then(() => {
        copyBtn.textContent = "Gekopieerd!";
        setTimeout(() => {
          copyBtn.textContent = "";
          copyBtn.appendChild(copyIcon);
          copyBtn.appendChild(document.createTextNode("Kopiëren"));
        }, 1500);
      }).catch(err => {
        console.error("Kon niet kopiëren:", err);
        showToast("Kon niet kopiëren", "#ff4d4d");
      });
    });
  
    titleContainer.appendChild(title);
    titleContainer.appendChild(copyBtn);
    popup.appendChild(titleContainer);
  
    // Sluitknop rechtsboven
    const closeX = document.createElement("div");
    closeX.textContent = "✕";
    closeX.style = `
      position:absolute; top:12px; right:15px;
      font-size:1.3rem; cursor:pointer; color:#333;
    `;
    closeX.addEventListener("click", () => overlay.remove());
    popup.appendChild(closeX);
  
    // Ingrediëntenlijst
    const list = document.createElement("ul");
    list.style = `
      list-style:none; padding:0; margin:0;
      display:flex; flex-direction:column; gap:10px;
    `;
  
    const ingredientsMap = {};
    (saved.menu || []).forEach(recipe => {
      const multiplier = recipe.persons || 1;
      (recipe.ingredients || []).forEach(i => {
        const key = i.item.trim();
        let amount = i.amount || "";
        if (amount) {
          const match = amount.match(/^([\d.,]+)\s*(.*)$/);
          if (match) {
            let qty = parseFloat(match[1].replace(",", ".")) * multiplier;
            qty = Math.round((qty + Number.EPSILON) * 100) / 100;
            amount = `${qty} ${match[2]}`.trim();
          }
        }
        if (!ingredientsMap[key]) ingredientsMap[key] = [];
        if (amount) ingredientsMap[key].push(amount);
      });
    });
  
    Object.keys(ingredientsMap).forEach(item => {
      const li = document.createElement("li");
      li.style = `
        background:#fff; padding:12px 15px; border-radius:10px;
        box-shadow:0 2px 5px rgba(0,0,0,0.15);
        display:flex; align-items:center; gap:12px;
      `;
  
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.style.width = "18px";
      checkbox.style.height = "18px";
      checkbox.style.cursor = "pointer";
  
      const textWrapper = document.createElement("div");
      textWrapper.style = `
        display:flex;
        flex-wrap: wrap;          
        justify-content: space-between;
        width:100%;
        align-items:center;
        gap: 5px;
      `;

  
      const left = document.createElement("span");
      left.textContent = item;
  
      const right = document.createElement("span");
      right.textContent = ingredientsMap[item].join(" + ");
      right.style = "font-weight:600; white-space:nowrap; margin-left:10px; color:#444;";
  
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          left.style.textDecoration = "line-through";
          right.style.textDecoration = "line-through";
          left.style.opacity = "0.6";
          right.style.opacity = "0.6";
        } else {
          left.style.textDecoration = "none";
          right.style.textDecoration = "none";
          left.style.opacity = "1";
          right.style.opacity = "1";
        }
      });
  
      textWrapper.appendChild(left);
      textWrapper.appendChild(right);
      li.appendChild(checkbox);
      li.appendChild(textWrapper);
      list.appendChild(li);
    });
  
    popup.appendChild(list);
  
    // Sluitknop onderaan
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Sluiten";
    closeBtn.style = `
      margin-top:20px; 
      padding:1rem 1.5rem; 
      font-size: 1.1rem; 
      width: 100%;

      border:none; border-radius:10px;
      background:linear-gradient(90deg,#ff7f50,#ffb347);
      color:white; cursor:pointer;
    `;
    closeBtn.addEventListener("click", () => overlay.remove());
    popup.appendChild(closeBtn);
  
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
  
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
  }
  
  

  // Hamburgermenu (Onveranderd)
  const hamburger = document.getElementById('hamburger-btn');
  const sidebarNav = document.querySelector('.sidebar-nav');
  const body = document.body; 

  if (hamburger && sidebarNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      sidebarNav.classList.toggle('open');
      body.classList.toggle('menu-open'); 
    });
  }

  // Opslaan nieuw menu (Hulplogica)
  async function saveNewMenu(newMenu) {
    try {
      const res = await fetch("/api/savedmenus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newMenu)
      });
      if (!res.ok) throw new Error("Kon weekmenu niet opslaan");
      loadSavedMenus();
    } catch (err) {
      console.error("Fout bij opslaan:", err);
      showToast("Kon weekmenu niet opslaan", "#ff4d4d");
    }
  }
});