const multer= require('multer');

const {storage}= require("../config/cloudinaryConfig");

// upload image particular image
const employeePhotoUpload = multer({
  storage: storage,
  limits: {fileSize: 5*1024*1024}, // 5MB limit
});


module.exports={
    employeePhotoUpload
}