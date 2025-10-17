# Configuration Management Guide

## Problem
You need to commit configuration schema changes but don't want to expose secrets (passwords, API keys).

## Solution: Template Pattern

We use a **template file** pattern where:
- `config.template.json` - Schema with placeholder values (✅ committed to git)
- `config.json` - Your actual secrets (❌ never committed - in .gitignore)

## Setup Steps

### 1. First Time Setup

```bash
# Copy the template to create your local config
cd backend/recognize
cp config.template.json config.json

# Edit config.json with your actual credentials
# (Use your favorite editor)
```

### 2. Fill in Your Secrets

Edit `backend/recognize/config.json`:

```json
{
    "spotify": {
        "access_token": "",
        "client_id": "YOUR_ACTUAL_SPOTIFY_CLIENT_ID",
        "client_secret": "YOUR_ACTUAL_SPOTIFY_CLIENT_SECRET"
    },
    "postgres": {
        "host": "localhost",
        "port": 5432,
        "database": "radio_plays",
        "user": "postgres",
        "password": "YOUR_ACTUAL_POSTGRES_PASSWORD"
    },
    "stations": [...]
}
```

### 3. When Schema Changes

**Scenario**: You need to add a new configuration field (e.g., a new station, API endpoint, etc.)

1. **Update the template** (`config.template.json`):
   ```json
   {
       "new_service": {
           "api_key": "YOUR_API_KEY_HERE",
           "endpoint": "https://api.example.com"
       }
   }
   ```

2. **Commit the template**:
   ```bash
   git add backend/recognize/config.template.json
   git commit -m "Add new_service configuration to schema"
   git push
   ```

3. **Update your local config** (`config.json`):
   - Manually add the new fields with your actual values
   - Or re-copy from template: `cp config.template.json config.json` and re-fill secrets

## Alternative: Environment Variables

For production or CI/CD, you can use environment variables:

### Option A: `.env` File (also in .gitignore)

Create `backend/recognize/.env`:
```env
SPOTIFY_CLIENT_ID=your_actual_id
SPOTIFY_CLIENT_SECRET=your_actual_secret
POSTGRES_PASSWORD=your_actual_password
```

Then update `recognizer.py` to load from environment:
```python
import os
from dotenv import load_dotenv

load_dotenv()

config = {
    "spotify": {
        "client_id": os.getenv("SPOTIFY_CLIENT_ID"),
        "client_secret": os.getenv("SPOTIFY_CLIENT_SECRET"),
    },
    "postgres": {
        "password": os.getenv("POSTGRES_PASSWORD", "postgres")
    }
}
```

### Option B: System Environment Variables

```bash
# Windows PowerShell
$env:SPOTIFY_CLIENT_ID="your_id"
$env:SPOTIFY_CLIENT_SECRET="your_secret"
$env:POSTGRES_PASSWORD="your_password"

# Linux/Mac
export SPOTIFY_CLIENT_ID="your_id"
export SPOTIFY_CLIENT_SECRET="your_secret"
export POSTGRES_PASSWORD="your_password"
```

## Best Practices

### ✅ DO:
- Commit `config.template.json` with schema and placeholders
- Keep `config.json` in `.gitignore`
- Document required configuration in README
- Use placeholder values like `"YOUR_API_KEY_HERE"` in templates
- Add setup instructions for new contributors

### ❌ DON'T:
- Never commit `config.json` with real secrets
- Don't use real values in template files
- Don't hardcode secrets in source code
- Don't share your `config.json` file

## Current Setup Status

✅ `config.template.json` created with schema  
✅ `config.json` added to `.gitignore`  
✅ README documentation added  

## Files You Should Commit

```bash
# After making schema changes:
git add backend/recognize/config.template.json
git add backend/recognize/README.md
git add .gitignore
git commit -m "Update configuration schema - add 103fm station"
git push
```

## Files You Should NEVER Commit

❌ `backend/recognize/config.json` (your actual secrets)  
❌ `.env` files  
❌ Any file with passwords or API keys  

## Checking Before Commit

Before committing, always verify you're not accidentally including secrets:

```bash
# Check what you're about to commit
git status
git diff --staged

# If you see config.json in the list, DO NOT COMMIT!
# Remove it from staging:
git reset backend/recognize/config.json
```

## If You Accidentally Committed Secrets

If you accidentally committed secrets, you need to:
1. Rotate/change those credentials immediately
2. Remove them from git history (use `git filter-repo` or BFG Repo-Cleaner)
3. Force push the cleaned history (⚠️ careful with shared repositories)

Prevention is much easier than cleanup!
