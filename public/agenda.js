document.addEventListener("DOMContentLoaded", () => {
    
    // De datum die momenteel wordt weergegeven
    let currentDisplayDate = new Date();
    
    // De opslag voor geplande maaltijden
    let plannedMeals = {}; 

    // Opslag voor alle recepten
    let allRecipes = [];
    let selectedRecipeId = null; 
    let selectedRecipeName = null; 

    /* ============================================================
       1. CHECK DASHBOARD PARAMETERS & INITIALISATIE
    ============================================================ */
    const urlParams = new URLSearchParams(window.location.search);
    const preselectId = urlParams.get('addRecipeId');
    const preselectName = urlParams.get('recipeName');

    const addSelectedMealBtn = document.getElementById('add-selected-meal-btn');

    if (preselectId && preselectName) {
        selectedRecipeId = preselectId;
        selectedRecipeName = decodeURIComponent(preselectName);
        if (addSelectedMealBtn) addSelectedMealBtn.disabled = false;

        setTimeout(() => {
            showStatusToast("Recept klaar!", `Klik op een dag in de kalender om <strong>${selectedRecipeName}</strong> in te plannen.`);
        }, 500);
    }

    /* ============================
       ELEMENTEN SELECTEREN
    ============================ */
    const userNameSidebarEl = document.getElementById("user-name-sidebar");
    const profileCircleEl = document.getElementById("profile-circle");
    const hamburger = document.getElementById('hamburger-btn');
    const sidebarNav = document.querySelector('.sidebar-nav');
    
    const monthYearDisplay = document.getElementById('current-month-year');
    const calendarGrid = document.getElementById('calendar-grid');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    
    const mealModal = document.getElementById('meal-modal');
    const modalCloseBtn = document.querySelector('.close-button');
    const modalDateDisplay = document.getElementById('modal-date-display');
    const currentMealsList = document.getElementById('current-meals-list');

    const recipeSearch = document.getElementById('recipe-search');
    const recipeCardsContainer = document.getElementById('recipe-cards-container');
    const mealTypeSelect = document.getElementById('meal-type');

    const shareEmailInput = document.getElementById('share-email');
    const shareBtn = document.getElementById('share-agenda-btn');
    const sharedUsersList = document.getElementById('shared-users-list');
    const leaveBtn = document.getElementById('leave-agenda-btn');

    /* ============================
       TOAST & POPUP FUNCTIES
    ============================ */

    function showStatusToast(title, message, isError = false) {
        const overlay = document.createElement('div');
        overlay.className = 'toast-overlay';
        const toast = document.createElement('div');
        toast.className = `toast-container ${isError ? 'error' : 'success'}`;
        toast.innerHTML = `
            <div class="toast-header">${isError ? '❌ Oeps' : '✅ Gelukt'}</div>
            <div class="toast-body"><strong>${title}</strong><br><br>${message}</div>
            <div class="toast-actions"><button class="btn-ok" id="status-ok">OK</button></div>
        `;
        document.body.appendChild(overlay);
        document.body.appendChild(toast);
        document.getElementById('status-ok').onclick = () => { toast.remove(); overlay.remove(); };
    }

    function showInviteToast(fromName) {
        const overlay = document.createElement('div');
        overlay.className = 'toast-overlay';
        const toast = document.createElement('div');
        toast.className = 'toast-container';
        
        // Hieronder is de emoji vervangen door een <img> tag
        toast.innerHTML = `
            <div class="toast-header" style="display: flex; align-items: center; gap: 8px;">
                <img src="/Fotos/group.png" style="width: 22px; height: 22px; object-fit: contain;"> 
                Nieuwe Uitnodiging
            </div>
            <div class="toast-body"><strong>${fromName}</strong> wil de agenda met je delen.<br><br>Accepteer je dit?</div>
            <div class="toast-actions">
                <button class="btn-accept" id="toast-accept">Accepteren</button>
                <button class="btn-decline" id="toast-decline">Weigeren</button>
            </div>
        `;
        document.body.appendChild(overlay);
        document.body.appendChild(toast);
        document.getElementById('toast-accept').onclick = () => respondInvitation(true, toast, overlay);
        document.getElementById('toast-decline').onclick = () => respondInvitation(false, toast, overlay);
    }

    async function respondInvitation(accept, toastElement, overlayElement) {
        try {
            const response = await fetch("/api/agenda/respond-invitation", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accept })
            });
            const result = await response.json();
            if (result.success) {
                toastElement.remove(); overlayElement.remove();
                if (accept) window.location.reload();
            }
        } catch (err) { console.error(err); }
    }

    /* ============================
       MODAL LOGICA
    ============================ */

    let activeDate = null;
    function openMealModal(date) {
        activeDate = date;
        const d = new Date(date + 'T00:00:00'); 
        const dateString = d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
        const modalContent = mealModal.querySelector('.modal-content');
    
        const existingBar = modalContent.querySelector('.top-action-bar-agenda');
        if (existingBar) existingBar.remove();
    
        modalContent.insertAdjacentHTML('afterbegin', `
            <div class="top-action-bar-agenda" style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 15px; border-bottom: 1px solid #eee; margin-bottom: 25px;">
                <div id="modal-back-btn" style="cursor: pointer; display: flex; align-items: center;">
                    <img src="/Fotos/arrow-down-sign-to-navigate.oranje.png" style="width: 25px; height: 25px;">
                </div>
                <span style="font-weight: bold; color: #444; font-size: 1.1rem; text-transform: capitalize;">${dateString}</span>
                <div style="width: 25px;"></div>
            </div>
        `);
    
        renderCurrentMeals(date);

        if (selectedRecipeId && selectedRecipeName) {
            recipeSearch.value = selectedRecipeName;
            renderRecipeCards(allRecipes.filter(r => r.name.toLowerCase().includes(selectedRecipeName.toLowerCase())));
        } else {
            recipeSearch.value = "";
            renderRecipeCards(allRecipes);
        }

        mealModal.style.display = 'flex'; 
        modalContent.classList.replace('popup-animate-out', 'popup-animate-in');
        document.getElementById('modal-back-btn').onclick = closeMealModal;
    }

    function closeMealModal() {
        const modalContent = mealModal.querySelector('.modal-content');
        modalContent.classList.replace('popup-animate-in', 'popup-animate-out');
        setTimeout(() => { mealModal.style.display = 'none'; }, 350);
    }

    /* ============================
       RECEPTEN & KALENDER RENDEREN
    ============================ */
    
    function renderRecipeCards(recipes) {
        recipeCardsContainer.innerHTML = '';
        recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.classList.add('recipe-card');
            if (recipe._id === selectedRecipeId) card.classList.add('selected');

            const imageSrc = recipe.imagePath && recipe.imagePath !== 'none' ? recipe.imagePath : '/Fotos/placeholder_food.png';
            card.innerHTML = `<img src="${imageSrc}" class="recipe-card-img"><div class="recipe-card-info">${recipe.name}</div>`;
            
            card.addEventListener('click', () => {
                document.querySelectorAll('.recipe-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedRecipeId = recipe._id;
                selectedRecipeName = recipe.name;
                addSelectedMealBtn.disabled = false;
            });
            recipeCardsContainer.appendChild(card);
        });
    }

    function renderCalendar() {
        const year = currentDisplayDate.getFullYear();
        const month = currentDisplayDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay(); 
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startOffset = (firstDay === 0) ? 6 : firstDay - 1; 

        monthYearDisplay.textContent = `${["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"][month]} ${year}`;
        
        calendarGrid.innerHTML = `<div class="day-name">MA</div><div class="day-name">DI</div><div class="day-name">WO</div><div class="day-name">DO</div><div class="day-name">VR</div><div class="day-name">ZA</div><div class="day-name">ZO</div>`;

        for (let i = 0; i < startOffset; i++) calendarGrid.innerHTML += '<div class="day-cell other-month"></div>';

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = formatDate(new Date(year, month, day));
            const meals = plannedMeals[dateStr] || [];
            let mealsHtml = meals.map(m => `<div class="meal-entry">${m.type}: ${m.name}</div>`).join('');
            calendarGrid.innerHTML += `<div class="day-cell" data-date="${dateStr}"><div class="day-number-circle">${day}</div>${mealsHtml}</div>`;
        }
        document.querySelectorAll('.day-cell[data-date]').forEach(cell => {
            cell.addEventListener('click', () => openMealModal(cell.dataset.date));
        });
    }

    function renderCurrentMeals(date) {
        const meals = plannedMeals[date] || [];
        if (meals.length === 0) { currentMealsList.innerHTML = '<p>Niks gepland.</p>'; return; }
        currentMealsList.innerHTML = '<h4>Gepland:</h4><ul>' + 
            meals.map((m, i) => `<li>${m.type}: <strong>${m.name}</strong> <button class="remove-meal-btn" data-index="${i}">x</button></li>`).join('') + '</ul>';
        
        document.querySelectorAll('.remove-meal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                plannedMeals[date].splice(parseInt(e.target.dataset.index), 1);
                if (plannedMeals[date].length === 0) delete plannedMeals[date];
                renderCurrentMeals(date); renderCalendar(); savePlannedMeals();
            });
        });
    }

    /* ============================
       API & ACTIES
    ============================ */

    async function loadHouseholdMembers() {
        if (!sharedUsersList) return;
        try {
            const res = await fetch("/api/agenda/household-members");
            const data = await res.json();
            if (data.members && data.members.length > 0) {
                sharedUsersList.innerHTML = data.members.map(m => `
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                        <div style="width: 8px; height: 8px; background: #2ecc71; border-radius: 50%;"></div>
                        <span><strong>${m.name}</strong></span>
                    </div>
                `).join('');
            } else {
                sharedUsersList.innerHTML = "<p>Je deelt de agenda nog met niemand.</p>";
            }
        } catch (err) { console.error(err); }
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const email = shareEmailInput.value.trim();
            if (!email) return showStatusToast("Oeps", "Vul een e-mailadres in.", true);
            try {
                const res = await fetch("/api/agenda/share-with-user", {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ targetEmail: email })
                });
                const result = await res.json();
                if (result.success) {
                    showStatusToast("Verstuurd!", `Uitnodiging gestuurd naar ${email}.`);
                    shareEmailInput.value = "";
                } else { showStatusToast("Fout", result.error, true); }
            } catch (err) { console.error(err); }
        });
    }

    addSelectedMealBtn.addEventListener('click', () => {
        if (!selectedRecipeId || !activeDate) return;
        if (!plannedMeals[activeDate]) plannedMeals[activeDate] = [];
        
        if (selectedRecipeId === 'none') {
            plannedMeals[activeDate] = [{ name: 'Vrij', type: 'Vrij', recipeId: 'none' }];
        } else {
            plannedMeals[activeDate] = plannedMeals[activeDate].filter(m => m.recipeId !== 'none');
            plannedMeals[activeDate].push({ name: selectedRecipeName, type: mealTypeSelect.value, recipeId: selectedRecipeId });
        }
        
        const nameBackup = selectedRecipeName;
        selectedRecipeId = null; selectedRecipeName = null; recipeSearch.value = "";
        window.history.replaceState({}, document.title, window.location.pathname);

        closeMealModal(); renderCalendar(); savePlannedMeals();
        showStatusToast("Ingepland!", `${nameBackup} staat in de agenda.`);
    });

    /* ============================
       STANDAARD FUNCTIES
    ============================ */

    function formatDate(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
    
    async function loadAllRecipes() {
        try {
            const res = await fetch("/api/allrecipes"); 
            allRecipes = await res.json();
            allRecipes.unshift({ _id: 'none', name: 'Vrije Maaltijd', imagePath: '/Fotos/no_meal.png' });
            renderRecipeCards(allRecipes);
        } catch (err) { console.error(err); }
    }

    async function savePlannedMeals() {
        try {
            await fetch("/api/agenda/save", {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ meals: plannedMeals }) 
            });
        } catch (error) { console.error(error); }
    }

    async function loadPlannedMeals() {
        try {
            const res = await fetch("/api/agenda/load");
            const data = await res.json();
            plannedMeals = (data && data.meals) ? data.meals : {};
            renderCalendar();
        } catch (error) { console.warn("Load error"); }
    }

    async function loadUserName() {
        try {
            const res = await fetch("/api/user");
            const data = await res.json();
            if (userNameSidebarEl) userNameSidebarEl.textContent = data.name;
            if (profileCircleEl) profileCircleEl.textContent = data.name.charAt(0).toUpperCase();
        } catch (err) { console.error(err); }
    }

    async function checkPendingInvitations() {
        try {
            const res = await fetch("/api/agenda/check-invitation");
            const data = await res.json();
            if (data.hasInvitation) showInviteToast(data.fromName);
        } catch (err) { console.error(err); }
    }

    recipeSearch.addEventListener('input', (e) => {
        renderRecipeCards(allRecipes.filter(r => r.name.toLowerCase().includes(e.target.value.toLowerCase())));
    });

    prevMonthBtn.onclick = () => { currentDisplayDate.setMonth(currentDisplayDate.getMonth() - 1); renderCalendar(); };
    nextMonthBtn.onclick = () => { currentDisplayDate.setMonth(currentDisplayDate.getMonth() + 1); renderCalendar(); };
    modalCloseBtn.onclick = closeMealModal;
    hamburger.onclick = () => { hamburger.classList.toggle('active'); sidebarNav.classList.toggle('open'); };

    /* START */
    Promise.all([
        loadUserName(), loadAllRecipes(), loadPlannedMeals(), loadHouseholdMembers(), checkPendingInvitations()
    ]).then(() => renderCalendar());

    setInterval(loadPlannedMeals, 30000);
});