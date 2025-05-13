# CipherLeaf
---
Minimialistic webapp - client side crypto - zero knowledge backend. 

## User Authentification & Session Management
---
- User Model: The application defines a User model using sqlalchemy to represent users in the database. This model includes fields such as id, username, email, and password_hash.
- Password Handling: Passwords are securely hashed using Werkzeug's generate_passowrd_hash and verified with check_password_hash to ensure user credentials are stored safely.
- Login Management: Flask-login is utilized to manage user sessions. It provides functionalities like login_user, logout_user, and current_user to handle user authentification seamlessly.
- User Loader: A user loader function is defined to retrieve user instances from the databse using their unique ID, facilitating session management.

### Access Control
---
- Protected Routes: Certain routes are protected using the @login_required decorator from Flask-Login, ensuring that only authenticated users can access specific parts of the application.

### User Registration & Management
---
- Registration: Users can register by providing necessary crendentials, which are then validated and stored securely in the database.
- Login: Registered users can log in using their credentials, initiating a user session managed by Flask-Login.
- Logout: Users can log out, terminating their session and ensuring security.
- User Dashboard: Authenticated users have access to a dashboard where they can manage their encrypted notes. 

### Data Handling
--- 
- Encrypted Data Storage: User notes are encrypted client-side using WebAssembly and stored on the server in their encrypted form, ensuring zero-knowledge storage.
- Data Retrieval: Upon authentication, users can retrieve their encrypted notes, which are then decrypted client-side for viewing or deleting.

## Encryption Logic Overview
---
This application provide client-side encryption for notes using [AES-CTR](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Counter_(CTR)) mode via a [WebAssembly module](https:github.com/janiejestemja/aes_ctr_rsts) compiled from Rust. Two encryption schemes are available:
- Demo Mode: For quick unsalted encryption (not cryptographically secure).
- HKDF Mode: Secure key derivation using HKDF with a unique salt per encryption.

### Key Encryption Features
---
- Symmetric Encryption with AES-CTR (AES-256 + 64-bit nonce).
- Passphrase-based Key Derivation with optional salt.
- Rust-WASM crypto core for performance and robustness.
- No data is sent unencrypted - the server sees only he-encoded ciphertext and salt.

### Demo Mode (SHA-256 derived)
---
Purpose: Lightweight encryption for quick tests or UX demos. **Not secure** in production use.

How it works:
- User enters a passphrase
- The passphrase is hashed using SHA-256 via WebCrypto API.
- The resulting 32-byte hash is split:
  - First 32 bytes: AES key.
  - First 8 bytes (reversed): AES nonce.
- The plaintext is encoded as bytes (UTF-8).
- The result is a hex-encoded ciphertext.

**Decryption** uses the *same process* with the same passphrase.

**Warning**: Since there's no salt or iteration count, passphrase reuse or weak passphrases may compromise security. Only use this mode for demonstartion or non-sensitive data.

### HKDF Mode (salted & secure)
---
**Purpose**: Cryptographically sound passphrase-based encryption using [HKDF](https://datatracker.ietf.org/doc/html/rfc5869) (HMAC-based Key Derivation Function).

How it works:
- User enters a passphrase and optionally proviades a salt (in hex).
  - if no salt is provided, a 32-byte (256-bit) random salt is generated.
- The passphrase is encoded (TextEncoder) into raw bytes.
- The Web Crypto API's HKDF algorithm is used to derive:
  - Key (32 bytes) using context string "key".
  - Nonce (8 bytes) using context string "nonce".
- These are passed to the Rust AesCtrSecret implementation for AES-CTR encryption.
- Both ciphertext and salt are hex-encoded and stored together (sqlalchemy).

**Decryption**:
- On click, the encrypted note and its salt are retrieved.
- The same HKDF process is run with the salt and passphrase.
- The derived key nd nonce are used to decrypt.

**Security Properties**:
- Strong key derivation due to HKDF + per-message salt.
- Replay-safe due to salt/nonce diversity.
- Only the encrypted note and salt are sent to the server - never the passphrase or plaintext.

### Implementation Notes
---
- AES_CTR logic is implemented in Rust , compiled to WebAssembly.
- HKDF is performed using Web Crypto API in the browser.
- All conversions (e.g. text <-> hex) are handled in JavaScript.
- The encryption/decryption function is symmetirc (same function for both).

## Running locally
---
### Prerequisites
---
- Python 3.13
- [Encryption engine](https:github.com/janiejestemja/aes_ctr_rsts)

### Installing dependencies
---
```bash
pip install -r requirements.txt
```

### Path to encryption engine
---
The encryption engine is expected to be placed at
```plaintext
/website/static/pkg/
```

### Start flask backend
---
```bash
python main.py
```

## License
---
MIT License
