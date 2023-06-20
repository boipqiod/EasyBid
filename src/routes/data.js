const express = require('express');
const {bidDataController} = require("../data/bidDataController");
const OnSaleData = require("../data/onSaleData");
const router = express.Router();

router.post('/addData', (req, res, next) => {

    try {
        const {name, price, amount, maxAmount} = req.body.item
        console.log('/addData', req.body.name, name, price, amount, maxAmount)

        parseInt(price)

        const fileName = req.body.name
        bidDataController.addOnSale(fileName, new OnSaleData({name, price: parseInt(price), amount: parseInt(amount), maxAmount: parseInt(maxAmount)}))
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
    console.log('/reload', fileName)
    const item = bidDataController.reloadData(fileName)
    res.send(item)
})

router.get('/getDataList', (req, res) => {
    const bidData = bidDataController.getOnSaleList()
    res.send(bidData)
})

router.get('/getData', (req, res) => {
    const bidData = bidDataController.getOnSale()
    res.send(bidData)
})

router.post('/modify', (req, res) => {
    const {index, name, amount, price, max} = req.body

    console.log('/modify', req.body)
    bidDataController.modify(parseInt(index), new OnSaleData({name, price: parseInt(price), amount: parseInt(amount), maxAmount: parseInt(max)}))
    res.send(true)
})

router.post('/force', (req, res) => {
    const {index, name, amount} = req.body
    console.log('/data/force', index, name, parseInt(amount))
    bidDataController.saleItem(index, name, parseInt(amount)).then()

    res.send(true)
})


module.exports = router;
