document.addEventListener("DOMContentLoaded", () => {
  // ===================== Gebruikersnaam laden =====================
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

  // ===================== Opgeslagen weekmenu's =====================
  const container = document.getElementById("saved-menus-container");
  if (!container) return;
  const days = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];

  async function loadSavedMenus() {
    try {
      const res = await fetch("/api/savedmenus", { credentials: "include" });
      if (!res.ok) throw new Error("Kon weekmenu's niet ophalen");
      const savedMenus = await res.json();

      container.innerHTML = "";
      if (!Array.isArray(savedMenus) || savedMenus.length === 0) {
        container.innerHTML = "<p>Hier komen je opgeslagen weekmenu's te staan.</p>";
        return;
      }

      savedMenus.forEach((saved) => addSavedMenuToDOM(saved));
    } catch (err) {
      console.error("Fout bij laden weekmenu's:", err);
      container.innerHTML = "<p>Kon weekmenu's niet laden.</p>";
    }
  }

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
      if (recipe.persons === undefined) recipe.persons = 1;
      const span = document.createElement("span");
      span.textContent = recipe?.name || "-";
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

    // Prullenbakje
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
      } catch (err) {
        console.error("Fout bij verwijderen:", err);
        alert("Kon weekmenu niet verwijderen");
      }
    });
    kaft.appendChild(trash);

    // Boodschappenlijst knop **onder de gerechten**
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

    // Klik op kaft → weekmenu-popup
    kaft.addEventListener("click", () => showMenuPopup(saved));

    container.appendChild(kaft);
  }

  loadSavedMenus();

  // ===================== Weekmenu-popup =====================
  function showMenuPopup(saved) {
    const overlay = document.createElement("div");
    overlay.style = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.6); display:flex;
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
      if (recipe) {
        card.addEventListener("mouseenter", () => card.style.transform = "scale(1.05)");
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
      recipeName.style.color = recipe ? "#ff7f50" : "#999";
      card.appendChild(recipeName);

      grid.appendChild(card);
    });

    popup.appendChild(grid);

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Sluiten";
    closeBtn.style = `
      margin-top:15px; padding:0.5rem 1rem; border:none; border-radius:10px;
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

  // ===================== Recept-popup =====================
  function showRecipeDetails(recipe) {
    const overlay = document.createElement("div");
    overlay.style = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.6); display:flex;
      justify-content:center; align-items:center; z-index:1001; padding:10px;
    `;

    if (recipe.persons === undefined) recipe.persons = 1;
    let persons = recipe.persons;

    const getIngredientsHTML = () =>
      (recipe.ingredients || []).map(i => {
        if (!i.amount) return `<li>${i.item}</li>`;
        const match = i.amount.match(/^([\d.,]+)\s*(.*)$/);
        let qty = i.amount;
        if (match) qty = parseFloat(match[1].replace(",", ".")) * persons + " " + (match[2] || "");
        return `<li>${i.item} – ${qty}</li>`;
      }).join("");

    const getMacrosHTML = () => {
      if (!recipe.macros) return "";
      return `
        <span style="color:#ff6347; font-weight:bold;">Eiwitten: ${recipe.macros.protein * persons} g</span> |
        <span style="color:#4682b4; font-weight:bold;">Koolhydraten: ${recipe.macros.carbs * persons} g</span> |
        <span style="color:#32cd32; font-weight:bold;">Vetten: ${recipe.macros.fat * persons} g</span>
      `;
    };

    overlay.innerHTML = `
      <div style="
        background:white; padding:25px; border-radius:15px;
        max-width:550px; width:90%; max-height:85%; overflow-y:auto;
        box-shadow:0 10px 30px rgba(0,0,0,0.3); font-family:Arial,sans-serif;
      ">
        <h2 style="margin-bottom:15px;">${recipe.name}</h2>
        <img src="${recipe.image || '/Fotos/logo_.png'}" alt="${recipe.name}" style="width:100%; border-radius:10px; margin-bottom:15px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
          <span style="font-style:italic;">⏱ ${recipe.duration || 0} min</span>
          <span class="macros">${getMacrosHTML()}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
          <label style="font-weight:bold;">Aantal personen:</label>
          <input type="number" id="persons" min="1" value="${persons}" style="width:60px; padding:3px; border-radius:5px; border:1px solid #ccc;">
        </div>
        <h4 style="margin-bottom:10px; border-bottom:1px solid #ddd; padding-bottom:5px;">Ingrediënten:</h4>
        <ul class="ingredients-list" style="margin-bottom:20px;">${getIngredientsHTML()}</ul>
        <h4 style="margin-bottom:10px; border-bottom:1px solid #ddd; padding-bottom:5px;">Bereidingswijze:</h4>
        <p style="margin-bottom:20px;">${recipe.instructions || "Geen bereidingswijze beschikbaar"}</p>
        <button id="close-recipe" style="padding:0.5rem 1rem; border:none; border-radius:10px; background:linear-gradient(90deg,#ff7f50,#ffb347); color:white; cursor:pointer;">Sluiten</button>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector("#persons").addEventListener("input", e => {
      persons = parseInt(e.target.value) || 1;
      recipe.persons = persons;
      overlay.querySelector("ul.ingredients-list").innerHTML = getIngredientsHTML();
      overlay.querySelector(".macros").innerHTML = getMacrosHTML();
    });

    overlay.querySelector("#close-recipe").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
  }

  // ===================== Boodschappenlijst-popup (overlay) =====================
  function showShoppingList(saved) {
    // Verwijder oude popups
    document.querySelectorAll(".force-popup-overlay").forEach(el => el.remove());
  
    // Overlay
    const overlay = document.createElement("div");
    overlay.className = "force-popup-overlay";
    overlay.style = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.6);
      display:flex; justify-content:center; align-items:center;
      z-index:999999; padding:20px;
    `;
  
    // Popup
    const popup = document.createElement("div");
    popup.style = `
      background:white; padding:25px; border-radius:18px;
      max-width:500px; width:95%;
      max-height:80%; overflow-y:auto;
      box-shadow:0 10px 30px rgba(0,0,0,0.30);
      position:relative; z-index:1000000;
    `;
  
    // Titel + Kopieerknop container
    const titleContainer = document.createElement("div");
    titleContainer.style = `
  display:flex;
  flex-wrap: wrap;         /* Laat items naar nieuwe regel gaan als nodig */
  justify-content: space-between;
  align-items: center;
  gap: 10px;               /* Ruimte tussen titel en knop op klein scherm */
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
    copyIcon.src = "/Fotos/winkelmandjeicon.png"; // Pas aan naar jouw icoon
    copyIcon.alt = "Kopiëren";
    copyIcon.style.width = "16px";
    copyIcon.style.height = "16px";
  
    copyBtn.appendChild(copyIcon);
    copyBtn.appendChild(document.createTextNode("Kopiëren"));
  
    // Functionaliteit kopiëren
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
        alert("Kon niet kopiëren");
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
  flex-wrap: wrap;          /* Laat ingredient + hoeveelheid op nieuwe regel bij kleine schermen */
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
      margin-top:20px; padding:10px 20px;
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
  
  

  // ===================== Hamburgermenu =====================
  const hamburger = document.getElementById('hamburger-btn');
  const sidebarNav = document.querySelector('.sidebar-nav');

  if (hamburger && sidebarNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      sidebarNav.classList.toggle('open');
    });
  }

  // ===================== Opslaan nieuw menu =====================
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
      alert("Kon weekmenu niet opslaan");
    }
  }
});
