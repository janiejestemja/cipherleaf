# CipherLeaf
---
Minimialistic webapp - client side crypto - zero knowledge backend. 

## How it works
---
- Minmalistic Frontend written in TypeScript, HMTL, CSS
- Encryption is handled entirely in the browser using Rust -> WASM.
- The server (Flask) never sees plaintext - only encrypted bytes.
- Ciphertexts are stored alongside their corresponding Salt (sqlalchemy -> SQLite).

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
