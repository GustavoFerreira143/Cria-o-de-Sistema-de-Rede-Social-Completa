const express = require('express');
const session = require('express-session');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const clamd = require('clamdjs');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config();

const secretKey = process.env.SECRET_KEY;
const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const dbDatabase = process.env.DB_DATABASE

const saltRounds = 10;

const clamScanner = clamd.createScanner('localhost', 3310);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    // Cria o diretório se ele não existir
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  },
});

const upload = multer({ storage });


/*Conexão com Banco de Dados*/
const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: dbHost,      // Endereço do servidor MySQL
  user: dbUser,    // Usuário do MySQL
  password: dbPass,  // Senha do MySQL
  database: dbDatabase    // Nome do banco de dados
});

// Conectar ao banco de dados
connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('Conexão com o banco de dados estabelecida com sucesso!');
});

module.exports = connection;

/* Fim Conexão com Banco de Dados*/



const app = express();

app.get('/usuarios', (req, res) => {
  const sql = 'SELECT * FROM usuarios'; // Substitua pelo nome da sua tabela
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Erro ao executar consulta:', err);
      res.status(500).json({ error: 'Erro ao buscar usuários' });
      return;
    }
    res.json(results);
  });
});


// Configuraração do CORS para Autorizar o envio das requisições

const allowedOrigin = 'http://localhost:5173 ';
app.use(cors({
  origin: allowedOrigin,
  credentials: true, // Permitir cookies/sessões compartilhadas
}));


const SessionKey = process.env.SessionKey


// Configurar sessões de Autenticação de Usuário
app.use(session({
  secret: SessionKey,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 }, // Usar secure: true em produção com HTTPS
}));





// Configurar Body Parser para tratar JSON
const bodyParser = require('body-parser');

app.use(bodyParser.json());


// Função para criptografar os dados
function encryptData(data) {
  // Gerando um 'IV' (vetor de inicialização) aleatório
  const iv = crypto.randomBytes(16);

  // Criptografando os dados com AES-256-CBC
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Retorna o IV junto com a mensagem criptografada
  return iv.toString('hex') + ':' + encrypted;
}

// Função para descriptografar os dados
function decryptData(encryptedData) {
  // Divide o IV e o texto criptografado
  const [ivHex, encryptedText] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');

  // Descriptografando os dados com AES-256-CBC
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}




//--------------------------------------------------------------------------Cadastra Usuario----------------------------------------------------------------------------------------
// Rota para inserir um novo usuário

app.post('/usuarios', (usuario, res) => {
  let array = [];
  let arraynick = [];
  const { nome, email, senha, nick } = usuario.body;

  // Verifica se algum campo está vazio
  if (!nome || !email || !senha || !nick) {
    return res.status(400).json({ message: "Há campos não preenchidos", status: "400" });
  }

  // Remove espaços extras
  const nomeform = nome.trim();
  const emailform = email.trim();
  const senhaform = senha.trim();
  const nickform = nick.trim();

  // Verifica se os campos ultrapassam 100 caracteres
  if (nomeform.length > 100 || emailform.length > 100 || senhaform.length > 100 || nickform.length > 100) {
    return res.status(400).json({ message: "Os campos não podem ter mais de 100 caracteres", status: "400" });
  }

  const consulta = 'SELECT email, nickname FROM usuarios';
  connection.query(consulta, (err, resultado) => {
    if (err) {
      console.error('Erro ao buscar usuários:', err);
      return res.status(500).json({ message: 'Erro ao verificar usuários existentes' });
    }

    // Preenche arrays com emails e nicknames já cadastrados
    resultado.forEach(element => {
      array.push(element.email);
      arraynick.push(element.nickname);
    });

    // Verifica se email ou nickname já existem
    if (array.includes(emailform) || arraynick.includes(nickform)) {
      return res.status(400).json({ message: "O Email ou Nick de Usuário inserido já existe", status: "400" });
    }

    // Verifica se a senha tem pelo menos 6 caracteres
    if (senhaform.length <= 6) {
      return res.status(400).json({ message: "A senha precisa ter mais de 6 caracteres", status: "400" });
    }

    // Gera o hash da senha
    bcrypt.hash(senhaform, saltRounds, (err, hash) => {
      if (err) {
        console.error("Erro ao criar hash da senha:", err);
        return res.status(500).json({ message: "Erro ao processar a senha", status: "500" });
      }

      // Insere o usuário no banco com a senha criptografada
      const sql = 'INSERT INTO usuarios (nome, email, senha, nickname) VALUES (?, ?, ?, ?)';
      connection.query(sql, [nomeform, emailform, hash, nickform], (err, results) => {
        if (err) {
          console.error('Erro ao inserir usuário:', err);
          return res.status(500).json({ message: 'Erro ao inserir usuário, tente novamente', status: "500" });
        }
        return res.status(201).json({ message: 'Usuário inserido com sucesso!', status: "200" });
      });
    });
  });
});
//Fim da rota para inserir um novo usuário

//------------------------------------------------------------------------------Fim do Cadastro de Usuario-------------------------------------------------------------------------------


//---------------------------------------------------------------------------------Server de Audios--------------------------------------------------------------------------------------

// Configurar o diretório 'uploads' como estático
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//------------------------------------------------------------------------------Fazer Login de Usuario ----------------------------------------------------------------------------------

app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  // Consulta para verificar se o email/nickname existe no banco
  const consulta = 'SELECT * FROM usuarios WHERE email = ? OR nickname = ?';
  connection.query(consulta, [email, email], (err, resultado) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err);
      return res.status(500).json({ message: 'Erro ao verificar usuário' });
    }

    if (resultado.length === 0) {
      return res.status(400).json({ message: 'Email ou Senha Incorretos', status: '400' });
    }

    // Recupera a senha hash do banco
    const usuario = resultado[0];

    // Verifica se a senha fornecida corresponde ao hash da senha no banco
    bcrypt.compare(senha, usuario.senha, (err, isMatch) => {
      if (err) {
        console.error('Erro ao comparar senha:', err);
        return res.status(500).json({ message: 'Erro ao verificar senha' });
      }

      if (isMatch) {
        req.session.user = { email: usuario.email }; // Salva o usuário na sessão
        return res.json({ message: 'Usuário logado com sucesso!', status: '200' });
      } else {
        return res.status(400).json({ message: 'Email ou Senha Incorretos', status: '400' });
      }
    });
  });
});

//-----------------------------------------------------------------------------Fim Login de Usuario--------------------------------------------------------------------------------------

//------------------------------------------------------------------------Loga Em Paginas Protegidas----------------------------------------------------------------------------------

// Rota protegida (exige que o usuário esteja logado)
app.get('/protected', (req, res) => {
  let arrayemail = [];
  let arrayid = [];
  let TodosOsdados = {};

  if (req.session.user) {
    const consulta = `
      SELECT 
        id, 
        nome, 
        email, 
        nickname, 
        foto_perfil, 
        mensagem_bio,
        (SELECT COUNT(*) FROM seguiruser WHERE id_seguidor = usuarios.id) AS total_seguindo,
        (SELECT COUNT(*) FROM seguiruser WHERE id_seguindo = usuarios.id) AS total_seguidores
      FROM usuarios 
      WHERE email = ? OR nickname = ?`;

    connection.query(consulta, [req.session.user.email, req.session.user.email], (err, resultado) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        res.status(500).json({ message: 'Erro ao buscar usuário', status: '400' });
        return;
      }

      if (resultado.length === 0) {
        res.status(404).json({ message: 'Usuário não encontrado', status: '404' });
        return;
      }

      // Dados do usuário
      TodosOsdados = {
        id: resultado[0].id,
        nome: resultado[0].nome,
        email: resultado[0].email,
        nickname: resultado[0].nickname,
        foto_perfil: resultado[0].foto_perfil,
        link_foto: `http://localhost:3000/uploads/${resultado[0].foto_perfil}`,
        mensagem_bio: resultado[0].mensagem_bio,
        total_seguindo: resultado[0].total_seguindo,
        total_seguidores: resultado[0].total_seguidores
      };

      resultado.forEach(element => {
        if (element.nickname != null) {
          arrayemail.push(element.nickname);
        } else {
          arrayemail.push(element.nome);
        }
        arrayid.push(element.id);
      });

      res.json({
        message: arrayemail[0],
        status: '200',
        id: arrayid[0],
        dados: TodosOsdados
      });
    });
  } else {
    res.status(401).json({ message: 'Acesso negado. Faça login primeiro.', status: '400' });
  }
});

//-----------------------------------------------------------------------------Fim do loga em paginas protegidas ------------------------------------------------------------------------


//---------------------------------------------------------------------Carregar Contatos-0-----------------------------------------------------------------------------------------------

app.get('/protected/contatos', (req, res) => {
  if (req.session.user) {
    const userEmail = req.session.user.email;
    const consultaUsuario = 'SELECT id FROM usuarios WHERE email = ? OR nickname = ?';

    connection.query(consultaUsuario, [userEmail, userEmail], (err, users) => {
      if (err || users.length === 0) {
        console.error('Erro ao buscar usuário:', err);
        res.status(500).json({ message: 'Erro ao buscar usuário', status: '500' });
        return;
      }

      const userId = users[0].id;

      const query = `
      SELECT 
        u.id AS user_id,
        u.nome,
        u.nickname,
        u.foto_perfil,
        m.id_destinatario,
        m.id_remetente,
        m.Mensagem AS mensagem,
        m.Audio AS audio,
        m.imagem_videos AS imagemVideo,
        m.documentos AS documento,
        DATE_FORMAT(m.datahora, "%H:%i") AS hora_formatada,
        DATE_FORMAT(m.datahora, "%d/%m/%Y") AS data_formatada,
        DATE_FORMAT(m.datahora, "%H:%i:%s") AS hora_completa,
        CASE 
          WHEN m.id_remetente = ? THEN 'enviada'
          WHEN m.id_destinatario = ? THEN 'recebida'
          ELSE NULL 
        END AS tipo_mensagem,
        (
          SELECT 
            COUNT(*) 
          FROM 
            mensagens 
          WHERE 
            (id_remetente = u.id OR id_destinatario = u.id)
            AND (id_destinatario = ?)
            AND lido = FALSE
        ) AS mensagens_nao_lidas
      FROM 
        usuarios u
      LEFT JOIN 
        mensagens m 
      ON 
        (m.id_remetente = u.id OR m.id_destinatario = u.id)
        AND (m.id_remetente = ? OR m.id_destinatario = ?)
      WHERE 
        u.id != ?; `;

      connection.query(query, [userId, userId, userId, userId, userId, userId], (err, results) => {
        if (err) {
          console.error('Erro ao buscar contatos:', err);
          res.status(500).json({ message: 'Erro ao buscar contatos', status: '500' });
          return;
        }

        const contatos = {};
        results.forEach(row => {
          let documento = "";
          if (row.documento && row.documento.trim() != "") {
            const extFile = path.extname(row.documento); // Extensão do arquivo
            const baseNameFile = path.basename(row.documento, extFile); // Nome sem a extensão
            // Preserva os últimos 4 caracteres do nome do arquivo
            const modifiedBaseName = decryptData(baseNameFile);
            documento = modifiedBaseName;
          }

          if (!contatos[row.user_id]) {
            contatos[row.user_id] = {
              id: row.user_id,
              nome: row.nome,
              nickname: row.nickname,
              foto_perfil: `http://localhost:3000/uploads/${row.foto_perfil}`,
              mensagensNaoLidas: row.mensagens_nao_lidas,
              mensagensEnviadas: [],
              mensagensRecebidas: [],
            };
          }

          if (row.tipo_mensagem === 'enviada' && row.mensagem != "") {
            let mensagem = decryptData(row.mensagem)
            contatos[row.user_id].mensagensEnviadas.push({
              mensagem: mensagem,
              id_destinatario: row.id_destinatario,
              hora: row.hora_formatada,
              data: row.data_formatada,
              horacompleta: row.hora_completa,
              documentos: documento,
              imagemVideos: `http://localhost:3000/uploads/${row.imagemVideo}`,
              NomeExtesao: row.imagemVideo,

            });
          } else if (row.tipo_mensagem === 'recebida' && row.mensagem != "") {
            let mensagem = decryptData(row.mensagem)
            contatos[row.user_id].mensagensRecebidas.push({
              mensagem: mensagem,
              id_remetente: row.id_remetente,
              hora: row.hora_formatada,
              horacompleta: row.hora_completa,
              data: row.data_formatada,
              documentos: documento,
              imagemVideos: `http://localhost:3000/uploads/${row.imagemVideo}`,
              imagemVideos_Nome: row.imagemVideo,
            });
          }
          else if (row.tipo_mensagem === 'enviada' && row.audio) {
            let Audio = `http://localhost:3000/uploads/${row.audio}`
            contatos[row.user_id].mensagensRecebidas.push({
              Audio: Audio,
              id_remetente: row.id_remetente,
              hora: row.hora_formatada,
              horacompleta: row.hora_completa,
              data: row.data_formatada,
              documentos: documento,
              imagemVideos: `http://localhost:3000/uploads/${row.imagemVideo}`,
              imagemVideos_Nome: row.imagemVideo,
            });
          }
          else if (row.tipo_mensagem === 'recebida' && row.audio) {
            let Audio = `http://localhost:3000/uploads/${row.audio}`
            contatos[row.user_id].mensagensRecebidas.push({
              Audio: Audio,
              id_remetente: row.id_remetente,
              hora: row.hora_formatada,
              horacompleta: row.hora_completa,
              data: row.data_formatada,
              documentos: documento,
              imagemVideos: `http://localhost:3000/uploads/${row.imagemVideo}`,
              imagemVideos_Nome: row.imagemVideo,
            });
          }
          else if (row.tipo_mensagem === 'enviada') {
            contatos[row.user_id].mensagensEnviadas.push({
              id_destinatario: row.id_destinatario,
              hora: row.hora_formatada,
              horacompleta: row.hora_completa,
              data: row.data_formatada,
              documentos: documento,
              imagemVideos: `http://localhost:3000/uploads/${row.imagemVideo}`,
              imagemVideos_Nome: row.imagemVideo,

            });
          }
          else if (row.tipo_mensagem === 'recebida') {
            contatos[row.user_id].mensagensRecebidas.push({
              id_remetente: row.id_remetente,
              hora: row.hora_formatada,
              horacompleta: row.hora_completa,
              data: row.data_formatada,
              documentos: documento,
              imagemVideos: `http://localhost:3000/uploads/${row.imagemVideo}`,
              imagemVideos_Nome: row.imagemVideo,
            });
          }
        });

        const arrayContatos = Object.values(contatos);
        res.status(200).json({ contatos: arrayContatos, status: '200', userIdAtual: userId });
      });
    });
  } else {
    res.status(401).json({ message: 'Usuário não autenticado', status: '401' });
  }
});

//----------------------------------------------------------------------------Fim Carregar Contatos -------------------------------------------------------------------------------------

//---------------------------------------------------------------------------Carregar Mensagens -----------------------------------------------------------------------------------------
app.post('/protected/mensagem', (req, res) => {
  if (req.session.user) {
    const userEmail = req.session.user.email;
    const consultaUsuario = 'SELECT id FROM usuarios WHERE email = ? OR nickname = ?';

    connection.query(consultaUsuario, [userEmail, userEmail], (err, users) => {
      if (err || users.length === 0) {
        console.error('Erro ao buscar usuário:', err);
        res.status(500).json({ message: 'Erro ao buscar usuário', status: '500' });
        return;
      }

      const idUsuario = users[0].id;
      const { Destinatario } = req.body;

      const consulta = `
        SELECT id_destinatario, id_remetente, Mensagem, 
               DATE_FORMAT(datahora, "%d/%m/%Y") AS data_formatada, 
               DATE_FORMAT(datahora, "%H:%i") AS hora_formatada, 
               Respondendo, Audio, imagem_videos, documentos 
        FROM mensagens 
        WHERE (id_destinatario = ? AND id_remetente = ?) 
           OR (id_destinatario = ? AND id_remetente = ?)
      ;`;

      connection.query(consulta, [Destinatario, idUsuario, idUsuario, Destinatario], (err, resultado) => {
        if (err) {
          console.error('Erro ao buscar mensagens:', err);
          res.status(500).json({ message: 'Erro ao buscar mensagens', status: '500' });
          return;
        }

        const updatelido = `UPDATE mensagens SET lido = true WHERE id_destinatario = ?`;
        connection.query(updatelido, [idUsuario], (err, retorno) => {
          if (err) {
            console.error('Erro ao atualizar status de leitura:', err);
            res.status(500).json({ message: 'Erro ao atualizar status de leitura', status: '500' });
            return;
          }
        });

        const mensagensComMidia = resultado.map((mensagem) => {
          let mensagemDescriptografada = "";
          if (mensagem.Mensagem && mensagem.Mensagem !== "") {
            // Descriptografa a mensagem caso não esteja vazia
            mensagemDescriptografada = decryptData(mensagem.Mensagem);
          }

          let respondendoDescriptografado = "";
          if (mensagem.Respondendo && mensagem.Respondendo !== "") {
            // Descriptografa o campo respondendo caso não esteja vazio
            respondendoDescriptografado = decryptData(mensagem.Respondendo);
          }
          let DocumentoDescriptografado = ""
          if (mensagem.documentos && mensagem.documentos.trim() !== "") {
            const extFile = path.extname(mensagem.documentos); // Extensão do arquivo
            const baseNameFile = path.basename(mensagem.documentos, extFile); // Nome sem a extensão

            // Preserva os últimos 4 caracteres do nome do arquivo
            const modifiedBaseName = decryptData(baseNameFile);
            DocumentoDescriptografado = modifiedBaseName;
          }

          let link_doc = mensagem.documentos && mensagem.documentos.trim() !== ""
            ? mensagem.documentos.replace(/[^a-zA-Z0-9-_]/g, '')
            : ""; // Evita descriptografar mensagens vazias



          const audioUrl = mensagem.Audio
            ? `${req.protocol}://${req.get('host')}/uploads/${mensagem.Audio}`
            : null;

          const imagemVideosUrl = mensagem.imagem_videos
            ? `${req.protocol}://${req.get('host')}/uploads/${mensagem.imagem_videos}`
            : null;

          let documentosUrl = null;
          if (mensagem.documentos && mensagem.documentos.trim() !== "") {
            const extFile = path.extname(mensagem.documentos); // Extensão do arquivo
            const baseNameFile = path.basename(mensagem.documentos, extFile); // Nome sem a extensão

            // Preserva os últimos 4 caracteres do nome do arquivo
            const modifiedBaseName = baseNameFile.slice(0, -4).replace(/[^a-zA-Z0-9-_]/g, '') + baseNameFile.slice(-4);

            // Reconstruindo o nome final com a extensão
            link_doc = `${modifiedBaseName}${extFile}`;
            documentosUrl = `${req.protocol}://${req.get('host')}/uploads/${link_doc}`;
          }

          return {
            idDestinatario: mensagem.id_destinatario,
            idRemetente: mensagem.id_remetente,
            mensagem: mensagemDescriptografada, // Mensagem descriptografada
            respondendo: respondendoDescriptografado, // Resposta descriptografada
            data: mensagem.data_formatada,
            hora: mensagem.hora_formatada,
            NomeExtesao: mensagem.imagem_videos,
            audioUrl, // URL do áudio, se houver
            imagemVideosUrl, // URL da imagem ou vídeo, se houver
            documentosUrl, // URL do documento, se houver
            documentonome: DocumentoDescriptografado
          };
        });

        res.json({
          message: mensagensComMidia,
          status: '200',
          usuarioAtual: idUsuario
        });
      });
    });
  } else {
    res.status(401).json({ message: 'Não autorizado.', status: '401' });
  }
});
//---------------------------------------------------------------------------------Fim Carregar Mensagens -------------------------------------------------------------------------

//-----------------------------------------------------------------------------Recarregamento de Mensagens--------------------------------------------------------------------------
app.post('/protected/mensagemContato', (req, res) => {
  if (req.session.user) {
    const userEmail = req.session.user.email;
    const consultaUsuario = 'SELECT id FROM usuarios WHERE email = ? OR nickname = ?';

    connection.query(consultaUsuario, [userEmail, userEmail], (err, users) => {
      if (err || users.length === 0) {
        console.error('Erro ao buscar usuário:', err);
        res.status(500).json({ message: 'Erro ao buscar usuário', status: '500' });
        return;
      }

      const idUsuario = users[0].id;
      const { Destinatario } = req.body;

      const consulta = `
        SELECT id_destinatario, id_remetente, Mensagem, 
               DATE_FORMAT(datahora, "%d/%m/%Y") AS data_formatada, 
               DATE_FORMAT(datahora, "%H:%i") AS hora_formatada, 
               Respondendo, Audio, imagem_videos, documentos 
        FROM mensagens 
        WHERE (id_destinatario = ? AND id_remetente = ?) 
           OR (id_destinatario = ? AND id_remetente = ?)
      ;`;

      connection.query(consulta, [Destinatario, idUsuario, idUsuario, Destinatario], (err, resultado) => {
        if (err) {
          console.error('Erro ao buscar mensagens:', err);
          res.status(500).json({ message: 'Erro ao buscar mensagens', status: '500' });
          return;
        }

        const mensagensComMidia = resultado.map((mensagem) => {
          let mensagemDescriptografada = mensagem.Mensagem && mensagem.Mensagem.trim() !== ""
            ? decryptData(mensagem.Mensagem)
            : ""; // Evita descriptografar mensagens vazias
          let RespondendoDescriptografado = mensagem.Respondendo && mensagem.Respondendo.trim() !== ""
            ? decryptData(mensagem.Respondendo)
            : ""; // Evita descriptografar mensagens vazias
          let DocumentoDescriptografado = ""
          if (mensagem.documentos && mensagem.documentos.trim() !== "") {
            const extFile = path.extname(mensagem.documentos); // Extensão do arquivo
            const baseNameFile = path.basename(mensagem.documentos, extFile); // Nome sem a extensão

            // Preserva os últimos 4 caracteres do nome do arquivo
            const modifiedBaseName = decryptData(baseNameFile)

            DocumentoDescriptografado = modifiedBaseName;
          }
          let link_doc = mensagem.documentos && mensagem.documentos.trim() !== ""
            ? mensagem.documentos.replace(/[^a-zA-Z0-9-_]/g, '')
            : ""; // Evita descriptografar mensagens vazias


          const audioUrl = mensagem.Audio && mensagem.Audio.trim() !== ""
            ? `${req.protocol}://${req.get('host')}/uploads/${mensagem.Audio}`
            : null; // Evita erro se o campo de áudio for vazio

          const imagemVideosUrl = mensagem.imagem_videos && mensagem.imagem_videos.trim() !== ""
            ? `${req.protocol}://${req.get('host')}/uploads/${mensagem.imagem_videos}`
            : null; // Evita erro se imagem/vídeo for vazio

          // Verificando e formatando o link do documento
          let documentosUrl = null;
          if (mensagem.documentos && mensagem.documentos.trim() !== "") {
            const extFile = path.extname(mensagem.documentos); // Extensão do arquivo
            const baseNameFile = path.basename(mensagem.documentos, extFile); // Nome sem a extensão

            // Preserva os últimos 4 caracteres do nome do arquivo
            const modifiedBaseName = baseNameFile.slice(0, -4).replace(/[^a-zA-Z0-9-_]/g, '') + baseNameFile.slice(-4);

            // Reconstruindo o nome final com a extensão
            link_doc = `${modifiedBaseName}${extFile}`;
            documentosUrl = `${req.protocol}://${req.get('host')}/uploads/${link_doc}`;
          }

          return {
            idDestinatario: mensagem.id_destinatario,
            idRemetente: mensagem.id_remetente,
            mensagem: mensagemDescriptografada, // Mensagem descriptografada
            data: mensagem.data_formatada,
            hora: mensagem.hora_formatada,
            respondendo: RespondendoDescriptografado,
            NomeExtesao: mensagem.imagem_videos,
            audioUrl, // URL do áudio, se houver
            imagemVideosUrl, // URL da imagem ou vídeo, se houver
            documentosUrl, // URL do documento, se houver
            documentonome: DocumentoDescriptografado
          };
        });

        res.json({
          message: mensagensComMidia,
          status: '200',
          usuarioAtual: idUsuario
        });
      });
    });
  } else {
    res.status(401).json({ message: 'Não autorizado.', status: '401' });
  }
});



//----------------------------------------------------------------------------------Envia Mensagem----------------------------------------------------------------------------------

app.post('/protected/mensagem/enviar', (req, res) => {
  if (req.session.user) {
    let { Destinatario, Remetente, mensagem, respondendo } = req.body;
    mensagem = mensagem.trim();

    if (mensagem !== "" && mensagem !== undefined && mensagem !== null) {

      const now = new Date();

      // Adiciona o deslocamento de -3 horas para o horário de Brasília
      const offset = -3; // Horário de Brasília (UTC-3)
      const brDate = new Date(now.getTime() + offset * 60 * 60 * 1000);

      // Formata no padrão datetime (YYYY-MM-DD HH:MM:SS)
      const datetime = brDate.toISOString().slice(0, 19).replace('T', ' ');

      // Criptografa a mensagem antes de salvar no banco
      const mensagemCriptografada = encryptData(mensagem);

      // Criptografa o campo "respondendo" se não estiver vazio
      const respondendoCriptografado = respondendo ? encryptData(respondendo) : "";

      const consultaUsuario = 'INSERT INTO mensagens(id_destinatario, id_remetente, Mensagem, Respondendo, datahora) VALUES(?,?,?,?,?)';
      connection.query(consultaUsuario, [Destinatario, Remetente, mensagemCriptografada, respondendoCriptografado, datetime], (err, users) => {
        if (err || users.length === 0) {
          console.error('Erro ao inserir a mensagem:', err);
          res.status(500).json({ message: 'Erro ao inserir mensagem', status: '500' });
          return;
        }

        res.status(200).json({ status: '200' });
      });
    }
  } else {
    res.status(400).json({ message: 'Usuário não logado', status: '400' });
  }
});

//-------------------------------------------------------------------------------Fim Envia Mensagem--------------------------------------------------------------------------------------

//------------------------------------------------------------------------------Envia Mensagem de Audio--------------------------------------------------------------------------------

app.post('/protected/audio', upload.single('audio'), async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Não autorizado.' });
  }

  const { senderId, receiverId, Respondendo } = req.body;

  if (!senderId || !receiverId) {
    return res.status(400).json({ message: 'IDs do remetente ou destinatário estão ausentes.' });
  }

  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Nenhum arquivo foi enviado.' });
    }

    // Separa o nome do arquivo e a extensão
    const ext = path.extname(file.filename); // Exemplo: .ogg, .mp3
    const baseName = path.basename(file.filename, ext); // Nome sem a extensão

    // Criptografa apenas o nome do arquivo
    let encryptedBaseName = encryptData(baseName);

    // Remove caracteres inválidos do nome criptografado
    encryptedBaseName = encryptedBaseName.replace(/[^a-zA-Z0-9-_]/g, '');

    // Novo nome do arquivo com extensão preservada
    const encryptedFileName = `${encryptedBaseName}${ext}`;

    // Define o novo caminho do arquivo
    const oldPath = file.path;
    const newPath = path.join(path.dirname(oldPath), encryptedFileName);

    // Renomeia o arquivo
    fs.renameSync(oldPath, newPath);

    // Criptografa o campo "Respondendo" se não for vazio
    const encryptedRespondendo = Respondendo ? encryptData(Respondendo) : "";

    // Obtém a data e hora formatada para o Brasil
    const now = new Date();
    const offset = -3; // Horário de Brasília (UTC-3)
    const brDate = new Date(now.getTime() + offset * 60 * 60 * 1000);
    const datetime = brDate.toISOString().slice(0, 19).replace('T', ' ');

    // Insere o nome criptografado no banco de dados
    const consulta = `
      INSERT INTO mensagens(id_destinatario, id_remetente, Audio, Respondendo, datahora)
      VALUES (?, ?, ?, ?, ?)`;

    connection.query(consulta, [
      receiverId,
      senderId,
      encryptedFileName,
      encryptedRespondendo,
      datetime
    ], (err) => {
      if (err) {
        console.error('Erro ao inserir usuário:', err);
        return res.status(500).json({ message: 'Erro ao inserir usuário' });
      }
      res.json({ message: "Funciona", status: '200' });
    });

  } catch (error) {
    console.error('Erro ao processar o áudio:', error);
    res.status(500).json({ message: 'Erro ao processar o áudio.' });
  }
});
//-----------------------------------------------------------------------------Enviar Videos Imagens e Mensagem juntos-------------------------------------------------------------------

app.post('/protected/imgvideos', upload.single('file'), async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Não autorizado.' });
  }

  let { senderId, receiverId, Respondendo, message } = req.body;

  if (!message) {
    message = "";
  }

  if (!senderId || !receiverId) {
    return res.status(400).json({ message: 'IDs do remetente ou destinatário estão ausentes.' });
  }

  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Nenhum arquivo foi enviado.' });
    }

    // Verificação de tamanho máximo (100 MB)
    const maxFileSize = 100 * 1024 * 1024; // 100 MB em bytes
    if (file.size > maxFileSize) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ message: 'O arquivo excede o tamanho máximo permitido de 100MB.' });
    }

    // Verificar tipo de arquivo (apenas imagens e vídeos)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/mpeg', 'video/avi'];
    if (!allowedTypes.includes(file.mimetype)) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ message: 'Arquivo enviado não é do tipo permitido. Apenas imagens e vídeos são aceitos.' });
    }

    // Verificação de vírus com ClamAV
    const scanResult = await clamScanner.scanFile(file.path);
    if (scanResult.includes("FOUND")) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ message: 'Arquivo detectado como malicioso. Upload negado.' });
    }

    // Criptografa o nome do arquivo sem alterar a extensão
    const ext = path.extname(file.filename); // Exemplo: .mp4, .jpg
    const baseName = path.basename(file.filename, ext); // Nome sem a extensão
    let encryptedBaseName = encryptData(baseName);

    // Remove caracteres inválidos para evitar problemas no Windows
    encryptedBaseName = encryptedBaseName.replace(/[^a-zA-Z0-9-_]/g, '');

    // Novo nome do arquivo com a extensão original
    const encryptedFileName = `${encryptedBaseName}${ext}`;

    // Define o novo caminho do arquivo
    const oldPath = file.path;
    const newPath = path.join(path.dirname(oldPath), encryptedFileName);

    // Renomeia o arquivo no sistema
    fs.renameSync(oldPath, newPath);

    // Criptografa a mensagem antes de armazená-la
    const encryptedMessage = message ? encryptData(message) : "";

    // Criptografa o campo "Respondendo" se não for vazio
    const encryptedRespondendo = Respondendo ? encryptData(Respondendo) : "";

    // Data e hora no formato brasileiro
    const now = new Date();
    const offset = -3;
    const brDate = new Date(now.getTime() + offset * 60 * 60 * 1000);
    const datetime = brDate.toISOString().slice(0, 19).replace('T', ' ');

    // Insere os dados no banco
    const consulta = `
      INSERT INTO mensagens(id_destinatario, id_remetente, Mensagem, imagem_videos, Respondendo, datahora)
      VALUES (?, ?, ?, ?, ?, ?)`;

    connection.query(consulta, [
      receiverId,
      senderId,
      encryptedMessage,
      encryptedFileName,
      encryptedRespondendo,
      datetime
    ], (err) => {
      if (err) {
        console.error('Erro ao inserir usuário:', err);
        res.status(500).json({ message: 'Erro ao inserir usuário' });
        return;
      }
      res.json({ message: "Arquivo enviado com sucesso!", status: '200' });
    });

  } catch (error) {
    console.error('Erro ao processar o arquivo:', error);
    res.status(500).json({ message: 'Erro ao processar o upload: Nome do Arquivo muito Grande' });
  }
});



//-----------------------------------------------------------------------------------------Envia imagem ou video com Audio--------------------------------------------------------------

app.post('/protected/imgvideosaudio', upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]), async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Não autorizado.' });
  }

  const { senderId, receiverId, Respondendo } = req.body;
  const audioFile = req.files['audio'] ? req.files['audio'][0] : null;
  const file = req.files['file'] ? req.files['file'][0] : null;

  const maxFileSize = 100 * 1024 * 1024;

  if (audioFile && audioFile.size > maxFileSize) {
    fs.unlinkSync(audioFile.path);
    return res.status(400).json({ message: 'O arquivo de áudio excede o tamanho máximo permitido de 100MB.' });
  }

  if (file && file.size > maxFileSize) {
    fs.unlinkSync(file.path);
    return res.status(400).json({ message: 'O arquivo excede o tamanho máximo permitido de 100MB.' });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/mpeg', 'video/avi'];

  if (file && !allowedTypes.includes(file.mimetype)) {
    fs.unlinkSync(file.path);
    return res.status(400).json({ message: 'Arquivo enviado não é do tipo permitido. Apenas imagens e vídeos são aceitos.' });
  }

  try {
    if (audioFile) {
      const audioScanResult = await clamScanner.scanFile(audioFile.path);
      if (audioScanResult.includes("FOUND")) {
        fs.unlinkSync(audioFile.path);
        if (file) fs.unlinkSync(file.path);
        return res.status(400).json({ message: 'Arquivo de áudio detectado como malicioso. Upload negado.' });
      }
    }

    if (file) {
      const fileScanResult = await clamScanner.scanFile(file.path);
      if (fileScanResult.includes("FOUND")) {
        fs.unlinkSync(file.path);
        if (audioFile) fs.unlinkSync(audioFile.path);
        return res.status(400).json({ message: 'Arquivo detectado como malicioso. Upload negado.' });
      }
    }

    if (!senderId || !receiverId) {
      return res.status(400).json({ message: 'IDs do remetente ou destinatário estão ausentes.' });
    }

    if (!audioFile && !file) {
      return res.status(400).json({ message: 'Nenhum arquivo foi enviado.' });
    }

    // Criptografando os nomes dos arquivos mantendo a extensão original
    const encryptFileName = (fileObj) => {
      if (!fileObj) return null;
      const ext = path.extname(fileObj.filename);
      const baseName = path.basename(fileObj.filename, ext);
      let encryptedBaseName = encryptData(baseName);
      encryptedBaseName = encryptedBaseName.replace(/[^a-zA-Z0-9-_]/g, '');
      const encryptedFileName = `${encryptedBaseName}${ext}`;
      const newPath = path.join(path.dirname(fileObj.path), encryptedFileName);
      fs.renameSync(fileObj.path, newPath);
      return encryptedFileName;
    };

    const encryptedAudioFileName = encryptFileName(audioFile);
    const encryptedFileFileName = encryptFileName(file);

    // Criptografando o campo "Respondendo" se não for vazio
    const encryptedRespondendo = Respondendo ? encryptData(Respondendo) : "";

    // Data e hora no formato brasileiro
    const now = new Date();
    const offset = -3;
    const brDate = new Date(now.getTime() + offset * 60 * 60 * 1000);
    const datetime = brDate.toISOString().slice(0, 19).replace('T', ' ');

    const consulta = `
      INSERT INTO mensagens(
        id_destinatario, id_remetente, Audio, imagem_videos, Respondendo, datahora
      ) VALUES (?, ?, ?, ?, ?, ?)`;

    connection.query(consulta, [
      receiverId,
      senderId,
      encryptedAudioFileName,
      encryptedFileFileName,
      encryptedRespondendo,
      datetime,
    ], (err) => {
      if (err) {
        console.error('Erro ao inserir mensagem:', err);
        return res.status(500).json({ message: 'Erro ao inserir mensagem no banco de dados.' });
      }

      res.json({ message: 'Mensagem salva com sucesso.', status: '200' });
    });

  } catch (error) {
    console.error('Erro ao processar a mensagem:', error);
    res.status(500).json({ message: 'Erro ao processar o upload: Nome do Arquivo muito Grande' });
  }
});


//-------------------------------------------------------Upload de Documentos + Mensagem------------------------------------------------------------------------------

app.post('/protected/documentos', upload.single('file'), async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Não autorizado.' });
  }

  let { senderId, receiverId, Respondendo, message } = req.body;
  message = message || "";

  if (!senderId || !receiverId) {
    return res.status(400).json({ message: 'IDs do remetente ou destinatário estão ausentes.' });
  }
  const file = req.file;

  try {
    if (!file) {
      return res.status(400).json({ message: 'Nenhum arquivo foi enviado.' });
    }

    // Verificação do tamanho do arquivo (máximo 100 MB)
    const maxFileSize = 100 * 1024 * 1024; // 100 MB em bytes
    if (file.size > maxFileSize) {
      fs.unlinkSync(path.join(__dirname, 'uploads', file.filename)); // Apagar o arquivo do servidor
      return res.status(400).json({ message: 'O arquivo excede o tamanho máximo permitido de 100MB.' });
    }

    const filePath = path.join(__dirname, 'uploads', file.filename);

    // Verificação de vírus com ClamAV
    const scanResult = await clamScanner.scanFile(filePath);
    if (scanResult.includes("FOUND")) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'Arquivo detectado como malicioso. Upload negado.' });
    }

    // Se houver Respondendo, criptografa o nome do documento
    let encryptedRespondendo = Respondendo;
    if (Respondendo && Respondendo !== "") {
      encryptedRespondendo = encryptData(encryptedRespondendo);
    }

    // Criptografando o nome do arquivo enviado

    const encryptFileName = (fileObj) => {
      if (!fileObj) return null;
      const ext = path.extname(fileObj.filename);
      const baseName = path.basename(fileObj.filename, ext);
      let encryptedBaseName = encryptData(baseName);
      let encryptedFileName = encryptedBaseName.replace(/[^a-zA-Z0-9-_]/g, '');
      encryptedFileName = `${encryptedFileName}${ext}`;
      encryptedBaseName = `${encryptedBaseName}${ext}`;
      const newPath = path.join(path.dirname(fileObj.path), encryptedFileName);
      fs.renameSync(fileObj.path, newPath);
      return encryptedBaseName;
    };
    if (file) {
      encryptedBaseNameFile = encryptFileName(file);
    }

    // Se houver mensagem, criptografa o conteúdo
    let encryptedMessage = message;
    if (message && message !== "") {
      encryptedMessage = encryptData(message);
    }

    // Se o arquivo for seguro, salvar no banco de dados
    const now = new Date();
    const offset = -3; // Horário de Brasília (UTC-3)
    const brDate = new Date(now.getTime() + offset * 60 * 60 * 1000);
    const datetime = brDate.toISOString().slice(0, 19).replace('T', ' ');

    const consulta = 'INSERT INTO mensagens(id_destinatario, id_remetente, Mensagem, documentos, Respondendo, datahora) VALUES (?, ?, ?, ?, ?, ?)';

    connection.query(consulta, [receiverId, senderId, encryptedMessage, encryptedBaseNameFile, encryptedRespondendo, datetime], (err) => {
      if (err) {
        console.error('Erro ao inserir no banco:', err);
        return res.status(500).json({ message: 'Erro ao inserir no banco de dados' });
      }
      res.json({ message: "Arquivo enviado com sucesso!", status: '200' });
    });

  } catch (error) {
    // Em caso de erro, apaga o arquivo e retorna um erro genérico
    const filePath = path.join(__dirname, 'uploads', file.filename);
    fs.unlinkSync(filePath);
    console.error('Erro ao processar o upload:');
    res.status(500).json({ message: 'Erro ao processar o upload: Nome do Arquivo muito Grande' });
  }
});

//-----------------------------------------------------------------------------Envio de Audio e Documentos--------------------------------------------------------------------------

app.post('/protected/documentosAudio', upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]), async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Não autorizado.' });
  }

  const { senderId, receiverId, Respondendo } = req.body; // IDs do remetente e destinatário
  const audioFile = req.files['audio'] ? req.files['audio'][0] : null;
  const file = req.files['file'] ? req.files['file'][0] : null;

  // Verificação de tamanho máximo de arquivo (100 MB)
  const maxFileSize = 100 * 1024 * 1024; // 100 MB em bytes

  if (audioFile && audioFile.size > maxFileSize) {
    fs.unlinkSync(path.join(__dirname, 'uploads', audioFile.filename)); // Apaga o arquivo
    return res.status(400).json({ message: 'O arquivo de áudio excede o tamanho máximo permitido de 100MB.' });
  }

  if (file && file.size > maxFileSize) {
    fs.unlinkSync(path.join(__dirname, 'uploads', file.filename)); // Apaga o arquivo
    return res.status(400).json({ message: 'O arquivo excede o tamanho máximo permitido de 100MB.' });
  }

  let audioPath = audioFile ? path.join(__dirname, 'uploads', audioFile.filename) : null;
  let filePath = file ? path.join(__dirname, 'uploads', file.filename) : null;

  try {
    // Verificação de vírus com ClamAV
    if (audioPath) {
      const audioScanResult = await clamScanner.scanFile(audioPath);
      if (audioScanResult.includes("FOUND")) {
        fs.unlinkSync(audioPath);
        fs.unlinkSync(filePath); // Se o arquivo de áudio for malicioso, apaga também o outro arquivo
        return res.status(400).json({ message: 'Arquivo de áudio detectado como malicioso. Upload negado.' });
      }
    }

    if (filePath) {
      const fileScanResult = await clamScanner.scanFile(filePath);
      if (fileScanResult.includes("FOUND")) {
        fs.unlinkSync(filePath);
        fs.unlinkSync(audioPath); // Se o arquivo for malicioso, apaga também o arquivo de áudio
        return res.status(400).json({ message: 'Arquivo detectado como malicioso. Upload negado.' });
      }
    }

    // Validar se os IDs foram enviados
    if (!senderId || !receiverId) {
      return res.status(400).json({ message: 'IDs do remetente ou destinatário estão ausentes.' });
    }

    if (!audioFile && !file) {
      return res.status(400).json({ message: 'Nenhum arquivo foi enviado.' });
    }

    // Se houver Respondendo, criptografa o nome do arquivo
    let encryptedRespondendo = Respondendo;
    if (Respondendo && Respondendo !== "") {
      encryptedRespondendo = encryptData(encryptedRespondendo);
    }

    // Criptografando os nomes dos arquivos de áudio e documento, preservando as extensões

    const encryptFileName = (fileObj) => {
      if (!fileObj) return null;
      const ext = path.extname(fileObj.filename);
      const baseName = path.basename(fileObj.filename, ext);
      let encryptedBaseName = encryptData(baseName);
      let encryptedFileName = encryptedBaseName.replace(/[^a-zA-Z0-9-_]/g, '');
      encryptedFileName = `${encryptedFileName}${ext}`;
      encryptedBaseName = `${encryptedBaseName}${ext}`;
      const newPath = path.join(path.dirname(fileObj.path), encryptedFileName);
      fs.renameSync(fileObj.path, newPath);
      filePath = newPath
      return encryptedBaseName;
    };
    const encryptAudioName = (fileObj) => {
      if (!fileObj) return null;
      const ext = path.extname(fileObj.filename);
      const baseName = path.basename(fileObj.filename, ext);
      let encryptedBaseName = encryptData(baseName);
      encryptedBaseName = encryptedBaseName.replace(/[^a-zA-Z0-9-_]/g, '');
      const encryptedFileName = `${encryptedBaseName}${ext}`;
      const newPath = path.join(path.dirname(fileObj.path), encryptedFileName);
      fs.renameSync(fileObj.path, newPath);
      audioPath = newPath
      return encryptedFileName;
    };
    let encryptedAudioFilename = null;

    if (audioFile) {
      encryptedAudioFilename = encryptAudioName(audioFile)
    }

    if (file) {
      encryptedBaseNameFile = encryptFileName(file);
    }

    // Preparando a data para inserção no banco
    const now = new Date();
    const offset = -3; // Horário de Brasília (UTC-3)
    const brDate = new Date(now.getTime() + offset * 60 * 60 * 1000);
    const datetime = brDate.toISOString().slice(0, 19).replace('T', ' ');

    // Inserir no banco de dados
    const consulta = `INSERT INTO mensagens(
      id_destinatario, id_remetente, Audio, documentos, Respondendo, datahora
    ) VALUES (?, ?, ?, ?, ?, ?)`;

    connection.query(consulta, [
      receiverId,
      senderId,
      encryptedAudioFilename || null,
      encryptedBaseNameFile || null,
      encryptedRespondendo || "",
      datetime,
    ], (err) => {
      if (err) {
        console.error('Erro ao inserir no banco:', err);
        return res.status(500).json({ message: 'Erro ao inserir mensagem no banco de dados.' });
      }
      res.json({ message: 'Mensagem salva com sucesso.', status: '200' });
    });

  } catch (error) {



    // Em caso de erro, apaga os arquivos e retorna o erro
    if (audioPath) fs.unlinkSync(audioPath);
    if (filePath) fs.unlinkSync(filePath);

    console.error('Erro ao processar o upload: Nome do Arquivo muito Grande');
    res.status(500).json({ message: 'Erro ao processar o upload: Nome do Arquivo muito Grande' });
  }
});


//----------------------------------------------------------------------Adicionar Foto Perfil------------------------------------------------------------------------------------------


app.post('/protected/envio/fotoPerfil', upload.single('image'), (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Usuário não autorizado.' });
  }

  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Nenhum arquivo foi enviado.' });
    }

    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const fileName = file.filename;
    const filePath = `./uploads/${fileName}`; // Caminho completo do arquivo

    // Verificar extensão manualmente (validação adicional)
    if (!allowedExtensions.includes(fileExtension)) {
      // Excluir o arquivo manualmente, já que ele foi salvo pelo `multer`
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Erro ao excluir arquivo inválido:', err);
        }
      });
      return res.status(400).send('Tipo de arquivo inválido.');
    }

    const consultaFoto = 'SELECT foto_perfil FROM usuarios WHERE email = ? OR nickname = ?';

    // Buscar a foto antiga no banco de dados
    connection.query(
      consultaFoto,
      [req.session.user.email, req.session.user.email],
      (err, result) => {
        if (err) {
          console.error('Erro ao buscar foto antiga:', err);
          return res.status(500).json({ message: 'Erro ao processar a solicitação.' });
        }

        const fotoAntiga = result[0]?.foto_perfil; // Foto anterior do banco
        if (fotoAntiga) {
          const caminhoFotoAntiga = `./uploads/${fotoAntiga}`;

          // Verificar se a foto existe e apagá-la
          fs.unlink(caminhoFotoAntiga, (err) => {
            if (err && err.code !== 'ENOENT') {
              console.error('Erro ao apagar foto antiga:', err);
            }
          });
        }

        // Atualizar o banco de dados com a nova foto
        const consultaAtualizar = 'UPDATE usuarios SET foto_perfil = ? WHERE email = ? OR nickname = ?';

        connection.query(
          consultaAtualizar,
          [fileName, req.session.user.email, req.session.user.email],
          (err, resultado) => {
            if (err) {
              console.error('Erro ao atualizar usuário:', err);
              return res.status(500).json({ message: 'Erro ao atualizar a foto de perfil.' });
            }

            // Confirmar a atualização
            if (resultado.affectedRows > 0) {
              return res.status(200).json({ message: 'Foto de perfil atualizada com sucesso.', filePath });
            } else {
              return res.status(404).json({ message: 'Usuário não encontrado.' });
            }
          }
        );
      }
    );
  } catch (err) {
    console.error('Erro interno:', err);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});



//------------------------------------------------------------------------Funcao Troca Nick---------------------------------------------------------------------------------------------

app.post('/protected/TrocaNick', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Usuário não autorizado.' });
  }

  const { NickNovo } = req.body;

  // Verificar se o NickNovo foi enviado
  if (!NickNovo || NickNovo.trim() === "") {
    return res.status(400).json({ message: 'Nickname inválido.' });
  }

  // Verificar se o novo nickname já existe no banco de dados
  const consultaNickExistente = 'SELECT COUNT(*) AS count FROM usuarios WHERE nickname = ?';
  connection.query(consultaNickExistente, [NickNovo], (err, resultado) => {
    if (err) {
      console.error('Erro ao verificar nickname existente:', err);
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }

    const nickExistente = resultado[0].count > 0;

    if (nickExistente) {
      return res.status(409).json({ message: 'Este nickname já está em uso. Por favor, escolha outro.', status: 400 });
    }

    // Atualizar o nickname no banco de dados
    const consultaAtualizarNick = 'UPDATE usuarios SET nickname = ? WHERE email = ? OR nickname = ?';
    connection.query(
      consultaAtualizarNick,
      [NickNovo, req.session.user.email, req.session.user.email],
      (err, resultadoAtualizacao) => {
        if (err) {
          console.error('Erro ao atualizar o nickname:', err);
          return res.status(500).json({ message: 'Erro ao atualizar o nickname.' });
        }

        if (resultadoAtualizacao.affectedRows > 0) {
          return res.status(200).json({ message: 'Nickname atualizado com sucesso.' });
        } else {
          return res.status(400).json({ message: 'Usuário não encontrado.' });
        }
      }
    );
  });
});

//--------------------------------------------------------------------Adicionar ou Trocar Bio------------------------------------------------------------------------------------------

app.post('/protected/AddTrocaBio', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Usuário não autorizado.' });
  }

  const { BioNova } = req.body;

  const consultaAtualizarNick = 'UPDATE usuarios SET mensagem_bio = ? WHERE email = ? OR nickname = ?';
  connection.query(
    consultaAtualizarNick,
    [BioNova, req.session.user.email, req.session.user.email],
    (err, resultadoAtualizacao) => {
      if (err) {
        console.error('Erro ao atualizar o nickname:', err);
        return res.status(500).json({ message: 'Erro ao atualizar o Bio.' });
      }

      if (resultadoAtualizacao.affectedRows > 0) {

        return res.status(200).json({ message: 'Bio atualizado com sucesso.', status: 200 });
      } else {
        return res.status(400).json({ message: 'Usuário não encontrado.', status: 400 });
      }
    }
  );
});

//-----------------------------------------------------------------------Adicionar Publicação-------------------------------------------------------------------------------------------


app.post('/protected/AddPubli', upload.single('media'), async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Usuário não autorizado.' });
  }

  try {
    const file = req.file;
    const { id, comment, HashTags } = req.body;

    // Validação do arquivo
    if (!file) {
      return res.status(400).json({ message: 'Nenhum arquivo foi enviado.' });
    }

    // Verificação de tipo de arquivo permitido
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ message: 'Tipo de arquivo inválido.' });
    }

    // Verificação de tamanho máximo do arquivo (100 MB)
    const maxFileSize = 100 * 1024 * 1024; // 100 MB em bytes
    if (file.size > maxFileSize) {
      fs.unlinkSync(path.join(__dirname, 'uploads', file.filename)); // Apaga o arquivo
      return res.status(400).json({ message: 'O arquivo excede o tamanho máximo permitido de 100MB.' });
    }

    // Verificação de vírus com ClamAV
    const filePath = path.join(__dirname, 'uploads', file.filename);
    const scanResult = await clamScanner.scanFile(filePath);

    if (scanResult.includes("FOUND")) {
      fs.unlinkSync(filePath); // Apaga o arquivo detectado como malicioso
      return res.status(400).json({ message: 'Arquivo detectado como malicioso. Upload negado.' });
    }

    const now = new Date();
    const offset = -3; // Horário de Brasília (UTC-3)
    const brDate = new Date(now.getTime() + offset * 60 * 60 * 1000);
    const datetime = brDate.toISOString().slice(0, 19).replace('T', ' ');

    // Nome do arquivo salvo
    const fileName = file.filename;

    // Inserindo publicação no banco
    const query = `
      INSERT INTO publicacao (user_autor, Conteudo_Publicacao, Comentario_Author, data_de_envio)
      VALUES (?, ?, ?, ?)
    `;

    connection.query(query, [id, fileName, comment, datetime], (err, result) => {
      if (err) {
        console.error('Erro ao inserir publicação no banco:', err);
        return res.status(500).json({ message: 'Erro ao salvar publicação no banco de dados.' });
      }

      const idPubli = result.insertId; // ID da publicação recém-criada

      // Processar hashtags
      try {
        const temas = JSON.parse(HashTags); // Converte de volta para array
        if (Array.isArray(temas) && temas.length > 0) {
          const insertHashtags = 'INSERT INTO hashtags (id_publi_referente, hashtag_adicionada) VALUES ?';

          const valores = temas.slice(0, 4).map(tag => [idPubli, tag]); // Insere no máximo 4 hashtags

          connection.query(insertHashtags, [valores], (err) => {
            if (err) {
              console.error('Erro ao inserir hashtags:', err);
              return res.status(500).json({ message: 'Erro ao salvar hashtags no banco de dados.' });
            }

            res.status(200).json({ message: 'Publicação enviada com sucesso.', status: 200 });
          });
        } else {
          res.status(200).json({ message: 'Publicação enviada, mas nenhuma hashtag foi incluída.', status: 200 });
        }
      } catch (error) {
        console.error('Erro ao processar hashtags:', error);
        res.status(500).json({ message: 'Erro ao processar hashtags.' });
      }
    });
  } catch (error) {
    console.error('Erro na requisição:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

//--------------------------------------------------------------------Envia Publi Usuario----------------------------------------------------------------------------------------------

app.get('/protected/EnviaPubliFront', async (req, res) => {
  if (req.session.user) {
    const userEmail = req.session.user.email;
    const consultaUsuario = 'SELECT id FROM usuarios WHERE email = ? OR nickname = ?';

    connection.query(consultaUsuario, [userEmail, userEmail], (err, users) => {
      if (err || users.length === 0) {
        console.error('Erro ao buscar usuário:', err);
        res.status(500).json({ message: 'Erro ao buscar usuário', status: '500' });
        return;
      }

      const idUsuario = users[0].id;

      const consulta = `
        SELECT 
          p.id,
          p.Conteudo_Publicacao,
          p.Comentario_Author,
          p.data_de_envio,
          COUNT(c.id) AS total_comentarios,
          GROUP_CONCAT(
            JSON_OBJECT(
              'nickname', u.nickname, 
              'comentario', c.comentario
            ) 
            ORDER BY c.id SEPARATOR '|'
          ) AS comentarios
        FROM 
          publicacao p
        LEFT JOIN comentarios c ON p.id = c.publicacao_referente
        LEFT JOIN usuarios u ON c.user_comentador = u.id
        WHERE 
          p.user_autor = ?
        GROUP BY p.id
        ORDER BY p.id DESC`;

      connection.query(consulta, [idUsuario], (err, resultado) => {
        if (err) {
          console.error('Erro ao buscar mensagens:', err);
          res.status(500).json({ message: 'Erro ao buscar mensagens', status: '500' });
          return;
        }

        const mensagensValores = resultado.map((mensagem) => {
          return {
            id: mensagem.id,
            Conteudo_Publicacao: `http://localhost:3000/uploads/${mensagem.Conteudo_Publicacao}`,
            Comentario_Author: mensagem.Comentario_Author,
            data: mensagem.data_de_envio,
            NomeExtesao: mensagem.Conteudo_Publicacao,
            total_comentarios: mensagem.total_comentarios, // Retorna a contagem de comentários
            comentarios: mensagem.comentarios
              ? mensagem.comentarios.split('|').map(JSON.parse)
              : [] // Se não houver comentários, retorna um array vazio
          };
        });

        res.json({
          message: mensagensValores,
          status: '200',
          usuarioAtual: idUsuario
        });
      });
    });
  } else {
    res.status(401).json({ message: 'Não autorizado.', status: '401' });
  }
});


//-----------------------------------------------------------------------------------Apaga Publi-------------------------------------------------------------------------------------

app.post('/protected/ApagaPubli', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Usuário não autorizado.' });
  }

  const { EnviaDeletar } = req.body;
  const VerificaUser = 'SELECT user_autor, Conteudo_Publicacao FROM publicacao WHERE id = ?';

  connection.query(VerificaUser, [EnviaDeletar], (err, result) => {
    if (err) {
      console.error('Erro ao verificar o autor da publicação:', err);
      return res.status(500).json({ message: 'Erro ao processar a requisição.' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'Publicação não encontrada.' });
    }

    const { user_autor, Conteudo_Publicacao } = result[0];

    const ComparaUser = 'SELECT id FROM usuarios WHERE email = ? OR nickname = ?';
    connection.query(ComparaUser, [req.session.user.email, req.session.user.email], (err, userResult) => {
      if (err) {
        console.error('Erro ao verificar o usuário atual:', err);
        return res.status(500).json({ message: 'Erro ao processar a requisição.' });
      }

      if (userResult[0].id === user_autor) {
        const filePath = path.join(__dirname, 'uploads', Conteudo_Publicacao);

        // Verifica e remove o arquivo, se existir
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error('Erro ao excluir o arquivo:', err);
              return res.status(500).json({ message: 'Erro ao excluir o arquivo.' });
            }
          });
        }

        const apagaPubli = 'DELETE FROM publicacao WHERE id = ?';
        connection.query(apagaPubli, [EnviaDeletar], (err, deleteResult) => {
          if (err) {
            console.error('Erro ao excluir a publicação:', err);
            return res.status(500).json({ message: 'Erro ao excluir a publicação.' });
          }

          if (deleteResult.affectedRows > 0) {
            return res.status(200).json({ message: 'Publicação e arquivo excluídos com sucesso.', status: 200 });
          } else {
            return res.status(400).json({ message: 'Erro ao excluir a publicação.', status: 400 });
          }
        });
      } else {
        return res.status(403).json({ message: 'Usuário não autorizado para excluir esta publicação.', status: 403 });
      }
    });
  });
});

//-------------------------------------------------------------------------Carrega Info Perfil Visitante--------------------------------------------------------------------------------

app.post('/protected/CarregaPubliVisitante', async (req, res) => { 
  if (!req.session.user) {
    console.log("Não Autorizado");
    return res.status(401).json({ message: 'Não autorizado.', status: '401' });
  }

  const { id } = req.body; // ID do perfil visitado
  const emailUsuarioLogado = req.session.user.email;

  // Buscar o ID do usuário logado
  const consultaUsuario = `SELECT id FROM usuarios WHERE email = ? OR nickname = ?`;

  connection.query(consultaUsuario, [emailUsuarioLogado, emailUsuarioLogado], (err, resultadoUsuario) => {
    if (err) {
      console.error('Erro ao buscar usuário logado:', err);
      return res.status(500).json({ message: 'Erro ao buscar usuário logado', status: '500' });
    }

    if (resultadoUsuario.length === 0) {
      return res.status(404).json({ message: 'Usuário logado não encontrado', status: '404' });
    }

    const idUsuarioLogado = resultadoUsuario[0].id;

    if (idUsuarioLogado == id) {
      return res.status(401).json({ message: 'Não autorizado.', status: '401' });
    }

    // **PRIMEIRA CONSULTA**: Buscar informações do usuário e relação de seguidores
    const consultaUsuarioVisitado = `
      SELECT 
        u.id, u.nome, u.nickname, u.foto_perfil, u.mensagem_bio,
        (SELECT COUNT(*) FROM seguiruser WHERE id_seguindo = u.id) AS total_seguidores,
        (SELECT COUNT(*) FROM seguiruser WHERE id_seguidor = u.id) AS total_seguindo,
        (SELECT COUNT(*) FROM seguiruser WHERE id_seguidor = ? AND id_seguindo = ?) AS seguindoVoce,
        (SELECT COUNT(*) FROM seguiruser WHERE id_seguidor = ? AND id_seguindo = ?) AS voceSegue
      FROM usuarios u
      WHERE u.id = ?
    `;

    connection.query(consultaUsuarioVisitado, [id, idUsuarioLogado, idUsuarioLogado, id, id], (err, resultadoUsuarioVisitado) => {
      if (err) {
        console.error('Erro ao buscar usuário visitado:', err);
        return res.status(500).json({ message: 'Erro ao buscar usuário visitado', status: '500' });
      }

      if (resultadoUsuarioVisitado.length === 0) {
        return res.status(404).json({ message: 'Usuário não encontrado.', status: '404' });
      }

      const usuario = {
        id: resultadoUsuarioVisitado[0].id,
        id_user_atual: idUsuarioLogado,
        nome: resultadoUsuarioVisitado[0].nome,
        nickname: resultadoUsuarioVisitado[0].nickname,
        foto_perfil: resultadoUsuarioVisitado[0].foto_perfil,
        mensagem_bio: resultadoUsuarioVisitado[0].mensagem_bio,
        link_foto: `http://localhost:3000/uploads/${resultadoUsuarioVisitado[0].foto_perfil}`,
        total_seguindo: resultadoUsuarioVisitado[0].total_seguindo,
        total_seguidores: resultadoUsuarioVisitado[0].total_seguidores,
        seguindoVoce: resultadoUsuarioVisitado[0].seguindoVoce > 0,
        voceSegue: resultadoUsuarioVisitado[0].voceSegue > 0,
      };

      // **SEGUNDA CONSULTA**: Buscar publicações e comentários + Verificação de curtidas
      const consultaPublicacoes = `
        SELECT 
          p.id AS publicacao_id, 
          p.Conteudo_Publicacao, 
          p.Comentario_Author, 
          p.data_de_envio,
          COUNT(c.id) AS total_comentarios,
          GROUP_CONCAT(
            JSON_OBJECT(
              'nickname', cu.nickname, 
              'comentario', c.comentario
            ) 
            ORDER BY c.id SEPARATOR '|'
          ) AS comentarios,
          (SELECT COUNT(*) FROM curtidas WHERE curtidas.id_publicacao = p.id AND curtidas.id_curtidor = ?) AS curtido
        FROM publicacao p
        LEFT JOIN comentarios c ON p.id = c.publicacao_referente
        LEFT JOIN usuarios cu ON c.user_comentador = cu.id
        WHERE p.user_autor = ?
        GROUP BY p.id
        ORDER BY p.id DESC
      `;

      connection.query(consultaPublicacoes, [idUsuarioLogado, id], (err, resultados) => {
        if (err) {
          console.error('Erro ao buscar publicações:', err);
          return res.status(500).json({ message: 'Erro ao buscar publicações', status: '500' });
        }

        // Se não houver publicações, retorna apenas os dados do usuário
        if (resultados.length === 0) {
          return res.json({ usuario, publicacoes: [], status: '200' });
        }

        // Transformar os resultados das publicações
        const mensagensValores = resultados.map((mensagem) => ({
          id: mensagem.publicacao_id,
          Conteudo_Publicacao: `http://localhost:3000/uploads/${mensagem.Conteudo_Publicacao}`,
          Comentario_Author: mensagem.Comentario_Author,
          data: mensagem.data_de_envio,
          NomeExtesao: mensagem.Conteudo_Publicacao,
          total_comentarios: mensagem.total_comentarios,
          curtido: mensagem.curtido > 0, // Se maior que 0, o usuário já curtiu a publicação
          comentarios: mensagem.comentarios
            ? mensagem.comentarios.split('|').map(JSON.parse)
            : [],
        }));

        // Resposta JSON final
        res.json({ usuario, publicacoes: mensagensValores, status: '200' });
      });
    });
  });
});




//---------------------------------------------------------------------------------Carrega Feed Recomendado----------------------------------------------------------------------------

app.get('/protected/CarregaFeedRecomendado', (req, res) => {
  if (!req.session.user) {
    return res.status(400).json({ message: 'Usuário precisa estar logado', status: 400 });
  }

  const emailUsuarioLogado = req.session.user.email;

  // Primeiro, obtemos o ID do usuário logado
  const consultaUsuario = `SELECT id FROM usuarios WHERE email = ? OR nickname = ?`;

  connection.query(consultaUsuario, [emailUsuarioLogado, emailUsuarioLogado], (err, resultadoUsuario) => {
    if (err) {
      console.error('Erro ao buscar usuário logado:', err);
      return res.status(500).json({ message: 'Erro ao buscar usuário logado', status: 500 });
    }

    if (resultadoUsuario.length === 0) {
      return res.status(404).json({ message: 'Usuário logado não encontrado', status: 404 });
    }

    const idUsuarioLogado = resultadoUsuario[0].id;

    // Consulta principal das publicações
    const consultaPublicacoes = `
      SELECT 
        publicacao.Conteudo_Publicacao,
        publicacao.Comentario_Author,
        publicacao.id AS id_da_Publicacao,
        DATE_FORMAT(publicacao.data_de_envio, "%d/%m/%Y") AS data_formatada,
        usuarios.id AS id_dono_publi,
        usuarios.nickname AS nick_autor_publi,
        usuarios.foto_perfil,
        comentarios.Comentario,
        comentarios.datahora,
        comentador.nickname AS nick_autor_comentario,
        (SELECT COUNT(*) FROM comentarios WHERE comentarios.publicacao_referente = publicacao.id) AS total_comentarios,
        (SELECT COUNT(*) FROM seguiruser WHERE seguiruser.id_seguindo = usuarios.id AND seguiruser.id_seguidor = ?) AS seguindoAutor,
        (SELECT COUNT(*) FROM curtidas WHERE curtidas.id_publicacao = publicacao.id AND curtidas.id_curtidor = ?) AS curtido
      FROM 
        publicacao
      INNER JOIN 
        usuarios ON usuarios.id = publicacao.user_autor
      LEFT JOIN 
        comentarios ON comentarios.publicacao_referente = publicacao.id
      LEFT JOIN 
        usuarios AS comentador ON comentarios.user_comentador = comentador.id
      WHERE 
        usuarios.email != ? AND usuarios.nickname != ?
      ORDER BY 
        publicacao.id DESC, comentarios.id ASC
    `;

    connection.query(consultaPublicacoes, [idUsuarioLogado, idUsuarioLogado, emailUsuarioLogado, emailUsuarioLogado], (err, resultados) => {
      if (err) {
        console.error('Erro ao buscar dados:', err);
        return res.status(500).json({ message: 'Erro ao buscar dados', status: 500 });
      }

      let objdados = [];

      resultados.forEach((registro) => {
        // Verifica se a publicação já existe no array
        let publicacao = objdados.find((pub) => pub.id_da_Publicacao === registro.id_da_Publicacao);

        // Se a publicação ainda não foi adicionada, inicializa
        if (!publicacao) {
          publicacao = {
            id_usuario_atual: idUsuarioLogado,
            id_dono_publi: registro.id_dono_publi,
            Conteudo_Publicacao: `http://localhost:3000/uploads/${registro.Conteudo_Publicacao}`,
            Comentario_Author: registro.Comentario_Author,
            data_de_envio: registro.data_formatada,
            nick_autor_publi: registro.nick_autor_publi,
            foto_perfil: `http://localhost:3000/uploads/${registro.foto_perfil}`,
            id_da_Publicacao: registro.id_da_Publicacao,
            total_comentarios: registro.total_comentarios,
            NomeExtesao: registro.Conteudo_Publicacao,
            seguindoAutor: registro.seguindoAutor > 0, // Se for maior que 0, significa que já está seguindo
            curtido: registro.curtido > 0, // Se for maior que 0, significa que já curtiu
            comentarios: [],
          };

          // Adiciona a publicação ao array
          objdados.push(publicacao);
        }

        // Adiciona o comentário, se existir
        if (registro.Comentario) {
          publicacao.comentarios.push({
            comentario: registro.Comentario,
            datahora: registro.datahora,
            nick_autor_comentario: registro.nick_autor_comentario,
          });
        }
      });

      res.status(200).json({ message: objdados, status: 200 });
    });
  });
});


//---------------------------------------------------------------------------------Carrega Feed Seguindo----------------------------------------------------------------------------

app.get('/protected/CarregaFeedSeguindo', (req, res) => {
  if (!req.session.user) {
    return res.status(400).json({ message: 'Usuário precisa estar logado', status: 400 });
  }

  const emailUsuarioLogado = req.session.user.email;

  // Primeiro, obtemos o ID do usuário logado
  const consultaUsuario = `SELECT id FROM usuarios WHERE email = ? OR nickname = ?`;

  connection.query(consultaUsuario, [emailUsuarioLogado, emailUsuarioLogado], (err, resultadoUsuario) => {
    if (err) {
      console.error('Erro ao buscar usuário logado:', err);
      return res.status(500).json({ message: 'Erro ao buscar usuário logado', status: 500 });
    }

    if (resultadoUsuario.length === 0) {
      return res.status(404).json({ message: 'Usuário logado não encontrado', status: 404 });
    }

    const idUsuarioLogado = resultadoUsuario[0].id;

    // **Consulta Principal: Buscar publicações apenas de usuários que o usuário logado segue**
    const consultaPublicacoes = `
      SELECT 
        publicacao.Conteudo_Publicacao,
        publicacao.Comentario_Author,
        publicacao.id AS id_da_Publicacao,
        DATE_FORMAT(publicacao.data_de_envio, "%d/%m/%Y") AS data_formatada,
        usuarios.id AS id_dono_publi,
        usuarios.nickname AS nick_autor_publi,
        usuarios.foto_perfil,
        comentarios.Comentario,
        comentarios.datahora,
        comentador.nickname AS nick_autor_comentario,
        (SELECT COUNT(*) FROM comentarios WHERE comentarios.publicacao_referente = publicacao.id) AS total_comentarios,
        (SELECT COUNT(*) FROM seguiruser WHERE seguiruser.id_seguindo = usuarios.id AND seguiruser.id_seguidor = ?) AS seguindoAutor,
        (SELECT COUNT(*) FROM curtidas WHERE curtidas.id_publicacao = publicacao.id AND curtidas.id_curtidor = ?) AS curtido
      FROM 
        publicacao
      INNER JOIN 
        usuarios ON usuarios.id = publicacao.user_autor
      LEFT JOIN 
        comentarios ON comentarios.publicacao_referente = publicacao.id
      LEFT JOIN 
        usuarios AS comentador ON comentarios.user_comentador = comentador.id
      WHERE 
        usuarios.email != ? AND usuarios.nickname != ? AND 
        EXISTS (SELECT 1 FROM seguiruser WHERE id_seguidor = ? AND id_seguindo = usuarios.id) 
      ORDER BY 
        publicacao.id DESC, comentarios.id ASC
    `;

    connection.query(consultaPublicacoes, [idUsuarioLogado, idUsuarioLogado, emailUsuarioLogado, emailUsuarioLogado, idUsuarioLogado], (err, resultados) => {
      if (err) {
        console.error('Erro ao buscar dados:', err);
        return res.status(500).json({ message: 'Erro ao buscar dados', status: 500 });
      }

      let objdados = [];

      resultados.forEach((registro) => {
        // Verifica se a publicação já existe no array
        let publicacao = objdados.find((pub) => pub.id_da_Publicacao === registro.id_da_Publicacao);

        // Se a publicação ainda não foi adicionada, inicializa
        if (!publicacao) {
          publicacao = {
            id_usuario_atual: idUsuarioLogado,
            id_dono_publi: registro.id_dono_publi,
            Conteudo_Publicacao: `http://localhost:3000/uploads/${registro.Conteudo_Publicacao}`,
            Comentario_Author: registro.Comentario_Author,
            data_de_envio: registro.data_formatada,
            nick_autor_publi: registro.nick_autor_publi,
            foto_perfil: `http://localhost:3000/uploads/${registro.foto_perfil}`,
            id_da_Publicacao: registro.id_da_Publicacao,
            total_comentarios: registro.total_comentarios,
            NomeExtesao: registro.Conteudo_Publicacao,
            seguindoAutor: registro.seguindoAutor > 0, // Se for maior que 0, significa que já está seguindo
            curtido: registro.curtido > 0, // Se for maior que 0, significa que já curtiu
            comentarios: [],
          };

          // Adiciona a publicação ao array
          objdados.push(publicacao);
        }

        // Adiciona o comentário, se existir
        if (registro.Comentario) {
          publicacao.comentarios.push({
            comentario: registro.Comentario,
            datahora: registro.datahora,
            nick_autor_comentario: registro.nick_autor_comentario,
          });
        }
      });

      res.status(200).json({ message: objdados, status: 200 });
    });
  });
});


//-------------------------------------------------------------------------------Inserir Comentario Publicacao-------------------------------------------------------------

app.post('/protected/EnviaComentario', (req, res) => {

  if (req.session.user) {

    let objdados = [];
    const { id, Comentario } = req.body;
    const consulta = `
    SELECT 
    publicacao.*, 
    usuarios.id AS id_Comentador
    FROM 
    publicacao
    CROSS JOIN 
    (SELECT id FROM usuarios WHERE email = ? OR nickname = ?) AS usuarios
    WHERE 
    publicacao.id = ?

  `;

    connection.query(consulta, [req.session.user.email, req.session.user.email, id], (err, resultados) => {
      if (err) {
        console.error('Erro ao buscar dados:', err);
        res.status(500).json({ message: 'Erro ao buscar dados', status: '500' });
        return;
      }
      const now = new Date();

      // Adiciona o deslocamento de -3 horas para o horário de Brasília
      const offset = -3; // Horário de Brasília (UTC-3)
      const brDate = new Date(now.getTime() + offset * 60 * 60 * 1000);
      const datetime = brDate.toISOString().slice(0, 19).replace('T', ' ');
      const inserirComentario = `
    INSERT 
        INTO
        comentarios(publicacao_referente,user_comentador,Comentario,datahora)
        Values(?,?,?,?)
      `;

      connection.query(inserirComentario, [resultados[0].id, resultados[0].id_Comentador, Comentario, datetime], (err, inserirdados) => {
        if (err) {
          console.error('Erro ao buscar dados:', err);
          res.status(500).json({ message: 'Erro ao buscar dados', status: '500' });
          return;
        }
        res.status(200).json({ message: objdados, status: 200 });

      }
      )
    })
  }
  else {
    res.status(400).json({ message: "Usuario Precisa Estar Logado", status: 400 });
    return;
  }
})

//---------------------------------------------------------------------------Seguir user-----------------------------------------------------------------------------------------
app.post('/protected/SeguirUsuario', (req, res) => {
  if (!req.session.user) {
    return res.status(400).json({ message: "Usuário precisa estar logado", status: 400 });
  }

  const { id_seguir } = req.body;

  const consultaUsuario = `
    SELECT id FROM usuarios WHERE email = ? OR nickname = ?
  `;

  connection.query(consultaUsuario, [req.session.user.email, req.session.user.email], (err, resultado) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err);
      return res.status(500).json({ message: 'Erro ao buscar usuário', status: '500' });
    }

    if (resultado.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado', status: '404' });
    }

    const idUsuario = resultado[0].id;

    // Verifica se já está seguindo
    const consultaSeguindo = `
      SELECT id FROM seguiruser WHERE id_seguindo = ? AND id_seguidor = ?
    `;

    connection.query(consultaSeguindo, [id_seguir, idUsuario], (err, Seguindo_Ou_Nao) => {
      if (err) {
        console.error('Erro ao verificar relação de seguimento:', err);
        return res.status(500).json({ message: 'Erro ao verificar relação de seguimento', status: '500' });
      }

      if (Seguindo_Ou_Nao.length > 0) {
        // Se já segue, então remove a relação (deixa de seguir)
        const consultaDeletar = `
          DELETE FROM seguiruser WHERE id_seguindo = ? AND id_seguidor = ?
        `;

        connection.query(consultaDeletar, [id_seguir, idUsuario], (err) => {
          if (err) {
            console.error('Erro ao deixar de seguir usuário:', err);
            return res.status(500).json({ message: 'Erro ao deixar de seguir usuário', status: '500' });
          }

          return res.json({ message: 'Usuário deixado de seguir com sucesso', status: '200', seguindo: false });
        });

      } else {
        // Se não segue, então insere um novo registro (seguir)
        const consultaInserir = `
          INSERT INTO seguiruser (id_seguindo, id_seguidor) VALUES (?, ?)
        `;

        connection.query(consultaInserir, [id_seguir, idUsuario], (err) => {
          if (err) {
            console.error('Erro ao seguir usuário:', err);
            return res.status(500).json({ message: 'Erro ao seguir usuário', status: '500' });
          }

          return res.json({ message: 'Usuário seguido com sucesso', status: '200', seguindo: true });
        });
      }
    });
  });
});
//-----------------------------------------------------------------------------------Curtir Publi----------------------------------------------------------------------------------

app.post('/protected/CurtirPubli', (req, res) => {
  if (!req.session.user) {
    return res.status(400).json({ message: "Usuário precisa estar logado", status: 400 });
  }

  const { id_dono, id_atual, publicacao } = req.body;

  if (!id_dono || !id_atual || !publicacao) {
    return res.status(400).json({ message: "Dados incompletos para curtir a publicação", status: 400 });
  }

  // Verifica se o usuário já curtiu a publicação
  const checkQuery = `
    SELECT * FROM curtidas 
    WHERE id_autor = ? AND id_curtidor = ? AND id_publicacao = ?
  `;

  connection.query(checkQuery, [id_dono, id_atual, publicacao], (err, results) => {
    if (err) {
      console.error("Erro ao verificar curtida:", err);
      return res.status(500).json({ message: "Erro ao processar curtida", status: 500 });
    }

    if (results.length > 0) {
      // Usuário já curtiu, então vamos remover a curtida
      const deleteQuery = `
        DELETE FROM curtidas WHERE id_autor = ? AND id_curtidor = ? AND id_publicacao = ?
      `;
      connection.query(deleteQuery, [id_dono, id_atual, publicacao], (err) => {
        if (err) {
          console.error("Erro ao remover curtida:", err);
          return res.status(500).json({ message: "Erro ao remover curtida", status: 500 });
        }
        return res.status(200).json({ message: "Curtida removida com sucesso", status: 200 });
      });

    } else {
      // Usuário ainda não curtiu, então vamos adicionar a curtida
      const insertQuery = `
        INSERT INTO curtidas (id_autor, id_curtidor, id_publicacao) 
        VALUES (?, ?, ?)
      `;
      connection.query(insertQuery, [id_dono, id_atual, publicacao], (err) => {
        if (err) {
          console.error("Erro ao adicionar curtida:", err);
          return res.status(500).json({ message: "Erro ao adicionar curtida", status: 500 });
        }
        return res.status(200).json({ message: "Curtida adicionada com sucesso", status: 200 });
      });
    }
  });
});







// Rota de logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao fazer logout.' });
    }
    res.json({ message: 'Usuário desconectado!', status: '200' });
  });
});







// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});


