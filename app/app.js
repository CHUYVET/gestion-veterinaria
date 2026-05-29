const DB_NAME = "gestion-veterinaria-v1";
const DB_VERSION = 1;
const APP_VERSION = "v0.4.7";

const catalogs = {
  cities: "Ciudades",
  states: "Estados",
  countries: "Paises",
  species: "Especies",
  breeds: "Razas",
  colors: "Colores"
};

const catalogTables = {
  cities: "cities",
  states: "states",
  countries: "countries",
  species: "species",
  breeds: "breeds",
  colors: "colors"
};

const allowedCountries = ["Mexico", "USA"];

const knownCityLocations = {
  "agua prieta": { state: "Sonora", country: "Mexico" },
  altar: { state: "Sonora", country: "Mexico" },
  hermosillo: { state: "Sonora", country: "Mexico" },
  guaymas: { state: "Sonora", country: "Mexico" },
  empalme: { state: "Sonora", country: "Mexico" },
  "ciudad obregon": { state: "Sonora", country: "Mexico" },
  obregon: { state: "Sonora", country: "Mexico" },
  navojoa: { state: "Sonora", country: "Mexico" },
  nogales: { state: "Sonora", country: "Mexico" },
  caborca: { state: "Sonora", country: "Mexico" },
  "puerto penasco": { state: "Sonora", country: "Mexico" },
  "san luis rio colorado": { state: "Sonora", country: "Mexico" },
  "san luis": { state: "Sonora", country: "Mexico" },
  mexicali: { state: "Baja California", country: "Mexico" },
  tijuana: { state: "Baja California", country: "Mexico" },
  ensenada: { state: "Baja California", country: "Mexico" },
  calexico: { state: "California", country: "USA" },
  "el centro": { state: "California", country: "USA" },
  "san diego": { state: "California", country: "USA" },
  "los angeles": { state: "California", country: "USA" },
  "san luis az": { state: "Arizona", country: "USA" },
  somerton: { state: "Arizona", country: "USA" },
  phoenix: { state: "Arizona", country: "USA" },
  tucson: { state: "Arizona", country: "USA" },
  yuma: { state: "Arizona", country: "USA" },
  "rio rico": { state: "Arizona", country: "USA" },
  douglas: { state: "Arizona", country: "USA" },
  "sierra vista": { state: "Arizona", country: "USA" },
  "nogales az": { state: "Arizona", country: "USA" },
  "las vegas": { state: "Nevada", country: "USA" }
};

const knownStateCountries = {
  aguascalientes: "Mexico",
  "baja california": "Mexico",
  "baja california sur": "Mexico",
  campeche: "Mexico",
  chiapas: "Mexico",
  chihuahua: "Mexico",
  coahuila: "Mexico",
  colima: "Mexico",
  durango: "Mexico",
  guanajuato: "Mexico",
  guerrero: "Mexico",
  hidalgo: "Mexico",
  jalisco: "Mexico",
  mexico: "Mexico",
  michoacan: "Mexico",
  morelos: "Mexico",
  nayarit: "Mexico",
  "nuevo leon": "Mexico",
  oaxaca: "Mexico",
  puebla: "Mexico",
  queretaro: "Mexico",
  "quintana roo": "Mexico",
  "san luis potosi": "Mexico",
  sinaloa: "Mexico",
  sonora: "Mexico",
  tabasco: "Mexico",
  tamaulipas: "Mexico",
  tlaxcala: "Mexico",
  veracruz: "Mexico",
  yucatan: "Mexico",
  zacatecas: "Mexico",
  alabama: "USA",
  alaska: "USA",
  arizona: "USA",
  arkansas: "USA",
  california: "USA",
  colorado: "USA",
  connecticut: "USA",
  delaware: "USA",
  florida: "USA",
  georgia: "USA",
  hawaii: "USA",
  idaho: "USA",
  illinois: "USA",
  indiana: "USA",
  iowa: "USA",
  kansas: "USA",
  kentucky: "USA",
  louisiana: "USA",
  maine: "USA",
  maryland: "USA",
  massachusetts: "USA",
  michigan: "USA",
  minnesota: "USA",
  mississippi: "USA",
  missouri: "USA",
  montana: "USA",
  nebraska: "USA",
  nevada: "USA",
  "new hampshire": "USA",
  "new jersey": "USA",
  "new mexico": "USA",
  "new york": "USA",
  "north carolina": "USA",
  "north dakota": "USA",
  ohio: "USA",
  oklahoma: "USA",
  oregon: "USA",
  pennsylvania: "USA",
  "rhode island": "USA",
  "south carolina": "USA",
  "south dakota": "USA",
  tennessee: "USA",
  texas: "USA",
  utah: "USA",
  vermont: "USA",
  virginia: "USA",
  washington: "USA",
  "west virginia": "USA",
  wisconsin: "USA",
  wyoming: "USA"
};

let db;
let supabaseClient;
let statusTimer;

let state = {
  clients: [],
  pets: [],
  visits: [],
  documents: [],
  receiptItems: [],
  serviceItems: [],
  catalogs: {},
  selectedClientId: null,
  selectedPetId: null,
  selectedVisitId: null,
  pendingPhoto: "",
  pendingPhotoFile: null,
  session: null,
  storageMode: "local"
};

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", async () => {
  db = await openDatabase();
  await seedCatalogs();
  await initSupabase();
  wireEvents();
  setInitialDefaults();
  await loadState();
  renderAppVisibility();
  renderAll();
  registerServiceWorker();
});

async function initSupabase() {
  if (!window.supabase || !window.SUPABASE_CONFIG?.url || !window.SUPABASE_CONFIG?.publishableKey) {
    state.storageMode = "local";
    flashStatus("Modo local");
    return;
  }

  supabaseClient = window.supabase.createClient(
    window.SUPABASE_CONFIG.url,
    window.SUPABASE_CONFIG.publishableKey
  );

  const { data } = await supabaseClient.auth.getSession();
  state.session = data.session;
  state.storageMode = state.session ? "supabase" : "local";

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    state.session = session;
    state.storageMode = session ? "supabase" : "local";
    await loadState();
    renderAppVisibility();
    renderAll();
  });
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      ["clients", "pets", "visits", "catalogs"].forEach((store) => {
        if (!database.objectStoreNames.contains(store)) {
          database.createObjectStore(store, { keyPath: "id" });
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx(store, mode = "readonly") {
  return db.transaction(store, mode).objectStore(store);
}

function getAll(store) {
  return new Promise((resolve, reject) => {
    const request = tx(store).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function put(store, value) {
  return new Promise((resolve, reject) => {
    const request = tx(store, "readwrite").put(value);
    request.onsuccess = () => resolve(value);
    request.onerror = () => reject(request.error);
  });
}

async function seedCatalogs() {
  const existing = await getAll("catalogs");
  if (existing.length > 0) return;

  const defaults = {
    cities: ["Hermosillo"],
    states: ["Sonora"],
    countries: allowedCountries,
    species: ["Canino", "Felino"],
    breeds: ["Mestizo"],
    colors: ["Blanco", "Negro", "Cafe", "Gris"]
  };

  await Promise.all(Object.entries(defaults).map(([type, values]) => {
    return put("catalogs", { id: type, type, values });
  }));
}

async function loadState() {
  if (state.storageMode === "supabase" && supabaseClient) {
    await loadRemoteState();
    return;
  }

  await loadLocalState();
}

async function loadLocalState() {
  const [clients, pets, visits, catalogRows] = await Promise.all([
    getAll("clients"),
    getAll("pets"),
    getAll("visits"),
    getAll("catalogs")
  ]);

  state.clients = clients.sort(sortByName("fullName"));
  state.pets = pets.sort(sortByName("name"));
  state.visits = visits.sort((a, b) => (b.visitDate || "").localeCompare(a.visitDate || ""));
  state.catalogs = Object.fromEntries(catalogRows.map((row) => [row.type, row.values.sort()]));

  keepValidSelection();
}

async function loadRemoteState() {
  const [
    countries,
    states,
    cities,
    species,
    breeds,
    colors,
    clients,
    pets,
    visits,
    serviceItems,
    documents,
    receiptItems
  ] = await Promise.all([
    selectCatalog("countries"),
    selectCatalog("states"),
    selectCatalog("cities"),
    selectCatalog("species"),
    selectCatalog("breeds"),
    selectCatalog("colors"),
    supabaseClient
      .from("clients")
      .select("id, admission_date, full_name, address, notice, city:cities(name), state:states(name), country:countries(name)")
      .order("full_name", { ascending: true }),
    supabaseClient
      .from("pets")
      .select("id, client_id, admission_date, name, sex, birth_date, photo_path, notice, species:species(name), breed:breeds(name), color:colors(name)")
      .order("name", { ascending: true }),
    supabaseClient
      .from("visits")
      .select("id, pet_id, visit_date, owner_complaint, physiological_constants, symptoms, prognosis, diagnosis, observations")
      .order("visit_date", { ascending: false }),
    supabaseClient
      .from("service_items")
      .select("id, item_type, name, default_price, default_instructions, active")
      .order("name", { ascending: true }),
    supabaseClient
      .from("documents")
      .select("id, visit_id, document_type, title, document_date, notes")
      .order("document_date", { ascending: false }),
    supabaseClient
      .from("receipt_items")
      .select("id, document_id, service_item_id, description, quantity, unit_price, total, sort_order")
      .order("sort_order", { ascending: true })
  ]);

  throwIfSupabaseError(countries.error);
  throwIfSupabaseError(states.error);
  throwIfSupabaseError(cities.error);
  throwIfSupabaseError(species.error);
  throwIfSupabaseError(breeds.error);
  throwIfSupabaseError(colors.error);
  throwIfSupabaseError(clients.error);
  throwIfSupabaseError(pets.error);
  throwIfSupabaseError(visits.error);
  throwIfSupabaseError(serviceItems.error);
  throwIfSupabaseError(documents.error);
  throwIfSupabaseError(receiptItems.error);

  state.catalogs = {
    countries: rowsToNames(countries.data),
    states: rowsToNames(states.data),
    cities: rowsToNames(cities.data),
    species: rowsToNames(species.data),
    breeds: rowsToNames(breeds.data),
    colors: rowsToNames(colors.data)
  };

  state.clients = (clients.data || []).map((client) => ({
    id: client.id,
    admissionDate: client.admission_date,
    fullName: client.full_name,
    address: client.address || "",
    city: client.city?.name || "",
    state: client.state?.name || "",
    country: client.country?.name || "",
    notice: client.notice || ""
  }));

  state.pets = (pets.data || []).map((pet) => ({
    id: pet.id,
    clientId: pet.client_id,
    admissionDate: pet.admission_date,
    name: pet.name,
    species: pet.species?.name || "",
    sex: pet.sex,
    breed: pet.breed?.name || "",
    color: pet.color?.name || "",
    birthDate: pet.birth_date || "",
    photo: pet.photo_path || "",
    photoUrl: "",
    notice: pet.notice || ""
  }));

  await loadPetPhotoUrls();
  state.visits = (visits.data || []).map((visit) => ({
    id: visit.id,
    petId: visit.pet_id,
    visitDate: visit.visit_date,
    ownerComplaint: visit.owner_complaint || "",
    physiologicalConstants: visit.physiological_constants || "",
    symptoms: visit.symptoms || "",
    prognosis: visit.prognosis || "",
    diagnosis: visit.diagnosis || "",
    observations: visit.observations || ""
  }));

  state.serviceItems = (serviceItems.data || []).map((item) => ({
    id: item.id,
    itemType: item.item_type,
    name: item.name,
    defaultPrice: Number(item.default_price || 0),
    defaultInstructions: item.default_instructions || "",
    active: item.active
  }));

  state.documents = (documents.data || []).map((document) => ({
    id: document.id,
    visitId: document.visit_id,
    documentType: document.document_type,
    title: document.title || "",
    documentDate: document.document_date,
    notes: document.notes || ""
  }));

  state.receiptItems = (receiptItems.data || []).map((item) => ({
    id: item.id,
    documentId: item.document_id,
    serviceItemId: item.service_item_id,
    description: item.description,
    quantity: Number(item.quantity || 0),
    unitPrice: Number(item.unit_price || 0),
    total: Number(item.total || 0),
    sortOrder: item.sort_order || 0
  }));

  keepValidSelection();
}

async function loadPetPhotoUrls() {
  const petsWithPhotos = state.pets.filter((pet) => pet.photo);
  await Promise.all(petsWithPhotos.map(async (pet) => {
    const { data } = await supabaseClient.storage
      .from("pet-photos")
      .createSignedUrl(pet.photo, 60 * 60);
    pet.photoUrl = data?.signedUrl || "";
  }));
}

function keepValidSelection() {
  if (!state.selectedClientId && state.clients.length) {
    state.selectedClientId = state.clients[0].id;
  }

  if (state.selectedClientId && !state.clients.some((client) => client.id === state.selectedClientId)) {
    state.selectedClientId = state.clients[0]?.id || null;
  }

  const pets = state.pets.filter((pet) => pet.clientId === state.selectedClientId);
  if (state.selectedPetId && !pets.some((pet) => pet.id === state.selectedPetId)) {
    state.selectedPetId = pets[0]?.id || null;
  }

  const visits = state.visits.filter((visit) => visit.petId === state.selectedPetId);
  if (state.selectedVisitId && !visits.some((visit) => visit.id === state.selectedVisitId)) {
    state.selectedVisitId = visits[0]?.id || null;
  }
}

function selectCatalog(table) {
  return supabaseClient.from(table).select("id, name").order("name", { ascending: true });
}

function rowsToNames(rows) {
  return (rows || []).map((row) => row.name).sort((a, b) => a.localeCompare(b, "es"));
}

function throwIfSupabaseError(error) {
  if (error) throw error;
}

function sortByName(field) {
  return (a, b) => (a[field] || "").localeCompare(b[field] || "", "es");
}

function wireEvents() {
  $("authForm").addEventListener("submit", signIn);
  $("appVersion").textContent = APP_VERSION;
  $("refreshAppButton").addEventListener("click", refreshApp);
  $("signUpButton").addEventListener("click", signUp);
  $("signOutButton").addEventListener("click", signOut);
  $("clientForm").addEventListener("submit", saveClient);
  $("clientCity").addEventListener("change", applyKnownCityLocation);
  $("clientCity").addEventListener("blur", applyKnownCityLocation);
  $("clientState").addEventListener("change", applyKnownStateCountry);
  $("clientState").addEventListener("blur", applyKnownStateCountry);
  $("clientCountry").addEventListener("blur", normalizeClientCountry);
  $("petForm").addEventListener("submit", savePet);
  $("petBirthDate").addEventListener("input", updateAge);
  $("petPhoto").addEventListener("change", readPetPhoto);
  $("newClientButton").addEventListener("click", newClient);
  $("searchInput").addEventListener("input", renderClientList);
  $("saveVisitDraft").addEventListener("click", saveVisit);
  $("receiptForm").addEventListener("submit", saveReceipt);
  $("receiptDescription").addEventListener("input", fillReceiptPriceFromCatalog);
  $("receiptQuantity").addEventListener("input", updateReceiptTotal);
  $("receiptUnitPrice").addEventListener("input", updateReceiptTotal);

  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
  });
}

async function signIn(event) {
  event.preventDefault();
  if (!supabaseClient) {
    setAuthMessage("Supabase no esta disponible. Revisa la conexion a internet.");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: $("authEmail").value.trim(),
    password: $("authPassword").value
  });

  if (error) {
    setAuthMessage(error.message);
    return;
  }

  setAuthMessage("");
  flashStatus("Sesion iniciada");
}

async function signUp() {
  if (!supabaseClient) {
    setAuthMessage("Supabase no esta disponible. Revisa la conexion a internet.");
    return;
  }

  const { error } = await supabaseClient.auth.signUp({
    email: $("authEmail").value.trim(),
    password: $("authPassword").value
  });

  if (error) {
    setAuthMessage(error.message);
    return;
  }

  setAuthMessage("Acceso creado. Si Supabase pide confirmacion, revisa el correo.");
}

async function signOut() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  state.session = null;
  state.storageMode = "local";
  renderAppVisibility();
  flashStatus("Sesion cerrada");
}

function setAuthMessage(message) {
  $("authMessage").textContent = message;
}

function renderAppVisibility() {
  const hasSession = Boolean(state.session);
  $("authPanel").hidden = hasSession;
  $("appShell").hidden = !hasSession;
  $("signOutButton").hidden = !hasSession;
  $("storageStatus").textContent = hasSession ? "Sincronizado en Supabase" : "Requiere sesion";
}

function setInitialDefaults() {
  setClientDateDefault();
  setPetDateDefault();
  setVisitDateDefault();
}

function setClientDateDefault() {
  $("clientAdmissionDate").value = new Date().toISOString().slice(0, 10);
}

function setPetDateDefault() {
  $("petAdmissionDate").value = new Date().toISOString().slice(0, 10);
}

function setVisitDateDefault() {
  $("visitDate").value = toLocalDateTimeInput(new Date());
}

function toLocalDateTimeInput(date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function renderAll() {
  renderDatalists();
  renderClientList();
  renderClientForm();
  renderPetList();
  renderPetForm();
  renderVisits();
  renderCatalogs();
}

function renderDatalists() {
  const map = {
    cities: "citiesList",
    states: "statesList",
    countries: "countriesList",
    species: "speciesList",
    breeds: "breedsList",
    colors: "colorsList"
  };

  Object.entries(map).forEach(([type, id]) => {
    const values = getCatalogValuesForDatalist(type);
    $(id).innerHTML = values
      .map((value) => `<option value="${escapeHtml(value)}"></option>`)
      .join("");
  });

  $("serviceItemsList").innerHTML = state.serviceItems
    .filter((item) => item.active)
    .map((item) => `<option value="${escapeHtml(item.name)}"></option>`)
    .join("");
}

function getCatalogValuesForDatalist(type) {
  if (type === "countries") return allowedCountries;

  const values = new Set(state.catalogs[type] || []);
  if (type === "cities") {
    state.clients.forEach((client) => {
      if (client.city) values.add(client.city);
    });
  }
  if (type === "states") {
    Object.keys(knownStateCountries).forEach((stateName) => values.add(toTitleCase(stateName)));
    state.clients.forEach((client) => {
      if (client.state) values.add(client.state);
    });
  }

  return Array.from(values).sort((a, b) => a.localeCompare(b, "es"));
}

function renderClientList() {
  const query = normalizeText($("searchInput").value);
  const rows = state.clients.filter((client) => {
    return buildClientSearchText(client).includes(query);
  });

  $("searchCount").value = query
    ? `${rows.length} resultado${rows.length === 1 ? "" : "s"}`
    : `${state.clients.length} cliente${state.clients.length === 1 ? "" : "s"}`;

  $("clientList").innerHTML = rows.length ? rows.map((client) => {
    const pets = state.pets.filter((pet) => pet.clientId === client.id);
    const petSummary = pets.map((pet) => [pet.name, pet.species, pet.breed, pet.color].filter(Boolean).join(" / ")).join(" | ");
    return `
      <button class="client-row ${client.id === state.selectedClientId ? "is-active" : ""}" data-client="${client.id}" type="button">
        <div class="row-title">
          <span>${escapeHtml(client.fullName)}</span>
          <span>${pets.length}</span>
        </div>
        <div class="row-meta">${escapeHtml([client.city, client.state].filter(Boolean).join(", ") || "Sin ubicacion")}</div>
        ${petSummary ? `<div class="row-detail">${escapeHtml(petSummary)}</div>` : ""}
        ${client.notice ? `<div class="notice">${escapeHtml(client.notice)}</div>` : ""}
      </button>
    `;
  }).join("") : `<div class="empty-state">No hay clientes capturados.</div>`;

  document.querySelectorAll("[data-client]").forEach((button) => {
    button.addEventListener("click", () => selectClient(button.dataset.client));
  });
}

function buildClientSearchText(client) {
  const pets = state.pets.filter((pet) => pet.clientId === client.id);
  const visits = state.visits.filter((visit) => pets.some((pet) => pet.id === visit.petId));
  const values = [
    client.fullName,
    client.address,
    client.city,
    client.state,
    client.country,
    client.notice,
    ...pets.flatMap((pet) => [
      pet.name,
      pet.species,
      pet.sex,
      pet.breed,
      pet.color,
      pet.notice,
      calculateAge(pet.birthDate)
    ]),
    ...visits.flatMap((visit) => [
      visit.ownerComplaint,
      visit.physiologicalConstants,
      visit.symptoms,
      visit.prognosis,
      visit.diagnosis,
      visit.observations
    ])
  ];

  return normalizeText(values.filter(Boolean).join(" "));
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function applyKnownCityLocation() {
  const key = normalizeText($("clientCity").value);
  const location = getCityLocation(key);
  if (!location) return;

  $("clientState").value = location.state;
  $("clientCountry").value = location.country;
}

function getCityLocation(cityKey) {
  if (!cityKey) return null;
  const client = [...state.clients].reverse().find((item) => {
    return normalizeText(item.city) === cityKey && item.state && item.country;
  });
  if (client) {
    return {
      state: client.state,
      country: normalizeCountryName(client.country)
    };
  }
  return knownCityLocations[cityKey] || null;
}

function applyKnownStateCountry() {
  const key = normalizeText($("clientState").value);
  const country = knownStateCountries[key];
  if (country) {
    $("clientCountry").value = country;
  }
}

function normalizeClientCountry() {
  $("clientCountry").value = normalizeCountryName($("clientCountry").value);
}

function normalizeCountryName(value) {
  const key = normalizeText(value);
  if (!key) return "";
  if (["mexico", "méxico", "mx"].includes(key)) return "Mexico";
  if (["usa", "us", "u.s.", "u.s.a.", "estados unidos", "united states"].includes(key)) return "USA";
  return value.trim();
}

function toTitleCase(value) {
  return String(value || "")
    .split(" ")
    .map((word) => word ? word[0].toUpperCase() + word.slice(1) : "")
    .join(" ");
}

function setClientSaveMessage(message, type = "") {
  const element = $("clientSaveMessage");
  element.textContent = message;
  element.classList.toggle("is-error", type === "error");
  element.classList.toggle("is-success", type === "success");
}

function renderClientForm() {
  const client = state.clients.find((item) => item.id === state.selectedClientId);
  if (!client) {
    $("clientForm").reset();
    $("clientId").value = "";
    $("clientModeLabel").textContent = "Capturando cliente nuevo";
    $("saveClientButton").textContent = "Guardar nuevo cliente";
    setClientDateDefault();
    return;
  }

  $("clientModeLabel").textContent = "Editando cliente seleccionado";
  $("saveClientButton").textContent = "Actualizar cliente";
  $("clientId").value = client.id;
  $("clientAdmissionDate").value = client.admissionDate;
  $("clientFullName").value = client.fullName;
  $("clientAddress").value = client.address || "";
  $("clientCity").value = client.city || "";
  $("clientState").value = client.state || "";
  $("clientCountry").value = client.country || "";
  $("clientNotice").value = client.notice || "";
}

function renderPetList() {
  const pets = state.pets.filter((pet) => pet.clientId === state.selectedClientId);
  if (!state.selectedPetId && pets.length) state.selectedPetId = pets[0].id;
  if (!pets.some((pet) => pet.id === state.selectedPetId)) state.selectedPetId = pets[0]?.id || null;

  $("petList").innerHTML = pets.length ? pets.map((pet) => `
    <button class="pet-row ${pet.id === state.selectedPetId ? "is-active" : ""}" data-pet="${pet.id}" type="button">
      <div class="row-title">
        <span>${escapeHtml(pet.name)}</span>
        <span>${escapeHtml(pet.sex)}</span>
      </div>
      <div class="row-meta">${escapeHtml([pet.species, pet.breed, calculateAge(pet.birthDate)].filter(Boolean).join(" - "))}</div>
      ${pet.notice ? `<div class="notice">${escapeHtml(pet.notice)}</div>` : ""}
    </button>
  `).join("") : `<div class="empty-state">Este cliente aun no tiene mascotas.</div>`;

  document.querySelectorAll("[data-pet]").forEach((button) => {
    button.addEventListener("click", () => selectPet(button.dataset.pet));
  });
}

function renderPetForm() {
  const pet = state.pets.find((item) => item.id === state.selectedPetId);
  $("petForm").reset();
  state.pendingPhoto = "";
  state.pendingPhotoFile = null;
  setPetDateDefault();

  if (pet) {
    $("petId").value = pet.id;
    $("petAdmissionDate").value = pet.admissionDate;
    $("petName").value = pet.name;
    $("petSpecies").value = pet.species || "";
    $("petSex").value = pet.sex || "Macho";
    $("petBreed").value = pet.breed || "";
    $("petColor").value = pet.color || "";
    $("petBirthDate").value = pet.birthDate || "";
    $("petNotice").value = pet.notice || "";
    setPhotoPreview(pet.photoUrl || pet.photo || "");
  } else {
    $("petId").value = "";
    setPhotoPreview("");
  }

  updateAge();
  renderVisitPetName();
  renderReceiptArea();
}

function renderVisitPetName() {
  const pet = state.pets.find((item) => item.id === state.selectedPetId);
  $("visitPetName").value = pet ? pet.name : "Selecciona o guarda una mascota";
}

function renderVisits() {
  const visits = state.visits.filter((visit) => visit.petId === state.selectedPetId);
  if (!state.selectedVisitId && visits.length) state.selectedVisitId = visits[0].id;
  $("visitList").innerHTML = visits.length ? visits.map((visit) => `
    <button class="visit-row ${visit.id === state.selectedVisitId ? "is-active" : ""}" data-visit="${visit.id}" type="button">
      <div class="row-title">
        <span>${formatDateTime(visit.visitDate)}</span>
        <span>${escapeHtml(visit.prognosis || "")}</span>
      </div>
      <div class="row-meta">${escapeHtml(visit.ownerComplaint || "Sin queja registrada")}</div>
    </button>
  `).join("") : `<div class="empty-state">Las visitas de esta mascota apareceran aqui.</div>`;

  document.querySelectorAll("[data-visit]").forEach((button) => {
    button.addEventListener("click", () => selectVisit(button.dataset.visit));
  });
  renderReceiptArea();
}

function renderReceiptArea() {
  const visit = state.visits.find((item) => item.id === state.selectedVisitId);
  $("receiptVisitLabel").textContent = visit
    ? `Visita seleccionada: ${formatDateTime(visit.visitDate)}`
    : "Selecciona una visita para capturar recibos.";

  const receiptDocuments = state.documents.filter((document) => {
    return document.visitId === state.selectedVisitId && document.documentType === "Recibo";
  });
  const receiptDocumentIds = new Set(receiptDocuments.map((document) => document.id));
  const items = state.receiptItems.filter((item) => receiptDocumentIds.has(item.documentId));
  const total = items.reduce((sum, item) => sum + item.total, 0);

  $("receiptList").innerHTML = items.length ? `
    ${items.map((item) => `
      <article class="receipt-row">
        <div class="row-title">
          <span>${escapeHtml(item.description)}</span>
          <span>${formatCurrency(item.total)}</span>
        </div>
        <div class="row-meta">${item.quantity} x ${formatCurrency(item.unitPrice)}</div>
      </article>
    `).join("")}
    <article class="receipt-row">
      <div class="row-title">
        <span>Total recibos</span>
        <span>${formatCurrency(total)}</span>
      </div>
    </article>
  ` : `<div class="empty-state">No hay recibos capturados para esta visita.</div>`;

  updateReceiptTotal();
}

function renderCatalogs() {
  $("catalogPanel").innerHTML = Object.entries(catalogs).map(([type, title]) => {
    const values = state.catalogs[type] || [];
    return `
      <section class="catalog-box">
        <h3>${title}</h3>
        <div class="catalog-tags">
          ${values.length ? values.map((value) => `<span class="tag">${escapeHtml(value)}</span>`).join("") : `<span class="row-meta">Sin datos</span>`}
        </div>
      </section>
    `;
  }).join("");
}

async function saveClient(event) {
  event.preventDefault();
  $("saveClientButton").disabled = true;
  applyKnownCityLocation();
  applyKnownStateCountry();
  normalizeClientCountry();
  const client = {
    id: $("clientId").value || crypto.randomUUID(),
    admissionDate: $("clientAdmissionDate").value,
    fullName: $("clientFullName").value.trim(),
    address: $("clientAddress").value.trim(),
    city: $("clientCity").value.trim(),
    state: $("clientState").value.trim(),
    country: normalizeCountryName($("clientCountry").value),
    notice: $("clientNotice").value.trim(),
    updatedAt: new Date().toISOString()
  };

  if (!client.fullName) {
    setClientSaveMessage("Escribe el nombre completo del cliente.", "error");
    $("saveClientButton").disabled = false;
    return;
  }
  if (client.country && !allowedCountries.includes(client.country)) {
    setClientSaveMessage("Pais permitido: Mexico o USA.", "error");
    flashStatus("Pais permitido: Mexico o USA");
    $("saveClientButton").disabled = false;
    return;
  }

  try {
    await saveClientLocally(client);
    state.selectedClientId = client.id;
    upsertClientInMemory(client);
    keepValidSelection();
    renderAll();

    if (state.storageMode === "supabase") {
      setClientSaveMessage("Guardado en pantalla. Confirmando Supabase...");
      flashStatus("Confirmando Supabase");
      showLongSyncHint(client.id);
      syncClientInBackground(client);
    } else {
      setClientSaveMessage("Cliente guardado correctamente.", "success");
      flashStatus("Cliente guardado");
    }
  } catch (error) {
    console.error(error);
    const message = error.message || "No se pudo guardar el cliente";
    setClientSaveMessage(message, "error");
    flashStatus(message);
  } finally {
    $("saveClientButton").disabled = false;
  }
}

async function saveClientLocally(client) {
  await Promise.all([
    put("clients", client),
    remember("cities", client.city),
    remember("states", client.state),
    remember("countries", client.country)
  ]);
}

function upsertClientInMemory(client) {
  const existingIndex = state.clients.findIndex((item) => item.id === client.id);
  if (existingIndex >= 0) {
    state.clients[existingIndex] = { ...state.clients[existingIndex], ...client };
  } else {
    state.clients.push(client);
  }
  state.clients.sort(sortByName("fullName"));
}

async function syncClientInBackground(client) {
  try {
    await saveRemoteClient(client);
    await verifyRemoteClient(client.id);

    if (state.selectedClientId === client.id) {
      setTemporaryClientSaveMessage("Cliente sincronizado en Supabase.", "success", client.id);
    }
    flashStatus("Sincronizado en Supabase");

    put("clients", { ...client, syncPending: false }).catch(console.error);
    refreshRemoteStateAfterClientSync(client.id);
  } catch (error) {
    console.error(error);
    await put("clients", { ...client, syncPending: true });
    if (state.selectedClientId === client.id) {
      setClientSaveMessage("Guardado localmente, pendiente de sincronizar.", "error");
    }
    flashStatus("Pendiente de sincronizar");
  }
}

async function refreshRemoteStateAfterClientSync(clientId) {
  try {
    if (state.storageMode === "supabase") {
      const currentMessage = $("clientSaveMessage").textContent;
      state.selectedClientId = clientId;
      await loadState();
      renderAll();
      if (state.selectedClientId === clientId && currentMessage) {
        setClientSaveMessage(currentMessage, currentMessage.includes("sincronizado") ? "success" : "");
      }
    }
  } catch (error) {
    console.error(error);
  }
}

function showLongSyncHint(clientId) {
  window.setTimeout(() => {
    if (state.selectedClientId !== clientId) return;
    if ($("clientSaveMessage").textContent === "Guardado en pantalla. Confirmando Supabase...") {
      setClientSaveMessage("Guardado localmente. Supabase sigue confirmando...");
    }
  }, 5000);
}

function setTemporaryClientSaveMessage(message, type, clientId) {
  setClientSaveMessage(message, type);
  window.setTimeout(() => {
    if (state.selectedClientId !== clientId) return;
    if ($("clientSaveMessage").textContent === message) {
      setClientSaveMessage("");
    }
  }, 4500);
}

async function savePet(event) {
  event.preventDefault();
  if (!state.selectedClientId) {
    flashStatus("Guarda primero un cliente");
    return;
  }

  const current = state.pets.find((pet) => pet.id === $("petId").value);
  const pet = {
    id: $("petId").value || crypto.randomUUID(),
    clientId: state.selectedClientId,
    admissionDate: $("petAdmissionDate").value,
    name: $("petName").value.trim(),
    species: $("petSpecies").value.trim(),
    sex: $("petSex").value,
    breed: $("petBreed").value.trim(),
    color: $("petColor").value.trim(),
    birthDate: $("petBirthDate").value,
    photo: state.pendingPhoto || current?.photo || "",
    photoFile: state.pendingPhotoFile,
    notice: $("petNotice").value.trim(),
    updatedAt: new Date().toISOString()
  };

  if (!pet.name) return;

  try {
    if (state.storageMode === "supabase") {
      await saveRemotePet(pet);
    } else {
      await Promise.all([
        put("pets", pet),
        remember("species", pet.species),
        remember("breeds", pet.breed),
        remember("colors", pet.color)
      ]);
    }

    state.selectedPetId = pet.id;
    await loadState();
    renderAll();
    flashStatus("Mascota guardada");
  } catch (error) {
    flashStatus(error.message || "No se pudo guardar");
  }
}

async function saveVisit() {
  if (!state.selectedPetId) {
    flashStatus("Selecciona una mascota");
    return;
  }

  const visit = {
    id: crypto.randomUUID(),
    petId: state.selectedPetId,
    visitDate: $("visitDate").value || toLocalDateTimeInput(new Date()),
    ownerComplaint: $("ownerComplaint").value.trim(),
    physiologicalConstants: $("physiologicalConstants").value.trim(),
    symptoms: $("symptoms").value.trim(),
    prognosis: $("prognosis").value.trim(),
    diagnosis: $("diagnosis").value.trim(),
    observations: "",
    updatedAt: new Date().toISOString()
  };

  try {
    if (state.storageMode === "supabase") {
      await saveRemoteVisit(visit);
    } else {
      await put("visits", visit);
    }

    $("visitDraftForm").reset();
    setVisitDateDefault();
    await loadState();
    renderVisits();
    renderReceiptArea();
    flashStatus("Visita guardada");
  } catch (error) {
    flashStatus(error.message || "No se pudo guardar");
  }
}

async function saveReceipt(event) {
  event.preventDefault();
  if (state.storageMode !== "supabase") {
    flashStatus("Inicia sesion para guardar recibos");
    return;
  }
  if (!state.selectedVisitId) {
    flashStatus("Selecciona una visita");
    return;
  }

  const description = $("receiptDescription").value.trim();
  const quantity = Number($("receiptQuantity").value || 0);
  const unitPrice = Number($("receiptUnitPrice").value || 0);
  if (!description || quantity <= 0) {
    flashStatus("Completa concepto y cantidad");
    return;
  }

  try {
    await saveRemoteReceipt({
      visitId: state.selectedVisitId,
      description,
      quantity,
      unitPrice
    });
    $("receiptForm").reset();
    $("receiptQuantity").value = "1";
    $("receiptUnitPrice").value = "0";
    await loadState();
    renderDatalists();
    renderReceiptArea();
    flashStatus("Recibo guardado");
  } catch (error) {
    flashStatus(error.message || "No se pudo guardar recibo");
  }
}

async function saveRemoteClient(client) {
  const accessToken = await getSupabaseAccessToken();
  const response = await fetchWithTimeout(
    `${window.SUPABASE_CONFIG.url}/rest/v1/rpc/save_client_with_location`,
    {
      method: "POST",
      headers: {
        "apikey": window.SUPABASE_CONFIG.publishableKey,
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        p_id: client.id,
        p_admission_date: client.admissionDate,
        p_full_name: client.fullName,
        p_address: client.address || null,
        p_city: client.city || null,
        p_state: client.state || null,
        p_country: client.country || null,
        p_notice: client.notice || null,
        p_updated_at: client.updatedAt
      })
    },
    60000,
    "Supabase tardo demasiado al guardar el cliente. Revisa la conexion e intenta otra vez."
  );

  if (!response.ok) {
    throw new Error(await readSupabaseError(response));
  }
}

async function verifyRemoteClient(clientId) {
  const accessToken = await getSupabaseAccessToken();
  const response = await fetchWithTimeout(
    `${window.SUPABASE_CONFIG.url}/rest/v1/clients?id=eq.${encodeURIComponent(clientId)}&select=id`,
    {
      method: "GET",
      headers: {
        "apikey": window.SUPABASE_CONFIG.publishableKey,
        "Authorization": `Bearer ${accessToken}`
      }
    },
    20000,
    "Supabase guardo lento y no se pudo confirmar todavia."
  );

  if (!response.ok) {
    throw new Error(await readSupabaseError(response));
  }

  const rows = await response.json();
  if (!Array.isArray(rows) || !rows.some((row) => row.id === clientId)) {
    throw new Error("Supabase no confirmo el cliente guardado.");
  }
}

async function getSupabaseAccessToken() {
  if (state.session?.access_token) return state.session.access_token;
  const { data, error } = await supabaseClient.auth.getSession();
  throwIfSupabaseError(error);
  state.session = data.session;
  if (!state.session?.access_token) {
    throw new Error("La sesion expiro. Vuelve a iniciar sesion.");
  }
  return state.session.access_token;
}

async function fetchWithTimeout(url, options, milliseconds, message) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), milliseconds);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(message);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function readSupabaseError(response) {
  try {
    const payload = await response.json();
    return payload.message || payload.error_description || payload.error || "No se pudo guardar el cliente en Supabase.";
  } catch (_error) {
    return "No se pudo guardar el cliente en Supabase.";
  }
}

async function saveRemotePet(pet) {
  const photoPath = await uploadPetPhoto(pet);
  const speciesId = await getOrCreateCatalogId("species", pet.species);
  const [breedId, colorId] = await Promise.all([
    getOrCreateBreedId(pet.breed, speciesId),
    getOrCreateCatalogId("colors", pet.color)
  ]);

  const { error } = await supabaseClient.from("pets").upsert({
    id: pet.id,
    client_id: pet.clientId,
    admission_date: pet.admissionDate,
    name: pet.name,
    species_id: speciesId,
    sex: pet.sex,
    breed_id: breedId,
    color_id: colorId,
    birth_date: pet.birthDate || null,
    photo_path: photoPath || null,
    notice: pet.notice || null,
    updated_at: pet.updatedAt
  });

  throwIfSupabaseError(error);
}

async function uploadPetPhoto(pet) {
  if (!pet.photoFile) return pet.photo || null;

  const extension = getFileExtension(pet.photoFile.name);
  const path = `${pet.id}/${Date.now()}.${extension}`;
  const { error } = await supabaseClient.storage
    .from("pet-photos")
    .upload(path, pet.photoFile, {
      cacheControl: "3600",
      upsert: true
    });

  throwIfSupabaseError(error);
  return path;
}

function getFileExtension(fileName) {
  const extension = (fileName.split(".").pop() || "jpg").toLowerCase();
  if (["jpg", "jpeg", "png", "webp"].includes(extension)) return extension;
  return "jpg";
}

async function saveRemoteVisit(visit) {
  const { error } = await supabaseClient.from("visits").insert({
    id: visit.id,
    pet_id: visit.petId,
    visit_date: new Date(visit.visitDate).toISOString(),
    owner_complaint: visit.ownerComplaint || null,
    physiological_constants: visit.physiologicalConstants || null,
    symptoms: visit.symptoms || null,
    prognosis: visit.prognosis || null,
    diagnosis: visit.diagnosis || null,
    observations: visit.observations || null,
    updated_at: visit.updatedAt
  });

  throwIfSupabaseError(error);
}

async function saveRemoteReceipt(receipt) {
  const serviceItemId = await getOrCreateServiceItem(receipt.description, receipt.unitPrice);
  const documentId = crypto.randomUUID();
  const { error: documentError } = await supabaseClient.from("documents").insert({
    id: documentId,
    visit_id: receipt.visitId,
    document_type: "Recibo",
    title: "Recibo de pago",
    document_date: new Date().toISOString().slice(0, 10)
  });
  throwIfSupabaseError(documentError);

  const total = receipt.quantity * receipt.unitPrice;
  const { error: itemError } = await supabaseClient.from("receipt_items").insert({
    document_id: documentId,
    service_item_id: serviceItemId,
    description: receipt.description,
    quantity: receipt.quantity,
    unit_price: receipt.unitPrice,
    total,
    sort_order: 0
  });
  throwIfSupabaseError(itemError);
}

async function getOrCreateServiceItem(name, price) {
  const clean = (name || "").trim();
  if (!clean) return null;

  const { data: existing, error: selectError } = await supabaseClient
    .from("service_items")
    .select("id")
    .eq("item_type", "Servicio")
    .eq("name", clean)
    .maybeSingle();

  throwIfSupabaseError(selectError);
  if (existing?.id) return existing.id;

  const { data: inserted, error: insertError } = await supabaseClient
    .from("service_items")
    .insert({
      item_type: "Servicio",
      name: clean,
      default_price: price || 0
    })
    .select("id")
    .single();

  throwIfSupabaseError(insertError);
  return inserted.id;
}

async function getOrCreateCatalogId(table, name) {
  const clean = (name || "").trim();
  if (!clean) return null;
  const value = table === "countries" ? normalizeCountryName(clean) : clean;

  const { data: existing, error: selectError } = await supabaseClient
    .from(table)
    .select("id")
    .eq("name", value)
    .maybeSingle();

  throwIfSupabaseError(selectError);
  if (existing?.id) return existing.id;

  const { data: inserted, error: insertError } = await supabaseClient
    .from(table)
    .upsert({ name: value }, { onConflict: "name" })
    .select("id")
    .single();

  throwIfSupabaseError(insertError);
  return inserted.id;
}

async function getOrCreateBreedId(name, speciesId) {
  const clean = (name || "").trim();
  if (!clean) return null;

  let query = supabaseClient.from("breeds").select("id").eq("name", clean);
  query = speciesId ? query.eq("species_id", speciesId) : query.is("species_id", null);
  const { data: existing, error: selectError } = await query.maybeSingle();

  throwIfSupabaseError(selectError);
  if (existing?.id) return existing.id;

  const { data: inserted, error: insertError } = await supabaseClient
    .from("breeds")
    .insert({ name: clean, species_id: speciesId })
    .select("id")
    .single();

  throwIfSupabaseError(insertError);
  return inserted.id;
}

async function remember(type, value) {
  const clean = value.trim();
  if (!clean) return;

  const values = new Set(state.catalogs[type] || []);
  values.add(clean);
  const row = { id: type, type, values: Array.from(values).sort((a, b) => a.localeCompare(b, "es")) };
  await put("catalogs", row);
  state.catalogs[type] = row.values;
}

function selectClient(id) {
  state.selectedClientId = id;
  state.selectedPetId = null;
  renderAll();
}

function selectPet(id) {
  state.selectedPetId = id;
  state.selectedVisitId = null;
  renderPetList();
  renderPetForm();
  renderVisits();
}

function selectVisit(id) {
  state.selectedVisitId = id;
  renderVisits();
}

function newClient() {
  state.selectedClientId = null;
  state.selectedPetId = null;
  state.selectedVisitId = null;
  $("clientForm").reset();
  $("clientId").value = "";
  $("clientModeLabel").textContent = "Capturando cliente nuevo";
  $("saveClientButton").textContent = "Guardar nuevo cliente";
  $("petForm").reset();
  setClientSaveMessage("");
  setInitialDefaults();
  setPhotoPreview("");
  renderClientList();
  renderPetList();
  renderVisits();
}

function fillReceiptPriceFromCatalog() {
  const description = $("receiptDescription").value.trim();
  const item = state.serviceItems.find((serviceItem) => serviceItem.name === description);
  if (item) {
    $("receiptUnitPrice").value = item.defaultPrice.toFixed(2);
  }
  updateReceiptTotal();
}

function updateReceiptTotal() {
  const quantity = Number($("receiptQuantity").value || 0);
  const unitPrice = Number($("receiptUnitPrice").value || 0);
  $("receiptTotal").value = formatCurrency(quantity * unitPrice);
}

function activateTab(name) {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.tab === name);
  });
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === `tab-${name}`);
  });
}

function readPetPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.pendingPhoto = reader.result;
    state.pendingPhotoFile = file;
    setPhotoPreview(state.pendingPhoto);
  };
  reader.readAsDataURL(file);
}

function setPhotoPreview(src) {
  const frame = document.querySelector(".photo-frame");
  const img = $("petPreview");
  frame.classList.toggle("has-image", Boolean(src));
  img.src = src || "";
}

function updateAge() {
  $("petAge").value = calculateAge($("petBirthDate").value) || "Sin fecha";
}

function calculateAge(dateValue) {
  if (!dateValue) return "";
  const birth = new Date(`${dateValue}T00:00:00`);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years <= 0 && months <= 0) return "Menos de 1 mes";
  if (years <= 0) return `${months} mes${months === 1 ? "" : "es"}`;
  return `${years} ano${years === 1 ? "" : "s"}${months ? ` ${months} mes${months === 1 ? "" : "es"}` : ""}`;
}

function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN"
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function flashStatus(message) {
  $("storageStatus").textContent = message;
  window.clearTimeout(statusTimer);
  statusTimer = window.setTimeout(() => {
    $("storageStatus").textContent = state.session ? "Sincronizado en Supabase" : "Requiere sesion";
  }, 2200);
}

async function refreshApp() {
  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  }

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  window.location.reload();
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  try {
    const registration = await navigator.serviceWorker.register(`sw.js?v=${APP_VERSION}`);
    await registration.update();
  } catch (_error) {
    // La app sigue funcionando aunque el modo instalable no este disponible.
  }
}
