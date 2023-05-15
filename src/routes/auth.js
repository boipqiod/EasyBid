const express = require('express');
const router = express.Router();


router.get("/sign",
    (req, res) => {
        console.log("/sign")
        res.render("auth/authMain")
    })


router.get("/redirection",
    (req, res) => {
        console.log("/redirection")
        res.render("auth/authRedirect")
    })


module.exports = router