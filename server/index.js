// import things..
const express = require('express')
const app = express()
const path = require("path");
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./userDB.js');
const dbPost = require('./postDB.js');
const { register } = require('./userDB.js');
const session = require('express-session');
const { debug } = require('console');
const multer = require('multer');

/** 
const storage = multer.diskStorage({
    destination: '/public/img/imgPost',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))

    }
});
app.use(multer({
    dest: '/public/img/imgPost',
    storage
}).single('postPic'));
const upload = multer({
    storage
});
*/
app.set('views', path.join(__dirname, "s"))

// set cors policy
app.use(cors());
// path public
app.use(express.static(path.join(__dirname, 'public')));
// parse application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json

// session key
app.use(session({
    secret: 'jejetabien',
    resave: false,
    saveUninitialized: false
}));

app.use(bodyParser.json())
let userList = [];


// main endpoint..
app.get('/', function (req, res) {
    if (req.session.loggedUser) {
        res.redirect('/home');
    } else { res.sendFile(path.join(__dirname, "/public/index.html")); }

})

// home endpoint..
app.get('/home', function (req, res) {
    if (req.session.loggedUser) {
        dbPost.showPost((allPosts) => {
            allPosts.map(element => {
                element.path = `/exp/${element.Section}/${element._id}`;
            });

        });
    }
    else { res.redirect('/'); }
})

// post register
app.post('/register', function (req, res) {
    // Verificar si recibí los datos y validarlos
    if (!req.body) {
        res.status(400).send("No se recibieron bien los datos");
        return;
    } else {
        db.register(req.body.newPW, (bool, user) => {
            if (bool) {
                req.session.loggedUser = user;
                return res.status(200).json({
                    success: true,
                    redirect: "/home",
                    userid: req.session.loggedUser.userid
                    //  points: req.body.points
                });
            }
            else {
                req.session.message = {
                    success: false,
                    text: "Error al registrarse intentelo de nuevo"
                };
                res.redirect('/');
            }
        });

        //  res.status(200)
    }
})
// login post..
app.post('/login', function (req, res) {
    db.login(req.body.userid, req.body.password, result => {
        if (result) {
            req.session.loggedUser = result;
            return res.status(200).json({
                success: true,
                redirect: "/home"
            });
        } else {
            req.session.message = {
                class: "failure",
                text: "No se pudo iniciar la sesion"
            };
            res.redirect('/');
        }
    });

});

// post for pusblish incomplete..
app.post('/exp', function (req, res) {
    if (!req.body) {
        res.status(400).send("Error al publicar");
    } else {
        if (req.session.loggedUser) {
            req.body.userid = req.session.loggedUser.userid;
            req.body.rank = req.session.loggedUser.rank;
            dbPost.createPost(req.body, (bool, postid) => {
                if (bool) {
                    res.status(200).json({
                        success: true,
                        redirect: `/exp/${req.body.Section}/${postid}`
                    });
                } else {
                    req.session.message = {
                        class: "failure",
                        text: "No se pudo iniciar la sesion"
                    };
                }
            });
        } else { res.redirect('/'); }

    }
});

// filter posting endpoint..
app.get('/exp/:section/:postid?', function (req, res) {
    // if the section and the post id EXISTS render it..
    if (req.session.loggedUser) {
        if (req.params.section && req.params.postid) {
            return dbPost.getPost(req.params.postid, (postid, bool) => {
                console.log(postid.result.Section);


            })
        }

        if (req.params.section) {
            return dbPost.filterPost(req.params.section, (bool, postArray) => {
                if (bool) {
                    postArray.map(element => {
                        element.path = `/exp/${element.Section}/${element._id}`;
                    });

                } else {
                    req.session.message = {
                        class: "failure",
                        text: "No se pudo llegar"
                    };
                }
            });
        }
    } else {
        res.redirect('/');
    }
})

// coments post..
app.post('/exp/:section/:postid?'), function (req, res) {
    if (!req.body) {
        res.status(400).send("Error");
    } else {
        if (req.session.loggedUser) {
            console.log(req.body);
            dbPost.comment(req.body.commentTXT, (bool, comment)=>{

            });

        } else {
            req.session.message = {
                class: "failure",
                text: "No se pudo iniciar la sesion"
            };
        }
    }
}

/** 
// doesnt work yet..
app.post('/imgupload', function (req, res, cb) {
    upload(req, res, (err) => {
        if (err) { res.redirect('/home'); }
        else {
            console.log(req.file);
            res.redirect('/home');
        }
    });
    console.log(req.file);
    res.send('Archivo subido');
    // req.file is the `avatar` file
    // req.body will hold the text fields, if there were any
})
*/

// heroku port access..
app.set('port', process.env.PORT || 3000);
// Opening port..
app.listen(app.get('port'),()=> {
    console.log("Opening..");
})
