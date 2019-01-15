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
const { isLoggedIn, isNotLoggedIn } = require('./public/router/middlewares');


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
// join use passport
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
            var email = "test37email@naver.com"
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
// login use passport
passport.use('local-login', new LocalStrategy({
    usernameField: 'userId',
    passwordField: 'password',
    passReqToCallback: true
}, function(req, id, password, done) {
    console.log('local-login')
    console.log('id: '+id)
    console.log('password: '+password)
    var query = connection.query('select * from user where id=?', [id], function(err, rows) {
        if(err) return done(err);
        if(rows.length) {
            console.log('had id')
            console.log('id: '+id)
            console.log('password: '+password)
            var query = connection.query(
                'select * from user where id=? and password=?',
                [id, password],
                function(err, rows) {
                if(err) {
                    console.log('The Password do not match')
                    return done(err);
                } else if(rows.length){
                    console.log('sever side login success!!')
                    console.log('rows[0]: '+rows[0].email)
                    console.log('rows[0]: '+rows[0].UID)
                    return done(null, {'email': rows[0].email, 'id': rows[0].UID});
                }
                }
            )
        } else {
            console.log('id not found')
            return done(null, false, {'message': 'your login info is not found!!'})
        }
    })
}
))


// GET routing
app.use('/', main)
app.use('/main', main)
app.use('/join', main)
app.use('/login', main)
app.use('/category', main)

// GET /category/init
app.get('/category/init', function(req, res) {
    console.log('====/category/init')
    console.log('req.body.categoryState: '+req.body.categoryState);
    var query = connection.query('select * from video', function(err, rows) {
        console.log('======category inside')
        if(err) throw err;
        console.log(rows[0].image)
        console.log(rows[0].title)
        console.log(rows[0].releaseYear)
        console.log(rows[0].ratingAge)
        console.log(rows[0].runningtime)
        var videoHour = parseInt(rows[0].runningtime / 60);
        var videoMinute = parseInt(rows[0].runningtime % 60);
        var runningtime = videoHour + "시간 " + videoMinute + "분";
        console.log('runningtime: ' + runningtime)
        console.log('111111111111')
        console.log(rows[1].image)
        console.log(rows[1].title)
        console.log(rows[1].releaseYear)
        console.log(rows[1].ratingAge)
        console.log(rows[1].runningtime)
        console.log('222222222222')
        console.log(rows.length)
        res.send({
            message: 'category success',
            video: rows,
            videoLength: rows.length
        })     
    })
})


// POST /join
app.post('/join', isNotLoggedIn, async (req, res, next) => {
    console.log('====POST /join')
    console.log('email: ', req.body.email)
    console.log('id: ', req.body.userId)
    console.log('password: ', req.body.password)
    var email = req.body.email;
    var id = req.body.id;
    var password = req.body.password;
    console.log('비구조화 할당')
    console.log('email: ', email)
    console.log('id: ', id)
    console.log('password: ', password)
    var query = connection.query('select id from user where id=?', [id], function(err, rows) {
        console.log('inside query')
        if(err) {
            console.log('err 발생')
            console.log('err: '+err)
            res.send({
                errMsg: err
            })
        } 
        if(rows.length >= 1) {
            console.log('id is already exists: '+rows[0].id)
            res.send({
                existsMsg: 'id가 이미 존재합니다'
            })
        // /if
        } else {
            var sql = {email, id , password}    
            console.log('======sql')
            console.log('======sql id: '+sql.id)
            console.log('======sql email: '+sql.email)
            console.log('======sql password: '+sql.password)
            var query = connection.query('insert into user set ?', sql, function(err, rows) {
                if(err) throw err;
                if(rows.insertId){
                console.log('join success!!!!')
                console.log('rows id: '+rows.insertId)
                res.send({
                    successMsg: 'Welcome!!'
                })
            }
            // /query
            })
        }
    // /query
    })
// /join
})

// POST /login
app.post('/login', function(req, res, next) {
    console.log('POST /login')
    console.log('id: '+req.body.userId);
    console.log('password: '+req.body.password);
    passport.authenticate('local-login', function(err, user, info) {
        if(err) res.status(500).json(err);
        if(!user) return res.status(401).json(info.message);

        req.logIn(user, function(err) {
            if(err) {return next(err);}
            console.log('req.logIn')
            console.log('getId: '+user.id)
            return res.json(user);
        });
    })(req, res, next)
})


