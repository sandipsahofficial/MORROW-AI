window.Morrow3 = (() => {
  const VERSION = 3;
  const CATEGORIES = ["Documents", "Clothing", "Electronics", "Personal essentials", "Travel accessories", "Emergency essentials"];
  const fallbackEndpoint = "http://localhost:11434";
  const aiSettings = readFeature("morrow-ai-settings", { endpoint: fallbackEndpoint, model: "llama3.2" }, (value) => ({
    endpoint: typeof value.endpoint === "string" && /^https?:\/\//i.test(value.endpoint) ? value.endpoint.replace(/\/+$/, "") : fallbackEndpoint,
    model: typeof value.model === "string" && value.model.trim() ? value.model.trim().slice(0, 80) : "llama3.2"
  }));
  const featureState = {
    messages: readFeature("morrow-chat", [], (value) => Array.isArray(value) ? value.filter((item) => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string").map((item) => ({ role: item.role, content: item.content.slice(0, 5000), source: String(item.source || "").slice(0, 100), timestamp: String(item.timestamp || "").slice(0, 80) })).slice(-100) : []),
    savedPlans: readFeature("morrow-smart-itineraries", [], (value) => Array.isArray(value) ? value.filter((item) => item && typeof item.id === "string" && getPlace(item.destinationId) && Array.isArray(item.days) && item.days.length <= 15 && item.days.every((day) => day && Array.isArray(day.activities))).slice(-30) : []),
    groups: readFeature("morrow-groups", [], (value) => Array.isArray(value) ? value.filter((item) => item && typeof item.id === "string" && typeof item.title === "string" && Array.isArray(item.participants)).map((item) => ({
      ...item,
      participants: item.participants.filter((person) => person && typeof person.id === "string" && typeof person.name === "string").slice(0, 20),
      votes: item.votes && typeof item.votes === "object" && !Array.isArray(item.votes) ? item.votes : {},
      suggestions: Array.isArray(item.suggestions) ? item.suggestions.filter((suggestion) => suggestion && typeof suggestion.id === "string" && typeof suggestion.title === "string").slice(0, 100) : [],
      expenses: Array.isArray(item.expenses) ? item.expenses.filter((expense) => expense && typeof expense.id === "string" && Number.isFinite(Number(expense.amount)) && Number(expense.amount) > 0).slice(0, 200) : []
    })).slice(-40) : []),
    checklists: readFeature("morrow-checklists", {}, (value) => value && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).filter(([, items]) => Array.isArray(items)).map(([tripId, items]) => [tripId, items.filter((item) => item && typeof item.id === "string" && typeof item.title === "string" && CATEGORIES.includes(item.category)).slice(0, 100).map((item) => ({ id: item.id, title: item.title.slice(0, 100), category: item.category, checked: item.checked === true, suggested: item.suggested === true }))])) : {}),
    journal: readFeature("morrow-journal", [], (value) => Array.isArray(value) ? value.filter((item) => item && typeof item.id === "string" && typeof item.title === "string").map((item) => ({
      id: item.id, title: item.title.slice(0, 80), date: /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : dateStamp(),
      description: String(item.description || "").slice(0, 700), tripId: String(item.tripId || ""),
      imageData: typeof item.imageData === "string" && /^data:image\/jpeg;base64,/.test(item.imageData) && item.imageData.length <= 260000 ? item.imageData : ""
    })).slice(-80) : []),
    geocodeCache: readFeature("morrow-map-geocode-cache", {}, (value) => value && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).filter(([, place]) => place && Number.isFinite(Number(place.latitude)) && Math.abs(Number(place.latitude)) <= 90 && Number.isFinite(Number(place.longitude)) && Math.abs(Number(place.longitude)) <= 180).map(([key, place]) => [key, { latitude: Number(place.latitude), longitude: Number(place.longitude), label: String(place.label || "").slice(0, 240) }])) : {})
  };
  let currentPlan = null;
  let selectedChecklistTrip = "";
  let selectedFinanceTrip = "";
  let selectedWeatherPlace = "";
  let assistantBusy = false;
  let leafletMap = null;
  let destinationMarkers = [];
  let attractionMarkers = [];
  let mapTileFailed = false;

  function readFeature(key, fallback, normalize) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return normalize(JSON.parse(raw));
    } catch (error) {
      console.warn(`Could not load ${key}; using an empty local fallback.`, error);
      return fallback;
    }
  }

  function saveFeature(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Could not save ${key}.`, error);
      showToast(error && error.name === "QuotaExceededError" ? "This browser is low on storage. Remove older local entries and try again." : "This browser couldn't save the change.");
      return false;
    }
  }

  function migrateFeatureStorage() {
    const storedVersion = Number(readStorage("morrow-schema-version", 0)) || 0;
    if (storedVersion >= VERSION) return;
    const defaults = [
      ["morrow-ai-settings", aiSettings], ["morrow-chat", featureState.messages],
      ["morrow-smart-itineraries", featureState.savedPlans], ["morrow-groups", featureState.groups],
      ["morrow-checklists", featureState.checklists], ["morrow-journal", featureState.journal],
      ["morrow-map-geocode-cache", featureState.geocodeCache]
    ];
    defaults.forEach(([key, value]) => {
      if (localStorage.getItem(key) === null) saveFeature(key, value);
    });
    saveFeature("morrow-schema-version", VERSION);
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function dateStamp(date = new Date()) {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
  }

  function addDays(value, amount) {
    const date = new Date(`${value}T12:00:00`);
    date.setDate(date.getDate() + amount);
    return dateStamp(date);
  }

  function getPlace(id) {
    return destinations.find((place) => place.id === id);
  }

  function getTrip(id) {
    return state.trips.find((trip) => trip.id === id);
  }

  function populateDestinationSelects() {
    ["smart-plan-destination", "weather-destination", "map-destination", "group-destination"].forEach((id) => {
      const select = document.getElementById(id);
      if (!select) return;
      const keep = select.value;
      select.innerHTML = `${id === "map-destination" ? `<option value="">All destinations</option>` : ""}${destinations.map((place) => `<option value="${esc(place.id)}">${esc(place.name)}</option>`).join("")}`;
      if (keep && getPlace(keep)) select.value = keep;
    });
  }

  function fillTripSelect(select, selected, includeEmpty = false) {
    if (!select) return;
    const value = selected || select.value;
    select.innerHTML = `${includeEmpty ? `<option value="">Personal memory</option>` : ""}${state.trips.map((trip) => {
      const place = getPlace(trip.destinationId);
      return `<option value="${esc(trip.id)}">${esc(place?.name || "Trip")} · ${esc(trip.departure)}</option>`;
    }).join("")}`;
    if (value && getTrip(value)) select.value = value;
    else if (!includeEmpty && state.trips.length) select.value = state.trips[0].id;
  }

  function preferenceTokens() {
    const type = (state.profile.travelType || "").toLowerCase();
    const tokenMap = {
      coast: ["coast", "beach", "water", "romantic"],
      cabin: ["cabin", "nature", "mountains", "forest"],
      city: ["city", "history", "culture", "food"],
      nature: ["nature", "mountains", "adventure", "family"]
    };
    return tokenMap[type] || [];
  }

  function recommendDestinations(limit = destinations.length) {
    const budget = Number(state.profile.budget) || 1200;
    const preference = preferenceTokens();
    const savedTypes = state.saved.map(getPlace).filter(Boolean).map((place) => place.type);
    const tripTypes = state.trips.map((trip) => getPlace(trip.destinationId)?.type).filter(Boolean);
    return destinations.map((place) => {
      const reasons = [];
      let score = place.popularity * 0.12;
      const estimatedStay = Number(place.price.replace("$", "")) * (Number.parseInt(place.duration, 10) || 2) * 2;
      if (estimatedStay <= budget) { score += 24; reasons.push("within your preferred trip-budget range"); }
      if (state.profile.travelType !== "A little of everything" && place.type.toLowerCase() === state.profile.travelType.toLowerCase()) {
        score += 22; reasons.push(`matches your ${place.type.toLowerCase()} preference`);
      }
      const searchable = `${place.type} ${place.tags.join(" ")} ${place.activities.join(" ")} ${place.bestFor}`.toLowerCase();
      const matchingInterest = preference.find((token) => searchable.includes(token));
      if (matchingInterest) { score += 10; reasons.push(`includes ${matchingInterest} experiences`); }
      if (savedTypes.includes(place.type)) { score += 8; reasons.push("similar to a place you saved"); }
      if (tripTypes.includes(place.type)) { score += 6; reasons.push("fits a travel style in your trip history"); }
      if (state.recent.includes(place.id)) { score += 4; reasons.push("you explored this place recently"); }
      if (!reasons.length) reasons.push("a popular option from Morrow's sample catalogue");
      return { place, score, reasons };
    }).sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name)).slice(0, limit);
  }

  function recommendationCard(result, compact = false) {
    const place = result.place;
    return `<article class="recommendation-card${compact ? " compact" : ""}"><img src="${esc(place.image)}" alt="${esc(place.name)}" loading="lazy"><div><p class="eyebrow">${esc(place.type)} · SAMPLE CATALOGUE</p><h4>${esc(place.name)}</h4><p class="recommendation-reasons">${esc(result.reasons.slice(0, 2).join(" · "))}</p><small>From ${esc(place.price)} / night · ${esc(place.duration)}</small><div class="recommendation-actions"><button class="text-link" data-action="details" data-id="${esc(place.id)}">Details →</button><button class="text-link" data-route="weather">Weather</button></div></div></article>`;
  }

  function renderDashboard() {
    const recommendationTarget = document.getElementById("dashboard-recommendations");
    if (!recommendationTarget) return;
    recommendationTarget.innerHTML = recommendDestinations(2).map((item) => recommendationCard(item, true)).join("");
    const nextTrip = [...state.trips].sort((a, b) => a.departure.localeCompare(b.departure)).find((trip) => trip.status !== "Completed");
    const checklistTarget = document.getElementById("dashboard-checklist");
    if (checklistTarget) {
      if (!nextTrip) checklistTarget.innerHTML = `<p class="widget-empty">Plan a trip to get a tailored preparation list.</p>`;
      else {
        const items = featureState.checklists[nextTrip.id] || [];
        const completed = items.filter((item) => item.checked).length;
        checklistTarget.innerHTML = `<p>${completed} of ${items.length} items ready${items.length ? ` · ${Math.round(completed / items.length * 100)}%` : ""}</p><button class="text-link" data-route="checklist">Open ${esc(getPlace(nextTrip.destinationId)?.name || "trip")} checklist →</button>`;
      }
    }
    const journalTarget = document.getElementById("dashboard-journal");
    if (journalTarget) {
      const latest = [...featureState.journal].sort((a, b) => b.date.localeCompare(a.date))[0];
      journalTarget.innerHTML = latest
        ? `<p><strong>${esc(latest.title)}</strong><br><span>${esc(latest.date)}${latest.tripId ? ` · ${esc(getPlace(getTrip(latest.tripId)?.destinationId)?.name || "Trip")}` : ""}</span></p><button class="text-link" data-route="journal">Open travel journal →</button>`
        : `<p class="widget-empty">Your saved travel memories will appear here.</p>`;
    }
    const insightTarget = document.getElementById("dashboard-insight");
    if (insightTarget) {
      const spent = state.trips.reduce((sum, trip) => sum + tripExpenses(trip), 0);
      const budgets = state.trips.reduce((sum, trip) => sum + (Number(trip.budget) || 0), 0);
      const left = budgets - spent;
      insightTarget.innerHTML = state.trips.length
        ? `<p><strong>$${spent.toLocaleString()}</strong> recorded across ${state.trips.length} trip${state.trips.length === 1 ? "" : "s"}.</p><p>${left >= 0 ? `$${left.toLocaleString()} remains against trip estimates.` : `$${Math.abs(left).toLocaleString()} above trip estimates.`}</p><button class="text-link" data-route="finance">View spending details →</button>`
        : `<p class="widget-empty">Plan a trip to see spending insights based on your own records.</p>`;
    }
    renderNotificationsAndBadge();
  }

  function renderAssistant() {
    const list = document.getElementById("assistant-chat");
    if (!list) return;
    list.innerHTML = featureState.messages.length ? featureState.messages.map((message) => `
      <article class="chat-message ${message.role === "user" ? "user-message" : "assistant-message"}">
        <div class="chat-message-heading"><strong>${message.role === "user" ? "You" : "Morrow"}</strong><span>${esc(message.source || (message.role === "user" ? "You" : "Local rules"))} · ${esc(message.timestamp || "")}</span></div>
        <p>${esc(message.content)}</p>
      </article>`).join("") : `<div class="chat-welcome"><span>✳</span><p>Tell me what kind of weekend you need. Local replies use transparent rules and the sample destination catalogue.</p></div>`;
    if (assistantBusy) list.insertAdjacentHTML("beforeend", `<div class="typing-indicator" role="status"><span></span><span></span><span></span> Morrow is thinking…</div>`);
    list.scrollTop = list.scrollHeight;
    const model = document.getElementById("assistant-mode");
    const status = document.getElementById("assistant-status");
    const endpoint = document.getElementById("assistant-settings-form")?.elements.endpoint;
    const modelInput = document.getElementById("assistant-settings-form")?.elements.model;
    if (endpoint) endpoint.value = aiSettings.endpoint;
    if (modelInput) modelInput.value = aiSettings.model;
    if (model) model.textContent = `Ollama ready to try · ${aiSettings.model}`;
    if (status) status.textContent = "If the local server is unavailable or blocked by browser CORS, replies switch to local rules.";
  }

  function timestamp() {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date());
  }

  function addChatMessage(role, content, source) {
    const next = [...featureState.messages, { role, content: String(content).slice(0, 5000), source, timestamp: timestamp() }].slice(-100);
    if (saveFeature("morrow-chat", next)) featureState.messages = next;
  }

  function fallbackAnswer(question) {
    const text = question.toLowerCase();
    const ranked = recommendDestinations(3);
    const names = ranked.map((item) => `${item.place.name} (${item.reasons.slice(0, 2).join("; ")})`).join("\n");
    const named = destinations.filter((place) => text.includes(place.name.toLowerCase()) || place.tags.some((tag) => text.includes(tag.toLowerCase())));
    if (text.includes("weather") || text.includes("rain") || text.includes("temperature")) {
      return `I can't check live weather from a local rules reply. Open Weather to request Open-Meteo, or view clearly labelled sample conditions if offline. Catalogue destinations use approximate sample coordinates.\n\nFor your travel style, start with:\n${names}`;
    }
    if (text.includes("pack") || text.includes("checklist")) {
      return `I can make a destination-aware packing checklist for an existing trip. Open Checklists and choose your trip; suggestions are a starter list, so add anything personal.\n\nGood starting places:\n${names}`;
    }
    if (text.includes("itinerary") || text.includes("plan") || text.includes("activity")) {
      return `Open Smart itinerary to create a day-wise outline with your dates, interests, transport, and budget. It uses catalogue activities and sample cost estimates, not live bookings.\n\nSuggested starting points:\n${names}`;
    }
    if (text.includes("compare") && named.length >= 2) {
      const sorted = named.sort((a, b) => Number(a.price.slice(1)) - Number(b.price.slice(1)));
      return `${sorted[0].name} has the lower sample nightly estimate (${sorted[0].price}) compared with ${sorted[1].name} (${sorted[1].price}). ${sorted[0].duration} is the suggested stay for ${sorted[0].name}; ${sorted[1].duration} for ${sorted[1].name}. These are catalogue estimates, not current travel prices.`;
    }
    if (named.length) {
      const place = named[0];
      return `${place.name} is a ${place.type.toLowerCase()} escape suggested for ${place.bestFor.toLowerCase()}. Morrow's sample catalogue lists ${place.duration}, a starting estimate of ${place.price} per night, and activities such as ${place.activities.slice(0, 2).join(" and ")}. ${place.tip}\n\nThis is a deterministic catalogue response, not an AI-generated answer or live travel information.`;
    }
    return `Based on your saved preferences and trip history, these are my transparent local matches:\n${names}\n\nThe rank uses your budget and travel-type preference, plus saved/recent places and past trip styles. These are sample catalogue recommendations, not live availability.`;
  }

  async function askOllama(question) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${aiSettings.endpoint}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: aiSettings.model,
          stream: false,
          messages: [
            { role: "system", content: `You are Morrow, a travel planning assistant. Base factual destination information only on this sample catalogue: ${destinations.map((place) => `${place.name}: ${place.type}, ${place.duration}, ${place.price}/night; ${place.activities.join(", ")}`).join(" | ")}. Do not claim live prices, bookings, maps, or weather. Clearly state when you are estimating.` },
            ...featureState.messages.slice(-12).map((message) => ({ role: message.role, content: message.content })),
            { role: "user", content: question }
          ]
        }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}`);
      const payload = await response.json();
      const answer = payload?.message?.content;
      if (typeof answer !== "string" || !answer.trim()) throw new Error("Ollama returned an empty response.");
      return { content: answer.trim(), source: `Ollama · ${aiSettings.model}` };
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function submitAssistant(event) {
    event.preventDefault();
    if (assistantBusy) return;
    const input = document.getElementById("assistant-input");
    const question = input.value.trim();
    if (!question) return;
    input.value = "";
    addChatMessage("user", question, "You");
    assistantBusy = true;
    renderAssistant();
    let response;
    try {
      response = await askOllama(question);
    } catch (error) {
      console.info("Using local travel recommendations because Ollama is unavailable.", error);
      response = { content: fallbackAnswer(question), source: "Local rules · not AI-generated" };
    }
    addChatMessage("assistant", response.content, response.source);
    assistantBusy = false;
    renderAssistant();
  }

  async function findOllamaModels() {
    const status = document.getElementById("ollama-model-list");
    if (!status) return;
    status.textContent = "Checking the configured local server…";
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 5000);
      let response;
      try {
        response = await fetch(`${aiSettings.endpoint}/api/tags`, { signal: controller.signal });
      } finally {
        window.clearTimeout(timeout);
      }
      if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}`);
      const payload = await response.json();
      const models = Array.isArray(payload.models) ? payload.models.map((item) => item.name).filter(Boolean) : [];
      if (!models.length) { status.textContent = "Connected, but no local models were returned. Pull a model in Ollama, then check again."; return; }
      const list = document.getElementById("ollama-model-list");
      list.innerHTML = `Available on this local server: ${models.map((name) => `<button type="button" class="text-link model-choice" data-model="${esc(name)}">${esc(name)}</button>`).join(" · ")}`;
      document.getElementById("assistant-mode").textContent = `Ollama models found · ${models.length}`;
    } catch (error) {
      status.textContent = `Ollama isn't reachable from this page (${error.name === "AbortError" ? "request timed out" : "connection or browser CORS blocked"}). Local suggestions remain available.`;
    }
  }

  function setAssistantSettings(form) {
    const endpoint = String(new FormData(form).get("endpoint") || "").trim().replace(/\/+$/, "");
    const model = String(new FormData(form).get("model") || "").trim();
    let parsed;
    try { parsed = new URL(endpoint); } catch { parsed = null; }
    if (!parsed || !["http:", "https:"].includes(parsed.protocol) || !model || model.length > 80) {
      document.getElementById("ollama-model-list").textContent = "Enter a valid HTTP(S) Ollama URL and a model name.";
      return;
    }
    const next = { endpoint, model };
    if (saveFeature("morrow-ai-settings", next)) {
      aiSettings.endpoint = next.endpoint;
      aiSettings.model = next.model;
      document.getElementById("ollama-model-list").textContent = "Settings saved locally. You can try the model with a travel question.";
      renderAssistant();
    }
  }

  function clearConversation() {
    if (!featureState.messages.length) { showToast("There is no conversation to clear yet."); return; }
    if (!window.confirm("Clear this locally saved conversation?")) return;
    if (saveFeature("morrow-chat", [])) {
      featureState.messages = [];
      renderAssistant();
      showToast("Conversation cleared from this browser.");
    }
  }

  function makePlan(form) {
    const values = new FormData(form);
    const origin = String(values.get("origin") || "").trim();
    const destinationId = String(values.get("destination") || "");
    const departure = String(values.get("departure") || "");
    const returnDate = String(values.get("return") || "");
    const travelers = Number(values.get("travelers"));
    const budget = Number(values.get("budget"));
    const duration = Math.round((new Date(`${returnDate}T12:00:00`) - new Date(`${departure}T12:00:00`)) / 86400000);
    const error = document.getElementById("smart-plan-error");
    if (!origin || !getPlace(destinationId) || !Number.isFinite(Date.parse(`${departure}T12:00:00`)) || !Number.isFinite(Date.parse(`${returnDate}T12:00:00`)) || departure < dateStamp() || duration < 1 || duration > 14 || !Number.isInteger(travelers) || travelers < 1 || travelers > 20 || !Number.isFinite(budget) || budget <= 0) {
      error.textContent = "Add a starting point, choose a future date range of 1–14 nights, 1–20 travellers, and a positive total budget.";
      error.classList.remove("hidden");
      return;
    }
    const place = getPlace(destinationId);
    const interests = values.getAll("interests").map(String);
    const intensity = String(values.get("intensity") || "balanced");
    const days = duration + 1;
    const activities = [...place.activities, ...place.attractions];
    const plan = {
      id: `outline-${Date.now()}`, schemaVersion: VERSION, origin, destinationId, departure, return: returnDate,
      travelers, budget, transport: String(values.get("transport") || "Car"), interests, intensity,
      recommendedDuration: place.duration, days: [], createdAt: new Date().toISOString()
    };
    for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
      plan.days.push(createPlanDay(plan, dayIndex, 0, activities));
    }
    currentPlan = plan;
    error.classList.add("hidden");
    renderCurrentPlan();
  }

  function createPlanDay(plan, dayIndex, offset = 0, sharedActivities = null) {
    const place = getPlace(plan.destinationId);
    const activities = sharedActivities || [...place.activities, ...place.attractions];
    const date = addDays(plan.departure, dayIndex);
    const interestWords = plan.interests || [];
    const picks = [];
    for (let slot = 0; slot < 3; slot += 1) {
      const index = (dayIndex * 2 + slot + offset) % activities.length;
      picks.push(activities[index]);
    }
    const relaxed = plan.intensity === "relaxed";
    const eveningName = relaxed ? "Unscheduled evening and rest" : picks[2];
    const activityNames = [picks[0], picks[1], eveningName];
    return {
      date,
      regeneration: offset,
      rest: plan.intensity === "active" ? "Keep a slower meal break and an open evening for recovery." : "Leave a generous rest window between the afternoon and evening.",
      activities: activityNames.map((title, slot) => {
        const interest = interestWords.find((item) => `${title} ${place.type}`.toLowerCase().includes(item.toLowerCase()));
        const estimatePerPerson = title.toLowerCase().includes("rest") ? 0 : Math.max(6, Math.round(Number(place.price.replace("$", "")) * (slot === 2 ? 0.1 : 0.07)));
        const parts = ["Morning", "Afternoon", "Evening"];
        return {
          id: `suggestion-${Date.now()}-${dayIndex}-${slot}-${offset}`,
          part: parts[slot],
          title,
          description: interest ? `A sample ${interest.toLowerCase()} idea from the ${place.name} catalogue.` : `A flexible ${place.type.toLowerCase()} suggestion. Adjust it to your group's pace.`,
          estimate: estimatePerPerson * plan.travelers,
          time: ["09:00", "13:30", "18:00"][slot]
        };
      })
    };
  }

  function renderCurrentPlan() {
    const container = document.getElementById("smart-plan-results");
    if (!container) return;
    if (!currentPlan) { container.innerHTML = ""; return; }
    const place = getPlace(currentPlan.destinationId);
    const estimate = currentPlan.days.reduce((sum, day) => sum + day.activities.reduce((sub, activity) => sub + activity.estimate, 0), 0);
    container.innerHTML = `<div class="smart-plan-summary panel"><div><p class="eyebrow">LOCAL RULE-BASED OUTLINE · SAMPLE ESTIMATES</p><h2>${esc(place.name)}</h2><p>${esc(currentPlan.origin)} → ${esc(place.name)} · ${esc(currentPlan.departure)} to ${esc(currentPlan.return)} · ${currentPlan.travelers} travellers · ${esc(currentPlan.transport)}</p><p>Recommended stay in catalogue: ${esc(currentPlan.recommendedDuration)}. Route duration and live prices are not available.</p><p>Suggested activity estimates: <strong>$${estimate.toLocaleString()}</strong> of your $${currentPlan.budget.toLocaleString()} total budget. Estimates are illustrative and are not quotes.</p></div><div class="plan-actions"><button class="button button-outline" data-action="save-smart-plan">Save outline</button><button class="button button-dark" data-action="convert-smart-plan">Add to My trips</button></div></div>
      <div class="smart-plan-days">${currentPlan.days.map((day, dayIndex) => `<section class="smart-plan-day panel"><header><div><span>DAY ${dayIndex + 1}</span><h3>${esc(day.date)}</h3></div><button class="text-link" data-action="regenerate-plan-day" data-day="${dayIndex}">Regenerate this day ↻</button></header><div class="plan-slot-list">${day.activities.map((activity, activityIndex) => `<article class="plan-slot"><span class="plan-part">${esc(activity.part)}</span><div><strong>${esc(activity.title)}</strong><p>${esc(activity.description)}</p><small>Suggested cost: $${activity.estimate.toLocaleString()} total for ${currentPlan.travelers}</small></div><div><button aria-label="Edit ${esc(activity.title)}" data-action="edit-plan-activity" data-day="${dayIndex}" data-index="${activityIndex}">✎</button><button aria-label="Remove ${esc(activity.title)}" data-action="remove-plan-activity" data-day="${dayIndex}" data-index="${activityIndex}">×</button></div></article>`).join("")}</div><p class="rest-note">Rest window: ${esc(day.rest)}</p><button class="text-link" data-action="add-plan-activity" data-day="${dayIndex}">+ Add an activity</button></section>`).join("")}</div>
      <div class="plan-preparation panel"><p class="eyebrow">A LITTLE PREPARATION</p><p>${esc(place.tip)}</p><p>Transport selected: ${esc(currentPlan.transport)}. Check routes, opening times, accessibility, and current conditions with local providers before travelling.</p></div>`;
  }

  function openPlanActivityForm(dayIndex, activityIndex = -1) {
    if (!currentPlan || !currentPlan.days[dayIndex]) return;
    const activity = currentPlan.days[dayIndex].activities[activityIndex];
    state.modalReturnFocus = document.activeElement;
    document.getElementById("modal-content").innerHTML = `<form id="plan-activity-form" class="modal-form"><p class="eyebrow">SHAPE THIS LITTLE OUTLINE</p><h2 id="modal-title">${activity ? "Edit activity" : "Add activity"}</h2><input type="hidden" name="day" value="${dayIndex}"><input type="hidden" name="index" value="${activityIndex}"><label>Day part<select name="part">${["Morning", "Afternoon", "Evening"].map((item) => `<option ${activity?.part === item ? "selected" : ""}>${item}</option>`).join("")}</select></label><label>Activity<input name="title" maxlength="100" value="${esc(activity?.title || "")}" required></label><label>Details<input name="description" maxlength="220" value="${esc(activity?.description || "")}"></label><label>Estimated total cost ($)<input name="estimate" type="number" min="0" step="1" value="${activity?.estimate ?? 0}" required></label><button class="button button-dark" type="submit">Save activity</button></form>`;
    showModal();
  }

  function regeneratePlanDay(dayIndex) {
    if (!currentPlan || !currentPlan.days[dayIndex]) return;
    const nextOffset = currentPlan.days[dayIndex].regeneration + 1;
    currentPlan.days[dayIndex] = createPlanDay(currentPlan, dayIndex, nextOffset);
    renderCurrentPlan();
  }

  function saveCurrentPlan() {
    if (!currentPlan) return;
    const existing = featureState.savedPlans.some((item) => item.id === currentPlan.id);
    const next = existing
      ? featureState.savedPlans.map((item) => item.id === currentPlan.id ? currentPlan : item)
      : [...featureState.savedPlans, currentPlan].slice(-30);
    if (saveFeature("morrow-smart-itineraries", next)) {
      featureState.savedPlans = next;
      renderSavedPlans();
      showToast("Your outline is saved in this browser.");
    }
  }

  function loadSavedPlan(id) {
    const plan = featureState.savedPlans.find((item) => item.id === id);
    if (!plan || !getPlace(plan.destinationId) || !Array.isArray(plan.days)) return;
    currentPlan = JSON.parse(JSON.stringify(plan));
    renderCurrentPlan();
    document.getElementById("smart-plan-results").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function removeSavedPlan(id) {
    const next = featureState.savedPlans.filter((item) => item.id !== id);
    if (saveFeature("morrow-smart-itineraries", next)) {
      featureState.savedPlans = next;
      renderSavedPlans();
    }
  }

  function renderSavedPlans() {
    const target = document.getElementById("saved-itineraries");
    if (!target) return;
    target.innerHTML = featureState.savedPlans.length ? [...featureState.savedPlans].reverse().map((plan) => {
      const place = getPlace(plan.destinationId);
      return `<article class="saved-itinerary-card panel"><div><strong>${esc(place?.name || "Saved outline")}</strong><span>${esc(plan.departure)} · ${plan.days?.length || 0} days · ${plan.travelers || 1} travellers</span></div><button class="text-link" data-action="load-smart-plan" data-id="${esc(plan.id)}">Open</button><button class="text-link danger-link" data-action="delete-smart-plan" data-id="${esc(plan.id)}">Delete</button></article>`;
    }).join("") : `<p class="widget-empty">Saved outlines will appear here.</p>`;
  }

  function convertPlanToTrip() {
    if (!currentPlan) return;
    if (state.trips.some((trip) => trip.id === currentPlan.id)) { showToast("This outline is already in My trips."); return; }
    const place = getPlace(currentPlan.destinationId);
    const itinerary = currentPlan.days.flatMap((day) => day.activities.filter((item) => !item.title.toLowerCase().includes("unscheduled")).map((item) => ({
      id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: item.title, date: day.date, time: item.time || ({ Morning: "09:00", Afternoon: "13:30", Evening: "18:00" }[item.part]),
      description: `${item.description} Suggested activity cost: $${item.estimate}.`
    })));
    const trip = {
      id: `trip-${Date.now()}`, destinationId: place.id, departure: currentPlan.departure, return: currentPlan.return,
      travelers: currentPlan.travelers, transport: currentPlan.transport, budget: currentPlan.budget,
      preferences: currentPlan.interests, status: "Upcoming", itinerary, expenses: [], legacy: false
    };
    state.trips.push(trip);
    writeStorage("morrow-trips", state.trips);
    state.selectedTripId = trip.id;
    renderAnalytics();
    showToast("The itinerary was added to My trips. You can edit activities and expenses there.");
    navigate("trip");
  }

  function sampleWeather(place) {
    const index = destinations.findIndex((item) => item.id === place.id);
    const conditions = [
      { code: 3, temperature: 14, rain: 35 }, { code: 2, temperature: 18, rain: 20 },
      { code: 61, temperature: 11, rain: 70 }, { code: 1, temperature: 21, rain: 10 },
      { code: 45, temperature: 9, rain: 25 }, { code: 2, temperature: 16, rain: 15 }
    ];
    return { ...conditions[Math.max(0, index) % conditions.length], source: "sample", observed: timestamp() };
  }

  function weatherDescription(code) {
    const groups = [
      [0, "Clear"], [1, "Mostly clear"], [2, "Partly cloudy"], [3, "Overcast"],
      [45, "Fog"], [48, "Freezing fog"], [51, "Light drizzle"], [53, "Drizzle"], [55, "Heavy drizzle"],
      [61, "Light rain"], [63, "Rain"], [65, "Heavy rain"], [71, "Light snow"], [73, "Snow"], [75, "Heavy snow"],
      [80, "Rain showers"], [81, "Showers"], [82, "Heavy showers"], [95, "Thunderstorm"], [96, "Thunderstorm with hail"], [99, "Thunderstorm with hail"]
    ];
    return groups.find(([value]) => value === Number(code))?.[1] || "Conditions vary";
  }

  function clothingAdvice(temperature, rain) {
    const clothes = [];
    if (temperature < 10) clothes.push("warm layers");
    else if (temperature < 18) clothes.push("a light layer");
    else clothes.push("breathable clothing");
    if (rain >= 40) clothes.push("a waterproof shell and shoes");
    if (temperature >= 24) clothes.push("sun protection and water");
    return `Consider ${clothes.join(", ")}. This advice is based on the displayed forecast only.`;
  }

  function renderWeather(place, result) {
    const target = document.getElementById("weather-result");
    if (!target) return;
    const source = result.source === "live" ? "LIVE OPEN-METEO RESPONSE · APPROXIMATE PLACE COORDINATE" : "SAMPLE CONDITIONS · NOT LIVE WEATHER";
    const warning = result.rain >= 60 || result.code >= 95
      ? `<p class="weather-warning"><strong>Weather note:</strong> Conditions may affect outdoor plans. Re-check a local forecast before departure.</p>`
      : `<p class="weather-advice">No sample warning threshold was triggered. Still re-check conditions close to travel.</p>`;
    target.innerHTML = `<div class="weather-card"><div class="weather-card-top"><div><p class="eyebrow">${source}</p><h2>${esc(place.name)}</h2><p>${esc(place.coordinateSource || "Approximate sample coordinates")}</p></div><span class="weather-symbol" aria-hidden="true">${result.code >= 61 ? "☂" : result.code >= 2 ? "☁" : "☼"}</span></div><div class="weather-reading"><strong>${Math.round(result.temperature)}°C</strong><span>${esc(weatherDescription(result.code))}</span></div><div class="weather-facts"><span>Rain probability<strong>${result.rain === null ? "Not returned" : `${Math.round(result.rain)}%`}</strong></span><span>Feels like<strong>${result.apparent === null ? "Not returned" : `${Math.round(result.apparent)}°C`}</strong></span><span>Forecast checked<strong>${esc(result.observed || timestamp())}</strong></span></div><p class="weather-advice">${esc(clothingAdvice(result.temperature, result.rain || 0))}</p>${warning}<p class="weather-note">Weather is for an approximate destination-centre coordinate. It is not a forecast for accommodation, attractions, or a route.</p></div>`;
  }

  async function loadWeather() {
    const place = getPlace(document.getElementById("weather-destination")?.value || selectedWeatherPlace || destinations[0].id);
    if (!place) return;
    selectedWeatherPlace = place.id;
    const target = document.getElementById("weather-result");
    target.innerHTML = `<div class="weather-skeleton" aria-label="Loading weather"><span></span><span></span><span></span></div><p class="inline-status">Requesting Open-Meteo for approximate sample coordinates…</p>`;
    const [latitude, longitude] = place.coordinates;
    const query = new URLSearchParams({
      latitude, longitude,
      current: "temperature_2m,apparent_temperature,weather_code",
      daily: "precipitation_probability_max",
      timezone: "auto",
      forecast_days: "1"
    });
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 9000);
      let response;
      try { response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, { signal: controller.signal }); }
      finally { window.clearTimeout(timeout); }
      if (!response.ok) throw new Error(`Open-Meteo returned HTTP ${response.status}`);
      const data = await response.json();
      const temperature = Number(data.current?.temperature_2m);
      const code = Number(data.current?.weather_code);
      if (!Number.isFinite(temperature) || !Number.isFinite(code)) throw new Error("Weather response is missing current conditions.");
      const rainRaw = data.daily?.precipitation_probability_max?.[0];
      const apparentRaw = data.current?.apparent_temperature;
      renderWeather(place, {
        source: "live", temperature, code,
        rain: Number.isFinite(Number(rainRaw)) ? Number(rainRaw) : null,
        apparent: Number.isFinite(Number(apparentRaw)) ? Number(apparentRaw) : null,
        observed: timestamp()
      });
      showToast("Live weather loaded for an approximate destination coordinate.");
    } catch (error) {
      console.info("Open-Meteo unavailable; displaying clearly labelled sample conditions.", error);
      renderWeather(place, sampleWeather(place));
      showToast("Weather service unavailable. Showing sample conditions, not live weather.");
    }
    renderNotifications();
  }

  function renderGroups() {
    const target = document.getElementById("group-list");
    const destinationSelect = document.getElementById("group-destination");
    if (!target || !destinationSelect) return;
    target.innerHTML = featureState.groups.length ? [...featureState.groups].reverse().map((group) => {
      const place = getPlace(group.destinationId);
      const votes = Object.entries(group.votes || {}).reduce((counts, [, destinationId]) => {
        counts[destinationId] = (counts[destinationId] || 0) + 1;
        return counts;
      }, {});
      const spent = (group.expenses || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const votesHtml = destinations.map((item) => `<span>${esc(item.name)} <strong>${votes[item.id] || 0}</strong></span>`).join("");
      return `<article class="group-card panel" data-group-id="${esc(group.id)}"><div class="group-card-heading"><div><p class="eyebrow">SIMULATED · SAVED IN THIS BROWSER</p><h2>${esc(group.title)}</h2><p>${esc(place?.name || "Destination")} · Budget $${Number(group.budget).toLocaleString()}</p></div><button class="text-link danger-link" data-action="delete-group" data-id="${esc(group.id)}">Delete group</button></div>
        <div class="group-summary"><span>${group.participants.length} participant${group.participants.length === 1 ? "" : "s"}</span><span>$${spent.toLocaleString()} of $${Number(group.budget).toLocaleString()} shared expenses</span></div>
        <section><h3>Participants and roles</h3><div class="participant-list">${group.participants.map((person) => `<label>${esc(person.name)}<select data-change="group-role" data-group-id="${esc(group.id)}" data-person-id="${esc(person.id)}">${["Planner", "Contributor", "Viewer"].map((role) => `<option ${person.role === role ? "selected" : ""}>${role}</option>`).join("")}</select></label>`).join("")}</div><form class="group-participant-form" data-group-id="${esc(group.id)}"><input type="hidden" name="groupId" value="${esc(group.id)}"><input name="name" maxlength="60" placeholder="Add a participant" required><select name="role"><option>Contributor</option><option>Planner</option><option>Viewer</option></select><button class="button button-outline" type="submit">Add person</button></form></section>
        <section><h3>Destination votes <small>Local simulation — each vote is stored on this device.</small></h3><div class="group-votes">${votesHtml}</div><form class="group-vote-form" data-group-id="${esc(group.id)}"><input type="hidden" name="groupId" value="${esc(group.id)}"><label>Participant<select name="participant">${group.participants.map((person) => `<option value="${esc(person.id)}">${esc(person.name)}</option>`).join("")}</select></label><label>Vote for<select name="destination">${destinations.map((item) => `<option value="${esc(item.id)}" ${item.id === place?.id ? "selected" : ""}>${esc(item.name)}</option>`).join("")}</select></label><button class="button button-outline" type="submit">Record simulated vote</button></form></section>
        <section><h3>Shared itinerary suggestions</h3><div class="group-suggestions">${(group.suggestions || []).length ? group.suggestions.map((item) => `<div><span>${esc(item.title)} <small>suggested by ${esc(item.by)}</small></span><button aria-label="Remove suggestion" data-action="remove-group-suggestion" data-id="${esc(group.id)}" data-item-id="${esc(item.id)}">×</button></div>`).join("") : `<p class="widget-empty">Suggestions from this local group appear here.</p>`}</div><form class="group-suggestion-form" data-group-id="${esc(group.id)}"><input type="hidden" name="groupId" value="${esc(group.id)}"><input name="title" maxlength="100" placeholder="Suggest an activity" required><button class="button button-outline" type="submit">Add suggestion</button></form></section>
        <section><h3>Shared expense records</h3><div class="group-expenses">${(group.expenses || []).map((item) => `<p>${esc(item.title)} · ${esc(item.category)} <strong>$${Number(item.amount).toLocaleString()}</strong></p>`).join("") || `<p class="widget-empty">No shared expenses yet.</p>`}</div><form class="group-expense-form" data-group-id="${esc(group.id)}"><input type="hidden" name="groupId" value="${esc(group.id)}"><input name="title" maxlength="80" placeholder="Expense name" required><select name="category"><option>Transportation</option><option>Accommodation</option><option>Food</option><option>Activities</option><option>Shopping</option><option>Other</option></select><input name="amount" type="number" min="0.01" step="0.01" placeholder="Amount" required><button class="button button-outline" type="submit">Add expense</button></form></section>
      </article>`;
    }).join("") : `<div class="empty-state"><span>♧</span><h3>No local group plans yet.</h3><p>Create a simulated group below. Other people cannot see or sync it.</p></div>`;
  }

  function createGroup(form) {
    const values = new FormData(form);
    const title = String(values.get("title") || "").trim();
    const participants = String(values.get("participants") || "").split(",").map((name) => name.trim()).filter(Boolean).slice(0, 20);
    const budget = Number(values.get("budget"));
    if (!title || !getPlace(values.get("destination")) || !participants.length || !Number.isFinite(budget) || budget <= 0) {
      showToast("Add a group name, destination, participant, and positive budget.");
      return;
    }
    const members = [{ id: `person-${Date.now()}`, name: state.profile.name || "You", role: "Planner" }];
    participants.forEach((name, index) => {
      if (name.toLowerCase() !== (state.profile.name || "You").toLowerCase()) {
        members.push({ id: `person-${Date.now()}-${index}`, name: name.slice(0, 60), role: "Contributor" });
      }
    });
    const group = {
      id: `group-${Date.now()}`, schemaVersion: VERSION, title, destinationId: String(values.get("destination")),
      budget, participants: members, votes: {}, suggestions: [], expenses: [], createdAt: new Date().toISOString()
    };
    const next = [...featureState.groups, group].slice(-40);
    if (saveFeature("morrow-groups", next)) {
      featureState.groups = next;
      form.reset();
      renderGroups();
      renderNotifications();
      showToast("Local group created. It is not shared or synchronized.");
    }
  }

  function updateGroup(groupId, updater) {
    const index = featureState.groups.findIndex((group) => group.id === groupId);
    if (index < 0) return false;
    const next = featureState.groups.map((group, itemIndex) => itemIndex === index ? updater(group) : group);
    if (!saveFeature("morrow-groups", next)) return false;
    featureState.groups = next;
    renderGroups();
    renderNotifications();
    renderDashboard();
    return true;
  }

  function handleGroupForm(form) {
    const groupId = form.dataset.groupId || new FormData(form).get("groupId");
    const group = featureState.groups.find((item) => item.id === groupId);
    if (!group) return;
    const values = new FormData(form);
    if (form.matches(".group-participant-form")) {
      const name = String(values.get("name") || "").trim();
      if (!name || group.participants.length >= 20) { showToast("Add a participant name. Groups are limited to 20 local participants."); return; }
      updateGroup(groupId, (item) => ({ ...item, participants: [...item.participants, { id: `person-${Date.now()}`, name, role: String(values.get("role")) }] }));
    } else if (form.matches(".group-vote-form")) {
      const participantId = String(values.get("participant"));
      if (!group.participants.some((person) => person.id === participantId)) return;
      updateGroup(groupId, (item) => ({ ...item, votes: { ...item.votes, [participantId]: String(values.get("destination")) } }));
      showToast("Simulated vote recorded locally.");
    } else if (form.matches(".group-suggestion-form")) {
      const title = String(values.get("title") || "").trim();
      if (!title) return;
      updateGroup(groupId, (item) => ({ ...item, suggestions: [...(item.suggestions || []), { id: `suggestion-${Date.now()}`, title, by: state.profile.name || "You" }] }));
      showToast("Suggestion added to this local group.");
    } else if (form.matches(".group-expense-form")) {
      const amount = Number(values.get("amount"));
      const title = String(values.get("title") || "").trim();
      if (!title || !Number.isFinite(amount) || amount <= 0) { showToast("Enter an expense name and a positive amount."); return; }
      updateGroup(groupId, (item) => ({ ...item, expenses: [...(item.expenses || []), { id: `expense-${Date.now()}`, title, category: String(values.get("category")), amount }] }));
      showToast("Shared expense recorded in this local simulation.");
    }
    if (form.matches(".group-participant-form, .group-suggestion-form, .group-expense-form")) form.reset();
  }

  function seedChecklist(trip) {
    const place = getPlace(trip.destinationId);
    const clothing = place?.type === "Coast" ? ["Light layers", "Sun hat"] : place?.tags.includes("Mountains") ? ["Warm layers", "Comfortable walking shoes"] : ["Comfortable walking shoes"];
    const transportItem = trip.transport === "Flight" ? "Boarding pass" : trip.transport === "Train" ? "Train tickets" : trip.transport === "Ferry" ? "Ferry tickets" : "Route and parking details";
    const suggested = [
      ["Documents", "Photo ID or passport"], ["Documents", transportItem], ["Documents", "Accommodation confirmation"],
      ...clothing.map((item) => ["Clothing", item]),
      ["Electronics", "Phone charger"], ["Electronics", "Power adapter if needed"],
      ["Personal essentials", "Regular medication"], ["Personal essentials", "Toiletries"],
      ["Travel accessories", "Reusable water bottle"], ["Travel accessories", "Day bag"],
      ["Emergency essentials", "Basic first-aid supplies"], ["Emergency essentials", "Emergency contact details"]
    ];
    return suggested.map(([category, title], index) => ({
      id: `check-${trip.id}-${index}`, category, title, checked: false, suggested: true
    }));
  }

  function getChecklist(trip) {
    if (!trip) return [];
    if (!Array.isArray(featureState.checklists[trip.id])) {
      featureState.checklists = { ...featureState.checklists, [trip.id]: seedChecklist(trip) };
      saveFeature("morrow-checklists", featureState.checklists);
    }
    return featureState.checklists[trip.id];
  }

  function renderChecklist() {
    const select = document.getElementById("checklist-trip");
    const board = document.getElementById("checklist-board");
    if (!select || !board) return;
    fillTripSelect(select, selectedChecklistTrip);
    const trip = getTrip(select.value);
    selectedChecklistTrip = trip?.id || "";
    if (!trip) {
      document.getElementById("checklist-progress").innerHTML = "";
      board.innerHTML = `<div class="empty-state"><span>✓</span><h3>Plan a trip to start a checklist.</h3><p>Your preparation list will be saved alongside a trip plan.</p><button class="button button-dark" data-action="new-trip">Plan a trip</button></div>`;
      return;
    }
    const items = getChecklist(trip);
    const done = items.filter((item) => item.checked).length;
    const percent = items.length ? Math.round(done / items.length * 100) : 0;
    document.getElementById("checklist-progress").innerHTML = `<strong>${done} / ${items.length}</strong><span>${percent}% ready</span><div class="progress-track"><i style="width:${percent}%"></i></div>`;
    board.innerHTML = CATEGORIES.map((category) => {
      const rows = items.filter((item) => item.category === category);
      return `<section class="checklist-category panel"><h2>${esc(category)} <span>${rows.filter((item) => item.checked).length}/${rows.length}</span></h2>${rows.length ? rows.map((item) => `<label class="checklist-item${item.checked ? " checked" : ""}"><input type="checkbox" data-action="toggle-checklist" data-id="${esc(item.id)}" ${item.checked ? "checked" : ""}><span>${esc(item.title)}${item.suggested ? `<small>Suggested</small>` : ""}</span><button type="button" aria-label="Delete ${esc(item.title)}" data-action="delete-checklist-item" data-id="${esc(item.id)}">×</button></label>`).join("") : `<p class="widget-empty">Nothing in this category yet.</p>`}</section>`;
    }).join("");
  }

  function updateChecklistItem(id, change) {
    const trip = getTrip(selectedChecklistTrip);
    if (!trip) return;
    const items = getChecklist(trip);
    const nextItems = items.map((item) => item.id === id ? { ...item, ...change } : item);
    const next = { ...featureState.checklists, [trip.id]: nextItems };
    if (saveFeature("morrow-checklists", next)) {
      featureState.checklists = next;
      renderChecklist();
      renderDashboard();
      renderNotifications();
    }
  }

  function addChecklistItem(form) {
    const trip = getTrip(selectedChecklistTrip);
    if (!trip) { showToast("Create a trip before adding its preparation items."); return; }
    const values = new FormData(form);
    const title = String(values.get("item") || "").trim();
    if (!title) return;
    const items = getChecklist(trip);
    if (items.length >= 100) { showToast("This checklist has reached its 100-item limit."); return; }
    const next = { ...featureState.checklists, [trip.id]: [...items, { id: `check-${Date.now()}`, title, category: String(values.get("category")), checked: false, suggested: false }] };
    if (saveFeature("morrow-checklists", next)) {
      featureState.checklists = next;
      form.reset();
      renderChecklist();
      renderDashboard();
      renderNotifications();
    }
  }

  function imageDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("The selected photo could not be read."));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("The selected file is not a readable image."));
      image.src = source;
    });
  }

  async function compressPhoto(file) {
    if (!(file instanceof File) || !file.type.startsWith("image/")) throw new Error("Choose a supported image file.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Choose a photo smaller than 5 MB.");
    const source = await imageDataUrl(file);
    const image = await loadImage(source);
    const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Photo compression is not supported by this browser.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (let shrink = 0; shrink < 3; shrink += 1) {
      for (const quality of [0.82, 0.68, 0.54, 0.42]) {
        const compressed = canvas.toDataURL("image/jpeg", quality);
        if (compressed.length <= 260000) return compressed;
      }
      canvas.width = Math.max(1, Math.round(canvas.width * 0.72));
      canvas.height = Math.max(1, Math.round(canvas.height * 0.72));
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    }
    throw new Error("This photo could not be compressed under 260 KB. Try a smaller image.");
  }

  function renderJournal() {
    const select = document.getElementById("journal-trip");
    const target = document.getElementById("journal-list");
    if (!select || !target) return;
    fillTripSelect(select, select.value, true);
    const query = (document.getElementById("journal-search")?.value || "").trim().toLowerCase();
    const entries = [...featureState.journal].filter((entry) => {
      const trip = getTrip(entry.tripId);
      const place = getPlace(trip?.destinationId);
      return !query || `${entry.title} ${entry.description} ${entry.date} ${place?.name || ""}`.toLowerCase().includes(query);
    }).sort((a, b) => b.date.localeCompare(a.date));
    target.innerHTML = entries.length ? entries.map((entry) => {
      const place = getPlace(getTrip(entry.tripId)?.destinationId);
      return `<article class="journal-entry panel">${entry.imageData ? `<img src="${entry.imageData}" alt="Photo for ${esc(entry.title)}" loading="lazy">` : `<div class="journal-no-photo">✳</div>`}<div class="journal-entry-copy"><p class="eyebrow">${esc(entry.date)}${place ? ` · ${esc(place.name)}` : ""}</p><h2>${esc(entry.title)}</h2><p>${esc(entry.description || "A moment saved for later.")}</p><div><button class="text-link" data-action="edit-journal" data-id="${esc(entry.id)}">Edit</button><button class="text-link danger-link" data-action="delete-journal" data-id="${esc(entry.id)}">Delete</button></div></div></article>`;
    }).join("") : `<div class="empty-state"><span>▤</span><h3>${query ? "No memories match that search." : "Your journal is waiting for its first story."}</h3><p>Add a note or a compressed photo to begin.</p></div>`;
  }

  function editJournalEntry(id) {
    const entry = featureState.journal.find((item) => item.id === id);
    const form = document.getElementById("journal-form");
    if (!entry || !form) return;
    form.elements.entryId.value = entry.id;
    form.elements.title.value = entry.title;
    form.elements.date.value = entry.date;
    form.elements.tripId.value = entry.tripId || "";
    form.elements.description.value = entry.description || "";
    form.elements.photo.value = "";
    document.getElementById("journal-cancel-edit").classList.remove("hidden");
    document.getElementById("journal-status").textContent = entry.imageData ? "Current photo is retained unless you choose a replacement." : "Choose a photo to add one. Files are compressed before saving.";
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function submitJournal(form) {
    const values = new FormData(form);
    const id = String(values.get("entryId") || "");
    const existing = featureState.journal.find((item) => item.id === id);
    const title = String(values.get("title") || "").trim();
    const date = String(values.get("date") || "");
    const description = String(values.get("description") || "").trim();
    if (!title || !Number.isFinite(Date.parse(`${date}T12:00:00`))) {
      document.getElementById("journal-status").textContent = "Add a title and valid travel date.";
      return;
    }
    const file = form.elements.photo.files[0];
    let imageData = existing?.imageData || "";
    const status = document.getElementById("journal-status");
    if (file) {
      status.textContent = "Compressing your photo on this device…";
      try { imageData = await compressPhoto(file); }
      catch (error) { status.textContent = error.message; return; }
    }
    const othersImageChars = featureState.journal.filter((entry) => entry.id !== id).reduce((sum, entry) => sum + (entry.imageData?.length || 0), 0);
    if (othersImageChars + imageData.length > 1800000) {
      status.textContent = "Local journal photo storage is at its 1.8 MB image limit. Delete or replace older photos first.";
      return;
    }
    const entry = {
      id: existing?.id || `memory-${Date.now()}`, schemaVersion: VERSION, title, date, description,
      tripId: String(values.get("tripId") || ""), imageData, updatedAt: new Date().toISOString()
    };
    const next = existing
      ? featureState.journal.map((item) => item.id === existing.id ? entry : item)
      : [...featureState.journal, entry].slice(-80);
    if (!saveFeature("morrow-journal", next)) { status.textContent = "Could not save this memory. Check this browser's available storage."; return; }
    featureState.journal = next;
    form.reset();
    document.getElementById("journal-cancel-edit").classList.add("hidden");
    status.textContent = "Saved on this device. Photos are compressed JPEG previews.";
    renderJournal();
    renderDashboard();
    renderNotifications();
    showToast(existing ? "Journal memory updated." : "Journal memory saved.");
  }

  function cancelJournalEdit() {
    const form = document.getElementById("journal-form");
    form?.reset();
    document.getElementById("journal-cancel-edit")?.classList.add("hidden");
    const status = document.getElementById("journal-status");
    if (status) status.textContent = "Photos are compressed in your browser before saving.";
  }

  function removeJournalEntry(id) {
    if (!window.confirm("Delete this journal memory and its local photo?")) return;
    const next = featureState.journal.filter((item) => item.id !== id);
    if (saveFeature("morrow-journal", next)) {
      featureState.journal = next;
      renderJournal();
      renderDashboard();
      renderNotifications();
      showToast("Journal memory deleted from this browser.");
    }
  }

  function renderFinance() {
    const select = document.getElementById("finance-trip");
    const overview = document.getElementById("finance-overview");
    const history = document.getElementById("finance-history");
    if (!select || !overview || !history) return;
    fillTripSelect(select, selectedFinanceTrip);
    const trip = getTrip(select.value);
    selectedFinanceTrip = trip?.id || "";
    if (!trip) {
      overview.innerHTML = `<div class="empty-state"><span>$</span><h3>Plan a trip to see its money insights.</h3><p>Costs and estimates are calculated from the trip and expense records you enter.</p><button class="button button-dark" data-action="new-trip">Plan a trip</button></div>`;
      history.innerHTML = "";
      return;
    }
    const total = tripExpenses(trip);
    const days = tripDays(trip) + 1;
    const travelers = Math.max(1, Number(trip.travelers) || 1);
    const budget = Number(trip.budget) || 0;
    const perPerson = total / travelers;
    const dailyBudget = budget / days;
    const today = dateStamp();
    const start = trip.departure;
    const elapsed = start <= today ? Math.min(days, Math.max(1, Math.floor((Date.parse(`${today}T12:00:00`) - Date.parse(`${start}T12:00:00`)) / 86400000) + 1)) : 0;
    const projected = elapsed && total ? total / elapsed * days : null;
    const categoryNames = ["Transportation", "Accommodation", "Food", "Activities", "Shopping", "Other"];
    const categoryRows = categoryNames.map((category) => {
      const amount = trip.expenses.filter((item) => item.category === category).reduce((sum, item) => sum + Number(item.amount || 0), 0);
      return `<div class="finance-category"><span>${esc(category)}</span><strong>$${amount.toLocaleString()}</strong><i><b style="width:${total ? Math.min(100, amount / total * 100) : 0}%"></b></i></div>`;
    }).join("");
    const overBudget = total > budget;
    const projectionMessage = projected === null
      ? `No spend-rate projection yet. ${start > today ? "This trip has not started." : "Record expenses to estimate a trend."}`
      : `At the observed pace, the trip-end total may be about $${Math.round(projected).toLocaleString()}. This is a simple projection from ${elapsed} elapsed day${elapsed === 1 ? "" : "s"}, not a prediction guarantee.`;
    overview.innerHTML = `<div class="finance-stat-grid"><article class="finance-stat"><span>ESTIMATED BUDGET</span><strong>$${budget.toLocaleString()}</strong></article><article class="finance-stat"><span>ACTUAL EXPENSES</span><strong>$${total.toLocaleString()}</strong></article><article class="finance-stat"><span>REMAINING</span><strong class="${budget - total < 0 ? "negative" : ""}">$${(budget - total).toLocaleString()}</strong></article><article class="finance-stat"><span>ACTUAL / TRAVELLER</span><strong>$${perPerson.toFixed(2)}</strong></article><article class="finance-stat"><span>EST. DAILY BUDGET</span><strong>$${dailyBudget.toFixed(2)}</strong></article><article class="finance-stat"><span>ACTUAL / ELAPSED DAY</span><strong>$${elapsed ? (total / elapsed).toFixed(2) : "—"}</strong></article></div>
      ${overBudget ? `<p class="finance-alert" role="alert">Budget alert: recorded expenses exceed your estimate by $${(total - budget).toLocaleString()}.</p>` : `<p class="finance-ok">Recorded expenses are within the trip estimate by $${(budget - total).toLocaleString()}.</p>`}
      <div class="finance-projection panel"><p class="eyebrow">ESTIMATE, NOT A GUARANTEE</p><p>${esc(projectionMessage)}</p></div>
      <section class="finance-breakdown panel"><h2>Spending by category</h2>${categoryRows}</section>`;
    history.innerHTML = `<h2>Expense history · ${esc(getPlace(trip.destinationId)?.name || "Trip")}</h2>${trip.expenses.length ? `<div class="finance-history-list">${trip.expenses.slice().sort((a, b) => a.date.localeCompare(b.date)).map((item) => `<div><span>${esc(item.date)} · ${esc(item.title)}<small>${esc(item.category)}</small></span><strong>$${Number(item.amount).toLocaleString()}</strong></div>`).join("")}</div>` : `<p class="widget-empty">No expenses have been recorded for this trip yet. Add them from Trip details.</p>`}`;
  }

  function exportFinance() {
    const trip = getTrip(document.getElementById("finance-trip")?.value || selectedFinanceTrip);
    if (!trip) { showToast("Create a trip before exporting a financial summary."); return; }
    const place = getPlace(trip.destinationId);
    const rows = [
      ["Morrow financial summary", ""], ["Destination", place?.name || ""], ["Departure", trip.departure],
      ["Return", trip.return], ["Travellers", trip.travelers], ["Estimated budget", trip.budget],
      ["Actual expenses", tripExpenses(trip)], ["Remaining", Number(trip.budget) - tripExpenses(trip)],
      [], ["Date", "Expense", "Category", "Amount"],
      ...trip.expenses.map((item) => [item.date, item.title, item.category, item.amount])
    ];
    const csv = rows.map((row) => row.map((field) => `"${String(field ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `morrow-finances-${trip.id}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Financial summary downloaded as CSV.");
  }

  function initMap() {
    if (leafletMap || !document.getElementById("travel-map")) return;
    const target = document.getElementById("map-status");
    if (!window.L) {
      target.textContent = "Leaflet did not load. The interactive map needs network access; use the destination cards and selection list below instead.";
      renderMapFallbackList();
      return;
    }
    const defaultPlace = getPlace(document.getElementById("map-destination").value) || destinations[0];
    leafletMap = window.L.map("travel-map", { scrollWheelZoom: false }).setView(defaultPlace.coordinates, 3);
    const tiles = window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'
    }).addTo(leafletMap);
    tiles.on("tileerror", () => {
      mapTileFailed = true;
      target.textContent = "OpenStreetMap tiles could not be loaded. Markers use approximate sample coordinates; check your connection and try again.";
    });
    tiles.on("load", () => {
      if (!mapTileFailed) target.textContent = "Map tiles: OpenStreetMap · destination points: approximate sample coordinates.";
    });
    renderMapMarkers();
    window.setTimeout(() => leafletMap?.invalidateSize(), 120);
  }

  function renderMapFallbackList() {
    const target = document.getElementById("map-attraction-results");
    if (!target) return;
    target.innerHTML = `<div class="map-place-list">${destinations.map((place) => `<button class="map-place-card" data-action="details" data-id="${esc(place.id)}"><strong>${esc(place.name)}</strong><small>${esc(place.coordinateSource)} · Map tile library unavailable</small></button>`).join("")}</div>`;
  }

  function selectedMapPlaces() {
    const selected = document.getElementById("map-destination")?.value || "";
    const savedOnly = document.getElementById("map-saved-only")?.checked || false;
    return destinations.filter((place) => {
      if (selected && place.id !== selected) return false;
      return !savedOnly || state.saved.includes(place.id);
    });
  }

  function renderMapMarkers() {
    if (!leafletMap || !window.L) return;
    destinationMarkers.forEach((marker) => marker.remove());
    destinationMarkers = [];
    const places = selectedMapPlaces();
    places.forEach((place) => {
      const marker = window.L.marker(place.coordinates).addTo(leafletMap);
      marker.bindPopup(`<strong>${esc(place.name)}</strong><br><span>${esc(place.type)} · ${esc(place.coordinateSource)}</span><br><button data-action="details" data-id="${esc(place.id)}">View destination</button>`);
      destinationMarkers.push(marker);
    });
    if (places.length === 1) leafletMap.setView(places[0].coordinates, 8);
    else if (places.length > 1) leafletMap.fitBounds(window.L.latLngBounds(places.map((place) => place.coordinates)).pad(0.15), { maxZoom: 5 });
    document.getElementById("map-status").textContent = places.length
      ? `${places.length} destination marker${places.length === 1 ? "" : "s"} · approximate catalogue positions, not navigation-grade locations.`
      : "No saved places match this filter. Turn off “Saved places only” or save a destination.";
    window.setTimeout(() => leafletMap?.invalidateSize(), 80);
  }

  async function locateAttractions() {
    const place = getPlace(document.getElementById("map-destination")?.value || "");
    const resultsTarget = document.getElementById("map-attraction-results");
    if (!place || !resultsTarget) return;
    if (!navigator.onLine) { resultsTarget.textContent = "You're offline. No verified attraction coordinates are available."; return; }
    resultsTarget.innerHTML = `<p class="inline-status">Searching OpenStreetMap one place at a time…</p>`;
    const mapped = [];
    for (let index = 0; index < Math.min(3, place.attractions.length); index += 1) {
      const attraction = place.attractions[index];
      const query = `${attraction}, ${place.name}`;
      const key = query.toLowerCase();
      let found = featureState.geocodeCache[key];
      if (!found) {
        if (index > 0) await new Promise((resolve) => window.setTimeout(resolve, 1100));
        try {
          const controller = new AbortController();
          const timeout = window.setTimeout(() => controller.abort(), 6500);
          let response;
          try {
            const params = new URLSearchParams({ q: query, format: "jsonv2", limit: "1" });
            response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
              headers: { "Accept-Language": navigator.language || "en" }, signal: controller.signal
            });
          } finally { window.clearTimeout(timeout); }
          if (!response.ok) throw new Error(`OpenStreetMap search returned HTTP ${response.status}`);
          const items = await response.json();
          const result = items[0];
          if (result && Number.isFinite(Number(result.lat)) && Number.isFinite(Number(result.lon))) {
            found = { latitude: Number(result.lat), longitude: Number(result.lon), label: String(result.display_name || attraction).slice(0, 240) };
            const nextCache = { ...featureState.geocodeCache, [key]: found };
            if (saveFeature("morrow-map-geocode-cache", nextCache)) featureState.geocodeCache = nextCache;
          }
        } catch (error) {
          console.info(`OpenStreetMap lookup unavailable for ${attraction}.`, error);
        }
      }
      if (found) mapped.push({ attraction, ...found });
    }
    attractionMarkers.forEach((marker) => marker.remove());
    attractionMarkers = [];
    if (leafletMap && window.L) {
      mapped.forEach((item) => {
        const marker = window.L.marker([item.latitude, item.longitude]).addTo(leafletMap);
        marker.bindPopup(`<strong>${esc(item.attraction)}</strong><br><small>OpenStreetMap search result · verify locally before travel.</small>`);
        attractionMarkers.push(marker);
      });
      if (mapped.length) leafletMap.fitBounds(window.L.latLngBounds(mapped.map((item) => [item.latitude, item.longitude])).pad(0.2), { maxZoom: 13 });
    }
    resultsTarget.innerHTML = mapped.length
      ? `<ul>${mapped.map((item) => `<li><strong>${esc(item.attraction)}</strong><small>${esc(item.label)}</small></li>`).join("")}</ul><p class="inline-status">Only returned OpenStreetMap search results are marked. Results may need local verification.</p>`
      : `<p class="inline-status">No verified attraction coordinates were returned. Destination pins remain approximate sample locations; no attraction pins were fabricated.</p>`;
  }

  function renderNotifications() {
    const notifications = [];
    const today = dateStamp();
    state.trips.forEach((trip) => {
      const daysUntil = Math.ceil((Date.parse(`${trip.departure}T12:00:00`) - Date.parse(`${today}T12:00:00`)) / 86400000);
      const place = getPlace(trip.destinationId);
      if (daysUntil >= 0 && daysUntil <= 7) notifications.push({ title: "A trip is coming up", message: `${place?.name || "A trip"} starts in ${daysUntil} day${daysUntil === 1 ? "" : "s"}.`, route: "trips" });
      const actual = tripExpenses(trip);
      if (actual > Number(trip.budget || 0)) notifications.push({ title: "Trip budget exceeded", message: `${place?.name || "A trip"} is $${(actual - trip.budget).toLocaleString()} above its estimate.`, route: "finance" });
      const items = featureState.checklists[trip.id] || [];
      if (items.length && items.some((item) => !item.checked) && daysUntil >= 0 && daysUntil <= 14) {
        notifications.push({ title: "A few things are still on your list", message: `${items.filter((item) => !item.checked).length} checklist items remain for ${place?.name || "your trip"}.`, route: "checklist" });
      }
    });
    const liveWeather = featureState.weatherCache || {};
    Object.entries(liveWeather).forEach(([placeId, weather]) => {
      if (weather.source === "live" && (weather.rain >= 60 || weather.code >= 95)) {
        notifications.push({ title: "Weather may affect outdoor plans", message: `${getPlace(placeId)?.name || "A destination"} has a live forecast note for its approximate sample coordinate.`, route: "weather" });
      }
    });
    return notifications;
  }

  function openNotifications() {
    const items = renderNotifications();
    state.modalReturnFocus = document.activeElement;
    document.getElementById("modal-content").innerHTML = `<div class="notification-modal"><p class="eyebrow">YOUR LOCAL TRAVEL NOTES</p><h2 id="modal-title">A little heads-up.</h2><p>These reminders are calculated from this browser's saved trips and checklists. They are not push notifications.</p>${items.length ? `<div class="notification-list">${items.map((item) => `<article><strong>${esc(item.title)}</strong><p>${esc(item.message)}</p><button class="text-link" data-route="${esc(item.route)}">Open →</button></article>`).join("")}</div>` : `<div class="notification-empty"><span>✳</span><h3>Nothing needs your attention.</h3><p>Trip reminders, budget alerts, and incomplete packing lists will show here when they apply.</p></div>`}<button class="button button-outline" data-action="close-modal">Close</button></div>`;
    showModal();
  }

  function renderRoute(route) {
    renderNotificationsAndBadge();
    if (route === "assistant") renderAssistant();
    if (route === "smart-plan") {
      populateDestinationSelects();
      const form = document.getElementById("smart-plan-form");
      if (form && !form.elements.departure.value) {
        const start = addDays(dateStamp(), 14);
        form.elements.departure.value = start;
        form.elements.return.value = addDays(start, 2);
        form.elements.budget.value = state.profile.budget || 1200;
        const preferenceMatch = destinations.find((place) => place.type === state.profile.travelType);
        if (preferenceMatch) form.elements.destination.value = preferenceMatch.id;
      }
      renderCurrentPlan();
      renderSavedPlans();
    }
    if (route === "weather") {
      populateDestinationSelects();
      const select = document.getElementById("weather-destination");
      if (select && selectedWeatherPlace) select.value = selectedWeatherPlace;
    }
    if (route === "map") { populateDestinationSelects(); initMap(); renderMapMarkers(); }
    if (route === "groups") { populateDestinationSelects(); renderGroups(); }
    if (route === "checklist") renderChecklist();
    if (route === "journal") {
      fillTripSelect(document.getElementById("journal-trip"), "", true);
      renderJournal();
    }
    if (route === "finance") renderFinance();
  }

  function handleAction(button) {
    const action = button.dataset.action;
    if (action === "mobile-tools") {
      const menu = document.getElementById("mobile-tools-menu");
      menu.hidden = !menu.hidden;
      button.setAttribute("aria-expanded", String(!menu.hidden));
    } else if (action === "clear-chat") clearConversation();
    else if (action === "find-ollama-models") findOllamaModels();
    else if (action === "save-smart-plan") saveCurrentPlan();
    else if (action === "convert-smart-plan") convertPlanToTrip();
    else if (action === "regenerate-plan-day") regeneratePlanDay(Number(button.dataset.day));
    else if (action === "edit-plan-activity") openPlanActivityForm(Number(button.dataset.day), Number(button.dataset.index));
    else if (action === "add-plan-activity") openPlanActivityForm(Number(button.dataset.day));
    else if (action === "remove-plan-activity") {
      const dayIndex = Number(button.dataset.day);
      const activityIndex = Number(button.dataset.index);
      if (currentPlan?.days[dayIndex]?.activities[activityIndex]) {
        currentPlan.days[dayIndex].activities.splice(activityIndex, 1);
        renderCurrentPlan();
      }
    } else if (action === "load-smart-plan") loadSavedPlan(button.dataset.id);
    else if (action === "delete-smart-plan") {
      if (window.confirm("Delete this saved outline from this browser?")) removeSavedPlan(button.dataset.id);
    } else if (action === "load-weather") loadWeather();
    else if (action === "map-reset") {
      document.getElementById("map-destination").value = "";
      document.getElementById("map-saved-only").checked = false;
      renderMapMarkers();
    } else if (action === "map-attractions") locateAttractions();
    else if (action === "delete-group") {
      if (window.confirm("Delete this simulated group from this browser?")) {
        const next = featureState.groups.filter((group) => group.id !== button.dataset.id);
        if (saveFeature("morrow-groups", next)) { featureState.groups = next; renderGroups(); renderDashboard(); renderNotifications(); }
      }
    } else if (action === "remove-group-suggestion") {
      updateGroup(button.dataset.id, (group) => ({ ...group, suggestions: group.suggestions.filter((item) => item.id !== button.dataset.itemId) }));
    } else if (action === "toggle-checklist") {
      updateChecklistItem(button.dataset.id, { checked: button.checked });
    } else if (action === "delete-checklist-item") {
      const trip = getTrip(selectedChecklistTrip);
      if (trip) {
        const next = { ...featureState.checklists, [trip.id]: getChecklist(trip).filter((item) => item.id !== button.dataset.id) };
        if (saveFeature("morrow-checklists", next)) { featureState.checklists = next; renderChecklist(); renderDashboard(); renderNotifications(); }
      }
    } else if (action === "edit-journal") editJournalEntry(button.dataset.id);
    else if (action === "delete-journal") removeJournalEntry(button.dataset.id);
    else if (action === "cancel-journal-edit") cancelJournalEdit();
    else if (action === "export-finance") exportFinance();
    else if (action === "prompt") {
      const input = document.getElementById("assistant-input");
      if (input) { input.value = button.dataset.prompt || ""; input.focus(); }
    } else if (action === "choose-model") {
      const input = document.querySelector('#assistant-settings-form [name="model"]');
      if (input) input.value = button.dataset.model || "";
    }
  }

  function handleSubmit(event) {
    const form = event.target;
    if (form.id === "assistant-form") { void submitAssistant(event); return; }
    if (form.id === "assistant-settings-form") { event.preventDefault(); setAssistantSettings(form); return; }
    if (form.id === "smart-plan-form") { event.preventDefault(); makePlan(form); return; }
    if (form.id === "plan-activity-form") {
      event.preventDefault();
      const values = new FormData(form);
      const dayIndex = Number(values.get("day"));
      const activityIndex = Number(values.get("index"));
      const estimate = Number(values.get("estimate"));
      const title = String(values.get("title") || "").trim();
      if (!currentPlan?.days[dayIndex] || !title || !Number.isFinite(estimate) || estimate < 0) {
        showToast("Enter an activity and a valid non-negative estimated cost.");
        return;
      }
      const activity = {
        id: activityIndex >= 0 ? currentPlan.days[dayIndex].activities[activityIndex]?.id : `custom-${Date.now()}`,
        part: String(values.get("part")), title, description: String(values.get("description") || "").trim(), estimate,
        time: ({ Morning: "09:00", Afternoon: "13:30", Evening: "18:00" })[String(values.get("part"))]
      };
      if (activityIndex >= 0) currentPlan.days[dayIndex].activities[activityIndex] = activity;
      else currentPlan.days[dayIndex].activities.push(activity);
      closeModal();
      renderCurrentPlan();
      return;
    }
    if (form.id === "group-form") { event.preventDefault(); createGroup(form); return; }
    if (form.matches(".group-participant-form, .group-vote-form, .group-suggestion-form, .group-expense-form")) {
      event.preventDefault(); handleGroupForm(form); return;
    }
    if (form.id === "checklist-add-form") { event.preventDefault(); addChecklistItem(form); return; }
    if (form.id === "journal-form") { event.preventDefault(); void submitJournal(form); }
  }

  function handleChange(event) {
    const target = event.target;
    if (target.id === "checklist-trip") { selectedChecklistTrip = target.value; renderChecklist(); }
    if (target.id === "finance-trip") { selectedFinanceTrip = target.value; renderFinance(); }
    if (target.id === "weather-destination") selectedWeatherPlace = target.value;
    if (target.id === "map-destination" || target.id === "map-saved-only") renderMapMarkers();
    if (target.matches('[data-change="group-role"]')) {
      updateGroup(target.dataset.groupId, (group) => ({
        ...group,
        participants: group.participants.map((person) => person.id === target.dataset.personId ? { ...person, role: target.value } : person)
      }));
    }
  }

  function renderNotificationsAndBadge() {
    const count = renderNotifications().length;
    document.querySelectorAll(".notification-dot").forEach((dot) => { dot.hidden = count === 0; });
    document.querySelectorAll('[data-action="notifications"]').forEach((button) => button.setAttribute("aria-label", count ? `Notifications, ${count} items` : "Notifications"));
  }

  function initialize() {
    migrateFeatureStorage();
    populateDestinationSelects();
    document.addEventListener("submit", handleSubmit);
    document.addEventListener("change", handleChange);
    document.addEventListener("input", (event) => {
      if (event.target.id === "journal-search") renderJournal();
    });
    document.addEventListener("click", (event) => {
      const prompt = event.target.closest("[data-prompt]");
      if (prompt) {
        const input = document.getElementById("assistant-input");
        if (input) { input.value = prompt.dataset.prompt || ""; input.focus(); }
      }
      const modelChoice = event.target.closest(".model-choice");
      if (modelChoice) {
        const input = document.querySelector('#assistant-settings-form [name="model"]');
        if (input) input.value = modelChoice.dataset.model;
      }
    });
    const fileInput = document.querySelector('#journal-form [name="photo"]');
    fileInput?.addEventListener("change", () => {
      const status = document.getElementById("journal-status");
      if (!fileInput.files[0]) return;
      status.textContent = fileInput.files[0].size > 5 * 1024 * 1024
        ? "That file is over the 5 MB input limit. Choose a smaller image."
        : "Photo selected. It will be resized and compressed on this device before saving.";
    });
    renderDashboard();
    renderNotificationsAndBadge();
    renderRoute(state.route);
  }

  return {
    init: initialize,
    handleAction,
    renderRoute,
    renderDashboard,
    openNotifications,
    renderNotifications: renderNotificationsAndBadge
  };
})();

window.Morrow3.init();
