const {sseManager} = require("../data/SSEManager");
const express = require('express');
const router = express.Router();

router.get('/events',
    (req, res) => {
        const headers = {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        };
        res.writeHead(200, headers);
        sseManager.add(res)
        const lastIndex = sseManager.lastIndex()
        req.on('close', () => {
            sseManager.remove(lastIndex)
        });

    })

router.post('/events',
    (req, res) => {
        res.send(true)
    })

module.exports = router;
