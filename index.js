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
    console.log('4 passport session save :', user.id)
    done(null, user.id)
})

passport.deserializeUser(function (user, done) {
    console.log('===deserializeuser')
    console.log('passport session getId :', user)
    connection.query('select id from user where id=?', [user], function (err, user) {
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
    connection.query('select * from user where id=?', [id], function (err, rows) {
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
            connection.query('insert into user set ?', sql, function (err, rows) {
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
    console.log('2 passport inside')
    console.log('2 id: ' + id)
    console.log('2 password: ' + password)
    connection.query('select * from user where id=?', [id], function (err, rows) {
        if (err) return done(err);
        if (rows.length === 0) {
            return done(null, false, {
                'message': 'your login info is not found!!'
            })
        } else {
            console.log('3 ID가 일치합니다')
            console.log('3 id is', rows[0].id)
            console.log('3 password is:::: ',rows[0].password)
            return done(null, {
                'id': rows[0].id
            })
        }
    })
}))
// GET routing
app.use('/', main)
app.use('/profile', isLoggedIn, main)
app.use('/main', main)
app.use('/join', main)
app.use('/login', main)
app.use('/category', main)
app.use('/evaluate', main)
app.use('/favorite', main)


// GET /isLogin
app.get('/isLogin', function(req, res) {
    var idCookie = req.user;
    if(idCookie) {
        console.log('로그인 중입니다')
        console.log('user::: ', idCookie)
        res.send({'user': idCookie})
    } else {
        res.send({'message': '로그인 전입니다'})
    }
})

// GET /logout
app.get('/logout', function(req, res) {
    console.log('logout입니다요')
    req.logOut()
    res.redirect('/')
})

// GET /category/init
app.get('/category/init', function (req, res) {
    connection.query('select * from video', function (err, rows) {
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
    connection.query('select * from video where tagGenre=?', req.query.genre, function (err, rows) {
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

// GET /comment/read
app.get('/comment/read', function(req, res) {
    console.log("/comment/read========")
    connection.query('select * from comment ORDER BY commentIndex desc', function(err, rows) {
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


// POST /addFavorite
app.post('/addFavorite', function(req, res) {
    console.log('addFavorite=====')
    var userId = req.body.userId;
    var videoIndex = req.body.videoIndex;
    var sql = {
        userId,
        videoIndex,
    }
    // 회원가입과 유사하게 보고싶어요에 비디오가 이미 추가됐는지 확인 후 추가
    connection.query('select videoIndex from favorite where userId=?', userId, function(err, rows) {
        if (err) throw err;
        var msg = '';
        if(rows) {
            console.log('이미 보고싶어요에 있습니다')
            msg = '이미 보고싶어요에 있습니다';
        } else {
            connection.query('insert into favorite set ?', sql, function (err, rows) {
                if (err) throw err;
                console.log("favorite 성공!!!!")
                msg = 'favorite 등록 성공!!!!'
            })
        }
        res.send({
            message: msg
        })
    })
})

// GET /readFavorite
app.get('/readFavorite', function(req, res) {
    console.log("/readFavorite========")
    console.log("userId::: ",req.query.userId)
    var userId = req.query.userId;
    // 'SELECT * FROM video WHERE videoIndex=ANY(SELECT videoIndex FROM favorite WHERE userId=?)'
    var subQuery = 
    'SELECT * FROM video ' +
    'WHERE videoIndex=ANY' +
    '(SELECT videoIndex FROM favorite WHERE userId=?) '
    connection.query(subQuery, userId, function(err, rows) {
        if (err) throw err;
        if(rows) {
            console.log(rows)
        }
        res.send({
            message: 'readFavorite success!!!',
            favoriteVideo: rows
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
    connection.query('select id from user where id=?', [id], function (err, rows) {
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
            connection.query('insert into user set ?', sql, function (err, rows) {
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
    console.log('/login ======')
    console.log('1 id: ' + req.body.userId);
    console.log('1 password: ' + req.body.password);
    passport.authenticate('local-login', function (err, user, info) {
        if (err) res.status(500).json(err);
        if (!user) return res.status(401).json(info.message);

        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            console.log('5 req.logIn')
            console.log('5 getId: ' + user.id)
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
    connection.query('insert into comment set ?', sql, function (err, rows) {
        if (err) throw err;
        console.log("comment 성공!!!!")
    })
    res.send({
        message: "comment 등록 성공!!!!"
    })
})




