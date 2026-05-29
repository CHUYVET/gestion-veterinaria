(() => {
  const HOTFIX_VERSION = "v0.5.0";
  const cityRules = {
    "san luis": { state: "Arizona", country: "USA" },
    "san luis az": { state: "Arizona", country: "USA" },
    "san luis arizona": { state: "Arizona", country: "USA" },
    "san luis, arizona": { state: "Arizona", country: "USA" },
    "san luis arizona usa": { state: "Arizona", country: "USA" },
    "san luis rio colorado": { state: "Sonora", country: "Mexico" },
    "san luis rio colorado sonora": { state: "Sonora", country: "Mexico" },
    "san luis río colorado": { state: "Sonora", country: "Mexico" },
    "san luis río colorado sonora": { state: "Sonora", country: "Mexico" }
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

  function setLocation() {
    const city = document.getElementById("clientCity");
    const state = document.getElementById("clientState");
    const country = document.getElementById("clientCountry");
    if (!city || !state || !country) return;
    const location = findLocation(city.value);
    if (location) {
      if (state.value !== location.state) state.value = location.state;
      if (country.value !== location.country) country.value = location.country;
      state.dispatchEvent(new Event("input", { bubbles: true }));
      country.dispatchEvent(new Event("input", { bubbles: true }));
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
    city?.addEventListener("input", setLocation);
    city?.addEventListener("change", setLocation);
    city?.addEventListener("blur", setLocation);
    form?.addEventListener("submit", setLocation, true);
    save?.addEventListener("click", setLocation, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install);
  else install();
})();
