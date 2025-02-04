import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../../component/FootereHeader.css'
import './TelaLogin.css'
import NavBarLogin from '../../component/NavBarLogin'

//--------------------------------------------------------------------------Funcao Verifica se Usuario Ja esta Logado-------------------------------------------------------------------
const apiUrl = import.meta.env.VITE_BackEndUrl;
function Login() {

  async function LoginTela() {
    const response = await fetch(`${apiUrl}/protected`, {
      method: 'GET',
      credentials: 'include', // Inclui cookies na requisição
    });
    const result = await response.json();
    if (result.status == "400") {

    }
    else {
      window.location.replace("/PerfilDeUsuario")
      return
    }
  }
  LoginTela();

setTimeout(()=>{  
  if (janela != "") {
    
  document.getElementById('Alerta').innerHTML = '<div id="AlertaErro" class="alert alert-danger alert-dismissible fade show" role="alert"><strong>Erro  </strong> Necessario Efetuar o Login Primeiro <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>';
}
}
,500)

//---------------------------------------------------------------------Funcao Logar Usuario--------------------------------------------------------------------------------------------

  async function Logar() {
    let Email = document.getElementById('InputEmail').value;
    let Senha = document.getElementById('InputSenha').value;

    const response = await fetch(`${apiUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Inclui cookies na requisição
      body: JSON.stringify({ email: Email, senha: Senha }),
    });
    const result = await response.json();

    if (response.status == "400") {

      document.getElementById('Alerta').innerHTML = '<div id="AlertaErro" class="alert alert-danger alert-dismissible fade show" role="alert"><strong>Erro  </strong>' + result.message + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>';

    }
    else {

      document.getElementById('Alerta').innerHTML = '<div id="AlertaErro" class="alert alert-success alert-dismissible fade show" role="alert"><strong>Usuário Vinculado com Sucesso </strong>' + result.message + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>';
      document.getElementById('InputEmail').value = "";
      document.getElementById('InputSenha').value = "";
      setTimeout(() => window.location.replace("/PerfilDeUsuario"), 1000)

    }
  }

//--------------------------------------------------------------------------Funcão Criar Usuario------------------------------------------------------------------------------------------

  async function CriarUsuario() {

    let Nome = document.getElementById('NomeUsuario').value;
    let Email = document.getElementById('Email').value;
    let Senha = document.getElementById('SenhaCadastro').value;
    let nickname = document.getElementById('Nick').value; 
    console.log(Nome)
    const response = await fetch(`${apiUrl}/usuarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Inclui cookies na requisição
      body: JSON.stringify({ nome: Nome, email: Email, senha: Senha, nick: nickname }),
    });
    const result = await response.json();
    if (response.status == "400") {
      document.getElementById('Alerta').innerHTML = '<div id="AlertaErro" class="alert alert-danger alert-dismissible fade show" role="alert"><strong>Erro  </strong>' + result.message + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>';

    }
    else {
      document.getElementById('Alerta').innerHTML = '<div id="AlertaErro" class="alert alert-success alert-dismissible fade show" role="alert"><strong>Usuário Criado com Sucesso  </strong>' + result.message + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>';
      document.getElementById('NomeUsuario').value = "";
      document.getElementById('Email').value = "";
      document.getElementById('SenhaCadastro').value = "";
      document.getElementById('Nick').value = "";
      TrocaCadastro();
    }

  }

//--------------------------------------------------------------------------Fim Funcao Cria usuario-------------------------------------------------------------------------------------


//----------------------------------------------------------------------Funcao Senha Visivel Ou Não-------------------------------------------------------------------------------------

  function TrocaView() {
    let img = document.getElementById('SenhaVisivel').src
    let inputsenha = document.getElementById('InputSenha').type
    if (inputsenha == 'password') {
      document.getElementById('SenhaVisivel').src = './src/assets/MostrarSenha.png'
      document.getElementById('InputSenha').type = 'text'
    }
    else {
      document.getElementById('SenhaVisivel').src = './src/assets/EsconderSenha.png'
      document.getElementById('InputSenha').type = 'password'
    }

  }
  function TrocaView2() {
    let img = document.getElementById('SenhaVisivel2').src
    let inputsenha = document.getElementById('SenhaCadastro').type
    if (inputsenha == 'password') {
      document.getElementById('SenhaVisivel2').src = './src/assets/MostrarSenha.png'
      document.getElementById('SenhaCadastro').type = 'text'
    }
    else {
      document.getElementById('SenhaVisivel2').src = './src/assets/EsconderSenha.png'
      document.getElementById('SenhaCadastro').type = 'password'
    }

  }

//------------------------------------------------------------------Fim Funcao Senha Visivel Ou Não-------------------------------------------------------------------------------------



//------------------------------------------------------------------Função Troca Tela Animada-------------------------------------------------------------------------------------------

  function TrocaCadastro() {
    let Tela = document.getElementById('FundoCadastro').className;
    let Tela2 = document.getElementById('FundoLogin').className;
    document.getElementById('Colunas').style.animationPlayState = 'running';
    document.getElementById('Colunas2').style.animationPlayState = 'running';
    document.getElementById('FundoCadastro').className = Tela2;
    document.getElementById('FundoLogin').className = Tela;
  }

  let janela = window.location.href;
  janela = janela.replace("http://localhost:5173/Login","");
  


  return (
    <>
      <NavBarLogin />
      <section id="Fundo">
        <div id="BackGroundLogin">
          <div className="container">
            <div id="Alerta"></div>
            <div id="FundoLogin" className="row">
              <div id="Colunas" className="col-md-6">
                <h1 id="Titulo" className="text-light">
                  Fazer Login
                </h1>
                <form id="Formulario">
                  <p id="DigiteEmail" className="text-light">
                    Digite seu Email ou Apelido:
                  </p>
                  <input id="InputEmail" className="Inputs" type="email" ></input>
                  <p id="DigiteSenha" className="text-light">
                    Digite Sua Senha:
                  </p>
                  <input id="InputSenha" className="Inputs2" type="password"></input>


                  <img onClick={TrocaView}
                    id="SenhaVisivel" src="../../src/assets/EsconderSenha.png" width="30"
                  ></img>

                  
                  <br />
                </form>
                <button id="EnviarLogin" onClick={Logar} className="btn btn-outline-light">Enviar</button>



              </div>
              <div id="Colunas2" className="col-md-6">
                <h1 id="TrocaParaCadastro" className="text-light">Cadastrar-se</h1>
                <p id="TrocaParaCadastrop" className="text-light">Caso não tenha login clique para Cadastrar-se</p>


                <a className="btn btn-outline-light text-light" onClick={TrocaCadastro}>Cadastrar-se</a>


              </div>


            </div>
            <div id="FundoCadastro" className="row d-none">
              <div id="ColunasCadastro" className="col-md-6">
                <h1 id="TextoFazerCadastro" className="text-light">
                  Fazer Cadastro
                </h1>
                <form id="FormularioCadastro">
                  <p id="DigiteCadastro" className="text-light">
                    Digite seu nome:
                  </p>
                  <input id="NomeUsuario" className="Inputs" type="text" ></input>
                  <p id="DigiteCadastro" className="text-light">
                    Digite seu email:
                  </p>
                  <input id="Email" className="Inputs" type="email" ></input>
                  <p id="DigiteCadastro" className="text-light">
                    Digite um Apelido de Usuario:
                  </p>
                  <input id="Nick" className="Inputs" type="text" ></input>
                  <p id="DigiteCadastro" className="text-light">
                    Digite Sua Senha:
                  </p>
                  <input required className="InputsCadastro2" id="SenhaCadastro" type="password"></input>


                  <img onClick={TrocaView2}


                    id="SenhaVisivel2" src="../../src/assets/EsconderSenha.png" width="30"
                  ></img>
                  <br />
                </form>


                <button id="BotaoCriarUser" onClick={CriarUsuario} className="btn btn-outline-light">Enviar</button>

              </div>
              <div id="ColunasCadastro2" className="col-md-6">
                <h1 id="TituloTrocaLogin" className="text-light">Já tem Cadastro?</h1>
                <p id="CliqueParaAlterar" className="text-light">Clique aqui para Efetuar o Login</p>


                <a className="btn btn-outline-light text-light" onClick={TrocaCadastro}>Login</a>
              </div>


            </div>
          </div>
        </div>
      </section>
      <script src='../../component/TelaLogin.js'>

      </script>
    </>
  )
}

export default Login