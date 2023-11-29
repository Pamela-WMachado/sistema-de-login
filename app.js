require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

const app = express();

app.use(express.json());

const User = require("./models/User")

// PRIVATE ROUTE

app.get("/user/:id", checkToken, async (req, res) => {

    const id = req.params.id;

    const user = await User.findById(id, "-password");

    if(!user) {
        return res.status(404).json({message: "Usuário não encontrado."});
    }

    res.status(200).json({ user })

})

function checkToken(req, res, next) {

    const authHeader = req.headers["authorization"];

    const token = authHeader && authHeader.split(" ")[1];

    if(!token) {
        return res.status(401).json({message: "Acesso negado."});
    }

    try {

        const secret = process.env.SECRET;

        jwt.verify(token, secret);

        next();

    } catch(error) {
        return res.status(400).json({message: "Token inválido."});

    }
}


// PUBLIC ROUTES
app.get("/", (req, res) => {
    res.status(200).json({message: 'API no ar.'})
});

app.post('/auth/register', async(req, res) => {

    const { name, email, password, confirmPassword } = req.body;

    if (!name) {
        return res.status(422).json({message: "Nome é obrigatório."});
    }

    if (!email) {
        return res.status(422).json({message: "Email é obrigatório."});
    }

    if (!password) {
        return res.status(422).json({message: "Senha é obrigatória."});
    }

    if (!confirmPassword || confirmPassword !== password ) {
        return res.status(422).json({message: "Senhas precisam ser iguais."});
    }

    const userExists = await User.findOne({ email: email});

    if (userExists) {
        return res.status(422).json({ message: "Email já cadastrado. Por favor, insira um email válido."})
    }

    const salt = await bcrypt.genSalt(12);

    const pwHash = await bcrypt.hash(password, salt);

    const user = new User({
        name,
        email,
        password: pwHash,
    })

    try {
        await user.save();

        res.status(200).json({message: "Usuário criado com sucesso."});

    } catch(error) {
        return res.status(500).json({message: error + "Falha no cadastro."});
    }

})


app.post("/auth/login", async (req, res) => {

    const { email, password } = req.body;

    if (!email) {
        return res.status(422).json({message: "Informe seu email."});
    }

    if (!password) {
        return res.status(422).json({message: "Informe sua senha."});
    }

    const user = await User.findOne({ email: email});

    if(!user) {
        return res.status(404).json({ message: "Usuário não encontrado."});
    }

    const checkPw = await bcrypt.compare(password, user.password);

    if (!checkPw) {
        return res.status(422).json({ message: "Senha incorreta."});
    }

    try {

        const secret = process.env.SECRET;

        //enviar o token para testá-lo
        const token = jwt.sign(
            {
                id: user._id,
            },
            secret,
        )
        res.status(200).json({message: "Autenticação realizada com sucesso.", token})

    } catch(err) {
        return res.status(500).json({message: "Não foi possível efetuar o login. Tente novamente."})
    }
})

//Credentials
const dbUser = process.env.DB_USER
const dbPW = process.env.DB_PASS


mongoose.connect(`mongodb+srv://${dbUser}:${dbPW}@cluster0.52fbwto.mongodb.net/?retryWrites=true&w=majority`).then(() => {
    app.listen(3000)
    console.log("Conectado ao banco.")
} ).catch((err) => console.log(err, "Erro ao conectar ao banco"))

app.listen(4000)