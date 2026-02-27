/* ======================================================
   SpotSkill — Main Entry Point
   Initializes app, wires events, manages state
   ====================================================== */

import './style.css';
import { seedDummyWorkers, getWorkers, getWorker, addWorker, getReviews, addReview } from './data.js';
import { getUserLocation, calculateDistance } from './location.js';
import { renderWorkerCard, renderWorkerDetail, renderCategoryFilters } from './components.js';

// ── App State ──
const state = {
    userLat: null,
    userLng: null,
    activeCategory: 'all',
    sortBy: 'distance',
    workers: [],
};

// ── DOM References ──
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
    workersGrid: $('#workers-grid'),
    emptyState: $('#empty-state'),
    loadingState: $('#loading-state'),
    categoryFilters: $('#category-filters'),
    sortSelect: $('#sort-select'),
    btnDetectLocation: $('#btn-detect-location'),
    locationStatus: $('#location-status'),
    manualLocationArea: $('#manual-location-area'),
    inputManualLocation: $('#input-manual-location'),
    btnManualSearch: $('#btn-manual-search'),
    btnAddWorker: $('#btn-add-worker'),
    modalWorkerDetail: $('#modal-worker-detail'),
    modalDetailBody: $('#modal-detail-body'),
    btnCloseDetail: $('#btn-close-detail'),
    modalAddWorker: $('#modal-add-worker'),
    btnCloseAddWorker: $('#btn-close-add-worker'),
    formAddWorker: $('#form-add-worker'),
    workerImage: $('#worker-image'),
    imagePreview: $('#image-preview'),
    imagePlaceholder: $('#image-upload-placeholder'),
    workerLat: $('#worker-lat'),
    workerLng: $('#worker-lng'),
    workerLocationHint: $('#worker-location-hint'),
};

// ── Toast System ──
function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `${type === 'success' ? '✅' : '❌'} ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('leaving');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ── Modal Helpers ──
function openModal(modalEl) {
    modalEl.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalEl) {
    modalEl.classList.remove('open');
    document.body.style.overflow = '';
}

// ── Render Workers Grid ──
function renderWorkers() {
    dom.loadingState.style.display = 'none';
    let workers = getWorkers();

    // Filter by category
    if (state.activeCategory !== 'all') {
        workers = workers.filter(w => w.category === state.activeCategory);
    }

    // Add computed distance
    workers = workers.map(w => {
        let distance = Infinity;
        if (state.userLat != null && state.userLng != null) {
            distance = calculateDistance(state.userLat, state.userLng, w.latitude, w.longitude);
        }
        return { ...w, _distance: distance };
    });

    // Sort
    switch (state.sortBy) {
        case 'distance':
            workers.sort((a, b) => a._distance - b._distance || b.rating_avg - a.rating_avg);
            break;
        case 'rating':
            workers.sort((a, b) => b.rating_avg - a.rating_avg || a._distance - b._distance);
            break;
        case 'newest':
            workers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
    }

    if (workers.length === 0) {
        dom.workersGrid.innerHTML = '';
        dom.emptyState.style.display = 'block';
        return;
    }

    dom.emptyState.style.display = 'none';
    dom.workersGrid.innerHTML = workers
        .map(w => renderWorkerCard(w, state.userLat, state.userLng))
        .join('');

    // Attach click & keyboard handlers to cards
    dom.workersGrid.querySelectorAll('.worker-card').forEach(card => {
        const handler = () => openWorkerDetail(card.dataset.workerId);
        card.addEventListener('click', handler);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handler();
            }
        });
    });
}

// ── Render Category Filters ──
function renderFilters() {
    dom.categoryFilters.innerHTML = renderCategoryFilters(state.activeCategory);

    dom.categoryFilters.querySelectorAll('.filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            state.activeCategory = btn.dataset.category;
            renderFilters();
            renderWorkers();
        });
    });
}

// ── Open Worker Detail Modal ──
function openWorkerDetail(workerId) {
    const worker = getWorker(workerId);
    if (!worker) return;

    const reviews = getReviews(workerId);
    dom.modalDetailBody.innerHTML = renderWorkerDetail(worker, reviews, state.userLat, state.userLng);
    openModal(dom.modalWorkerDetail);

    // Star selector interaction
    let selectedRating = 0;
    const stars = dom.modalDetailBody.querySelectorAll('.star-selector__star');
    stars.forEach(star => {
        star.addEventListener('mouseenter', () => {
            const val = parseInt(star.dataset.star);
            stars.forEach(s => {
                const sv = parseInt(s.dataset.star);
                s.textContent = sv <= val ? '★' : '☆';
                s.classList.toggle('active', sv <= val);
            });
        });

        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.star);
            stars.forEach(s => {
                const sv = parseInt(s.dataset.star);
                s.textContent = sv <= selectedRating ? '★' : '☆';
                s.classList.toggle('active', sv <= selectedRating);
            });
        });
    });

    // Reset on mouse leave
    const starSelector = dom.modalDetailBody.querySelector('.star-selector');
    if (starSelector) {
        starSelector.addEventListener('mouseleave', () => {
            stars.forEach(s => {
                const sv = parseInt(s.dataset.star);
                s.textContent = sv <= selectedRating ? '★' : '☆';
                s.classList.toggle('active', sv <= selectedRating);
            });
        });
    }

    // Submit review
    const btnSubmitReview = dom.modalDetailBody.querySelector('#btn-submit-review');
    if (btnSubmitReview) {
        btnSubmitReview.addEventListener('click', () => {
            if (selectedRating === 0) {
                showToast('Please select a star rating.', 'error');
                return;
            }
            const reviewText = dom.modalDetailBody.querySelector('#review-text').value.trim();
            addReview(workerId, selectedRating, reviewText);
            showToast('Review submitted!');

            // Re-render modal content
            const updatedWorker = getWorker(workerId);
            const updatedReviews = getReviews(workerId);
            dom.modalDetailBody.innerHTML = renderWorkerDetail(updatedWorker, updatedReviews, state.userLat, state.userLng);
            renderWorkers();

            // Re-attach star handlers (since we re-rendered)
            openWorkerDetail(workerId);
        });
    }
}

// ── Location Detection ──
async function detectLocation() {
    dom.locationStatus.textContent = 'Detecting your location...';
    dom.locationStatus.className = 'hero__location-status';

    try {
        const pos = await getUserLocation();
        state.userLat = pos.latitude;
        state.userLng = pos.longitude;
        dom.locationStatus.textContent = `📍 Location detected (${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)})`;
        dom.locationStatus.className = 'hero__location-status';

        // Update add worker form location
        dom.workerLat.value = pos.latitude;
        dom.workerLng.value = pos.longitude;
        dom.workerLocationHint.textContent = `📍 Using your location (${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)})`;

        showToast('Location detected! Workers sorted by distance.');
        renderWorkers();
    } catch (err) {
        dom.locationStatus.textContent = err.message;
        dom.locationStatus.className = 'hero__location-status error';
        dom.manualLocationArea.style.display = 'flex';
        showToast(err.message, 'error');
    }
}

// ── Manual Location Search (geocoding via Nominatim) ──
async function searchManualLocation() {
    const query = dom.inputManualLocation.value.trim();
    if (!query) return;

    dom.locationStatus.textContent = 'Searching location...';
    dom.locationStatus.className = 'hero__location-status';

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
            { headers: { 'Accept': 'application/json' } }
        );
        const results = await response.json();

        if (results.length === 0) {
            dom.locationStatus.textContent = 'Location not found. Please try a different search.';
            dom.locationStatus.className = 'hero__location-status error';
            return;
        }

        const place = results[0];
        state.userLat = parseFloat(place.lat);
        state.userLng = parseFloat(place.lon);
        dom.locationStatus.textContent = `📍 ${place.display_name.split(',').slice(0, 2).join(',')}`;
        dom.locationStatus.className = 'hero__location-status';

        dom.workerLat.value = state.userLat;
        dom.workerLng.value = state.userLng;
        dom.workerLocationHint.textContent = `📍 Using: ${place.display_name.split(',').slice(0, 2).join(',')}`;

        showToast('Location found! Workers sorted by distance.');
        renderWorkers();
    } catch (err) {
        dom.locationStatus.textContent = 'Failed to search location. Please try again.';
        dom.locationStatus.className = 'hero__location-status error';
    }
}

// ── Image Upload Preview ──
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        dom.imagePreview.src = event.target.result;
        dom.imagePreview.style.display = 'block';
        dom.imagePlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// ── Add Worker Form ──
function handleAddWorkerSubmit(e) {
    e.preventDefault();

    const name = $('#worker-name').value.trim();
    const category = $('#worker-category').value;
    const description = $('#worker-description').value.trim();
    const contact = $('#worker-contact').value.trim();
    const imageUrl = dom.imagePreview.src || '';

    if (!name || !category) {
        showToast('Please fill in the name and category.', 'error');
        return;
    }

    // Use user's location or fallback to default
    const lat = parseFloat(dom.workerLat.value) || state.userLat || 17.385;
    const lng = parseFloat(dom.workerLng.value) || state.userLng || 78.4867;

    addWorker({
        name,
        category,
        image_url: imageUrl,
        latitude: lat,
        longitude: lng,
        description,
        contact,
    });

    showToast(`${name} added successfully!`);
    closeModal(dom.modalAddWorker);
    dom.formAddWorker.reset();
    dom.imagePreview.style.display = 'none';
    dom.imagePlaceholder.style.display = 'flex';
    renderWorkers();
}

// ── Initialize App ──
function init() {
    // Seed dummy data
    seedDummyWorkers();

    // Render initial UI
    renderFilters();
    renderWorkers();

    // ── Event Listeners ──
    dom.btnDetectLocation.addEventListener('click', detectLocation);

    dom.btnManualSearch.addEventListener('click', searchManualLocation);
    dom.inputManualLocation.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchManualLocation();
    });

    dom.sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        renderWorkers();
    });

    // Add Worker Modal
    dom.btnAddWorker.addEventListener('click', () => openModal(dom.modalAddWorker));
    dom.btnCloseAddWorker.addEventListener('click', () => closeModal(dom.modalAddWorker));

    // Worker Detail Modal
    dom.btnCloseDetail.addEventListener('click', () => closeModal(dom.modalWorkerDetail));

    // Close modals on overlay click
    [dom.modalWorkerDetail, dom.modalAddWorker].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });

    // Close modals on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal(dom.modalWorkerDetail);
            closeModal(dom.modalAddWorker);
        }
    });

    // Image upload preview
    dom.workerImage.addEventListener('change', handleImageUpload);

    // Add worker form submit
    dom.formAddWorker.addEventListener('submit', handleAddWorkerSubmit);

    // Show manual location fallback link
    dom.btnDetectLocation.insertAdjacentHTML('afterend',
        `<button class="btn btn--ghost" id="btn-show-manual" style="margin-top: var(--space-sm); font-size: var(--text-xs);">Or enter location manually</button>`
    );
    $('#btn-show-manual').addEventListener('click', () => {
        dom.manualLocationArea.style.display = 'flex';
        dom.inputManualLocation.focus();
    });
}

// Start
init();
