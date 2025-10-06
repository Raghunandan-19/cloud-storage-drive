const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userModel = require('../models/user.model')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const auth = require('../middleware/auth')
const { supabase, SUPABASE_BUCKET } = require('../config/supabase')

// Multer memory storage for Supabase upload
const upload = multer({ storage: multer.memoryStorage() })

router.get('/register', (req, res) => {
    res.render('register')
})

router.post('/register',
    body('email').trim().isEmail().isLength({ min: 13}),
    body('password').trim().isLength({ min: 5 }),
    body('username').trim().isLength({ min: 3}),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
                message: "Invalid data"
            })
        }

        try {
            const {email, username, password} = req.body;
            const hashPassword = await bcrypt.hash(password, 10);

            await userModel.create({
                email,
                username,
                password: hashPassword
            })

            return res.redirect('/user/login')
        } catch (err) {
            if (err && err.code === 11000) {
                return res.status(409).send('<script>alert("User already exists"); window.location="/user/register";</script>')
            }
            return res.status(500).send('<script>alert("Something went wrong"); window.location="/user/register";</script>')
        }
})

router.get('/login', (req, res) => {
    res.render('login')
})

router.post('/login', 
    body('password').trim().isLength({ min: 5 }),
    body('username').trim().isLength({ min: 3}),

    async (req, res) => {


        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).send('<script>alert("Invalid data"); window.location="/user/login";</script>')
        }
        
        const { username, password } = req.body;
    
        const user = await userModel.findOne({
            username: username
        })

        if (!user) {
            return res.status(400).send('<script>alert("username or password is incorrect"); window.location="/user/login";</script>')
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(400).send('<script>alert("username or password is incorrect"); window.location="/user/login";</script>')
        }
        

        const token = jwt.sign({
            userId: user._id,
            email: user.email,
            username: user.username,
        },
            process.env.JWT_SECRET,
        )

        const isProd = process.env.NODE_ENV === 'production'
        res.cookie('token', token, {
            httpOnly: true,
            secure: isProd, // only over HTTPS in production
            sameSite: isProd ? 'none' : 'lax'
        })
        res.redirect('/home')
    }
)

// logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
})

// handle file upload to Supabase (protected)
router.post('/upload-file', auth, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded')
    }
    const userId = String(req.user.userId)
    const parsed = path.parse(req.file.originalname)
    const ext = parsed.ext || ''
    const safeBase = (parsed.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `${userId}/${safeBase}-${Date.now()}${ext}`
    const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(key, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
    })
    if (error) {
        console.error('Supabase upload error:', error)
        return res.status(500).send('<script>alert("Upload failed"); window.location="/home";</script>')
    }
    res.redirect('/home')
})

// delete a file (protected)
router.post('/delete-file', auth, async (req, res) => {
    const { filename } = req.body;
    if (!filename) {
        return res.status(400).send('filename is required')
    }
    const userId = String(req.user.userId)
    const key = `${userId}/${filename}`
    await supabase.storage.from(SUPABASE_BUCKET).remove([key])
    return res.redirect('/home')
})

// download a file (protected)
router.get('/download-file/:filename', auth, async (req, res) => {
    const safeName = path.basename(req.params.filename || '')
    if (!safeName) return res.status(400).send('filename is required')
    const userId = String(req.user.userId)
    const key = `${userId}/${safeName}`
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).createSignedUrl(key, 60)
    if (error || !data) return res.status(404).send('File not found')
    return res.redirect(data.signedUrl)
})

// rename a file (protected)
router.post('/rename-file', auth, async (req, res) => {
    const { filename, newFilename } = req.body;
    const safeOld = path.basename(filename || '');
    let safeNew = path.basename(newFilename || '');
    if (!safeOld || !safeNew) {
        return res.status(400).send('Both filename and newFilename are required');
    }
    const userId = String(req.user.userId)
    const oldExt = path.extname(safeOld)
    if (!path.extname(safeNew)) {
        safeNew = safeNew + oldExt
    }
    const from = `${userId}/${safeOld}`
    const to = `${userId}/${safeNew}`
    await supabase.storage.from(SUPABASE_BUCKET).move(from, to)
    return res.redirect('/home')
})

module.exports = router;