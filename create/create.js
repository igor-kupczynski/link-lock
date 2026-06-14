/**
 * Create page: encrypt a destination URL with a password and produce a locked
 * link pointing at this same deployment's unlock page.
 */

const MIN_PASSWORD_LENGTH = 12;
const GENERATED_PASSWORD_LENGTH = 20;
const PASSWORD_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function showError(text) {
  const box = document.querySelector(".error");
  box.classList.remove("hidden");
  document.querySelector("#errortext").innerText = text;
}

function clearError() {
  document.querySelector(".error").classList.add("hidden");
}

// Generate a strong random password using crypto.getRandomValues with rejection
// sampling so the alphabet is unbiased.
function generatePassword(length) {
  const max = Math.floor(256 / PASSWORD_ALPHABET.length) * PASSWORD_ALPHABET.length;
  let out = "";
  const buf = new Uint8Array(1);
  while (out.length < length) {
    crypto.getRandomValues(buf);
    if (buf[0] < max) {
      out += PASSWORD_ALPHABET[buf[0] % PASSWORD_ALPHABET.length];
    }
  }
  return out;
}

// The unlock page lives one directory up from /create/. Build an absolute URL to
// it from the current location so the output works on any host (no hardcoding).
function unlockBaseUrl() {
  return new URL("../", window.location.href).href;
}

function flashAlert(message) {
  const alertArea = document.querySelector(".alert");
  alertArea.innerText = message;
  alertArea.style.opacity = "1";
  setTimeout(() => { alertArea.style.opacity = "0"; }, 3000);
}

async function onEncrypt() {
  clearError();

  const urlInput = document.querySelector("#url");
  const url = urlInput.value;

  // Validate the destination URL and restrict it to https://.
  let urlObj;
  try {
    urlObj = new URL(url);
  } catch {
    showError(I18N.t("valid.url"));
    return;
  }
  if (urlObj.protocol !== "https:") {
    showError(I18N.t("valid.protocol"));
    return;
  }

  const password = document.querySelector("#password").value;
  const confirmation = document.querySelector("#confirm-password").value;
  if (password.length < MIN_PASSWORD_LENGTH) {
    showError(I18N.t("valid.tooShort"));
    return;
  }
  if (password !== confirmation) {
    showError(I18N.t("valid.mismatch"));
    return;
  }

  const fragment = await api.encryptUrl(url, password);
  const output = unlockBaseUrl() + "#" + fragment;

  document.querySelector("#output").value = output;
  document.querySelector("#open").href = output;
}

async function onCopy() {
  const output = document.querySelector("#output");
  if (!output.value) {
    return;
  }
  try {
    await navigator.clipboard.writeText(output.value);
  } catch {
    // Fallback for older browsers / insecure contexts.
    output.focus();
    output.select();
    document.execCommand("copy");
  }
  flashAlert(I18N.t("create.copied"));
}

function onGenerate() {
  const pw = generatePassword(GENERATED_PASSWORD_LENGTH);
  document.querySelector("#password").value = pw;
  document.querySelector("#confirm-password").value = pw;
  clearError();
}

function main() {
  I18N.init();

  if (!("b64" in window) || !("api" in window)) {
    showError(I18N.t("err.libraries"));
    return;
  }

  document.querySelector("#generate").addEventListener("click", onGenerate);
  document.querySelector("#encrypt").addEventListener("click", onEncrypt);
  document.querySelector("#copy").addEventListener("click", onCopy);
  document.querySelector("#url").addEventListener("input", clearError);
}

document.addEventListener("DOMContentLoaded", main);
