/**
 * MediGrid Nearby Healthcare Controller
 * Handles geolocation, searching, filtering, and modal interactions.
 */

let currentCategory = 'all';
let allResults = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check Authentication Session
    const session = AuthService.getSession();
    if (!session) {
        window.location.href = "auth/login.html";
        return;
    }
    document.getElementById('userGreeting').textContent = `Logged in as: ${session.name}`;

    // 2. Initial Data Fetch
    await loadHealthcareData();
});

async function loadHealthcareData() {
    const searchVal = document.getElementById('searchInput').value;
    const maxDist = parseFloat(document.getElementById('distanceSelect').value);

    const filters = { search: searchVal, maxDistance: maxDist };

    if (currentCategory === 'all') {
        allResults = await NearbyService.getAllHealthcare(filters);
    } else if (currentCategory === 'doctor') {
        allResults = await NearbyService.getNearbyDoctors(filters);
    } else if (currentCategory === 'clinic') {
        allResults = await NearbyService.getNearbyClinics(filters);
    } else if (currentCategory === 'hospital') {
        allResults = await NearbyService.getNearbyHospitals(filters);
    }

    renderResults(allResults);
}

function renderResults(results) {
    const container = document.getElementById('resultsContainer');
    if (results.length === 0) {
        container.innerHTML = `<div style="text-align:center; color: var(--text-secondary); padding: 3rem;">No healthcare providers found matching your criteria.</div>`;
        return;
    }

    container.innerHTML = results.map(item => `
        <div class="healthcare-card">
            <div class="hc-top">
                <div>
                    <div class="hc-title">${item.name}</div>
                    <div class="hc-type">${item.specialization || item.type}</div>
                </div>
                <div class="hc-rating">⭐ ${item.rating}</div>
            </div>
            <div class="hc-details">
                <span>📍 ${item.distance} km away</span>
                <span>🏥 ${item.address}</span>
            </div>
            <div class="hc-status">${item.availability}</div>
            <div class="hc-actions">
                <button class="btn-sm-glass" onclick="openDetails('${item.id}')">View Details</button>
                <button class="btn-sm-cyan" onclick="openDirections('${item.name}', '${item.address}')">Get Directions</button>
            </div>
        </div>
    `).join('');
}

function setCategory(cat, btnElement) {
    currentCategory = cat;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    btnElement.classList.add('active');
    loadHealthcareData();
}

function handleSearch() {
    loadHealthcareData();
}

function handleFilterChange() {
    loadHealthcareData();
}

// Geolocation Handling
function requestGeolocation() {
    const badgeText = document.getElementById('locationStatusText');
    const locBtn = document.getElementById('locBtn');

    if (navigator.geolocation) {
        badgeText.textContent = "Detecting location...";
        navigator.geolocation.getCurrentPosition(
            (position) => {
                badgeText.textContent = "📍 Location detected";
                locBtn.style.display = 'none';
            },
            (error) => {
                badgeText.textContent = "Location access is disabled.";
                locBtn.style.display = 'inline-block';
                locBtn.textContent = "Enable Location";
            }
        );
    } else {
        badgeText.textContent = "Geolocation not supported";
    }
}

// Directions Integration (Opens Google Maps directions)
function openDirections(name, address) {
    const query = encodeURIComponent(`${name}, ${address}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(url, '_blank');
}

// Detail View Modal
async function openDetails(id) {
    const all = await NearbyService.getAllHealthcare();
    const item = all.find(i => i.id === id);
    if (!item) return;

    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div style="font-size: 0.75rem; font-weight: 800; color: var(--cyan-accent); letter-spacing: 1px; margin-bottom: 0.5rem; text-transform: uppercase;">${item.type} Profile</div>
        <h2 style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem;">${item.name}</h2>
        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.2rem;">${item.specialization}</p>
        
        <div style="background: var(--bg-main); border: 1px solid var(--border-glass); padding: 1.2rem; border-radius: 12px; display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.9rem; margin-bottom: 1.5rem;">
            <div><strong>Rating:</strong> ⭐ ${item.rating} / 5.0</div>
            <div><strong>Distance:</strong> 📍 ${item.distance} km away</div>
            <div><strong>Address:</strong> 🏥 ${item.address}</div>
            <div><strong>Contact:</strong> 📞 ${item.contact}</div>
            <div><strong>Status:</strong> <span style="color: var(--success);">${item.availability}</span></div>
        </div>

        <button class="btn-auth" onclick="openDirections('${item.name}', '${item.address}')">Get Directions on Google Maps</button>
    `;

    document.getElementById('detailsModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('detailsModal').style.display = 'none';
}