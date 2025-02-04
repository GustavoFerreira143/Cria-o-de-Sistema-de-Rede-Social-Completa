import { useState } from 'react'
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
import Home from './pages/Home/Home'
import Chat from './pages/Chat/Chat'
import Footer from './component/Footer'
import Login from './pages/TelaLogin/Login'
import PerfildeUsuario from './pages/PerfildeUsuario/PerfildeUsuario'
import OutroUser from './pages/AbrirOutroPerfilUser/OutroUser'
import Publicacao from './pages/Publicacoes/Publicacao'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <BrowserRouter>
      <Routes>
          <Route path="/" element={<Home />}/>
          <Route path="/Chat" element={<Chat />} />
          <Route path='/Login' element={<Login/>}/>
          <Route path='/PerfilDeUsuario' element={<PerfildeUsuario/>}/>
          <Route path='/VerPerfil' element={<OutroUser/>}/>
          <Route path='/Publicacoes' element={<Publicacao/>}/>
          </Routes>
      </BrowserRouter>
      <Footer/>
    </>
  )
}

export default App
