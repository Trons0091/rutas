
const App = {
  state: {
    view: "home",
    history: [], 
    userLocation: null,
    filters: { category: "", distance: "", price: "", tags: [], city: "" },
    favFilter: "",
    activePlaceId: null,
    plan: null,
  },
 
  templates: {},
 
  user() {
    return Auth.getCurrentUser();
  },
  isFavorite(id) {
    const u = this.user();
    return !!u && u.favorites.includes(id);
  },
  toggleFavorite(id) {
    const u = this.user();
    if (!u) return;
    const has = u.favorites.includes(id);
    const favorites = has ? u.favorites.filter(f => f !== id) : [...u.favorites, id];
    Auth.updateCurrentUser({ favorites });
    toast(has ? "Se quitó de favoritos" : "Guardado en favoritos ❤️");
  },
  getFavoritePlaces() {
    const u = this.user();
    if (!u) return [];
    return PLACES.filter(p => u.favorites.includes(p.id));
  },
  registerCategoryView(catId) {
    const u = this.user();
    if (!u) return;
    const prefs = { ...(u.prefs || {}) };
    prefs[catId] = (prefs[catId] || 0) + 1;
    Auth.updateCurrentUser({ prefs });
  },
  markVisited(id) {
    const u = this.user();
    if (!u) return;
    if (u.visited.includes(id)) return;
    Auth.updateCurrentUser({ visited: [...u.visited, id] });
    toast("Marcado como visitado ✔️");
  },
 
  requestLocation(onDone) {
    if (!navigator.geolocation) {
      toast("Tu navegador no soporta geolocalización");
      onDone && onDone(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.state.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        toast("Ubicación activada 📍");
        onDone && onDone(true);
      },
      () => {
        this.state.userLocation = null;
        toast("No pudimos acceder a tu ubicación. Actívala en el navegador para ver distancias y rutas exactas.");
        onDone && onDone(false);
      },
      { timeout: 8000 }
    );
  },
 
  getFilteredPlaces() {
    const f = this.state.filters;
    let list = PLACES.filter(p => {
      if (f.category && p.category !== f.category) return false;
      if (f.city && p.city !== f.city) return false;
      if (f.price && String(p.price) !== f.price) return false;
      if (f.tags.length && !f.tags.every(t => p.tags.includes(t))) return false;
      if (f.distance) {
        const d = placeDistance(p);
        if (d === null || d > Number(f.distance)) return false;
      }
      const q = (this.state.searchQuery || "").trim().toLowerCase();
      if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
      return true;
    });
 
    if (this.state.userLocation) {
      list = list.slice().sort((a, b) => placeDistance(a) - placeDistance(b));
    } else {
      list = list.slice().sort((a, b) => b.rating - a.rating);
    }
    return list;
  },
 
  getRecommendations() {
    const u = this.user();
    const prefs = (u && u.prefs) || {};
    const interests = (u && u.interests) || [];
    const scored = PLACES.map(p => {
      let score = (prefs[p.category] || 0) * 2 + p.rating;
      if (interests.includes(p.category)) score += 3;
      const d = placeDistance(p);
      if (d !== null) score += Math.max(0, 3 - d / 3000);
      return { p, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 6).map(s => s.p);
  },
 
  parseBudget(text) {
    const matches = text.match(/[\d][\d.,]*/g);
    if (!matches) return 100000;
    const nums = matches
      .map(m => parseInt(m.replace(/[.,]/g, ""), 10))
      .filter(n => !isNaN(n) && n >= 1000);
    if (nums.length === 0) return 100000;
    return Math.max(...nums);
  },
 
  generatePlan(text) {
    const budget = this.parseBudget(text);
    let remaining = budget;
    const items = PLAN_SLOTS.map(slot => {
      const candidates = PLACES
        .filter(p => p.category === slot.category)
        .sort((a, b) => a.cost - b.cost || b.rating - a.rating);
      const affordable = candidates.filter(c => c.cost <= remaining);
      const place = affordable.length ? affordable.sort((a, b) => b.rating - a.rating)[0] : null;
      if (place) remaining -= place.cost;
      return { slot, candidates, place, candidateIndex: place ? candidates.indexOf(place) : -1 };
    });
    return { budget, items };
  },
 
  swapPlanItem(i) {
    const item = this.state.plan.items[i];
    if (!item.candidates.length) return;
    item.candidateIndex = (item.candidateIndex + 1) % item.candidates.length;
    item.place = item.candidates[item.candidateIndex];
    renderPlanTimeline(document.querySelector(".view-plan"), this.state.plan.items);
  },
  removePlanItem(i) {
    this.state.plan.items[i].place = null;
    renderPlanTimeline(document.querySelector(".view-plan"), this.state.plan.items);
  },
 
  navigate(view, opts = {}) {
    if (!opts.replace) this.state.history.push(this.state.view);
    this.state.view = view;
    this.render();
  },
  back() {
    const prev = this.state.history.pop();
    this.state.view = prev || "home";
    this.render();
  },
 
  render() {
    const content = document.getElementById("content");
    const backBtn = document.getElementById("btn-back");
    const title = document.getElementById("topbar-title");
    content.innerHTML = "";
 
    document.querySelectorAll(".navtab").forEach(btn => {
      btn.classList.toggle("is-active", btn.dataset.view === this.state.view);
    });
 
    backBtn.hidden = this.state.history.length === 0;
 
    const view = this.state.view;
    if (view === "home") {
      title.textContent = "Inicio";
      content.appendChild(this.templates.home.content.cloneNode(true));
      renderHome(content);
    } else if (view === "search") {
      title.textContent = "Buscar";
      content.appendChild(this.templates.search.content.cloneNode(true));
      renderSearch(content);
    } else if (view === "detail") {
      title.textContent = "Detalle";
      const wrap = this.templates.detail.content.cloneNode(true);
      content.appendChild(wrap);
      const place = PLACES.find(p => p.id === this.state.activePlaceId);
      renderDetail(content.querySelector(".view-detail"), place);
    } else if (view === "plan") {
      title.textContent = "Planifica mi día";
      content.appendChild(this.templates.plan.content.cloneNode(true));
      if (this.state.plan) {
        content.querySelector("#plan-input").value = this.state.lastPlanText || "";
        renderPlanTimeline(content.querySelector(".view-plan"), this.state.plan.items);
        content.querySelector("#plan-summary").innerHTML =
          `Presupuesto disponible: <b>${formatCOP(this.state.plan.budget)}</b><br>` +
          `Costo estimado del plan: <b>${formatCOP(this.state.plan.items.reduce((s, it) => s + (it.place ? it.place.cost : 0), 0))}</b>`;
      }
    } else if (view === "favorites") {
      title.textContent = "Mis favoritos";
      content.appendChild(this.templates.favorites.content.cloneNode(true));
      renderFavorites(content);
    } else if (view === "profile") {
      title.textContent = "Perfil";
      const wrap = this.templates.profile.content.cloneNode(true);
      content.appendChild(wrap);
      renderProfile(content.querySelector(".view-profile"));
    }
  },
};
 

document.addEventListener("DOMContentLoaded", () => {
  App.templates = {
    home: document.getElementById("tpl-home"),
    search: document.getElementById("tpl-search"),
    detail: document.getElementById("tpl-detail"),
    plan: document.getElementById("tpl-plan"),
    favorites: document.getElementById("tpl-favorites"),
    profile: document.getElementById("tpl-profile"),
  };
 
  const screenLogin = document.getElementById("screen-login");
  const appShell = document.getElementById("app");
 
  function showApp() {
    screenLogin.classList.remove("is-active");
    appShell.style.display = "flex";
    App.navigate("home", { replace: true });
    App.requestLocation(() => { App.render(); });
  }
 
  if (Auth.getCurrentUser()) {
    appShell.style.display = "flex";
    showApp();
  } else {
    appShell.style.display = "none";
  }
 
  document.querySelectorAll("[data-auth-tab]").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("[data-auth-tab]").forEach(t => t.classList.remove("is-active"));
      document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("is-active"));
      tab.classList.add("is-active");
      document.getElementById(`form-${tab.dataset.authTab}`).classList.add("is-active");
    });
  });
 
  document.getElementById("form-login").addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const res = Auth.login(fd.get("email").trim(), fd.get("password"));
    const err = document.getElementById("login-error");
    if (!res.ok) { err.textContent = res.error; return; }
    err.textContent = "";
    showApp();
  });
 
  document.getElementById("form-register").addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const res = Auth.register(fd.get("name").trim(), fd.get("email").trim(), fd.get("password"));
    const err = document.getElementById("register-error");
    if (!res.ok) { err.textContent = res.error; return; }
    err.textContent = "";
    showApp();
  });
 
  document.getElementById("btn-demo-login").addEventListener("click", () => {
    const guestEmail = "invitado@rutas.demo";
    let res = Auth.login(guestEmail, "invitado123");
    if (!res.ok) res = Auth.register("Invitado", guestEmail, "invitado123");
    showApp();
  });
 
  document.getElementById("btn-logout").addEventListener("click", () => {
    Auth.logout();
    appShell.style.display = "none";
    screenLogin.classList.add("is-active");
    App.state.history = [];
  });
 
  document.getElementById("bottomnav").addEventListener("click", e => {
    const btn = e.target.closest(".navtab");
    if (!btn) return;
    App.state.history = [];
    if (btn.dataset.view === "search") { App.state.filters = { category: "", distance: "", price: "", tags: [], city: "" }; }
    App.navigate(btn.dataset.view, { replace: true });
  });
 
  document.getElementById("btn-back").addEventListener("click", () => App.back());
 
  document.getElementById("content").addEventListener("click", e => {
 
    if (e.target.closest("#btn-near-me")) {
      App.requestLocation(() => {
        App.state.filters = { category: "", distance: "", price: "", tags: [], city: "" };
        App.navigate("search");
      });
      return;
    }
 
    const catCard = e.target.closest(".category-card");
    if (catCard) {
      App.state.filters = { category: catCard.dataset.category, distance: "", price: "", tags: [], city: "" };
      App.registerCategoryView(catCard.dataset.category);
      App.navigate("search");
      return;
    }
 
    const favBtn = e.target.closest("[data-fav]");
    if (favBtn) {
      e.stopPropagation();
      App.toggleFavorite(favBtn.dataset.fav);
      App.render();
      return;
    }
 
    const card = e.target.closest(".place-card");
    if (card) {
      App.state.activePlaceId = card.dataset.placeId;
      const place = PLACES.find(p => p.id === card.dataset.placeId);
      if (place) App.registerCategoryView(place.category);
      App.navigate("detail");
      return;
    }
 
    const catChip = e.target.closest("[data-cat]");
    if (catChip) {
      App.state.filters.category = catChip.dataset.cat;
      App.navigate("search", { replace: true });
      return;
    }
 
    if (e.target.closest("#btn-filters")) {
      const panel = document.getElementById("filters-panel");
      panel.hidden = !panel.hidden;
      return;
    }
 
    const cityChip = e.target.closest("[data-city]");
    if (cityChip) {
      App.state.filters.city = cityChip.dataset.city;
      App.navigate("search", { replace: true });
      document.getElementById("filters-panel").hidden = false;
      return;
    }
 
    const distChip = e.target.closest("[data-distance]");
    if (distChip) {
      App.state.filters.distance = distChip.dataset.distance;
      App.navigate("search", { replace: true });
      document.getElementById("filters-panel").hidden = false;
      return;
    }
 
    const priceChip = e.target.closest("[data-price]");
    if (priceChip) {
      App.state.filters.price = priceChip.dataset.price;
      App.navigate("search", { replace: true });
      document.getElementById("filters-panel").hidden = false;
      return;
    }
 
    const tagChip = e.target.closest("[data-tag]");
    if (tagChip) {
      const t = tagChip.dataset.tag;
      const tags = App.state.filters.tags;
      App.state.filters.tags = tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t];
      App.navigate("search", { replace: true });
      document.getElementById("filters-panel").hidden = false;
      return;
    }
 
    if (e.target.closest("#btn-clear-filters")) {
      App.state.filters = { category: "", distance: "", price: "", tags: [], city: "" };
      App.navigate("search", { replace: true });
      document.getElementById("filters-panel").hidden = false;
      return;
    }
 
    const dirBtn = e.target.closest("[data-directions]");
    if (dirBtn) {
      const place = PLACES.find(p => p.id === dirBtn.dataset.directions);
      const openMaps = () => {
        const url = App.state.userLocation
          ? `https://www.google.com/maps/dir/?api=1&origin=${App.state.userLocation.lat},${App.state.userLocation.lng}&destination=${place.lat},${place.lng}`
          : `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
        window.open(url, "_blank");
      };
      if (App.state.userLocation) {
        openMaps();
      } else {
        App.requestLocation(() => openMaps());
      }
      return;
    }
 
    const visitedBtn = e.target.closest("[data-visited]");
    if (visitedBtn) {
      App.markVisited(visitedBtn.dataset.visited);
      App.render();
      return;
    }
 
    if (e.target.closest("#btn-generate-plan")) {
      const text = document.getElementById("plan-input").value;
      App.state.lastPlanText = text;
      App.state.plan = App.generatePlan(text);
      App.navigate("plan", { replace: true });
      return;
    }
 
    const swapBtn = e.target.closest("[data-plan-swap]");
    if (swapBtn) { App.swapPlanItem(Number(swapBtn.dataset.planSwap)); return; }
    const removeBtn = e.target.closest("[data-plan-remove]");
    if (removeBtn) { App.removePlanItem(Number(removeBtn.dataset.planRemove)); return; }
    const viewBtn = e.target.closest("[data-plan-view]");
    if (viewBtn) {
      App.state.activePlaceId = viewBtn.dataset.planView;
      App.navigate("detail");
      return;
    }
 
    const favCatChip = e.target.closest("[data-favcat]");
    if (favCatChip) {
      App.state.favFilter = favCatChip.dataset.favcat;
      App.navigate("favorites", { replace: true });
      return;
    }
 
    const interestChip = e.target.closest("[data-interest]");
    if (interestChip) {
      const u = App.user();
      const id = interestChip.dataset.interest;
      const interests = u.interests.includes(id) ? u.interests.filter(x => x !== id) : [...u.interests, id];
      Auth.updateCurrentUser({ interests });
      App.render();
      return;
    }
 
    const actionItem = e.target.closest("[data-action]");
    if (actionItem) {
      const action = actionItem.dataset.action;
      if (action === "logout") { document.getElementById("btn-logout").click(); }
      if (action === "clear-history") { Auth.updateCurrentUser({ prefs: {} }); toast("Historial de preferencias borrado"); }
      if (action === "clear-favorites") { Auth.updateCurrentUser({ favorites: [] }); toast("Favoritos vaciados"); App.render(); }
      return;
    }
  });
 
  document.getElementById("content").addEventListener("input", e => {
    if (e.target.id === "search-input") {
      App.state.searchQuery = e.target.value;
      renderSearchResults(document.querySelector(".view-search"));
    }
  });
});
 