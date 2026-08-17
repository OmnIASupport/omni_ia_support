CREATE TABLE usuario (
    id_usuario BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome_exibicao VARCHAR(120) NOT NULL,
    nome_completo VARCHAR(200),
    email VARCHAR(254) NOT NULL UNIQUE,
    telefone VARCHAR(30),
    tipo_usuario VARCHAR(30) NOT NULL CHECK (tipo_usuario IN ('PESSOA_SURDA','OUVINTE','INTERPRETE','ATENDENTE','ADMINISTRADOR')),
    status_usuario VARCHAR(20) NOT NULL CHECK (status_usuario IN ('ATIVO','INATIVO','BLOQUEADO','PENDENTE')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE formato_idioma (
    id_formato_idioma BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(40) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('IDIOMA','MODALIDADE','FORMATO')),
    descricao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE perfil_acessibilidade (
    id_perfil_acessibilidade BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario BIGINT NOT NULL UNIQUE REFERENCES usuario(id_usuario),
    idioma_interface VARCHAR(40) NOT NULL DEFAULT 'pt-BR',
    usa_libras BOOLEAN NOT NULL DEFAULT FALSE,
    prefere_audio BOOLEAN NOT NULL DEFAULT FALSE,
    prefere_texto BOOLEAN NOT NULL DEFAULT TRUE,
    prefere_legenda BOOLEAN NOT NULL DEFAULT TRUE,
    prefere_video_libras BOOLEAN NOT NULL DEFAULT TRUE,
    velocidade_audio NUMERIC(4,2) NOT NULL DEFAULT 1.00 CHECK (velocidade_audio > 0),
    volume_audio NUMERIC(4,2) NOT NULL DEFAULT 1.00 CHECK (volume_audio BETWEEN 0 AND 1),
    tamanho_fonte INTEGER NOT NULL DEFAULT 16 CHECK (tamanho_fonte > 0),
    alto_contraste BOOLEAN NOT NULL DEFAULT FALSE,
    notificacao_visual BOOLEAN NOT NULL DEFAULT TRUE,
    notificacao_vibratoria BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_perfil_idioma_interface FOREIGN KEY (idioma_interface) REFERENCES formato_idioma(codigo)
);

CREATE TABLE usuario_perfil (
    id_usuario BIGINT NOT NULL REFERENCES usuario(id_usuario),
    nome_perfil VARCHAR(30) NOT NULL CHECK (nome_perfil IN ('PESSOA_SURDA','OUVINTE','INTERPRETE','ATENDENTE','ADMINISTRADOR')),
    atribuido_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    removido_em TIMESTAMPTZ,
    PRIMARY KEY (id_usuario, nome_perfil)
);

CREATE TABLE sessao_comunicacao (
    id_sessao BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_sessao VARCHAR(30) NOT NULL UNIQUE,
    tipo_sessao VARCHAR(30) NOT NULL CHECK (tipo_sessao IN ('CONVERSA','ATENDIMENTO','EMERGENCIA','AGENDAMENTO')),
    iniciada_por_usuario_id BIGINT NOT NULL REFERENCES usuario(id_usuario),
    id_idioma_origem BIGINT NOT NULL REFERENCES formato_idioma(id_formato_idioma),
    id_idioma_destino BIGINT NOT NULL REFERENCES formato_idioma(id_formato_idioma),
    iniciada_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    encerrada_em TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL CHECK (status IN ('ABERTA','PAUSADA','ENCERRADA','CANCELADA')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE participante_sessao (
    id_participante_sessao BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_sessao BIGINT NOT NULL REFERENCES sessao_comunicacao(id_sessao),
    id_usuario BIGINT NOT NULL REFERENCES usuario(id_usuario),
    papel VARCHAR(30) NOT NULL CHECK (papel IN ('SINALIZANTE','OUVINTE','INTERPRETE','ATENDENTE')),
    entrou_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    saiu_em TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL CHECK (status IN ('CONVIDADO','CONECTADO','DESCONECTADO','REMOVIDO')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_participante_ativo UNIQUE (id_sessao, id_usuario, entrou_em)
);

CREATE TABLE mensagem (
    id_mensagem BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_sessao BIGINT NOT NULL REFERENCES sessao_comunicacao(id_sessao),
    id_remetente BIGINT NOT NULL REFERENCES usuario(id_usuario),
    tipo_entrada VARCHAR(30) NOT NULL CHECK (tipo_entrada IN ('TEXTO_PORTUGUES','AUDIO_PORTUGUES','VIDEO_LIBRAS','TEXTO_LIBRAS')),
    conteudo_textual TEXT,
    sequencia_mensagem INTEGER NOT NULL CHECK (sequencia_mensagem > 0),
    enviada_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recebida_em TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL CHECK (status IN ('CRIADA','RECEBIDA','PROCESSANDO','TRADUZIDA','ENTREGUE','ERRO')),
    duracao_ms INTEGER CHECK (duracao_ms >= 0),
    tamanho_bytes BIGINT CHECK (tamanho_bytes > 0),
    hash_integridade VARCHAR(128),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_mensagem_sequencia UNIQUE (id_sessao, sequencia_mensagem)
);

CREATE TABLE arquivo_midia (
    id_midia BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_mensagem BIGINT NOT NULL REFERENCES mensagem(id_mensagem),
    tipo_midia VARCHAR(20) NOT NULL CHECK (tipo_midia IN ('AUDIO','VIDEO','IMAGEM','DOCUMENTO','LEGENDA')),
    formato_midia VARCHAR(20) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uri_armazenamento TEXT NOT NULL,
    tamanho_bytes BIGINT NOT NULL CHECK (tamanho_bytes > 0),
    duracao_ms INTEGER CHECK (duracao_ms >= 0),
    resolucao VARCHAR(20),
    criptografado BOOLEAN NOT NULL DEFAULT TRUE,
    hash_integridade VARCHAR(128),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE solicitacao_traducao (
    id_traducao BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_mensagem BIGINT NOT NULL REFERENCES mensagem(id_mensagem),
    direcao_traducao VARCHAR(30) NOT NULL CHECK (direcao_traducao IN ('LIBRAS_PARA_PORTUGUES','PORTUGUES_PARA_LIBRAS')),
    id_idioma_origem BIGINT NOT NULL REFERENCES formato_idioma(id_formato_idioma),
    id_idioma_destino BIGINT NOT NULL REFERENCES formato_idioma(id_formato_idioma),
    tipo_processamento VARCHAR(60) NOT NULL,
    prioridade INTEGER NOT NULL DEFAULT 3 CHECK (prioridade BETWEEN 1 AND 5),
    tentativa_atual INTEGER NOT NULL DEFAULT 0 CHECK (tentativa_atual >= 0),
    max_tentativas INTEGER NOT NULL DEFAULT 3 CHECK (max_tentativas > 0),
    solicitada_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    iniciada_em TIMESTAMPTZ,
    finalizada_em TIMESTAMPTZ,
    tempo_processamento_ms INTEGER CHECK (tempo_processamento_ms >= 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDENTE','PROCESSANDO','CONCLUIDA','CANCELADA','FALHA')),
    codigo_erro VARCHAR(50),
    mensagem_erro TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE etapa_traducao (
    id_etapa BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_traducao BIGINT NOT NULL REFERENCES solicitacao_traducao(id_traducao),
    tipo_etapa VARCHAR(40) NOT NULL CHECK (tipo_etapa IN ('CAPTURA','PRE_PROCESSAMENTO','RECONHECIMENTO_LIBRAS','INTERPRETACAO','TRADUCAO','SINTETIZACAO_AUDIO','GERACAO_VIDEO','VALIDACAO')),
    ordem_etapa INTEGER NOT NULL CHECK (ordem_etapa > 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDENTE','PROCESSANDO','CONCLUIDA','FALHA','PULADA')),
    iniciada_em TIMESTAMPTZ,
    finalizada_em TIMESTAMPTZ,
    duracao_ms INTEGER CHECK (duracao_ms >= 0),
    confianca NUMERIC(5,4) CHECK (confianca BETWEEN 0 AND 1),
    codigo_erro VARCHAR(50),
    mensagem_erro TEXT,
    CONSTRAINT uq_etapa_ordem UNIQUE (id_traducao, ordem_etapa)
);

CREATE TABLE resultado_traducao (
    id_resultado BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_traducao BIGINT NOT NULL REFERENCES solicitacao_traducao(id_traducao),
    tipo_saida VARCHAR(30) NOT NULL CHECK (tipo_saida IN ('TEXTO_PORTUGUES','AUDIO_PORTUGUES','VIDEO_LIBRAS','LEGENDA','TEXTO_GLOSA')),
    id_idioma_saida BIGINT NOT NULL REFERENCES formato_idioma(id_formato_idioma),
    conteudo_textual TEXT,
    id_midia BIGINT REFERENCES arquivo_midia(id_midia),
    confianca_reconhecimento NUMERIC(5,4) CHECK (confianca_reconhecimento BETWEEN 0 AND 1),
    confianca_traducao NUMERIC(5,4) CHECK (confianca_traducao BETWEEN 0 AND 1),
    confianca_saida NUMERIC(5,4) CHECK (confianca_saida BETWEEN 0 AND 1),
    confianca_geral NUMERIC(5,4) CHECK (confianca_geral BETWEEN 0 AND 1),
    necessita_revisao BOOLEAN NOT NULL DEFAULT FALSE,
    ordem_saida INTEGER NOT NULL CHECK (ordem_saida > 0),
    disponivel_em TIMESTAMPTZ,
    validade_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_resultado_ordem UNIQUE (id_traducao, ordem_saida)
);

CREATE TABLE movimento_ia (
    id_movimento_ia BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_mensagem BIGINT REFERENCES mensagem(id_mensagem),
    id_traducao BIGINT REFERENCES solicitacao_traducao(id_traducao),
    id_resultado BIGINT REFERENCES resultado_traducao(id_resultado),
    sequencia_movimento INTEGER NOT NULL CHECK (sequencia_movimento > 0),
    tipo_movimento VARCHAR(30) NOT NULL CHECK (tipo_movimento IN ('CAPTURADO','RECONHECIDO','GERADO')),
    origem_movimento VARCHAR(20) NOT NULL CHECK (origem_movimento IN ('USUARIO','IA')),
    formato_representacao VARCHAR(30) NOT NULL CHECK (formato_representacao IN ('KEYPOINTS','POSE_3D','GESTO','ANIMACAO','JSON_ESTRUTURADO')),
    dados_movimento TEXT NOT NULL,
    inicio_ms INTEGER NOT NULL CHECK (inicio_ms >= 0),
    fim_ms INTEGER NOT NULL CHECK (fim_ms >= inicio_ms),
    confianca NUMERIC(5,4) CHECK (confianca BETWEEN 0 AND 1),
    versao_esquema VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('RECEBIDO','PROCESSADO','VALIDADO','REJEITADO','ERRO')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audio_sintetizado (
    id_audio BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_resultado BIGINT NOT NULL REFERENCE resultado_traducao(id_resultado),
    id_midia BIGINT NOT NULL REFERENCES arquivo_midia(id_midia),
    idioma_audio VARCHAR(40) NOT NULL DEFAULT 'pt-BR',
    voz_codigo VARCHAR(80),
    velocidade NUMERIC(4,2) NOT NULL DEFAULT 1.00 CHECK (velocidade > 0),
    tom NUMERIC(5,2),
    volume NUMERIC(4,2) NOT NULL DEFAULT 1.00 CHECK (volume BETWEEN 0 AND 1),
    formato_audio VARCHAR(20) NOT NULL,
    taxa_amostragem INTEGER CHECK (taxa_amostragem > 0),
    duracao_ms INTEGER CHECK (duracao_ms >= 0)
);

CREATE TABLE video_libras (
    id_video_libras BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_resultado BIGINT NOT NULL REFERENCES resultado_traducao(id_resultado),
    id_midia BIGINT NOT NULL REFERENCES arquivo_midia(id_midia),
    tipo_apresentacao VARCHAR(20) NOT NULL CHECK (tipo_apresentacao IN ('VIDEO_HUMANO','AVATAR_3D','ANIMACAO_2D')),
    avatar_codigo VARCHAR(100),
    versao_animacao VARCHAR(50),
    duracao_ms INTEGER CHECK (duracao_ms >= 0)
);

CREATE TABLE glossario_final (
    id_glossario BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    termo_portugues VARCHAR(200) NOT NULL,
    glosa_libras TEXT NOT NULL,
    descricao_sinal TEXT,
    categoria VARCHAR(100),
    regiao VARCHAR(100),
    id_midia_referencia BIGINT REFERENCES arquivo_midia(id_midia),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mensagem_sessao ON mensagem(id_sessao);
CREATE INDEX idx_traducao_status ON solicitacao_traducao(status);
CREATE INDEX idx_movimento_traducao ON movimento_ia(id_traducao);
CREATE INDEX idx_resultado_traducao ON resultado_traducao(id_traducao);
