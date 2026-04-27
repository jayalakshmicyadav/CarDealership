const path = require("path");
const fs = require("fs");

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const baseUrl = () =>
  process.env.BASE_URL || `http://localhost:${process.env.PORT || 5002}`;

exports.saveLocalImage = async (file, prefix) => {
  const fileName = `${prefix}-${Date.now()}${path.extname(file.name)}`;
  await file.mv(path.join(UPLOADS_DIR, fileName));
  return { fileId: fileName, url: `${baseUrl()}/uploads/${fileName}` };
};

exports.deleteLocalImage = (fileId) => {
  if (!fileId) return;
  const filePath = path.join(UPLOADS_DIR, fileId);
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (_) {}
  }
};
