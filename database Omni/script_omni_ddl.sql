-- =========================================================
-- ESTRUTURA DO BANCO DE DADOS - PROJETO OMNI
-- =========================================================


-- =========================================================
-- 1. USUÁRIO
-- Armazena os dados cadastrais e de acesso dos usuários
-- do sistema Omni.
--
-- O campo tipo_usuario representa o tipo de conta no
-- sistema, e não características de acessibilidade.
--
-- A acessibilidade é tratada separadamente na tabela
-- perfil_acessibilidade.
-- =========================================================

CREATE TABLE usuario (
    id_usuario BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome_exibicao VARCHAR(150) NOT NULL,
    nome_completo VARCHAR(250) DEFAULT NULL,
    email_usuario VARCHAR(255) DEFAULT NULL,
    telefone_usuario VARCHAR(20) DEFAULT NULL,
    tipo_usuario VARCHAR(50) NOT NULL DEFAULT 'usuario',
    status_usuario VARCHAR(30) NOT NULL DEFAULT 'ativo',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id_usuario),

    UNIQUE KEY uk_usuario_email (email_usuario)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================
-- 2. PERFIL DE ACESSIBILIDADE
-- Armazena as preferências e necessidades de acessibilidade
-- associadas a cada usuário.
--
-- Cada usuário pode possuir no máximo um perfil de
-- acessibilidade.
--
-- Exemplos:
--   - uso de Libras
--   - preferência por áudio
--   - preferência por texto
--   - preferência por legenda
--   - velocidade e volume do áudio
--   - tamanho de fonte
-- =========================================================

CREATE TABLE perfil_acessibilidade (
    id_perfil_acessibilidade BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_usuario BIGINT UNSIGNED NOT NULL,
    usa_libras TINYINT(1) NOT NULL DEFAULT 0,
    prefere_audio TINYINT(1) NOT NULL DEFAULT 0,
    prefere_texto TINYINT(1) NOT NULL DEFAULT 0,
    prefere_legenda TINYINT(1) NOT NULL DEFAULT 0,
    velocidade_audio DECIMAL(3,2) DEFAULT 1.00,
    volume_audio DECIMAL(3,2) DEFAULT 1.00,
    tamanho_fonte VARCHAR(20) DEFAULT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id_perfil_acessibilidade),

    UNIQUE KEY uk_perfil_acessibilidade_usuario (id_usuario),

    CONSTRAINT fk_perfil_acessibilidade_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================
-- 3. FORMATO / IDIOMA
-- Tabela de domínio utilizada para cadastrar os formatos e
-- idiomas suportados pelo sistema.
--
-- Exemplos:
--   pt-BR
--   libras-BR
--   audio-pt-BR
--   video-libras
--
-- É referenciada pelas sessões, solicitações de tradução
-- e resultados de tradução.
-- =========================================================

CREATE TABLE formato_idioma (
    id_formato_idioma BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    codigo_formato_idioma VARCHAR(30) NOT NULL,
    nome_formato_idioma VARCHAR(100) NOT NULL,
    tipo_formato_idioma VARCHAR(30) NOT NULL,
    descricao_formato_idioma TEXT,
    situacao_formato_idioma TINYINT(1) NOT NULL DEFAULT 1,

    PRIMARY KEY (id_formato_idioma),

    UNIQUE KEY uk_formato_idioma_codigo (codigo_formato_idioma)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================
-- 4. SESSÃO DE COMUNICAÇÃO
-- Representa uma sessão de comunicação entre dois ou mais
-- participantes.
--
-- Define também o formato/idioma de origem e destino
-- utilizados na sessão.
--
-- Uma sessão pode possuir vários participantes.
-- =========================================================

CREATE TABLE sessao_comunicacao (
    id_sessao BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    codigo_sessao VARCHAR(50) NOT NULL,
    tipo_sessao VARCHAR(50) NOT NULL,
    id_formato_idioma_origem BIGINT UNSIGNED NOT NULL,
    id_formato_idioma_destino BIGINT UNSIGNED NOT NULL,
    iniciada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    encerrada_em TIMESTAMP NULL DEFAULT NULL,
    status_sessao_comunicacao VARCHAR(30) NOT NULL DEFAULT 'ativa',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id_sessao),

    UNIQUE KEY uk_sessao_codigo (codigo_sessao),

    KEY fk_sessao_formato_origem (id_formato_idioma_origem),
    KEY fk_sessao_formato_destino (id_formato_idioma_destino),

    CONSTRAINT fk_sessao_formato_origem
        FOREIGN KEY (id_formato_idioma_origem)
        REFERENCES formato_idioma (id_formato_idioma)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_sessao_formato_destino
        FOREIGN KEY (id_formato_idioma_destino)
        REFERENCES formato_idioma (id_formato_idioma)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================
-- 5. PARTICIPANTE DA SESSÃO
-- Relaciona os usuários às sessões de comunicação.
--
-- Permite que uma sessão possua dois ou mais participantes.
--
-- O campo papel_participante identifica a função exercida
-- pelo usuário dentro daquela sessão.
--
-- Exemplos:
--   solicitante
--   destinatario
--   interprete
--   mediador
-- =========================================================

CREATE TABLE participante_sessao (
    id_participante_sessao BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_sessao BIGINT UNSIGNED NOT NULL,
    id_usuario BIGINT UNSIGNED NOT NULL,
    papel_participante VARCHAR(30) NOT NULL,
    entrou_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    saiu_em TIMESTAMP NULL DEFAULT NULL,
    status_participante VARCHAR(30) NOT NULL DEFAULT 'ativo',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_participante_sessao),

    KEY fk_participante_sessao_usuario (id_usuario),
    KEY fk_participante_sessao_sessao (id_sessao),

    CONSTRAINT fk_participante_sessao_sessao
        FOREIGN KEY (id_sessao)
        REFERENCES sessao_comunicacao (id_sessao)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_participante_sessao_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================
-- 6. MENSAGEM
-- Armazena as mensagens enviadas pelos participantes
-- durante uma sessão.
--
-- O usuário e a sessão da mensagem são identificados
-- através de participante_sessao.
--
-- A mensagem pode possuir conteúdo textual ou estar
-- relacionada posteriormente a arquivos de mídia.
-- =========================================================

CREATE TABLE mensagem (
    id_mensagem BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_participante_sessao BIGINT UNSIGNED NOT NULL,
    tipo_entrada VARCHAR(30) NOT NULL,
    conteudo_textual TEXT,
    sequencia_mensagem INT UNSIGNED NOT NULL,
    enviada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recebida_em TIMESTAMP NULL DEFAULT NULL,
    status_mensagem VARCHAR(30) NOT NULL DEFAULT 'enviada',
    duracao_ms_mensagem INT UNSIGNED DEFAULT NULL,
    tamanho_bytes_mensagem BIGINT UNSIGNED DEFAULT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id_mensagem),

    KEY idx_mensagem_participante (id_participante_sessao),

    CONSTRAINT fk_mensagem_participante
        FOREIGN KEY (id_participante_sessao)
        REFERENCES participante_sessao (id_participante_sessao)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================
-- 7. ARQUIVO DE MÍDIA
-- Centraliza os metadados dos arquivos utilizados pelo Omni.
--
-- Pode armazenar referências para:
--   vídeos
--   áudios
--   arquivos gerados pelas traduções
--   mídias de referência do glossário
--
-- O arquivo pode ou não estar associado diretamente a
-- uma mensagem.
-- =========================================================

CREATE TABLE arquivo_midia (
    id_midia BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_mensagem BIGINT UNSIGNED DEFAULT NULL,
    tipo_midia VARCHAR(30) NOT NULL,
    formato_midia VARCHAR(30) DEFAULT NULL,
    mime_type VARCHAR(100) DEFAULT NULL,
    uri_armazenamento TEXT NOT NULL,
    tamanho_bytes BIGINT UNSIGNED DEFAULT NULL,
    duracao_ms INT UNSIGNED DEFAULT NULL,
    resolucao VARCHAR(20) DEFAULT NULL,
    criptografado TINYINT(1) NOT NULL DEFAULT 0,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id_midia),

    KEY fk_arquivo_midia_mensagem (id_mensagem),

    CONSTRAINT fk_arquivo_midia_mensagem
        FOREIGN KEY (id_mensagem)
        REFERENCES mensagem (id_mensagem)
        ON DELETE SET NULL
        ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================
-- 8. BIBLIOTECA DE VÍDEOS
-- Mantém o catálogo de vídeos utilizados como referências
-- de sinais em Libras.
--
-- Permite registrar se o conteúdo foi validado e se possui
-- autorização para uso pelo sistema.
-- =========================================================

CREATE TABLE biblioteca_video (
    id_biblioteca_video BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_midia BIGINT UNSIGNED NOT NULL,
    sinal_identificado VARCHAR(150) DEFAULT NULL,
    qualidade_validada TINYINT(1) NOT NULL DEFAULT 0,
    uso_permitido TINYINT(1) NOT NULL DEFAULT 0,
    status_biblioteca_video VARCHAR(30) NOT NULL DEFAULT 'ativo',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id_biblioteca_video),

    KEY fk_biblioteca_video_midia (id_midia),

    CONSTRAINT fk_biblioteca_video_midia
        FOREIGN KEY (id_midia)
        REFERENCES arquivo_midia (id_midia)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================
-- 9. GLOSSÁRIO FINAL
-- Armazena termos em português e suas correspondências
-- em Libras.
--
-- Pode associar o termo a um vídeo existente na biblioteca
-- e também a um arquivo de mídia utilizado como referência.
-- =========================================================

CREATE TABLE glossario_final (
    id_glossario BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_biblioteca_video BIGINT UNSIGNED DEFAULT NULL,
    termo_portugues VARCHAR(150) NOT NULL,
    glosa_libras VARCHAR(150) DEFAULT NULL,
    descricao_sinal TEXT,
    id_midia_referencia BIGINT UNSIGNED DEFAULT NULL,
    situacao_glossario_final TINYINT(1) NOT NULL DEFAULT 1,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id_glossario),

    KEY fk_glossario_biblioteca_video (id_biblioteca_video),
    KEY fk_glossario_midia_referencia (id_midia_referencia),

    CONSTRAINT fk_glossario_biblioteca_video
        FOREIGN KEY (id_biblioteca_video)
        REFERENCES biblioteca_video (id_biblioteca_video)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_glossario_midia_referencia
        FOREIGN KEY (id_midia_referencia)
        REFERENCES arquivo_midia (id_midia)
        ON DELETE SET NULL
        ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================
-- 10. SOLICITAÇÃO DE TRADUÇÃO
-- Registra cada pedido de tradução realizado a partir de
-- uma mensagem.
--
-- Define:
--   formato de origem
--   formato de destino
--   direção da tradução
--   tipo de processamento
--   tempo de execução
--   status
--   possíveis erros
-- =========================================================

CREATE TABLE solicitacao_traducao (
    id_solicitacao_traducao BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_mensagem BIGINT UNSIGNED NOT NULL,
    direcao_traducao VARCHAR(30) NOT NULL,
    id_formato_idioma_origem BIGINT UNSIGNED NOT NULL,
    id_formato_idioma_destino BIGINT UNSIGNED NOT NULL,
    tipo_processamento VARCHAR(30) DEFAULT NULL,
    solicitada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    iniciada_em TIMESTAMP NULL DEFAULT NULL,
    finalizada_em TIMESTAMP NULL DEFAULT NULL,
    tempo_processamento_ms INT UNSIGNED DEFAULT NULL,
    status_solicitacao_traducao VARCHAR(30)
        NOT NULL DEFAULT 'pendente',
    codigo_erro VARCHAR(50) DEFAULT NULL,
    mensagem_erro TEXT,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id_solicitacao_traducao),

    KEY fk_solicitacao_mensagem (id_mensagem),
    KEY fk_solicitacao_formato_origem (id_formato_idioma_origem),
    KEY fk_solicitacao_formato_destino (id_formato_idioma_destino),

    CONSTRAINT fk_solicitacao_mensagem
        FOREIGN KEY (id_mensagem)
        REFERENCES mensagem (id_mensagem)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_solicitacao_formato_origem
        FOREIGN KEY (id_formato_idioma_origem)
        REFERENCES formato_idioma (id_formato_idioma)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_solicitacao_formato_destino
        FOREIGN KEY (id_formato_idioma_destino)
        REFERENCES formato_idioma (id_formato_idioma)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================
-- 11. RESULTADO DA TRADUÇÃO
-- Armazena os resultados gerados para uma solicitação
-- de tradução.
--
-- Um resultado pode ser:
--   texto
--   vídeo
--   áudio
--   outra representação suportada pelo sistema
--
-- id_midia é opcional, permitindo resultados puramente
-- textuais.
-- =========================================================

CREATE TABLE resultado_traducao (
    id_resultado_traducao BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_solicitacao_traducao BIGINT UNSIGNED NOT NULL,
    id_formato_idioma BIGINT UNSIGNED NOT NULL,
    id_midia BIGINT UNSIGNED DEFAULT NULL,
    tipo_saida VARCHAR(30) NOT NULL,
    conteudo_textual TEXT,
    ordem_saida INT UNSIGNED NOT NULL DEFAULT 0,
    revisado_em TIMESTAMP NULL DEFAULT NULL,
    status_revisao VARCHAR(30) DEFAULT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id_resultado_traducao),

    KEY fk_resultado_solicitacao (id_solicitacao_traducao),
    KEY fk_resultado_formato (id_formato_idioma),
    KEY fk_resultado_midia (id_midia),

    CONSTRAINT fk_resultado_solicitacao
        FOREIGN KEY (id_solicitacao_traducao)
        REFERENCES solicitacao_traducao (id_solicitacao_traducao)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_resultado_formato
        FOREIGN KEY (id_formato_idioma)
        REFERENCES formato_idioma (id_formato_idioma)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_resultado_midia
        FOREIGN KEY (id_midia)
        REFERENCES arquivo_midia (id_midia)
        ON DELETE SET NULL
        ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================
-- 12. ETAPA DA TRADUÇÃO
-- Registra cada etapa executada durante o processamento
-- de uma solicitação de tradução.
--
-- Exemplos:
--   reconhecimento de texto
--   tradução linguística
--   geração de avatar
--
-- A PK composta identifica a etapa pela solicitação +
-- ordem de execução.
-- =========================================================

CREATE TABLE etapa_traducao (
    id_solicitacao_traducao BIGINT UNSIGNED NOT NULL,
    ordem_etapa SMALLINT UNSIGNED NOT NULL,
    id_resultado_traducao BIGINT UNSIGNED DEFAULT NULL,
    tipo_etapa VARCHAR(50) NOT NULL,
    status_etapa_traducao VARCHAR(30) NOT NULL DEFAULT 'pendente',
    confianca DECIMAL(4,3) DEFAULT NULL,
    iniciada_em TIMESTAMP NULL DEFAULT NULL,
    finalizada_em TIMESTAMP NULL DEFAULT NULL,
    duracao_ms_etapa INT UNSIGNED DEFAULT NULL,
    codigo_erro VARCHAR(50) DEFAULT NULL,
    mensagem_erro TEXT,

    PRIMARY KEY (
        id_solicitacao_traducao,
        ordem_etapa
    ),

    KEY fk_etapa_resultado (id_resultado_traducao),

    CONSTRAINT fk_etapa_solicitacao
        FOREIGN KEY (id_solicitacao_traducao)
        REFERENCES solicitacao_traducao (id_solicitacao_traducao)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_etapa_resultado
        FOREIGN KEY (id_resultado_traducao)
        REFERENCES resultado_traducao (id_resultado_traducao)
        ON DELETE SET NULL
        ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================
-- 13. MOVIMENTO DA IA
-- Armazena movimentos produzidos ou utilizados pela IA
-- durante a geração da representação em Libras.
--
-- Pode relacionar o movimento:
--   ao resultado da tradução
--   a um sinal existente na biblioteca de vídeos
--
-- Também armazena sequência, intervalo de tempo,
-- confiança e representação do movimento.
-- =========================================================

CREATE TABLE movimento_ia (
    id_movimento_ia BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_resultado_traducao BIGINT UNSIGNED DEFAULT NULL,
    id_biblioteca_video BIGINT UNSIGNED DEFAULT NULL,
    sequencia_movimento INT UNSIGNED DEFAULT NULL,
    tipo_movimento VARCHAR(30) NOT NULL,
    formato_representacao VARCHAR(30) DEFAULT NULL,
    dados_movimento TEXT,
    inicio_ms INT UNSIGNED DEFAULT NULL,
    fim_ms INT UNSIGNED DEFAULT NULL,
    confianca DECIMAL(4,3) DEFAULT NULL,
    versao_esquema VARCHAR(20) DEFAULT NULL,
    status_movimento_ia VARCHAR(30) DEFAULT 'processado',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_movimento_ia),

    KEY fk_movimento_resultado (id_resultado_traducao),
    KEY fk_movimento_biblioteca_video (id_biblioteca_video),

    CONSTRAINT fk_movimento_resultado
        FOREIGN KEY (id_resultado_traducao)
        REFERENCES resultado_traducao (id_resultado_traducao)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_movimento_biblioteca_video
        FOREIGN KEY (id_biblioteca_video)
        REFERENCES biblioteca_video (id_biblioteca_video)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_movimento_tempo
        CHECK (
            inicio_ms IS NULL
            OR fim_ms IS NULL
            OR fim_ms >= inicio_ms
        )

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================
-- 14. ÁUDIO SINTETIZADO
-- Armazena informações dos áudios produzidos a partir
-- de um resultado de tradução.
--
-- Contém dados como:
--   idioma
--   voz utilizada
--   velocidade
--   tom
--   volume
--   taxa de amostragem
--   duração
--
-- Cada resultado de tradução pode possuir no máximo
-- um áudio sintetizado nesta modelagem.
-- =========================================================

CREATE TABLE audio_sintetizado (
    id_audio BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_resultado_traducao BIGINT UNSIGNED NOT NULL,
    id_midia BIGINT UNSIGNED NOT NULL,
    idioma_audio VARCHAR(20) DEFAULT NULL,
    voz_codigo VARCHAR(50) DEFAULT NULL,
    velocidade DECIMAL(3,2) DEFAULT NULL,
    tom DECIMAL(3,2) DEFAULT NULL,
    volume DECIMAL(3,2) DEFAULT NULL,
    formato_audio VARCHAR(20) DEFAULT NULL,
    taxa_amostragem INT UNSIGNED DEFAULT NULL,
    duracao_ms INT UNSIGNED DEFAULT NULL,

    PRIMARY KEY (id_audio),

    UNIQUE KEY uk_audio_resultado (id_resultado_traducao),

    KEY fk_audio_midia (id_midia),

    CONSTRAINT fk_audio_resultado
        FOREIGN KEY (id_resultado_traducao)
        REFERENCES resultado_traducao (id_resultado_traducao)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_audio_midia
        FOREIGN KEY (id_midia)
        REFERENCES arquivo_midia (id_midia)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;
