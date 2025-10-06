const express = require('express')
const router = express.Router();
const auth = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const { supabase, SUPABASE_BUCKET } = require('../config/supabase')

router.get('/', (req, res) => {
    res.render('index');
})

router.get('/home', auth, async (req, res) => {
    const userId = String(req.user.userId)
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).list(userId, {
        limit: 100, offset: 0
    })
    const files = (data || [])
        .filter(f => f.name && f.name !== '.emptyFolderPlaceholder')
        .map(f => ({ name: f.name, url: `/user/download-file/${encodeURIComponent(f.name)}` }))
    res.render('home', { files })
})

module.exports = router;