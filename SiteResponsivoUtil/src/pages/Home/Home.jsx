import React from 'react'
import Navbar from '../../../src/component/Navbar'
import './home.css'

export default function Home() {


  return (
    <>
    <Navbar/>
    <div id="FundoHome">
    <div id="backgorund">
    <section id="home">
      <div className="container">
        <div className="row">
          <div className="col-md-6 d-flex">
            <div className="align-self-center">
              <h3 className="text-light display-4">Desenvolvido com Chat interativo </h3>
              <p className="text-light"> Se Divirta Mandando e Recebendo mensagens, imagens, videos e muitas outras
                possibilidades de seus amigos</p>
              <a href="/Chat" id="IniciarChat" className="btn btn-outline-light">Iniciar Chat
                <img src="../../../src/assets/Chat.png" width="60"></img>
              </a>

            </div>
          </div>
          <div className="col-md-6 d-none d-md-block">
            <img id="BatePapo" src="../../../src/assets/Conversas.gif" width="300" height="400"></img>
          </div>
        </div>

      </div>

    </section>
    <section id="home">
      <div className="container">
        <div className="row">
          <div className="col-md-6 d-flex">
            <div className="align-self-center">


            </div>
          </div>




          <div className="col-md-6 ">
            <h3 className="text-light display-4">Com um compartilhamento de experiencias Integrado </h3>
            <p className="text-light"> Além do chat totalmente interativo ainda temos o sistema de compartilhamento de
              experiencias onde você pode compartilhar qualquer tipo de acontecimento com as pessoas presentes</p>
            <a href="/Publicacoes" id="IniciarBatePapo" className="btn btn-outline-light">Ver Publicações
              <img src="../../../src/assets/publicacao.png" width="60"></img>
            </a>
          </div>
        </div>

      </div>



    </section>
  </div>
  </div>
    </>
  )
}
