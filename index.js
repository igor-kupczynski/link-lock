/**
 * Unlock page: read the encrypted fragment, prompt for the password, and either
 * redirect to the (https-only) destination or preview it without navigating.
 */

const form = () => document.querySelector(".form");
const errorBox = () => document.querySelector(".error");
const previewBox = () => document.querySelector("#preview");

function showError(text) {
  form().classList.add("hidden");
  errorBox().classList.remove("hidden");
  document.querySelector("#errortext").innerText = text;
}

function showForm() {
  errorBox().classList.add("hidden");
  previewBox().classList.add("hidden");
  form().classList.remove("hidden");
  const pw = document.querySelector("#password");
  pw.value = "";
  pw.focus();
}

function main() {
  I18N.init();

  document.querySelector("#tryagain").addEventListener("click", showForm);

  // No fragment: send the user to the create page.
  if (!window.location.hash) {
    window.location.replace("./create/");
    return;
  }

  if (!("b64" in window) || !("api" in window)) {
    showError(I18N.t("err.libraries"));
    return;
  }

  const fragment = window.location.hash.slice(1);
  showForm();

  // Decrypt and validate. Returns an https URL string, or null after an error
  // has already been shown.
  async function resolveUrl() {
    const password = document.querySelector("#password").value;

    let url;
    try {
      url = await api.decryptUrl(fragment, password);
    } catch (e) {
      showError((e && e.message === "Unsupported link version")
        ? I18N.t("err.version")
        : I18N.t("err.password"));
      return null;
    }

    // Only allow https:// destinations (prevents javascript:/data: redirects).
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch {
      showError(I18N.t("err.invalidUrl"));
      return null;
    }
    if (urlObj.protocol !== "https:") {
      showError(I18N.t("err.protocol"));
      return null;
    }

    return url;
  }

  async function onUnlock() {
    const url = await resolveUrl();
    if (url) {
      window.location.href = url;
    }
  }

  async function onPreview() {
    const url = await resolveUrl();
    if (url) {
      document.querySelector("#preview-url").value = url;
      document.querySelector("#preview-open").href = url;
      previewBox().classList.remove("hidden");
    }
  }

  document.querySelector("#unlockbutton").addEventListener("click", onUnlock);
  document.querySelector("#previewbutton").addEventListener("click", onPreview);
  document.querySelector("#password").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      onUnlock();
    }
  });
}

document.addEventListener("DOMContentLoaded", main);
