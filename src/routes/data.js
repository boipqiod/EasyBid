const express = require('express');
const {bidDataController} = require("../data/bidDataController");
const OnSaleData = require("../data/onSaleData");
const router = express.Router();

router.post('/addData', (req, res, next) => {

    try {
        const {name, price, amount, maxAmount} = req.body.item
        const fileName = req.body.name
        bidDataController.addOnSale(fileName, new OnSaleData({name, price, amount, maxAmount}))
    }catch (e) {
        console.log(e)
    }


    res.send(true)
})

router.post('/remove', (req, res) =>{
    const {index} = req.body

    console.log(index)
    bidDataController.remove(index)

    res.send(true)
})

router.post('/reload', (req, res) =>{

    const fileName = req.body.name
    bidDataController.reloadData(fileName)
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
router.post('/force', (req, res) => {
    const {name, amount} = req.body

    bidDataController.saleItem(name, amount).then()

    res.send(true)
})


module.exports = router;
