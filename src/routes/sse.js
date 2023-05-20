const sseManager = require("../data/SSEManager");
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

        // SSE 연결 이벤트 발송
        setInterval(() => {
            res.write(`data: ${JSON.stringify({isFetching: true})}\n\n`);
        }, 50 * 1000);

        req.on('close', () => {
        });

    })

router.post('/events',
    (req, res) => {

        console.log("sse")
        sseManager.pushAll({"test": "test"})

        res.send(true)

    })

module.exports = router;
