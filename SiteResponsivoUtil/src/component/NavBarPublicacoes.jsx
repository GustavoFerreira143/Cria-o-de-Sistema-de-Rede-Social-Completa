import React from 'react'

function NavBarPublicacoes() {
  const apiUrl = import.meta.env.VITE_BackEndUrl;
    async function Logout() {
        const response = await fetch(`${apiUrl}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Inclui cookies na requisição
        })
        const result = await response.json();
        window.location.reload()
    
      }

  return (
    <>
    <header id="header">
  <nav className="navbar navbar-expand-lg">
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
      <li className="nav-item d-flex " id="item-hover">
            <a id="Voltar" onClick={Logout} className="nav-link ms-5 text-light btn btn-outline-light ml-4">Efetuar Logout</a>
          </li>
          <li className="nav-item d-flex " id="item-hover">
            <a id="Voltar" href="/" className="nav-link ms-5 text-light btn btn-outline-light ml-4">Voltar ao Inicio</a>
          </li>

      <li className="nav-item d-flex " id="item-hover">
            <a id="Voltar" href="/Chat" className="nav-link ms-5 text-light btn btn-outline-light ml-4">Chat</a>
          </li>

          <li className="nav-item d-flex " id="item-hover">
                    <a id="Voltar" href="/PerfildeUsuario" className="nav-link ms-5 text-light btn btn-outline-light ml-4">Perfil de Usuário</a>
          </li>

        </ul>
      </div>

    </div>
  </nav>
</header>
</>
  )
}

export default NavBarPublicacoes