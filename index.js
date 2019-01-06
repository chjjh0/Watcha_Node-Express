const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');
const portNo = 3001;

const connection = mysql.createConnection({
    host: 'localhost',
    port: 9999,
    user: 'root',
    password: 'nodejsbook',
    database: 'inflearn'
});

connection.connect()

app.listen(portNo, () => {
    console.log('서버실행 완료', `${portNo}`);
});

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.get('/*', (req, res, next) => {
    res.sendFile(__dirname + "/public/main.html");
});


app.post('/join', function(req, res) {
    console.log('welcome to join')
    console.log(req.body.email)
    console.log(req.body.id)
    console.log(req.body.passwd)
    
    const email = req.body.email;
    const id = req.body.id;
    const password = req.body.passwd;

    var query = connection.query('insert into user (email, id, password) values(?, ?, ?)', [email, id, password], function(err, res){
        if(err) throw err;
        console.log('join success');
    })

})

app.post('/login', function(req, res) {
    var id = req.body.id;
    var passwd = req.body.passwd;
    // get : req.param('email');
    console.log(req.body.id);
    console.log(req.body.passwd);

    var query = connection.query('select * from user where id=?', [id], function(err, rows) {
        if(err) throw err;
        if(rows[0]) {
            console.log('login success')
            console.log(rows[0].id)
            console.log(rows[0].password)
            console.log(rows[0].email)
            var resResult = {
                id: rows[0].id,
                passwd: rows[0].password,
                email: rows[0].email
            };
            res.send(resResult)
        } else {
            console.log('none: ' + rows[0].id)
        }
    })

})


