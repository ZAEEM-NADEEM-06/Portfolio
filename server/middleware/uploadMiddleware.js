const { upload } = require('../config/cloudinary');

const handleUpload = (req, res, next) => {
  const singleUpload = upload.single('image');

  singleUpload(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ 
        message: err.message || 'Upload failed' 
      });
    }
    
    if (!req.file && req.method === 'POST') {
      return res.status(400).json({ 
        message: 'Please upload an image' 
      });
    }
    
    next();
  });
};

module.exports = { handleUpload };