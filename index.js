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

// GET routing
app.use('/', main)
app.use('/profile', isLoggedIn, main)
app.use('/main', main)
app.use('/join', main)
app.use('/login', main)
app.use('/category', main)
app.use('/evaluate', main)
app.use('/favorite', main)



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
            connection.query('select * from user where id=? and password=?', [id, password], function(err, rows) {
                if (err) return done(err);
                if (rows.length === 0) {
                    console.log('3 비밀번호가 틀렸습니다')
                    return done(null, false, {
                        'message': 'Incorrect password'
                    })
                }
                if (rows.length === 1) {
                    return done(null, {
                        'message': 'welcome!!!',
                        'id': rows[0].id
                    })
                }
            })
        }
    })
}))



// GET /isLogin
app.get('/isLogin', function(req, res) {
    // sessionStorage의 값과 cookie의 값을 비교
    // 로그인 여부를 확인
    // session에 남아 있더라도 cookie에 없으면
    // 로그인 전으로 판정
    // client쪽에서 sessionStorage 파기
    var idSession = req.query.id
    var idCookie = req.user
    console.log('로그인 여부 확인=========')
    console.log('session ::: ',idSession)
    console.log('cookie ::: ', idCookie)
    
    if(idCookie) {
        if(idSession === idCookie[0].id) {
            // 값이 서로 같다면 로그인 '중'
            res.send({'user': idCookie})
        } else {
            // 값이 서로 다르다면 로그인 '전'
            res.send({'message': 'before login'})
        }
    }
})

// GET /logout
app.get('/logout', function(req, res) {
    console.log('logout입니다======')
    console.log('before::: ', req.user)
    req.logOut()
    console.log('after::: ', req.user)
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

// POST /CreateComment
app.post('/createComment', function(req, res) {
    console.log('CreateComment=====')
    // new Date()로 yyyy-mm-ddT...형식으로 되기에
    // 번거롭지만 year/month/day를 나눠 진행
    var year = new Date().getFullYear();
    var month = new Date().getMonth() + 1;
    var day = new Date().getDate();
    var videoIndex = req.body.videoIndex;
    var title = "아이언 맨 1";
    var writer = req.body.userId;
    var comment = req.body.comment;
    var writeDate = year + '-' + month + '-' + day
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
// GET /ReadComment
app.get('/ReadComment', function(req, res) {
    console.log("/ReadComment========")
    console.log(req.query.videoIndex)
    var videoindex = req.query.videoIndex
    var readCommentSQL = 'SELECT commentIndex, videoIndex, writer, comment, title, date_format(writeDate, "%y-%m-%d") as writeDate FROM comment WHERE videoIndex=? ORDER BY commentIndex desc;'
    // connection.query('select * from comment ORDER BY commentIndex desc', function(err, rows)
    connection.query(readCommentSQL, videoindex, function(err, rows) {
        if (err) throw err;
        if(rows) {
            console.log('조회 성공!!!')
            //console.log(rows)
        }
        res.send({
            comment: rows,
            commentCount: rows.length
        })
    })
})


// POST /addFavorite
app.post('/addFavorite', function(req, res) {
    console.log('addFavorite=====')
    console.log("userId::: ",req.body.userId)
    console.log("videoIndex::: ",req.body.videoIndex)
    var userId = req.body.userId;
    var videoIndex = Number(req.body.videoIndex);
    var sql = {
        userId,
        videoIndex,
    }
    var msg = ' ';
    // 보고싶어요에 비디오가 이미 추가됐는지 확인
    connection.query('select videoIndex from favorite where userId=?', userId, function(err, rows) {
        if (err) throw err;
        if(rows) {
            console.log('1::: ')
            // videoIndex를 이용한 '중복검사'
            for(var i=0; i<rows.length; i++) {
                console.log('2::: ')
                if(videoIndex === rows[i].videoIndex) {
                    console.log('3::: ')
                    msg = '이미 보고싶어요에 있습니다';   
                    break;
                }
            }
            console.log('4::: ', msg)
            // 보고싶어요에 비디오 중복이 없다면 보고싶어요에 '추가'
            if(msg === ' ') {
                console.log('favorite 등록===')
                connection.query('insert into favorite set ?', sql, function (err, rows) {
                    if (err) throw err;
                })
                msg = '보고싶어요에 등록하였습니다';
            }
                res.send({message: msg})    
        }
    })
})

// GET /readFavorite
app.get('/readFavorite', function(req, res) {
    console.log("/readFavorite========")
    console.log("userId::: ",req.query.userId)
    var userId = req.query.userId;
    // SELECT * FROM video WHERE videoIndex=ANY(SELECT videoIndex FROM favorite WHERE userId=?)
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

// POST /deleteFavorite
app.post('/deleteFavorite', function(req, res) {
    var userId = req.body.userId;
    var videoIndex = req.body.videoIndex;
    var confirmSQL = 'SELECT * FROM favorite WHERE userId=? and videoIndex=?';
    var deleteSQL = 'DELETE FROM favorite WHERE userId=? and videoIndex=?';
    // 보고싶어요에서 지우기 전에 DB에 있는지 확인하여 중복 수행 방지
    connection.query(confirmSQL, [userId, videoIndex], function(err, rows) {
        if (err) throw err;
        if (rows.length >= 1) {
            // DB에 있을 경우 삭제 진행
            connection.query(deleteSQL, [userId, videoIndex], function(err, rows) {
                if (err) throw err;
            })
        } else {
            // DB에 없을 경우 삭제 수행 X
            //console.log('DB에 없습니다')
        }
    })
    
})


// POST /join
app.post('/join', isNotLoggedIn, (req, res, next) => {
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






