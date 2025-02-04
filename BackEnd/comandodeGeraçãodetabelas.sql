/*Cria Banco de Dados*/
CREATE DATABASE siteresponsivo;

/*Cria Tabela usuarios*/
CREATE TABLE usuarios(
    id bigint PRIMARY key not null AUTO_INCREMENT,
    nome varchar(255) not null,
    email varchar(255) not null UNIQUE,
    senha varchar(255) not null,
    nickname varchar(255) UNIQUE,
    foto_perfil varchar(255),
    mensagem_bio varchar(255)
);

/*Cria Tabela publicacao*/
CREATE TABLE publicacao(
    id bigint PRIMARY KEY not null AUTO_INCREMENT,
    user_autor bigint not null,
    Conteudo_Publicacao varchar(255) not null,
    Comentario_Author varchar(255),
    data_de_envio datetime,
    FOREIGN KEY(user_autor) REFERENCES usuarios(id)
);
/*Cria Tabela mensagens*/
CREATE TABLE mensagens(
    id bigint PRIMARY KEY not null AUTO_INCREMENT,
    id_destinatario bigint not null,
    id_remetente bigint not null,
    Mensagem text not null,
    Respondendo text,
    datahora datetime not null,
    lido BOOLEAN DEFAULT(false),
    Audio varchar(255),
    imagem_videos varchar(255),
    documentos varchar(255),
    Encaminhada varchar(255),
    FOREIGN KEY(id_destinatario) REFERENCES usuarios(id),
    FOREIGN KEY(id_remetente) REFERENCES usuarios(id)
);

/*Cria a tabela de Curtidas*/
CREATE TABLE curtidas ( 
 id bigint PRIMARY key AUTO_INCREMENT not null,
 id_autor bigint not null, 
 id_curtidor bigint not null, 
 id_publicacao bigint not null,
 FOREIGN KEY(id_publicacao) REFERENCES publicacao(id) ON DELETE CASCADE 
);

/*Cria Comentarios*/
CREATE TABLE comentarios(
	id bigint PRIMARY KEY AUTO_INCREMENT not null,
    publicacao_referente bigint not null,
    user_comentador bigint not null,
    Comentario text not null,
    datahora datetime not null,
   	FOREIGN KEY(publicacao_referente) REFERENCES publicacao(id) ON DELETE CASCADE,
    FOREIGN KEY(user_comentador) REFERENCES usuarios(id)
);

/*Cria Tabela SeguirUser*/
CREATE TABLE SeguirUser(
	id bigint PRIMARY KEY, 
    id_seguindo bigint not null,
    id_seguidor bigint not null,
    FOREIGN KEY(id_seguindo) REFERENCES usuarios(id),
    FOREIGN KEY(id_seguidor) REFERENCES usuarios(id)
);

/*Cria Tabela Hashtags */
CREATE TABLE hashtags(
id bigint PRIMARY KEY not null AUTO_INCREMENT,
id_publi_referente bigint not null,
hashtag_adicionada varchar(255),
    FOREIGN KEY(id_publi_referente) REFERENCES publicacao(id) ON DELETE CASCADE
)