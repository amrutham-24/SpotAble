/* ======================================================
   SpotSkill — UI Components (Render Functions)
   ====================================================== */

import { getCategoryMeta, CATEGORIES } from './data.js';
import { calculateDistance, formatDistance } from './location.js';

/**
 * Check if a worker is considered "inactive" (>7 days since last verification).
 */
function isInactive(lastVerifiedAt) {
    if (!lastVerifiedAt) return true;
    const diff = Date.now() - new Date(lastVerifiedAt).getTime();
    return diff > 7 * 24 * 60 * 60 * 1000;
}

/**
 * Render star display (read-only) for a given rating.
 */
export function renderStars(rating, maxStars = 5) {
    let html = '';
    const full = Math.floor(rating);
    const half = rating - full >= 0.3;
    for (let i = 1; i <= maxStars; i++) {
        if (i <= full) {
            html += '★';
        } else if (i === full + 1 && half) {
            html += '★'; // simplified — treat half as full in display
        } else {
            html += '☆';
        }
    }
    return html;
}

/**
 * Format a date to a relative time string.
 */
function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

// ── Worker Card ──
export function renderWorkerCard(worker, userLat, userLng) {
    const catMeta = getCategoryMeta(worker.category);
    const inactive = isInactive(worker.last_verified_at);

    let distanceStr = '';
    if (userLat != null && userLng != null) {
        const dist = calculateDistance(userLat, userLng, worker.latitude, worker.longitude);
        distanceStr = formatDistance(dist);
    }

    const availabilityTag = inactive
        ? `<span class="worker-card__availability-tag worker-card__availability-tag--unavailable">Might not be available</span>`
        : `<span class="worker-card__availability-tag worker-card__availability-tag--available">Available</span>`;

    return `
    <article class="worker-card" data-worker-id="${worker.id}" tabindex="0" role="button" aria-label="View ${worker.name}">
      <div class="worker-card__img-wrap">
        <img class="worker-card__img" src="${worker.image_url || 'https://api.dicebear.com/7.x/shapes/svg?seed=default'}" alt="${worker.name}" loading="lazy" />
        <span class="worker-card__category-badge">${catMeta.emoji} ${catMeta.label}</span>
        ${availabilityTag}
      </div>
      <div class="worker-card__body">
        <h3 class="worker-card__name">${worker.name}</h3>
        <div class="worker-card__meta">
          ${distanceStr ? `<span class="worker-card__distance">📍 ${distanceStr}</span>` : ''}
          <span class="worker-card__rating">
            <span class="worker-card__stars">${renderStars(worker.rating_avg)}</span>
            <strong>${worker.rating_avg.toFixed(1)}</strong>
            <span class="worker-card__rating-count">(${worker.rating_count})</span>
          </span>
        </div>
        ${worker.description ? `<p class="worker-card__desc">${worker.description}</p>` : ''}
      </div>
    </article>
  `;
}

// ── Worker Detail Modal Content ──
export function renderWorkerDetail(worker, reviews, userLat, userLng) {
    const catMeta = getCategoryMeta(worker.category);
    const inactive = isInactive(worker.last_verified_at);

    let distanceStr = '';
    if (userLat != null && userLng != null) {
        const dist = calculateDistance(userLat, userLng, worker.latitude, worker.longitude);
        distanceStr = formatDistance(dist);
    }

    const reviewsHtml = reviews.length
        ? reviews.map(r => `
        <div class="review-item">
          <div class="review-item__stars">${renderStars(r.rating)}</div>
          <p class="review-item__text">${r.review_text || '<em>No comment</em>'}</p>
          <p class="review-item__date">${timeAgo(r.created_at)}</p>
        </div>
      `).join('')
        : `<p style="color: var(--text-muted); font-size: var(--text-sm);">No reviews yet. Be the first!</p>`;

    return `
    <img class="detail__img" src="${worker.image_url || 'https://api.dicebear.com/7.x/shapes/svg?seed=default'}" alt="${worker.name}" />
    <div class="detail__content">
      <div class="detail__header">
        <h2 class="detail__name">${worker.name}</h2>
        <span class="detail__category">${catMeta.emoji} ${catMeta.label}</span>
      </div>

      <div class="detail__info">
        <div class="detail__info-item">
          <span class="emoji">⭐</span>
          <span><strong>${worker.rating_avg.toFixed(1)}</strong> (${worker.rating_count} reviews)</span>
        </div>
        ${distanceStr ? `
          <div class="detail__info-item">
            <span class="emoji">📍</span>
            <span>${distanceStr} away</span>
          </div>
        ` : ''}
        <div class="detail__info-item">
          <span class="emoji">${inactive ? '🟠' : '🟢'}</span>
          <span>${inactive ? 'Might not be available' : 'Likely available'}</span>
        </div>
      </div>

      ${worker.description ? `<p class="detail__desc">${worker.description}</p>` : ''}

      ${worker.contact ? `
        <div class="detail__contact">
          📞 ${worker.contact}
        </div>
      ` : ''}

      <div class="reviews-section">
        <h3 class="reviews-section__title">Reviews (${reviews.length})</h3>
        ${reviewsHtml}
      </div>

      <div class="add-review" id="add-review-section" data-worker-id="${worker.id}">
        <h4 class="add-review__title">Leave a Review</h4>
        <div class="star-selector" id="star-selector">
          ${[1, 2, 3, 4, 5].map(n => `<button type="button" class="star-selector__star" data-star="${n}" aria-label="${n} star${n > 1 ? 's' : ''}">☆</button>`).join('')}
        </div>
        <textarea class="input textarea" id="review-text" placeholder="Share your experience..." rows="3"></textarea>
        <button class="btn btn--primary btn--glow" id="btn-submit-review" style="margin-top: var(--space-sm);">Submit Review</button>
      </div>
    </div>
  `;
}

// ── Category Filter Pills ──
export function renderCategoryFilters(activeCategory = 'all') {
    return CATEGORIES.map(cat => {
        const isActive = cat.id === activeCategory;
        return `
      <button
        class="filter-pill ${isActive ? 'filter-pill--active' : ''}"
        data-category="${cat.id}"
        aria-pressed="${isActive}"
      >
        <span class="filter-pill__emoji">${cat.emoji}</span>
        ${cat.label}
      </button>
    `;
    }).join('');
}
