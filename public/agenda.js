document.addEventListener("DOMContentLoaded", () => {
    
    // De datum die momenteel wordt weergegeven (begint bij de huidige maand)
    let currentDisplayDate = new Date();
    
    // NIEUW: De opslag voor geplande maaltijden moet een 'let' zijn om later te kunnen overschrijven
    let plannedMeals = {}; 

    // Opslag voor alle recepten (incl. foto's en users)
    let allRecipes = [];
    let selectedRecipeId = null; 
    let selectedRecipeName = null; 

    /* ============================
       ELEMENTEN SELECTEREN
    ============================ */

    // Sidebar en Gebruikersnaam
    const userNameSidebarEl = document.getElementById("user-name-sidebar");
    const profileCircleEl = document.getElementById("profile-circle");
    const hamburger = document.getElementById('hamburger-btn');
    const sidebarNav = document.querySelector('.sidebar-nav');
    
    // Kalender Elementen
    const monthYearDisplay = document.getElementById('current-month-year');
    const calendarGrid = document.getElementById('calendar-grid');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    
    // Modal Elementen
    const mealModal = document.getElementById('meal-modal'); // <-- Gaat er vanuit dat uw modal deze ID heeft
    const modalCloseBtn = document.querySelector('.close-button');
    const modalDateDisplay = document.getElementById('modal-date-display');
    const currentMealsList = document.getElementById('current-meals-list');

    // Nieuwe Modal Elementen
    const recipeSearch = document.getElementById('recipe-search');
    const recipeCardsContainer = document.getElementById('recipe-cards-container');
    const mealTypeSelect = document.getElementById('meal-type');
    const addSelectedMealBtn = document.getElementById('add-selected-meal-btn');

    /* ============================
       NIEUW: SERVER PERSISTENTIE FUNCTIES
    ============================ */

    async function savePlannedMeals() {
        try {
            const res = await fetch("/api/agenda/save", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Stuur het complete plannedMeals object als JSON naar de server
                body: JSON.stringify({ meals: plannedMeals }) 
            });

            if (!res.ok) {
                // Log de fout, maar gooi geen exception om de UI niet te stoppen
                console.warn(`[Agenda Save] Fout bij opslaan planning: ${res.status} ${res.statusText}`);
            }
            // console.log("Planning succesvol opgeslagen.");
        } catch (error) {
            console.error("[Agenda Save] Opslaan planning mislukt:", error);
        }
    }

    async function loadPlannedMeals() {
        try {
            const res = await fetch("/api/agenda/load");
            
            if (!res.ok) {
                // Afhandeling van een duidelijke serverfout (bijv. 500)
                console.warn(`[Agenda Load] Fout bij laden planning: ${res.status} ${res.statusText}`);
                plannedMeals = {};
                return;
            }

            const data = await res.json();
            
            // Controleer of de JSON een 'meals' object bevat
            if (data && data.meals && Object.keys(data.meals).length > 0) {
                plannedMeals = data.meals;
            } else {
                 // Geen planning gevonden, begin met leeg object
                 plannedMeals = {}; 
            }
        } catch (error) {
            console.warn("[Agenda Load] Laden planning mislukt (mogelijk netwerkfout of lege respons):", error);
            plannedMeals = {}; // Zorg voor een schone start bij een fout
        }
    }


    /* ============================
       INITIALISATIE FUNCTIES
    ============================ */
    
    // Hamburger menu
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      sidebarNav.classList.toggle('open');
    });

    // Gebruikersnaam
    async function loadUserName() {
        try {
            const res = await fetch("/api/user");
            if (!res.ok) return;
            const data = await res.json();
            if (userNameSidebarEl) userNameSidebarEl.textContent = data.name;
            if (profileCircleEl) profileCircleEl.textContent = data.name.charAt(0).toUpperCase();
        } catch (err) {
            console.error("Fout bij laden gebruikersnaam:", err);
        }
    }

    // Alle recepten laden en kaarten renderen
    async function loadAllRecipes() {
        try {
            const res = await fetch("/api/allrecipes"); 
            if (!res.ok) throw new Error("Kon alle recepten niet laden");

            allRecipes = await res.json();
            
            // Voeg 'Vrije Maaltijd' optie toe
            allRecipes.unshift({ 
                _id: 'none', 
                name: 'Vrije Maaltijd / Niks Plannen', 
                imagePath: '/Fotos/no_meal.png', 
                user: 'Systeem' 
            });

            renderRecipeCards(allRecipes);
            
        } catch (err) {
            console.error("Fout bij laden alle recepten:", err);
            recipeCardsContainer.innerHTML = '<p style="color:red;">Fout bij het laden van recepten. Controleer de server verbinding.</p>';
        }
    }
    
    // Renderen en filteren van receptkaarten
    function renderRecipeCards(recipes) {
        recipeCardsContainer.innerHTML = '';
        if (recipes.length === 0) {
            recipeCardsContainer.innerHTML = '<p>Geen recepten gevonden die overeenkomen met de zoekterm.</p>';
            return;
        }

        recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.classList.add('recipe-card');
            card.dataset.id = recipe._id;
            card.dataset.name = recipe.name;
            
            // Gebruik 'imagePath' uit de server respons
            const imageSrc = recipe.imagePath && recipe.imagePath !== 'none' ? recipe.imagePath : '/Fotos/placeholder_food.png';

            card.innerHTML = `
                <img src="${imageSrc}" alt="${recipe.name}" class="recipe-card-img">
                <div class="recipe-card-info">
                    ${recipe.name}
                    ${recipe._id !== 'none' ? `<small>Door: ${recipe.user || 'Onbekend'}</small>` : ''}
                </div>
            `;

            // Markeer geselecteerd recept als er een is
            if (selectedRecipeId === recipe._id) {
                card.classList.add('selected');
            }

            card.addEventListener('click', handleRecipeCardClick);
            recipeCardsContainer.appendChild(card);
        });
    }

    // Zoekfunctionaliteit
    recipeSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredRecipes = allRecipes.filter(recipe => 
            recipe.name.toLowerCase().includes(searchTerm)
        );
        renderRecipeCards(filteredRecipes);
    });

    // Afhandeling van de klik op een receptkaart
    function handleRecipeCardClick(e) {
        const card = e.currentTarget;
        const recipeId = card.dataset.id;
        const recipeName = card.dataset.name;

        // Deselecteer alle andere kaarten
        document.querySelectorAll('.recipe-card').forEach(c => c.classList.remove('selected'));

        // Selecteer de huidige kaart
        card.classList.add('selected');
        selectedRecipeId = recipeId;
        selectedRecipeName = recipeName;

        addSelectedMealBtn.disabled = false;
        
        // Zorg voor een nette weergave van de knop tekst
        let btnText = recipeName;
        if (recipeName.length > 30) {
            btnText = recipeName.substring(0, 30) + '...';
        }
        addSelectedMealBtn.textContent = `Voeg '${btnText}' toe`;
    }

    
    /* ============================
       KALENDER LOGICA
    ============================ */
    
    // Functie om de datum te formatteren naar YYYY-MM-DD
    function formatDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function getDaysInMonth(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    }
    
    function renderCalendar() {
        const year = currentDisplayDate.getFullYear();
        const month = currentDisplayDate.getMonth();
        // Zondag is 0, Maandag is 1, etc.
        const firstDayOfMonth = new Date(year, month, 1).getDay(); 
        const daysInMonth = getDaysInMonth(currentDisplayDate);
        
        // Offset om op MAANDAG te beginnen (0=Zondag, dus als 0 dan 6, anders -1)
        const startDayOffset = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1; 

        const monthNames = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
        monthYearDisplay.textContent = `${monthNames[month]} ${year}`;
        
        calendarGrid.innerHTML = `
            <div class="day-name">MA</div>
            <div class="day-name">DI</div>
            <div class="day-name">WO</div>
            <div class="day-name">DO</div>
            <div class="day-name">VR</div>
            <div class="day-name">ZA</div>
            <div class="day-name">ZO</div>
        `;

        // Vul de lege cellen aan het begin
        for (let i = 0; i < startDayOffset; i++) {
            calendarGrid.innerHTML += '<div class="day-cell other-month"></div>';
        }

        // Vul de dagen van de maand
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const fullDate = formatDate(dateObj);
            const meals = plannedMeals[fullDate] || [];

            let mealsHtml = '';
            meals.forEach(meal => {
                // Gebruik de status-gepland/vrij classes om de maaltijdstijl aan te passen
                const statusClass = meal.recipeId === 'none' ? 'status-vrij' : 'status-gepland';
                mealsHtml += `<div class="meal-entry ${statusClass}">${meal.type}: ${meal.name}</div>`;
            });

            calendarGrid.innerHTML += `
                <div class="day-cell" data-date="${fullDate}">
                    <div class="day-number-circle">${day}</div>
                    ${mealsHtml}
                </div>
            `;
        }

        // Event listeners toevoegen aan de dagcellen
        document.querySelectorAll('.day-cell[data-date]').forEach(cell => {
            cell.addEventListener('click', () => openMealModal(cell.dataset.date));
        });
    }

    prevMonthBtn.addEventListener('click', () => {
        currentDisplayDate.setMonth(currentDisplayDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDisplayDate.setMonth(currentDisplayDate.getMonth() + 1);
        renderCalendar();
    });


    /* ============================
       MODAL EN PLANNING LOGICA
    ============================ */

    let activeDate = null;

    function openMealModal(date) {
        activeDate = date;
        
        const dateObj = new Date(date + 'T00:00:00'); 
        modalDateDisplay.textContent = dateObj.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });

        renderCurrentMeals(date);
        
        // Reset modal staat bij openen
        selectedRecipeId = null;
        selectedRecipeName = null;
        recipeSearch.value = '';
        addSelectedMealBtn.disabled = true;
        addSelectedMealBtn.textContent = `Selecteer een recept`;
        
        // Zorgt ervoor dat de VOLLEDIGE, scrollbare lijst direct zichtbaar is (voor het "dropdown" gevoel)
        renderRecipeCards(allRecipes); 
        
        // **Gebruik 'flex' om de modal te centreren**
        mealModal.style.display = 'flex'; 
        
        // Zorg ervoor dat de scrollbare container focus krijgt op desktop voor direct scrollen
        recipeCardsContainer.focus();
    }

    function renderCurrentMeals(date) {
        const meals = plannedMeals[date] || [];
        
        if (meals.length === 0) {
            currentMealsList.innerHTML = '<p>Nog geen maaltijden gepland voor deze dag.</p>';
            return;
        }

        let html = '<h4>Gepland:</h4><ul>';
        meals.forEach((meal, index) => {
            html += `
                <li>
                    ${meal.type}: <strong>${meal.name}</strong> 
                    <button data-index="${index}" class="remove-meal-btn" title="Verwijder maaltijd">x</button>
                </li>
            `;
        });
        html += '</ul>';
        currentMealsList.innerHTML = html;

        document.querySelectorAll('.remove-meal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => removeMeal(date, parseInt(e.target.dataset.index)));
        });
    }

    function removeMeal(date, index) {
        if (plannedMeals[date]) {
            // Verwijder het item uit de array
            plannedMeals[date].splice(index, 1);
            
            // Verwijder de datum sleutel als er geen maaltijden meer zijn
            if (plannedMeals[date].length === 0) {
                delete plannedMeals[date];
            }
            
            // UI updaten
            renderCurrentMeals(date);
            renderCalendar(); 
            savePlannedMeals(); // NIEUW: Opslaan na verwijderen
        }
    }

    // Sluiten van modal
    modalCloseBtn.addEventListener('click', () => {
        // **Sluit de modal met 'none'**
        mealModal.style.display = 'none';
        activeDate = null;
    });

    // Sluiten modal door op de overlay te klikken
    window.addEventListener('click', (event) => {
        if (event.target === mealModal) {
            // **Sluit de modal met 'none'**
            mealModal.style.display = 'none';
            activeDate = null;
        }
    });

    // Formulier afhandeling (gebruikt de geselecteerde kaart)
    addSelectedMealBtn.addEventListener('click', () => {
        
        if (!selectedRecipeId || !activeDate) return;

        const mealType = mealTypeSelect.value;
        
        const newMeal = {
            name: selectedRecipeName,
            type: mealType,
            recipeId: selectedRecipeId
        };
        
        // Opslaan in de lokale structuur
        if (!plannedMeals[activeDate]) {
            plannedMeals[activeDate] = [];
        }
        
        // Als het 'Vrije Maaltijd' is, verwijder alle andere maaltijden voor die dag
        if (selectedRecipeId === 'none') {
            // Als de gebruiker 'Vrije Maaltijd' kiest, wordt de dag leeg (of ingesteld op Vrij)
            plannedMeals[activeDate] = [{ name: 'Vrij', type: 'Vrij', recipeId: 'none' }];
        } else {
            // Voeg de nieuwe maaltijd toe
            
            // Controleer of de dag al is gemarkeerd als 'Vrij' en verwijder die eerst
            const isFreeDayIndex = plannedMeals[activeDate].findIndex(meal => meal.recipeId === 'none');
            if (isFreeDayIndex !== -1) {
                plannedMeals[activeDate].splice(isFreeDayIndex, 1);
            }
            
            plannedMeals[activeDate].push(newMeal);
        }

        // UI updaten
        // **Sluit de modal met 'none'**
        mealModal.style.display = 'none';
        renderCalendar(); 
        savePlannedMeals(); // NIEUW: Opslaan na toevoegen
        activeDate = null;
    });


    // Eerste initialisatie
    Promise.all([loadUserName(), loadAllRecipes(), loadPlannedMeals()]) // NIEUW: loadPlannedMeals() toegevoegd aan Promise.all
        .then(() => {
            renderCalendar();
            
            // **Zorg ervoor dat de modal bij het opstarten verborgen is**
            if (mealModal) {
                 mealModal.style.display = 'none'; 
            }
        })
        .catch(error => {
            console.error("Fout tijdens initialisatie:", error);
            renderCalendar(); 
        });
});