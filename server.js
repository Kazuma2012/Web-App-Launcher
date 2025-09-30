const express = require('express');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Render 永続ディスクのマウント先を指定
// /data に Persistent Disk をマウントしている想定
const DATA_DIR = '/data';
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const APPS_FILE = path.join(DATA_DIR, 'apps.json');
if (!fs.existsSync(APPS_FILE)) fs.writeFileSync(APPS_FILE, '[]');

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static('public'));

// multer 設定（アップロード処理）
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// アプリ一覧取得
app.get('/apps', (req, res) => {
  try {
    const apps = JSON.parse(fs.readFileSync(APPS_FILE, 'utf8'));
    res.json(apps);
  } catch (err) {
    console.error('Error reading apps.json:', err);
    res.status(500).json({ error: 'Failed to read apps.json' });
  }
});

// アプリ追加
app.post('/apps', upload.single('icon'), (req, res) => {
  try {
    const apps = JSON.parse(fs.readFileSync(APPS_FILE, 'utf8'));
    const { name, url } = req.body;
    const icon = req.file ? '/uploads/' + req.file.filename : '';
    apps.push({ id: Date.now(), name, url, icon });
    fs.writeFileSync(APPS_FILE, JSON.stringify(apps, null, 2));
    res.json({ success: true });
  } catch (err) {
    console.error('Error adding app:', err);
    res.status(500).json({ error: 'Failed to add app' });
  }
});

// アプリ削除
app.delete('/apps/:id', (req, res) => {
  try {
    let apps = JSON.parse(fs.readFileSync(APPS_FILE, 'utf8'));
    apps = apps.filter(a => a.id != req.params.id);
    fs.writeFileSync(APPS_FILE, JSON.stringify(apps, null, 2));
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting app:', err);
    res.status(500).json({ error: 'Failed to delete app' });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
