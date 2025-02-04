import './FootereHeader.css'

function Navbar() {

  const apiUrl = import.meta.env.VITE_BackEndUrl;

  async function LogarPagina() {
    const response = await fetch(`${apiUrl}/protected`, {
      method: 'GET',
      credentials: 'include', // Inclui cookies na requisição
    });
    const result = await response.json();
    if (result.status != "200") {
      document.getElementById('LinkPerfil').className = 'd-none'
      return ('NãoLogado')
    }
    else {
      document.getElementById('Logar/Logout').innerText = 'Efetuar Logout'
      document.getElementById('LinkPerfil').className = 'btn btn-outline-light ml-4 text-light'
      return ('Logado')
    }

  }
  LogarPagina();

  async function Logout() {
    const response = await fetch(`${apiUrl}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Inclui cookies na requisição
    })
    const result = await response.json();
    console.log(result.message)
    document.getElementById('Alerta').innerHTML = '<div id="AlertaLogout" class="alert alert-success alert-dismissible fade show text-center" role="alert"><strong>Logout Efetuado com Sucesso </strong>' + result.message + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>';
    document.getElementById('Logar/Logout').innerText = 'Logar'
    document.getElementById('LinkPerfil').className = 'd-none'

  }
  return (
    
    <header id="header">
      <nav className="navbar navbar-expand-sm ">
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
            <ul className="navbar-nav ml-auto" id="linknav">
              <li className="nav-item" id="item-hover">
                <a href="" className="nav-link ms-5 text-light">Como Funciona?</a>
              </li>
              <li className="nav-item" id="item-hover">
                <a id="LinkPerfil" onClick={() => {
                  const Valor = LogarPagina()
                    .then((funcional) => {
                      if (funcional == 'Logado') {
                        window.location.href = '/PerfilDeUsuario'
                      }
                      else
                      {
                        window.location.href = '/Login'
                      }
                    })

                }}  className='d-none' >Perfil de Usuário</a>
              </li>
              <li className="nav-item">
                <a onClick={() => {
                  const Valor = LogarPagina()
                    .then((funcional) => {
                      if (funcional == 'Logado') {
                        Logout();
                      }
                      else
                      {
                        window.location.href = '/Login'
                      }
                    })

                }} id="Logar/Logout" className="btn btn-outline-light ml-4 text-light">Logar</a>
            </li>
          </ul>
        </div>

      </div>
    </nav>
    <div id="Alerta"></div>
    </header >

  )
}

export default Navbar