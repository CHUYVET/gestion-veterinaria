(() => {
  const HOTFIX_VERSION = "v0.5.4";
  const cityRules = {
    "san luis": { state: "Arizona", country: "USA", displayCity: "San Luis" },
    "san luis az": { state: "Arizona", country: "USA", displayCity: "San Luis" },
    "san luis arizona": { state: "Arizona", country: "USA", displayCity: "San Luis" },
    "san luis, arizona": { state: "Arizona", country: "USA", displayCity: "San Luis" },
    "san luis arizona usa": { state: "Arizona", country: "USA", displayCity: "San Luis" },
    "san luis rio colorado": { state: "Sonora", country: "Mexico", displayCity: "San Luis Río Colorado" },
    "san luis rio colorado sonora": { state: "Sonora", country: "Mexico", displayCity: "San Luis Río Colorado" },
    "san luis río colorado": { state: "Sonora", country: "Mexico", displayCity: "San Luis Río Colorado" },
    "san luis río colorado sonora": { state: "Sonora", country: "Mexico", displayCity: "San Luis Río Colorado" }
  };

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[,.]/g, " ")
      .replace(/\s+/g, " ");
  }

  function normalizeCountry(value) {
    const key = normalize(value);
    if (["usa", "us", "u s", "u s a", "estados unidos", "united states"].includes(key)) return "USA";
    if (["mexico", "mx"].includes(key)) return "Mexico";
    return String(value || "").trim();
  }

  function findLocation(value) {
    const key = normalize(value);
    let location = cityRules[key];
    if (!location && key.includes("san luis") && key.includes("rio colorado")) location = cityRules["san luis rio colorado"];
    if (!location && key.includes("san luis") && (key.includes("arizona") || key.endsWith(" az") || key === "san luis")) location = cityRules["san luis"];
    return location || null;
  }

  function patchMainLocationFunctions() {
    try {
      if (typeof knownCityLocations !== "undefined") Object.assign(knownCityLocations, cityRules);
      if (typeof getCityLocation === "function") {
        getCityLocation = function patchedGetCityLocation(cityKey) {
          if (!cityKey) return null;
          const localRule = cityRules[normalize(cityKey)] || (typeof knownCityLocations !== "undefined" ? knownCityLocations[cityKey] : null);
          if (localRule) return localRule;
          const client = [...state.clients].reverse().find((item) => normalize(item.city) === cityKey && item.state && item.country);
          if (client) {
            return {
              state: client.state,
              country: typeof normalizeCountryName === "function" ? normalizeCountryName(client.country) : normalizeCountry(client.country)
            };
          }
          return null;
        };
      }
      if (typeof applyKnownCityLocation === "function") {
        applyKnownCityLocation = function patchedApplyKnownCityLocation() { setLocation(); };
      }
    } catch (error) {
      console.warn("No se pudo aplicar ajuste de ciudad", error);
    }
  }

  function setVersion() {
    const version = document.getElementById("appVersion");
    if (version && version.textContent !== HOTFIX_VERSION) version.textContent = HOTFIX_VERSION;
  }

  function hideCatalogs() {
    const catalogTab = document.querySelector('[data-tab="catalogos"]');
    const catalogPanel = document.getElementById("tab-catalogos");
    if (catalogTab && !catalogTab.hidden) catalogTab.hidden = true;
    if (catalogPanel && !catalogPanel.hidden) catalogPanel.hidden = true;
    catalogTab?.classList.remove("is-active");
    catalogPanel?.classList.remove("is-active");
    const activeTab = document.querySelector(".tab.is-active:not([hidden])");
    if (!activeTab) {
      document.querySelector('[data-tab="cliente"]')?.classList.add("is-active");
      document.getElementById("tab-cliente")?.classList.add("is-active");
    }
  }

  function setLocation() {
    const city = document.getElementById("clientCity");
    const state = document.getElementById("clientState");
    const country = document.getElementById("clientCountry");
    if (!city || !state || !country) return;
    const cityKey = normalize(city.value);
    const stateKey = normalize(state.value);
    const countryValue = normalizeCountry(country.value);
    let location = findLocation(city.value);
    if (cityKey === "san luis" && (stateKey === "arizona" || countryValue === "USA" || !stateKey)) location = cityRules["san luis"];
    if (cityKey === "san luis arizona") location = cityRules["san luis"];
    if (location) {
      if (state.value !== location.state) state.value = location.state;
      if (country.value !== location.country) country.value = location.country;
      if (location.displayCity && ["san luis arizona", "san luis az", "san luis arizona usa"].includes(cityKey)) city.value = location.displayCity;
      state.dispatchEvent(new Event("input", { bubbles: true }));
      country.dispatchEvent(new Event("input", { bubbles: true }));
      city.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  async function fallbackSignIn() {
    const email = document.getElementById("authEmail")?.value.trim();
    const password = document.getElementById("authPassword")?.value || "";
    const message = document.getElementById("authMessage");
    if (!email || !password) {
      if (message) message.textContent = "Escribe correo y contrasena.";
      return;
    }
    if (message) message.textContent = "Entrando...";
    try {
      if (!window.supabase || !window.SUPABASE_CONFIG?.url || !window.SUPABASE_CONFIG?.publishableKey) {
        throw new Error("Supabase no esta disponible. Revisa internet y vuelve a intentar.");
      }
      const client = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.publishableKey);
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (message) message.textContent = "Sesion iniciada. Cargando datos...";
      setTimeout(() => window.location.reload(), 600);
    } catch (error) {
      if (message) message.textContent = error.message || "No se pudo iniciar sesion.";
    }
  }

  function protectLoginForm() {
    const form = document.getElementById("authForm");
    if (!form || form.dataset.hotfixLogin === "1") return;
    form.dataset.hotfixLogin = "1";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof signIn === "function" && typeof supabaseClient !== "undefined" && supabaseClient) {
        signIn(event);
      } else {
        fallbackSignIn();
      }
    }, true);
  }

  function install() {
    protectLoginForm();
    patchMainLocationFunctions();
    setVersion();
    hideCatalogs();
    [100, 500, 1500, 3000, 6000].forEach((delay) => {
      setTimeout(protectLoginForm, delay);
      setTimeout(patchMainLocationFunctions, delay);
      setTimeout(setVersion, delay);
      setTimeout(hideCatalogs, delay);
    });
    const version = document.getElementById("appVersion");
    if (version) new MutationObserver(setVersion).observe(version, { childList: true, characterData: true, subtree: true });
    const city = document.getElementById("clientCity");
    const form = document.getElementById("clientForm");
    const save = document.getElementById("saveClientButton");
    city?.addEventListener("input", () => setLocation());
    city?.addEventListener("change", () => setLocation());
    city?.addEventListener("blur", () => setLocation());
    form?.addEventListener("submit", () => { patchMainLocationFunctions(); setLocation(); }, true);
    save?.addEventListener("click", () => { patchMainLocationFunctions(); setLocation(); }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install);
  else install();
})();
