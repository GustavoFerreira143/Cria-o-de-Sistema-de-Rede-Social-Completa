import React from 'react'

function NavBarChat() {
  function EncaminhaPerfil()
  {
    window.location.href='/PerfilDeUsuario';
  }

  return (
    <header id="header">
      <nav className="navbar navbar-expand-lg ">
        <div className="container">
          
          <span id="headerText" href="#" className="navbar-brand text-light">
            <img id="Logo" src="../src/assets/logo.png" width="90"></img>
            Melhor Site de Bate-Papo
          </span>

          <button className="navbar-toggler" data-toggle="collapse" data-target="#nav-principal">
            <span className="navbar-toggler-icon"></span>
          </button>

          <button className="navbar-toggler navbar-light bg-light" data-toggle="collapse" data-target="#nav-principal">
            <span className="navbar-toggler-icon"></span>
          </button>


          <div className="collapse navbar-collapse" id="nav-principal">
          <ul className="navbar-nav ml-auto d-flex justify-content-end" id="linknav">
          <li onClick={EncaminhaPerfil} id="NomeUserBloco" className="nav-item d-flex ">
                <img id="imgusuario" src='../src/assets/perfil.png' width="50" height='50'></img>
                <span id="NomeUser" href="" className="nav-link ml-2 text-light ">Nome</span><span id="IdUser" href="" className="nav-link ml-2 text-light "></span>
              </li>
          <li className="nav-item d-flex " id="item-hover">
                <a id="Voltar" href="/" className="nav-link ms-5 text-light btn btn-outline-light ml-4">Voltar ao Inicio</a>
              </li>
              <li className="nav-item d-flex " id="item-hover2">
                <a id="Publicacao" href="/Publicacoes" className="nav-link ms-5 text-light btn btn-outline-light ml-4">Publicações</a>
              </li>



            </ul>
          </div>

        </div>
      </nav>
      <div id="Alerta"></div>
    </header>
  )
}

export default NavBarChat