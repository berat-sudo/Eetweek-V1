document.addEventListener('DOMContentLoaded', async () => {
    const nameUpdateForm = document.getElementById('name-update-form');
    const passwordUpdateForm = document.getElementById('password-update-form');
    
    // Selecteer de elementen in de sidebar/header
    const emailDisplay = document.getElementById('user-email-display');
    const sidebarNameElement = document.getElementById('user-name-sidebar');
    const profileCircle = document.getElementById('profile-circle'); 

    // --- HAMBURGER MENU LOGICA (Behouden voor navigatie) ---
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('.sidebar-nav');
    const mainContent = document.querySelector('.main-content'); 

    if (hamburger && nav) {
        const toggleMenu = () => {
            hamburger.classList.toggle('active');
            nav.classList.toggle('open');
            document.body.classList.toggle('no-scroll');
            if (mainContent) {
                 mainContent.classList.toggle('menu-open-overlay');
            }
        };

        hamburger.addEventListener('click', toggleMenu);

        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                setTimeout(toggleMenu, 100); 
            });
        });
    }

    // --- ALGEMEEN & ACCOUNT LOGICA ---

    /**
     * ✅ NIEUW: Toont een toast-notificatie in plaats van de lokale meldingsbalk.
     * De #toast moet onderaan de body van de HTML aanwezig zijn.
     */
    function showMessage(message, isSuccess) {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        
        // Pas de achtergrondkleur aan voor success of error
        if (isSuccess) {
            toast.style.backgroundColor = '#4CAF50'; // Groen (Succes)
        } else {
            toast.style.backgroundColor = '#f44336'; // Rood (Fout)
        }

        // Toon de toast (door opacity en transform te resetten/activeren)
        toast.style.opacity = 1;
        toast.style.transform = 'translateY(0)';

        // Verberg de toast na 4 seconden
        setTimeout(() => {
            toast.style.opacity = 0;
            // Zorg ervoor dat de toast uit beeld schuift (volgens de stijl in de HTML)
            toast.style.transform = 'translateY(20px)'; 
        }, 4000);
    }

    /**
     * Haalt de basisgegevens op en vult de e-mail, naam en voorletter in.
     */
    async function fetchAccountData() {
        try {
            const response = await fetch('/api/account/data', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                const userName = data.name || 'Gebruiker';
                
                // 1. Vul de e-mail in
                emailDisplay.textContent = data.email || 'Niet beschikbaar';
                
                // 2. Vul de naam in de sidebar
                if (sidebarNameElement) {
                    sidebarNameElement.textContent = userName;
                }

                // 3. Vul de voorletter in de profielcirkel
                if (profileCircle && userName.length > 0) {
                    profileCircle.textContent = userName[0].toUpperCase();
                }
                
                // 4. Vul de naam in het formulier
                const nameInput = document.getElementById('name');
                if (nameInput) {
                    nameInput.value = data.name || '';
                }

            } else if (response.status === 401) {
                 // Niet ingelogd, stuur terug naar login
                 window.location.href = '/login.html';
            } else {
                emailDisplay.textContent = 'Fout bij het laden.';
                showMessage('Fout bij het laden van gebruikersgegevens.', false);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showMessage('Er is een netwerkfout opgetreden bij het laden.', false);
        }
    }

    // Roep de functie aan bij het laden van de pagina
    await fetchAccountData();

    // --- 1. NAAM WIJZIGEN ---
    if (nameUpdateForm) {
        nameUpdateForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const btn = nameUpdateForm.querySelector('button');
            const originalText = btn.textContent;
            
            btn.textContent = 'Bezig...';
            btn.disabled = true;

            try {
                const response = await fetch('/api/account/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                });

                const result = await response.json();

                if (response.ok) {
                    // Update de sidebar naam na succes
                    if (sidebarNameElement) {
                        sidebarNameElement.textContent = name;
                    }
                    // Update de voorletter na succes
                    if (profileCircle && name.length > 0) {
                        profileCircle.textContent = name[0].toUpperCase();
                    }
                    
                    showMessage(result.message || 'Naam succesvol bijgewerkt! ✅', true);
                } else {
                    showMessage(result.message || 'Fout bij het bijwerken van de naam.', false);
                }
            } catch (error) {
                console.error('Naam update error:', error);
                showMessage('Er is een netwerkfout opgetreden bij het opslaan.', false);
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }

    // --- 2. WACHTWOORD WIJZIGEN ---
    if (passwordUpdateForm) {
        passwordUpdateForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const oldPassword = document.getElementById('oldPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value; 
            
            const btn = passwordUpdateForm.querySelector('button');
            const originalText = btn.textContent;
            
            // 1. Eerste Validatie: Zijn alle velden ingevuld?
            if (!oldPassword || !newPassword || !confirmNewPassword) {
                 showMessage('Vul alle wachtwoordvelden in.', false);
                 return; 
            }

            // 2. Validatie: Komen de nieuwe wachtwoorden overeen?
            if (newPassword !== confirmNewPassword) {
                showMessage('De nieuwe wachtwoorden komen niet overeen.', false);
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmNewPassword').value = '';
                return; 
            }


            btn.textContent = 'Bezig...';
            btn.disabled = true;

            try {
                const response = await fetch('/api/account/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ oldPassword, newPassword }) 
                });

                const result = await response.json();

                if (response.ok) {
                    showMessage(result.message || 'Wachtwoord succesvol gewijzigd! ✅', true);
                    
                    // Wis alle velden na succesvolle wijziging
                    document.getElementById('oldPassword').value = '';
                    document.getElementById('newPassword').value = '';
                    document.getElementById('confirmNewPassword').value = '';
                } else {
                    showMessage(result.message || 'Fout bij het wijzigen van het wachtwoord. Controleer je huidige wachtwoord.', false);
                }
            } catch (error) {
                console.error('Password update error:', error);
                showMessage('Er is een netwerkfout opgetreden bij het opslaan.', false);
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }
});