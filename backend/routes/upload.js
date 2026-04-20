const express = require("express");
const path = require("path");
const fs = require("fs");
const { authenticateToken } = require("../middleware/auth");
const { uploader } = require("../utils/fileUpload");
const { db } = require("../database/init");

const router = express.Router();

// POST /api/upload
router.post("/upload", authenticateToken, uploader.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const request_id = req.body.request_id ? Number(req.body.request_id) : null;
    const relativePath = req.file.path.split(path.join(__dirname, ".."))[1].replace(/\\/g, "/");

    if (request_id) {
      const row = db.prepare(`SELECT id FROM leave_requests WHERE id = ?`).get(request_id);
      if (!row) return res.status(404).json({ message: "Leave request not found" });

      const hasAttachmentCol = db.prepare(`PRAGMA table_info(leave_requests)`).all().some(c => c.name === "attachment_path");
      if (hasAttachmentCol) {
        db.prepare(`UPDATE leave_requests SET attachment_path = ? WHERE id = ?`).run(relativePath, request_id);
      }
    }

    return res.json({
      message: "File uploaded successfully",
      file_path: relativePath
    });
  } catch (e) {
    console.error("UPLOAD error:", e);
    return res.status(500).json({ message: e.message || "Upload failed" });
  }
});

// GET /api/uploads/:filepath
router.get("/uploads/*", authenticateToken, (req, res) => {
  try {
    const rel = req.params[0];
    if (!rel) return res.status(400).json({ message: "Missing file path" });

    const safeBase = path.join(__dirname, "../uploads");
    const abs = path.join(safeBase, rel);
    if (!abs.startsWith(safeBase)) return res.status(403).json({ message: "Invalid path" });

    if (!fs.existsSync(abs)) return res.status(404).json({ message: "File not found" });

    return res.sendFile(abs);
  } catch (e) {
    console.error("DOWNLOAD error:", e);
    return res.status(500).json({ message: "File read failed" });
  }
});

module.exports = router;