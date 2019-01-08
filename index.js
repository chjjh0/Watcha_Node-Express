const express = require('express');
const app = express();
const router = express.Router();
const main = require('./public/router/main');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const flash = require('connect-flash');


const portNo = 3001;

const connection = mysql.createConnection({
    host: '127.0.0.1',
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
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// passport Strategy
passport.serializeUser(function(user, done) {
    console.log('===serializeuser')
    console.log('passport session save :', user.id)
    done(null, user.id)
})

passport.deserializeUser(function(id, done) {
    console.log('===deserializeuser')
    console.log('passport session getId :', id)
    var query = connection.query('select id from user where UID=?', [id], function(err, user) {
        if(err) throw err;
        console.log('id : ', user[0].id)
        done(null, user)
    })
})

passport.use('local-join', new LocalStrategy({
    usernameField: 'userId',
    passwordField: 'password',
    passReqToCallback: true
}, function(req, id, password, done) {
    console.log('local-join callback called')
    console.log(id)
    console.log(password)
    var query = connection.query('select * from user where id=?', [id], function(err, rows){
        if(err) return done(err);
        if(rows.length) {
            console.log('existed user')
            return done(null, false, {message : 'your id is already used'})
        } else {
            console.log('id create')
            var email = "test35email@naver.com"
            var sql = {email, id, password}
            var query = connection.query('insert into user set ?', sql, function(err, rows) {
                if(err) throw err;
                console.log('rows id: '+rows.insertId)
                return done(null, {'email: ' :email, 'id': rows.insertId});
            })
        }
    })
}
))

// GET routing
app.use('/', main)
app.use('/main', main)
app.use('/join', main)
app.use('/login', main)

// POST routing
app.post('/join', passport.authenticate('local-join', {
    successRedirect: '/main',
    failureRedirect: '/join',
    failureFlash: true
}))

app.post('/login', function(req, res) {
    var id = req.body.id;
    var password = req.body.password;
    // get : req.param('email');
    console.log(id);
    console.log(password);
    var query = connection.query('select * from user where id=? and password=?', [id, password], function(err, rows) {
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
            console.log('check your id or password' )
            res.json({errMsg: "check your id or password"})
        }
    })

})


