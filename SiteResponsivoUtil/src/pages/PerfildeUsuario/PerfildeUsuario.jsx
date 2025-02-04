import './PerfildeUsuario.css';
import NavBarPerfil from '../../component/NavBarPerfil';
import React, { useEffect, useState } from "react";

const apiUrl = import.meta.env.VITE_BackEndUrl;

function PerfildeUsuario() {
  const [dadosUser, setDadosUser] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [CarregaFeed, setCarregaFeed] = useState([])
  // Função para carregar o perfil do usuário


  //--------------------------------------------------------------------------------Função para Recarregar o FEED------------------------------------------------------------------------ 

  const CarregaoFeed = async () => {
    try {
      const response = await fetch(`${apiUrl}/protected/EnviaPubliFront`, {
        method: 'get',
        credentials: 'include',
      });

      const result = await response.json();
      if (result.status === '400') {

      } else {
        setCarregaFeed(result.message);
      }
    } catch (error) {
      console.error('Erro ao carregar o perfil:', error);
    } finally {
    }

  }

  const carregaPerfil = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/protected`, {
        method: 'GET',
        credentials: 'include',
      });

      const result = await response.json();
      if (result.status === '400') {
        window.location.replace('/Login?erro');
      } else {

        setDadosUser(result.dados);
      }
    } catch (error) {
      console.error('Erro ao carregar o perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Atualiza os dados do perfil periodicamente
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (isMounted) {
        await carregaPerfil();
        await CarregaoFeed();
        setTimeout(fetchProfile, 5000); // Recarrega após 5 segundos
      }
    };

    fetchProfile();

    return () => {
      isMounted = false; // Limpa a execução em caso de desmontagem
    };
  }, []);


  //--------------------------------------------------------------------Função Envia Foto Perfil----------------------------------------------------------------------------------------


  function EnviarFotoPerfil() {

    const fileInput = document.getElementById('EnviaFotoPerfil');
    fileInput.click();

    // Evento para tratar a seleção do arquivo
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0]; // Obter o arquivo selecionado
      if (file) {
        const formData = new FormData();
        formData.append('image', file); // Adiciona o arquivo ao FormData

        try {
          const response = await fetch(`${apiUrl}/protected/envio/fotoPerfil`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
          });

          if (response.ok) {


          } else {
            document.getElementById('AlertaPerfil').innerHTML = '<div id="AlertaErro" class="alert alert-danger alert-dismissible fade show" role="alert"><strong>  </strong><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>';
          }
        } catch (error) {
          console.error('Erro de rede:', error);
        }
      }
    });
  }


  //-----------------------------------------------------------------------Envia Nick Ou Altera-------------------------------------------------------------------------------------------


  async function EnviaNickAltera() {

    const nick = document.getElementById('InputNickNovo').value;
    // Verificar se o campo está vazio
    if (!nick.trim()) {
      document.getElementById('Erro').innerText = "Erro Insira Algo no Campo"
      document.getElementById('Erro').className = "text-danger text-center"
      return;
    }

    // Enviar o nickname ao servidor via fetch
    const response = await fetch(`${apiUrl}/protected/TrocaNick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Inclui cookies na requisição
      body: JSON.stringify({ NickNovo: nick }),
    });

    const result = await response.json();
    if (result.status == 400) {
      document.getElementById('Erro').innerText = "Erro Usuário Inserido já existe"
      document.getElementById('Erro').className = "text-danger text-center"
    }
    else {
      document.getElementById('Erro').innerText = "Nick de Usuario Atualizado Com Sucesso"
      document.getElementById('Erro').className = "text-success text-center"
      document.getElementById('InputNickNovo').value = ""
      setTimeout(() => { document.getElementById('Erro').innerText = "" }, 3000)
    }
  }


  //----------------------------------------------------------------------------Funcao Envia Bio---------------------------------------------------------------------------------------

  async function EnviaAddBio() {
    let bio = document.getElementById('InserirBio').value;
    bio = bio.trim()
    // Enviar o nickname ao servidor via fetch
    const response = await fetch(`${apiUrl}/protected/AddTrocaBio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Inclui cookies na requisição
      body: JSON.stringify({ BioNova: bio }),
    });
    const result = await response.json();
    if (result.status == 200) {
      document.getElementById('ErroBio').innerText = "Bio de Usuario Atualizado Com Sucesso"
      document.getElementById('ErroBio').className = "text-success text-center"
      document.getElementById('InserirBio').value = ""
      setTimeout(() => { document.getElementById('Erro').innerText = "" }, 3000)
    }
    else {
      document.getElementById('ErroBio').innerText = "Erro Ao Inserir Bio"
      document.getElementById('ErroBio').className = "text-danger text-center"
    }

  }


  //------------------------------------------------------------------------Função Adiciona Publi-----------------------------------------------------------------------------------------


  function AdicionarPubli() {
    // Obtém o elemento de input de arquivo
    const inputElement = document.getElementById('InserirPublicacao');
    inputElement.click();
    // Obtém os elementos de visualização
    const imagemElement = document.getElementById('ImagemPubli');
    const videoElement = document.getElementById('VideoPubli');
    inputElement.addEventListener('change', async () => {
      // Verifica se há arquivos no input
      if (inputElement.files && inputElement.files[0]) {
        const file = inputElement.files[0];
        const fileType = file.type;

        // Define os tipos permitidos
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
        const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];

        // Reseta a exibição anterior
        imagemElement.classList.add('d-none');
        videoElement.classList.add('d-none');
        videoElement.src = '';
        imagemElement.src = '';

        if (allowedImageTypes.includes(fileType)) {
          const reader = new FileReader();
          reader.onload = function (e) {
            imagemElement.src = e.target.result;
            imagemElement.classList.remove('d-none');
          };
          reader.readAsDataURL(file);
          document.getElementById('ErroPerfil').innerText = "";
          document.getElementById('ErroPerfil').className = "d-none"
        }
        else if (allowedVideoTypes.includes(fileType)) {
          const reader = new FileReader();
          reader.onload = function (e) {
            videoElement.src = e.target.result;
            videoElement.classList.remove('d-none');
          };
          reader.readAsDataURL(file);
          document.getElementById('ErroPerfil').innerText = "";
          document.getElementById('ErroPerfil').className = "d-none"
        } else {
          document.getElementById('ErroPerfil').innerText = "Insira um tipo Valido";
          document.getElementById('ErroPerfil').className = "text-center text-danger"
        }
      } else {

      }
    })
  }

  //--------------------------------------------------------------------Função Envia Publi Selecionada-------------------------------------------------------------------------------

  async function EnviaAddPubli() {
    let arrayTemas = [];
    const userId = dadosUser.id;
    const inputFile = document.getElementById('InserirPublicacao');
    const videoElement = document.getElementById('VideoPubli');
    const imageElement = document.getElementById('ImagemPubli');
    const commentInput = document.getElementById('InserirComentario');
    const errorElement = document.getElementById('ErroPerfil');
    const TemasSelecionados = document.querySelectorAll('.Tema'); // Melhorado seletor de classe
    let aceito = false;

    // Resetando mensagem de erro
    errorElement.innerText = '';
    errorElement.className = '';

    // Verificação das hashtags
    if (TemasSelecionados.length > 0) {
        TemasSelecionados.forEach((tema) => {
            if (tema.innerText.trim()) {
                arrayTemas.push(tema.innerText.trim());
                aceito = true;
            }
        });
    }

    if (!aceito) {
        errorElement.innerText = "Nenhuma Hashtag Selecionada";
        errorElement.className = "text-center text-danger";
        return;
    }

    // Verifica se o arquivo foi selecionado
    if (!inputFile.files || inputFile.files.length === 0) {
        errorElement.innerText = 'Nenhuma mídia selecionada.';
        errorElement.className = 'text-center text-danger';
        return;
    }

    const file = inputFile.files[0];
    const fileType = file.type;

    // Tipos permitidos
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];

    if (![...allowedImageTypes, ...allowedVideoTypes].includes(fileType)) {
        errorElement.innerText = 'Arquivo inválido. Apenas imagens ou vídeos são permitidos.';
        errorElement.className = 'text-center text-danger';
        return;
    }

    // Preparação dos dados para envio
    const formData = new FormData();
    formData.append('id', userId);
    formData.append('media', file);
    formData.append('comment', commentInput.value.trim());
    formData.append('HashTags', JSON.stringify(arrayTemas)); // Envia o array corretamente

    try {
        if (aceito) {
            const response = await fetch(`${apiUrl}/protected/AddPubli`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const result = await response.json(); // Corrigido o await para obter a resposta JSON

            if (!response.ok) {
                let modal = document.getElementById('AbreModalErro');
                document.getElementById('ErroEmQuestao').innerText = result.message || "Erro desconhecido.";
                modal.click();
                return;
            }

            // Sucesso no envio
            errorElement.innerText = 'Publicação Enviada Com Sucesso';
            errorElement.className = 'text-center text-success';

            setTimeout(() => {
                errorElement.innerText = "";
                errorElement.className = "";
            }, 3000);

            // Limpa os elementos de mídia
            videoElement.src = '';
            videoElement.classList.add('d-none');
            imageElement.src = '';
            imageElement.classList.add('d-none');
            for(let i =0 ; i<4 ; i++)
            {
              TemasSelecionados[i].innerText = "";
            }

            // Limpa os inputs
            inputFile.value = '';
            commentInput.value = '';
        }
    } catch (error) {
        errorElement.innerText = "Erro ao enviar publicação. Tente novamente.";
        errorElement.className = 'text-center text-danger';
        console.error('Erro ao enviar publicação:', error);
    }
}


  //-----------------------------------------------------------------------Função Para apagar Publicações----------------------------------------------------------------------------

  function DeletarPublicacao(event) {
    let valorClicado = event.currentTarget;
    let TagPai = valorClicado.parentElement;

    if (TagPai.querySelector('video')) {

      let id_publi = TagPai.querySelector('#Valor_user').className;

      document.querySelector('#ImagemDelete').className = "d-none";

      document.querySelector('#ImagemDelete').src = "";

      let video = TagPai.querySelector('source');

      let comentario = TagPai.querySelector('#Comentario');

      let src = video.src;

      document.querySelector("#VideoDelete").className = id_publi;

      document.getElementById("VideoDelete").src = src;

      document.getElementById("comentarioPubli").innerText = comentario.innerText;

    }
    else {

      let id_publi = TagPai.querySelector('#Valor_user').className;

      document.querySelector("#VideoDelete").className = "d-none";

      document.getElementById("VideoDelete").src = "";

      let imagem = TagPai.querySelector('#Midia_Selecionada');

      let comentario = TagPai.querySelector('#Comentario');

      let src = imagem.src;

      document.querySelector("#ImagemDelete").className = id_publi;

      document.getElementById("ImagemDelete").src = src;

      document.getElementById("comentarioPubli").innerText = comentario.innerText;

    }



  }
  async function ConfirmaDelecao(event) {

    const modalElement = document.getElementById('ModalApagaPubli');
    const modal = new bootstrap.Modal(modalElement);

    let tagAtual = event.currentTarget;
    let tagPai = tagAtual.parentElement;
    tagPai = tagPai.parentElement;
    if (tagPai.querySelector('#VideoDelete').src != "http://localhost:5173/PerfilDeUsuario") {
      let EnviaDelete = tagPai.querySelector('#VideoDelete').className;
      const envia = await fetch(`${apiUrl}/protected/ApagaPubli`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Inclui cookies
        body: JSON.stringify({ EnviaDeletar: EnviaDelete })
      });
      if (envia.ok) {
        document.querySelector("#VideoDelete").className = "d-none";

        document.getElementById("VideoDelete").src = "";

        document.querySelector('#ImagemDelete').className = "d-none";

        document.querySelector('#ImagemDelete').src = "";

        tagPai.querySelector('#comentarioPubli').innerText = ""

        tagPai.querySelector('#ErroDelete').className = "text-center text-success"
        tagPai.querySelector('#ErroDelete').innerText = "Excluido com Sucesso"

        setTimeout(() => { tagPai.querySelector('#ErroDelete').innerText = ""; modal.hide() }, 3000);

      }
      else {
        tagPai.querySelector('#ErroDelete').className = "text-center text-danger"
        tagPai.querySelector('#ErroDelete').innerText = "Erro Ao Excluir, Tente Novamente"
      }

    }
    else {
      let EnviaDelete = tagPai.querySelector('#ImagemDelete').className;
      const envia = await fetch(`${apiUrl}/protected/ApagaPubli`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Inclui cookies
        body: JSON.stringify({ EnviaDeletar: EnviaDelete })
      });
      if (envia.ok) {
        document.querySelector("#VideoDelete").className = "d-none";

        document.getElementById("VideoDelete").src = "";

        document.querySelector('#ImagemDelete').className = "d-none";

        document.querySelector('#ImagemDelete').src = "";
        tagPai.querySelector('#comentarioPubli').innerText = ""
        tagPai.querySelector('#ErroDelete').className = "text-center text-success"
        tagPai.querySelector('#ErroDelete').innerText = "Excluido com Sucesso"
        setTimeout(() => { tagPai.querySelector('#ErroDelete').innerText = ""; modal.hide() }, 3000);
      }
      else {
        tagPai.querySelector('#ErroDelete').className = "text-center text-danger"
        tagPai.querySelector('#ErroDelete').innerText = "Erro Ao Excluir, Tente Novamente"
      }

    }

  }

  function CancelaDelecao() {
    document.querySelector("#VideoDelete").className = "d-none";

    document.getElementById("VideoDelete").src = "";

    document.querySelector('#ImagemDelete').className = "d-none";

    document.querySelector('#ImagemDelete').src = "";

    document.querySelector('#comentarioPubli').innerText = ""

    document.querySelector('#ErroDelete').innerText = ""
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
    if(video.paused)
    {
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
      if(video.play)
      {
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

function InsereHashTag(event)
{
  const TagSelecionada = event.currentTarget;
  const valorTag = TagSelecionada.innerText;
  const TemasSelecionados = document.querySelectorAll('[class="Tema"]');
  for(let i =0; i<4 ; i++)
  {
    if(TemasSelecionados[i].innerText)
    {
      if(TemasSelecionados[i].innerText == valorTag)
      {
        document.getElementById('ErroPerfil').innerText = "Insira Apenas uma Tag de cada tipo"
        i=4
      }
      else
      {
      if(i==3)
      {
        document.getElementById('ErroPerfil').innerText = "Insira Apenas 4 HashTags Por Publicação"
        document.getElementById('ErroPerfil').className = "text-center text-danger";
      }
    }
    }
    else
    {
      document.getElementById('ErroPerfil').innerText = ""
      TemasSelecionados[i].innerText = valorTag;
      i = 4
    }
    
  }

}
function RemoveHashTag(event)
{
  const tagatual = event.currentTarget;
  tagatual.innerText = "";
  document.getElementById('ErroPerfil').innerText = ""
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
                  <>
                    {/\.(mp4|webm|ogg)$/i.test(conteudo.NomeExtesao) ? (
                      // Caso seja um vídeo
                      <div id="ControleJanela" className={"z" + index + " " + 'd-none '} key={index}>

                        <div className=" Midia_Tela">


                          <div className="d-flex" id="FundoTelaUsuarioFeed"  >
                            <ul>
                              <li className="nav-item d-flex ">
                                <img id="PerfildeUsuarioVerPubli" src={
                                  dadosUser.foto_perfil != null ? dadosUser.link_foto : '../../src/assets/perfil.png'} width="60" height='60'></img>
                                <span id="IdUsuarioNickname" href="" className="nav-link text-light ">{dadosUser.nickname}</span>
                              </li>
                            </ul>
                            <button onClick={FechaMidiaView} id="FecharMidiaMobile" className='btn btn-light d-sm-block d-lg-none'><img src='../../../src/assets/icons/x-lg.svg' ></img></button>
                          </div>


                          <video className="" controls>
                            <source src={conteudo.Conteudo_Publicacao} type={`video/${conteudo.NomeExtesao.split(".").pop()}`} />
                            Seu navegador não suporta o elemento de vídeo.
                          </video>

                          <div id="CurtirCompartilharEAbrirChat">
                            <img id="EncaminharPubliAutor" className="" src="../../../src/assets/icons/arrow-90deg-right.svg" width=""></img>
                            <img onClick={AbrirJanelaComentarios} id="ComentariosPubliMobileAutor" className='d-sm-inline d-lg-none' src='../../../src/assets/icons/chat-square-dots.svg'></img>
                            <br />
                            <span className='text-light'>Encaminhar</span>
                            <span className='text-light d-sm-inline d-lg-none'>Comentarios</span>

                          </div>

                        </div>
                        <div id="Tela_de_Comentarios" className="p-2 Fundo_Comentarios">
                          <button onClick={FechaMidiaView} id="BotaoSairMidiaView" className='btn btn-light d-none d-lg-inline'><img src='../../../src/assets/icons/x-lg.svg' ></img></button>
                          <button onClick={FechaComentarios} id="BotaoSairMidiaView" className='btn btn-light d-sm-inline d-lg-none'>Voltar</button>
                          <h4 className="text-light pl-4">Comentario do Autor:</h4>
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
                          <input id="InserirComentarioPubliLocal" className={conteudo.id} placeholder='Insira um Comentario'></input>
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
                            <img id="EncaminharPubliAutor" className="" src="../../../src/assets/icons/arrow-90deg-right.svg" width=""></img>
                            <img onClick={AbrirJanelaComentarios} id="ComentariosPubliMobileAutor" className='d-sm-inline d-lg-none' src='../../../src/assets/icons/chat-square-dots.svg'></img>
                            <br />
                            <span className='text-light'>Encaminhar</span>
                            <span className='text-light d-sm-inline d-lg-none'>Comentarios</span>
                          </div>

                        </div>

                        <div id="Tela_de_Comentarios" className="p-2 Fundo_Comentarios">
                          <button onClick={FechaMidiaView} id="BotaoSairMidiaView" className='btn btn-light d-none d-lg-inline'><img id="ImagemBotao" src='../../../src/assets/icons/x-lg.svg'  ></img></button>
                          <button onClick={FechaComentarios} id="BotaoSairMidiaView" className='btn btn-light d-sm-inline d-lg-none'>Voltar</button>
                          <h4 className="text-light pl-4">Comentario do Autor:</h4>
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
                          <input id="InserirComentarioPubliLocal" className={conteudo.id} placeholder='Insira um Comentario'></input>
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
              <div className=' d-flex justify-content-center '>
                <button onClick={EnviarFotoPerfil} id="EditarFoto" className='btn btn-outline-light text-light '>Editar Foto</button>
                <input id="EnviaFotoPerfil" className='d-none' type='file' accept='image/*' />
              </div>

            </div>
            <div className='col-md-6 '>
              <h1 className='text-center text-light display-4'>
                Bem Vindo
              </h1>
              <h1 className='text-center text-light display-4'>
                {
                  dadosUser.nome
                }
              </h1>
              <span className='text-white mr-4'><strong>Seguidores: </strong> {dadosUser.total_seguidores}  </span> <span className='text-white ml-4'><strong>Seguindo: </strong> {dadosUser.total_seguindo}</span>
              <h4 className='text-light my-4'>
                Nick do User Atual
              </h4>
              <span id="NickAtual" className='text-light'>
                {
                  dadosUser.nickname
                }
              </span>
              <div className='d-flex justify-content-center mt-3'> <a id="CliqueEditarNick" type="button" data-toggle="modal" data-target="#ModalTrocaNick" className='btn btn-outline-light text-light '>Editar Nick</a></div>



              <h4 className=' text-light mt-5'>
                Adicionar/Editar Bio de Usuario
              </h4>
              <h5 className=' text-light mt-4'>
                Nos Fale Sobre Você
              </h5>
              <br />
              <h6 className='text-light '>Bio Atual:</h6>
              <p className='text-light'>                {
                dadosUser.mensagem_bio != null && dadosUser.mensagem_bio != "" ? dadosUser.mensagem_bio : "Nada Adicionado"
              }</p>

              <div className='d-flex justify-content-center'>
                <a type="button" data-toggle="modal" data-target="#ModalAddTrocaBio" className='text-end btn btn-outline-light text-light'>Adicionar/Editar Bio</a>
              </div>

            </div>
            <div className='col-md-12 d-flex justify-content-center'>
              <h1 id="TextoFeed" className='text-light mt-4 display-4'>
                Feed de Usuário
              </h1>
            </div>
            <div id="BordaPubli" className='col-md-12'>
              <nav id="NavBarPubli" className="navbar navbar-expand-sm">
                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
                  <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse d-flex justify-content-center" id="navbarNavAltMarkup">
                  <div className="navbar-nav ">
                    <a className="nav-item btn active text-light text-center" href="">Suas Publicações </a>
                    <a className=" nav-item btn text-light" href="#">Publicações Salvas </a>
                    <a type="button" data-toggle="modal" data-target="#ModalAdicionarPubli" className=" nav-item btn btn-outline-light  text-light" >Adicionar Publicação </a>
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

                        <a id="Valor_user" onClick={DeletarPublicacao} type="button" data-toggle="modal" data-target="#ModalApagaPubli" className={conteudo.id}>

                          <img id="Fundoedit" className='bg-light ' src="../../src/assets/icons/trash.svg" alt="" width="25" height="33" /></a>

                        <p className='text-light'><strong>Comentarios : {conteudo.total_comentarios != 0 ? conteudo.total_comentarios + " Comentarios" : "Nenhum comentario"}</strong></p>

                        <br />
                      </div>




                    ) : (
                      // Caso seja uma imagem
                      <div id="PubliBackground" className='col-md-4 '>
                        <img onClick={VerPubli} id="Midia_Selecionada" className={"x" + index + " imagemConfig "} src={conteudo.Conteudo_Publicacao} ></img>



                        <span id="Comentario" className='text-light text-center text-truncate'> {conteudo.Comentario_Author == "" || conteudo.Comentario_Author == " " ? "Nada Adicionado" : conteudo.Comentario_Author}  </span>

                        <a id="Valor_user" onClick={DeletarPublicacao} type="button" data-toggle="modal" data-target="#ModalApagaPubli" className={conteudo.id}>

                          <img id="Fundoedit" className='bg-light' src="../../src/assets/icons/trash.svg" alt="" width="25" height="33" /></a>

                        <p className='text-light'><strong>Comentarios : {conteudo.total_comentarios != 0 ? conteudo.total_comentarios + " Comentarios" : "Nenhum comentario"}</strong></p>

                        <br />
                      </div>


                    )}
                  </>

                )
                  : <p className='text-light'>"Nada Aqui"</p>
              )
            }

            )}

          </div>

        </div>
      </section>




      <div className="modal fade" id="ModalTrocaNick" tabIndex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header bg-dark">
              <h5 className="modal-title text-light" id="exampleModalLongTitle">Editar Nick</h5>
              <button type="button" className="close text-light" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body bg-dark text-light">
              <p className='text-danger text-center' id="Erro"></p>
              <p>Nick Atual:</p>
              <p>{
                dadosUser.nickname
              }</p>
              <input id="InputNickNovo" type="text" placeholder='Digite Seu Novo Nick Aqui' />
            </div>
            <div className="modal-footer bg-dark ">
              <button type="button" className="btn btn-secondary" data-dismiss="modal">Cancelar</button>
              <button type="button" onClick={EnviaNickAltera} className="btn btn-outline-light">Salvar Nick</button>
            </div>
          </div>
        </div>
      </div>





      <div className="modal fade" id="ModalAddTrocaBio" tabIndex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header bg-dark">
              <h5 className="modal-title text-light" id="exampleModalLongTitle">Adicionar/Editar Bio</h5>
              <button type="button" className="close text-light" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body bg-dark text-light">
              <p className='text-danger text-center' id="ErroBio"></p>
              <p>Bio Atual:</p>
              <p>{
                dadosUser.mensagem_bio != null && dadosUser.mensagem_bio != "" ? dadosUser.mensagem_bio : "Nada Adicionado"
              }</p>
              <textarea id="InserirBio" type="text" placeholder='Insira Sua Bio Aqui' />
            </div>
            <div className="modal-footer bg-dark ">
              <button type="button" className="btn btn-secondary" data-dismiss="modal">Cancelar</button>
              <button type="button" onClick={EnviaAddBio} className="btn btn-outline-light">Salvar Bio</button>
            </div>
          </div>
        </div>
      </div>




      <div className="modal fade" id="ModalAdicionarPubli" tabIndex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header bg-dark">
              <h5 className="modal-title text-light" id="exampleModalLongTitle">Adicionar Publicação</h5>
              <button type="button" className="close text-light" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body bg-dark text-light">
              <p className='text-danger text-center' id="ErroPerfil"></p>
              <span className=' text-light mr-5'>
                Insira a Publicação :
              </span>
              <a onClick={AdicionarPubli} className='btn btn-outline-light'>Adicionar Publicação</a>
              <br />
              <input id="InserirPublicacao" type="file" accept='image/*, video/*' className='d-none' />

              <video id="VideoPubli" controls src="" className='d-none mt-2' width="100%" height="250"></video>
              <img id='ImagemPubli' src='' className='d-none mt-2' width="100%" height="250"></img>

              <br />
              <p>Adicione um Comentario:</p>

              <textarea id="InserirComentario" type="text" placeholder='Insira um Comentario' />

              <div id="HashTagsSelecionadas">
              <span>HashTags Selecionadas :</span>
              <br />
              <span onClick={RemoveHashTag} className="Tema"></span> <span onClick={RemoveHashTag} className="Tema"></span>   <span onClick={RemoveHashTag} className="Tema"></span>   <span onClick={RemoveHashTag} className="Tema"></span>
              <br />
              <p>HashTags Referentes</p>
              <button onClick={InsereHashTag} className='TemaTag'>#Comédia</button> <button onClick={InsereHashTag} className='TemaTag'>#Ação</button> <button onClick={InsereHashTag}className='TemaTag'>#Desenho</button> <button onClick={InsereHashTag} className='TemaTag'>#Anime</button > <button onClick={InsereHashTag} className='TemaTag'>#Drama</button> <button onClick={InsereHashTag} className='TemaTag'>#Filme</button> <button onClick={InsereHashTag} className='TemaTag'>#Série</button> <button onClick={InsereHashTag} className='TemaTag'>#Romance</button> <button onClick={InsereHashTag} className='TemaTag'>#História</button> <button onClick={InsereHashTag} className='TemaTag'>#Isekai</button> <button onClick={InsereHashTag} className='TemaTag'>#Shounen</button> <button onClick={InsereHashTag} className='TemaTag'>#Guerra</button>
              </div>
            </div>
            <div className="modal-footer bg-dark ">
              <button type="button" className="btn btn-secondary" data-dismiss="modal">Cancelar</button>
              <button type="button" onClick={EnviaAddPubli} className="btn btn-outline-light">Envia Publicação</button>
            </div>
          </div>
        </div>
      </div>



      <div className="modal fade" id="ModalApagaPubli" tabIndex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header bg-dark">
              <h5 className="modal-title text-light" id="exampleModalLongTitle">Confirma deleção</h5>
              <button onClick={CancelaDelecao} type="button" className="close text-light" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body bg-dark text-light">
              <p className='text-danger text-center' id="ErroDelete"></p>
              <p className=' text-light text-center'>
                Deseja Deletar a Publicação?
              </p>
              <br />

              <video id="VideoDelete" controls src="" className='d-none mt-2' width="100%" height="250"></video>
              <img id='ImagemDelete' src='' className='d-none mt-2' width="100%" height="250"></img>

              <p id="comentarioPubli" className='text-light text-center text-truncate'>

              </p>
            </div>
            <div className="modal-footer bg-dark ">
              <button type="button" onClick={CancelaDelecao} className="btn btn-danger" data-dismiss="modal">Cancelar</button>
              <button type="button" onClick={ConfirmaDelecao} className="btn btn-success">Confirma</button>
            </div>
          </div>
        </div>
      </div>



      <div className="modal fade" id="ModaldeErro" tabIndex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger" id="exampleModalLongTitle">Erro</h5>
              </div>
              <div className="modal-body" id="">
                      <p id="ErroEmQuestao" className='text-danger'><strong></strong></p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" data-dismiss="modal">Close</button>
              </div>
            </div>
          </div>
        </div>

    </div>

  )
}

export default PerfildeUsuario