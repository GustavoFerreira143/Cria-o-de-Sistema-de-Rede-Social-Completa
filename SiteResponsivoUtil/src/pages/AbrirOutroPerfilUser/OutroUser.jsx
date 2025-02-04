import './OutroUser.css';
import NavBarPerfil from '../../component/NavBarPerfil';
import React, { useEffect, useState } from "react";

const apiUrl = import.meta.env.VITE_BackEndUrl;
let url = window.location.href;
url = new URL(url).searchParams;
function OutroUser() {
  const [dadosUser, setDadosUser] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [CarregaFeed, setCarregaFeed] = useState([])
  // Função para carregar o perfil do usuário
  
  async function CarregaPerfil() {
    let id_Busca = url.get("id");
    const result = await fetch(`${apiUrl}/protected/CarregaPubliVisitante`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ id: id_Busca })
    })
    const retorno = await result.json();
    if (retorno.status == 200) {

      setDadosUser(retorno.usuario);
      setCarregaFeed(retorno.publicacoes);
    }
    else {
      if (retorno.message == 'Não autorizado.') {
        window.location.replace('/Login?erro');
      }
    }

  }


  // Atualiza os dados do perfil periodicamente
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (isMounted) {
        CarregaPerfil()
        setTimeout(fetchProfile, 1000); // Recarrega após 5 segundos
      }
    };

    fetchProfile();

    return () => {
      isMounted = false; // Limpa a execução em caso de desmontagem
    };
  }, []);


//--------------------------------------------------------------------Controle de troca Publis----------------------------------------------------------

  useEffect(() => {
    const modal = document.getElementById("CriacaoModalTeste");

    let touchStartX = 0;
    let touchEndX = 0;

    const handleKeyUp = (event) => {
      if (modal && modal.className === "") {
        alternarPublicacao(event.key);
      }
    };

    const handleTouchStart = (event) => {
      touchStartX = event.touches[0].clientY;
    };

    const handleTouchEnd = (event) => {
      touchEndX = event.changedTouches[0].clientY;
      const diff = touchStartX - touchEndX;

      if (diff > 50) {
        // Deslizou para a esquerda (próxima publicação)
        alternarPublicacao("ArrowRight");
      } else if (diff < -50) {
        // Deslizou para a direita (publicação anterior)
        alternarPublicacao("ArrowLeft");
      }
    };

    const alternarPublicacao = (tecla) => {
      const itens = document.querySelectorAll('[class^="z"]');
      let currentIndex = 0;

      itens.forEach((item, index) => {
        if (!item.classList.contains("d-none")) {
          currentIndex = index;
        }
      });

      let nextIndex = currentIndex;
      let animationClass = "";

      if (tecla === "ArrowRight") {
        nextIndex = (currentIndex + 1) % itens.length;
        animationClass = "animacao-direita";
      } else if (tecla === "ArrowLeft") {
        nextIndex = (currentIndex - 1 + itens.length) % itens.length;
        animationClass = "animacao-esquerda";
      }

      // Oculta o item atual
      if (currentIndex !== -1) {
        let TagPai = itens[currentIndex];
        if (TagPai.querySelector("video")) {
          let video = TagPai.querySelector("video");
          video.pause();
        }
        itens[currentIndex].classList.add("d-none");
        itens[currentIndex].classList.remove("animacao-direita", "animacao-esquerda");
      }

      // Mostra o próximo item e adiciona a animação
      itens[nextIndex].classList.remove("d-none");
      itens[nextIndex].classList.add(animationClass);
      let TagPai = itens[nextIndex];

      if (TagPai.querySelector("video")) {
        let video = TagPai.querySelector("video");
        video.play();
      }
    };

    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);





  function CliqueDireita() {
    const modal = document.getElementById('CriacaoModalTeste');

    if (modal && modal.className === '') {
      // Obtém todos os itens com classe dinâmica "z"
      const itens = document.querySelectorAll('[class^="z"]');
      let currentIndex = 0;

      // Encontra o item atualmente visível
      itens.forEach((item, index) => {
        if (!item.classList.contains('d-none')) {
          currentIndex = index;
        }
      });

      const tecla = event.key;
      let nextIndex = currentIndex;
      let animationClass = '';

      nextIndex = (currentIndex + 1) % itens.length;
      animationClass = 'animacao-esquerda';

      // Atualiza as classes para alternar os itens
      if (currentIndex !== -1) {
        let TagPai = itens[currentIndex];
        if(TagPai.querySelector('video'))
        {
         let video = TagPai.querySelector('video')
         video.pause();
        }
        itens[currentIndex].classList.add('d-none');
        itens[currentIndex].classList.remove('animacao-esquerda');
      }

      // Mostra o próximo item e adiciona a animação correspondente
      itens[nextIndex].classList.remove('d-none');
      itens[nextIndex].classList.add(animationClass);
      let TagPai = itens[nextIndex];
      if(TagPai.querySelector('video'))
      {
       let video = TagPai.querySelector('video')
       video.play();
      }
    }
  }


  function ClickEsquerda() {
    const modal = document.getElementById('CriacaoModalTeste');

    if (modal && modal.className === '') {
      // Obtém todos os itens com classe dinâmica "z"
      const itens = document.querySelectorAll('[class^="z"]');
      let currentIndex = 0;

      // Encontra o item atualmente visível
      itens.forEach((item, index) => {
        if (!item.classList.contains('d-none')) {
          currentIndex = index;
        }
      });

      let nextIndex = currentIndex;
      let animationClass = '';

      nextIndex = (currentIndex - 1 + itens.length) % itens.length;
      animationClass = 'animacao-direita';

      // Atualiza as classes para alternar os itens
      if (currentIndex !== -1) {
        let TagPai = itens[currentIndex];
        if(TagPai.querySelector('video'))
        {
         let video = TagPai.querySelector('video')
         video.pause();
        }
        itens[currentIndex].classList.add('d-none');
        itens[currentIndex].classList.remove('animacao-direita');
      }

      // Mostra o próximo item e adiciona a animação correspondente
      itens[nextIndex].classList.remove('d-none');
      itens[nextIndex].classList.add(animationClass);
      let TagPai = itens[nextIndex];
      if(TagPai.querySelector('video'))
      {
       let video = TagPai.querySelector('video')
       video.play();
      }
    }
  }

  //-------------------------------------------------------------Inicia Modal de Publi------------------------------------------------------------------------------------------

  function VerPubli(event) {
    let abrir_midia = event.currentTarget;
    abrir_midia = abrir_midia.className;
    abrir_midia = abrir_midia.split(" ");
    abrir_midia = abrir_midia[0].replace("x", "z");
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    document.body.style.overflow = 'hidden'; // Remove o scroll
    document.body.style.position = 'fixed'; // Mantém a posição fixa
    document.body.style.width = '100%'; // Evita bugs de layout
    document.getElementById('CriacaoModalTeste').className = "";
    document.querySelector('.' + abrir_midia).className = abrir_midia + " animacao-direita"
    let janelapai = document.querySelector('.' + abrir_midia);
    let video = janelapai.querySelector('video');
    if(video.paused)
    {
      video.play();
    }
  }

//-------------------------------------------------------------Fecha Modal de Publi-----------------------------------------------------------------------------------------
  function FechaMidiaView() {

    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    let quantidade = document.querySelectorAll('[class^="z"]');
    let casa = quantidade.length;
    document.getElementById('CriacaoModalTeste').className = 'd-none';
    for (let i = 0; i <= casa; i++) {

      document.querySelector(".z" + i).className = "z" + i + " d-none"
      let janelapai = document.querySelector(".z" + i)
      let video = janelapai.querySelector('video');
      if(video.play)
      {
        video.pause();
      }
    }
  }

//----------------------------------------------------------Abre e Fecha Janela Comentarios Mobile-------------------------------------------------------------------------

  function AbrirJanelaComentarios(event) {
    let TagAtual = event.currentTarget;
    let TagPai = TagAtual.parentElement;
    TagPai = TagPai.parentElement;
    TagPai = TagPai.parentElement;
    TagPai.querySelector('#Tela_de_Comentarios').style.display = 'block'
  }
  function FechaComentarios(event) {
    let TagAtual = event.currentTarget;
    let TagPai = TagAtual.parentElement;
    TagPai = TagPai.parentElement;
    TagPai.querySelector('#Tela_de_Comentarios').style.display = 'none'
  }

//----------------------------------------------------------------------------Enviar Comentario-----------------------------------------------------------------------------
async function EnviarComentario(event)
{
  let Tagatual = event.currentTarget;
  let TagPai = Tagatual.parentElement;
  TagPai = TagPai.parentElement;

  if(TagPai.querySelector('input').value.trim() != "")
  {
    let valorPubli = TagPai.querySelector('input').className;
    let Comentario = TagPai.querySelector('input').value;
    const Envia_Pedido = await fetch(`${apiUrl}/protected/EnviaComentario`,{     
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Inclui cookies na requisição
      body: JSON.stringify({ id: valorPubli, Comentario: Comentario }),
    }
    )
    const resultado = await Envia_Pedido.json();
    if(resultado.status = 200)
    {
      TagPai.querySelector('input').value = "";
    }
    else
    {
      alert("Erro ao Inserir Comentario")
    }
  }
  else
  {
    alert("Erro ao Inserir Comentario" + dadosUser.id)
  }
}
//-----------------------------------------------------------------------------------Função Segue Usuario-------------------------------------------------------------------------

async function seguirUser(event)
{
let tag_atual = event.currentTarget;
let Tag_Pai = tag_atual.parentElement; 
const enviapedido = await fetch(`${apiUrl}/protected/SeguirUsuario`,{
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Inclui cookies na requisição
  body: JSON.stringify({ id_seguir: Tag_Pai.querySelector('#IdUser').className }),
} )
const retorno = enviapedido.json();

}

function IrParaChat()
{

  window.location.href = `/Chat?id=${dadosUser.id}&nomeuser=${dadosUser.nickname}&imguser=${dadosUser.link_foto}`;

}
  //-------------------------------------------------------------------Curtir Publicação de Usuario------------------------------------------------------------------------------

  async function CurtirPubli(event) {
    const dados_publi = event.currentTarget;
    let manipulacao = dados_publi.className.split("/");
    const Envia_Pedido = await fetch(`${apiUrl}/protected/CurtirPubli`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Inclui cookies na requisição
      body: JSON.stringify({ id_dono: manipulacao[1], id_atual: manipulacao[2], publicacao: manipulacao[0] }),
    }
    )
    const resultado = await Envia_Pedido.json();


  }


  return (

    <div id="FundoGeral">

      <NavBarPerfil />

      <div id="CriacaoModalTeste" className="d-none">

        <div id="SetaDireita" onClick={CliqueDireita} className='d-none d-lg-block'>
          <img className="" src="../../../src/assets/icons/arrow-left.svg" alt="Troca Publi Pos" id="SetaDireitaImg" />
        </div>

        <div id="SetaEsquerda" onClick={ClickEsquerda} className='d-none d-lg-block'>
          <img className="" src="../../../src/assets/icons/arrow-right.svg" alt="Troca publi Anterior" id="SetaEsquerdaImg" />
        </div>

        <div className="container">
          <div id="Scroll" className="row">
            {CarregaFeed.map((conteudo, index) => {
              return (
                conteudo.Conteudo_Publicacao ? (
                  (
                    <>
                      {/\.(mp4|webm|ogg)$/i.test(conteudo.NomeExtesao) ? (
                        // Caso seja um vídeo
                        <div id="ControleJanela" className={"z" + index + " " + 'd-none '} key={index}>
                          <div className=" Midia_Tela">

                            <div className="d-flex" id="FundoTelaUsuarioFeed"  >
                              <ul>
                                <li className="nav-item d-flex ml-3">
                                  <img id="PerfildeUsuarioVerPubli" src={
                                    dadosUser.foto_perfil != null ? dadosUser.link_foto : '../../src/assets/perfil.png'} width="60" height='60'></img>
                                  <span id="IdUsuarioNickname" href="" className="nav-link ml-2 text-light ">{dadosUser.nickname}</span>
                                </li>
                              </ul>
                              <button onClick={FechaMidiaView} id="FecharMidiaMobile" className='btn btn-light d-sm-block d-lg-none'><img src='../../../src/assets/icons/x-lg.svg' ></img></button>
                            </div>


                            <video className="" controls>
                              <source src={conteudo.Conteudo_Publicacao} type={`video/${conteudo.NomeExtesao.split(".").pop()}`} />
                              Seu navegador não suporta o elemento de vídeo.
                            </video>

                            <div id="CurtirCompartilharEAbrirChat">
                            <img onClick={CurtirPubli}  id="CurtirPubliBloco" className={conteudo.id + "/" + dadosUser.id + "/" + dadosUser.id_user_atual} src={conteudo.curtido?"../../../src/assets/icons/heart-fill.svg" :"../../../src/assets/icons/heart.svg"}></img>
                              <img id="EncaminharPubliBloco" className="" src="../../../src/assets/icons/arrow-90deg-right.svg" width=""></img>
                              <img onClick={AbrirJanelaComentarios} id="ComentariosPubliMobile" className='d-sm-inline d-lg-none' src='../../../src/assets/icons/chat-square-dots.svg'></img>
                              <br />
                              <span id="EncaminharPubliTexto" className='text-light'>Curtir</span><span className='text-light'>Encaminhar</span>
                              <span className='text-light d-sm-inline d-lg-none'>Comentarios</span>
                            </div>


                          </div>
                          <div id="Tela_de_Comentarios" className="p-2 Fundo_Comentarios">
                            <button onClick={FechaMidiaView} id="BotaoSairMidiaView" className='btn btn-light d-none d-lg-inline'><img src='../../../src/assets/icons/x-lg.svg' ></img></button>
                            <button onClick={FechaComentarios} id="BotaoSairMidiaView" className='btn btn-light d-sm-inline d-lg-none'>Voltar</button>
                            <h4 className="text-light pl-4">Dados do Autor:</h4>
                            <div id="ComentarioDoAutor">
                              <span id="Autor" className="text-light pl-4 float-left">
                                <strong>{dadosUser.nickname}:</strong>
                              </span>
                              <span id="ComentarioAutor" className="text-light mt-2">
                                {conteudo.Comentario_Author === "" || conteudo.Comentario_Author === " " ? "Nada Adicionado" : conteudo.Comentario_Author}
                              </span>
                              <br />

                              <p className="text-light mt-3 text-center">
                                <strong>Comentarios </strong>
                              </p>
                              {...conteudo.comentarios.map((Conteudo) =>
                            (
                              Conteudo.nickname != null?
                              (
                              <p  className="text-light">
                                <strong>{Conteudo.nickname +": "}</strong>{Conteudo.comentario}
                              </p>
                              )
                              :
                              (
                              <p  className="text-light text-center">
                              <strong>Nenhum Comentario Adicionado</strong>
                            </p>
                              )
                            )
                            )}

                            </div>
                            <input id="InserirComentario" className={conteudo.id} placeholder='Insira um Comentario'></input>
                          <div className='d-flex justify-content-center'>
                          <button onClick={EnviarComentario} className='btn btn-outline-light mt-1'>Adicionar Comentario</button>
                          </div>
                          </div>
                        </div>
                      ) : (
                        // Caso seja uma imagem
                        <div id="ControleJanela" className={"z" + index + " " + 'd-none'} key={index}>
                          <div className=" Midia_Tela">

                            <div className="d-flex" id="FundoTelaUsuarioFeed"  >
                              <ul>
                                <li className="nav-item d-flex ml-3">
                                  <img id="PerfildeUsuarioVerPubli" src={
                                    dadosUser.foto_perfil != null ? dadosUser.link_foto : '../../src/assets/perfil.png'} width="60" height='60'></img>
                                  <span id="IdUsuarioNickname" href="" className="nav-link ml-2 text-light ">{dadosUser.nickname}</span>
                                </li>
                              </ul>
                              <button onClick={FechaMidiaView} id="FecharMidiaMobile" className='btn btn-light d-sm-block d-lg-none'><img src='../../../src/assets/icons/x-lg.svg' ></img></button>

                            </div>



                            <img id="ImagemAddBorda" className="" src={conteudo.Conteudo_Publicacao} alt="Publicação" />

                            <div id="CurtirCompartilharEAbrirChat">
                              <img onClick={CurtirPubli}  id="CurtirPubliBloco" className={conteudo.id + "/" + dadosUser.id + "/" + dadosUser.id_user_atual} src={conteudo.curtido?"../../../src/assets/icons/heart-fill.svg" :"../../../src/assets/icons/heart.svg"}></img>
                              <img id="EncaminharPubliBloco" className="" src="../../../src/assets/icons/arrow-90deg-right.svg" width=""></img>
                              <img onClick={AbrirJanelaComentarios} id="ComentariosPubliMobile" className='d-sm-inline d-lg-none' src='../../../src/assets/icons/chat-square-dots.svg'></img>
                              <br />
                              <span id="EncaminharPubliTexto" className='text-light'>Curtir</span><span className='text-light'>Encaminhar</span>
                              <span className='text-light d-sm-inline d-lg-none'>Comentarios</span>
                            </div>

                          </div>


                          <div id="Tela_de_Comentarios" className="p-2 Fundo_Comentarios">
                            <button onClick={FechaMidiaView} id="BotaoSairMidiaView" className='btn btn-light d-none d-lg-inline'><img id="ImagemBotao" src='../../../src/assets/icons/x-lg.svg'  ></img></button>
                            <button onClick={FechaComentarios} id="BotaoSairMidiaView" className='btn btn-light d-sm-inline d-lg-none'>Voltar</button>
                            <h4 className="text-light pl-4">Dados do Autor:</h4>
                            <div id="ComentarioDoAutor">
                              <span id="Autor" className="text-light pl-4 float-left">
                                <strong>{dadosUser.nickname}:</strong>
                              </span>
                              <span id="ComentarioAutor" className="text-light mt-2">
                                {conteudo.Comentario_Author === "" || conteudo.Comentario_Author === " " ? "Nada Adicionado" : conteudo.Comentario_Author}
                              </span>
                              <br />

                              <p className="text-light mt-3 text-center">
                                <strong>Comentarios </strong>
                              </p>
                              {...conteudo.comentarios.map((Conteudo) =>
                            (
                              Conteudo.nickname != null?
                              (
                              <p  className="text-light">
                                <strong>{Conteudo.nickname +": "}</strong>{Conteudo.comentario}
                              </p>
                              )
                              :
                              (
                              <p  className="text-light text-center">
                              <strong>Nenhum Comentario Adicionado</strong>
                            </p>
                              )
                            )
                            )}

                            </div>
                            <input id="InserirComentario" className={conteudo.id} placeholder='Insira um Comentario'></input>
                          <div className='d-flex justify-content-center'>
                          <button onClick={EnviarComentario} className='btn btn-outline-light mt-1'>Adicionar Comentario</button>
                          </div>
                          </div>
                        </div>
                      )}
                    </>
                  )
                ) : (
                  <p className="text-light">"Nada Aqui"</p>
                )
              );
            })}
          </div>
        </div>
      </div>


      <section id='FundoPerfil'>
        <div id="FundoContainerPerfil" className='container'>
          <div id="AlertaPerfil" className='d-block'></div>
          <div className='row'>
            <div className='col-md-6'>
              <div className='d-flex justify-content-center'>
                <img id='PerfilDeUsuarioEdit' src={
                  dadosUser.foto_perfil != null ? dadosUser.link_foto : '../../src/assets/perfil.png'
                } width={325} height={325}>
                </img>
              </div>
              <br />


            </div>
            <div className='col-md-6 '>
              <h1 className='text-center text-light display-4'>
                Bem Vindo ao Perfil de:
              </h1>
              <h1 className='text-center text-light display-4'>
                {
                  dadosUser.nome
                }
              </h1>
              <span className='text-white mr-1'><strong>Seguidores: </strong> {dadosUser.voceSegue ? "Você +"+dadosUser.total_seguidores : dadosUser.total_seguidores}  </span> <span className='text-white ml-1'><strong>Seguindo: </strong> {dadosUser.seguindoVoce == true ?"Você + "+ dadosUser.total_seguindo:dadosUser.total_seguindo}</span><span id="IdUser" className={url.get("id")}></span> <a onClick={seguirUser} id="SeguirUsuarioPerfil" className='text-light btn btn-outline-light'>{dadosUser.voceSegue?"Deixar de Seguir": "Seguir"}</a><br/>
              <a onClick={IrParaChat} id="" className='text-light btn btn-outline-light'>Enviar Mensagem</a>
              <h4 className='text-light my-4'>
                Nick do User Atual
              </h4>
              <span id="NickAtual" className='text-light'>
                {
                  dadosUser.nickname
                }
              </span>


              <h4 className=' text-light mt-5'>
                Bio Atual
              </h4>
              <br />
              <p className='text-light'>
                {
                  dadosUser.mensagem_bio != null && dadosUser.mensagem_bio != "" ? dadosUser.mensagem_bio : "Nenhuma Bio Adicionada"
                }
              </p>


            </div>
            <div className='col-md-12 d-flex justify-content-center'>
              <h1 id="TextoFeed" className='text-light mt-4 display-4'>
                Feed
              </h1>
            </div>
            <div id="BordaPubli" className='col-md-12'>
              <nav id="NavBarPubli" className="navbar navbar-expand-sm">
                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
                  <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse d-flex justify-content-center" id="navbarNavAltMarkup">
                  <div className="navbar-nav ">
                    <a className="nav-item btn active text-light text-center" href="">Publicações de : {dadosUser.nickname}</a>
                  </div>
                </div>
              </nav>
            </div>
            {CarregaFeed.map((conteudo, index) => {

              return (
                conteudo.Conteudo_Publicacao ? (
                  <>
                    {/\.(mp4|webm|ogg)$/i.test(conteudo.NomeExtesao) ? (
                      // Caso seja um vídeo
                      <div id="PubliBackground" className='col-md-4 ' >
                        <video
                          id="Midia_Selecionada"
                          onClick={VerPubli}
                          className={"x" + index}
                        >
                          <source
                            src={conteudo.Conteudo_Publicacao}
                            type={`video/${conteudo.NomeExtesao.split(".").pop()}`}
                          />
                          Seu navegador não suporta o elemento de vídeo.
                        </video>



                        <span id="Comentario" className='text-light text-center text-truncate'> {conteudo.Comentario_Author == "" || conteudo.Comentario_Author == " " ? "Nada Adicionado" : conteudo.Comentario_Author}  </span>

                        <a id="Valor_user" ></a>

                        <p className='text-light'><strong>Comentarios : {conteudo.total_comentarios != 0 ? conteudo.total_comentarios + " Comentarios" : "Nenhum comentario"}</strong></p>

                        <br />
                      </div>



                    ) : (
                      <div id="PubliBackground" className='col-md-4 '>
                        <img onClick={VerPubli} id="Midia_Selecionada" className={"x" + index + " imagemConfig "} src={conteudo.Conteudo_Publicacao} ></img>

                        <span id="Comentario" className='text-light text-center text-truncate'> {conteudo.Comentario_Author == "" || conteudo.Comentario_Author == " " ? "Nada Adicionado" : conteudo.Comentario_Author}  </span>

                        <a id="Valor_user">
                        </a>

                        <p className='text-light'><strong>Comentarios : {conteudo.total_comentarios != 0 ? conteudo.total_comentarios + " Comentarios" : "Nenhum comentario"}</strong></p>

                        <br />
                      </div>
                    )}
                  </>

                )
                  : <p className='text-light text-center'>Nada Aqui Por aqui</p>
              )
            }

            )}
            {CarregaFeed.length > 0 ? '' : <p className='text-light text-center col-md-12 mt-3'>Nada Adicionado</p>}
          </div>

        </div>
      </section>


    </div>

  )
}

export default OutroUser