const express = require('express');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// 永続ディスクパス
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const APPS_FILE = path.join(DATA_DIR, 'apps.json');
if (!fs.existsSync(APPS_FILE)) fs.writeFileSync(APPS_FILE, '[]');

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static('public'));

// multer 設定（アイコンアップロード）
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// アプリ一覧取得
app.get('/apps', (req, res) => {
  const apps = JSON.parse(fs.readFileSync(APPS_FILE, 'utf8'));
  res.json(apps);
});

// アプリ追加
app.post('/apps', upload.single('icon'), (req, res) => {
  const apps = JSON.parse(fs.readFileSync(APPS_FILE, 'utf8'));
  const { name, url } = req.body;
  const icon = req.file ? '/uploads/' + req.file.filename : '';
  apps.push({ id: Date.now(), name, url, icon });
  fs.writeFileSync(APPS_FILE, JSON.stringify(apps, null, 2));
  res.json({ success: true });
});

// アプリ削除
app.delete('/apps/:id', (req, res) => {
  let apps = JSON.parse(fs.readFileSync(APPS_FILE, 'utf8'));
  apps = apps.filter(a => a.id != req.params.id);
  fs.writeFileSync(APPS_FILE, JSON.stringify(apps, null, 2));
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
