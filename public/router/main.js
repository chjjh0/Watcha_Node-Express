const express = require('express');
const app = express();
const router = express.Router();
const path = require('path')
const flash = require('connect-flash');

app.use(flash());

// app.get('/', (req, res, next) => {
//     var msg;
//     var errMsg = req.flash('error')
//     console.log('get /')
//     res.sendFile(__dirname + "/public/main.html");
// });




router.get('/', function(req, res) {
    console.log('====//////')
    
    // if(req.user || req.flash('error')) {
    //     //var id = req.user[0].id;
    //     var errMsg = req.flash('error')
    //     console.log('errMsg: ',errMsg)
    //     console.log('main id: ', id)

    //     res.json({
    //         "message": "join success!!!!!!",
    //         "id": id + "님 반갑습니다"
    //     })
    // } else {
    //     res.sendFile(path.join(__dirname, '../main.html'));
    // }
    res.sendFile(path.join(__dirname, '../main.html'));
})

router.get('/join', function(req, res) {
    console.log('===/join')
    res.sendFile(path.join(__dirname, '../main.html'));
})

router.get('/login', function(req, res) {
    console.log('===/login')
    res.sendFile(path.join(__dirname, '../main.html'));
})






module.exports = router;