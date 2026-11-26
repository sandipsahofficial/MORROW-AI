const destinations = [
  { id: "big-sur", name: "Big Sur, California", location: "CALIFORNIA, USA", type: "Coast", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80", description: "Where the mountains meet the sea, and your to-do list finally feels far away.", price: "$189", rating: "4.9", popularity: 98, distance: "330 mi", season: "April–October", adventure: 4, tags: ["Beach", "Romantic", "Adventure"], detail: "Wake to coastal fog lifting over the Pacific, spend the day on winding trails, and end with dinner under a sky full of stars. This is the long exhale you have been looking for.", duration: "2 nights", bestFor: "Ocean air & slow mornings", attractions: ["Bixby Creek Bridge", "Pfeiffer Beach", "McWay Falls"], activities: ["Coastal hiking", "Tide pooling", "Stargazing"], tip: "Pack layers; the coastal fog can roll in quickly.", coordinates: [36.2704, -121.8081], coordinateSource: "Approximate sample coordinates" },
  { id: "lake-como", name: "Lake Como, Italy", location: "LOMBARDY, ITALY", type: "Coast", image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1000&q=80", description: "Lakeside lunches, little boats, and nowhere in particular to be.", price: "$245", rating: "4.8", popularity: 95, distance: "5,840 mi", season: "May–September", adventure: 2, tags: ["Romantic", "Beach"], detail: "Follow the water between sleepy villages, find your favorite spot for an unhurried lunch, and let the afternoon drift by. A timeless lakeside reset, made for two.", duration: "3 nights", bestFor: "Long lunches & lake swims", attractions: ["Villa del Balbianello", "Bellagio waterfront", "Varenna"], activities: ["Ferry hopping", "Lake swimming", "Garden visits"], tip: "Stay near a ferry stop to explore without a car.", coordinates: [46.016, 9.257], coordinateSource: "Approximate sample coordinates" },
  { id: "pine-hideaway", name: "Pine & Still, Oregon", location: "MOUNT HOOD, USA", type: "Cabin", image: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1000&q=80", description: "A cabin in the trees, a fire that crackles, and the good kind of quiet.", price: "$165", rating: "4.9", popularity: 91, distance: "65 mi", season: "June–October", adventure: 3, tags: ["Nature", "Mountains", "Family"], detail: "Tucked beneath old-growth pines, this cabin is a soft landing after a day outside. Take the forest path, make something warm, and settle into the kind of quiet that stays with you.", duration: "2 nights", bestFor: "Forest trails & fireside evenings", attractions: ["Trillium Lake", "Timberline Lodge", "Mirror Lake Trail"], activities: ["Forest walks", "Paddleboarding", "Cabin cooking"], tip: "Reserve trail parking early on sunny weekends.", coordinates: [45.373, -121.696], coordinateSource: "Approximate sample coordinates" },
  { id: "lisbon", name: "Lisbon, Portugal", location: "LISBON, PORTUGAL", type: "City", image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1000&q=80", description: "Get lost in the tiled lanes. Find yourself over a very long lunch.", price: "$132", rating: "4.7", popularity: 93, distance: "5,420 mi", season: "March–June", adventure: 2, tags: ["Historical", "Romantic", "Family"], detail: "Wander from pastel-colored lanes to tiny neighborhood cafés, catch the late light from a hilltop lookout, and let the city's gentle rhythm set your own.", duration: "3 nights", bestFor: "Good food & aimless wandering", attractions: ["Alfama", "Belém Tower", "São Jorge Castle"], activities: ["Tram rides", "Food markets", "Tile walks"], tip: "Wear comfortable shoes for the steep, tiled lanes.", coordinates: [38.7223, -9.1393], coordinateSource: "Approximate sample coordinates" },
  { id: "lake-crescent", name: "Lake Crescent, Washington", location: "OLYMPIC PENINSULA, USA", type: "Nature", image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1000&q=80", description: "Deep blue water, cedar-scented trails, and room to breathe.", price: "$148", rating: "4.8", popularity: 89, distance: "120 mi", season: "May–September", adventure: 4, tags: ["Nature", "Mountains", "Family", "Adventure"], detail: "Spend the morning paddling glassy water, then follow a moss-lined trail into the forest. The lake is impossibly blue, the air smells like cedar, and the pace is entirely yours.", duration: "2 nights", bestFor: "Paddling & quiet trails", attractions: ["Marymere Falls", "Lake Crescent Lodge", "Mount Storm King"], activities: ["Kayaking", "Waterfall hikes", "Wildlife watching"], tip: "Bring water shoes for the rocky shoreline.", coordinates: [48.058, -123.798], coordinateSource: "Approximate sample coordinates" },
  { id: "copenhagen", name: "Copenhagen, Denmark", location: "CAPITAL REGION, DENMARK", type: "City", image: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1000&q=80", description: "Good design, warm bakeries, and the pleasure of taking your time.", price: "$210", rating: "4.8", popularity: 90, distance: "5,910 mi", season: "May–September", adventure: 1, tags: ["Historical", "Family"], detail: "Pick up a pastry, borrow a bike, and explore the city one easy neighborhood at a time. Thoughtful design and even more thoughtful coffee make this a lovely change of scene.", duration: "2 nights", bestFor: "Design, bikes & bakeries", attractions: ["Nyhavn", "Tivoli Gardens", "Rosenborg Castle"], activities: ["Canal tours", "Cycling", "Bakery crawl"], tip: "Rent a bike; the city is built for two wheels.", coordinates: [55.6761, 12.5683], coordinateSource: "Approximate sample coordinates" }
];

const pageNames = { home: "Overview", explore: "Explore", saved: "Saved places", testing: "Prototype test", trips: "My trips", planner: "Trip planner", trip: "Trip details", compare: "Compare places", assistant: "Travel assistant", "smart-plan": "Smart itinerary", weather: "Weather", map: "Map explorer", groups: "Group trips", checklist: "Trip checklist", journal: "Travel journal", finance: "Money insights", profile: "Your profile" };
const safeArray = (value) => Array.isArray(value) ? value : [];
function normalizeTrips(value) {
  return safeArray(value).map((trip, index) => {
    if (!trip || typeof trip !== "object") return null;
    const destination = destinations.find((place) => place.id === trip.destinationId || place.id === trip.id);
    if (!destination) return null;
    const legacy = !trip.destinationId;
    const departure = trip.departure || trip.date || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    const duration = Number.parseInt(destination.duration, 10) || 2;
    const returnDate = trip.return || new Date(new Date(`${departure}T12:00:00`).getTime() + duration * 86400000).toISOString().slice(0, 10);
    if (!Number.isFinite(Date.parse(`${departure}T12:00:00`)) || !Number.isFinite(Date.parse(`${returnDate}T12:00:00`)) || returnDate <= departure) return null;
    const itinerary = safeArray(trip.itinerary).filter((activity) =>
      activity && typeof activity === "object" && activity.title && activity.date >= departure && activity.date <= returnDate
      && /^\d{2}:\d{2}$/.test(activity.time || "")
    ).map((activity, activityIndex) => ({
      id: String(activity.id || `activity-${index}-${activityIndex}`), title: String(activity.title).slice(0, 80),
      date: activity.date, time: activity.time, description: String(activity.description || "").slice(0, 180)
    }));
    const expenses = safeArray(trip.expenses).filter((expense) =>
      expense && typeof expense === "object" && Number.isFinite(Number(expense.amount)) && Number(expense.amount) > 0
      && ["Transportation", "Accommodation", "Food", "Activities", "Shopping", "Other"].includes(expense.category)
    ).map((expense, expenseIndex) => ({
      id: String(expense.id || `expense-${index}-${expenseIndex}`), title: String(expense.title || "Expense").slice(0, 80),
      category: expense.category, amount: Number(expense.amount), date: String(expense.date || departure)
    }));
    return {
      ...trip, id: String(trip.id || `trip-${Date.now()}-${index}`), destinationId: destination.id,
      departure, return: returnDate, travelers: Number(trip.travelers) > 0 ? Number(trip.travelers) : 2,
      transport: trip.transport || "Car", budget: Number(trip.budget) > 0 ? Number(trip.budget) : Number(destination.price.replace("$", "")) * duration * 2,
      preferences: safeArray(trip.preferences || (trip.style ? [trip.style] : [])),
      status: trip.status || (new Date(departure) >= new Date(new Date().toDateString()) ? "Upcoming" : "Completed"),
      itinerary, expenses, legacy
    };
  }).filter(Boolean);
}
const state = {
  route: "home",
  selectedRating: 0,
  search: "",
  filter: "all",
  sortNewestFirst: false,
  saved: safeArray(readStorage("morrow-saved", [])),
  trips: normalizeTrips(readStorage("morrow-trips", [])),
  feedback: safeArray(readStorage("morrow-feedback", [])).filter((item) => item && Number.isInteger(Number(item.rating)) && Number(item.rating) >= 1 && Number(item.rating) <= 5).map((item) => ({ rating: Number(item.rating), comment: String(item.comment || "").slice(0, 500), date: String(item.date || "") })),
  completedTasks: safeArray(readStorage("morrow-tasks", [])),
  compare: safeArray(readStorage("morrow-compare", [])).slice(0, 3),
  recent: safeArray(readStorage("morrow-recent", [])).slice(0, 6),
  profile: (() => {
    const profile = readStorage("morrow-profile", {});
    return profile && typeof profile === "object" && !Array.isArray(profile)
      ? { name: String(profile.name || "Sam Taylor").slice(0, 40), travelType: String(profile.travelType || "A little of everything"), budget: Number(profile.budget) > 0 ? Number(profile.budget) : 1200, lastCategory: String(profile.lastCategory || "") }
      : { name: "Sam Taylor", travelType: "A little of everything", budget: 1200, lastCategory: "" };
  })(),
  selectedTripId: null,
  editingTripId: null,
  editingActivityId: null,
  editingExpenseId: null,
  theme: readStorage("morrow-theme", "light"),
  modalReturnFocus: null
};
writeStorage("morrow-trips", state.trips);

function readStorage(key, fallback) {
  try {
    const stored = JSON.parse(localStorage.getItem(key));
    return stored === null ? fallback : stored;
  } catch (error) {
    console.warn(`Could not read ${key} from local storage.`, error);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Could not save ${key} to local storage.`, error);
    showToast("Your browser couldn't save this change.");
  }
}

function navigate(route, options = {}) {
  if (!pageNames[route] || !document.getElementById(`view-${route}`)) {
    if (route === "profile") {
      openProfile();
      return;
    }
    return;
  }
  if (state.route !== route && !options.fromHistory) {
    history.pushState({ route }, "", `#${route}`);
  }
  state.route = route;
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === `view-${route}`));
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.classList.toggle("active", button.dataset.route === route);
    if (button.matches(".nav-link")) button.setAttribute("aria-current", button.dataset.route === route ? "page" : "false");
  });
  document.getElementById("breadcrumb-current").textContent = pageNames[route];
  if (route === "saved") renderSaved();
  if (route === "explore") renderDestinations();
  if (route === "testing") renderFeedback();
  if (route === "home") { renderUpcoming(); renderAnalytics(); }
  if (route === "trips") renderTrips();
  if (route === "planner") renderPlanner();
  if (route === "trip") renderTripDetail();
  if (route === "compare") renderComparison();
  if (window.Morrow3) window.Morrow3.renderRoute(route);
  const toolsMenu = document.getElementById("mobile-tools-menu");
  if (toolsMenu) {
    toolsMenu.hidden = true;
    document.querySelector('[data-action="mobile-tools"]')?.setAttribute("aria-expanded", "false");
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderDateAndGreeting() {
  const now = new Date();
  document.getElementById("today-label").textContent = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(now).toUpperCase();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  document.getElementById("greeting-text").textContent = greeting;
  document.getElementById("explore-count").textContent = destinations.length;
}

function markTask(task) {
  if (!state.completedTasks.includes(task)) {
    state.completedTasks.push(task);
    writeStorage("morrow-tasks", state.completedTasks);
  }
  document.querySelectorAll(".task-row").forEach((row) => row.classList.toggle("completed", state.completedTasks.includes(row.dataset.task)));
}

function destinationCard(place) {
  const saved = state.saved.includes(place.id);
  const compared = state.compare.includes(place.id);
  return `<article class="destination-card">
    <div class="destination-image-wrap" data-action="details" data-id="${place.id}">
      <img class="destination-image" src="${place.image}" alt="${place.name}" loading="lazy">
      <span class="destination-tag">${place.type.toUpperCase()} · ${place.duration.toUpperCase()}</span>
      <button class="save-button${saved ? " saved" : ""}" data-action="save" data-id="${place.id}" aria-label="${saved ? "Remove " + place.name + " from saved places" : "Save " + place.name}" aria-pressed="${saved}">${saved ? "♥" : "♡"}</button>
    </div>
    <div class="destination-info">
      <div class="destination-location"><span>${place.location}</span><span class="rating">★ ${place.rating}</span></div>
      <h3>${place.name}</h3><p>${place.description}</p>
      <div class="destination-bottom"><span class="price-copy">From <strong>${place.price}</strong> / night</span><button class="details-link" data-action="details" data-id="${place.id}">The feeling <span aria-hidden="true">→</span></button></div>
      <label class="compare-check"><input type="checkbox" data-action="compare-toggle" data-id="${place.id}" ${compared ? "checked" : ""}> Compare</label>
    </div>
  </article>`;
}

function visibleDestinations() {
  let list = destinations.filter((place) => {
    const matchesType = state.filter === "all" || place.type === state.filter;
    const query = state.search.toLowerCase().trim();
    const matchesQuery = !query || `${place.name} ${place.location} ${place.description} ${place.type} ${place.bestFor} ${place.tags.join(" ")} ${place.activities.join(" ")}`.toLowerCase().includes(query);
    const maxBudget = document.getElementById("budget-filter")?.value || "all";
    const nights = Number.parseInt(place.duration, 10);
    const maxNights = document.getElementById("duration-filter")?.value || "all";
    const mood = document.getElementById("mood-filter")?.value || "all";
    const adventure = document.getElementById("adventure-filter")?.value || "all";
    const matchesBudget = maxBudget === "all" || Number(place.price.replace("$", "")) <= Number(maxBudget);
    const matchesDuration = maxNights === "all" || nights === Number(maxNights);
    const matchesMood = mood === "all" || place.type === mood || place.tags.includes(mood);
    const matchesAdventure = adventure === "all" || place.adventure === Number(adventure);
    return matchesType && matchesQuery && matchesBudget && matchesDuration && matchesMood && matchesAdventure;
  });
  const sort = document.getElementById("sort-filter")?.value || "curated";
  if (sort === "popular") list.sort((a, b) => b.popularity - a.popularity);
  if (sort === "budget") list.sort((a, b) => Number(a.price.replace("$", "")) - Number(b.price.replace("$", "")));
  if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  if (state.sortNewestFirst && sort === "curated") list.reverse();
  return list;
}

function renderDestinations() {
  const list = visibleDestinations();
  document.getElementById("destination-grid").innerHTML = list.map(destinationCard).join("");
  document.getElementById("results-count").textContent = `(${list.length})`;
  document.getElementById("empty-results").classList.toggle("hidden", list.length > 0);
  document.getElementById("destination-grid").classList.toggle("hidden", list.length === 0);
  document.getElementById("place-search").value = state.search;
  document.getElementById("type-filter").value = state.filter;
  document.querySelector(".sort-control").innerHTML = `${state.sortNewestFirst ? "A different perspective" : "Curated for you"} <span>⌄</span>`;
  document.getElementById("compare-count").textContent = state.compare.length;
  const picker = document.getElementById("compare-picker");
  if (picker) picker.innerHTML = destinations.filter((place) => !state.compare.includes(place.id)).map((place) => `<option value="${place.id}">${place.name}</option>`).join("") || `<option value="">All places selected</option>`;
}

function renderSaved() {
  const list = destinations.filter((place) => state.saved.includes(place.id));
  document.getElementById("saved-grid").innerHTML = list.map(destinationCard).join("");
  document.getElementById("saved-page-count").textContent = `(${list.length})`;
  document.getElementById("saved-grid").classList.toggle("hidden", list.length === 0);
  document.getElementById("empty-saved").classList.toggle("hidden", list.length > 0);
  document.querySelectorAll(".saved-count").forEach((count) => count.textContent = list.length);
  document.querySelectorAll(".nav-count.saved-count").forEach((count) => count.textContent = list.length);
}

function renderUpcoming() {
  const container = document.getElementById("upcoming-content");
  const trip = [...state.trips].sort((a, b) => a.departure.localeCompare(b.departure)).find((item) => item.status !== "Completed");
  if (!trip) {
    container.innerHTML = `<div class="upcoming-empty"><span>No plans on the calendar just yet.</span><button class="text-link" data-route="explore">Find a place to start <span>→</span></button></div>`;
    return;
  }
  const place = destinations.find((item) => item.id === trip.destinationId);
  if (!place) return;
  container.innerHTML = `<img class="upcoming-thumb" src="${place.image}" alt=""><div class="upcoming-text"><strong>${place.name}</strong><span>${trip.departure ? `Starting ${formatDate(trip.departure)}` : "Your next escape is taking shape"} · ${tripDays(trip)} nights</span></div>`;
}

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function toggleSaved(id) {
  if (state.saved.includes(id)) {
    state.saved = state.saved.filter((item) => item !== id);
    showToast("Removed from your little list.");
  } else {
    state.saved.push(id);
    markTask("save");
    showToast("Saved for a sunnier day.");
  }
  writeStorage("morrow-saved", state.saved);
  renderAnalytics();
  renderSaved();
  renderDestinations();
}

function openDetails(id) {
  const place = destinations.find((item) => item.id === id);
  if (!place) return;
  markTask("search");
  state.recent = [id, ...state.recent.filter((item) => item !== id)].slice(0, 6);
  writeStorage("morrow-recent", state.recent);
  renderAnalytics();
  state.modalReturnFocus = document.activeElement;
  const planned = state.trips.some((trip) => trip.destinationId === id);
  document.getElementById("modal-content").innerHTML = `<img class="modal-image" src="${place.image}" alt="${place.name}">
    <div class="modal-body"><p class="eyebrow">${place.location} · ${place.type.toUpperCase()}</p><h2 id="modal-title">${place.name}</h2><p>${place.detail}</p>
      <div class="modal-meta"><span>✳ ${place.duration}</span><span>★ ${place.rating} guest feeling</span><span>From ${place.price} / night</span></div>
      <div class="destination-facts"><span><strong>Best time</strong>${place.season}</span><span><strong>Travel distance</strong>${place.distance}</span><span><strong>Best for</strong>${place.bestFor}</span></div>
      <p><strong>Places to linger:</strong> ${place.attractions.join(" · ")}</p><p><strong>Try:</strong> ${place.activities.join(" · ")}</p><p class="travel-tip"><strong>A little tip:</strong> ${place.tip}</p>
      <div class="related-places"><strong>A few more like this</strong><div>${destinations.filter((item) => item.id !== place.id && (item.type === place.type || item.tags.some((tag) => place.tags.includes(tag)))).slice(0, 2).map((item) => `<button class="text-link" data-action="details" data-id="${item.id}">${item.name} →</button>`).join("")}</div></div>
      <div class="modal-actions"><button class="button button-outline" data-action="save" data-id="${place.id}">${state.saved.includes(place.id) ? "♥ Saved" : "♡ Save for later"}</button><button class="button button-dark" data-action="plan" data-id="${place.id}">${planned ? "Already on your list ✓" : "Make it a plan ↗"}</button></div>
    </div>`;
  state.profile.lastCategory = place.type;
  writeStorage("morrow-profile", state.profile);
  showModal();
}

function showPlanForm(id) {
  const place = destinations.find((item) => item.id === id);
  if (!place) return;
  state.modalReturnFocus = document.activeElement;
  const soon = new Date();
  soon.setDate(soon.getDate() + 14);
  const departure = soon.toISOString().slice(0, 10);
  state.editingTripId = null;
  navigate("planner");
  const form = document.getElementById("planner-form");
  form.reset();
  form.elements.tripId.value = "";
  form.elements.destination.value = place.id;
  form.elements.departure.value = departure;
  form.elements.return.value = new Date(soon.getTime() + (parseInt(place.duration, 10) || 2) * 86400000).toISOString().slice(0, 10);
  form.elements.budget.value = Number(place.price.replace("$", "")) * (parseInt(place.duration, 10) || 2) * 2;
}

function showModal() {
  const backdrop = document.getElementById("modal-backdrop");
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  window.setTimeout(() => backdrop.querySelector(".modal-close").focus(), 40);
}

function closeModal() {
  const backdrop = document.getElementById("modal-backdrop");
  if (!backdrop.classList.contains("open")) return;
  backdrop.classList.remove("open");
  backdrop.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (state.modalReturnFocus && typeof state.modalReturnFocus.focus === "function") state.modalReturnFocus.focus();
}

function showToast(message) {
  const region = document.getElementById("toast-region");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span class="toast-icon">✳</span><span></span>`;
  toast.lastElementChild.textContent = message;
  region.appendChild(toast);
  window.setTimeout(() => {
    toast.classList.add("leaving");
    window.setTimeout(() => toast.remove(), 220);
  }, 2900);
}

function renderComparison() {
  const places = state.compare.map((id) => destinations.find((place) => place.id === id)).filter(Boolean);
  document.getElementById("empty-compare").classList.toggle("hidden", places.length > 0);
  document.getElementById("comparison-table").classList.toggle("hidden", places.length === 0);
  document.getElementById("comparison-table").innerHTML = places.length ? `<div class="comparison-grid"><div class="comparison-labels"><span>DESTINATION</span><span>EST. BUDGET / NIGHT</span><span>DISTANCE</span><span>RECOMMENDED STAY</span><span>TRAVEL TYPE</span><span>BEST SEASON</span><span>ACTIVITIES</span><span></span></div>${places.map((place) => `<article class="comparison-place"><button class="compare-remove" data-action="remove-compare" data-id="${place.id}" aria-label="Remove ${place.name} from comparison">×</button><img src="${place.image}" alt="${place.name}"><h3>${place.name}</h3><span><strong>${place.price}</strong> / night</span><span>${place.distance}</span><span>${place.duration}</span><span>${place.type} · ${place.tags.slice(0, 2).join(", ")}</span><span>${place.season}</span><span>${place.activities.join(" · ")}</span><button class="button button-outline" data-action="details" data-id="${place.id}">Explore place ↗</button></article>`).join("")}</div>` : "";
  const picker = document.getElementById("compare-picker");
  picker.innerHTML = destinations.filter((place) => !state.compare.includes(place.id)).map((place) => `<option value="${place.id}">${place.name}</option>`).join("") || `<option value="">All places selected</option>`;
}

function openProfile() {
  state.modalReturnFocus = document.activeElement;
  const profile = state.profile;
  document.getElementById("modal-content").innerHTML = `<form class="modal-form" id="profile-form"><p class="eyebrow">YOUR MORROW PROFILE</p><h2 id="modal-title">A little more you.</h2><p>Your preferences stay in this browser and help shape your trip suggestions.</p><label for="profile-name">Display name</label><input id="profile-name" name="name" maxlength="40" value="${escapeHtml(profile.name || "Sam Taylor")}" required><label for="profile-type">Preferred travel type</label><select id="profile-type" name="travelType">${["A little of everything", "Coast", "Cabin", "City", "Nature"].map((item) => `<option ${profile.travelType === item ? "selected" : ""}>${item}</option>`).join("")}</select><label for="profile-budget">Preferred trip budget ($)</label><input id="profile-budget" name="budget" type="number" min="1" step="1" value="${Number(profile.budget) || 1200}" required><div class="profile-favorites"><strong>Your favorite places</strong><span>${state.saved.length ? destinations.filter((place) => state.saved.includes(place.id)).map((place) => escapeHtml(place.name)).join(" · ") : "Save places to see them here."}</span></div><div class="profile-favorites"><strong>Previous and upcoming plans</strong><span>${state.trips.length ? state.trips.map((trip) => `${escapeHtml(destinations.find((place) => place.id === trip.destinationId)?.name || "Trip")} · ${escapeHtml(trip.status)}`).join(" | ") : "Your trip plans will show up here."}</span></div><button class="button button-dark" type="submit">Save my preferences <span class="button-arrow">↗</span></button></form>`;
  showModal();
}

function openActivityForm(date = "", activity = null) {
  state.editingActivityId = activity?.id || null;
  const trip = state.trips.find((item) => item.id === state.selectedTripId);
  const defaultDate = date || trip.departure;
  document.getElementById("modal-content").innerHTML = `<form class="modal-form" id="activity-form"><p class="eyebrow">MAKE A LITTLE ROOM FOR FUN</p><h2 id="modal-title">${activity ? "Edit this activity" : "Add to the itinerary"}</h2><label>Activity name<input name="title" maxlength="80" value="${escapeHtml(activity?.title || "")}" required></label><label>Day<input name="date" type="date" min="${trip.departure}" max="${trip.return}" value="${activity?.date || defaultDate}" required></label><label>Time<input name="time" type="time" value="${activity?.time || "10:00"}" required></label><label>A little detail<input name="description" maxlength="180" value="${escapeHtml(activity?.description || "")}" placeholder="A note for future you"></label><button class="button button-dark" type="submit">${activity ? "Save activity" : "Add activity"} <span class="button-arrow">↗</span></button></form>`;
  showModal();
}

function buildTripSummary(trip) {
  const place = destinations.find((item) => item.id === trip.destinationId);
  const total = tripExpenses(trip);
  return `${place.name} | ${formatDate(trip.departure)} to ${formatDate(trip.return)} (${tripDays(trip)} nights) | ${trip.travelers} travellers | ${trip.transport} | Budget $${trip.budget} | Spent $${total} | ${trip.preferences.join(", ") || "No preferences added"}`;
}

function renderFeedback() {
  const average = state.feedback.length ? (state.feedback.reduce((sum, item) => sum + item.rating, 0) / state.feedback.length).toFixed(1) : "—";
  document.getElementById("average-rating").textContent = average;
  document.getElementById("feedback-total").textContent = state.feedback.length;
  document.getElementById("recent-count").textContent = state.feedback.length;
  const container = document.getElementById("feedback-list");
  if (!state.feedback.length) {
    container.innerHTML = `<div class="empty-feedback">No notes yet. Yours could be the first.</div>`;
    return;
  }
  container.innerHTML = [...state.feedback].reverse().slice(0, 5).map((item) => `<article class="feedback-note"><div class="feedback-note-top"><span>${"★".repeat(item.rating)}${"☆".repeat(5 - item.rating)}</span><span class="note-date">${item.date}</span></div>${item.comment ? `<p></p>` : `<p class="note-date">A rating, no note left.</p>`}</article>`).join("");
  [...container.querySelectorAll(".feedback-note p:not(.note-date)")].forEach((paragraph, index) => {
    paragraph.textContent = [...state.feedback].reverse().filter((item) => item.comment).slice(0, 5)[index]?.comment || "";
  });
}

function submitFeedback(event) {
  event.preventDefault();
  if (!state.selectedRating) {
    document.getElementById("feedback-error").classList.remove("hidden");
    document.querySelector(".star-button").focus();
    return;
  }
  const comment = document.getElementById("feedback-comments").value.trim();
  const submitButton = document.querySelector("#feedback-form button[type='submit']");
  submitButton.disabled = true;
  submitButton.innerHTML = `Sending your note <span class="loading-spinner" aria-hidden="true"></span>`;
  window.setTimeout(() => {
    state.feedback.push({ rating: state.selectedRating, comment, date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }) });
    writeStorage("morrow-feedback", state.feedback);
    state.selectedRating = 0;
    document.querySelectorAll(".star-button").forEach((button) => {
      button.classList.remove("selected");
      button.setAttribute("aria-checked", "false");
    });
    document.getElementById("rating-label").textContent = "Choose a rating";
    document.getElementById("feedback-comments").value = "";
    document.getElementById("character-count").textContent = "0 / 500";
    document.getElementById("feedback-error").classList.add("hidden");
    renderFeedback();
    submitButton.disabled = false;
    submitButton.innerHTML = `Send a little feedback <span class="button-arrow">↗</span>`;
    showToast("Thank you. Your note is tucked safely away.");
  }, 450);
}

function setRating(value) {
  state.selectedRating = value;
  const labels = ["Not great", "Could be easier", "It was okay", "Pretty easy", "A lovely little journey"];
  document.querySelectorAll(".star-button").forEach((button) => {
    const selected = Number(button.dataset.rating) <= value;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-checked", Number(button.dataset.rating) === value ? "true" : "false");
  });
  document.getElementById("rating-label").textContent = labels[value - 1];
  document.getElementById("feedback-error").classList.add("hidden");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function tripDays(trip) {
  return Math.max(1, Math.round((new Date(`${trip.return}T12:00:00`) - new Date(`${trip.departure}T12:00:00`)) / 86400000));
}

function tripExpenses(trip) {
  return trip.expenses.reduce((total, expense) => total + (Number(expense.amount) || 0), 0);
}

function renderAnalytics() {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = state.trips.filter((trip) => trip.status !== "Completed" && trip.departure >= today);
  const categories = state.trips.reduce((counts, trip) => {
    const type = destinations.find((place) => place.id === trip.destinationId)?.type;
    if (type) counts[type] = (counts[type] || 0) + 1;
    return counts;
  }, {});
  const favoriteType = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0];
  document.getElementById("stat-saved").textContent = state.saved.length;
  document.getElementById("stat-trips").textContent = state.trips.length;
  document.getElementById("stat-upcoming").textContent = upcoming.length;
  document.getElementById("stat-budget").textContent = `$${state.trips.reduce((total, trip) => total + (Number(trip.budget) || 0), 0).toLocaleString()}`;
  document.getElementById("stat-category").textContent = favoriteType || state.profile.travelType || "—";
  document.getElementById("trip-count").textContent = state.trips.length;
  const recent = state.recent.map((id) => destinations.find((place) => place.id === id)).filter(Boolean);
  document.getElementById("recently-viewed").innerHTML = recent.length
    ? recent.slice(0, 4).map((place) => `<button class="recent-place" data-action="details" data-id="${place.id}"><img src="${place.image}" alt=""><span><strong>${place.name}</strong><small>${place.type} · ${place.duration}</small></span><i>↗</i></button>`).join("")
    : `<p class="recent-empty">Open a destination to start your little list of recent discoveries.</p>`;
  if (window.Morrow3) window.Morrow3.renderDashboard();
}

function renderPlanner() {
  const select = document.getElementById("planner-destination");
  select.innerHTML = destinations.map((place) => `<option value="${place.id}">${place.name}</option>`).join("");
  const form = document.getElementById("planner-form");
  const trip = state.trips.find((item) => item.id === state.editingTripId);
  form.reset();
  form.elements.tripId.value = trip?.id || "";
  if (trip) {
    form.elements.destination.value = trip.destinationId;
    form.elements.departure.value = trip.departure;
    form.elements.return.value = trip.return;
    form.elements.travelers.value = trip.travelers;
    form.elements.transport.value = trip.transport;
    form.elements.budget.value = trip.budget;
    form.querySelectorAll('input[name="preferences"]').forEach((input) => { input.checked = trip.preferences.includes(input.value); });
    document.getElementById("planner-title").innerHTML = `A little edit to your <em>plan.</em>`;
  } else {
    const start = new Date(Date.now() + 14 * 86400000);
    form.elements.departure.value = start.toISOString().slice(0, 10);
    form.elements.return.value = new Date(start.getTime() + 2 * 86400000).toISOString().slice(0, 10);
    form.elements.budget.value = state.profile.budget || 1200;
    const preferenceMatch = destinations.find((place) => place.type === state.profile.travelType);
    if (preferenceMatch) form.elements.destination.value = preferenceMatch.id;
    form.querySelectorAll('input[name="preferences"]').forEach((input) => {
      input.checked = (state.profile.travelType === "Nature" && input.value === "Outdoor time")
        || (state.profile.travelType === "City" && input.value === "Culture & history")
        || (state.profile.travelType === "Coast" && input.value === "Slow mornings");
    });
    document.getElementById("planner-title").innerHTML = `Let's make a <em>little plan.</em>`;
  }
  document.getElementById("planner-error").classList.add("hidden");
}

function renderTrips() {
  const list = [...state.trips].sort((a, b) => a.departure.localeCompare(b.departure));
  document.getElementById("trip-list-count").textContent = `(${list.length})`;
  document.getElementById("trip-list").classList.toggle("hidden", !list.length);
  document.getElementById("empty-trips").classList.toggle("hidden", list.length > 0);
  document.getElementById("trip-list").innerHTML = list.map((trip) => {
    const place = destinations.find((item) => item.id === trip.destinationId);
    return `<article class="trip-card panel"><img src="${place.image}" alt="${place.name}"><div class="trip-card-content"><div class="trip-card-top"><span class="trip-status">${escapeHtml(trip.status)}</span><span>${formatDate(trip.departure)} – ${formatDate(trip.return)}</span></div><h3>${place.name}</h3><p>${tripDays(trip)} nights · ${trip.travelers} travellers · ${escapeHtml(trip.transport)}</p><div class="trip-card-bottom"><span>Estimated <strong>$${Number(trip.budget).toLocaleString()}</strong></span><div><button class="text-link" data-action="edit-trip" data-id="${trip.id}">Edit</button><button class="text-link" data-action="open-trip" data-id="${trip.id}">Itinerary & budget →</button><button class="text-link danger-link" data-action="delete-trip" data-id="${trip.id}">Delete</button></div></div></div></article>`;
  }).join("");
}

function renderTripDetail() {
  const trip = state.trips.find((item) => item.id === state.selectedTripId);
  if (!trip) { navigate("trips"); return; }
  const place = destinations.find((item) => item.id === trip.destinationId);
  const nights = tripDays(trip);
  const days = nights + 1;
  const total = tripExpenses(trip);
  const categories = ["Transportation", "Accommodation", "Food", "Activities", "Shopping", "Other"];
  const categoryTotals = categories.map((name) => trip.expenses.filter((item) => item.category === name).reduce((sum, item) => sum + Number(item.amount), 0));
  const colors = ["#537b63", "#a4b899", "#d9a871", "#7197a0", "#c87e68", "#9d91b3"];
  let chart = 0;
  const gradient = categories.map((_, index) => {
    const start = chart;
    chart += total ? categoryTotals[index] / total * 100 : 0;
    return `${colors[index]} ${start}% ${chart}%`;
  }).join(", ");
  const itinerary = Array.from({ length: days }, (_, day) => {
    const date = new Date(new Date(`${trip.departure}T12:00:00`).getTime() + day * 86400000).toISOString().slice(0, 10);
    const activities = trip.itinerary.filter((activity) => activity.date === date).sort((a, b) => a.time.localeCompare(b.time));
    return `<section class="itinerary-day"><header><span>DAY ${day + 1}</span><strong>${formatDate(date)}</strong><button class="text-link" data-action="add-activity" data-date="${date}">+ Add activity</button></header>${activities.length ? activities.map((activity) => `<article class="activity-row"><time>${escapeHtml(activity.time)}</time><div class="activity-line"></div><div class="activity-copy"><strong>${escapeHtml(activity.title)}</strong><p>${escapeHtml(activity.description || "")}</p></div><div class="activity-actions"><button title="Earlier" aria-label="Move earlier" data-action="move-activity" data-id="${activity.id}" data-direction="-1">↑</button><button title="Later" aria-label="Move later" data-action="move-activity" data-id="${activity.id}" data-direction="1">↓</button><button title="Edit activity" aria-label="Edit activity" data-action="edit-activity" data-id="${activity.id}">✎</button><button title="Delete activity" aria-label="Delete activity" data-action="delete-activity" data-id="${activity.id}">×</button></div></article>`).join("") : `<p class="day-empty">A day with room to wander. Add an activity when inspiration strikes.</p>`}</section>`;
  }).join("");
  document.getElementById("trip-detail").innerHTML = `<div class="trip-detail-hero" style="--trip-image:url('${place.image}')"><button class="text-link back-trips" data-route="trips">← All trips</button><div><span class="trip-status">${escapeHtml(trip.status)}</span><h1 id="trip-detail-title">${place.name}</h1><p>${formatDate(trip.departure)} – ${formatDate(trip.return)} · ${nights} nights · ${trip.travelers} travellers</p></div><div class="trip-hero-actions"><button class="button button-light" data-action="edit-trip" data-id="${trip.id}">Edit trip</button><button class="button button-light" data-action="print-trip">Print / Save PDF</button><button class="button button-light" data-action="share-trip">Share trip</button></div></div>
    <div class="trip-overview-grid"><article class="trip-summary panel"><p class="eyebrow">YOUR ESCAPE, YOUR WAY</p><div class="trip-facts"><span><small>GETTING THERE</small><strong>${escapeHtml(trip.transport)}</strong></span><span><small>TRAVELLERS</small><strong>${trip.travelers}</strong></span><span><small>ESTIMATED BUDGET</small><strong>$${Number(trip.budget).toLocaleString()}</strong></span><span><small>TRIP PREFERENCES</small><strong>${trip.preferences.length ? trip.preferences.map(escapeHtml).join(" · ") : "Open to anything"}</strong></span></div></article><article class="trip-budget-summary panel"><div class="panel-heading"><div><p class="eyebrow">MONEY, MINUS THE MYSTERY</p><h3>Budget check-in</h3></div><button class="text-link" data-action="scroll-budget">Manage →</button></div><div class="budget-progress"><span style="width:${Math.min(100, trip.budget ? total / trip.budget * 100 : 0)}%"></span></div><div class="budget-numbers"><span><strong>$${total.toLocaleString()}</strong> spent</span><span>$${(trip.budget - total).toLocaleString()} left</span></div></article></div>
    <div class="trip-content-grid"><section class="itinerary-section"><div class="section-heading"><div><p class="eyebrow">A GENTLE PLAN, NOT A SCHEDULE</p><h2>Your itinerary</h2></div><button class="button button-outline" data-action="add-activity">+ Add activity</button></div><div class="timeline">${itinerary}</div></section><section class="budget-section panel" id="trip-budget"><div class="panel-heading"><div><p class="eyebrow">KEEP THE NUMBERS COMFY</p><h2>Trip budget</h2></div><button class="button button-dark" data-action="add-expense">+ Add expense</button></div><div class="budget-chart-wrap"><div class="budget-chart" style="background:conic-gradient(${gradient})"><div><strong>$${total.toLocaleString()}</strong><small>SPENT</small></div></div><div class="budget-legend">${categories.map((category, index) => `<span><i style="background:${colors[index]}"></i>${category}<strong>$${categoryTotals[index].toLocaleString()}</strong></span>`).join("")}</div></div><div class="budget-comparison"><span>Estimated <strong>$${Number(trip.budget).toLocaleString()}</strong></span><span>Actual <strong>$${total.toLocaleString()}</strong></span><span>Remaining <strong>$${(trip.budget - total).toLocaleString()}</strong></span></div><div class="expense-list">${trip.expenses.length ? trip.expenses.map((expense) => `<div class="expense-row"><span><strong>${escapeHtml(expense.title)}</strong><small>${escapeHtml(expense.category)} · ${formatDate(expense.date)}</small></span><strong>$${Number(expense.amount).toLocaleString()}</strong><button aria-label="Edit expense" data-action="edit-expense" data-id="${expense.id}">✎</button><button aria-label="Delete expense" data-action="delete-expense" data-id="${expense.id}">×</button></div>`).join("") : `<p class="day-empty">Add an expense to start tracking this trip.</p>`}</div></section></div>`;
}

function renderComparison() {
  const places = state.compare.map((id) => destinations.find((place) => place.id === id)).filter(Boolean);
  document.getElementById("empty-compare").classList.toggle("hidden", places.length > 0);
  document.getElementById("comparison-table").classList.toggle("hidden", places.length === 0);
  document.getElementById("comparison-table").innerHTML = places.length ? `<div class="comparison-grid"><div class="comparison-labels"><span>DESTINATION</span><span>EST. BUDGET / NIGHT</span><span>DISTANCE</span><span>RECOMMENDED STAY</span><span>TRAVEL TYPE</span><span>BEST SEASON</span><span>ACTIVITIES</span><span></span></div>${places.map((place) => `<article class="comparison-place"><button class="compare-remove" data-action="remove-compare" data-id="${place.id}" aria-label="Remove ${place.name} from comparison">×</button><img src="${place.image}" alt="${place.name}"><h3>${place.name}</h3><span><strong>${place.price}</strong> / night</span><span>${place.distance}</span><span>${place.duration}</span><span>${place.type} · ${place.tags.slice(0, 2).join(", ")}</span><span>${place.season}</span><span>${place.activities.join(" · ")}</span><button class="button button-outline" data-action="details" data-id="${place.id}">Explore place ↗</button></article>`).join("")}</div>` : "";
  const picker = document.getElementById("compare-picker");
  picker.innerHTML = destinations.filter((place) => !state.compare.includes(place.id)).map((place) => `<option value="${place.id}">${place.name}</option>`).join("") || `<option value="">All places selected</option>`;
}

function openProfile() {
  state.modalReturnFocus = document.activeElement;
  const profile = state.profile;
  document.getElementById("modal-content").innerHTML = `<form class="modal-form" id="profile-form"><p class="eyebrow">YOUR MORROW PROFILE</p><h2 id="modal-title">A little more you.</h2><p>Your preferences stay in this browser and help shape your trip suggestions.</p><label for="profile-name">Display name</label><input id="profile-name" name="name" maxlength="40" value="${escapeHtml(profile.name || "Sam Taylor")}" required><label for="profile-type">Preferred travel type</label><select id="profile-type" name="travelType">${["A little of everything", "Coast", "Cabin", "City", "Nature"].map((item) => `<option ${profile.travelType === item ? "selected" : ""}>${item}</option>`).join("")}</select><label for="profile-budget">Preferred trip budget ($)</label><input id="profile-budget" name="budget" type="number" min="1" step="1" value="${Number(profile.budget) || 1200}" required><div class="profile-favorites"><strong>Your favorite places</strong><span>${state.saved.length ? destinations.filter((place) => state.saved.includes(place.id)).map((place) => escapeHtml(place.name)).join(" · ") : "Save places to see them here."}</span></div><div class="profile-favorites"><strong>Previous and upcoming plans</strong><span>${state.trips.length ? state.trips.map((trip) => `${escapeHtml(destinations.find((place) => place.id === trip.destinationId)?.name || "Trip")} · ${escapeHtml(trip.status)}`).join(" | ") : "Your trip plans will show up here."}</span></div><button class="button button-dark" type="submit">Save my preferences <span class="button-arrow">↗</span></button></form>`;
  showModal();
}

function openActivityForm(date = "", activity = null) {
  state.editingActivityId = activity?.id || null;
  const trip = state.trips.find((item) => item.id === state.selectedTripId);
  document.getElementById("modal-content").innerHTML = `<form class="modal-form" id="activity-form"><p class="eyebrow">MAKE A LITTLE ROOM FOR FUN</p><h2 id="modal-title">${activity ? "Edit this activity" : "Add to the itinerary"}</h2><label>Activity name<input name="title" maxlength="80" value="${escapeHtml(activity?.title || "")}" required></label><label>Day<input name="date" type="date" min="${trip.departure}" max="${trip.return}" value="${activity?.date || date || trip.departure}" required></label><label>Time<input name="time" type="time" value="${activity?.time || "10:00"}" required></label><label>A little detail<input name="description" maxlength="180" value="${escapeHtml(activity?.description || "")}" placeholder="A note for future you"></label><button class="button button-dark" type="submit">${activity ? "Save activity" : "Add activity"} <span class="button-arrow">↗</span></button></form>`;
  showModal();
}

function openExpenseForm(expense = null) {
  state.editingExpenseId = expense?.id || null;
  const trip = state.trips.find((item) => item.id === state.selectedTripId);
  const date = expense?.date || trip?.departure || new Date().toISOString().slice(0, 10);
  document.getElementById("modal-content").innerHTML = `<form class="modal-form" id="expense-form"><p class="eyebrow">KEEP YOUR BUDGET IN THE PICTURE</p><h2 id="modal-title">${expense ? "Edit an expense" : "Add an expense"}</h2><label>What was it for?<input name="title" maxlength="80" value="${escapeHtml(expense?.title || "")}" required></label><label>Category<select name="category">${["Transportation", "Accommodation", "Food", "Activities", "Shopping", "Other"].map((item) => `<option ${expense?.category === item ? "selected" : ""}>${item}</option>`).join("")}</select></label><label>Amount ($)<input name="amount" type="number" min="0.01" step="0.01" value="${expense?.amount || ""}" required></label><label>Date<input name="date" type="date" min="${trip?.departure || date}" max="${trip?.return || date}" value="${date}" required></label><button class="button button-dark" type="submit">${expense ? "Save expense" : "Add expense"} <span class="button-arrow">↗</span></button></form>`;
  showModal();
}

function buildTripSummary(trip) {
  const place = destinations.find((item) => item.id === trip.destinationId);
  return `${place.name} | ${formatDate(trip.departure)} to ${formatDate(trip.return)} (${tripDays(trip)} nights) | ${trip.travelers} travellers | ${trip.transport} | Budget $${trip.budget} | Spent $${tripExpenses(trip)} | ${trip.preferences.join(", ") || "No preferences added"}`;
}

function handleAction(button) {
  const action = button.dataset.action;
  const id = button.dataset.id;
  if (action === "save") {
    toggleSaved(id);
    if (document.getElementById("modal-backdrop").classList.contains("open")) {
      const place = destinations.find((item) => item.id === id);
      if (place) document.querySelector(".modal-actions [data-action='save']").textContent = `${state.saved.includes(id) ? "♥ Saved" : "♡ Save for later"}`;
    }
  }
  if (action === "details") openDetails(id);
  if (action === "plan") showPlanForm(id);
  if (action === "back") {
    if (history.state && history.state.route) history.back();
    else navigate("home");
  }
  if (action === "forward") history.forward();
  if (action === "notifications") {
    if (window.Morrow3) {
      window.Morrow3.openNotifications();
      return;
    }
    state.modalReturnFocus = button;
    document.getElementById("modal-content").innerHTML = `<div class="notification-modal"><span class="notification-icon">✳</span><p class="eyebrow">A QUIET LITTLE HEADS-UP</p><h2 id="modal-title">Nothing asking for your attention.</h2><p>No missed plans or urgent pings. Just space to dream up the next one.</p><button class="button button-dark" data-action="close-modal">Sounds lovely <span class="button-arrow">↗</span></button></div>`;
    showModal();
  }
  if (action === "profile") {
    openProfile();
  }
  if (action === "search") {
    state.search = document.getElementById("place-search").value;
    state.filter = document.getElementById("type-filter").value;
    markTask("search");
    renderDestinations();
  }
  if (action === "clear-search") {
    state.search = "";
    state.filter = "all";
    document.getElementById("budget-filter").value = "all";
    document.getElementById("duration-filter").value = "all";
    document.getElementById("mood-filter").value = "all";
    document.getElementById("adventure-filter").value = "all";
    document.getElementById("sort-filter").value = "curated";
    state.sortNewestFirst = false;
    renderDestinations();
  }
  if (action === "sort") {
    state.sortNewestFirst = !state.sortNewestFirst;
    renderDestinations();
  }
  if (action === "category") {
    state.filter = button.dataset.category;
    state.search = "";
    navigate("explore");
    renderDestinations();
  }
  if (action === "about") {
    state.modalReturnFocus = button;
    document.getElementById("modal-content").innerHTML = `<div class="notification-modal"><span class="notification-icon">⌂</span><p class="eyebrow">A LITTLE ABOUT MORROW</p><h2 id="modal-title">For the days between the big days.</h2><p>Morrow is a prototype for thoughtful little getaways. We believe the best trips leave room for the unexpected—and the best products leave room for people to shape them.</p><button class="button button-dark" data-route="testing">Help us make it better <span class="button-arrow">↗</span></button></div>`;
    showModal();
  }
  if (action === "new-trip") { state.editingTripId = null; navigate("planner"); }
  if (action === "edit-trip") { state.editingTripId = id; closeModal(); navigate("planner"); }
  if (action === "open-trip") { state.selectedTripId = id; navigate("trip"); }
  if (action === "delete-trip" && window.confirm("Delete this trip and its itinerary and expenses? This cannot be undone.")) {
    state.trips = state.trips.filter((trip) => trip.id !== id);
    writeStorage("morrow-trips", state.trips);
    renderTrips(); renderAnalytics();
    showToast("Trip removed.");
  }
  if (action === "compare-toggle") {
    if (button.checked && state.compare.length >= 3) {
      button.checked = false;
      showToast("Choose up to three places to compare.");
      return;
    }
    state.compare = button.checked ? [...new Set([...state.compare, id])] : state.compare.filter((item) => item !== id);
    writeStorage("morrow-compare", state.compare);
    document.getElementById("compare-count").textContent = state.compare.length;
    renderComparison();
  }
  if (action === "add-compare") {
    const selected = document.getElementById("compare-picker").value;
    if (!selected) return;
    if (state.compare.length >= 3) { showToast("Choose up to three places to compare."); return; }
    if (!state.compare.includes(selected)) state.compare.push(selected);
    writeStorage("morrow-compare", state.compare);
    renderComparison(); renderDestinations();
  }
  if (action === "remove-compare" || action === "clear-compare") {
    state.compare = action === "clear-compare" ? [] : state.compare.filter((item) => item !== id);
    writeStorage("morrow-compare", state.compare);
    renderComparison(); renderDestinations();
  }
  if (action === "add-activity") openActivityForm(button.dataset.date || "");
  if (action === "edit-activity") {
    const trip = state.trips.find((item) => item.id === state.selectedTripId);
    const activity = trip?.itinerary.find((item) => item.id === id);
    if (activity) openActivityForm("", activity);
  }
  if (action === "delete-activity") {
    const trip = state.trips.find((item) => item.id === state.selectedTripId);
    if (trip && window.confirm("Remove this activity from the itinerary?")) {
      trip.itinerary = trip.itinerary.filter((item) => item.id !== id);
      writeStorage("morrow-trips", state.trips); renderTripDetail(); showToast("Activity removed.");
    }
  }
  if (action === "move-activity") {
    const trip = state.trips.find((item) => item.id === state.selectedTripId);
    const activity = trip?.itinerary.find((item) => item.id === id);
    const day = trip?.itinerary.filter((item) => item.date === activity?.date).sort((a, b) => a.time.localeCompare(b.time));
    const index = day?.findIndex((item) => item.id === id) ?? -1;
    const neighbor = day?.[index + Number(button.dataset.direction)];
    if (activity && neighbor) [activity.time, neighbor.time] = [neighbor.time, activity.time];
    if (trip) { writeStorage("morrow-trips", state.trips); renderTripDetail(); }
  }
  if (action === "add-expense") openExpenseForm();
  if (action === "edit-expense") {
    const expense = state.trips.find((trip) => trip.id === state.selectedTripId)?.expenses.find((item) => item.id === id);
    if (expense) openExpenseForm(expense);
  }
  if (action === "delete-expense") {
    const trip = state.trips.find((item) => item.id === state.selectedTripId);
    if (trip && window.confirm("Delete this expense?")) {
      trip.expenses = trip.expenses.filter((item) => item.id !== id);
      writeStorage("morrow-trips", state.trips); renderTripDetail(); showToast("Expense deleted.");
    }
  }
  if (action === "print-trip") window.print();
  if (action === "share-trip") {
    const trip = state.trips.find((item) => item.id === state.selectedTripId);
    if (trip) {
      const text = buildTripSummary(trip);
      if (navigator.share) navigator.share({ title: "My Morrow trip", text }).catch((error) => { if (error.name !== "AbortError") copyTripSummary(text); });
      else copyTripSummary(text);
    }
  }
  if (action === "scroll-budget") document.getElementById("trip-budget").scrollIntoView({ behavior: "smooth" });
  if (action === "theme") toggleTheme();
  if (action === "close-modal") closeModal();
}

function copyTripSummary(text) {
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => showToast("Trip summary copied to your clipboard.")).catch(() => fallbackCopy(text));
  else fallbackCopy(text);
}

function fallbackCopy(text) {
  const field = document.createElement("textarea");
  field.value = text;
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  showToast(copied ? "Trip summary copied to your clipboard." : "Couldn't copy. Try the print option instead.");
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  applyTheme();
  writeStorage("morrow-theme", state.theme);
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  document.querySelectorAll('[data-action="theme"]').forEach((button) => {
    button.textContent = state.theme === "dark" ? "☀" : "☾";
    button.setAttribute("aria-label", `Switch to ${state.theme === "dark" ? "light" : "dark"} theme`);
  });
}

document.addEventListener("click", (event) => {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) {
    event.preventDefault();
    closeModal();
    navigate(routeButton.dataset.route);
    return;
  }
  const actionButton = event.target.closest("[data-action]");
  if (actionButton) {
    handleAction(actionButton);
    if (window.Morrow3) window.Morrow3.handleAction(actionButton);
  }
  const taskRow = event.target.closest("[data-task]");
  if (taskRow) {
    if (taskRow.dataset.task === "search") navigate("explore");
    if (taskRow.dataset.task === "save") {
      navigate("explore");
      showToast("Tap the heart on any place to save it.");
    }
    if (taskRow.dataset.task === "plan") {
      navigate("explore");
      showToast("Open a place to add it to your upcoming escapes.");
    }
  }
  if (event.target.id === "modal-backdrop") closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

document.querySelectorAll(".star-button").forEach((button) => button.addEventListener("click", () => setRating(Number(button.dataset.rating))));
document.getElementById("feedback-form").addEventListener("submit", submitFeedback);
document.getElementById("feedback-comments").addEventListener("input", (event) => {
  document.getElementById("character-count").textContent = `${event.target.value.length} / 500`;
});
document.getElementById("place-search").addEventListener("input", (event) => {
  state.search = event.target.value;
  renderDestinations();
  const input = document.getElementById("place-search");
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
});
document.getElementById("type-filter").addEventListener("change", (event) => {
  state.filter = event.target.value;
  renderDestinations();
});
document.getElementById("modal-content").addEventListener("submit", (event) => {
  const formElement = event.target;
  if (!["profile-form", "activity-form", "expense-form"].includes(formElement.id)) return;
  event.preventDefault();
  const values = new FormData(formElement);
  if (formElement.id === "profile-form") {
    const budget = Number(values.get("budget"));
    if (!Number.isFinite(budget) || budget <= 0) return;
    state.profile = { ...state.profile, name: String(values.get("name")).trim(), travelType: values.get("travelType"), budget };
    writeStorage("morrow-profile", state.profile);
    document.querySelectorAll(".profile-copy strong").forEach((item) => item.textContent = state.profile.name);
    document.querySelectorAll(".avatar, .topbar-avatar").forEach((item) => item.textContent = state.profile.name.slice(0, 1).toUpperCase());
    closeModal(); renderAnalytics(); showToast("Your preferences are saved on this device.");
    return;
  }
  const trip = state.trips.find((item) => item.id === state.selectedTripId);
  if (!trip) return;
  if (formElement.id === "activity-form") {
    const activity = {
      id: state.editingActivityId || `activity-${Date.now()}`, title: String(values.get("title")).trim(),
      date: values.get("date"), time: values.get("time"), description: String(values.get("description")).trim()
    };
    if (activity.date < trip.departure || activity.date > trip.return) {
      formElement.elements.date.setCustomValidity("Choose a day within your trip dates.");
      formElement.reportValidity();
      return;
    }
    const existing = trip.itinerary.find((item) => item.id === state.editingActivityId);
    if (existing) Object.assign(existing, activity); else trip.itinerary.push(activity);
    writeStorage("morrow-trips", state.trips); closeModal(); renderTripDetail();
    showToast(existing ? "Activity updated." : "Activity added to your day.");
    return;
  }
  const amount = Number(values.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) {
    formElement.elements.amount.setCustomValidity("Enter an amount greater than zero.");
    formElement.reportValidity();
    return;
  }
  const expenseDate = String(values.get("date"));
  if (expenseDate < trip.departure || expenseDate > trip.return) {
    formElement.elements.date.setCustomValidity("Choose a date within your trip dates.");
    formElement.reportValidity();
    return;
  }
  const expense = { id: state.editingExpenseId || `expense-${Date.now()}`, title: String(values.get("title")).trim(), category: values.get("category"), amount, date: expenseDate };
  const existing = trip.expenses.find((item) => item.id === state.editingExpenseId);
  if (existing) Object.assign(existing, expense); else trip.expenses.push(expense);
  writeStorage("morrow-trips", state.trips); closeModal(); renderTripDetail(); renderAnalytics();
  showToast(existing ? "Expense updated." : "Expense added.");
});

document.getElementById("planner-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  const values = new FormData(form);
  const departure = String(values.get("departure"));
  const returnDate = String(values.get("return"));
  const travelers = Number(values.get("travelers"));
  const budget = Number(values.get("budget"));
  const error = document.getElementById("planner-error");
  const duration = Math.round((new Date(`${returnDate}T12:00:00`) - new Date(`${departure}T12:00:00`)) / 86400000);
  if (departure < new Date().toISOString().slice(0, 10) || duration < 1 || duration > 30 || !Number.isInteger(travelers) || travelers < 1 || travelers > 20 || !Number.isFinite(budget) || budget <= 0) {
    error.textContent = "Choose a future departure, a return date 1–30 days later, 1–20 travellers, and a positive budget.";
    error.classList.remove("hidden");
    return;
  }
  const place = destinations.find((item) => item.id === values.get("destination"));
  if (!place) return;
  const existing = state.trips.find((trip) => trip.id === values.get("tripId"));
  const trip = {
    ...(existing || {}), id: existing?.id || `trip-${Date.now()}`, destinationId: place.id,
    departure, return: returnDate, travelers, transport: values.get("transport"), budget,
    preferences: values.getAll("preferences"),
    status: departure >= new Date().toISOString().slice(0, 10) ? "Upcoming" : "Completed",
    itinerary: existing?.itinerary || [], expenses: existing?.expenses || [], legacy: false
  };
  if (!existing) place.activities.slice(0, Math.min(3, duration)).forEach((title, index) => {
    const day = new Date(new Date(`${departure}T12:00:00`).getTime() + Math.min(index, duration - 1) * 86400000).toISOString().slice(0, 10);
    trip.itinerary.push({ id: `activity-${Date.now()}-${index}`, title, date: day, time: ["09:30", "13:00", "17:00"][index], description: `A suggested ${place.type.toLowerCase()} moment in ${place.name.split(",")[0]}.` });
  });
  if (existing) state.trips = state.trips.map((item) => item.id === existing.id ? trip : item); else state.trips.push(trip);
  writeStorage("morrow-trips", state.trips);
  state.editingTripId = null; state.selectedTripId = trip.id;
  renderAnalytics(); showToast(existing ? "Your trip plan is updated." : "Your personalized trip is ready.");
  navigate("trip");
});

document.getElementById("place-search").addEventListener("focus", () => {
  if (document.getElementById("search-suggestions")) return;
  const list = document.createElement("datalist");
  list.id = "search-suggestions";
  list.innerHTML = destinations.map((place) => `<option value="${place.name}"></option>`).join("");
  document.getElementById("place-search").setAttribute("list", list.id);
  document.body.appendChild(list);
});
["budget-filter", "duration-filter", "mood-filter", "adventure-filter", "sort-filter"].forEach((id) => document.getElementById(id).addEventListener("change", renderDestinations));
window.addEventListener("popstate", (event) => {
  const route = event.state?.route || location.hash.slice(1) || "home";
  navigate(pageNames[route] ? route : "home", { fromHistory: true });
});

document.querySelectorAll(".task-row").forEach((row) => row.classList.toggle("completed", state.completedTasks.includes(row.dataset.task)));
document.querySelectorAll(".nav-count.saved-count").forEach((count) => count.textContent = state.saved.length);
applyTheme();
document.querySelectorAll(".profile-copy strong").forEach((item) => item.textContent = state.profile.name || "Sam Taylor");
document.querySelectorAll(".avatar, .topbar-avatar").forEach((item) => item.textContent = (state.profile.name || "Sam Taylor").slice(0, 1).toUpperCase());
renderDateAndGreeting();
renderAnalytics();
renderComparison();
const initialRoute = location.hash.slice(1);
if (initialRoute && pageNames[initialRoute]) {
  history.replaceState({ route: initialRoute }, "", `#${initialRoute}`);
  navigate(initialRoute, { fromHistory: true });
} else {
  history.replaceState({ route: "home" }, "", "#home");
  navigate("home", { fromHistory: true });
}
renderFeedback();
