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
    res.send({
        message: 'category success',
        videoTest: [
            {
                image: 'lostnight.jpg',
                title: '사라진 밤',
                releaseYear: '2018',
                ratingAge: '15세',
                runningTime: '1시간 41분',
                synopsis: '아내 설희를 살해하고 완전범죄를 계획한 진한. 그런데 몇 시간 후, 국과수 사체 보관실에서 설희의 시체가 흔적도 없이 사라지고 진한에게는 문자 한 통이 도착한다.',
            },
            {
                image: 'Carribian.jpg',
                title: '캐리비안의 해적',
                releaseYear: '2007',
                ratingAge: '12세',
                runningTime: '2시간 48분',
                synopsis: '플라잉 더치맨 호와 데비 존스를 이용하여 해적을 소탕하고 다니는 동인도 회사에 맞서, 윌 터너와 엘리자베스 스완, 바르보사 선장은 해적 연맹을 소집한다.',
            },
            {
                image: 'starwars_7.jpg',
                title: '스타 워즈 에피소드 7',
                releaseYear: '2015',
                ratingAge: '12세',
                runningTime: '2시간 18분',
                synopsis: '다스 베이더가 사망한 지 약 30년 후, 마지막 제다이인 루크 스카이워커가 사라진다. 저항군의 파일럿 포는 루크가 있는 곳의 지도를 얻지만, 스톰트루퍼들에게 붙잡히고 만다.',
            },
            {
                image: 'yourname.jpg',
                title: '너의 이름은',
                releaseYear: '2018',
                ratingAge: '12세',
                runningTime: '1시간 46분',
                synopsis: '깊은 산골짜기 시골 마을에 사는 미츠하와 도쿄에 사는 타키. 만날 리 없던 두 사람은 어느 날 서로의 몸과 마음이 바뀐 신기한 꿈속에서 서로의 존재를 알게 된다.',
            },
            {
                image: 'iamsam.jpg',
                title: '아이 엠 샘',
                releaseYear: '2001',
                ratingAge: '12세',
                runningTime: '2시간 12분',
                synopsis: '일곱 살의 지능을 가진 샘은 딸 루시와 즐거운 나날을 보내고 있다. 그러나 루시가 일곱 살이 되자 사회 복지 기관 전문가가 샘이 루시를 부양할 수 있는지 검증이 필요하다며 끼어든다.',
            },
            {
                image: 'lordofthering3.jpg',
                title: '반지의 제왕:왕의 귀환',
                releaseYear: '2003',
                ratingAge: '12세',
                runningTime: '3시간 20분',
                synopsis: '간달프는 사우론의 군대와의 전투를 위해 흩어져 있던 병사들을 모은다. 그들은 중간계를 지키려는 사명감과 반지 운반자에게 임무를 끝낼 기회를 주기 위해 어둠의 군대를 향해 돌진한다.',
            },
            {
                image: 'benjamin.jpg',
                title: '벤자민 버튼의 시간은 거꾸로 간다',
                releaseYear: '2008',
                ratingAge: '12세',
                runningTime: '2시간 46분',
                synopsis: '80세의 외모로 태어나 부모에게 버려진 벤자민 버튼은 자신이 점점 젊어진다는 것을 알게 된다. 12살이 되어 60대의 외모가 된 어느 날, 소녀 데이지를 만나고 그녀를 잊지 못한다.',
            },
            {
                image: 'maninblack2.jpg',
                title: '맨 인 블랙 2',
                releaseYear: '2002',
                ratingAge: '12세',
                runningTime: '1시간 28분',
                synopsis: '외계인 셀리나에 의해 지구가 위기에 놓이게 되자, MIB 요원 J는 은퇴하면서 자신의 기억을 모두 지워버린 베테랑 요원 K를 찾아가 그의 기억을 복구시키고자 갖은 애를 쓴다.',
            },
            {
                image: 'bourneidentity.jpg',
                title: '본 아이덴티티',
                releaseYear: '2002',
                ratingAge: '12세',
                runningTime: '1시간 58분',
                synopsis: '이탈리아 어부들이 지중해 한 가운데에서 등에 두 발의 총상을 입은 채 표류하고 있는 한 남자(Jason Bourne: 맷 데이먼 분)를 구하게 된다. 그는 의식을 찾게 되지만 기억 상실증에 걸려 자신이 누구인지 조차 모른다. 그가 누구인지 알 수 있는 단서는 등에 입은 총상과 살 속에 숨겨져 있던 스위스 은행의 계좌번호 뿐...',
            },
            {
                image: 'lovestory.jpg',
                title: '시월애',
                releaseYear: '2000',
                ratingAge: '12세',
                runningTime: '1시간 36분',
                synopsis: '성현에게 2년 후로부터 온 이상한 편지가 도착하고, 그 내용들이 현실 속에 나타난다. 자신의 편지가 2년 전으로 갔다는 것을 믿게 된 은주는 그곳으로 편지를 보내기 시작한다.',
            },
        ],
        videoLength: 10
    })
})


// POST /join
app.post('/join', isNotLoggedIn, async (req, res, next) => {
    console.log('====POST /join')
    console.log('email: ', req.body.email)
    console.log('id: ', req.body.userId)
    console.log('password: ', req.body.password)
    var email = req.body.email;
    var id = req.body.userId;
    var password = req.body.password;
    console.log('비구조화 할당')
    console.log('email: ', email)
    console.log('id: ', id)
    console.log('password: ', password)
    var query = connection.query('select id from user where id=?', [id], function(err, res) {
        console.log('inside query')
        if(err) {
            console.log('err 발생')
            console.log('err: '+err)
            
        } else {
            var sql = {email, id, password}
            var query = connection.query('insert into user set ?', sql, function(err, rows) {
                if(err) throw err;
                if(rows[0]) {
                    console.log('join success!!!!')
                    console.log('rows id: '+rows.insertId)
                    console.log('rows id: '+rows[0].id)
                    console.log('rows id: '+rows[0].email)
                }
            })
        }
    })    
        
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


