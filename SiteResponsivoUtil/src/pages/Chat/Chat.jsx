import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React, { useEffect, useState } from "react";
import './TelaChat.css'
import '../../component/FootereHeader.css'
import NavBarChat from '../../component/NavBarChat'
import { use } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

const apiUrl = import.meta.env.VITE_BackEndUrl;
let mediaRecorder;
let audioChunks = [];
let audioBlob;
let urlFeita = "";

//--------------------------------------------------------------------------Função Verifica se o Usuário Esta Logado------------------------------------------------------------------- 

async function LogarPagina() {
  const response = await fetch(`${apiUrl}/protected`, {
    method: 'GET',
    credentials: 'include', // Inclui cookies na requisição
  });
  const result = await response.json();
  if (result.status == "400") {
    window.location.replace("/Login?erro")
  }
  else {
    document.getElementById('NomeUser').innerText = result.message;
    document.getElementById('IdUser').innerText = result.id;


    if (result.dados.link_foto != `${apiUrl}/uploads/null`) {
      document.getElementById('imgusuario').src = result.dados.link_foto;
    }
  }
}
let janela = window.location.href;
janela = janela.split('?');
if (janela[0] == "http://localhost:5173/Chat") {
  LogarPagina();
}


function Chat() {

  let data_atual;
  const [elements, setElements] = useState([]);
  const [mensagem, setMensagem] = useState([]);
  const [id_usuario, setid_usuario] = useState([]);
  const [EmConversa, setEmConversa] = useState([]);
  const [id_user_batepapo, setid_user_batepapo] = useState([]);
  const [nao_lidas, setnao_lidas] = useState([false]);

  //-----------------------------------------------------------------Função Para o Carregamento da barra de Contatos e Evento de Clique----------------------------------------------- 
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (isMounted) {
        CarregaContatos(setElements);
        setTimeout(fetchProfile, 1000); // Recarrega após 5 segundos
      }
    };

    fetchProfile();

    return () => {
      isMounted = false; // Limpa a execução em caso de desmontagem
    };
  }, []);


//-------------------------------------------------------------------Funcão Para o Primeiro Carregamento na Página de Mensagens--------------------------------------------------------

async function Mensagens(valor, NomeUser, imguser) {

  const response = await fetch(`${apiUrl}/protected/mensagem`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Inclui cookies na requisição
    body: JSON.stringify({ Destinatario: valor }),
  });
  const result = await response.json();

  if (result.status == '200') {
    setMensagem(result.message);
    setid_usuario(result.usuarioAtual)
    let userdados = { Nome: NomeUser, href: imguser }
    setEmConversa(userdados)
    document.getElementById('fundocontatos').className = "col-md-4 d-none d-md-block "
    document.getElementById('fundomensagem').className = "col-md-8"
    setTimeout(() => {
      let divScrolavel = document.getElementById("Bate-Papo")
      divScrolavel.scrollTop = divScrolavel.scrollHeight;
    }, 1000)

  }
}
//---------------------------------------------------------------------------------//-------------------------------------------------------------------------------------------------
function CarregaConversaEncaminhada()
{
  let url_atual = window.location.href;
  if(url_atual != "http://localhost:5173/Chat")
  {

  url_atual = new URL(url_atual).searchParams;
  let id_user = url_atual.get("id");
  let nomeuser = url_atual.get("nomeuser");
  let imguser = url_atual.get("imguser");
  if(id_user.trim() != "" && nomeuser.trim() != "" && imguser.trim() != "")
  {
    Mensagens(id_user, nomeuser, imguser);
    setid_user_batepapo(id_user);
  }
  }
}


useEffect(() => {
  CarregaConversaEncaminhada()
  }, []);

  function ClickContato(event) {

    const clickedElement = event.currentTarget;
    let TagEspecifica = clickedElement.querySelector("span")
    TagEspecifica = TagEspecifica.innerText
    let NomeUser = clickedElement.querySelector("h6").innerText;
    let imguser = clickedElement.querySelector("img").src;
    Mensagens(TagEspecifica, NomeUser, imguser)
    setid_user_batepapo(TagEspecifica);

  }


  async function CarregaContatos(setElements) {
    const response = await fetch(`${apiUrl}/protected/contatos`, {
      method: 'GET',
      credentials: 'include', // Inclui cookies na requisição
    });
    const result = await response.json();
    const contatos = result.contatos
    setElements(contatos);
  }


  //---------------------------------------------------------------------------Função para o Envio de Mensagem de Texto-------------------------------------------------------------  

  async function EnviarMensagemServ(destino, remetente, Mensagem, Respondendo, setMensagem) {
    const response = await fetch(`${apiUrl}/protected/mensagem/enviar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Inclui cookies na requisição
      body: JSON.stringify({ Destinatario: destino, Remetente: remetente, mensagem: Mensagem, respondendo: Respondendo }),
    });
    const result = await response.json();

    if (result.status == '200') {
      document.getElementById('InputMensagem').value = ""
      AtualizaMensagens(destino, setMensagem);

    }
  }

  //------------------------------------------------------------------------Funcão Para Recebimento de novas Mensagens----------------------------------------------------------------


  async function AtualizaMensagens(id_destinatario, setMensagem) {
    if (EmConversa.Nome != undefined) {
      const response = await fetch(`${apiUrl}/protected/mensagemContato`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Inclui cookies na requisição
        body: JSON.stringify({ Destinatario: id_destinatario }),
      });
      const result = await response.json();
      if (result.status == '200') {
        setMensagem(result.message);
      }
    }
  }


  //------------------------------------------------------------------Funcao Importante!! Envia e Trata os arquivos para envio ao Servidor------------------------------------------


  async function EnviarMensagem() {
    let Mensagem = document.getElementById('InputMensagem').value;
    let Respondendo = document.getElementById('TextoResposta').innerText;
    let janela = window.location.href;
    let janela_busca = janela.split("?");
    // Verificar se há uma conversa ativa
    if (EmConversa.Nome != undefined) {
      const audioPreview = document.getElementById('audioPreview').src;
      const formData = new FormData();
      // Adiciona informações comuns ao formData
      formData.append('senderId', id_usuario);
      formData.append('receiverId', id_user_batepapo);
      formData.append('Respondendo', Respondendo);

      // Verificar envio de imagem ou vídeo
      if (document.getElementById('Enviaimg').files.length > 0) {
        const file = document.getElementById('Enviaimg').files[0];
        formData.append('file', file);

        // Verificar se há áudio associado

        if (audioPreview != window.location.href  ) {

          const audioBlob = processarAudio(audioPreview);
          formData.append('audio', audioBlob, 'audio.ogg');

          await enviarDados(`${apiUrl}/protected/imgvideosaudio`, formData);

          document.getElementById('audioPreview').src = "";
          document.querySelector('#Audio').className = 'audio-player d-none justify-content-center'
          const inputMensagem = document.getElementById('InputMensagem');
          inputMensagem.placeholder = "Digite Sua Mensagem"
          inputMensagem.readOnly = ''

        }
        // Verificar se há mensagem associada
        else if (Mensagem) {
          formData.append('message', Mensagem);
          await enviarDados(`${apiUrl}/protected/imgvideos`, formData);
          document.getElementById('InputMensagem').value = ""
        }
        // Apenas imagem ou vídeo
        else {
          await enviarDados(`${apiUrl}/protected/imgvideos`, formData);
        }
        ExibirEnviodeImagenseDocumentos()
      }
      // Verificar envio de documento
      else if (document.getElementById('EnviaDoc').files.length > 0) {
        const file = document.getElementById('EnviaDoc').files[0];
        formData.append('file', file);

        // Verificar se há áudio associado
        if (audioPreview != window.location.href) {

          const audioBlob = processarAudio(audioPreview);
          formData.append('audio', audioBlob, 'audio.ogg');
          await enviarDados(`${apiUrl}/protected/documentosAudio`, formData);
          document.getElementById('audioPreview').src = "";

          document.querySelector('#Audio').className = 'audio-player d-none justify-content-center'
          const inputMensagem = document.getElementById('InputMensagem');
          inputMensagem.placeholder = "Digite Sua Mensagem"
          inputMensagem.readOnly = ''
        }
        // Verificar se há mensagem associada
        else if (Mensagem) {

          formData.append('message', Mensagem);
          await enviarDados(`${apiUrl}/protected/documentos`, formData);
          document.getElementById('InputMensagem').value = ""
        }
        // Apenas documento
        else {

          await enviarDados(`${apiUrl}/protected/documentos`, formData);
        }
        ExibirEnviodeImagenseDocumentos()
      }
      // Verificar envio de áudio isolado
      else if (audioPreview != window.location.href) {

        const audioBlob = processarAudio(audioPreview);
        formData.append('audio', audioBlob, 'audio.ogg');
        await enviarDados(`${apiUrl}/protected/audio`, formData);
        document.getElementById('audioPreview').src = "";
        document.querySelector('#Audio').className = 'audio-player d-none justify-content-center'
        const inputMensagem = document.getElementById('InputMensagem');
        inputMensagem.placeholder = "Digite Sua Mensagem"
        inputMensagem.readOnly = ''
      }
      // Verificar envio de mensagem isolada
      else if (Mensagem) {
        EnviarMensagemServ(id_user_batepapo, id_usuario, Mensagem, Respondendo, setMensagem);
        ApagarRespondendo();
      }
      document.getElementById('TextoResposta').innerText = "";
    }
    // Caso nenhuma conversa esteja ativa
    else {
      document.getElementById('Alerta').innerHTML = '<div id="AlertaLogout" class="alert alert-danger alert-dismissible fade show text-center" role="alert"><strong>Selecione uma conversa primeiro </strong><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>';
    }
    setTimeout(() => {
      let divScrolavel = document.getElementById("Bate-Papo")
      divScrolavel.scrollTop = divScrolavel.scrollHeight;
    }, 1000)
  }

  // Função para processar o áudio (converter base64 para Blob)
  function processarAudio(audioBase64) {
    const base64Data = audioBase64.split(',')[1]; // Remove o prefixo "data:..."
    const binaryData = atob(base64Data); // Decodifica base64
    const arrayBuffer = new Uint8Array(binaryData.length);

    for (let i = 0; i < binaryData.length; i++) {
      arrayBuffer[i] = binaryData.charCodeAt(i);
    }
    let blob = new Blob([arrayBuffer], { type: 'audio/ogg; codecs=opus' });
    return blob
  }

  // Função para enviar dados ao servidor
  async function enviarDados(url, formData) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const result = await response.json();
      if(result.status != 200)
      {
        let modal = document.getElementById('AbreModalErro');
        document.getElementById('ErroEmQuestao').innerText = result.message;
        modal.click();
      }
    } catch (error) {
      console.error(`Erro ao enviar dados para ${url}:`, error);
    }
  }

  //-------------------------------------------------------------------------Fim Da Funcão---------------------------------------------------------------------------------------------



  useEffect(() => {
    // Função para chamar AtualizaMensagens periodicamente
    const interval = setInterval(() => {
      if (id_user_batepapo) {
        AtualizaMensagens(id_user_batepapo, setMensagem);
      }
    }, 3000); // Atualiza a cada 5 segundos

    return () => clearInterval(interval); // Limpa o intervalo ao desmontar o componente
  }, [id_user_batepapo, EmConversa.Nome]); // Reexecuta o efeito se o destinatário ou conversa mudar


  //----------------------------------------------------------Troca Contatos MOBILE-----------------------------------------------------------------------------------------------------

  function TrocaContatos() {
    document.getElementById('fundocontatos').className = "col-md-4 "
    document.getElementById('fundomensagem').className = "col-md-8 d-none d-md-block"
  }


  //-----------------------------------------------------------------//-----------------------------------------------------------------------------------------------------------------


  //--------------------------------------------------------------------------ResPondendoHá--------------------------------------------------------------------------------------------- 


  function Janela_Responder(event) {


    const tagpai = event.currentTarget;
    let valorMensagem = tagpai.querySelector('#Mensagem').innerText;
    let texto = tagpai.querySelector('#BotaoPausaAudio');
    if (texto) {
      document.querySelector('#TextoResposta').innerText = "Audio Selecionado";
    }
    else {
      const [antesDaQuebra, depoisDaQuebra] = valorMensagem.split("\n");
      document.querySelector('#TextoResposta').innerText = antesDaQuebra;
    }
    document.querySelector('#Respondendoha').innerText = "Respondendo à :"
    document.querySelector('#BotaoDescartar').className = "btn btn-light justify-self-end";
    let classantiga = tagpai.querySelector('#Opcoes').className
    classantiga = classantiga + " d-none"
    tagpai.querySelector('#Opcoes').className = classantiga;
  }


  function Repondendoha(event) {
    const tagpai = event.currentTarget;
    let valorMensagem = tagpai.querySelector('#Mensagem').innerText;
    let texto = tagpai.querySelector('#BotaoPausaAudio');
    if (texto) {
      document.querySelector('#TextoResposta').innerText = "Audio Selecionado";
    }
    else {
      const [antesDaQuebra, depoisDaQuebra] = valorMensagem.split("\n");
      document.querySelector('#TextoResposta').innerText = antesDaQuebra;
    }
    document.querySelector('#Respondendoha').innerText = "Respondendo Há"
    document.querySelector('#BotaoDescartar').className = "btn btn-light justify-self-end";
    let classantiga = tagpai.querySelector('#Opcoes').className
    classantiga = classantiga + " d-none"
    tagpai.querySelector('#Opcoes').className = classantiga;
  }
  function ApagarRespondendo() {
    document.querySelector('#Respondendoha').innerText = ""
    document.querySelector('#TextoResposta').innerText = ""
    document.querySelector('#BotaoDescartar').className = 'd-none'

  }
  //------------------------------------------------------------------------------------------------Iniciando Gravação de Audio---------------------------------------------------------


  async function IniciarGravacao() {


    const micDesativado = document.getElementById('MicDesativado');
    const micAtivado = document.getElementById('MicAtivado');
    const balao = document.getElementById('Balao');
    const inputMensagem = document.getElementById('InputMensagem');
    const audioPreview = document.getElementById('audioPreview');
    const BarradeAudio = document.getElementById('Audio');
    inputMensagem.value = ""
    audioChunks = []

    if (micDesativado.className == '') {

      URL.revokeObjectURL(urlFeita)
      micDesativado.className = 'd-none';
      micAtivado.className = '';
      balao.className = '';
      inputMensagem.readOnly = 'true';
      inputMensagem.placeholder = 'Gravação de Audio em Andamento';
      audioPreview.className = '';

      let stream = await getMicrophoneAccess();
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = data => {
        audioChunks.push(data.data)
      }
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/ogg; codecs=opus' })
        const reader = new window.FileReader()
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          document.getElementById('audioPreview').src = reader.result;
          urlFeita = reader.result
        }
      }
      mediaRecorder.start();
    }
    else {

      micDesativado.className = '';
      micAtivado.className = 'd-none';
      balao.className = 'd-none';
      inputMensagem.placeholder = 'Envie ou Descarte o Audio Para inserir Mensagem';
      mediaRecorder.stop()
      BarradeAudio.className = 'audio-player d-flex justify-content-center'
      CarregaAudio()

    }

  }

  //------------------------------------------------------------------------Acessa Permissão de uso microfone--------------------------------------------------------------------------  

  async function getMicrophoneAccess() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return stream;
    } catch (error) {
      alert('Erro ao acessar o microfone: ' + error.message);
      throw error;
    }
  }


  //--------------------------------------------------------------------Funcionamento dos itens da barra de audio-----------------------------------------------------------------------


  function CarregaAudio() {
    // Formatação da Display de Audio
    let audio = document.getElementById('audioPreview');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const audioSeekBar = document.getElementById('inputRange');
    const currentTimeLabel = document.getElementById('currentTime');
    const durationLabel = document.getElementById('duration');
    const volumeControl = document.getElementById('SetarVolume');
    const imgVolume = document.getElementById('Volumenimg');

    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    // Atualizar os rótulos de tempo

    function updateTime() {
      currentTimeLabel.innerText = formatTime(audio.currentTime);
      audioSeekBar.value = (audio.currentTime / audio.duration) * 100 || 0;
    }
    // Atualizar barra de progresso manualmente
    audioSeekBar.addEventListener('input', () => {
      audio.currentTime = (audioSeekBar.value / 100) * audio.duration;
    });



    // Atualizar a barra e o tempo durante a reprodução
    audio.addEventListener('timeupdate', updateTime);

    // Parar o áudio ao final e redefinir
    audio.addEventListener('ended', () => {
      playPauseBtn.textContent = '▶';
      playPauseBtn.classList.remove('pause');
      playPauseBtn.classList.add('play');
      let duracao = formatTime(audio.duration)
      durationLabel.innerText = duracao
      audioSeekBar.value = 0;
      currentTimeLabel.textContent = '0:00';
    });

    volumeControl.addEventListener('input', () => {
      audio.volume = volumeControl.value / 100; // Volume varia de 0.0 a 1.0

    });
    volumeControl.addEventListener('change', () => {
      if (volumeControl.value > 50) {
        imgVolume.src = "../../../src/assets/icons/volume-up-fill.svg"
      }
      else if (volumeControl.value < 50 && volumeControl.value >= 1) {
        imgVolume.src = "../../../src/assets/icons/volume-down-fill.svg"
      }
      else if (volumeControl.value == 0) {
        imgVolume.src = "../../../src/assets/icons/volume-mute-fill.svg"
      }
    });
  }



  //-----------------------------------------------------------------------------Botão de Pause e Resume--------------------------------------------------------------------------------

  function PausaResume() {
    let audio = document.getElementById('audioPreview');
    const playPauseBtn = document.getElementById('playPauseBtn');

    if (audio.paused || audio.stop) {
      audio.play();
      playPauseBtn.textContent = ' || ';
      playPauseBtn.classList.remove('play');
      playPauseBtn.classList.add('pause');
    }
    else {
      audio.pause();
      playPauseBtn.textContent = '▶';
      playPauseBtn.classList.remove('pause');
      playPauseBtn.classList.add('play');
    }

  }

  //-------------------------------------------------------------------------------------------Botao Descarta Audio--------------------------------------------------------------------- 

  function DescartarAudio() {
    document.querySelector('#Audio').className = 'audio-player d-none justify-content-center'
    const inputMensagem = document.getElementById('InputMensagem');
    inputMensagem.placeholder = "Digite Sua Mensagem"
    inputMensagem.readOnly = ''
    document.getElementById('audioPreview').src = ""
  }
  //----------------------------------------------------------------------------------Fim da Configuração de Audio-----------------------------------------------------------------------

  //-------------------------------------------------------------------------------Configuração Barra de Audio do Chat-------------------------------------------------------------------

  function PausarAudio(event) {

    // Formatação da Display de Audio
    let TagAtual = event.currentTarget;
    let TagPai = TagAtual.parentElement;
    let audio = TagPai.querySelector('#AudioMensagem');
    const playPauseBtn = TagPai.querySelector('#BotaoPausaAudio');
    const audioSeekBar = TagPai.querySelector('#inputAudioMensagem');
    const currentTimeLabel = TagPai.querySelector('#TempoAtual');
    const durationLabel = TagPai.querySelector('#Duracao');
    const volumeControl = TagPai.querySelector('#VolumeChatSet');
    const imgVolume = TagPai.querySelector('#VolumenimgMensagem');

    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    // Atualizar os rótulos de tempo

    function updateTime() {
      currentTimeLabel.innerText = formatTime(audio.currentTime);
      audioSeekBar.value = (audio.currentTime / audio.duration) * 100 || 0;
    }
    // Atualizar barra de progresso manualmente
    audioSeekBar.addEventListener('input', () => {
      audio.currentTime = (audioSeekBar.value / 100) * audio.duration;
    });



    // Atualizar a barra e o tempo durante a reprodução
    audio.addEventListener('timeupdate', updateTime);

    // Parar o áudio ao final e redefinir
    audio.addEventListener('ended', () => {
      playPauseBtn.textContent = '▶';
      playPauseBtn.classList.remove('pause');
      playPauseBtn.classList.add('play');
      let duracao = formatTime(audio.duration)
      durationLabel.innerText = duracao
      audioSeekBar.value = 0;
      currentTimeLabel.textContent = '0:00';
    });

    volumeControl.addEventListener('input', () => {
      audio.volume = volumeControl.value / 100; // Volume varia de 0.0 a 1.0

    });
    volumeControl.addEventListener('change', () => {
      if (volumeControl.value > 50) {
        imgVolume.src = "../../../src/assets/icons/volume-up-fill.svg"
      }
      else if (volumeControl.value < 50 && volumeControl.value >= 1) {
        imgVolume.src = "../../../src/assets/icons/volume-down-fill.svg"
      }
      else if (volumeControl.value == 0) {
        imgVolume.src = "../../../src/assets/icons/volume-mute-fill.svg"
      }
    });


    if (audio.paused || audio.stop) {
      audio.play();
      playPauseBtn.textContent = ' || ';
      playPauseBtn.classList.remove('play');
      playPauseBtn.classList.add('pause');
    }
    else {
      audio.pause();
      playPauseBtn.textContent = '▶';
      playPauseBtn.classList.remove('pause');
      playPauseBtn.classList.add('play');
    }
  }


  //---------------------------------------------------------------------------------------------------//-----------------------------------------------------------------------------




  //------------------------------------------------------------------------------Configuração da janela de envio de IMG ou Documento--------------------------------------------------

  function ExibirEnviodeImagenseDocumentos() {

    let VizualizarTags = document.getElementById('EnviarDocumentoBloco').className;

    if (VizualizarTags == "d-none") {
      document.getElementById('EnviarDocumentoBloco').className = ""
    }
    else {
      document.getElementById('EnviarDocumentoBloco').className = "d-none"
      document.getElementById('Enviaimg').value = "";
      document.getElementById('EnviaDoc').value = "";
      document.getElementById('PortaDados').className = 'd-none';
    }
  }

  function EnviarImg() {

    const fileInput = document.getElementById('Enviaimg');
    const imagemElement = document.getElementById('preview');
    const videoElement = document.getElementById('CasoVideo');
    // Ao clicar no botão, ativa o clique no input "file"
    fileInput.click()

    // Evento para tratar a seleção do arquivo
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0]; // Obter o arquivo selecionado
      let nomeArquivo = fileInput.files[0].name;
      const fileType = file.type;

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
      }
      else if (allowedVideoTypes.includes(fileType)) {
        const reader = new FileReader();
        reader.onload = function (e) {
          videoElement.src = e.target.result;
          videoElement.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
      }
      else {
        document.getElementById('Enviaimg').value = "";
        document.getElementById('EnviaDoc').value = "";
        document.getElementById('PortaDados').className = 'd-none';
        document.getElementById('NomeArquivo').innerText = "";

      }
      if (file) {
        document.getElementById('NomeArquivo').innerText = nomeArquivo;
        document.getElementById('TipoDeArquivo').innerText = "Video/Imagem";
        document.getElementById('EnviaDoc').value = "";
        document.getElementById('PortaDados').className = '';
      };

    }
    );
  }
  function EnviarDocumento() {

    const fileInput = document.getElementById('EnviaDoc');
    const previewImage = document.getElementById('preview');


    fileInput.click()

    // Evento para tratar a seleção do arquivo
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0]; // Obter o arquivo selecionado
      let nomeArquivo = fileInput.files[0].name;
      if (file) {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(file); // Ler o arquivo
        // Ler o arquivo como uma URL de dados (base64)
        fileReader.onload = (e) => {
          previewImage.src = "../../../src/assets/icons/file-earmark-arrow-down-fill.svg"; // Definir o src da imagem como o resultado
          previewImage.className = 'd-block'; // Exibir a imagem
          document.getElementById('NomeArquivo').innerText = nomeArquivo;
          document.getElementById('TipoDeArquivo').innerText = "Documento";
          document.getElementById('Enviaimg').value = "";
          document.getElementById('PortaDados').className = '';
          document.getElementById('CasoImg').className = 'd-none';
          document.getElementById('CasoVideo').className = 'd-none';
        };

      }
    });


  }
  function ApagarCaixa() {
    document.getElementById('Enviaimg').value = "";
    document.getElementById('EnviaDoc').value = "";
    document.getElementById('PortaDados').className = 'd-none';
  }


  //-----------------------------------------------------------------------HTML Retornado----------------------------------------------------------------------------------------------

  function PerfilDeVisitante() {

    window.location.href = 'http://localhost:5173/VerPerfil?id=' + id_user_batepapo;

  }


  //-------------------------------------------------------------------------Filtro de Mensagens Não Lidas----------------------------------------------------------------------------


  useEffect(() => {
    const interval = setInterval(() => {
      if (nao_lidas) {
        FiltroNaoLidas()
      }
    }, 500);


    return () => clearInterval(interval);
  }, [nao_lidas]);

  function FiltroNaoLidas() {
    let Checado = document.getElementById('SomentenaoLidas').checked;
    let Contatos = document.querySelectorAll('[id^="ContatosMensagem"]');
    let Quantidade_Contatos = Contatos.length;
    if (Checado) {
      for (let i = 0; i < Quantidade_Contatos; i++) {
        if (Contatos[i].querySelector('#NaoLidas').innerText != "0") {
          Contatos[i].className = "";
        }
        else {
          Contatos[i].className = "d-none";
        }
      }
      setnao_lidas(Checado);
    }
    else {
      for (let i = 0; i < Quantidade_Contatos; i++) {
        Contatos[i].className = "";
      }
      setnao_lidas(Checado);
    }
  }

  //-----------------------------------------------------------------------------Pesquisa de Usuario----------------------------------------------------------------------------------


  function PesquisaContatos() {
    let digitado = document.getElementById('PesquisarUsuario').value;
    let Contatos = document.querySelectorAll('[id^="ContatosMensagem"]');
    let Quantidade_Contatos = Contatos.length;
    for (let i = 0; i < Quantidade_Contatos; i++) {
      let nomeContato = Contatos[i].querySelector('h6').innerText;
      const regex = new RegExp(digitado, 'i');
      if (regex.test(nomeContato)) {
        Contatos[i].className = "";
      }
      else {
        Contatos[i].className = "d-none";
      }
    }
  }




  return (
    <>
    <NavBarChat />
      <section id="Fundo">
        <div id="FundoMobile">
          <div id="Filtro">
            <div className="container">
              <div id="colunas" className="row">
                <div id="fundocontatos" className="col-md-4 ">
                  <div className=" d-flex justify-content-center">
                    <h4 className="text-light">
                      Conversas
                    </h4>
                  </div>
                  <div id="PesquisaEFiltraUsuario">
                    <input id='PesquisarUsuario' onInput={PesquisaContatos} type="text" placeholder='PesquisePorUsuarios' />
                    <span className='text-light'>Ative Para Somente não Lidas</span><input id='SomentenaoLidas' onChange={FiltroNaoLidas} type='checkbox'></input>
                  </div>
                  <div id="ContatosEspaco" className='EspacodeContato'>
                    {
                      //------------------------------------------------------------------------------Função Carrega Contatos Front-End------------------------------------------------------------------------
                      elements.map((element) => {

                        // Combine mensagens enviadas e recebidas em um único array
                        const todasMensagens = [
                          ...element.mensagensRecebidas.map((msg) => ({
                            ...msg,
                            remetente: false, // Indica que é recebida
                          })),
                          ...element.mensagensEnviadas.map((msg) => ({
                            ...msg,
                            remetente: true, // Indica que é enviada
                          })),
                        ];
                        // Ordenar mensagens por data e hora decrescente
                        todasMensagens.sort((a, b) => {
                          const [diaA, mesA, anoA] = a.data.split('/').map(Number);
                          const [diaB, mesB, anoB] = b.data.split('/').map(Number);
                          const [horaA, minutoA, segundoA] = a.horacompleta.split(':').map(Number);
                          const [horaB, minutoB, segundoB] = b.horacompleta.split(':').map(Number);

                          // Comparação por data (ano, mês, dia)
                          if (anoA !== anoB) return anoB - anoA;
                          if (mesA !== mesB) return mesB - mesA;
                          if (diaA !== diaB) return diaB - diaA;

                          // Comparação por hora (hora, minuto)
                          if (horaA !== horaB) return horaB - horaA;
                          if (minutoA !== minutoB) return minutoB - minutoA;
                          return segundoB - segundoA;
                        });
                        // Última mensagem
                        const ultimaMensagem = todasMensagens[0];
                        return (
                          <div onClick={ClickContato} key={element.id} id="ContatosMensagem" className=''>
                            <img
                              id="imgcontatos"
                              className="float-left"
                              src={element.foto_perfil != `${apiUrl}/uploads/null`? element.foto_perfil : "../../src/assets/perfil.png"}
                              width="45"
                              height="50"
                            />
                            <h6 id="textocontato" className="float-left text-light">
                              {element.nickname}
                            </h6>
                            <span id="NumerodoUser" className="text-light">{element.id}</span>
                            <br />
                            <p id="TextoParagrafo" className="text-light text-truncate">
                              {ultimaMensagem ? (
                                ultimaMensagem.imagemVideos == `${apiUrl}/uploads/null` ? (
                                  ultimaMensagem.documentos == null || ultimaMensagem.documentos == ""  ?(
                                    ultimaMensagem.mensagem ? (
                                      // Exibir texto da mensagem
                                      ultimaMensagem.remetente
                                        ? `Você: ${ultimaMensagem.mensagem}`
                                        : `Recebido:  ${ultimaMensagem.mensagem}`
                                    ) : (
                                      // Exibir áudio
                                      <div
                                        id="TamanhoBox"
                                        className="audio-player d-flex justify-content-center"
                                      >
                                        <span className="text-light">
                                          {ultimaMensagem.remetente ? "Áudio: " : "Você:"}
                                        </span>
                                        <input type='range' className="" id="BarradeAudioContatos" defaultValue="0" min="0" max="100" disabled={true}></input>
                                        <span id="Contador" className="d-none d-md-block">0:00</span>
                                        <audio >
                                          <source src={ultimaMensagem.Audio} type="audio/ogg" />
                                          Seu navegador não suporta o elemento de áudio.
                                        </audio>
                                      </div>

                                    )
                                  ) :
                                    <span>  Documento: {ultimaMensagem.documentos}</span>
                                ) : /\.(mp4|webm|ogg)$/i.test(ultimaMensagem.imagemVideos_Nome
                                ) ? (
                                  // Caso seja um vídeo
                                  ultimaMensagem.remetente?(
                                  <>
                                    <span className='mr-2 float-left'>Você : Video</span>
                                    <div className='float-left'>
                                      <img id="CasoImg" src='../../../src/assets/icons/file-earmark-play-fill.svg' width='40' height="20" className=''></img>
                                    </div>
                                  </>
                                  ):
                                  (                                  <>
                                    <span className='mr-2 float-left'>Recebido : Video</span>
                                    <div className='float-left'>
                                      <img id="CasoImg" src='../../../src/assets/icons/file-earmark-play-fill.svg' width='40' height="20" className=''></img>
                                    </div>
                                  </>)
                                ) : ( ultimaMensagem.remetente ?(
                                  // Caso seja uma imagem
                                  <>
                                    <span>Você : </span>
                                    <img
                                      src={ultimaMensagem.imagemVideos
                                      }
                                      alt="Media enviada"
                                      className="img-thumbnail mt-2"
                                      width="50" height="20"
                                    />
                                    
                                  </>
                                )
                                :(                                  <>
                                  <span>Recebido :</span>
                                  <img
                                    src={ultimaMensagem.imagemVideos
                                    }
                                    alt="Media enviada"
                                    className="img-thumbnail mt-2"
                                    width="50" height="20"
                                  />
                                  
                                </>)
                                )
                              ) : (
                                "Nenhuma Mensagem"
                              )}
                            </p>
                            <p id="Lidas" className='text-light '>Não Lidas: <span id="NaoLidas" >{element.mensagensNaoLidas}</span></p>
                          </div>
                        );
                      })
                    }
                  </div>
                </div>

                <div id="fundomensagem" className="col-md-8 d-none d-md-block">
                  <div id="texto" className="d-flex justify-content-center">
                    <button id='VoltarMobile' onClick={TrocaContatos} className="btn btn-outline-light text-light mr-5 d-block d-md-none" >
                      Voltar</button> <h4 className="text-light">Bate-Papo</h4>
                  </div>
                  <div id="EmConversaCom" onClick={PerfilDeVisitante}>
                    <img id="imgcontatos" className="float-left" src={EmConversa.Nome != undefined ? EmConversa.href : "../../../src/assets/perfil.png"} width="45" height="50"></img>
                    <h6 id="textocontato" className="float-left text-light">{EmConversa.Nome != undefined ? "Em Conversa Com" : "Iniciar Conversa"}</h6><br />
                    <span id="TextoParagrafo" className="text-light">{EmConversa.Nome != undefined ? EmConversa.Nome : "Clique em um Contato para iniciar o Bate-Papo"}</span>
                  </div>

                  <div id="Bate-Papo">

                    <br />
                    {
                      //------------------------------------------------------------------------Funcão Carrega Mensagens Front-End-------------------------------------------------------                      
                      mensagem.map((mensagens, index) => {
                        let mostrarData = false;
                        if (mensagens.data !== data_atual) {
                          mostrarData = true;
                          data_atual = mensagens.data;
                        }

                        return (
                          <div key={index}>
                            {mostrarData ? (
                              <p className="dia text-light">{mensagens.data}</p>
                            ) : (
                              ""
                            )}

                            <div onDoubleClick={Janela_Responder}>
                              {mensagens.respondendo !== "" ? (
                                id_usuario == mensagens.idDestinatario ? (
                                  <p
                                    id="RespondendoMensagem"
                                    className="text-light float-left ml-3 text-start"
                                  >
                                    {"Em resposta de: " + mensagens.respondendo}
                                  </p>
                                ) : (
                                  <p
                                    id="RespondendoMensagem"
                                    className="text-light float-right mr-3 text-end"
                                  >
                                    {"Em resposta de: " + mensagens.respondendo}
                                  </p>
                                )
                              ) : (
                                ""
                              )}

                              <span
                                id="Mensagem"
                                className={
                                  id_usuario == mensagens.idDestinatario
                                    ? "messageDestino float-left"
                                    : "messageRemetente float-right"
                                }
                              >
                                <div className="d-block justify-content-end">
                                  {mensagens.documentosUrl && (
                                    <a
                                      href={mensagens.documentosUrl}
                                      download
                                      className="text-primary "
                                    >
                                      📄 Clique Para Baixar Documento
                                      <br />
                                      {mensagens.documentonome}
                                    </a>
                                  )}

                                  {mensagens.imagemVideosUrl && (
                                    <>
                                      {/\.(mp4|webm|ogg)$/i.test(mensagens.NomeExtesao) ? (
                                        // Caso seja um vídeo
                                        <video
                                          controls
                                          className="video-thumbnail mt-2"
                                          style={{ maxWidth: "250px", maxHeight: "250px" }}
                                        >
                                          <source
                                            src={mensagens.imagemVideosUrl}
                                            type={`video/${mensagens.NomeExtesao.split(".").pop()}`}
                                          />
                                          Seu navegador não suporta o elemento de vídeo.
                                        </video>
                                      ) : (
                                        // Caso seja uma imagem
                                        <img
                                          src={mensagens.imagemVideosUrl}
                                          alt="Media enviada"
                                          className="img-thumbnail mt-2"
                                          id="ImagemChat"

                                        />
                                      )}
                                    </>
                                  )}

                                  {mensagens.mensagem && <p>{mensagens.mensagem}</p>}

                                  {mensagens.audioUrl && (
                                    <div className="audio-playerChat d-flex justify-content-center">
                                      <audio id="AudioMensagem" src={mensagens.audioUrl}></audio>
                                      <button
                                        onClick={PausarAudio}
                                        id="BotaoPausaAudio"
                                        className="play btn btn-outline-light"
                                      >
                                        ▶
                                      </button>
                                      <input
                                        type="range"
                                        id="inputAudioMensagem"
                                        defaultValue="0"
                                        min="0"
                                        max="100"
                                      ></input>
                                      <span id="TempoAtual" className=" d-flex">
                                        0:00
                                      </span>
                                      <span className="text-light d-flex">/</span>
                                      <span className="d-flex" id="Duracao">
                                        0:00
                                      </span>

                                      <img
                                        id="VolumenimgMensagem"
                                        src="../../../src/assets/icons/volume-up-fill.svg"
                                        alt="volume"

                                      />

                                      <input
                                        className=""
                                        id="VolumeChatSet"
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="1"
                                        defaultValue="100"
                                      />
                                    </div>
                                  )}
                                  <p id="TextoDeHora" className="hora text-light ">
                                    {mensagens.hora}
                                  </p>
                                </div>
                              </span>

                              <div
                                id="Opcoes"
                                className={
                                  id_usuario == mensagens.idDestinatario
                                    ? "alert alert-dark d-none aparecer float-left"
                                    : "alert alert-dark d-none float-right"
                                }
                                role="alert"
                              >
                                <a
                                  id="CaixaResponder"
                                  onClick={Repondendoha}
                                  className="btn text-light"
                                >
                                  Responder
                                </a>
                              </div>
                            </div>
                            <br />
                            <br />
                            <br />
                          </div>
                        );
                      })}
                  </div>
                  <div className="d-flex justify-content-between">


                    <span id="Respondendoha" className="text-light "></span>
                    <span id="TextoResposta" className="text-light" >
                    </span>


                    <a onClick={ApagarRespondendo} id="BotaoDescartar" className="btn btn-light justify-self-end d-none" ><svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fillRule="white" className="bi bi-trash" viewBox="0 0 16 16">


                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                      <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                    </svg></a>


                  </div>

                  <div id="DigiteSuaMensagem" className="d-flex justify-content-start ">

                    <div id="AbrirEnvioDocumentos" className=''>


                      <button onClick={ExibirEnviodeImagenseDocumentos} className="btn btn btn-light text-light align-self-center">


                        <svg className="d-block bi bi-arrow-up-square" xmlns="http://www.w3.org/2000/svg"
                          width="30" height="30" fillRule={"currentColor"} viewBox="0 0 16 16">
                          <path fillRule="evenodd"
                            d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm8.5 9.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707z" />
                        </svg>
                      </button>
                      <div id="EnviarDocumentoBloco" className="d-none">

                        <a onClick={EnviarImg} id="IconsImg" className='btn btn-outline-light'><img id="" src="../../../src/assets/icons/image.svg" alt="Enviar Imagem" className='' width="40" height="40" /></a>


                        <input type="file" id="Enviaimg" accept="image/*,video/*" className='d-none' ></input>
                        <input type="file" id="EnviaDoc" accept="pdf, .doc, .docx, .csv, .xls, .pptx, .xlsx, .txt" className='d-none' ></input>


                        <a onClick={EnviarDocumento} id="IconsDocumento" className='btn btn-outline-light'><img id="" src="../../../src/assets/icons/file-earmark-arrow-up-fill.svg"
                          alt="Enviar Documento" width="40" height="40" /></a>



                        <div id="PortaDados" className="d-none">
                          <span id="TipoDeArquivo" className=' text-light'></span>


                          <button onClick={ApagarCaixa} id="BotaoCancelarEnvio" className='btn btn-outline-light text-light'> X </button>

                          <video id="CasoVideo" controls src="" width="100%" height="65%" className='d-none'></video>
                          <img id="preview" src="../../../src/assets/icons/image.svg" alt="Enviar Imagem" className='d-none' width="40" height="40" />
                          <p id="NomeArquivo" className='text-truncate text-center text-light'></p>
                        </div>
                      </div>


                    </div>
                    <input id="InputMensagem" type="text" className='' placeholder="Digite Sua Mensagem" ></input>


                    <button id="BotaoVoltar" onClick={IniciarGravacao} className="btn btn-light">


                      <span id="Balao" className='d-none'>Gravando áudio...</span>
                      <img id="MicDesativado" className='' src="../../src/assets/icons/mic-mute-fill.svg" alt="Clique Para Gravar" width="23" height="23"></img>
                      <img id="MicAtivado" className='d-none' src="../../src/assets/icons/mic-fill.svg" alt="Clique Para Parar" width="23" height="23"></img>
                    </button>


                    <button onClick={EnviarMensagem} id="Botao" className="btn btn-outline-light text-light d-flex  align-self-start">Enviar


                      <img id="EnviarMensagemIcon" src="../../../src/assets/SendMensagem.png" width="50" height="50"></img>
                    </button>
                  </div>
                  <div id="Audio" className="audio-player d-none justify-content-center ">


                    <button onClick={PausaResume} id="playPauseBtn" className="play btn btn-outline-light">▶</button>


                    <input type='range' className="" id="inputRange" defaultValue="0" min="0" max="100"></input>
                    <span id="currentTime" className="d-none d-md-block">0:00</span><span className='text-light d-none d-md-block'>/</span><span className='d-none d-md-block' id="duration">0:00</span>
                    <a id='botaovolumen' className='btn btn-light'><img id="Volumenimg" src="../../../src/assets/icons/volume-up-fill.svg" alt="volume" width="24" height="26" /></a><input id="SetarVolume" type="range" min="0" max="100" step="1" defaultValue="100" />


                    <button onClick={DescartarAudio} id="Descartar" className='btn btn-light ml-4'> <img src="../../src/assets/icons/trash.svg" alt="" width="24" height="26" /></button>


                  </div>
                  <audio id="audioPreview" src="" ></audio>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button id="AbreModalErro" type="button" className="d-none" data-toggle="modal" data-target="#ModaldeErro">
        </button>

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
      </section>
    </>
  )
}

export default Chat

