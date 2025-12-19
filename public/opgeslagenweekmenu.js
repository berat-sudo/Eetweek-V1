document.addEventListener("DOMContentLoaded", () => {

  /* ============================
     GLOBALE HULPDEFINITIES (Onveranderd)
  ============================ */
  const dummyLogo = "/Fotos/logo_.png";
  const greenGradient = 'linear-gradient(90deg, #32cd32, #7fff00)'; 
  const orangeGradient = 'linear-gradient(90deg,#ff7f50,#ffb347)'; 
  const blueGradient = 'linear-gradient(90deg, #4682B4, #5f9ea0)'; 
  const copyIconPath = "/Fotos/copyicon.png"; 

  const days = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];
  
  const isMobileGlobal = window.innerWidth <= 600; 

  // Helper voor toast/meldingen (Onveranderd)
// GECORRIGEERDE Helper voor toast/meldingen (Nu met de hoogste z-index)
function showToast(msg, color = greenGradient) {
  let toast = document.getElementById("toast");
  const isGradient = color.includes('gradient');
  const isMobileView = window.innerWidth <= 600;

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.position = "fixed";
    toast.style.bottom = "30px"; // Iets hoger vanaf de bodem
    toast.style.left = "50%"; 
    toast.style.right = "auto";
    
    toast.style.padding = "0.75rem 1.5rem";
    toast.style.color = "#fff";
    toast.style.borderRadius = "12px";
    toast.style.boxShadow = "0 8px 20px rgba(0,0,0,0.4)";
    toast.style.textAlign = "center";
    toast.style.fontSize = "1rem";
    toast.style.fontWeight = "bold";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    
    // 🔑 CRUCIALE FIX: Hoger dan de boodschappenlijst-popup (999999)
    toast.style.zIndex = "1000000"; 
    
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
      toast.style.width = "85%";
      toast.style.maxWidth = "none";
  } else {
      toast.style.width = "auto";
      toast.style.maxWidth = "400px"; 
  }

  // Startpositie voor animatie (onder de rand)
  toast.style.transform = "translate(-50%, 40px)"; 

  // Toon de toast met een kleine delay voor de animatie
  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translate(-50%, 0)";
  }, 10);

  // Verberg de toast na 2,5 seconden
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translate(-50%, 40px)";
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

    // Container voor actieknoppen onderaan
    const actionContainer = document.createElement("div");
    actionContainer.style = "display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;";

    // Boodschappenlijst knop (Onveranderd)
    const listBtn = document.createElement("button");
    listBtn.style = `
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
    actionContainer.appendChild(listBtn);

    // NIEUW: Agenda knop
    const agendaBtn = document.createElement("button");
    agendaBtn.style = `
      padding: 0.3rem 0.7rem;
      font-size: 0.85rem;
      border-radius: 8px;
      background: ${blueGradient};
      border: none;
      color: white;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
    `;
    const agendaIcon = document.createElement("img");
    agendaIcon.src = "/Fotos/agendaiconwit.png"; // Zorg dat dit bestand bestaat of gebruik emoji
    agendaIcon.alt = "📅";
    agendaIcon.style.width = "16px";
    agendaIcon.style.height = "16px";
    const agendaText = document.createTextNode("Inplannen");
    agendaBtn.appendChild(agendaIcon);
    agendaBtn.appendChild(agendaText);
    agendaBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openAgendaPlanner(saved);
    });
    actionContainer.appendChild(agendaBtn);

    kaft.appendChild(actionContainer);

    // Klik op kaft → weekmenu-popup (Onveranderd)
    kaft.addEventListener("click", () => showMenuPopup(saved));

    container.appendChild(kaft);
  }

  // NIEUW: Functie om agenda planner te openen via localStorage
// HERSTELDE FUNCTIE: Opent de inplan-popup
function openAgendaPlanner(saved) {
  const overlay = document.createElement("div");
  overlay.style = `
    position:fixed; top:0; left:0; width:100%; height:100%;
    background:rgba(0,0,0,0.8); display:flex; 
    justify-content:center; align-items:center; z-index:2000; padding:10px;
  `;

  const popup = document.createElement("div");
  popup.style = `
    background:white; padding:25px; border-radius:15px;
    max-width:500px; width:95%; box-shadow:0 10px 30px rgba(0,0,0,0.5);
    text-align:center;
  `;

  popup.innerHTML = `
    <h2 style="margin-bottom:15px;">Inplannen in Agenda</h2>
    <p style="margin-bottom:20px; color:#555;">Vanaf welke dag wil je dit weekmenu ("${saved.name}") inplannen in je agenda?</p>
    <input type="date" id="start-date" style="
      padding:12px; width:100%; border-radius:10px; border:1px solid #ccc; 
      font-size:1rem; margin-bottom:20px;
    ">
    <div style="display:flex; gap:10px;">
      <button id="cancel-plan" style="flex:1; padding:12px; border:none; border-radius:10px; background:#ccc; cursor:pointer;">Annuleren</button>
      <button id="confirm-plan" style="flex:1; padding:12px; border:none; border-radius:10px; background:${greenGradient}; color:white; font-weight:bold; cursor:pointer;">Nu inplannen</button>
    </div>
  `;

  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  // Zet standaard datum op vandaag
  const dateInput = popup.querySelector("#start-date");
  dateInput.valueAsDate = new Date();

  popup.querySelector("#cancel-plan").onclick = () => overlay.remove();

  popup.querySelector("#confirm-plan").onclick = async () => {
    const startDateStr = dateInput.value;
    if (!startDateStr) return alert("Kies een startdatum");

    const confirmBtn = popup.querySelector("#confirm-plan");
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Bezig...";

    try {
      // 1. Haal de huidige agenda op van de server
      const resLoad = await fetch("/api/agenda/load");
      const data = await resLoad.json();
      let currentMeals = data.meals || {};

      // 2. Bereken de datums en voeg recepten toe
      let currentStartDate = new Date(startDateStr);
      
      saved.menu.forEach((item) => {
        if (item && item.name) {
          const dateKey = currentStartDate.toISOString().split('T')[0];
          if (!currentMeals[dateKey]) currentMeals[dateKey] = [];
          
          // Voeg toe aan de lijst voor die dag
          currentMeals[dateKey].push({
            name: item.name,
            type: "Diner", // Standaard als diner
            recipeId: item._id || item.recipeId 
          });
        }
        // Verspring naar de volgende dag voor het volgende recept in het weekmenu
        currentStartDate.setDate(currentStartDate.getDate() + 1);
      });

      // 3. Opslaan naar de server (dit synchroniseert ook direct met je partner/groep!)
      const resSave = await fetch("/api/agenda/save", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meals: currentMeals })
      });

      if (resSave.ok) {
        showToast("Weekmenu succesvol in je agenda geplaatst!", greenGradient);
        setTimeout(() => {
           window.location.href = "/agenda.html"; // Ga naar de agenda om het resultaat te zien
        }, 1500);
      } else {
        throw new Error("Opslaan mislukt");
      }

    } catch (err) {
      console.error(err);
      alert("Er ging iets mis bij het inplannen.");
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Nu inplannen";
    }
  };
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
// Recept-popup (showRecipeDetails) - FOTO RADIUS EDIT
// ==========================================================
function showRecipeDetails(recipe) {
  const isMobile = window.innerWidth <= 600;

  // 🎨 Gradient instellingen
  const fadeStart = isMobile ? '350px' : '450px';
  const fadeEnd = isMobile ? '440px' : '550px';
  const bgHeight = isMobile ? '600px' : '500px';

  // 1. Voeg de animaties toe aan de head als ze er nog niet zijn
  if (!document.getElementById('popup-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'popup-animation-styles';
      style.innerHTML = `
          @keyframes slideInUpFull {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
          }
          @keyframes slideOutDownFull {
              from { transform: translateY(0); }
              to { transform: translateY(100%); }
          }
          .popup-animate-in { animation: slideInUpFull 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
          .popup-animate-out { animation: slideOutDownFull 0.3s cubic-bezier(0.5, 0, 0.75, 0) forwards; }
          .overlay-fade-in { opacity: 1 !important; transition: opacity 0.3s ease; }
          .overlay-fade-out { opacity: 0 !important; transition: opacity 0.3s ease; }
      `;
      document.head.appendChild(style);
  }

  const overlay = document.createElement("div");
  overlay.classList.add("overlay");

  overlay.style.cssText = `
      position: fixed; 
      top: 0; 
      left: 0; 
      right: 0; 
      bottom: 0;
      width: 100%; 
      height: 100%;
      background: rgba(0,0,0,0); 
      display: flex; 
      justify-content: center;
      align-items: ${isMobile ? 'flex-start' : 'center'}; 
      z-index: 10001; 
      padding: ${isMobile ? '0' : '10px'};
      margin: 0;
      opacity: 0;
  `;

  setTimeout(() => overlay.classList.add('overlay-fade-in'), 10);

  if (recipe.persons === undefined) recipe.persons = 1;
  let persons = recipe.persons;

  // --- Helper functies ---
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
      return `<li style="color: #f2f2f2;">${i.item} – ${qty}</li>`;
    }).join("");
    
  const getInstructionsHTML = () => {
      let instructions = recipe.instructions;
      if (Array.isArray(instructions) && instructions.length > 0) {
          const stepsHtml = instructions.map(step => 
              `<div style="margin-bottom: 12px; padding: 8px 10px; background: #36485b; border-left: 3px solid #ff7f50; color: #f2f2f2; border-radius: 4px; line-height: 1.4;">${step}</div>`
          ).join('');
          return `<div style="padding: 5px 0;">${stepsHtml}</div>`;
      }
      return typeof instructions === 'string' && instructions.trim() !== '' ? `<p style="color: #f2f2f2;">${instructions}</p>` : `<p style="color: #f2f2f2;">Geen bereidingswijze beschikbaar.</p>`;
  };

  const getMacrosAndControlsHTML = () => {
      const macros = recipe.macros || {};
      const time = recipe.duration || 0;
      return `
          <div class="recipe-info-bar" style="position:relative; z-index:2; color: #f2f2f2;">
              <div class="info-block macros-block">
                  <h4 style="margin-top:0; margin-bottom: 0.5rem; font-size:1rem; color: #f2f2f2;">Voedingswaarden p.p.</h4>
                  <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
                      <span class="protein">Eiwit: <strong style="color: #f2f2f2;">${(macros.protein || 0).toFixed(1)}g</strong></span>
                      <span class="carbs">Koolh.: <strong style="color: #f2f2f2;">${(macros.carbs || 0).toFixed(1)}g</strong></span>
                      <span class="fat">Vet: <strong style="color: #f2f2f2;">${(macros.fat || 0).toFixed(1)}g</strong></span>
                  </div>
              </div>
              <div class="info-block time-block">
                  <h4 style="margin-top:0; margin-bottom: 0.5rem; font-size:1rem; color: #f2f2f2;">Tijd</h4>
                  <p class="time-value" style="margin:0; font-size:1.1rem; font-weight:bold; color: #f2f2f2;">⏱ ${time} min</p>
              </div>
              <div class="info-block persons-block">
                  <h4 style="margin-top:0; margin-bottom: 0.5rem; font-size:1rem; color: #f2f2f2;">Personen</h4>
                  <div class="persons-controls" style="display:flex; justify-content:center; align-items:center; gap:8px;">
                      <button id="decrement-persons" style="width:30px; height:30px; border-radius:50%; border:1px solid #ccc; cursor:pointer; font-size:1.2rem; font-weight:bold;">-</button>
                      <span id="persons-count" style="font-size:1.1rem; font-weight:bold; color: #f2f2f2;">${persons}</span>
                      <button id="increment-persons" style="width:30px; height:30px; border-radius:50%; border:1px solid #ccc; cursor:pointer; font-size:1.2rem; font-weight:bold;">+</button>
                  </div>
              </div>
          </div>`;
  };
  
  let chefBlockHTML = (recipe.chef && recipe.chef.toLowerCase() !== 'admin') ? `<div class="info-block chef-block" style="position:relative; z-index:2; background: #36485b; padding: 15px 10px; border-radius: 10px; margin: 20px 0; text-align: center; border: 1px solid #4a5d71;"><h4 style="margin:0; font-size:1rem; color:#f2f2f2;">Chef</h4><p style="margin:5px 0 0; font-size:1.1rem; font-weight:bold; color:#ff7f50;">${recipe.chef.trim()}</p></div>` : '';

  overlay.innerHTML = `
    <div id="recipe-popup-content" class="popup popup-animate-in" style="
      background: #1f2a36; 
      padding: ${isMobile ? '20px 15px 0px' : '1rem'}; 
      border-radius: ${isMobile ? '0' : '15px'};
      max-width: ${isMobile ? '100%' : '600px'}; 
      width: 100%; 
      height: ${isMobile ? '100%' : 'auto'};
      max-height: ${isMobile ? '100%' : '85%'}; 
      overflow-y: auto;
      overflow-x: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3); 
      font-family: Arial, sans-serif;
      box-sizing: border-box;
      position: relative;
    ">
      <div style="position: absolute; top: 0; left: 0; right: 0; height: ${bgHeight}; background-image: url('${recipe.image || dummyLogo}'); background-size: cover; background-position: center; filter: blur(18px) brightness(0.35); transform: scale(1.1); z-index: 0;"></div>
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to bottom, rgba(31, 42, 54, 0.0) 0%, 
                rgba(31, 42, 54, 0.0) ${fadeStart}, 
                rgba(31, 42, 54, 1) ${fadeEnd}, 
                rgba(31, 42, 54, 1) 100%); z-index: 1;"></div>
      
      <div class="top-action-bar" style="position:relative; z-index:2; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; width: 100%;">
          <div id="popup-close-top" style="cursor: pointer; display: flex; align-items: center; justify-content: center;">
              <img src="/Fotos/arrow-down-sign-to-navigate.png" style="width: 25px; height: 25px;">
          </div>
          <span></span>
          <div id="popup-menu-top" style="cursor: pointer; display: flex; align-items: center; justify-content: center;">
              <img src="/Fotos/more.png" style="width: 25px; height: 25px;">
          </div>
      </div>

      <div style="position:relative; z-index:2; margin-bottom:5px;"> 
          <img src="${recipe.image || dummyLogo}" alt="${recipe.name}" 
               style="width:100%; border-radius: 8px; display:block;">
      </div>

      <h2 style="position:relative; z-index:2; margin-top: 15px; margin-bottom: 20px; text-align: center; color: #f2f2f2;">${recipe.name}</h2>
      
      ${getMacrosAndControlsHTML()} 
      
      <h4 style="position:relative; z-index:2; margin: 20px 0 10px; border-bottom:1px solid #4a5d71; padding-bottom:5px; color: #f2f2f2;">Ingrediënten:</h4>
      <ul class="ingredients-list" style="position:relative; z-index:2; margin-bottom:20px; color: #f2f2f2;">${getIngredientsHTML()}</ul>
      
      <h4 style="position:relative; z-index:2; margin-bottom:10px; border-bottom:1px solid #4a5d71; padding-bottom:5px; color: #f2f2f2;">Bereidingswijze:</h4>
      <div class="instructions-container" style="position:relative; z-index:2; margin-bottom:20px; color: #f2f2f2;">
          ${getInstructionsHTML()} 
      </div>
      
      ${chefBlockHTML} 
    </div>
  `;

  document.body.appendChild(overlay);

  const closePopup = () => {
      const popup = overlay.querySelector('.popup');
      overlay.classList.replace('overlay-fade-in', 'overlay-fade-out');
      popup.classList.replace('popup-animate-in', 'popup-animate-out');
      setTimeout(() => overlay.remove(), 350);
  };

  const openActionSheet = () => {
      const sheetOverlay = document.createElement("div");
      sheetOverlay.classList.add("action-sheet-overlay");
      sheetOverlay.innerHTML = `
          <div class="action-sheet">
              <div style="width: 40px; height: 5px; background: white; border-radius: 5px; margin: 0 auto 15px; opacity: 0.8;"></div>
              <button class="action-menu-item" id="action-copy"><img src="/Fotos/copyicon.png"> Ingrediënten kopiëren</button>
              <button class="action-menu-item" id="action-close" style="color: #ff7f50; margin-top: 10px; justify-content: center; font-weight: bold; border: none;">Annuleren</button>
          </div>
      `;
      document.body.appendChild(sheetOverlay);
      setTimeout(() => sheetOverlay.querySelector('.action-sheet').classList.add('open'), 10);

      const closeSheet = () => {
          sheetOverlay.querySelector('.action-sheet').classList.remove('open');
          setTimeout(() => sheetOverlay.remove(), 300);
      };

      sheetOverlay.querySelector("#action-copy").onclick = async () => {
          await navigator.clipboard.writeText(getIngredientsTextToCopy()); 
          showToast("Ingrediënten gekopieerd!", greenGradient);
          closeSheet();
      };
      sheetOverlay.querySelector("#action-close").onclick = closeSheet;
      sheetOverlay.onclick = (e) => { if(e.target === sheetOverlay) closeSheet(); };
  };

  overlay.querySelector("#popup-close-top").onclick = closePopup;
  overlay.querySelector("#popup-menu-top").onclick = (e) => {
      e.stopPropagation();
      openActionSheet();
  };

  const updateUI = () => {
      overlay.querySelector("#persons-count").textContent = persons;
      overlay.querySelector(".ingredients-list").innerHTML = getIngredientsHTML();
      recipe.persons = persons; 
  };

  overlay.querySelector("#decrement-persons").onclick = () => { if (persons > 1) { persons--; updateUI(); } };
  overlay.querySelector("#increment-persons").onclick = () => { persons++; updateUI(); };
  overlay.onclick = (e) => { if (e.target === overlay) closePopup(); };
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