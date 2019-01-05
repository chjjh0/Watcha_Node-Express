const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const portNo = 3001;

app.listen(portNo, () => {
    console.log('서버실행 완료', `${portNo}`);
});

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.get('/', (req, res, next) => {
    res.sendFile(__dirname + "/public/main.html");
});

app.post('/login', function(req, res) {
    // get : req.param('email');
    console.log(req.body.id);
    console.log(req.body.passwd);
    res.send("post response");
})


