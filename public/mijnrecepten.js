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
        toast.style.maxWidth = "none";
    } else {
        toast.style.width = "auto";
        toast.style.maxWidth = "400px";
    }

    toast.style.transform = "translate(-50%, 20px)"; 

    toast.style.opacity = "1";
    toast.style.transform = "translate(-50%, 0)";

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translate(-50%, 20px)";
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
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");

    let persons = recipe.persons || 1;

    // 🎯 Configuraties voor de knop
    const isMobile = window.innerWidth <= 600;
    const greenGradient = 'linear-gradient(90deg, #32cd32, #7fff00)'; 
    const orangeGradient = 'linear-gradient(90deg,#ff7f50,#ffb347)'; 
    const copyIconPath = "/Fotos/copyicon.png";
    
    // Helper om ALLEEN de ingrediënten tekst te verzamelen voor het klembord
    const getIngredientsTextToCopy = () => {
        let text = `--- Ingrediënten voor ${recipe.name} (${persons} porties) ---\n`;
        
        recipe.ingredients.forEach(i => {
            if (!i.baseAmount) i.baseAmount = i.amount;
        });
        
        recipe.ingredients.forEach(i => {
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
    
    // Zorgt ervoor dat baseAmount bestaat voor schaling (BELANGRIJK!)
    recipe.ingredients.forEach(i => {
      if (!i.baseAmount) i.baseAmount = i.amount;
    });

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

    // GECORRIGEERDE FUNCTIE: Genereert de complete info-bar met knoppen en tijd
    const getMacrosHTML = () => {
        const macros = recipe.macros || {};
        const time = recipe.duration || 0;
        
        // Let op: Hier *moet* de berekening per persoon staan, want de CSS kleurt de span-klassen.
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


    // Stijlen voor de Kopieerknop
    const copyButtonStyle = `
        position: absolute; 
        top: 5px;        
        right: 5px;       
        padding: 6px 12px; 
        border-radius: 12px;
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
    
    // Inhoud van de Kopieerknop
    const copyButtonContent = `
        <img src="${copyIconPath}" alt="Kopieer" style="width: 25px; height: 25px; margin-top: 5px;"> 
        ${isMobile ? '' : '<span>Kopiëren</span>'}
    `;

    // GECORRIGEERDE STIJL VOOR DE SLUITKNOP
    const closeButtonStyle = `
    padding: ${isMobile ? '15px 15px' : '15px 15px'}; 
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: bold;
    cursor: pointer;
    font-size: ${isMobile ? '1rem' : '1.1rem'};
    width: 100%;
    text-align: center;
    background: ${orangeGradient};
    transition: background 0.3s ease;
    margin-top: 20px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;


    // GECORRIGEERDE HTML STRUCTUUR INJECTIE
    overlay.innerHTML = `
      <div class="popup" style="position:relative;">
        <h2>${recipe.name}</h2>
        ${day ? `<p>${day}</p>` : ""}
        
        <div class="image-container" style="position:relative; width:100%;">
            <img src="${recipe.image || dummyLogo}" alt="${recipe.name}" style="width:100%; height:auto; display:block; border-radius:8px;">
            
            <button id="copy-ingredients-btn" style="${copyButtonStyle}">
                ${copyButtonContent}
            </button>
        </div>
        
        ${getMacrosHTML()} 

        <h4>Ingrediënten:</h4>
        <ul class="ingredients-list">${getIngredientsHTML()}</ul>

        <h4>Bereidingswijze:</h4>
        <p class="instructions">${recipe.instructions}</p>
        
        <div class="popup-buttons" style="display:flex; justify-content:center; margin-top:20px;">
           <button class="close-popup-btn" style="${closeButtonStyle}">Sluiten</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // NIEUWE EVENT LISTENERS (Stap 3)
    const ingredientsList = overlay.querySelector(".ingredients-list");
    const personsCountSpan = overlay.querySelector("#persons-count");
    const decrementBtn = overlay.querySelector("#decrement-persons");
    const incrementBtn = overlay.querySelector("#increment-persons");

    const copyBtn = overlay.querySelector("#copy-ingredients-btn"); 
    
    // Functie om de popup-inhoud te updaten
    const updateRecipeDisplay = () => {
        personsCountSpan.textContent = persons;
        ingredientsList.innerHTML = getIngredientsHTML();
        recipe.persons = persons; 
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

    // 2. Event listener voor de Kopieerknop
    copyBtn.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(getIngredientsTextToCopy()); 
            showToast("Ingrediënten gekopieerd! Je kunt ze nu plakken.", greenGradient); 
        } catch (err) {
            console.error("Fout bij kopiëren:", err);
            showToast("Kopiëren mislukt.", "#ff4d4d");
        }
    });

    // 3. Event listeners voor Sluiten
    overlay.querySelector(".close-popup-btn").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
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