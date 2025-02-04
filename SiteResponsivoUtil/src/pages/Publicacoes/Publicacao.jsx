import React, { useEffect, useState } from "react";

import './Publicacao.css';

import NavBarPublicacoes from '../../component/NavBarPublicacoes';

const apiUrl = import.meta.env.VITE_BackEndUrl;

function Publicacao() {

  const [CarregaFeed, setCarregaFeed] = useState([]);
  const [feedType, setFeedType] = useState('recomendado'); // 'recomendado' ou 'seguindo'

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (isMounted) {
        if (feedType === 'recomendado') {
          await CarregaFeedUserRecomendado();
        } else if (feedType === 'seguindo') {
          await CarregaFeedSeguindo();
        }
        setTimeout(fetchProfile, 500); // Recarrega após 5 segundos
      }
    };

    fetchProfile();

    return () => {
      isMounted = false; // Limpa a execução em caso de desmontagem
    };
  }, [feedType]); // Recarrega quando o tipo de feed mudar

  // Função para carregar o feed recomendado
  async function CarregaFeedUserRecomendado() {
    const Envia_Pedido = await fetch(`${apiUrl}/protected/CarregaFeedRecomendado`, {
      method: 'get',
      credentials: 'include',
    });
    const resultado = await Envia_Pedido.json();

    if (resultado.status === 200) {
      setCarregaFeed(resultado.message);
    } else {
      window.location.replace("/Login?erro");
    }
  }

  // Função para carregar o feed de publicações dos usuários seguidos
  async function CarregaFeedSeguindo() {
    const Envia_Pedido = await fetch(`${apiUrl}/protected/CarregaFeedSeguindo`, {
      method: 'get',
      credentials: 'include',
    });
    const resultado = await Envia_Pedido.json();

    if (resultado.status === 200) {
      console.log(resultado)
      if(resultado.message[0] != undefined)
      {
      setCarregaFeed(resultado.message);
      }
      else{
        setCarregaFeed([0]);
      }
    } else {
      window.location.replace("/Login?erro");
    }
  }

  // Função para alternar entre os tipos de feed (seguindo ou recomendado)
  const handleFeedChange = (type) => {
    setFeedType(type);
  };
  //---------------------------------------------------------------------------Entrar no Perfil de Usuario-------------------------------------------------------------------------------

  function PerfilDeVisitante(event) {
    let TagAtual = event.currentTarget;
    TagAtual = TagAtual.className;
    window.location.href = 'http://localhost:5173/VerPerfil?id=' + TagAtual;
  }

  //-------------------------------------------------------------------------------Enviar Comentario-------------------------------------------------------------------------------

  async function EnviarComentario(event) {
    let Tagatual = event.currentTarget;
    let TagPai = Tagatual.parentElement;
    TagPai = TagPai.parentElement;
    if (TagPai.querySelector('input').value.trim() != "") {

      let valorPubli = TagPai.querySelector('input').className;
      let Comentario = TagPai.querySelector('input').value;
      const Envia_Pedido = await fetch(`${apiUrl}/protected/EnviaComentario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Inclui cookies na requisição
        body: JSON.stringify({ id: valorPubli, Comentario: Comentario }),
      }
      )
      const resultado = await Envia_Pedido.json();
      if (resultado.status = 200) {
        TagPai.querySelector('input').value = "";
      }
      else {
        alert("Erro ao Inserir Comentario")
      }
    }
  }

  //-------------------------------------------------------------------Função Vizualiza Publi Modal--------------------------------------------------------------------------------------

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
        if (TagPai.querySelector('video')) {
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
      if (TagPai.querySelector('video')) {
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
        if (TagPai.querySelector('video')) {
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
      if (TagPai.querySelector('video')) {
        let video = TagPai.querySelector('video')
        video.play();
      }
    }
  }

  //----------------------------------------------------------------------------Ativar Modal Publi--------------------------------------------------------------------------------------

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
    if (video.paused) {
      video.play();
    }
  }

  //------------------------------------------------------------------Fecha Modal--------------------------------------------------------------------------------------------------

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
      if (video.play) {
        video.pause();
      }
    }
  }

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

  async function seguirUser(event) {
    let tag_atual = event.currentTarget;
    let Tag_Pai = tag_atual.parentElement;
    const enviapedido = await fetch(`${apiUrl}/protected/SeguirUsuario`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Inclui cookies na requisição
      body: JSON.stringify({ id_seguir: Tag_Pai.querySelector('#IdUser').className }),
    })
    const retorno = enviapedido.json();

  }
  //----------------------------------------------------------------Função botão Voltar para o Topo-------------------------------------------------------------------------------
  function VoltarTopo() {
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    <>
      <NavBarPublicacoes />

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
                  <>
                    {/\.(mp4|webm|ogg)$/i.test(conteudo.NomeExtesao) ? (
                      // Caso seja um vídeo
                      <div id="ControleJanela" className={"z" + index + " " + 'd-none '} key={index}>

                        <div className=" Midia_Tela">


                          <div className="d-flex" id="FundoTelaUsuarioFeed"  >
                            <ul onClick={PerfilDeVisitante} id="PerfilUsuarioevent" className={conteudo.id_dono_publi}>
                              <li className="nav-item d-flex ">
                                <img id="PerfildeUsuarioVerPubli" src={
                                  conteudo.NomeExtesao != null ? conteudo.foto_perfil : '../../src/assets/perfil.png'} width="60" height='60'></img>
                                <span id="IdUsuarioNickname" href="" className="nav-link text-light ">{conteudo.nick_autor_publi}</span>
                              </li>
                            </ul>
                            <a onClick={seguirUser} id="SeguiruserBloco" className="btn btn-outline-light text-light"> {conteudo.seguindoAutor ? "Seguindo" : "Seguir"}</a>
                            <button onClick={FechaMidiaView} id="FecharMidiaMobile" className='btn btn-light d-sm-block d-lg-none'><img src='../../../src/assets/icons/x-lg.svg' ></img></button>
                          </div>


                          <video className="" controls>
                            <source src={conteudo.Conteudo_Publicacao} type={`video/${conteudo.NomeExtesao.split(".").pop()}`} />
                            Seu navegador não suporta o elemento de vídeo.
                          </video>

                          <div id="CurtirCompartilharEAbrirChat">
                            <img onClick={CurtirPubli} id="CurtirPubliBloco" className={conteudo.id_da_Publicacao + "/" + conteudo.id_dono_publi + "/" + conteudo.id_usuario_atual} src={conteudo.curtido ? "../../../src/assets/icons/heart-fill.svg" : "../../../src/assets/icons/heart.svg"}></img>
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
                          <h4 className="text-light pl-4">Comentario do Autor:</h4>
                          <div id="ComentarioDoAutor">
                            <span id="Autor" className="text-light pl-4 float-left">
                              <strong>{conteudo.nick_autor_publi}:</strong>
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
                              Conteudo.nick_autor_comentario != null ?
                                (
                                  <p className="text-light">
                                    <strong>{Conteudo.nick_autor_comentario + ": "}</strong>{Conteudo.comentario}
                                  </p>
                                )
                                :
                                (
                                  <p className="text-light text-center">
                                    <strong>Nenhum Comentario Adicionado</strong>
                                  </p>
                                )
                            )
                            )}

                          </div>
                          <input id="InserirComentario" className={conteudo.id_da_Publicacao} placeholder='Insira um Comentario'></input>
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
                            <ul onClick={PerfilDeVisitante} id="PerfilUsuarioevent" className={conteudo.id_dono_publi}>
                              <li className="nav-item d-flex ">
                                <img id="PerfildeUsuarioVerPubli" src={
                                  conteudo.NomeExtesao != null ? conteudo.foto_perfil : '../../src/assets/perfil.png'} width="60" height='60'></img>
                                <span id="IdUsuarioNickname" href="" className="nav-link text-light ">{conteudo.nick_autor_publi}</span>
                              </li>
                            </ul>
                            <a onClick={seguirUser} id="SeguiruserBloco" className="btn btn-outline-light text-light"> {conteudo.seguindoAutor ? "Seguindo" : "Seguir"}</a>
                            <button onClick={FechaMidiaView} id="FecharMidiaMobile" className='btn btn-light d-sm-block d-lg-none'><img src='../../../src/assets/icons/x-lg.svg' ></img></button>
                          </div>

                          <img id="ImagemAddBorda" className="" src={conteudo.Conteudo_Publicacao} alt="Publicação" />

                          <div id="CurtirCompartilharEAbrirChat">

                            <img onClick={CurtirPubli} id="CurtirPubliBloco" className={conteudo.id_da_Publicacao + "/" + conteudo.id_dono_publi + "/" + conteudo.id_usuario_atual} src={conteudo.curtido ? "../../../src/assets/icons/heart-fill.svg" : "../../../src/assets/icons/heart.svg"}></img>
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
                          <h4 className="text-light pl-4">Comentario do Autor:</h4>
                          <div id="ComentarioDoAutor">
                            <span id="Autor" className="text-light pl-4 float-left">
                              <strong>{conteudo.nick_autor_publi}:</strong>
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
                              Conteudo.nick_autor_comentario != null ?
                                (
                                  <p className="text-light">
                                    <strong>{Conteudo.nick_autor_comentario + ": "}</strong>{Conteudo.comentario}
                                  </p>
                                )
                                :
                                (
                                  <p className="text-light text-center">
                                    <strong>Nenhum Comentario Adicionado</strong>
                                  </p>
                                )
                            )
                            )}
                          </div>
                          <input id="InserirComentario" className={conteudo.id_da_Publicacao} placeholder='Insira um Comentario'></input>
                          <div className='d-flex justify-content-center'>
                            <button onClick={EnviarComentario} className='btn btn-outline-light mt-1'>Adicionar Comentario</button>
                          </div>
                          <div>

                          </div>
                        </div>

                      </div>
                    )}
                  </>

                ) : (
                  <p className="text-light">"Nada Aqui"</p>
                )
              );
            })}
          </div>
        </div>
      </div>


      <div className="Fundo ">
        <nav className="navbar navbar-expand-sm py-3" id="NavBarPubli">
          <div className="container">

            <div className="collapse navbar-collapse d-flex justify-content-center" id="nav-principal">

              <ul className="navbar-nav" id="linknav">
                <li className="nav-item" id="item-hover3">
                  <a  onClick={() => handleFeedChange('recomendado')} className="nav-link btn btn-outline-light text-light ">Publicações Recomendadas</a>
                </li>
                <li className="nav-item " id="item-hover3">
                  <a  onClick={() => handleFeedChange('seguindo')} className="nav-link btn btn-outline-light text-light ">Publicações De Seguidores</a>
                </li>
              </ul>

            </div>

          </div>
        </nav>
        <section className="Filtro">
          <div className="container">
            <div className="row">

              {CarregaFeed.map((Valor, index) =>
              (
                Valor != 0 ?
                  <div className="mt-3" id="BordaFundoPublicacao" key={index} >
                    <div className="" id="PerfilUser" >
                      <ul onClick={PerfilDeVisitante} id="PerfilUsuarioevent" className={Valor.id_dono_publi}>
                        <li id="NomeUserBloco" className="nav-item d-flex ml-3">
                          <img id="imgusuario" src={Valor.foto_perfil != import.meta.env.VITE_BackEndVerify ? Valor.foto_perfil : '../src/assets/perfil.png'} width="50" height='50'></img>
                          <span id="" href="" className="nav-link ml-1 text-light NomeUser">{Valor.nick_autor_publi}</span><span id="IdUser" href="" className={Valor.id_dono_publi}></span>
                        </li>
                      </ul>
                      <a onClick={seguirUser} id="SeguirUsuario" className="btn btn-outline-light text-light"> {Valor.seguindoAutor ? "Seguindo" : "Seguir"}</a>
                    </div>
                    <div id="AreaClicavel">
                      <div className="d-flex" id='VideoImagePubli'>
                        {/\.(mp4|webm|ogg)$/i.test(Valor.Conteudo_Publicacao) ?
                          <video onClick={VerPubli} className={"x" + index} >
                            <source src={Valor.Conteudo_Publicacao} type={`video/${Valor.Conteudo_Publicacao.split(".").pop()}`} />
                          </video>
                          : <img onClick={VerPubli} id="" src={Valor.Conteudo_Publicacao} alt="" className={"x" + index} />

                        }

                      </div>
                      <div id="Espacamento_Comentarios" >
                        <div id="AlinhamentoComentarios" className="">
                          <p className="text-light float-left " id="Comentarios"><strong>{Valor.nick_autor_publi} </strong>{Valor.Comentario_Author != null && Valor.Comentario_Author != "" ? Valor.Comentario_Author : "Nenhum Comentario Adicionado"}</p>

                          <img onClick={CurtirPubli} id="Curtir" className={Valor.id_da_Publicacao + "/" + Valor.id_dono_publi + "/" + Valor.id_usuario_atual} src={Valor.curtido ? "../../../src/assets/icons/heart-fill.svg" : "../../../src/assets/icons/heart.svg"}></img>
                          <img id="Encaminhar" className="" src="../../../src/assets/icons/arrow-90deg-right.svg"></img>

                        </div>
                        <div id="AlinhamentoComentarios" className="">
                          <p className="text-light text-center"><strong>Comentários</strong></p>
                          {...Valor.comentarios.map((mensagens, index) => (
                            index < 2 ?
                              (
                                mensagens.comentario != null ? (
                                  <>
                                    <p className="text-light text-truncate"><strong>{mensagens.nick_autor_comentario + " :"}</strong> {mensagens.comentario}</p>
                                  </>
                                ) :
                                  <>
                                    <p className="text-light text-truncate text-center"><strong>Nenhum Comentario Adicionado</strong> </p>
                                  </>

                              )
                              :
                              <>
                      
                              </>

                          ))}



                          <p className="text-light text-center" ><strong> {Valor.total_comentarios > 0 ? +Valor.total_comentarios + " Comentarios" : "Nenhum Comentario Adicionado"} </strong></p>
                        </div>
                        <div id="InserirComentarioPubli">
                          <input id="InputInserirComentario" placeholder="Inserir Comentario" className={Valor.id_da_Publicacao} ></input><button id="EnviarComentario" onClick={EnviarComentario} className="btn btn-outline-light text-light">Enviar </button>
                        </div>
                      </div>
                    </div>

                  </div>
                  : <div className="container ">
                  <h1 className="text-light text-center Display-4">Você Não Segue nenhum usuario</h1>
                  <div className="d-flex justify-content-center">
                  <img className="NaoSegue" src="../../../src/assets/Cavajo.jpg"></img>
                  </div>
                  </div>
              )

              )}


            </div>

          </div>
        </section>
        <div id="VoltarTop">
          <button onClick={VoltarTopo}>
            <img src="../../../src/assets/icons/arrow-up-circle-fill.svg" alt="" className="VoltarTopoImg" />
          </button>
        </div>
      </div>
    </>
  )
}

export default Publicacao