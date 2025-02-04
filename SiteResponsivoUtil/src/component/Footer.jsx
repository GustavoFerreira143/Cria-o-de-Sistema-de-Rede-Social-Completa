
function Footer() {
  return (
    <footer>

   <div className="container">
        <div className="row">
          <div className="col-md-6 d-flex">
            <div className="align-self-left">
            <p id="CriadoPor" className="text-light">Criado por Gustavo Ferreira</p>

            </div>  
          </div>

          <div id="botao" className="col-md-6 d-flex justify-content-end mt-3 mb-3">
          <a id="Links" href="https://github.com/GustavoFerreira143" className="btn btn-outline-light">GitHub
              <img id="imagem" src="./src/assets/GitHub.png" width="30"></img>
            </a>
            <a id="Links" href="https://www.linkedin.com/in/gustavo-ferreira-238348231/" className="btn btn-outline-light">Linkedin
              <img id="imagem" src="./src/assets/linkedin-icon.png" width="30"></img>
            </a>
          </div>
        </div>

      </div>

    
    </footer>
  )
}

export default Footer