const e = require('express')
const express = require('express')
const app = express()
const sqlite3 = require('sqlite3')
const bcrypt = require("bcrypt")
app.use(express.json())

const port = 8000

let db = new sqlite3.Database('./db/news.db', (err) => {
    if (err) return console.log(err.message)
    console.log('connected to database')

})

db.run('CREATE TABLE chat(id INTEGER PRIMARY KEY ,author TEXT,content TEXT,date TEXT)', function (err) {
    if (err)
        return console.log(err.message)
    console.log('table created successfully')
})

app.post('/chat/post', (req, res) => {
    const data = req.body;
    author = data['author'];
    content = data['content'];
    date = data['date'];
    const maxMessages = 100;



    db.run('INSERT INTO chat(author,content,date) VALUES (?,?,?) ', [author, content, date], function (err) {
        if (err) {
            return console.log(err.message)
        }
        console.log(`A row has been inserted with rowid ${this.lastID}`)

        lastPostID = Math.max(data['id'], this.lastID - maxMessages);

        db.all(`SELECT * FROM chat WHERE ID > ${lastPostID}`, function (err, rows) {
            res.send(rows)
        })
    })
})

app.post('/chat', (req, res) => {
    lastPostID = req.body['id']
    db.all(`SELECT * FROM chat WHERE ID > ${lastPostID}`, function (err, rows) {
        res.send(rows)
    })
})



db.run('CREATE TABLE users(username TEXT,password TEXT)', function (err) {
    if (err)
        return console.log(err.message)
    console.log('table created successfully')
})

app.post('/users', async (req, res) => {

    const username = req.body.username
    const password = req.body.password

    db.get('SELECT * FROM users WHERE username = ?',[username], async (err, row) => {
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

    db.get('SELECT * FROM users WHERE username = ?',[username], async (err, row) => {
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
        } else   res.send("wrong username")


    })



})
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
