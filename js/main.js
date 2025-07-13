// main.js – InternCrate core logic
// Handles theme, localStorage CRUD, filtering, search, and UI interactivity

const THEME_KEY = 'interncrate-theme';
const STORAGE_KEY = 'interncrate-listings';
const BOOKMARK_KEY = 'interncrate-bookmarks';

// --- Theme Toggle ---
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  const icon = document.querySelector('#theme-toggle i');
  if (icon) icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}
function toggleTheme() {
  const current = localStorage.getItem(THEME_KEY) || 'light';
  setTheme(current === 'dark' ? 'light' : 'dark');
}
document.addEventListener('DOMContentLoaded', () => {
  // Theme
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  setTheme(savedTheme);
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.onclick = toggleTheme;

  // Listings page logic
  if (document.getElementById('listings')) renderListings();
  // Post form logic
  if (document.getElementById('post-form')) setupPostForm();
});

// --- Listings CRUD ---
function getListings() {
  let data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    // Load dummy data on first visit
    try {
      const req = new XMLHttpRequest();
      req.open('GET', 'data/dummy-posts.json', false); // sync for simplicity
      req.send(null);
      if (req.status === 200) {
        const dummy = JSON.parse(req.responseText);
        saveListings(dummy);
        return dummy;
      }
    } catch {}
    return [];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}
function saveListings(listings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
}
function addListing(listing) {
  const listings = getListings();
  listings.unshift(listing); // newest first
  saveListings(listings);
}

// --- Render Listings ---
function renderListings() {
  const listings = getListings();
  const container = document.getElementById('listings');
  if (!container) return;
  let filtered = filterAndSearch(listings);
  filtered = sortListings(filtered);
  container.innerHTML = filtered.length ? filtered.map(listingCardHTML).join('') : '<p>No listings found.</p>';
  // Attach apply and bookmark events
  document.querySelectorAll('.apply-btn').forEach(btn => {
    btn.onclick = () => alert('Application submitted! (simulated)');
  });
  document.querySelectorAll('.bookmark-btn').forEach(btn => {
    btn.onclick = () => toggleBookmark(btn.dataset.id);
    if (isBookmarked(btn.dataset.id)) btn.classList.add('active');
  });
  // Filter/search listeners
  const search = document.getElementById('search-input');
  const skill = document.getElementById('skill-filter');
  const sort = document.getElementById('sort-filter');
  [search, skill, sort].forEach(el => {
    if (el) el.oninput = renderListings;
    if (el && el.tagName === 'SELECT') el.onchange = renderListings;
  });
}
function listingCardHTML(listing) {
  return `<div class="card">
    <div class="card-title">${escapeHTML(listing.title)}</div>
    <div class="card-skills">${listing.skills.map(skill => `<span class="skill-tag">${escapeHTML(skill)}</span>`).join('')}</div>
    <div class="card-details">
      <span><i class="fa-solid fa-clock"></i> ${escapeHTML(listing.duration)} weeks</span>
      <span><i class="fa-solid fa-location-dot"></i> ${escapeHTML(listing.mode)}</span>
      <span><i class="fa-solid fa-user"></i> ${escapeHTML(listing.poster)}</span>
    </div>
    <div class="card-footer">
      <button class="apply-btn">Apply</button>
      <button class="bookmark-btn" data-id="${listing.id}" title="Bookmark"><i class="fa${isBookmarked(listing.id) ? 's' : 'r'} fa-bookmark"></i></button>
    </div>
  </div>`;
}
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s]));
}

// --- Filter, Search, Sort ---
function filterAndSearch(listings) {
  const search = (document.getElementById('search-input')?.value || '').toLowerCase();
  const skill = document.getElementById('skill-filter')?.value;
  return listings.filter(l => {
    const matchesSkill = !skill || l.skills.includes(skill);
    const matchesSearch = !search || l.title.toLowerCase().includes(search);
    return matchesSkill && matchesSearch;
  });
}
function sortListings(listings) {
  const sort = document.getElementById('sort-filter')?.value;
  if (sort === 'shortest') {
    return [...listings].sort((a, b) => a.duration - b.duration);
  }
  // Default: newest
  return listings;
}

// --- Bookmarks ---
function getBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARK_KEY)) || [];
  } catch { return []; }
}
function saveBookmarks(arr) {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(arr));
}
function isBookmarked(id) {
  return getBookmarks().includes(id);
}
function toggleBookmark(id) {
  let bookmarks = getBookmarks();
  if (bookmarks.includes(id)) {
    bookmarks = bookmarks.filter(b => b !== id);
  } else {
    bookmarks.push(id);
  }
  saveBookmarks(bookmarks);
  renderListings();
}

// --- Post Form ---
function setupPostForm() {
  const form = document.getElementById('post-form');
  if (!form) return;
  form.onsubmit = e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    // Validate
    if (!data.title || !data.description || !data.skills || !data.duration || !data.mode || !data.poster) {
      alert('Please fill all fields.');
      return;
    }
    const listing = {
      id: 'id-' + Date.now(),
      title: data.title.trim(),
      description: data.description.trim(),
      skills: data.skills.split(',').map(s => s.trim()).filter(Boolean),
      duration: Number(data.duration),
      mode: data.mode,
      poster: data.poster.trim(),
      createdAt: Date.now()
    };
    addListing(listing);
    window.location.href = 'listings.html';
  };
}
