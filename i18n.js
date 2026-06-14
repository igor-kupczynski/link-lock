/**
 * Minimal, dependency-free EN/PL internationalization.
 *
 * - Static text is translated via [data-i18n] / [data-i18n-placeholder] /
 *   [data-i18n-title] attributes whose value is a string key below.
 * - Dynamic strings (errors, alerts) are fetched in page scripts via t(key).
 * - Language is taken from localStorage, falling back to the browser language,
 *   and persisted on change. Changing it dispatches a "i18n:changed" event so
 *   page scripts can re-render any dynamic text.
 *
 * Polish translation by Igor Kupczyński for this fork.
 */

var I18N = (function() {

  const STRINGS = {
    en: {
      // Shared
      "lang.en": "EN",
      "lang.pl": "PL",
      "btn.tryAgain": "Try again",

      // Unlock page
      "unlock.title": "Unlock link",
      "unlock.prompt": "Enter the password to unlock this link.",
      "unlock.password": "password",
      "unlock.button": "Unlock",
      "unlock.preview": "Preview",
      "unlock.previewLabel": "This link points to:",
      "unlock.open": "Open",
      "err.libraries": "Could not load the required libraries.",
      "err.corrupted": "This link appears to be corrupted.",
      "err.version": "Unsupported link version.",
      "err.password": "Incorrect password.",
      "err.protocol": "The decrypted link is not allowed; only https:// links are permitted.",
      "err.invalidUrl": "The decrypted link is not a valid URL.",

      // Create page
      "create.title": "Encrypt a link",
      "create.heading": "Encrypt a link",
      "create.url": "destination link",
      "create.urlPlaceholder": "https://",
      "create.password": "password",
      "create.confirm": "confirm password",
      "create.generate": "Generate password",
      "create.encrypt": "Encrypt link",
      "create.output": "locked link",
      "create.copy": "Copy",
      "create.open": "Open in new tab",
      "create.copied": "Copied",
      "valid.url": "Please enter a valid URL starting with https://",
      "valid.protocol": "Only https:// links are allowed.",
      "valid.mismatch": "Passwords do not match.",
      "valid.tooShort": "Password must be at least 12 characters."
    },

    pl: {
      // Shared
      "lang.en": "EN",
      "lang.pl": "PL",
      "btn.tryAgain": "Spróbuj ponownie",

      // Unlock page
      "unlock.title": "Odblokuj link",
      "unlock.prompt": "Wprowadź hasło, aby odblokować ten link.",
      "unlock.password": "hasło",
      "unlock.button": "Odblokuj",
      "unlock.preview": "Podgląd",
      "unlock.previewLabel": "Ten link prowadzi do:",
      "unlock.open": "Otwórz",
      "err.libraries": "Nie udało się załadować wymaganych bibliotek.",
      "err.corrupted": "Ten link wygląda na uszkodzony.",
      "err.version": "Nieobsługiwana wersja linku.",
      "err.password": "Nieprawidłowe hasło.",
      "err.protocol": "Odszyfrowany link jest niedozwolony; dozwolone są tylko linki https://.",
      "err.invalidUrl": "Odszyfrowany link nie jest prawidłowym adresem URL.",

      // Create page
      "create.title": "Zaszyfruj link",
      "create.heading": "Zaszyfruj link",
      "create.url": "link docelowy",
      "create.urlPlaceholder": "https://",
      "create.password": "hasło",
      "create.confirm": "powtórz hasło",
      "create.generate": "Generuj hasło",
      "create.encrypt": "Zaszyfruj link",
      "create.output": "zablokowany link",
      "create.copy": "Kopiuj",
      "create.open": "Otwórz w nowej karcie",
      "create.copied": "Skopiowano",
      "valid.url": "Wprowadź prawidłowy adres URL zaczynający się od https://",
      "valid.protocol": "Dozwolone są tylko linki https://.",
      "valid.mismatch": "Hasła nie są takie same.",
      "valid.tooShort": "Hasło musi mieć co najmniej 12 znaków."
    }
  };

  let _lang = "en";

  function detect() {
    const saved = localStorage.getItem("lang");
    if (saved === "en" || saved === "pl") {
      return saved;
    }
    // Polish is the default; English only if explicitly chosen.
    return "pl";
  }

  function t(key) {
    const table = STRINGS[_lang] || STRINGS.en;
    return (key in table) ? table[key] : (STRINGS.en[key] || key);
  }

  function apply() {
    document.documentElement.lang = _lang;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      if (el.tagName === "TITLE") {
        document.title = t(key);
      } else {
        el.setAttribute("title", t(key));
      }
    });

    document.querySelectorAll("[data-lang]").forEach((el) => {
      el.setAttribute("aria-pressed", el.getAttribute("data-lang") === _lang ? "true" : "false");
    });
  }

  function setLang(lang) {
    if (lang !== "en" && lang !== "pl") {
      return;
    }
    _lang = lang;
    localStorage.setItem("lang", lang);
    apply();
    document.dispatchEvent(new CustomEvent("i18n:changed", { detail: { lang } }));
  }

  function init() {
    _lang = detect();
    apply();
    document.querySelectorAll("[data-lang]").forEach((el) => {
      el.addEventListener("click", () => setLang(el.getAttribute("data-lang")));
    });
  }

  return {
    t: t,
    init: init,
    setLang: setLang,
    get lang() { return _lang; }
  };
})();
