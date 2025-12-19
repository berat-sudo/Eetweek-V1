document.addEventListener("DOMContentLoaded", () => {

  /* ============================
     GLOBALE HULPDEFINITIES
  ============================ */
  const recipesContainer = document.getElementById("added-recipes-container");
  const dummyLogo = "/Fotos/logo_.png";
  
  // 🔑 DEFINIEER HIER DE GROENE GRADIËNT DIE U WILT GEBRUIKEN
  const greenGradient = 'linear-gradient(90deg, #32cd32, #7fff00)'; 
  const orangeGradient = 'linear-gradient(90deg,#ff7f50,#ffb347)'; // Voor consistentie gedefinieerd
  
  const copyIconPath = "/Fotos/copyicon.png"; // Pad naar kopieer icoon
  // 🔑 AANGEPAST: Pad naar het camera-icoon (zoals eerder gedefinieerd)
  const cameraIconPath = "/Fotos/addiconblack.png"; 


  /* ============================
     GEBRUIKERSNAAM LADEN
  ============================ */
  const userNameSidebarEl = document.getElementById("user-name-sidebar");
  const profileCircleEl = document.getElementById("profile-circle");

  async function loadUserName() {
    try {
      const res = await fetch("/api/user");
      if (!res.ok) return;

      const data = await res.json();
      userNameSidebarEl.textContent = data.name; 
      profileCircleEl.textContent = data.name.charAt(0).toUpperCase(); 
    } catch (err) {
      console.error("Fout bij laden gebruikersnaam:", err);
    }
  }

  loadUserName();


  /* ============================
     HELPER FUNCTIES VOOR RECEPTEN
  ============================ */

  // 🔑 AANGEPAST: Afbeelding HTML moet nu de container zijn, NIET de img tag zelf.
  function getImageHTML(recipe) {
    if (recipe.image && recipe.image.trim() !== "") {
      return `<img src="${recipe.image}" alt="${recipe.name}" class="recipe-image">`;
    }
    return `<div class="placeholder-image"><img src="${dummyLogo}" alt="Logo"></div>`;
  }
  
  /**
   * Genereert de HTML-string voor dieetgerelateerde tags (alleen Vegetarisch, Vegan, Glutenvrij) met nieuwe stijl.
   */
  function getDietTagsHtml(recipe) {
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

  // GECORRIGEERDE Helper voor toast/meldingen
// GECORRIGEERDE Helper voor toast/meldingen (nu met hogere z-index)
function showToast(msg, color = greenGradient) {
  let toast = document.getElementById("toast");
  const isGradient = color.includes('gradient');
  const isMobileView = window.innerWidth <= 600;

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.position = "fixed";
    toast.style.bottom = "30px"; // Iets hoger voor betere zichtbaarheid
    toast.style.left = "50%";
    
    toast.style.padding = "0.75rem 1.5rem";
    toast.style.color = "#fff";
    toast.style.borderRadius = "12px"; // Iets ronder voor moderne look
    toast.style.boxShadow = "0 8px 16px rgba(0,0,0,0.4)";
    toast.style.textAlign = "center";
    toast.style.fontSize = "1rem";
    toast.style.fontWeight = "bold";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    
    // 🔑 CRUCIALE FIX: Hoger dan de pop-up (999999)
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

  // Beginpositie voor animatie
  toast.style.transform = "translate(-50%, 40px)"; 

  // Toon toast
  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translate(-50%, 0)";
  }, 10);

  // Verberg toast na 2,5 seconden
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translate(-50%, 40px)";
  }, 2500);
}
  
  // Helper voor e-mail prompt (blijft hetzelfde)
  function showEmailPromptToast(message, placeholder = "", callback) {
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    overlay.style.background = "rgba(0,0,0,0.5)";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "1000";

    overlay.innerHTML = `
      <div style="
          background:#fff; 
          padding:1.5rem; 
          border-radius:12px; 
          max-width:350px; 
          width:90%;
          box-shadow:0 4px 12px rgba(0,0,0,0.2);
          text-align:center;
      ">
        <p style="margin-bottom:1rem; font-weight:bold;">${message}</p>
        <input type="email" placeholder="${placeholder}" style="
            width:100%; 
            padding:0.5rem; 
            border:1px solid #ccc; 
            border-radius:8px; 
            margin-bottom:1rem;
        ">
        <div style="display:flex; justify-content:space-between;">
          <button style="
              padding:0.5rem 1rem; 
              border:none; 
              border-radius:8px; 
              background:#4caf50; 
              color:white;
              font-weight:bold;
              cursor:pointer;
          ">Verstuur</button>
          <button style="
              padding:0.5rem 1rem; 
              border:none; 
              border-radius:8px; 
              background:#ff4d4d; 
              color:white;
              font-weight:bold;
              cursor:pointer;
          ">Annuleer</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const input = overlay.querySelector("input");
    const sendBtn = overlay.querySelector("button:first-of-type");
    const cancelBtn = overlay.querySelector("button:last-of-type");

    sendBtn.addEventListener("click", () => {
      const value = input.value.trim();
      if (value) callback(value);
      overlay.remove();
    });

    cancelBtn.addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });

    input.focus();
  }


/* ============================
     RECEPT DETAILS POPUP (showRecipeDetails)
  ============================ */
  function showRecipeDetails(day, recipe) {
    const isMobile = window.innerWidth <= 600;

    // 🔑 De gradient instellingen (hetzelfde als je andere pagina)
    const fadeStart = isMobile ? '350px' : '450px';
    const fadeEnd = isMobile ? '400px' : '490px';
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
        background: rgba(0,0,0,0.8); 
        display: flex; 
        justify-content: center;
        align-items: ${isMobile ? 'flex-start' : 'center'}; 
        z-index: 999999; 
        padding: ${isMobile ? '0' : '20px'};
        margin: 0;
        opacity: 0;
    `;

    setTimeout(() => overlay.classList.add('overlay-fade-in'), 10);

    let persons = recipe.persons || 1;
    const greenGradient = 'linear-gradient(90deg, #32cd32, #7fff00)'; 
    const dummyLogo = "/Fotos/logo_.png";
    
    // --- Helper functies ---
    const getIngredientsTextToCopy = () => {
        let text = `--- Ingrediënten voor ${recipe.name} (${persons} porties) ---\n`;
        recipe.ingredients.forEach(i => {
            if (!i.baseAmount) i.baseAmount = i.amount;
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
    
    recipe.ingredients.forEach(i => { if (!i.baseAmount) i.baseAmount = i.amount; });

    const getIngredientsHTML = () =>
      recipe.ingredients.map(i => {
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

    const getMacrosHTML = () => {
        const macros = recipe.macros || {};
        const time = recipe.duration || 0;
        return `
            <div class="recipe-info-bar">
                <div class="info-block macros-block">
                    <h4 style="margin-top:0; margin-bottom: 0.5rem; font-size:1rem;">Voedingswaarden p.p.</h4>
                    <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
                        <span class="protein">Eiwit: <strong>${(macros.protein || 0).toFixed(1)}g</strong></span>
                        <span class="carbs">Koolh.: <strong>${(macros.carbs || 0).toFixed(1)}g</strong></span>
                        <span class="fat">Vet: <strong>${(macros.fat || 0).toFixed(1)}g</strong></span>
                    </div>
                </div>
                <div class="info-block time-block">
                    <h4 style="margin-top:0; margin-bottom: 0.5rem; font-size:1rem;">Tijd</h4>
                    <p class="time-value" style="margin:0; font-size:1.1rem; font-weight:bold; color: #f2f2f2;">⏱ ${time} min</p>
                </div>
                <div class="info-block persons-block">
                    <h4 style="margin-top:0; margin-bottom: 0.5rem; font-size:1rem;">Personen</h4>
                    <div class="persons-controls" style="display:flex; justify-content:center; align-items:center; gap:8px;">
                        <button id="decrement-persons" style="width:30px; height:30px; border-radius:50%; border:1px solid #ccc; cursor:pointer; font-size:1.2rem; font-weight:bold;">-</button>
                        <span id="persons-count" style="font-size:1.1rem; font-weight:bold; color: #f2f2f2;">${persons}</span>
                        <button id="increment-persons" style="width:30px; height:30px; border-radius:50%; border:1px solid #ccc; cursor:pointer; font-size:1.2rem; font-weight:bold;">+</button>
                    </div>
                </div>
            </div>`;
    };

    overlay.innerHTML = `
      <div class="popup popup-animate-in" style="
        width: 100%;
        max-width: ${isMobile ? '100%' : '500px'}; 
        height: ${isMobile ? '100%' : 'auto'}; 
        max-height: ${isMobile ? '100%' : '85%'}; 
        border-radius: ${isMobile ? '0' : '15px'}; 
        position: relative; 
        background: #1f2a36; 
        color: white;
        padding: ${isMobile ? '20px 15px 0px' : '1rem'}; 
        overflow-y: auto;
        overflow-x: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3); 
        font-family: Arial, sans-serif;
        box-sizing: border-box;
        margin: 0;
      ">
        <div style="
            position: absolute;
            top: 0; left: 0; right: 0; height: ${bgHeight};
            background-image: url('${recipe.image || dummyLogo}');
            background-size: cover;
            background-position: center;
            filter: blur(18px) brightness(0.35);
            transform: scale(1.1);
            z-index: 0;
        "></div>

        <div style="
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(to bottom, 
                rgba(31, 42, 54, 0.0) 0%, 
                rgba(31, 42, 54, 0.0) ${fadeStart}, 
                rgba(31, 42, 54, 1) ${fadeEnd}, 
                rgba(31, 42, 54, 1) 100%
            );
            z-index: 1;
        "></div>

        <div style="position: relative; z-index: 2;">
            <div class="top-action-bar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; width: 100%;">
                <div id="popup-close-top" style="width: 35px; height: 35px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                    <img src="/Fotos/arrow-down-sign-to-navigate.png" style="width: 25px; height: 25px;">
                </div>
                <p style="margin: 0; font-weight: bold; color: #888;">${day ? day : ""}</p>
                <div id="popup-menu-top" style="width: 35px; height: 35px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                    <img src="/Fotos/more.png" style="width: 25px; height: 25px;">
                </div>
            </div>

            <div class="image-container" style="position:relative; width:100%;">
                <img src="${recipe.image || dummyLogo}" alt="${recipe.name}" style="width:100%; height:auto; display:block; border-radius: 8px;">
            </div>

            <h2 style="margin-top: 15px; margin-bottom: 5px; text-align: center;">${recipe.name}</h2>
            
            ${getMacrosHTML()} 

            <h4 style="margin-top: 20px;">Ingrediënten:</h4>
            <ul class="ingredients-list">${getIngredientsHTML()}</ul>

            <h4>Bereidingswijze:</h4>
            <div class="instructions-container" style="margin-bottom:20px;">
                 <p class="instructions" style="white-space: pre-wrap;">${recipe.instructions}</p>
            </div>
        </div>
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
                <button class="action-menu-item" id="action-add-agenda"><img src="/Fotos/agendaiconwit.png" style="width:18px; height:18px;"> <span>Inplannen in agenda</span></button>
                <button class="action-menu-item" id="action-close" style="color: #ff7f50; margin-top: 10px; justify-content: center; font-weight: bold; border: none;">Annuleren</button>
            </div>`;
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
        sheetOverlay.querySelector("#action-add-agenda").onclick = () => {
            const recipeId = recipe._id || recipe.id;
            const recipeName = encodeURIComponent(recipe.name);
            window.location.href = `agenda.html?addRecipeId=${recipeId}&recipeName=${recipeName}`;
        };
        sheetOverlay.querySelector("#action-close").onclick = closeSheet;
        sheetOverlay.onclick = (e) => { if(e.target === sheetOverlay) closeSheet(); };
    };

    overlay.querySelector("#popup-close-top").onclick = closePopup;
    overlay.querySelector("#popup-menu-top").onclick = (e) => { e.stopPropagation(); openActionSheet(); };
    overlay.querySelector("#decrement-persons").onclick = () => { if (persons > 1) { persons--; updateRecipeDisplay(); } };
    overlay.querySelector("#increment-persons").onclick = () => { persons++; updateRecipeDisplay(); };

    const updateRecipeDisplay = () => {
        overlay.querySelector("#persons-count").textContent = persons;
        overlay.querySelector(".ingredients-list").innerHTML = getIngredientsHTML();
        recipe.persons = persons; 
    };

    overlay.onclick = e => { if (e.target === overlay) closePopup(); };
}

  /* ============================
     RECIPE RENDERING LOGIC
  ============================ */
  
  // 🔑 GEFIXTE FUNCTIE: Upload afhandeling
  async function handleImageUpload(recipeId, file, cardElement) {
    const formData = new FormData();
    // De veldnaam MOET 'image' zijn voor Multer
    formData.append('image', file); 
    
    try {
        const uploadRes = await fetch(`/api/recipes/${recipeId}/upload-image`, {
            method: 'POST',
            credentials: 'include',
            body: formData 
        });
        
        if (!uploadRes.ok) throw new Error("Afbeelding upload mislukt op de server.");
        
        const data = await uploadRes.json();
        
        // Visuele update van de kaart direct uitvoeren (zonder reload)
        const imageElement = cardElement.querySelector('.recipe-image-container .recipe-image, .recipe-image-container .placeholder-image');
        
        if (imageElement) {
            if (imageElement.classList.contains('placeholder-image')) {
                const newImg = document.createElement('img');
                newImg.src = data.newImageUrl;
                newImg.alt = "Recept afbeelding";
                newImg.classList.add('recipe-image'); 
                imageElement.replaceWith(newImg);
            } else {
                imageElement.src = data.newImageUrl;
            }
        }
        
        showToast("Afbeelding succesvol bijgewerkt!", greenGradient);
        
        // De meest betrouwbare manier om alle click-handlers te vernieuwen:
        // Na een succesvolle upload, de hele lijst opnieuw laden en renderen.
        await loadOwnRecipes(); 
        
    } catch (error) {
        console.error("Upload Fout:", error);
        // toon specifieke serverfout als die beschikbaar is
        const errorMsg = error.message.includes('upload mislukt') ? "Upload Fout: Server weigert afbeelding." : "Fout bij uploaden afbeelding.";
        showToast(errorMsg, orangeGradient);
    }
  }


  /**
   * Verwijdert de oude receptkaarten en plaatst de nieuwe lijst.
   * Wordt gebruikt door loadOwnRecipes en de formulier submit handler.
   * @param {Array} recipes - De lijst met receptobjecten.
   */
  function updateRecipesDisplay(recipes) {
    recipesContainer.innerHTML = "";
    
    if (!recipes.length) {
      recipesContainer.innerHTML = '<p class="placeholder-text">Je hebt nog geen recepten toegevoegd.</p>';
      return;
    }

    // Gebruik .forEach en .append om ze in de volgorde van de array te plaatsen (meest recent eerst, indien zo gesorteerd door de server)
    recipes.forEach(recipe => {
      const card = document.createElement("div");
      card.classList.add("recipe-card");
      card.style.minWidth = "180px";
      card.style.flex = "0 0 auto";

      // 🔑 NIEUW: Maak de verborgen bestandskiezer aan
      const hiddenFileInput = document.createElement('input');
      hiddenFileInput.type = 'file';
      hiddenFileInput.accept = 'image/*';
      hiddenFileInput.style.display = 'none';

      // CODE ZONDER INLINE GROOTTE/POSITIE STIJLEN (ALLES VIA CSS)
      card.innerHTML = `
        <div class="recipe-image-container">
            
            <div class="recipe-upload-icon" data-recipe-id="${recipe._id}">
                <img src="${cameraIconPath}" alt="Upload Foto">
            </div>
        
            ${getImageHTML(recipe)}

            <span class="duration-label" style="position:absolute; bottom:5px; left:5px; background: rgba(0,0,0,0.6); color:#fff; padding:2px 5px; font-size:12px; border-radius:3px; z-index: 5;">
                ⏱ ${recipe.duration} min
            </span>

            <span class="delete-btn-wrapper icon-wrapper">
                <img 
                    src="/Fotos/prullenbakicon.png" 
                    alt="Verwijderen" 
                    class="delete-btn"
                >
            </span>

            <span class="share-btn-wrapper icon-wrapper">
                <img 
                    src="/Fotos/shareicon.png" 
                    alt="Delen" 
                    class="share-btn"
                >
            </span>

        </div>
        <p style="text-align:center; margin-top:0.3rem;">${recipe.name}</p>
        ${getDietTagsHtml(recipe)} `;

      // Voeg de verborgen input toe aan de kaart (of de container)
      const imageContainer = card.querySelector('.recipe-image-container');
      if (imageContainer) {
          imageContainer.appendChild(hiddenFileInput);
      }


      // 🔑 NIEUWE EVENT LISTENERS VOOR FOTO UPLOAD
      const uploadIcon = card.querySelector('.recipe-upload-icon');

      // 1. Klik op het icoon opent de bestandskiezer
      uploadIcon.addEventListener('click', e => {
          e.stopPropagation(); 
          hiddenFileInput.click();
      });

      // 2. Wanneer een bestand gekozen is, start de upload
      hiddenFileInput.addEventListener('change', e => {
          if (e.target.files.length > 0) {
              handleImageUpload(recipe._id, e.target.files[0], card);
          }
      });
      // ---------------------------------------------


      // Verwijderen
      // Let op: De event listener hangt nu aan de wrapper, niet direct aan de img tag
      card.querySelector(".delete-btn-wrapper").addEventListener("click", async e => {
        e.stopPropagation();
        if (!confirm(`Weet je zeker dat je "${recipe.name}" wilt verwijderen?`)) return;
        
        try {
            const deleteRes = await fetch(`/api/recipes/${recipe._id}`, { method: "DELETE" });
            if (!deleteRes.ok) throw new Error("Delete failed");
            
            card.remove();
            
            if (recipesContainer.children.length === 0) {
                 recipesContainer.innerHTML = '<p class="placeholder-text">Je hebt nog geen recepten toegevoegd.</p>';
            }
            showToast(`Recept "${recipe.name}" verwijderd!`);
            
        } catch (err) {
            console.error(err);
            showToast("Verwijderen mislukt.", "#ff4d4d");
        }
      });

      // Delen
      // Let op: De event listener hangt nu aan de wrapper, niet direct aan de img tag
      card.querySelector(".share-btn-wrapper").addEventListener("click", e => {
        e.stopPropagation();
        showEmailPromptToast(
          "Met welk e-mailadres wil je dit recept delen?",
          "voorbeeld@domein.com",
          async (targetUser) => {
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
                showToast(`Recept gedeeld met ${targetUser}!`);
              } else {
                const errorData = await res.json();
                showToast(errorData.error || "Kon het recept niet delen", "#ff4d4d");
              }
            } catch (err) {
              console.error(err);
              showToast("Fout bij delen van recept", "#ff4d4d");
            }
          }
        );
      });

      // Klik opent de pop-up
      card.addEventListener("click", () => showRecipeDetails("", recipe));
      
      recipesContainer.appendChild(card); 
    });
  }


  /* ============================
     loadOwnRecipes
  ============================ */
  async function loadOwnRecipes() {
    try {
      const res = await fetch("/api/myrecipes");
      const recipes = res.ok ? await res.json() : [];

      updateRecipesDisplay(recipes);

    } catch (err) {
      console.error(err);
      recipesContainer.innerHTML = '<p class="placeholder-text">Fout bij laden recepten.</p>';
    }
  }

  loadOwnRecipes();


  /* ============================
     DYNAMISCHE INGREDIËNTEN EN FORMULIER
  ============================ */
  const ingredientsContainer = document.getElementById("ingredients-container");
  const addIngredientBtn = document.getElementById("add-ingredient-btn");
  const personsInputForm = document.getElementById("recipe-persons"); 
  const form = document.getElementById("own-recipe-form");

  addIngredientBtn.addEventListener("click", () => {
    const row = document.createElement("div");
    row.className = "ingredient-row";
    row.innerHTML = `
      <input type="text" class="ingredient-item" placeholder="Ingrediënt" required>
      <input type="text" class="ingredient-amount" placeholder="Hoeveelheid" required>
      <button type="button" class="remove-ingredient">❌</button>
    `;
    // Voeg nieuwe rijen aan het einde toe
    ingredientsContainer.appendChild(row); 
    row.querySelector(".remove-ingredient").addEventListener("click", () => row.remove());
  });

  // Event listener voor reeds bestaande rijen
  document.querySelectorAll(".remove-ingredient").forEach(btn => 
    btn.addEventListener("click", e => e.target.closest(".ingredient-row").remove())
  );

  personsInputForm.addEventListener("input", () => {
    const persons = parseInt(personsInputForm.value) || 1;
    document.querySelectorAll(".ingredient-row").forEach(row => {
      const amountInput = row.querySelector(".ingredient-amount");
      const base = amountInput.dataset.baseAmount || amountInput.value; 
      
      const match = base.match(/^([\d.,]+)\s*(.*)$/);
      if (match) {
        let num = parseFloat(match[1].replace(",", ".")) * persons;
        let unit = match[2] || "";
        
        amountInput.dataset.baseAmount = base;
        
        amountInput.value = num.toFixed(2).replace(/\.00$/, '').replace(/\./, ',') + " " + unit.trim();
      }
    });
  });

  // 🔑 AANGEPASTE SUBMIT LOGICA VOOR NIEUW RECEPT (Final Check met validatie)
  form.addEventListener("submit", async e => { 
    e.preventDefault();

    const ingredients = Array.from(document.querySelectorAll(".ingredient-row")).map(row => {
      const item = row.querySelector(".ingredient-item").value.trim();
      const amount = row.querySelector(".ingredient-amount").value.trim();
      
      const baseAmount = row.querySelector(".ingredient-amount").dataset.baseAmount || amount;
      
      // Zorg ervoor dat het een geldig object is
      return { item, amount, baseAmount }; 
    }).filter(i => i.item && i.amount); // Verwijder lege rijen

    const fileInput = document.getElementById("recipe-image-file");
    
    // Lees de ingevulde macro-waarden uit het formulier. 
    const getMacroValue = (id) => { 
        const el = document.getElementById(id);
        // Gebruik 0 als default als de invoer leeg is of geen geldig nummer is
        // We veranderen dit straks om de gevraagde standaardwaarden te forceren
        return parseFloat(el?.value.replace(',', '.')) || 0; 
    };

    // 🔑 CLIENT-SIDE VALIDATIE: CONTROLEER VERPLICHTE VELDEN
    const recipeName = document.getElementById("recipe-name").value.trim();
    const instructions = document.getElementById("recipe-instructions").value.trim();
    
    if (!recipeName) {
        showToast("De naam van het recept is verplicht.", orangeGradient);
        return;
    }
    if (!instructions) {
        showToast("De bereidingswijze is verplicht.", orangeGradient);
        return;
    }
    if (ingredients.length === 0) {
        showToast("Voeg minstens één ingrediënt toe.", orangeGradient);
        return;
    }


    // 1. MAAK HET FORMDATA OBJECT
    const formData = new FormData();
    formData.append("name", recipeName);
    
    // Zorg voor numerieke defaults
    formData.append("duration", document.getElementById("recipe-duration").value || 0);
    formData.append("persons", document.getElementById("recipe-persons").value || 1);
    
    // Belangrijk: Objecten MOETEN als JSON string naar de server 
    formData.append("ingredients", JSON.stringify(ingredients)); 
    // Instructies is platte tekst
    formData.append("instructions", instructions); 
    
    // Tags als platte tekst (de server splist dit waarschijnlijk op)
    formData.append("tags", document.getElementById("recipe-tags").value || "");
    
    // 💥 AANPASSING HIER: Macro's forceren naar de gevraagde waarden als ze 0 of leeg zijn
    const currentProtein = getMacroValue("recipe-protein");
    const currentCarbs = getMacroValue("recipe-carbs");
    const currentFat = getMacroValue("recipe-fat");
    
    const macrosPayload = { 
        protein: currentProtein > 0 ? currentProtein : 14, 
        carbs: currentCarbs > 0 ? currentCarbs : 21,   
        fat: currentFat > 0 ? currentFat : 15
    };
    
    // MACROS ALS JSON STRING
    formData.append("macros", JSON.stringify(macrosPayload));


    // 2. VOEG DE AFBEELDING TOE, INDIEN AANWEZIG
    if (fileInput.files.length > 0) {
        formData.append("image", fileInput.files[0]);
    }
    
    try {
        const response = await fetch("/api/recipes", {
            method: "POST",
            // GEEN 'Content-Type' HEADER VOOR FormData!
            body: formData 
        });
        
        if (!response.ok) {
            // Probeer de serverfout te loggen
            const errorText = await response.text();
            console.error("Server Response Error:", errorText);
            // toon een generieke foutmelding met statuscode
            throw new Error(`Serverfout bij opslaan recept: Status ${response.status}. Zie console voor details.`);
        }
        
        // Server stuurt de bijgewerkte lijst terug
        const data = await response.json(); 
        
        // Reset het formulier
        form.reset();
        ingredientsContainer.innerHTML = ''; 
        
        // Laad de nieuwe recepten
        updateRecipesDisplay(data.myRecipes); 

        showToast("Recept succesvol toegevoegd!", greenGradient);

    } catch (err) {
        console.error(err);
        showToast("Fout bij opslaan recept. Status 500 wijst op een serverprobleem.", orangeGradient);
    }
  });


  /* ============================
     SIDEBAR HAMBURGER
  ============================ */
  const hamburger = document.getElementById('hamburger-btn');
  const sidebarNav = document.querySelector('.sidebar-nav');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    sidebarNav.classList.toggle('open');
  });

});