const express = require('express');
const youtubeService = require("../service/YoutubeService");
const {bidDataController, clearBid} = require("../data/bidDataController");
const router = express.Router();

/* GET home page. */
router.get('/', async (req, res, next) => {

    console.log(req.query)

    if(!youtubeService.broadcastId || !youtubeService.apikey){
        console.log("!youtubeService.broadcastId || !youtubeService.apikey")

        res.redirect("/broadcast")
        return
    }

    if(req.query.token){
        youtubeService.setTokenId(req.query.token)
        res.redirect("/")
        return
    }

    if(!youtubeService.tokenId){
        res.redirect("/auth/sign")
        return
    }

    const test = await youtubeService.test()

    if(test) {
        res.render("main/main")
    }else{
        console.log("youtubeService.test()")

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

router.get('/display/seller', (req, res) => {
    res.render("display/seller")
})

router.get('/clear', (req, res) =>{
    youtubeService.clear()
    clearBid()
    res.redirect('/')
})

router.get('/clearGoogle', (req, res) =>{
    youtubeService.clear()
    res.redirect('/')
})

router.get('/user', (req, res)=>{
    res.render("display/user")

})

router.get('/test', (req, res)=>{
    res.render("main/main")

})


module.exports = router;
