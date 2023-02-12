import multer from 'multer'

const storage = multer.diskStorage({
    filename: function (req, file, cb) {
        const uniqeSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqeSuffix + '-' + file.originalname)
    }
})

const upload = multer({
    storage: storage,
})

export default upload
