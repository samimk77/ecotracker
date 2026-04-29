const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for issue images (before/after)
const issueStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ecotrack/issues',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
  },
});

// Storage for event images
const eventStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ecotrack/events',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 675, crop: 'limit', quality: 'auto' }],
  },
});

// Storage for avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ecotrack/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 300, height: 300, crop: 'thumb', gravity: 'face' }],
  },
});

// Storage for issue videos
const issueVideoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ecotrack/issues/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv'],
  },
});

// Storage for contribution reels (video)
const reelStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ecotrack/reels',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'webm'],
    transformation: [{ quality: 'auto' }],
  },
});

const uploadIssueImage = multer({ storage: issueStorage });
const uploadEventImage = multer({ storage: eventStorage });
const uploadAvatar = multer({ storage: avatarStorage });
const uploadReel = multer({ storage: reelStorage, limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB

// Multi-media upload for issues
const uploadIssueMedia = multer({
  storage: issueStorage,
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);

module.exports = { 
  cloudinary, 
  uploadIssueImage, 
  uploadEventImage, 
  uploadAvatar,
  uploadIssueMedia,
  uploadReel,
};
