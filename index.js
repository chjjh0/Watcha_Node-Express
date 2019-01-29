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
const {
    isLoggedIn,
    isNotLoggedIn
} = require('./public/router/middlewares');


const portNo = process.env.PORT || 8000;

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
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// passport Strategy
passport.serializeUser(function (user, done) {
    console.log('===serializeuser')
    console.log('passport session save :', user.id)
    done(null, user.id)
})

passport.deserializeUser(function (id, done) {
    console.log('===deserializeuser')
    console.log('passport session getId :', id)
    var query = connection.query('select id from user where UID=?', [id], function (err, user) {
        if (err) throw err;
        console.log('id : ', user[0].id)
        done(null, user)
    })
})
// join use passport
passport.use('local-join', new LocalStrategy({
    usernameField: 'userId',
    passwordField: 'password',
    passReqToCallback: true
}, function (req, id, password, done) {
    console.log('local-join callback called')
    console.log(id)
    console.log(password)
    var query = connection.query('select * from user where id=?', [id], function (err, rows) {
        if (err) return done(err);
        if (rows.length) {
            console.log('existed user')
            return done(null, false, {
                message: 'your id is already used'
            })
        } else {
            console.log('id create')
            var email = "test37email@naver.com"
            var sql = {
                email,
                id,
                password
            }
            var query = connection.query('insert into user set ?', sql, function (err, rows) {
                if (err) throw err;
                console.log('rows id: ' + rows.insertId)
                return done(null, {
                    'email: ': email,
                    'id': rows.insertId
                });
            })
        }
    })
}))
// login use passport
passport.use('local-login', new LocalStrategy({
    usernameField: 'userId',
    passwordField: 'password',
    passReqToCallback: true
}, function (req, id, password, done) {
    console.log('local-login')
    console.log('id: ' + id)
    console.log('password: ' + password)
    var query = connection.query('select * from user where id=?', [id], function (err, rows) {
        if (err) return done(err);
        if (rows.length) {
            console.log('had id')
            console.log('id: ' + id)
            console.log('password: ' + password)
            var query = connection.query(
                'select * from user where id=? and password=?',
                [id, password],
                function (err, rows) {
                    if (err) {
                        console.log('The Password do not match')
                        return done(err);
                    } else if (rows.length === 0) {
                        // 0129 이 부분 다시 처리해야 함
                        // 조회 시 일치하는 게 없으면 err가 아닌 0을 반환
                        console.log(rows.length)
                        console.log('sever side login success!!')
                        console.log('rows[0]: ' + rows[0].email)
                        console.log('rows[0]: ' + rows[0].UID)
                        return done(null, {
                            'email': rows[0].email,
                            'id': rows[0].UID
                        });
                    }
                }
            )
        } else {
            console.log('id not found')
            return done(null, false, {
                'message': 'your login info is not found!!'
            })
        }
    })
}))
// GET routing
app.use('/', main)
app.use('/main', main)
app.use('/join', main)
app.use('/login', main)
app.use('/category', main)
app.use('/evaluate', main)

// GET /category/init
app.get('/category/init', function (req, res) {
    var query = connection.query('select * from video', function (err, rows) {
        if (err) throw err;
        var videoHour = parseInt(rows[0].runningtime / 60);
        var videoMinute = parseInt(rows[0].runningtime % 60);
        var runningtime = videoHour + "시간 " + videoMinute + "분";
        res.send({
            message: 'category success',
            video: rows,
            videoLength: rows.length
        })
    })
})

// GET /category/genre
app.get('/category/genre', function(req, res) {
    var query = connection.query('select * from video where tagGenre=?', req.query.genre, function (err, rows) {
        if (err) throw err;
        if(rows.length === 0) {
            console.log(req.query.genre+" 장르의 video가 없습니다")
        } else {
            res.send({
                message: 'categore/genre success',
                video: rows,
                videoLength: rows.length
            })
        }
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
    var query = connection.query('select id from user where id=?', [id], function (err, rows) {
        console.log('inside query')
        if (err) {
            console.log('err 발생')
            console.log('err: ' + err)
            res.send({
                errMsg: err
            })
        }
        if (rows.length >= 1) {
            console.log('id is already exists: ' + rows[0].id)
            res.send({
                existsMsg: 'id가 이미 존재합니다'
            })
            // /if
        } else {
            var sql = {
                email,
                id,
                password
            }
            console.log('======sql')
            console.log('======sql id: ' + sql.id)
            console.log('======sql email: ' + sql.email)
            console.log('======sql password: ' + sql.password)
            var sql = {
                email,
                id,
                password
            }
            var query = connection.query('insert into user set ?', sql, function (err, rows) {
                if (err) throw err;
                if (rows.insertId) {
                    console.log('join success!!!!')
                    console.log('rows id: ' + rows.insertId)
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
app.post('/login', function (req, res, next) {
    console.log('POST /login')
    console.log('id: ' + req.body.userId);
    console.log('password: ' + req.body.password);
    passport.authenticate('local-login', function (err, user, info) {
        if (err) res.status(500).json(err);
        if (!user) return res.status(401).json(info.message);

        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            console.log('req.logIn')
            console.log('getId: ' + user.id)
            return res.json(user);
        });
    })(req, res, next)
})

// POST /comment/write
app.post('/comment/write', function(req, res) {
    console.log('comment=====')
    console.log('작성자::: ', req.body.id)
    console.log('댓글 내용::: ', req.body.comment)
    var videoIndex = 52;
    var title = "아이언 맨 1";
    var writer = req.body.id;
    var comment = req.body.comment;
    var writeDate = "2018-01-01"
    var sql = {
        videoIndex,
        title,
        writer,
        comment,
        writeDate
    } 
    var query = connection.query('insert into comment set ?', sql, function (err, rows) {
        if (err) throw err;
        console.log("comment 성공!!!!")
    })
    res.send({
        message: "comment 등록 성공!!!!"
    })
})

// GET /comment/read
app.get('/comment/read', function(req, res) {
    console.log("/comment/read========")
    var query = connection.query('select * from comment ORDER BY commentIndex desc', function(err, rows) {
        if (err) throw err;
        console.log("comment 조회 성공!!!!") 
        if(rows) {
            console.log(rows)
        }
        res.send({
            totalComment: rows,
            commentCount: rows.length
        })
    })
})