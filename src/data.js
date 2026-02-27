/* ======================================================
   SpotSkill — Data Layer (localStorage Mock)
   Swap this to Supabase by changing the implementations
   ====================================================== */

const STORAGE_KEY_WORKERS = 'spotskill_workers';
const STORAGE_KEY_REVIEWS = 'spotskill_reviews';

// ── Category metadata ──
export const CATEGORIES = [
    { id: 'all', label: 'All', emoji: '🔍' },
    { id: 'cobbler', label: 'Cobbler', emoji: '🥾' },
    { id: 'electrician', label: 'Electrician', emoji: '⚡' },
    { id: 'plumber', label: 'Plumber', emoji: '🔧' },
    { id: 'babysitter', label: 'Babysitter', emoji: '👶' },
    { id: 'street_food', label: 'Street Food', emoji: '🍜' },
];

export function getCategoryMeta(categoryId) {
    return CATEGORIES.find(c => c.id === categoryId) || { id: categoryId, label: categoryId, emoji: '🛠️' };
}

// ── Helpers ──
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function load(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
        return [];
    }
}

function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ── Workers CRUD ──
export function getWorkers() {
    return load(STORAGE_KEY_WORKERS);
}

export function getWorker(id) {
    return getWorkers().find(w => w.id === id) || null;
}

export function addWorker(worker) {
    const workers = getWorkers();
    const now = new Date().toISOString();
    const newWorker = {
        id: generateId(),
        name: worker.name,
        category: worker.category,
        image_url: worker.image_url || '',
        latitude: worker.latitude,
        longitude: worker.longitude,
        description: worker.description || '',
        contact: worker.contact || '',
        rating_avg: 0,
        rating_count: 0,
        last_verified_at: now,
        created_at: now,
    };
    workers.push(newWorker);
    save(STORAGE_KEY_WORKERS, workers);
    return newWorker;
}

// ── Reviews CRUD ──
export function getReviews(workerId) {
    return load(STORAGE_KEY_REVIEWS).filter(r => r.worker_id === workerId);
}

export function addReview(workerId, rating, reviewText) {
    // Save review
    const reviews = load(STORAGE_KEY_REVIEWS);
    const now = new Date().toISOString();
    const newReview = {
        id: generateId(),
        worker_id: workerId,
        rating: rating,
        review_text: reviewText,
        created_at: now,
    };
    reviews.push(newReview);
    save(STORAGE_KEY_REVIEWS, reviews);

    // Update worker's average rating & last_verified_at
    const workers = getWorkers();
    const idx = workers.findIndex(w => w.id === workerId);
    if (idx !== -1) {
        const w = workers[idx];
        const newCount = w.rating_count + 1;
        const newAvg = (w.rating_avg * w.rating_count + rating) / newCount;
        w.rating_avg = Math.round(newAvg * 10) / 10;
        w.rating_count = newCount;
        w.last_verified_at = now;
        save(STORAGE_KEY_WORKERS, workers);
    }

    return newReview;
}

// ── Seed dummy workers ──
export function seedDummyWorkers() {
    if (getWorkers().length > 0) return; // Already seeded

    // Base coords around a generic Indian city center (Hyderabad-ish area)
    const baseLat = 17.385;
    const baseLng = 78.4867;

    const dummyWorkers = [
        {
            name: 'Raju Cobbler',
            category: 'cobbler',
            description: 'Expert shoe repair near the main market. 20+ years of experience with leather work.',
            contact: '9876543210',
            latitude: baseLat + 0.005,
            longitude: baseLng + 0.003,
            rating_avg: 4.5,
            rating_count: 12,
            daysAgo: 2,
        },
        {
            name: 'Suresh Electrician',
            category: 'electrician',
            description: 'Handles wiring, fuse repairs, fan installation. Available on short notice.',
            contact: '9876543211',
            latitude: baseLat - 0.008,
            longitude: baseLng + 0.006,
            rating_avg: 4.2,
            rating_count: 8,
            daysAgo: 1,
        },
        {
            name: 'Lakshmi Street Food',
            category: 'street_food',
            description: 'Famous for dosas and idli. Fresh morning breakfast every day from 6 AM.',
            latitude: baseLat + 0.002,
            longitude: baseLng - 0.004,
            rating_avg: 4.8,
            rating_count: 34,
            daysAgo: 0,
        },
        {
            name: 'Mohan Plumber',
            category: 'plumber',
            description: 'Pipe fitting, leak repair & bathroom fixtures. Reasonable rates.',
            contact: '9876543213',
            latitude: baseLat + 0.012,
            longitude: baseLng + 0.001,
            rating_avg: 3.9,
            rating_count: 6,
            daysAgo: 5,
        },
        {
            name: 'Priya Babysitter',
            category: 'babysitter',
            description: 'Experienced with toddlers & infants. First aid certified. Available weekdays.',
            contact: '9876543214',
            latitude: baseLat - 0.003,
            longitude: baseLng - 0.007,
            rating_avg: 4.7,
            rating_count: 15,
            daysAgo: 3,
        },
        {
            name: 'Arjun Electrician',
            category: 'electrician',
            description: 'Specialist in inverter installation, MCB panel work, and AC servicing.',
            contact: '9876543215',
            latitude: baseLat + 0.009,
            longitude: baseLng - 0.002,
            rating_avg: 4.0,
            rating_count: 10,
            daysAgo: 10, // Inactive — will show "might not be available"
        },
        {
            name: 'Kamala Devi Cobbler',
            category: 'cobbler',
            description: 'Stitching, polishing, and dyeing. Located near bus stand.',
            latitude: baseLat - 0.006,
            longitude: baseLng + 0.009,
            rating_avg: 4.3,
            rating_count: 7,
            daysAgo: 8, // Inactive
        },
        {
            name: 'Ali Bhai Chai Stall',
            category: 'street_food',
            description: 'Best cutting chai & samosas in the area. Open 4 PM – 11 PM.',
            latitude: baseLat + 0.001,
            longitude: baseLng + 0.008,
            rating_avg: 4.6,
            rating_count: 42,
            daysAgo: 0,
        },
        {
            name: 'Venkat Plumber',
            category: 'plumber',
            description: 'Emergency plumbing services. Available 24/7 for urgent calls.',
            contact: '9876543218',
            latitude: baseLat - 0.010,
            longitude: baseLng - 0.005,
            rating_avg: 4.1,
            rating_count: 9,
            daysAgo: 4,
        },
        {
            name: 'Sunita Babysitter',
            category: 'babysitter',
            description: 'Warm and caring. Great with kids aged 2–8. Can help with homework too.',
            contact: '9876543219',
            latitude: baseLat + 0.007,
            longitude: baseLng + 0.005,
            rating_avg: 4.4,
            rating_count: 11,
            daysAgo: 15, // Inactive
        },
    ];

    // Generate placeholder image URLs using DiceBear avatars (works without API key)
    const PLACEHOLDER_IMAGES = [
        'https://api.dicebear.com/7.x/shapes/svg?seed=raju&backgroundColor=0a0e1a&shape1Color=06b6d4',
        'https://api.dicebear.com/7.x/shapes/svg?seed=suresh&backgroundColor=0a0e1a&shape1Color=a855f7',
        'https://api.dicebear.com/7.x/shapes/svg?seed=lakshmi&backgroundColor=0a0e1a&shape1Color=ec4899',
        'https://api.dicebear.com/7.x/shapes/svg?seed=mohan&backgroundColor=0a0e1a&shape1Color=22c55e',
        'https://api.dicebear.com/7.x/shapes/svg?seed=priya&backgroundColor=0a0e1a&shape1Color=fbbf24',
        'https://api.dicebear.com/7.x/shapes/svg?seed=arjun&backgroundColor=0a0e1a&shape1Color=f97316',
        'https://api.dicebear.com/7.x/shapes/svg?seed=kamala&backgroundColor=0a0e1a&shape1Color=14b8a6',
        'https://api.dicebear.com/7.x/shapes/svg?seed=ali&backgroundColor=0a0e1a&shape1Color=8b5cf6',
        'https://api.dicebear.com/7.x/shapes/svg?seed=venkat&backgroundColor=0a0e1a&shape1Color=ef4444',
        'https://api.dicebear.com/7.x/shapes/svg?seed=sunita&backgroundColor=0a0e1a&shape1Color=06b6d4',
    ];

    const now = Date.now();
    const workers = dummyWorkers.map((d, i) => ({
        id: generateId() + i,
        name: d.name,
        category: d.category,
        image_url: PLACEHOLDER_IMAGES[i],
        latitude: d.latitude,
        longitude: d.longitude,
        description: d.description,
        contact: d.contact || '',
        rating_avg: d.rating_avg,
        rating_count: d.rating_count,
        last_verified_at: new Date(now - d.daysAgo * 86400000).toISOString(),
        created_at: new Date(now - (d.daysAgo + 5) * 86400000).toISOString(),
    }));

    save(STORAGE_KEY_WORKERS, workers);

    // Seed a few dummy reviews
    const dummyReviews = [
        { worker_id: workers[0].id, rating: 5, review_text: 'Fixed my shoes perfectly! Very affordable.', daysAgo: 2 },
        { worker_id: workers[0].id, rating: 4, review_text: 'Good work, took a bit long but result was great.', daysAgo: 5 },
        { worker_id: workers[2].id, rating: 5, review_text: 'Best dosa in the area! Must try the coconut chutney.', daysAgo: 0 },
        { worker_id: workers[4].id, rating: 5, review_text: 'My kids love her! Very responsible and caring.', daysAgo: 3 },
        { worker_id: workers[7].id, rating: 4, review_text: 'Great chai, samosas are fresh and crispy.', daysAgo: 1 },
    ];

    const reviews = dummyReviews.map(r => ({
        id: generateId(),
        worker_id: r.worker_id,
        rating: r.rating,
        review_text: r.review_text,
        created_at: new Date(now - r.daysAgo * 86400000).toISOString(),
    }));

    save(STORAGE_KEY_REVIEWS, reviews);
}
