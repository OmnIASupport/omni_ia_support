-- =====================================================================
-- 1. USUARIO - Entidade central do sistema
-- =====================================================================
CREATE TABLE USUARIO (
    id_usuario        SERIAL PRIMARY KEY,
    nome_exibicao     VARCHAR(150) NOT NULL,
    nome_completo     VARCHAR(250),
    email_usuario     VARCHAR(255) UNIQUE,
    telefone          VARCHAR(20),
    tipo_usuario      VARCHAR(50)  NOT NULL,
    status_usuario    VARCHAR(30)  NOT NULL DEFAULT 'ativo',
    criado_em         TIMESTAMP    NOT NULL DEFAULT now(),
    atualizado_em     TIMESTAMP    NOT NULL DEFAULT now()
);
 
-- =====================================================================
-- 2. FORMATO_IDIOMA - Dominio de idiomas/modalidades
-- =====================================================================
CREATE TABLE FORMATO_IDIOMA (
    id_formato_idioma SERIAL PRIMARY KEY,
    codigo            VARCHAR(30)  NOT NULL UNIQUE, -- ex: pt-BR, libras-BR, video-libras
    nome              VARCHAR(100) NOT NULL,
    tipo              VARCHAR(30)  NOT NULL,         -- ex: texto, audio, video, sinal
    descricao         TEXT,
    ativo             BOOLEAN      NOT NULL DEFAULT true
);
 
-- =====================================================================
-- 3. PERFIL_ACESSIBILIDADE - Preferencias de acessibilidade do usuario
-- =====================================================================
CREATE TABLE PERFIL_ACESSIBILIDADE (
    id_perfil_acessibilidade SERIAL PRIMARY KEY,
    id_usuario              INTEGER NOT NULL UNIQUE
                            REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
    usa_libras              BOOLEAN DEFAULT false,
    prefere_audio           BOOLEAN DEFAULT false,
    prefere_texto           BOOLEAN DEFAULT false,
    prefere_legenda         BOOLEAN DEFAULT false,
    velocidade_audio        NUMERIC(3,2) DEFAULT 1.0,
    volume_audio            NUMERIC(3,2) DEFAULT 1.0,
    tamanho_fonte           VARCHAR(20),
    criado_em               TIMESTAMP NOT NULL DEFAULT now(),
    atualizado_em           TIMESTAMP NOT NULL DEFAULT now()
);
 
-- =====================================================================
-- 4. SESSAO_COMUNICACAO - Conversa/atendimento entre usuarios
-- =====================================================================
-- Composta
CREATE TABLE SESSAO_COMUNICACAO (
     id_usuario                    INT NOT NULL,
      id_participante_sessao       INT NOT NULL,

    CONSTRAINT pk_comunicacoes
    PRIMARY KEY (id_usuario, id_participante_sessao),

    CONSTRAINT fk_comunicacoes_usuario
     REFERENCES USUARIO(id_usuario),

      CONSTRAINT fk_participacoes_usuario
     REFERENCES PARTICIPANTE_SESSAO(id_participante_sessao),

    codigo_sessao            VARCHAR(50) NOT NULL UNIQUE,
    tipo_sessao               VARCHAR(50) NOT NULL,
    idioma_origem             VARCHAR(50) NOT NULL,
    idioma_destino            VARCHAR(50) NOT NULL,
    iniciada_em               TIMESTAMP NOT NULL DEFAULT now(),
    encerrada_em              TIMESTAMP,
    status                    VARCHAR(30) NOT NULL DEFAULT 'ativa',
    criado_em                 TIMESTAMP NOT NULL DEFAULT now(),
    atualizado_em             TIMESTAMP NOT NULL DEFAULT now()
);
 
-- =====================================================================
-- 5. PARTICIPANTE_SESSAO - Usuarios participantes de cada sessao
-- =====================================================================
CREATE TABLE PARTICIPANTE_SESSAO (
    id_participante_sessao SERIAL PRIMARY KEY,
    id_sessao               INTEGER NOT NULL REFERENCES SESSAO_COMUNICACAO(id_sessao) ON DELETE CASCADE,
    id_usuario               INTEGER NOT NULL REFERENCES USUARIO(id_usuario),
    papel                    VARCHAR(30) NOT NULL,
    entrou_em                TIMESTAMP NOT NULL DEFAULT now(),
    saiu_em                  TIMESTAMP,
    status                   VARCHAR(30) NOT NULL DEFAULT 'ativo',
    criado_em                TIMESTAMP NOT NULL DEFAULT now(),
);
 
-- =====================================================================
-- 6. MENSAGEM - Mensagens enviadas durante uma sessao
-- =====================================================================
CREATE TABLE MENSAGEM (
    id_mensagem              SERIAL PRIMARY KEY,
    id_usuario              INTEGER NOT NULL REFERENCES USUARIO(id_usuario),
    tipo_entrada               VARCHAR(30) NOT NULL,
    conteudo_textual           TEXT,
    sequencia_mensagem         INTEGER NOT NULL,
    enviada_em                 TIMESTAMP NOT NULL DEFAULT now(),
    recebida_em                TIMESTAMP,
    status                     VARCHAR(30) NOT NULL DEFAULT 'enviada',
    duracao_ms_mensagem         INTEGER,
    tamanho_bytes-mensagem      BIGINT,
    criado_em                   TIMESTAMP NOT NULL DEFAULT now(),
    atualizado_em               TIMESTAMP NOT NULL DEFAULT now(),
);
 
-- =====================================================================
-- 7. ARQUIVO_MIDIA - Dados tacnicos de audio/video/imagem/legenda
-- =====================================================================
CREATE TABLE ARQUIVO_MIDIA (
    id_midia            SERIAL PRIMARY KEY,
    tipo_midia            VARCHAR(30) NOT NULL,
    formato_midia         VARCHAR(30),
    mime_type              VARCHAR(100),
    uri_armazenamento     TEXT NOT NULL,
    tamanho_bytes          BIGINT,
    duracao_ms             INTEGER,
    resolucao              VARCHAR(20),
    criado_em                TIMESTAMP NOT NULL DEFAULT now(),
    atualizado_em            TIMESTAMP NOT NULL DEFAULT now()
);
 
-- =====================================================================
-- 8. SOLICITACAO_TRADUCAO - Solicitacao de traducao enviada a IA
-- =====================================================================
CREATE TABLE SOLICITACAO_TRADUCAO (
    id_solicitacao_traducao    SERIAL PRIMARY KEY,
    id_mensagem                INTEGER NOT NULL REFERENCES MENSAGEM(id_mensagem) ON DELETE CASCADE,
    direcao_traducao            VARCHAR(30) NOT NULL,
    idioma_origem_solitacao      VARCHAR(20) NOT NULL,
    idioma_destino_solicitacao    VARCHAR(20) NOT NULL,
    tipo_processamento            VARCHAR(30),
    solicitada_em                    TIMESTAMP NOT NULL DEFAULT now(),
    iniciada_em                      TIMESTAMP,
    finalizada_em                    TIMESTAMP,
    tempo_processamento_ms            INTEGER,
    status                             VARCHAR(30) NOT NULL DEFAULT 'pendente',
    codigo_erro                        VARCHAR(50),
    mensagem_erro                      TEXT,
    criado_em                           TIMESTAMP NOT NULL DEFAULT now(),
    atualizado_em                       TIMESTAMP NOT NULL DEFAULT now()
);
 
-- =====================================================================
-- 9. ETAPA_TRADUCAO - Etapas executadas durante o processamento
-- =====================================================================
-- Composta
CREATE TABLE ETAPA_TRADUCAO (
   id_solicitacao_traducao        INT NOT NULL,
   id_resultado_traducao          INT NOT NULL,
   CONSTRAINT pk_respostas
    PRIMARY KEY (id_solicitacao_traducao, id_resultado_traducao),

    CONSTRAINT fk_solicitacao_respostas
     REFERENCES SOLICITACAO_TRADUCAO(id_solicitacao_traducao),

      CONSTRAINT fk_resultado_traducao
     REFERENCES RESULTADO_TRADUCAO(id_resultado_traducao),

    tipo_etapa       VARCHAR(50) NOT NULL,
    ordem_etapa       SMALLINT NOT NULL,
    status             VARCHAR(30) NOT NULL DEFAULT 'pendente',
    iniciada_em         TIMESTAMP,
    finalizada_em       TIMESTAMP,
    duracao_ms_etapa      INTEGER,
    codigo_erro           VARCHAR(50),
    mensagem_erro         TEXT,
);
 
-- =====================================================================
-- 10. GLOSSARIO_FINAL - Termos, glosas e sinais do sistema
-- =====================================================================
CREATE TABLE GLOSSARIO_FINAL (
    id_glossario         SERIAL PRIMARY KEY,
    id_biblioteca_video  INTEGER REFERENCES BIBLIOTECA_VIDEO(id_biblioteca_video),
    termo_portugues        VARCHAR(150) NOT NULL,
    glosa_libras             VARCHAR(150),
    descricao_sinal           TEXT,
    id_midia_referencia          INTEGER REFERENCES ARQUIVO_MIDIA(id_midia), -- opcional
    ativo                          BOOLEAN NOT NULL DEFAULT true,
    criado_em                       TIMESTAMP NOT NULL DEFAULT now(),
    atualizado_em                   TIMESTAMP NOT NULL DEFAULT now()
);
 
-- =====================================================================
-- 11. BIBLIOTECA_VIDEO - Videos de pessoas reais sinalizando (fonte
--     de referencia humana usada pela IA para gerar o avatar)
-- =====================================================================
CREATE TABLE BIBLIOTECA_VIDEO (
    id_biblioteca_video     SERIAL PRIMARY KEY,
    id_midia                    INTEGER NOT NULL REFERENCES ARQUIVO_MIDIA(id_arquivo_midia),
    sinal_identificado           VARCHAR(150),
    qualidade_validada               BOOLEAN NOT NULL DEFAULT false,
    uso_permitido                     BOOLEAN NOT NULL DEFAULT false, -- consentimento/direito de imagem
    status                             VARCHAR(30) NOT NULL DEFAULT 'ativo',
    criado_em                           TIMESTAMP NOT NULL DEFAULT now(),
    atualizado_em                       TIMESTAMP NOT NULL DEFAULT now()
);
 
-- =====================================================================
-- 12. RESULTADO_TRADUCAO - Resultados produzidos pela traducao
-- =====================================================================
CREATE TABLE RESULTADO_TRADUCAO (
    id_resultado              SERIAL PRIMARY KEY,
    id_solicitacao_traducao                INTEGER NOT NULL REFERENCES SOLICITACAO_TRADUCAO(id_solicitacao_traducao) ON DELETE CASCADE,
    id_formato_idioma               INTEGER NOT NULL REFERENCES FORMATO_IDIOMA(id_formato_idioma),
    id_arquivo_midia                INTEGER NOT NULL REFERENCES ARQUIVO_MIDIA(id_arquivo_midia),
    tipo_saida                    VARCHAR(30) NOT NULL,
    conteudo_textual                 TEXT,
    revisado_em                                 TIMESTAMP,
    status_revisao                                VARCHAR(30),
   idioma_saida                                    TEXT,
    criado_em                                             TIMESTAMP NOT NULL DEFAULT now(),
    atualizado_em                                           TIMESTAMP NOT NULL DEFAULT now()
);
 
-- =====================================================================
-- 13. MOVIMENTO_IA - Movimentos/sinais/gestos capturados ou gerados
-- =====================================================================
CREATE TABLE MOVIMENTO_IA (
    id_movimento_ia         SERIAL PRIMARY KEY,
    id_resultado_traducao                   INTEGER REFERENCES RESULTADO_TRADUCAO(id_resultado_traducao),
    id_biblioteca_video              INTEGER REFERENCES BIBLIOTECA_VIDEO(id_biblioteca_video),
    sequencia_movimento                INTEGER,
    tipo_movimento                       VARCHAR(30) NOT NULL,
    formato_representacao                    VARCHAR(30),
    dados_movimento                            TEXT,
    inicio_ms                                    INTEGER,
    fim_ms                                          INTEGER,
    versao_esquema                                      VARCHAR(20),
    status                                                VARCHAR(30) DEFAULT 'processado',
    criado_em                                              TIMESTAMP NOT NULL DEFAULT now(),
);
 
-- =====================================================================
-- 14. AUDIO_SINTETIZADO - audio produzido pela sintese de voz
-- =====================================================================
CREATE TABLE AUDIO_SINTETIZADO (
    id_audio         SERIAL PRIMARY KEY,
    id_resultado       INTEGER NOT NULL UNIQUE REFERENCES RESULTADO_TRADUCAO(id_resultado) ON DELETE CASCADE,
    id_midia              INTEGER NOT NULL REFERENCES ARQUIVO_MIDIA(id_midia),
    idioma_audio             VARCHAR(20),
    voz_codigo                 VARCHAR(50),
    velocidade                   NUMERIC(3,2),
    tom                            NUMERIC(3,2),
    volume                           NUMERIC(3,2),
    formato_audio                      VARCHAR(20),
    taxa_amostragem                       INTEGER,
    duracao_ms                              INTEGER
);
 
