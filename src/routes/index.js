const express = require('express');
const youtubeService = require("../service/YoutubeService");
const {bidDataController, clearBid} = require("../data/bidDataController");
const router = express.Router();

/* GET home page. */
router.get('/', async (req, res, next) => {
    res.render("main/main")
})

router.post('/startSale', (req, res)=>{
    bidDataController.startFetching(req.body.index).then()
    res.send(true)
})

router.post('/endSale', (req, res)=>{
    bidDataController.stopFetching()
    res.send(true)
})

router.post('/endBid', (req, res)=>{
    clearBid()
    res.send(true)
})

router.post('/refresh', (req, res)=>{
    bidDataController.fetch().then()
    res.send(true)
})


router.get('/display', (req, res) => {
    res.render("display/display")
})

router.get('/display/seller', (req, res) => {
    res.render("display/seller")
})

router.get('/clear', (req, res) =>{
    clearBid()
    res.redirect('/')
})

router.get('/user', (req, res)=>{
    res.render("display/user")
})

module.exports = router;
