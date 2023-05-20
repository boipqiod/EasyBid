const express = require('express');
const youtubeService = require("../service/YoutubeService");
const bidDataController = require("../data/bidDataController");
const router = express.Router();

/* GET home page. */
router.get('/', async (req, res, next) => {

    if(!youtubeService.broadcastId || !youtubeService.apikey){
        res.redirect("/broadcast")
        return
    }

    if(req.query.access_token){
        youtubeService.tokenId = req.query.access_token
        res.redirect("/")
        return
    }

    if(!youtubeService.tokenId){
        res.redirect("/auth/sign")
        return
    }

    const test = await youtubeService.test()

    console.log(test)

    if(test) {
        res.render("main/main")
    }else{
        res.redirect("/broadcast")
    }

})

router.get("/main", (req, res) =>{
    if(!req.session.token){
        res.redirect("/auth/sign")
    }else{
        res.render("main/main")
    }
})


router.post('/startSale', (req, res)=>{

    bidDataController.setData(req.body)
    bidDataController.startFetching().then()

    res.send(true)
})

router.post('/endSale', (req, res)=>{

    bidDataController.stopFetching()

    res.send(true)
})

router.post('/broadcastId', (req, res)=>{
    if(req.body.broadcastId && req.body.apikey){
        youtubeService.broadcastId = req.body.broadcastId
        youtubeService.apikey = req.body.apikey
        res.send(true)
    }else{
        res.send(false)
    }

})

router.get('/broadcast', (req, res) => {
    res.render("auth/broadcastId")
})


router.get('/display', (req, res) => {
    res.render("display/display")
})

router.get('/clear', (req, res) =>{
    youtubeService.clear()
    res.redirect('/')
})

module.exports = router;
