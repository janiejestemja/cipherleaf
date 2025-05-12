import init, { AesCtrSecret } from "./pkg/aes_ctr_rsts.js";
const cipherNote = document.getElementById("cipher-note");
const cipherBtn = document.getElementById("cipher-btn");
const demoCipherBtn = document.getElementById("demo-cipher-btn");
const cipherDiv = document.getElementById("cipher-div");
const passDiv = document.getElementById("passphrase");
const saltDiv = document.getElementById("salt");
async function main() {
    /* Initialise rust wasm */
    await init();
    document.querySelectorAll(".deletable").forEach(div => {
        div.addEventListener("click", async () => handleDecryption(div));
    });
    cipherBtn?.addEventListener("click", async () => {
        const plaintext = cipherNote.value.trim();
        const oldSaltHex = saltDiv.value.trim() || "";
        const oldSalt = hexToBytes(oldSaltHex);
        if (plaintext !== "") {
            const encoded = new TextEncoder().encode(plaintext);
            let { key, nonce, salt } = await deriveKeyNonceSalt(passDiv.value?.trim() || "abc", oldSalt);
            const encrypted = new AesCtrSecret(key, nonce).encrypt(encoded);
            const encryptedHex = bytesToHex(encrypted);
            const saltHex = bytesToHex(salt);
            const noteDiv = document.createElement("div");
            noteDiv.textContent = encryptedHex;
            const saltDiv = document.createElement("div");
            saltDiv.textContent = saltHex;
            const div = document.createElement("div");
            div.classList.add("leaf-note");
            div.appendChild(noteDiv);
            div.appendChild(saltDiv);
            cipherDiv.appendChild(div);
            cipherNote.value = "";
            div.addEventListener("click", async () => {
                const hexContent = noteDiv.textContent?.trim() || "";
                const saltContent = saltDiv.textContent?.trim() || "";
                div.remove();
                saveCipherHex(hexContent, saltContent);
            });
        }
    });
    demoCipherBtn?.addEventListener("click", async () => {
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
                handleDemoDecryption(div);
            });
        }
    });
}
main();
/* Utility functions */
async function deriveKeyNonceSalt(passphrase, salt) {
    const ikm = new TextEncoder().encode(passphrase);
    // If no salt mine some (256 bits)
    if (!salt) {
        salt = crypto.getRandomValues(new Uint8Array(32));
    }
    const baseKey = await crypto.subtle.importKey("raw", ikm, { name: "HKDF" }, false, ["deriveBits"]);
    const derive = async (infoStr, length) => {
        const info = new TextEncoder().encode(infoStr);
        const bits = await crypto.subtle.deriveBits({
            name: "HKDF",
            hash: "SHA-256",
            salt: salt,
            info: info
        }, baseKey, length * 8);
        return new Uint8Array(bits);
    };
    const key = await derive("key", 32);
    const nonce = await derive("nonce", 8);
    return { key, nonce, salt };
}
function saveCipherHex(cipherHex, saltHex) {
    fetch("/save-cipher-hex", {
        method: "POST",
        body: JSON.stringify({ cipherHex: cipherHex, saltHex: saltHex }),
        headers: { "Content-Type": "application/json" },
    }).then((_res) => {
        window.location.href = "/";
    });
}
async function deriveKeyAndNonce(passphrase) {
    const encoder = new TextEncoder();
    const data = encoder.encode(passphrase);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = new Uint8Array(hashBuffer);
    const key = hashArray.slice(0, 32);
    const nonce = hashArray.slice(0, 8).reverse();
    return { key, nonce };
}
async function handleDecryption(element) {
    const hexString = element.children[0]?.textContent?.trim() || "Couldn't find leaf";
    const hexBytes = hexToBytes(hexString);
    const saltHex = element.children[1]?.textContent?.trim() || "pepper";
    if (saltHex === "pepper")
        return;
    const saltBytes = hexToBytes(saltHex);
    let passphrase = passDiv.value?.trim() || "abc";
    let { key, nonce } = await deriveKeyNonceSalt(passphrase, saltBytes);
    const decrypted = new AesCtrSecret(key, nonce).encrypt(hexBytes);
    const decoded = new TextDecoder().decode(decrypted);
    element.textContent = decoded;
}
async function handleDemoDecryption(element) {
    const hexString = element.textContent?.trim() || "Ooops, something went wrong...";
    const hexBytes = hexToBytes(hexString);
    let passphrase = passDiv.value?.trim() || "abc";
    let { key, nonce } = await deriveKeyAndNonce(passphrase);
    const decrypted = new AesCtrSecret(key, nonce).encrypt(hexBytes);
    const decoded = new TextDecoder().decode(decrypted);
    element.textContent = decoded;
}
/* Conversions */
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
