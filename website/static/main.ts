import init, {AesCtrSecret} from "./pkg/aes_ctr_rsts.js"

const cipherNote = document.getElementById("cipher-note") as HTMLTextAreaElement;
const cipherBtn = document.getElementById("cipher-btn") as HTMLButtonElement;
const demoCipherBtn = document.getElementById("demo-cipher-btn") as HTMLButtonElement;
const cipherDiv = document.getElementById("cipher-div") as HTMLDivElement;
const passDiv = document.getElementById("passphrase") as HTMLInputElement;
const saltDiv = document.getElementById("salt") as HTMLInputElement;

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

            let {key, nonce, salt} = await deriveKeyNonceSalt(passDiv.value?.trim() || "abc", oldSalt);

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
            let {key, nonce} = await deriveKeyAndNonce(passDiv.value?.trim() || "abc");
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
async function deriveKeyNonceSalt(passphrase: string, salt?: Uint8Array): Promise<{
    key:Uint8Array,
    nonce: Uint8Array,
    salt: Uint8Array,
}> {
    const ikm = new TextEncoder().encode(passphrase);

    // If no salt mine some (256 bits)
    if (!salt) {
        salt = crypto.getRandomValues(new Uint8Array(32));
    }

    const baseKey = await crypto.subtle.importKey(
        "raw", ikm, {name: "HKDF" }, false, ["deriveBits"]
    );

    const derive = async (infoStr: string, length: number) => {
        const info = new TextEncoder().encode(infoStr);
        const bits = await crypto.subtle.deriveBits(
            {
                name: "HKDF",
                hash: "SHA-256",
                salt: salt,
                info: info
            },
            baseKey,
            length * 8
        );
            return new Uint8Array(bits);
    };

    const key = await derive("key", 32);
    const nonce = await derive("nonce", 8);

    return {key, nonce, salt};
}

function saveCipherHex(cipherHex: string, saltHex: string) {
    fetch("/save-cipher-hex", {
        method: "POST",
        body: JSON.stringify({ cipherHex: cipherHex, saltHex: saltHex}),
          headers: { "Content-Type": "application/json" },
    }).then((_res) => {
        window.location.href="/";
    });
}

async function deriveKeyAndNonce(passphrase: string): Promise<{ key: Uint8Array, nonce: Uint8Array }> {
    const encoder = new TextEncoder();
    const data = encoder.encode(passphrase);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = new Uint8Array(hashBuffer);

    const key = hashArray.slice(0, 32);
    const nonce = hashArray.slice(0, 8).reverse();

    return { key, nonce };
}


async function handleDecryption(element: Element) {

    const hexString = element.children[0]?.textContent?.trim() || "Couldn't find leaf";
    const hexBytes = hexToBytes(hexString);

    const saltHex = element.children[1]?.textContent?.trim() || "pepper";
    if (saltHex === "pepper") return;
    const saltBytes = hexToBytes(saltHex);

    let passphrase = passDiv.value?.trim() || "abc";
    let {key, nonce} = await deriveKeyNonceSalt(passphrase, saltBytes);

    const decrypted = new AesCtrSecret(key, nonce).encrypt(hexBytes);
    const decoded = new TextDecoder().decode(decrypted);
    element.textContent = decoded;
}

async function handleDemoDecryption(element: Element) {
    const hexString = element.textContent?.trim() || "Ooops, something went wrong...";
    const hexBytes = hexToBytes(hexString);

    let passphrase = passDiv.value?.trim() || "abc";
    let {key, nonce} = await deriveKeyAndNonce(passphrase);

    const decrypted = new AesCtrSecret(key, nonce).encrypt(hexBytes);
    const decoded = new TextDecoder().decode(decrypted);
    element.textContent = decoded;
}

/* Conversions */
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

