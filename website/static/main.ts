import init, {AesCtrSecret} from "./pkg/aes_ctr_rsts.js"

const cipherNote = document.getElementById("cipher-note") as HTMLTextAreaElement;
const cipherBtn = document.getElementById("cipher-btn") as HTMLButtonElement;
const demoCipherBtn = document.getElementById("demo-cipher-btn") as HTMLButtonElement;
const cipherDiv = document.getElementById("cipher-div") as HTMLDivElement;
const passDiv = document.getElementById("passphrase") as HTMLInputElement;

const quickStartModal = document.getElementById("quickStartModal") as HTMLDivElement;
const quickStartBtn = document.getElementById("quickStartBtn") as HTMLButtonElement;
const closeModalBtn = document.querySelector(".close-modal-btn") as HTMLButtonElement;

async function main() {
    /* Initialise rust wasm */
    await init();

    document.querySelectorAll(".deletable").forEach(div => {
       div.addEventListener("click", async () => handleDecryption(div));
    });

    cipherBtn?.addEventListener("click", async () => {
        const plaintext = cipherNote.value.trim();
        if (plaintext !== "") {
            const encoded = new TextEncoder().encode(plaintext);
            let {key, nonce} = await deriveKeyAndNonce(passDiv.value?.trim() || "abc");
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


    demoCipherBtn?.addEventListener("click", async () => {
        const plaintext = cipherNote.value.trim();
        if (plaintext !== "") {
            const encoded = new TextEncoder().encode(plaintext);
            let {key, nonce} = await deriveKeyAndNonce(passDiv.value?.trim() || "abc");
            const encrypted = new AesCtrSecret(key, nonce).encrypt(encoded);
            const encryptedHex = bytesToHex(encrypted);

            const div = document.createElement("div");
            div.classList.add("leaf-note");
            div.textContent = encryptedHex;

            cipherDiv.appendChild(div);

            cipherNote.value = "";

            div.addEventListener("click", async () => {
                handleDecryption(div);
            });
        }
    });

    quickStartBtn.addEventListener("click", () => {
        quickStartModal.style.display = "block";
    });

    closeModalBtn.addEventListener("click", () => {
        quickStartModal.style.display = "none";
    });

    window.addEventListener("click", (event: MouseEvent) => {
        if (event.target === quickStartModal) {
          quickStartModal.style.display = "none";
        }
    });
}

main();

/* Utility functions */
async function deriveKeyAndNonce(passphrase: string): Promise<{ key: Uint8Array, nonce: Uint8Array }> {
    const encoder = new TextEncoder();
    const data = encoder.encode(passphrase);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = new Uint8Array(hashBuffer);

    const key = hashArray.slice(0, 32);
    const nonce = hashArray.slice(0, 8).reverse();

    return { key, nonce };
}

function stringToHex(str: string): string {
    return Array.from(new TextEncoder().encode(str))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join(" ")
        .toUpperCase();
}

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join(" ")
        .toUpperCase();
}

function hexToString(hex: string): string {
    const hexValues = hex.trim().split(/\s+/);
    const bytes = new Uint8Array(hexValues.map(h => parseInt(h, 16)));
    return new TextDecoder().decode(bytes);
}

function hexToBytes(hex: string): Uint8Array {
    const hexValues = hex.trim().split(/\s+/);
    const bytes = new Uint8Array(hexValues.map(h => parseInt(h, 16)));
    return bytes;
}

function saveCipherHex(cipherHex: string) {
    fetch("/save-cipher-hex", {
        method: "POST",
        body: JSON.stringify({ cipherHex: cipherHex}),
          headers: { "Content-Type": "application/json" },
    }).then((_res) => {
        window.location.href="/";
    });
}

async function handleDecryption(element: Element) {
    const hexString = element.textContent?.trim() || "Ooops, something went wrong...";
    const hexBytes = hexToBytes(hexString);

    let passphrase = "abc";
    let {key, nonce} = await deriveKeyAndNonce(passphrase);

    const decrypted = new AesCtrSecret(key, nonce).encrypt(hexBytes);
    const decoded = new TextDecoder().decode(decrypted);
    element.textContent = decoded;
}
