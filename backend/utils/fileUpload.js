const multer = require("multer");
const path = require("path");
const fs = require("fs");

const MAX_SIZE = 16 * 1024 * 1024;
const ALLOWED_EXT = [".png", ".jpg", ".jpeg", ".gif", ".pdf", ".doc", ".docx"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const username = req.user?.username || "anonymous";
    const year = new Date().getFullYear();
    const dir = path.join(__dirname, "../uploads", username, String(year));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    return cb(new Error("Unsupported file type"));
  }
  cb(null, true);
}

const uploader = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter
});

module.exports = { uploader };