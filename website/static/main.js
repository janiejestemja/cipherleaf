import init, { AesCtrSecret } from "./pkg/aes_ctr_rsts.js";
const cipherNote = document.getElementById("cipher-note");
const cipherBtn = document.getElementById("cipher-btn");
const cipherDiv = document.getElementById("cipher-div");
const passDiv = document.getElementById("passphrase");
const quickStartModal = document.getElementById("quickStartModal");
const quickStartBtn = document.getElementById("quickStartBtn");
const closeModalBtn = document.querySelector(".close-modal-btn");
async function main() {
    /* Initialise rust wasm */
    await init();
    document.querySelectorAll(".deletable").forEach(div => {
        div.addEventListener("click", async () => handleDecryption(div));
    });
    cipherBtn.addEventListener("click", async () => {
        const plaintext = cipherNote.value.trim();
        if (plaintext !== "") {
            const encoded = new TextEncoder().encode(plaintext);
            let { key, nonce } = await deriveKeyAndNonce(passDiv.value?.trim() || "abc");
            const encrypted = new AesCtrSecret(key, nonce).encrypt(encoded);
            const encryptedHex = bytesToHex(encrypted);
            const div = document.createElement("div");
            div.classList.add("leaf-note");
            div.textContent = encryptedHex;
            cipherDiv.appendChild(div);
            cipherNote.value = "";
            div.addEventListener("click", async () => {
                const hexContent = div.textContent?.replace("Decode & Vanish", "").trim() || "";
                div.remove();
                saveCipherHex(hexContent);
            });
        }
    });
    quickStartBtn.addEventListener("click", () => {
        quickStartModal.style.display = "block";
    });
    closeModalBtn.addEventListener("click", () => {
        quickStartModal.style.display = "none";
    });
    window.addEventListener("click", (event) => {
        if (event.target === quickStartModal) {
            quickStartModal.style.display = "none";
        }
    });
}
main();
/* Utility functions */
async function deriveKeyAndNonce(passphrase) {
    const encoder = new TextEncoder();
    const data = encoder.encode(passphrase);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = new Uint8Array(hashBuffer);
    const key = hashArray.slice(0, 32);
    const nonce = hashArray.slice(0, 8).reverse();
    return { key, nonce };
}
function stringToHex(str) {
    return Array.from(new TextEncoder().encode(str))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join(" ")
        .toUpperCase();
}
function bytesToHex(bytes) {
    return Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join(" ")
        .toUpperCase();
}
function hexToString(hex) {
    const hexValues = hex.trim().split(/\s+/);
    const bytes = new Uint8Array(hexValues.map(h => parseInt(h, 16)));
    return new TextDecoder().decode(bytes);
}
function hexToBytes(hex) {
    const hexValues = hex.trim().split(/\s+/);
    const bytes = new Uint8Array(hexValues.map(h => parseInt(h, 16)));
    return bytes;
}
function saveCipherHex(cipherHex) {
    fetch("/save-cipher-hex", {
        method: "POST",
        body: JSON.stringify({ cipherHex: cipherHex }),
        headers: { "Content-Type": "application/json" },
    }).then((_res) => {
        window.location.href = "/";
    });
}
async function handleDecryption(element) {
    const hexString = element.textContent?.trim() || "Ooops, something went wrong...";
    const hexBytes = hexToBytes(hexString);
    let passphrase = passDiv.value?.trim() || "abc";
    let { key, nonce } = await deriveKeyAndNonce(passphrase);
    const decrypted = new AesCtrSecret(key, nonce).encrypt(hexBytes);
    const decoded = new TextDecoder().decode(decrypted);
    element.textContent = decoded;
}
