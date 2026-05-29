(() => {
  const HOTFIX_VERSION = "v0.4.9";
  const cityRules = {
    "san luis": { state: "Arizona", country: "USA" },
    "san luis az": { state: "Arizona", country: "USA" },
    "san luis arizona": { state: "Arizona", country: "USA" },
    "san luis, arizona": { state: "Arizona", country: "USA" },
    "san luis arizona usa": { state: "Arizona", country: "USA" },
    "san luis rio colorado": { state: "Sonora", country: "Mexico" },
    "san luis rio colorado sonora": { state: "Sonora", country: "Mexico" }
  };

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
  }

  function setLocation() {
    const city = document.getElementById("clientCity");
    const state = document.getElementById("clientState");
    const country = document.getElementById("clientCountry");
    if (!city || !state || !country) return;
    const key = normalize(city.value);
    let location = cityRules[key];
    if (!location && key.includes("san luis") && key.includes("rio colorado")) location = cityRules["san luis rio colorado"];
    if (!location && key.includes("san luis") && (key.includes("arizona") || key.endsWith(" az") || key === "san luis")) location = cityRules["san luis"];
    if (location) {
      state.value = location.state;
      country.value = location.country;
    }
  }

  function install() {
    const version = document.getElementById("appVersion");
    if (version) version.textContent = HOTFIX_VERSION;
    const city = document.getElementById("clientCity");
    const form = document.getElementById("clientForm");
    city?.addEventListener("input", setLocation);
    city?.addEventListener("change", setLocation);
    city?.addEventListener("blur", setLocation);
    form?.addEventListener("submit", setLocation, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install);
  else install();
})();
