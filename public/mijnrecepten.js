document.addEventListener("DOMContentLoaded", () => {

  /* ============================
     GEBRUIKERSNAAM LADEN
  ============================ */
  const userNameEl = document.getElementById("user-name");
  const userNameSidebarEl = document.getElementById("user-name-sidebar");
const profileCircleEl = document.getElementById("profile-circle");

async function loadUserName() {
  try {
    const res = await fetch("/api/user");
    if (!res.ok) return;

    const data = await res.json();
    userNameSidebarEl.textContent = data.name; // Vult de sidebar naam
    profileCircleEl.textContent = data.name.charAt(0).toUpperCase(); // Eerste letter in circle
  } catch (err) {
    console.error("Fout bij laden gebruikersnaam:", err);
  }
}

loadUserName();



  /* ============================
     RECEPTEN INLADEN
  ============================ */
  const recipesContainer = document.getElementById("added-recipes-container");
  const dummyLogo = "/Fotos/logo_.png";

  function getImageHTML(recipe) {
    if (recipe.image && recipe.image.trim() !== "") {
      return `<img src="${recipe.image}" alt="${recipe.name}" style="width:100%; height:130px; object-fit:cover; border-radius:8px;">`;
    }
    return `<div class="placeholder-image"><img src="${dummyLogo}" alt="Logo"></div>`;
  }

  function showRecipeDetails(day, recipe) {
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");

    let persons = recipe.persons || 1;

    recipe.ingredients.forEach(i => {
      if (!i.baseAmount) i.baseAmount = i.amount;
    });

    const getIngredientsHTML = () =>
      recipe.ingredients.map(i => {
        let qty = i.baseAmount || "";
        const match = i.baseAmount?.match(/^([\d.,]+)\s*(.*)$/);
        if (match) qty = parseFloat(match[1].replace(",", ".")) * persons + " " + (match[2] || "");
        return `<li>${i.item} – ${qty}</li>`;
      }).join("");

    const getMacrosHTML = () => {
      if (!recipe.macros) return "";
      return `
        <span class="protein">Eiwitten: ${recipe.macros.protein * persons} g</span>
        <span class="carbs">Koolhydraten: ${recipe.macros.carbs * persons} g</span>
        <span class="fat">Vetten: ${recipe.macros.fat * persons} g</span>
      `;
    };

    overlay.innerHTML = `
      <div class="popup">
        <h2>${recipe.name}</h2>
        ${day ? `<p>${day}</p>` : ""}
        <img src="${recipe.image || '/Fotos/logo_.png'}" alt="${recipe.name}">
        
        <div class="recipe-info">
          <span class="duration">⏱ ${recipe.duration} min</span>
          <span class="macros">${getMacrosHTML()}</span>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <label for="persons">Aantal personen:</label>
          <input type="number" id="persons" min="1" value="${persons}">
        </div>

        <h4>Ingrediënten:</h4>
        <ul class="ingredients-list">${getIngredientsHTML()}</ul>

        <h4>Bereidingswijze:</h4>
        <p class="instructions">${recipe.instructions}</p>

        <button class="close-popup-btn">Sluiten</button>
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
  }

  async function loadOwnRecipes() {
    try {
      const res = await fetch("/api/myrecipes");
      const recipes = res.ok ? await res.json() : [];

      recipesContainer.innerHTML = "";
      if (!recipes.length) {
        recipesContainer.innerHTML = '<p class="placeholder-text">Je hebt nog geen recepten toegevoegd.</p>';
        return;
      }

      recipes.forEach(recipe => {
        const card = document.createElement("div");
        card.classList.add("recipe-card");
        card.style.minWidth = "180px";
        card.style.flex = "0 0 auto";

        card.innerHTML = `
          <div class="image-container" style="position:relative;">
              ${getImageHTML(recipe)}

              <span class="duration-label" style="position:absolute; bottom:5px; left:5px; background: rgba(0,0,0,0.6); color:#fff; padding:2px 5px; font-size:12px; border-radius:3px;">
                  ⏱ ${recipe.duration} min
              </span>

              <!-- Verwijderen -->
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

              <!-- Delen -->
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

        // Verwijderen
        card.querySelector(".delete-btn").addEventListener("click", async e => {
          e.stopPropagation();
          if (!confirm(`Weet je zeker dat je "${recipe.name}" wilt verwijderen?`)) return;
          await fetch(`/api/recipes/${recipe._id}`, { method: "DELETE" });
          card.remove();
        });

        // Delen
        card.querySelector(".share-btn").addEventListener("click", e => {
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
                  showToast("Kon het recept niet delen", "#ff4d4d");
                }
              } catch (err) {
                console.error(err);
                showToast("Fout bij delen van recept", "#ff4d4d");
              }
            }
          );
        });

        card.addEventListener("click", () => showRecipeDetails("", recipe));
        recipesContainer.appendChild(card);
      });

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
  const personsInput = document.getElementById("recipe-persons");
  const form = document.getElementById("own-recipe-form");

  addIngredientBtn.addEventListener("click", () => {
    const row = document.createElement("div");
    row.className = "ingredient-row";
    row.innerHTML = `
      <input type="text" class="ingredient-item" placeholder="Ingrediënt" required>
      <input type="text" class="ingredient-amount" placeholder="Hoeveelheid" required>
      <button type="button" class="remove-ingredient">❌</button>
    `;
    ingredientsContainer.appendChild(row);
    row.querySelector(".remove-ingredient").addEventListener("click", () => row.remove());
  });

  document.querySelectorAll(".remove-ingredient").forEach(btn => 
    btn.addEventListener("click", e => e.target.closest(".ingredient-row").remove())
  );

  personsInput.addEventListener("input", () => {
    const persons = parseInt(personsInput.value) || 1;
    document.querySelectorAll(".ingredient-row").forEach(row => {
      const amountInput = row.querySelector(".ingredient-amount");
      const base = amountInput.dataset.baseAmount || amountInput.value;
      const match = base.match(/^([\d.,]+)\s*(.*)$/);
      if (match) {
        let num = parseFloat(match[1].replace(",", ".")) * persons;
        let unit = match[2] || "";
        amountInput.value = num + " " + unit;
      }
    });
  });

  form.addEventListener("submit", e => {
    e.preventDefault();

    const ingredients = Array.from(document.querySelectorAll(".ingredient-row")).map(row => {
      const item = row.querySelector(".ingredient-item").value.trim();
      const amount = row.querySelector(".ingredient-amount").value.trim();
      row.querySelector(".ingredient-amount").dataset.baseAmount = amount;
      return { item, amount };
    });

    const fileInput = document.getElementById("recipe-image-file");
    let imageData = "";
    if (fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = e => {
        imageData = e.target.result;
        submitRecipe(imageData);
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      submitRecipe("");
    }

    function submitRecipe(imageData) {
      const payload = {
        name: document.getElementById("recipe-name").value.trim(),
        image: imageData,
        duration: parseInt(document.getElementById("recipe-duration").value) || null,
        persons: parseInt(document.getElementById("recipe-persons").value) || 1,
        ingredients: ingredients,
        instructions: document.getElementById("recipe-instructions").value.trim(),
        tags: (document.getElementById("recipe-tags").value || "")
          .split(",")
          .map(t => t.trim())
          .filter(Boolean)
      };

      fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(() => {
          form.reset();
          loadOwnRecipes();
        })
        .catch(err => console.error(err));
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


  /* ============================
     MELDINGEN / TOASTS
  ============================ */
  function showToast(msg, color = "#4caf50") {
    let toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.style.position = "fixed";
      toast.style.bottom = "20px";
      toast.style.right = "20px";
      toast.style.padding = "1rem 1.5rem";
      toast.style.background = color;
      toast.style.color = "#fff";
      toast.style.borderRadius = "8px";
      toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";
      toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      toast.style.zIndex = "10000";
      document.body.appendChild(toast);
    }

    toast.textContent = msg;
    toast.style.background = color;
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";
    }, 2500);
  }

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

});
