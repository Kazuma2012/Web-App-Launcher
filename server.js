const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// ===== JSONBin 設定 =====
const JSONBIN_API_KEY = '$2a$10$6/PlhrS0i2Zrk0zdUD2gDOD5I6ubsQb4Ev7Gih6eKukhn71LnZLy.';
const JSONBIN_ID = '68db975dae596e708f00e22f';
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_ID}`;

// ===== アップロード画像保存先（Render 無料プランでは一時保存） =====
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ===== ミドルウェア =====
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static('public'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ===== JSONBin から取得 =====
async function loadApps() {
  const res = await fetch(JSONBIN_URL, {
    headers: { 'X-Master-Key': JSONBIN_API_KEY }
  });
  const data = await res.json();
  return data.record.apps || [];
}

// ===== JSONBin に保存 =====
async function saveApps(apps) {
  await fetch(JSONBIN_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_API_KEY
    },
    body: JSON.stringify({ apps })
  });
}

// ===== API =====
app.get('/apps', async (req, res) => {
  try {
    const apps = await loadApps();
    res.json(apps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load apps' });
  }
});

app.post('/apps', upload.single('icon'), async (req, res) => {
  try {
    const apps = await loadApps();
    const { name, url } = req.body;
    const icon = req.file ? '/uploads/' + req.file.filename : '';
    const newApp = { id: Date.now(), name, url, icon };
    apps.push(newApp);
    await saveApps(apps);
    res.json(newApp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save app' });
  }
});

app.delete('/apps/:id', async (req, res) => {
  try {
    let apps = await loadApps();
    apps = apps.filter(a => a.id != req.params.id);
    await saveApps(apps);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete app' });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
