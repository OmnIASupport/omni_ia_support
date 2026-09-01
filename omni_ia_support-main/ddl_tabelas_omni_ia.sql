-- =====================================================================
-- 1. USUARIO - Entidade central do sistema
-- =====================================================================
CREATE TABLE USUARIO (
    id_usuario        SERIAL PRIMARY KEY,
    nome_exibicao     VARCHAR(150) NOT NULL,
    nome_completo     VARCHAR(250),
    email             VARCHAR(255) UNIQUE,
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
    id_idioma_interface     INTEGER REFERENCES FORMATO_IDIOMA(id_formato_idioma),
    usa_libras              BOOLEAN DEFAULT false,
    prefere_audio           BOOLEAN DEFAULT false,
    prefere_texto           BOOLEAN DEFAULT false,
    prefere_legenda         BOOLEAN DEFAULT false,
    prefere_video_libras    BOOLEAN DEFAULT false,
    velocidade_audio        NUMERIC(3,2) DEFAULT 1.0,
    volume_audio            NUMERIC(3,2) DEFAULT 1.0,
    tamanho_fonte           VARCHAR(20),
    alto_contraste          BOOLEAN DEFAULT false,
    notificacao_visual      BOOLEAN DEFAULT true,
    notificacao_vibratoria  BOOLEAN DEFAULT false,
    criado_em               TIMESTAMP NOT NULL DEFAULT now(),
    atualizado_em           TIMESTAMP NOT NULL DEFAULT now()
);
 
-- =====================================================================
-- 4. SESSAO_COMUNICACAO - Conversa/atendimento entre usuarios
-- =====================================================================
CREATE TABLE SESSAO_COMUNICACAO (
    id_sessao               SERIAL PRIMARY KEY,
    codigo_sessao            VARCHAR(50) NOT NULL UNIQUE,
    tipo_sessao               VARCHAR(50) NOT NULL,
    iniciada_por_usuario_id  INTEGER REFERENCES USUARIO(id_usuario),
    id_idioma_origem          INTEGER REFERENCES FORMATO_IDIOMA(id_formato_idioma),
    id_idioma_destino         INTEGER REFERENCES FORMATO_IDIOMA(id_formato_idioma),
    iniciada_em               TIMESTAMP NOT NULL DEFAULT now(),
    encerrada_em              TIMESTAMP,
    status                    VARCHAR(30) NOT NULL DEFAULT 'ativa',
    criado_em                 TIMESTAMP NOT NULL DEFAULT now(),
    atualizado_em             TIMESTAMP NOT NULL DEFAULT now()
);
 
-- =====================================================================
-- 5. PARTICIPANTE_SESSAO - Usuarios participantes de cada sessao (N:N)
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
    UNIQUE (id_sessao, id_usuario)
);
 
-- =====================================================================
-- 6. MENSAGEM - Mensagens enviadas durante uma sessao
-- =====================================================================
CREATE TABLE MENSAGEM (
    id_mensagem              SERIAL PRIMARY KEY,
    id_sessao                 INTEGER NOT NULL REFERENCES SESSAO_COMUNICACAO(id_sessao) ON DELETE CASCADE,
    id_remetente               INTEGER NOT NULL REFERENCES USUARIO(id_usuario),
    id_participante_sessao    INTEGER REFERENCES PARTICIPANTE_SESSAO(id_participante_sessao),
    tipo_entrada               VARCHAR(30) NOT NULL,
    conteudo_textual           TEXT,
    sequencia_mensagem         INTEGER NOT NULL,
    enviada_em                 TIMESTAMP NOT NULL DEFAULT now(),
    recebida_em                TIMESTAMP,
    status                     VARCHAR(30) NOT NULL DEFAULT 'enviada',
    duracao_ms                 INTEGER,
    tamanho_bytes               BIGINT,
    hash_integridade            VARCHAR(128),
    criado_em                   TIMESTAMP NOT NULL DEFAULT now(),
    atualizado_em               TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (id_sessao, sequencia_mensagem)
);
 
-- =====================================================================
-- 7. ARQUIVO_MIDIA - Dados tacnicos de audio/video/imagem/legenda
-- =====================================================================
CREATE TABLE ARQUIVO_MIDIA (
    id_midia            SERIAL PRIMARY KEY,
    id_mensagem          INTEGER REFERENCES MENSAGEM(id_mensagem) ON DELETE CASCADE, -- opcional
    tipo_midia            VARCHAR(30) NOT NULL,
    formato_midia         VARCHAR(30),
    mime_type              VARCHAR(100),
    uri_armazenamento     TEXT NOT NULL,
    tamanho_bytes          BIGINT,
    duracao_ms             INTEGER,
    resolucao              VARCHAR(20),
    criptografado           BOOLEAN DEFAULT false,
    hash_integridade         VARCHAR(128),
    criado_em                TIMESTAMP NOT NULL DEFAULT now(),
    atualizado_em            TIMESTAMP NOT NULL DEFAULT now()
);
 
-- =====================================================================
-- 8. SOLICITACAO_TRADUCAO - Solicitacao de traducao enviada a IA
-- =====================================================================
CREATE TABLE SOLICITACAO_TRADUCAO (
    id_traducao              SERIAL PRIMARY KEY,
    id_mensagem                INTEGER NOT NULL REFERENCES MENSAGEM(id_mensagem) ON DELETE CASCADE,
    direcao_traducao            VARCHAR(30) NOT NULL,
    id_idioma_origem             INTEGER REFERENCES FORMATO_IDIOMA(id_formato_idioma),
    id_idioma_destino            INTEGER REFERENCES FORMATO_IDIOMA(id_formato_idioma),
    tipo_processamento            VARCHAR(30),
    prioridade                     SMALLINT DEFAULT 0,
    tentativa_atual                 SMALLINT DEFAULT 1,
    max_tentativas                  SMALLINT DEFAULT 3,
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
CREATE TABLE ETAPA_TRADUCAO (
    id_etapa       SERIAL PRIMARY KEY,
    id_traducao     INTEGER NOT NULL REFERENCES SOLICITACAO_TRADUCAO(id_traducao) ON DELETE CASCADE,
    tipo_etapa       VARCHAR(50) NOT NULL,
    ordem_etapa       SMALLINT NOT NULL,
    status             VARCHAR(30) NOT NULL DEFAULT 'pendente',
    iniciada_em         TIMESTAMP,
    finalizada_em       TIMESTAMP,
    duracao_ms           INTEGER,
    confianca             NUMERIC(5,4),
    codigo_erro           VARCHAR(50),
    mensagem_erro         TEXT,
    UNIQUE (id_traducao, ordem_etapa)
);
 
-- =====================================================================
-- 10. GLOSSARIO_FINAL - Termos, glosas e sinais do sistema
-- =====================================================================
CREATE TABLE GLOSSARIO_FINAL (
    id_glossario         SERIAL PRIMARY KEY,
    termo_portugues        VARCHAR(150) NOT NULL,
    glosa_libras             VARCHAR(150),
    descricao_sinal           TEXT,
    categoria                  VARCHAR(50),
    regiao                      VARCHAR(50),
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
    id_glossario              INTEGER NOT NULL REFERENCES GLOSSARIO_FINAL(id_glossario) ON DELETE CASCADE,
    id_midia                    INTEGER NOT NULL REFERENCES ARQUIVO_MIDIA(id_midia),
    interprete_identificacao      VARCHAR(150),
    angulo_camera                  VARCHAR(30),
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
    id_traducao                 INTEGER NOT NULL REFERENCES SOLICITACAO_TRADUCAO(id_traducao) ON DELETE CASCADE,
    tipo_saida                    VARCHAR(30) NOT NULL,
    id_idioma_saida                INTEGER REFERENCES FORMATO_IDIOMA(id_formato_idioma),
    conteudo_textual                 TEXT,
    id_midia                          INTEGER REFERENCES ARQUIVO_MIDIA(id_midia),
    confianca_reconhecimento            NUMERIC(5,4),
    confianca_traducao                   NUMERIC(5,4),
    confianca_saida                       NUMERIC(5,4),
    confianca_geral                        NUMERIC(5,4),
    necessita_revisao                        BOOLEAN DEFAULT false,
    revisor_usuario_id                        INTEGER REFERENCES USUARIO(id_usuario), -- opcional
    revisado_em                                 TIMESTAMP,
    status_revisao                                VARCHAR(30),
    ordem_saida                                     SMALLINT DEFAULT 1,
    disponivel_em                                     TIMESTAMP,
    validade_em                                         TIMESTAMP,
    criado_em                                             TIMESTAMP NOT NULL DEFAULT now(),
    atualizado_em                                           TIMESTAMP NOT NULL DEFAULT now()
);
 
-- =====================================================================
-- 13. MOVIMENTO_IA - Movimentos/sinais/gestos capturados ou gerados
-- =====================================================================
CREATE TABLE MOVIMENTO_IA (
    id_movimento_ia         SERIAL PRIMARY KEY,
    id_mensagem                INTEGER REFERENCES MENSAGEM(id_mensagem),               -- opcional
    id_traducao                  INTEGER REFERENCES SOLICITACAO_TRADUCAO(id_traducao),   -- opcional
    id_resultado                   INTEGER REFERENCES RESULTADO_TRADUCAO(id_resultado),    -- opcional
    id_biblioteca_video              INTEGER REFERENCES BIBLIOTECA_VIDEO(id_biblioteca_video), -- opcional
    sequencia_movimento                INTEGER,
    tipo_movimento                       VARCHAR(30) NOT NULL,
    origem_movimento                       VARCHAR(30) NOT NULL, -- ex: capturado, gerado
    formato_representacao                    VARCHAR(30),
    dados_movimento                            TEXT,
    inicio_ms                                    INTEGER,
    fim_ms                                          INTEGER,
    confianca                                         NUMERIC(5,4),
    versao_esquema                                      VARCHAR(20),
    status                                                VARCHAR(30) DEFAULT 'processado',
    criado_em                                              TIMESTAMP NOT NULL DEFAULT now(),
    CHECK (
        id_mensagem IS NOT NULL OR id_traducao IS NOT NULL
        OR id_resultado IS NOT NULL OR id_biblioteca_video IS NOT NULL
    )
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
 
-- =====================================================================
-- 15. VIDEO_LIBRAS - Video/animacao gerada em Libras (saida do avatar)
-- =====================================================================
CREATE TABLE VIDEO_LIBRAS (
    id_video_libras     SERIAL PRIMARY KEY,
    id_resultado           INTEGER NOT NULL UNIQUE REFERENCES RESULTADO_TRADUCAO(id_resultado) ON DELETE CASCADE,
    id_midia                  INTEGER NOT NULL REFERENCES ARQUIVO_MIDIA(id_midia),
    tipo_apresentacao            VARCHAR(30),
    avatar_codigo                   VARCHAR(50),
    versao_animacao                    VARCHAR(20),
    duracao_ms                            INTEGER
);
 
-- =====================================================================
-- 16. TERMO_UTILIZADO_TRADUCAO - Termos do glossario usados em cada
--     solicitacao de traducao (resolve N:N SOLICITACAO_TRADUCAO<->GLOSSARIO_FINAL)
-- =====================================================================
CREATE TABLE TERMO_UTILIZADO_TRADUCAO (
    id_termo_utilizado   SERIAL PRIMARY KEY,
    id_traducao             INTEGER NOT NULL REFERENCES SOLICITACAO_TRADUCAO(id_traducao) ON DELETE CASCADE,
    id_glossario               INTEGER NOT NULL REFERENCES GLOSSARIO_FINAL(id_glossario),
    posicao_no_texto              INTEGER,
    confianca_match                  NUMERIC(5,4),
    criado_em                           TIMESTAMP NOT NULL DEFAULT now()
);
 