require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

const app = express();

//configurando middleware para leitura de JSON -> sem ele, a aplicação não aceita json nas suas requisiçoes e respostas
app.use(express.json());

// Models
const User = require("./models/User")

app.get("/", (req, res) => {
    res.status(200).json({message: 'API no ar.'})
});

//Register User
//utilizando um função assíncrona pois alguns recursos dependem de um tempo de resposta
app.post('/auth/register', async(req, res) => {

    //recebendo dados pelo body da requisiçao
    const { name, email, password, confirmPassword } = req.body;

    //validation
    if (!name) {
        return res.status(422).json({message: "Nome é obrigatório."})
    }

    if (!email) {
        return res.status(422).json({message: "Email é obrigatório."})
    }

    if (!password) {
        return res.status(422).json({message: "Senha é obrigatória."})
    }

    if (!confirmPassword || confirmPassword !== password ) {
        return res.status(422).json({message: "Senhas precisam ser iguais."})
    }

    //check if user exists 
    //query do banco de dados
    //model nos concede a metodos do mongoose e podemos procurar no banco de dados se esse mail ja foi cadastrado
    const userExists = await User.findOne({ email: email});

    if (userExists) {
        return res.status(422).json({ message: "Email já cadastrado. Por favor, insira um email válido."})
    }

    //create pw -> add mais digitos a uma senha para torna-la mais segura
    const salt = await bcrypt.genSalt(12);
    //password hash baseada na senha que o user informa
    const pwHash = await bcrypt.hash(password, salt);

    //create user -> instancio uma nova classe utilizando a que importei (User)
    const user = new User({
        name,
        email,
        password,
    })

    try {
        await user.save();

        res.status(200).json({message: "Usuário criado com sucesso."})

    } catch(error) {
        res.status(500).json({message: error + "Falha no cadastro."})
    }

})

//Credentials
const dbUser = process.env.DB_USER
const dbPW = process.env.DB_PASS

//snipet que disponibiliza a aplicação somente após a conexão com o banco
//função connect do mongoose, passando o ip cadastrado
//              -> promise based -> then() sucesso catch() erro
mongoose.connect(`mongodb+srv://${dbUser}:${dbPW}@cluster0.52fbwto.mongodb.net/?retryWrites=true&w=majority`).then(() => {
    app.listen(3000)
    console.log("Conectado ao banco.")
} ).catch((err) => console.log(err, "Erro ao conectar ao banco"))

app.listen(4000)