const express = require("express")
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const sqlite3 = require('sqlite3')
const bcrypt = require("bcrypt")
const { json } = require('express')
app.use(express.json())
const port = process.env.PORT || 5000

let db = new sqlite3.Database('./db/news.db', (err) => {
    if (err) return console.log(err.message)
    console.log('connected to database')

})

db.run('CREATE TABLE chat(id INTEGER PRIMARY KEY ,author TEXT,content TEXT,date TEXT)', function (err) {
    if (err)
        return console.log(err.message)
    console.log('table created successfully')
})

io.on('connection', (socket) => {
    console.log("user connected")
    
    db.all(`SELECT * FROM chat`, function (err, rows) {
        if (err) return console.log(err.message)
        console.log(rows)
        socket.emit('connection', (rows))
    })

    socket.on('post', (data) => {
        console.log(data)
        const post = JSON.parse(data)
        console.log(data)
        db.run('INSERT INTO chat(author,content,date) VALUES (?,?,?) ', [post.author, post.content, post.date], function (err) {
            if (err) {
                return console.log(err.message)
            }
        })
        socket.emit('post', (data))
    })

})

db.run('CREATE TABLE users(username TEXT,password TEXT)', function (err) {
    if (err)
        return console.log(err.message)
    console.log('table created successfully')
})

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')


})

app.post('/users', async (req, res) => {

    const username = req.body.username
    const password = req.body.password

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
        if (err) console.log(err)
        if (row) return res.send("username is taken.")
        try {
            const hashedPassword = await bcrypt.hash(password, 10)
            db.run('INSERT INTO users(username,password) VALUES(?,?) ', [username, hashedPassword], (err) => {
                if (err) return res.send(err)

                res.send("success")
            })
        } catch (error) {
            return res.status(500).send()
        }



    })



})
app.post('/users/login', async (req, res) => {

    const username = req.body.username
    const password = req.body.password

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
        if (err) console.log(err)

        if (row) {
            try {

                if (await bcrypt.compare(password, row.password)) {
                    res.send('success')
                } else {
                    res.send("wrong password")
                }
            } catch (erorr) {
                res.status(500).send()
            }
        } else res.send("wrong username")


    })



})
http.listen(port, () => console.log(`Example app listening on port ${port}!`))
