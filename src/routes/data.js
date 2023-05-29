const express = require('express');
const {bidDataController} = require("../data/bidDataController");
const OnSaleData = require("../data/onSaleData");
const router = express.Router();

router.post('/addData', (req, res, next) => {

    const {name, price, amount, maxAmount} = req.body
    bidDataController.addOnSale(new OnSaleData({name, price, amount, maxAmount}))

    res.send(true)
})

router.post('/remove', (req, res) =>{
    const {index} = req.body

    console.log(index)
    bidDataController.remove(index)

    res.send(true)
})

router.get('/getDataList', (req, res) => {
    const bidData = bidDataController.getOnSaleList()
    res.send(bidData)
})

router.get('/getData', (req, res) => {
    const bidData = bidDataController.getOnSale()
    res.send(bidData)
})


module.exports = router;