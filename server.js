// Global Variabels
// ----------------
// ----------------
const adminUsername = `kalab`
// const adminPassword = "1234"
const adminPassword = `$2b$12$k8duacAXwkJDLGfIIyMxtOnQ9rgUz6xfKRisK6YDd4bWTRLzXmn6m`


// load packages
const express = require('express')
const sqlite3 = require('sqlite3')
const { engine } = require('express-handlebars')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const saltRounds = 12
const session = require('express-session')
const connectSqlite3 = require('connect-sqlite3')

// define constants and variables
const port = 8080
const app = express()

// database
const dbFile = 'Project-web-dev-sSQLite3.db'
const db = new sqlite3.Database(dbFile)


// define the view engine
app.engine('handlebars', engine({
    helpers: {
        eq(a, b) { return a == b }
    }
}))
app.set('view engine', 'handlebars')
app.set('views', './views')



// -------------------------------------------------------------------------------------
//  CITING CODE FROM CHATGPT 
// Code generated by ChatGPT - BEGIN
// (ChatGPT, 2024, "how to create a dynamic pagination system", https://chatgpt.com/)
// --------------------------------------------------------------------------------------
const Handlebars = require('handlebars');

// Helper för att subtrahera två värden
Handlebars.registerHelper('subtract', function (a, b) {
    return a - b;
});

// Helper för att addera två värden
Handlebars.registerHelper('add', function (a, b) {
    return a + b;
});

// Helper för att skapa ett intervall för sidor
Handlebars.registerHelper('range', function (start, end) {
    var result = [];
    for (var i = start; i <= end; i++) {
        result.push(i);
    }
    return result;
});

// Helper för 'greater than' (större än)
Handlebars.registerHelper('gt', function (a, b) {
    return a > b;
});

// Helper för 'equal to' (lika med)
Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
});

// Helper för 'less than' (mindre än)
Handlebars.registerHelper('lt', function (a, b) {
    return a < b;
});
// -------------------------------------
// Code generated by ChatGPT - END
// -------------------------------------

// SESSION
const SQLiteStore = connectSqlite3(session)

app.use(session({
    store: new SQLiteStore({ db: "session-db.db" }),
    "saveUninitialized": false,
    "resave": false,
    "secret": "This123Is@Another#456GreatSecret678%Sentence"
}))

// MIDDLEWARES

app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));
app.use(function (req, res, next) {
    console.log("Session passed to response locals ...")
    res.locals.session = req.session;
    next();
})
// ------------------------------------------------------------
// ROUTES
// ------------------------------------------------------------

// Home route
app.get('/', function (req, res) {
    const model = {
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin
    }
    console.log("---> Home Model: " + JSON.stringify(model))
    res.render('home.handlebars', model)
})
// About route
app.get('/about', function (req, res) {
    res.render('about.handlebars')
})

// Contact route
app.get('/contact', function (req, res) {
    res.render('contact.handlebars')
})

// ---------------------
// route for manage users
// ---------------------

// The route to see the users tabel
app.get('/users', function (req, res) {
    db.all("SELECT * FROM users ", (error, listofusers) => {//query to to get the users
        if (error) {
            console.log("ERROR", error) //error: display in terminal
        } else {
            model = { users: listofusers }
            res.render('users.handlebars', model)
        }
    })
})

//Route to get to form to make new users as admin 
app.get('/users/new', function (req, res) {
    if (req.session.isAdmin) {
        res.render('users-new.handlebars')
    } else {
        console.log("User is not admin, and is not allowed to delet")

        res.redirect('/')
console.log

    }
})

// to retrive and put in the new users in the tabel
app.post('/users/new', function (req, res) {
    if (req.session.isAdmin) {
        const name = req.body.name
        const username = req.body.userusername
        const password = req.body.uhashedpassword


        bcrypt.hash(password, saltRounds, function (err, hash) { //to hash the inputed users password
            if (err) {
                console.log("---> Error encrypting the password: ", err)
                return res.status(500).send("Error hashing the password")
            } else {
                db.run("INSERT INTO users (uname, uusername, uhashedpassword) VALUES (?,?,?)", [name, username, hash], (error) => {
                    if (error) {
                        console.log("ERROR", error)
                        res.redirect('/users')
                    } else {
                        console.log("Line added into the users tabel!")
                        res.redirect('/users')
                    }
                })

            }
        })
    } else {
        console.log("User is not admin, and is not allowed to delet")

        res.redirect('/')

    }
})

// to get the form to modify a exsitng user 
app.get('/users/modify/:userid', function (req, res) {
    if (req.session.isAdmin) {
        const id = req.params.userid
        db.get("SELECT * FROM users WHERE uid=?", [id], (error, theuser) => {
            if (error) {
                console.log("ERROR : ", error)
                res.redirect('/users')
            } else {
                model = { user: theuser }
                res.render('users-new.handlebars', model)
            }
        })
    } else {
        console.log("User is not admin, and is not allowed to delet")

        res.redirect('/')

    }
})

// The route to take the new inputs and add it to the table
app.post('/users/modify/:userid', function (req, res) {
    if (req.session.isAdmin) {
        const id = req.params.userid
        const name = req.body.name
        const username = req.body.userusername
        const password = req.body.uhashedpassword

        bcrypt.hash(password, saltRounds, function (err, hash) {
            if (err) {
                console.log("---> Error encrypting the password: ", err)
                return res.status(500).send("Error hashing the password")
            } else {
                db.run(`UPDATE users SET uname=?, uusername=?, uhashedpassword=? WHERE uid=?`, [name, username, hash, id], (error) => {
                    if (error) {
                        console.log("ERROR", error)
                        res.redirect('/users')
                    } else {
                        console.log("User updated succsefully!")
                        res.redirect('/users')
                    }
                })

            }
        })
    } else {
        console.log("User is not admin, and is not allowed to delet")

        res.redirect('/')

    }
})

// the route to delete a user
app.get('/users/delete/:userid', function (req, res) {
    if (req.session.isAdmin) {
        // console.log("project id is : " + JSON.stringify(req.params.projid))

        db.run("DELETE FROM users WHERE uid=?", [req.params.userid], (error, theuser) => {
            if (error) {
                console.log("ERROR : ", error)
            } else {
                console.log('the user ' + req.params.userid + ' has been deleted')
                res.redirect('/users')
            }
        })
    } else {
        console.log("User is not admin, and is not allowed to delet")

        res.redirect('/')

    }
})

// -------------------------------------------------------------------------------------
//  CITING CODE FROM CHATGPT 
// Code generated by ChatGPT - BEGIN
// (ChatGPT, 2024, "how to create a dynamic pagination system", https://chatgpt.com/)
// --------------------------------------------------------------------------------------
app.get('/projects', function (req, res) {
    const projectsPerPage = 3;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const offset = (page - 1) * projectsPerPage;

    // Retrive the total amout of projects to be abel to calculate the pages needed
    db.get("SELECT COUNT(*) as total FROM projects", (error, result) => {
        if (error) {
            console.log("ERROR fetching total projects:", error);
            res.redirect('/');
        } else {
            const totalProjects = result.total;
            const totalPages = Math.ceil(totalProjects / projectsPerPage);

            db.all("SELECT * FROM projects LIMIT ? OFFSET ?", [projectsPerPage, offset], (err, projects) => {
                if (err) {
                    console.log("ERROR fetching projects:", err);
                    res.redirect('/');
                } else {
                    const model = {
                        projects: projects,
                        currentPage: page,
                        totalPages: totalPages,
                        isAdmin: req.session.isAdmin
                    };
                    res.render('projects.handlebars', model);
                }
            });
        }
    });
});

// -------------------------------------
// Code generated by ChatGPT - END
// ------------------------------------- 

// Route to get to the form for new projects 
app.get('/project/new', function (req, res) {
    if (req.session.isAdmin) {
        res.render('project-new.handlebars')
    } else {
        console.log("User is not admin, and is not allowed to delet")

        res.redirect('/')

    }
})

// Route to get to the a singel project
app.get('/project/:projectid', function (req, res) {
    console.log("project id is : " + JSON.stringify(req.params.projectid))

    db.get("SELECT * FROM projects INNER JOIN users on projects.uid = users.uid WHERE pid=?", [req.params.projectid], (error, theProject) => {
        if (error) {
            console.log("ERROR : ", error)
        } else {
            const model = {
                project: theProject
            }
            res.render('project.handlebars', model)
        }
    })
})

//  To get to the form for modifying projects  
app.get('/project/modify/:projid', function (req, res) {
    if (req.session.isAdmin) {
        const id = req.params.projid
        db.get("SELECT * FROM projects WHERE pid=?", [id], (error, theProject) => {
            if (error) {
                console.log("ERROR : ", error)
                res.redirect('/projects')
            } else {
                model = { project: theProject }
                res.render('project-new.handlebars', model)
            }
        })
    } else {
        console.log("User is not admin, and is not allowed to delet")

        res.redirect('/')
    }
})

// The route to post the new and modify data in teh projects tabel  
app.post('/project/modify/:projid', function (req, res) {
    if (req.session.isAdmin) {
        const id = req.params.projid
        const name = req.body.projname
        const year = req.body.projyear
        const desc = req.body.projdesc
        const type = req.body.projtype
        const url = req.body.projurl
        const uid = req.body.projuid

        db.run(`UPDATE projects
        SET pname=?, 
        pyear=?,
        pdesc=?,
        ptype=?,
        pimgURL=?,
        uid=?
        WHERE pid=?`, [name, year, desc, type, url, uid, id], (error) => {
            if (error) {
                console.log("ERROR", error)
                res.redirect('/projects')
            } else {
                res.redirect('/projects')
            }
        })
    } else {
        console.log("User is not admin, and is not allowed to delet")

        res.redirect('/')
    }
})

// The route to delete a project 
app.get('/project/delete/:projid', function (req, res) {
    if (req.session.isAdmin) {
        // console.log("project id is : " + JSON.stringify(req.params.projid))

        db.run("DELETE FROM projects WHERE pid=?", [req.params.projid], (error, theProject) => {
            if (error) {
                console.log("ERROR : ", error)
            } else {
                console.log('the project ' + req.params.projid + 'has been deleted')
                res.redirect('/projects')
            }
        })
    } else {
        console.log("User is not admin, and is not allowed to delet")

        res.redirect('/')

    }
})

// The route to uppdating the project 
app.post('/project/new', function (req, res) {
    if (req.session.isAdmin) {
        const name = req.body.projname
        const year = req.body.projyear
        const desc = req.body.projdesc
        const type = req.body.projtype
        const url = req.body.projurl
        const uid = req.body.projuid

        db.run("INSERT INTO projects (pname, pyear, pdesc, ptype,pimgURL,uid) VALUES (?,?,?,?,?,?)", [name, year, desc, type, url, uid], (error) => {
            if (error) {
                console.log("ERROR", error)
                res.redirect('/projects')
            } else {
                console.log("Line added into the projects tabel!")
                res.redirect('/projects')
            }
        })
    } else {
        console.log("User is not admin, and is not allowed to delet")

        res.redirect('/')
    }
})

// the route to skills table 
app.get('/skills', function (req, res) {
    db.all("SELECT * FROM skills", (error, listofskills) => {
        if (error) {
            console.log("ERROR", error) //error: display in terminal
        } else {
            model = { skills: listofskills }
            res.render('skills.handlebars', model)
        }
    })
})

// The route to login page 
app.get('/login', function (req, res) {
    res.render('login.handlebars')
})

// The route to sign a user out and redirect to home 
app.get('/logout', function (req, res) {
    req.session.destroy((err) => {
        if (err) {
            console.log("Error while destroying the sesion : ", err)
        } else {
            console.log('Logged out ...')
            res.redirect('/')
        }
    })
})

// -------------------------------------
// Verfications step for login 
// -------------------------------------
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        const model = { error: "Username and password are required", message: "" };
        return res.status(400).render('login.handlebars', model);
    }

    // checking if its admin
    if (username === adminUsername) {
        console.log("The username is the admin one!");

        bcrypt.compare(password, adminPassword, (err, result) => {
            if (err) {
                const model = { error: "Error while comparing passwords: " + err, message: "" };
                res.render('login.handlebars', model);
            }
            if (result) {
                console.log("The password is the admin one!");

                req.session.isAdmin = true;
                req.session.isLoggedIn = true;
                req.session.name = username;
                console.log("Session information : " + JSON.stringify(req.session));

                return res.redirect("/");
            } else {
                const model = { error: "Sorry, the admin password is incorrect.", message: "" };
                return res.status(400).render('login.handlebars', model);
            }
        });
    } else {
        // cheking for regular users
        db.get("SELECT * FROM users WHERE uusername = ?", [username], (err, user) => {
            if (err) {
                const model = { error: "Database error: " + err, message: "" };
                return res.render('login.handlebars', model);
            }

            if (!user) {
                const model = { error: `Sorry, no user found with username ${username}`, message: "" };
                return res.status(400).render('login.handlebars', model);
            }

            // compare password if it existis in the database
            bcrypt.compare(password, user.uhashedpassword, (err, result) => {
                if (err) {
                    const model = { error: "Error while comparing passwords: " + err, message: "" };
                    return res.render('login.handlebars', model);
                }

                if (result) {
                    // password is correct for user 
                    req.session.isAdmin = false; // not a admin
                    req.session.isLoggedIn = true;
                    req.session.name = user.uname;
                    console.log("Session information : " + JSON.stringify(req.session));

                    return res.redirect("/");
                } else {
                    const model = { error: "Sorry, the password is incorrect.", message: "" };
                    return res.status(400).render('login.handlebars', model);
                }
            });
        });
    }
});

// -------------
// 404 NOT FOUND
// -------------
app.use(function(req,res){
    res.status(404).render('404.handlebars');
})

// Application to start listtening to my ports for thr http req
app.listen(port, function () {
    initTableSkills(db)
    initTableUsers(db)
    initTableProjects(db)

    console.log('Server up and running, listening on port ' + port + '...')
})

//------------------------
//USER FUNCTIONS for users
//------------------------
function initTableUsers(mydb) {
    // MODEL for useers
    const users = [
        { "id": "1", "name": "Joe Doe", "username": "joe1", "hashedpassword": "$2b$12$HX.o7A/XvKR4x4Ltcin1MOySqMtMP/yp0s8XAcgQovU6BCAzrs8hm" },
        { "id": "2", "name": "John Smith", "username": "john1", "hashedpassword": "$2b$12$TdTa5GqC4E1IVZXH1gaTJu3ycxvO/8Wi4vBkeNZ6dVFECgOfjsiq2" },
        { "id": "3", "name": "Sam Brown", "username": "sam1", "hashedpassword": "$2b$12$PBOAnnPbmhfE7F9rOPuSh.KxG2b0SaO27isTitzQ50O2cV2gDpd3C" },
        { "id": "4", "name": "Alex Green", "username": "alex1", "hashedpassword": "$2b$12$Goy6jIe95722rIo4CvIMWOz3mmt7mF9KpwAiZoYqc92ZMDZE5E72W" },
        { "id": "5", "name": "Jane Doe", "username": "jane1", "hashedpassword": "$2b$12$aUv6faSuzQoX.DY0pcO9tOvyRrRuw9aKU5DAdNoumFD81AQW3/Q02" }
    ]

    db.run("CREATE TABLE users(uid INTEGER PRIMARY KEY AUTOINCREMENT, uname TEXT NOT NULL, uusername TEXT NOT NULL, uhashedpassword TEXT NOT NULL)", (error) => {
        if (error) {
            console.log("ERROR: ", error)
        } else {
            console.log("-----> Table users created!")

            //insert users
            users.forEach((oneUser) => {
                db.run("INSERT INTO users (uid,uname,uusername,uhashedpassword ) VALUES(?,?,?,?)",
                    [oneUser.id, oneUser.name, oneUser.username, oneUser.hashedpassword], (error) => {
                        if (error) {
                            console.log("ERROR: ", error)
                        } else {
                            console.log("Line added into the users table")
                        }
                    })
            })
        }
    })
}
//-----------------------------
//USER FUNCTIONS  for projects
//-----------------------------
function initTableProjects(mydb) {

    // MODEL
    const projects = [
        {
            "id": "1",
            "name": "My first portfolio as a Software Developer student",
            "type": "Personal",
            "desc": "This project details the process of creating my first portfolio website as a software developer student. It includes the design choices, tools, and technologies I used, such as HTML, CSS, JavaScript, and a templating engine like Handlebars. The portfolio highlights my skills, projects, and the challenges I overcame in web development, as well as my journey in building a professional online presence.",
            "year": 2022,
            "url": "/img/webdev-bild.jpeg",
            "uid": "2"
        }
        ,
        {
            "id": "2",
            "name": "How I got my first bug bounty",
            "type": "Personal",
            "desc": "This project recounts my experience of finding and reporting my first security vulnerability in 2012. It details the steps I took to identify the bug, the tools I used to verify and exploit the vulnerability, and the process of submitting my findings to the company. This experience introduced me to the world of cybersecurity and sparked my interest in ethical hacking.",
            "year": 2012,
            "url": "/img/bug.jpeg",
            "uid": "3"
        }
        ,
        {
            "id": "3",
            "name": "Building my first music platform",
            "type": "Teaching",
            "desc": "This project involved building my first music streaming platform, where I guided others through the development process. The platform allowed users to upload, stream, and manage music tracks. I documented the steps in building the back-end using Node.js and Express, and creating a responsive front-end with React. The teaching component of this project focused on sharing my knowledge with others through tutorials and workshops.",
            "year": 2021,
            "url": "/img/music.jpeg",
            "uid": "1"
        }
        ,
        {
            "id": "4",
            "name": "Building a chat platform",
            "type": "Research",
            "desc": "This research project focused on developing a real-time chat platform in 2020. The platform enabled users to send and receive messages in real-time using technologies like WebSocket for communication and Node.js for the server-side logic. The research component involved exploring different communication protocols, ensuring low-latency message delivery, and implementing secure message encryption. This project helped deepen my understanding of scalable communication systems.",
            "year": 2020,
            "url": "/img/chat.png",
            "uid": "1"
        }
        ,
        {
            "id": "5",
            "name": "How to make the Snake game",
            "type": "Teaching",
            "desc": "In this teaching project, I guided others through building the classic Snake game in 2012. The project focused on using basic game development principles and programming techniques, including handling player input, creating movement logic, and implementing collision detection. I shared this knowledge through tutorials aimed at beginners to help them grasp fundamental concepts in game development.",
            "year": 2012,
            "url": "/img/snake.jpeg",
            "uid": "5"
        }
        ,
        {
            "id": "6",
            "name": "Website for JU University",
            "type": "Personal",
            "desc": "This personal project involved creating a website for JU University in 2013. The site was designed to provide students and faculty with easy access to academic resources, event updates, and course information. I focused on building a user-friendly interface using HTML, CSS, and JavaScript, and ensuring responsive design for various devices. This project allowed me to apply my web development skills to a real-world application.",
            "year": 2013,
            "url": "/img/ju.png",
            "uid": "4"
        }
        ,
        {
            "id": "7",
            "name": "Analyzing Social Media Trends",
            "type": "Research",
            "desc": "This research project focused on analyzing social media trends in 2019. I collected data from platforms like Twitter and Instagram to study user engagement patterns, trending topics, and sentiment analysis. The project helped me understand how to work with large datasets and apply basic data science techniques.",
            "year": 2019,
            "url": "/img/socialmedia.png",
            "uid": "2"
        },
        {
            "id": "8",
            "name": "Intro to Web Development Workshop",
            "type": "Teaching",
            "desc": "In this teaching project, I conducted a workshop in 2019 introducing beginners to web development. The workshop covered HTML, CSS, and basic JavaScript, and provided hands-on experience by guiding participants through building their first web page. The project allowed me to develop teaching skills and share foundational knowledge with others.",
            "year": 2019,
            "url": "/img/webdev-workshop.jpeg",
            "uid": "1"
        }
        ,
        {
            "id": "9",
            "name": "Improving Mobile App Usability",
            "type": "Research",
            "desc": "This research project in 2020 explored methods to improve the usability of mobile apps. I conducted user testing, analyzed user behavior, and proposed design improvements to enhance the overall user experience. The project involved collaborating with developers to implement changes and measure the impact on user satisfaction.",
            "year": 2020,
            "url": "/img/mobile.jpeg",
            "uid": "5"
        }
    ]

    db.run("CREATE TABLE projects (pid INTEGER PRIMARY KEY AUTOINCREMENT, pname TEXT NOT NULL, pyear INTEGER NOT NULL, pdesc TEXT NOT NULL, ptype TEXT NOT NULL, pimgURL,  uid INTEGER, FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE)", (error) => {
        if (error) {
            console.log("ERROR: ", error) //error display in the terminal
            console.log("ERROR: DET FUNKAR INTE ")
        } else {
            console.log("-----> Table projects created!") // no error, table, has been crated

            //insert skills
            projects.forEach((oneProject) => {
                db.run("INSERT INTO projects (pid, pname, pyear, pdesc, ptype, pimgURL,uid) VALUES(?,?,?,?,?,?,?)",
                    [oneProject.id, oneProject.name, oneProject.year, oneProject.desc, oneProject.type, oneProject.url, oneProject.uid], (error) => {
                        if (error) {
                            console.log("ERROR: ", error)
                        } else {
                            console.log("Line added into the projects table")
                        }
                    })
            })
        }
    })
}
//--------------------------
//USER FUNCTIONS  for skills 
//--------------------------
function initTableSkills(mydb) {
    // MODEL for skills
    const skills = [
        { "id": "1", "name": "C++", "type": "Programming language", "desc": "The fundamentals of programming with C++ language." },
        { "id": "2", "name": "CSS", "type": "Programming language", "desc": "Desinging websaites and such using CSS."},
        { "id": "3", "name": "HTML", "type": "Programming language", "desc": "Programmed with HTML for my first website."},
        { "id": "4", "name": "JSON", "type": "Programming language", "desc": "Created my first database query usin JSON."},
        { "id": "5", "name": "Javascript", "type": "Programming language", "desc": "Programming with Javascript on the client side for diffrent animations and such." },
        { "id": "6", "name": "SQL", "type": "Programming language", "desc": "Structured Query Language used for managing and querying relational databases."},
        { "id": "7", "name": "Python", "type": "Programming language", "desc": "A versatile language for data science, web development, and automation."},
    ]

    db.run("CREATE TABLE skills(sid INTEGER PRIMARY KEY AUTOINCREMENT, sname TEXT NOT NULL, sdesc TEXT NOT NULL, stype TEXT NOT NULL)", (error) => {
        if (error) {
            console.log("ERROR: ", error) //error display in the terminal
        } else {
            console.log("-----> Table skills created!") // no error, table, has been crated

            //insert skills
            skills.forEach((oneSkill) => {
                db.run("INSERT INTO skills (sid,sname,sdesc,stype) VALUES(?,?,?,?)",
                    [oneSkill.id, oneSkill.name, oneSkill.desc, oneSkill.type], (error) => {
                        if (error) {
                            console.log("ERROR: ", error)
                        } else {
                            console.log("Line added into the skills table")
                        }
                    })
            })
        }
    })
}