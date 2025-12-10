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

      if (userNameEl) userNameEl.textContent = data.name;
      if (userNameSidebarEl) userNameSidebarEl.textContent = data.name;
      if (profileCircleEl) profileCircleEl.textContent = data.name.charAt(0).toUpperCase();
    } catch (err) {
      console.error("Fout bij laden gebruikersnaam:", err);
    }
  }

  loadUserName();
});

async function loadNews() {
  const container = document.getElementById("news-container");
  if (!container) return;

  try {
    const res = await fetch("/api/news");
    if (!res.ok) throw new Error("Kon nieuws niet ophalen");

    const news = await res.json();
    container.innerHTML = "";

    news.forEach(item => {
        container.innerHTML += `
            <div class="news-item">
                <img src="${item.image}" alt="Nieuws afbeelding">
                <div class="news-content">
                    <h3>${item.title}</h3>
                    <p>${item.text}</p>
                    </div>
            </div>
        `;
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Kon nieuws niet laden.</p>";
  }
}


loadNews();

// Event listeners
//searchInput.addEventListener("input", filterRecipes);
//dietSelect.addEventListener("change", filterRecipes);

const hamburger = document.getElementById('hamburger-btn');
const sidebarNav = document.querySelector('.sidebar-nav');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  sidebarNav.classList.toggle('open');
});