

function placeDistance(place) {
  const loc = App.state.userLocation;
  return loc ? distanceMeters(loc, { lat: place.lat, lng: place.lng }) : null;
}

function renderPlaceCard(place, { showTags = true } = {}) {
  const card = el("div", "place-card");
  card.dataset.placeId = place.id;

  const isFav = App.isFavorite(place.id);
  const dist = placeDistance(place);

  card.innerHTML = `
    <div class="place-card__icon">${place.icon}</div>
    <div class="place-card__body">
      <div class="place-card__top">
        <p class="place-card__name">${place.name}</p>
      </div>
      <p class="place-card__meta">${priceDots(place.price)} · ⭐ ${place.rating} · ${dist !== null ? formatDistance(dist) : place.address}</p>
      ${showTags ? `<div class="place-card__tags">${place.tags.map(t => `<span class="tag-pill">${TAGS.find(x=>x.id===t)?.label || t}</span>`).join("")}</div>` : ""}
    </div>
    <button class="fav-btn" data-fav="${place.id}" aria-label="Guardar en favoritos">${isFav ? "❤️" : "🤍"}</button>
  `;
  return card;
}

function renderHome(root) {
  const grid = root.querySelector("#category-grid");
  grid.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const card = el("div", "category-card");
    card.dataset.category = cat.id;
    card.innerHTML = `<span class="category-card__icon">${cat.icon}</span><span class="category-card__label">${cat.label}</span>`;
    grid.appendChild(card);
  });

  const recList = root.querySelector("#recommend-list");
  const recs = App.getRecommendations();
  recList.innerHTML = "";
  if (recs.length === 0) {
    recList.innerHTML = `<p class="empty-state">Explora algunas categorías y aquí aparecerán tus recomendaciones.</p>`;
  } else {
    recs.forEach(p => recList.appendChild(renderPlaceCard(p, { showTags: false })));
  }
}

function renderSearch(root) {
  const chipRow = root.querySelector("#category-chips");
  chipRow.innerHTML = `<button class="chip ${!App.state.filters.category ? "is-active" : ""}" data-cat="">Todo</button>` +
    CATEGORIES.map(c => `<button class="chip ${App.state.filters.category === c.id ? "is-active" : ""}" data-cat="${c.id}">${c.icon} ${c.label}</button>`).join("");

  const distRow = root.querySelector("#filter-distance");
  const distOptions = [
    { id: "", label: "Cualquiera" },
    { id: "500", label: "< 500 m" },
    { id: "1000", label: "< 1 km" },
    { id: "5000", label: "< 5 km" },
    { id: "10000", label: "< 10 km" },
  ];
  distRow.innerHTML = distOptions.map(o => `<button class="chip ${App.state.filters.distance === o.id ? "is-active" : ""}" data-distance="${o.id}">${o.label}</button>`).join("");

  const priceRow = root.querySelector("#filter-price");
  const priceOptions = [
    { id: "", label: "Cualquiera" },
    { id: "1", label: "$" },
    { id: "2", label: "$$" },
    { id: "3", label: "$$$" },
  ];
  priceRow.innerHTML = priceOptions.map(o => `<button class="chip ${App.state.filters.price === o.id ? "is-active" : ""}" data-price="${o.id}">${o.label}</button>`).join("");

  const tagsRow = root.querySelector("#filter-tags");
  tagsRow.innerHTML = TAGS.map(t => `<button class="chip ${App.state.filters.tags.includes(t.id) ? "is-active" : ""}" data-tag="${t.id}">${t.label}</button>`).join("");

  renderSearchResults(root);
}

function renderSearchResults(root) {
  const results = App.getFilteredPlaces();
  root.querySelector("#search-count").textContent = `${results.length} lugar${results.length === 1 ? "" : "es"} encontrado${results.length === 1 ? "" : "s"}`;
  const list = root.querySelector("#search-results");
  list.innerHTML = "";
  if (results.length === 0) {
    list.innerHTML = `<p class="empty-state">No encontramos lugares con esos filtros.<br>Intenta ampliar la distancia o quitar algún filtro.</p>`;
    return;
  }
  results.forEach(p => list.appendChild(renderPlaceCard(p)));
}

function renderDetail(root, place) {
  const dist = placeDistance(place);
  const isFav = App.isFavorite(place.id);
  root.innerHTML = `
    <div class="detail-hero">${place.icon}</div>
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <h2 class="detail-name">${place.name}</h2>
      <button class="fav-btn" style="position:static; font-size:22px;" data-fav="${place.id}">${isFav ? "❤️" : "🤍"}</button>
    </div>
    <p class="detail-meta">${priceDots(place.price)} · ⭐ ${place.rating} · ${dist !== null ? formatDistance(dist) : "distancia no disponible"}</p>
    <div class="detail-tags">${place.tags.map(t => `<span class="tag-pill">${TAGS.find(x=>x.id===t)?.label || t}</span>`).join("")}</div>
    <p class="detail-desc">${place.description}</p>
    <div class="detail-row"><span>Dirección</span><span>${place.address}</span></div>
    <div class="detail-row"><span>Horario</span><span>${place.hours}</span></div>
    <div class="detail-row"><span>Costo estimado</span><span>${formatCOP(place.cost)}</span></div>
    <div class="detail-actions">
      <button class="btn btn-primary" data-directions="${place.id}">🗺️ Cómo llegar</button>
      <button class="btn btn-ghost" data-visited="${place.id}">✔️ Marcar visitado</button>
    </div>
  `;
}

const PLAN_SLOTS = [
  { time: "10:00 a. m.", label: "Café / desayuno", category: "cafe" },
  { time: "12:00 p. m.", label: "Visita turística", category: "turistico" },
  { time: "2:00 p. m.",  label: "Almuerzo", category: "restaurante" },
  { time: "4:00 p. m.",  label: "Actividad", category: "actividad" },
  { time: "6:00 p. m.",  label: "Lugar para fotografías", category: "naturaleza" },
  { time: "7:30 p. m.",  label: "Cena", category: "restaurante" },
];

function renderPlanTimeline(root, itinerary) {
  const section = root.querySelector("#plan-result-section");
  section.hidden = false;
  const total = itinerary.reduce((s, it) => s + (it.place ? it.place.cost : 0), 0);
  root.querySelector("#plan-summary").innerHTML = `Presupuesto disponible: <b>${formatCOP(itinerary.budget)}</b><br>Costo estimado del plan: <b>${formatCOP(total)}</b>`;

  const tl = root.querySelector("#plan-timeline");
  tl.innerHTML = "";
  itinerary.forEach((item, i) => {
    const div = el("div", "timeline-item");
    div.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-time">${item.slot.time}</div>
      <div class="timeline-card">
        <p class="timeline-card__label">${item.slot.label}</p>
        ${item.place ? `
          <p class="timeline-card__name">${item.place.icon} ${item.place.name}</p>
          <p class="timeline-card__cost">${formatCOP(item.place.cost)} · ${item.place.address}</p>
          <div class="timeline-card__actions">
            <button data-plan-swap="${i}">🔁 Cambiar</button>
            <button data-plan-view="${item.place.id}">Ver lugar</button>
            <button data-plan-remove="${i}">✕ Quitar</button>
          </div>
        ` : `<p class="timeline-empty">No encontramos una opción dentro de tu presupuesto para este momento.</p>`}
      </div>
    `;
    tl.appendChild(div);
  });
}

function renderFavorites(root) {
  const chips = root.querySelector("#favorites-chips");
  chips.innerHTML = `<button class="chip ${!App.state.favFilter ? "is-active" : ""}" data-favcat="">Todos</button>` +
    CATEGORIES.map(c => `<button class="chip ${App.state.favFilter === c.id ? "is-active" : ""}" data-favcat="${c.id}">${c.icon} ${c.label}</button>`).join("");

  const list = root.querySelector("#favorites-list");
  const favs = App.getFavoritePlaces().filter(p => !App.state.favFilter || p.category === App.state.favFilter);
  list.innerHTML = "";
  if (favs.length === 0) {
    list.innerHTML = `<p class="empty-state">Aún no tienes lugares guardados.<br>Toca el corazón 🤍 en cualquier lugar para guardarlo aquí.</p>`;
    return;
  }
  favs.forEach(p => list.appendChild(renderPlaceCard(p, { showTags: false })));
}

function renderProfile(root) {
  const user = App.user();
  const interestsHTML = CATEGORIES.map(c => {
    const active = (user.interests || []).includes(c.id);
    return `<button class="chip ${active ? "is-active" : ""}" data-interest="${c.id}">${c.icon} ${c.label}</button>`;
  }).join("");

  root.innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar">${user.avatar}</div>
      <div>
        <p class="profile-name">${user.name}</p>
        <p class="profile-email">${user.email}</p>
      </div>
    </div>

    <div class="stat-row">
      <div class="stat-card"><b>${(user.favorites||[]).length}</b><span>Favoritos</span></div>
      <div class="stat-card"><b>${(user.visited||[]).length}</b><span>Visitados</span></div>
      <div class="stat-card"><b>${(user.activities||[]).length}</b><span>Actividades</span></div>
    </div>

    <h3 class="section__title" style="font-size:16px;">Tus intereses</h3>
    <p class="section__hint">Selecciona lo que más te gusta para mejorar tus recomendaciones.</p>
    <div class="interest-grid">${interestsHTML}</div>

    <h3 class="section__title" style="font-size:16px;">Configuración</h3>
    <div class="profile-list-item" data-action="clear-history"><span>Borrar historial de preferencias</span><span>›</span></div>
    <div class="profile-list-item" data-action="clear-favorites"><span>Vaciar favoritos</span><span>›</span></div>
    <div class="profile-list-item" data-action="logout"><span>Cerrar sesión</span><span>›</span></div>
  `;
}
