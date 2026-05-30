(() => {
  const HOTFIX_VERSION = "v0.5.1";
  const cityRules = {
    "san luis": { state: "Arizona", country: "USA", saveCity: "San Luis Arizona" },
    "san luis az": { state: "Arizona", country: "USA", saveCity: "San Luis Arizona" },
    "san luis arizona": { state: "Arizona", country: "USA", saveCity: "San Luis Arizona" },
    "san luis, arizona": { state: "Arizona", country: "USA", saveCity: "San Luis Arizona" },
    "san luis arizona usa": { state: "Arizona", country: "USA", saveCity: "San Luis Arizona" },
    "san luis rio colorado": { state: "Sonora", country: "Mexico", saveCity: "San Luis Río Colorado" },
    "san luis rio colorado sonora": { state: "Sonora", country: "Mexico", saveCity: "San Luis Río Colorado" },
    "san luis río colorado": { state: "Sonora", country: "Mexico", saveCity: "San Luis Río Colorado" },
    "san luis río colorado sonora": { state: "Sonora", country: "Mexico", saveCity: "San Luis Río Colorado" }
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

  function setLocation(options = {}) {
    const city = document.getElementById("clientCity");
    const state = document.getElementById("clientState");
    const country = document.getElementById("clientCountry");
    if (!city || !state || !country) return;

    const cityKey = normalize(city.value);
    const stateKey = normalize(state.value);
    const countryValue = normalizeCountry(country.value);
    let location = findLocation(city.value);

    if (cityKey === "san luis" && (stateKey === "arizona" || countryValue === "USA")) {
      location = cityRules["san luis"];
    }

    if (location) {
      if (state.value !== location.state) state.value = location.state;
      if (country.value !== location.country) country.value = location.country;
      if (options.beforeSave && location.saveCity && normalize(city.value) === "san luis") city.value = location.saveCity;
      state.dispatchEvent(new Event("input", { bubbles: true }));
      country.dispatchEvent(new Event("input", { bubbles: true }));
      city.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function install() {
    setVersion();
    hideCatalogs();
    [100, 500, 1500, 3000, 6000].forEach((delay) => {
      setTimeout(setVersion, delay);
      setTimeout(hideCatalogs, delay);
    });

    const version = document.getElementById("appVersion");
    if (version) {
      new MutationObserver(setVersion).observe(version, { childList: true, characterData: true, subtree: true });
    }

    const city = document.getElementById("clientCity");
    const form = document.getElementById("clientForm");
    const save = document.getElementById("saveClientButton");
    city?.addEventListener("input", () => setLocation());
    city?.addEventListener("change", () => setLocation());
    city?.addEventListener("blur", () => setLocation());
    form?.addEventListener("submit", () => setLocation({ beforeSave: true }), true);
    save?.addEventListener("click", () => setLocation({ beforeSave: true }), true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install);
  else install();
})();
