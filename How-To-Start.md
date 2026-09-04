# 🚀 How to Start TruthLens

---

## 📍 Quick URLs
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

# 🪟 Windows Setup & Startup

### 1️⃣ Initial Setup (Run Once)
Open **PowerShell** in `d:\fake news detector`:

```powershell
# Create & Activate Virtual Environment
python -m venv .venv
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\.venv\Scripts\Activate.ps1

# Install Dependencies
pip install -r requirements.txt
cd frontend
npm install
cd ..
```

---

### 2️⃣ Start Backend (Terminal 1)
Open **PowerShell** in `d:\fake news detector`:

```powershell
$env:PYTHONPATH="backend"
.\.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

### 3️⃣ Start Frontend (Terminal 2)
Open a **new PowerShell** in `d:\fake news detector\frontend`:

```powershell
npm run dev
```

---

# 🍎 Mac Setup & Startup

### 1️⃣ Initial Setup (Run Once)
Open **Terminal** in project root folder:

```bash
# Create & Activate Virtual Environment
python3 -m venv .venv
source .venv/bin/activate

# Install Dependencies
pip install -r requirements.txt
cd frontend
npm install
cd ..
```

---

### 2️⃣ Start Backend (Terminal 1)
Open **Terminal** in project root folder:

```bash
export PYTHONPATH="backend"
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

### 3️⃣ Start Frontend (Terminal 2)
Open a **new Terminal** in `frontend/` folder:

```bash
npm run dev
```

---

# 🧪 Run Automated Tests

### On Windows:
```powershell
$env:PYTHONPATH="backend"
.\.venv\Scripts\pytest backend/tests/test_truthlens.py -v
```

### On Mac:
```bash
export PYTHONPATH="backend"
source .venv/bin/activate
pytest backend/tests/test_truthlens.py -v
```

---

# 🛑 Stop Servers
Press `Ctrl + C` in both terminals.
