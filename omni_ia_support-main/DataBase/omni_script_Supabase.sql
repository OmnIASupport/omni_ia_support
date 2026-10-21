-- =========================================================
-- ESTRUTURA DO BANCO DE DADOS - PROJETO OMNI
-- Adaptado para Supabase (PostgreSQL)
-- =========================================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
 
 
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
    id_usuario SERIAL PRIMARY KEY,
    nome_exibicao VARCHAR(150) NOT NULL,
    nome_completo VARCHAR(250) DEFAULT NULL,
    email_usuario VARCHAR(255) DEFAULT NULL,
    telefone_usuario VARCHAR(20) DEFAULT NULL,
    tipo_usuario VARCHAR(50) NOT NULL DEFAULT 'usuario',
    status_usuario VARCHAR(30) NOT NULL DEFAULT 'ativo',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 
    CONSTRAINT uk_usuario_email UNIQUE (email_usuario)
);
 
CREATE TRIGGER set_timestamp_usuario
    BEFORE UPDATE ON usuario
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
 
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
-- TODO: criar policies (ex.: usuário só vê/edita o próprio registro)
 
 
-- =========================================================
-- 2. PERFIL DE ACESSIBILIDADE
-- Armazena as preferências e necessidades de acessibilidade
-- associadas a cada usuário.
--
-- Cada usuário pode possuir no máximo um perfil de
-- acessibilidade.
-- =========================================================
 
CREATE TABLE perfil_acessibilidade (
    id_perfil_acessibilidade SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    usa_libras BOOLEAN NOT NULL DEFAULT FALSE,
    prefere_audio BOOLEAN NOT NULL DEFAULT FALSE,
    prefere_texto BOOLEAN NOT NULL DEFAULT FALSE,
    prefere_legenda BOOLEAN NOT NULL DEFAULT FALSE,
    velocidade_audio DECIMAL(3,2) DEFAULT 1.00,
    volume_audio DECIMAL(3,2) DEFAULT 1.00,
    tamanho_fonte VARCHAR(20) DEFAULT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 
    CONSTRAINT uk_perfil_acessibilidade_usuario UNIQUE (id_usuario),
 
    CONSTRAINT fk_perfil_acessibilidade_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
 
CREATE TRIGGER set_timestamp_perfil_acessibilidade
    BEFORE UPDATE ON perfil_acessibilidade
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
 
ALTER TABLE perfil_acessibilidade ENABLE ROW LEVEL SECURITY;
 
 
-- =========================================================
-- 3. FORMATO / IDIOMA
-- Tabela de domínio utilizada para cadastrar os formatos e
-- idiomas suportados pelo sistema.
--
-- Exemplos: pt-BR, libras-BR, audio-pt-BR, video-libras
-- =========================================================
 
CREATE TABLE formato_idioma (
    id_formato_idioma SERIAL PRIMARY KEY,
    codigo_formato_idioma VARCHAR(30) NOT NULL,
    nome_formato_idioma VARCHAR(100) NOT NULL,
    tipo_formato_idioma VARCHAR(30) NOT NULL,
    descricao_formato_idioma TEXT,
    situacao_formato_idioma BOOLEAN NOT NULL DEFAULT TRUE,
 
    CONSTRAINT uk_formato_idioma_codigo UNIQUE (codigo_formato_idioma)
);
 
ALTER TABLE formato_idioma ENABLE ROW LEVEL SECURITY;
 
 
-- =========================================================
-- 4. SESSÃO DE COMUNICAÇÃO
-- Representa uma sessão de comunicação entre dois ou mais
-- participantes, com formato/idioma de origem e destino.
-- =========================================================
 
CREATE TABLE sessao_comunicacao (
    id_sessao SERIAL PRIMARY KEY,
    codigo_sessao VARCHAR(50) NOT NULL,
    tipo_sessao VARCHAR(50) NOT NULL,
    id_formato_idioma_origem INTEGER NOT NULL,
    id_formato_idioma_destino INTEGER NOT NULL,
    iniciada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    encerrada_em TIMESTAMPTZ DEFAULT NULL,
    status_sessao_comunicacao VARCHAR(30) NOT NULL DEFAULT 'ativa',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 
    CONSTRAINT uk_sessao_codigo UNIQUE (codigo_sessao),
 
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
);
 
CREATE INDEX idx_sessao_formato_origem ON sessao_comunicacao (id_formato_idioma_origem);
CREATE INDEX idx_sessao_formato_destino ON sessao_comunicacao (id_formato_idioma_destino);
 
CREATE TRIGGER set_timestamp_sessao_comunicacao
    BEFORE UPDATE ON sessao_comunicacao
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
 
ALTER TABLE sessao_comunicacao ENABLE ROW LEVEL SECURITY;
 
 
-- =========================================================
-- 5. PARTICIPANTE DA SESSÃO
-- Relaciona os usuários às sessões de comunicação.
--
-- papel_participante: solicitante, destinatario,
-- interprete, mediador, etc.
-- =========================================================
 
CREATE TABLE participante_sessao (
    id_participante_sessao SERIAL PRIMARY KEY,
    id_sessao INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    papel_participante VARCHAR(30) NOT NULL,
    entrou_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    saiu_em TIMESTAMPTZ DEFAULT NULL,
    status_participante VARCHAR(30) NOT NULL DEFAULT 'ativo',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 
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
);
 
CREATE INDEX idx_participante_sessao_usuario ON participante_sessao (id_usuario);
CREATE INDEX idx_participante_sessao_sessao ON participante_sessao (id_sessao);
 
ALTER TABLE participante_sessao ENABLE ROW LEVEL SECURITY;
 
 
-- =========================================================
-- 6. MENSAGEM
-- Armazena as mensagens enviadas pelos participantes
-- durante uma sessão.
-- =========================================================
 
CREATE TABLE mensagem (
    id_mensagem SERIAL PRIMARY KEY,
    id_participante_sessao INTEGER NOT NULL,
    tipo_entrada VARCHAR(30) NOT NULL,
    conteudo_textual TEXT,
    sequencia_mensagem INTEGER NOT NULL,
    enviada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recebida_em TIMESTAMPTZ DEFAULT NULL,
    status_mensagem VARCHAR(30) NOT NULL DEFAULT 'enviada',
    duracao_ms_mensagem INTEGER DEFAULT NULL,
    tamanho_bytes_mensagem BIGINT DEFAULT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 
    CONSTRAINT fk_mensagem_participante
        FOREIGN KEY (id_participante_sessao)
        REFERENCES participante_sessao (id_participante_sessao)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
 
CREATE INDEX idx_mensagem_participante ON mensagem (id_participante_sessao);
 
CREATE TRIGGER set_timestamp_mensagem
    BEFORE UPDATE ON mensagem
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
 
ALTER TABLE mensagem ENABLE ROW LEVEL SECURITY;
 
 
-- =========================================================
-- 7. ARQUIVO DE MÍDIA
-- Centraliza os metadados dos arquivos utilizados pelo Omni.
-- =========================================================
 
CREATE TABLE arquivo_midia (
    id_midia SERIAL PRIMARY KEY,
    id_mensagem INTEGER DEFAULT NULL,
    tipo_midia VARCHAR(30) NOT NULL,
    formato_midia VARCHAR(30) DEFAULT NULL,
    mime_type VARCHAR(100) DEFAULT NULL,
    uri_armazenamento TEXT NOT NULL,
    tamanho_bytes BIGINT DEFAULT NULL,
    duracao_ms INTEGER DEFAULT NULL,
    resolucao VARCHAR(20) DEFAULT NULL,
    criptografado BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 
    CONSTRAINT fk_arquivo_midia_mensagem
        FOREIGN KEY (id_mensagem)
        REFERENCES mensagem (id_mensagem)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);
 
CREATE INDEX idx_arquivo_midia_mensagem ON arquivo_midia (id_mensagem);
 
CREATE TRIGGER set_timestamp_arquivo_midia
    BEFORE UPDATE ON arquivo_midia
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
 
ALTER TABLE arquivo_midia ENABLE ROW LEVEL SECURITY;
 
 
-- =========================================================
-- 8. BIBLIOTECA DE VÍDEOS
-- Catálogo de vídeos utilizados como referências de sinais
-- em Libras.
-- =========================================================
 
CREATE TABLE biblioteca_video (
    id_biblioteca_video SERIAL PRIMARY KEY,
    id_midia INTEGER NOT NULL,
    sinal_identificado VARCHAR(150) DEFAULT NULL,
    qualidade_validada BOOLEAN NOT NULL DEFAULT FALSE,
    uso_permitido BOOLEAN NOT NULL DEFAULT FALSE,
    status_biblioteca_video VARCHAR(30) NOT NULL DEFAULT 'ativo',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 
    CONSTRAINT fk_biblioteca_video_midia
        FOREIGN KEY (id_midia)
        REFERENCES arquivo_midia (id_midia)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
 
CREATE INDEX idx_biblioteca_video_midia ON biblioteca_video (id_midia);
 
CREATE TRIGGER set_timestamp_biblioteca_video
    BEFORE UPDATE ON biblioteca_video
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
 
ALTER TABLE biblioteca_video ENABLE ROW LEVEL SECURITY;
 
 
-- =========================================================
-- 9. GLOSSÁRIO FINAL
-- Termos em português e suas correspondências em Libras.
-- =========================================================
 
CREATE TABLE glossario_final (
    id_glossario SERIAL PRIMARY KEY,
    id_biblioteca_video INTEGER DEFAULT NULL,
    termo_portugues VARCHAR(150) NOT NULL,
    glosa_libras VARCHAR(150) DEFAULT NULL,
    descricao_sinal TEXT,
    id_midia_referencia INTEGER DEFAULT NULL,
    situacao_glossario_final BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 
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
);
 
CREATE INDEX idx_glossario_biblioteca_video ON glossario_final (id_biblioteca_video);
CREATE INDEX idx_glossario_midia_referencia ON glossario_final (id_midia_referencia);
 
CREATE TRIGGER set_timestamp_glossario_final
    BEFORE UPDATE ON glossario_final
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
 
ALTER TABLE glossario_final ENABLE ROW LEVEL SECURITY;
 
 
-- =========================================================
-- 10. SOLICITAÇÃO DE TRADUÇÃO
-- Registra cada pedido de tradução realizado a partir de
-- uma mensagem.
-- =========================================================
 
CREATE TABLE solicitacao_traducao (
    id_solicitacao_traducao SERIAL PRIMARY KEY,
    id_mensagem INTEGER NOT NULL,
    direcao_traducao VARCHAR(30) NOT NULL,
    id_formato_idioma_origem INTEGER NOT NULL,
    id_formato_idioma_destino INTEGER NOT NULL,
    tipo_processamento VARCHAR(30) DEFAULT NULL,
    solicitada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    iniciada_em TIMESTAMPTZ DEFAULT NULL,
    finalizada_em TIMESTAMPTZ DEFAULT NULL,
    tempo_processamento_ms INTEGER DEFAULT NULL,
    status_solicitacao_traducao VARCHAR(30) NOT NULL DEFAULT 'pendente',
    codigo_erro VARCHAR(50) DEFAULT NULL,
    mensagem_erro TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 
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
);
 
CREATE INDEX idx_solicitacao_mensagem ON solicitacao_traducao (id_mensagem);
CREATE INDEX idx_solicitacao_formato_origem ON solicitacao_traducao (id_formato_idioma_origem);
CREATE INDEX idx_solicitacao_formato_destino ON solicitacao_traducao (id_formato_idioma_destino);
 
CREATE TRIGGER set_timestamp_solicitacao_traducao
    BEFORE UPDATE ON solicitacao_traducao
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
 
ALTER TABLE solicitacao_traducao ENABLE ROW LEVEL SECURITY;
 
 
-- =========================================================
-- 11. RESULTADO DA TRADUÇÃO
-- Resultados gerados para uma solicitação de tradução:
-- texto, vídeo, áudio ou outra representação suportada.
-- =========================================================
 
CREATE TABLE resultado_traducao (
    id_resultado_traducao SERIAL PRIMARY KEY,
    id_solicitacao_traducao INTEGER NOT NULL,
    id_formato_idioma INTEGER NOT NULL,
    id_midia INTEGER DEFAULT NULL,
    tipo_saida VARCHAR(30) NOT NULL,
    conteudo_textual TEXT,
    ordem_saida INTEGER NOT NULL DEFAULT 0,
    revisado_em TIMESTAMPTZ DEFAULT NULL,
    status_revisao VARCHAR(30) DEFAULT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 
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
);
 
CREATE INDEX idx_resultado_solicitacao ON resultado_traducao (id_solicitacao_traducao);
CREATE INDEX idx_resultado_formato ON resultado_traducao (id_formato_idioma);
CREATE INDEX idx_resultado_midia ON resultado_traducao (id_midia);
 
CREATE TRIGGER set_timestamp_resultado_traducao
    BEFORE UPDATE ON resultado_traducao
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
 
ALTER TABLE resultado_traducao ENABLE ROW LEVEL SECURITY;
 
 
-- =========================================================
-- 12. ETAPA DA TRADUÇÃO
-- Cada etapa executada durante o processamento de uma
-- solicitação de tradução (reconhecimento, tradução
-- linguística, geração de avatar, etc).
--
-- PK composta: id_solicitacao_traducao + ordem_etapa.
-- Não é SERIAL porque não é um identificador gerado sozinho
-- (ordem_etapa é definida pelo fluxo de processamento).
-- =========================================================
 
CREATE TABLE etapa_traducao (
    id_solicitacao_traducao INTEGER NOT NULL,
    ordem_etapa SMALLINT NOT NULL,
    id_resultado_traducao INTEGER DEFAULT NULL,
    tipo_etapa VARCHAR(50) NOT NULL,
    status_etapa_traducao VARCHAR(30) NOT NULL DEFAULT 'pendente',
    confianca DECIMAL(4,3) DEFAULT NULL,
    iniciada_em TIMESTAMPTZ DEFAULT NULL,
    finalizada_em TIMESTAMPTZ DEFAULT NULL,
    duracao_ms_etapa INTEGER DEFAULT NULL,
    codigo_erro VARCHAR(50) DEFAULT NULL,
    mensagem_erro TEXT,
 
    PRIMARY KEY (id_solicitacao_traducao, ordem_etapa),
 
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
);
 
CREATE INDEX idx_etapa_resultado ON etapa_traducao (id_resultado_traducao);
 
ALTER TABLE etapa_traducao ENABLE ROW LEVEL SECURITY;
 
 
-- =========================================================
-- 13. MOVIMENTO DA IA
-- Movimentos produzidos/utilizados pela IA durante a
-- geração da representação em Libras.
-- =========================================================
 
CREATE TABLE movimento_ia (
    id_movimento_ia SERIAL PRIMARY KEY,
    id_resultado_traducao INTEGER DEFAULT NULL,
    id_biblioteca_video INTEGER DEFAULT NULL,
    sequencia_movimento INTEGER DEFAULT NULL,
    tipo_movimento VARCHAR(30) NOT NULL,
    formato_representacao VARCHAR(30) DEFAULT NULL,
    dados_movimento TEXT,
    inicio_ms INTEGER DEFAULT NULL,
    fim_ms INTEGER DEFAULT NULL,
    confianca DECIMAL(4,3) DEFAULT NULL,
    versao_esquema VARCHAR(20) DEFAULT NULL,
    status_movimento_ia VARCHAR(30) DEFAULT 'processado',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 
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
);
 
CREATE INDEX idx_movimento_resultado ON movimento_ia (id_resultado_traducao);
CREATE INDEX idx_movimento_biblioteca_video ON movimento_ia (id_biblioteca_video);
 
ALTER TABLE movimento_ia ENABLE ROW LEVEL SECURITY;
 
 
-- =========================================================
-- 14. ÁUDIO SINTETIZADO
-- Áudios produzidos a partir de um resultado de tradução.
-- Cada resultado de tradução pode ter no máximo um áudio
-- sintetizado nesta modelagem.
-- =========================================================
 
CREATE TABLE audio_sintetizado (
    id_audio SERIAL PRIMARY KEY,
    id_resultado_traducao INTEGER NOT NULL,
    id_midia INTEGER NOT NULL,
    idioma_audio VARCHAR(20) DEFAULT NULL,
    voz_codigo VARCHAR(50) DEFAULT NULL,
    velocidade DECIMAL(3,2) DEFAULT NULL,
    tom DECIMAL(3,2) DEFAULT NULL,
    volume DECIMAL(3,2) DEFAULT NULL,
    formato_audio VARCHAR(20) DEFAULT NULL,
    taxa_amostragem INTEGER DEFAULT NULL,
    duracao_ms INTEGER DEFAULT NULL,
 
    CONSTRAINT uk_audio_resultado UNIQUE (id_resultado_traducao),
 
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
);
 
CREATE INDEX idx_audio_midia ON audio_sintetizado (id_midia);
 
ALTER TABLE audio_sintetizado ENABLE ROW LEVEL SECURITY;
 

-- =========================================================
-- INSERT'S - OMNI
-- Versão adaptada para Supabase (PostgreSQL)
-- =========================================================


-- =========================================================
-- 1. USUÁRIO
-- =========================================================
 
INSERT INTO usuario (
    id_usuario,
    nome_exibicao,
    nome_completo,
    email_usuario,
    telefone_usuario,
    tipo_usuario,
    status_usuario,
    criado_em,
    atualizado_em
)
VALUES
(1, 'Maria Souza', 'Maria da Silva Souza', 'maria@exemplo.com', '+5544999990001', 'usuario', 'ativo', '2026-09-07 14:00:07', '2026-09-07 14:00:07'),
(2, 'João Surdo', 'João Pereira Lima', 'joao@exemplo.com', '+5544999990002', 'usuario', 'ativo', '2026-09-07 14:00:07', '2026-09-07 14:00:07'),
(3, 'Ana Intérprete', 'Ana Costa Ribeiro', 'ana@exemplo.com', '+5544999990003', 'usuario', 'ativo', '2026-09-07 14:00:07', '2026-09-07 14:00:07');
 
 
-- =========================================================
-- 2. FORMATO / IDIOMA
-- =========================================================
 
INSERT INTO formato_idioma (
    id_formato_idioma,
    codigo_formato_idioma,
    nome_formato_idioma,
    tipo_formato_idioma,
    descricao_formato_idioma,
    situacao_formato_idioma
)
VALUES
(1, 'pt-BR', 'Português (Brasil)', 'texto', 'Idioma falado/escrito padrão', TRUE),
(2, 'libras-BR', 'Libras (Brasil)', 'sinal', 'Língua de sinais brasileira', TRUE),
(3, 'audio-pt-BR', 'Áudio em Português', 'audio', 'Saída de voz sintetizada', TRUE),
(4, 'video-libras', 'Vídeo em Libras (avatar)', 'video', 'Saída em avatar 2D', TRUE),
(5, 'texto-pt-BR', 'Texto em Português', 'texto', 'Saída em texto simples', TRUE);
 
 
-- =========================================================
-- 3. SESSÃO DE COMUNICAÇÃO
-- =========================================================
 
INSERT INTO sessao_comunicacao (
    id_sessao,
    codigo_sessao,
    tipo_sessao,
    id_formato_idioma_origem,
    id_formato_idioma_destino,
    iniciada_em,
    encerrada_em,
    status_sessao_comunicacao,
    criado_em,
    atualizado_em
)
VALUES
(1, 'SESS-2026-0002', 'conversa', 1, 2, '2026-09-08 14:00:07', NULL, 'ativa', '2026-09-08 14:00:07', '2026-09-09 14:00:07'),
(2, 'SESS-2026-0001', 'conversa', 1, 2, '2026-09-07 14:00:07', NULL, 'ativa', '2026-09-07 14:00:07', '2026-09-07 14:00:07');
 
 
-- =========================================================
-- 4. PARTICIPANTES DA SESSÃO
-- =========================================================
 
INSERT INTO participante_sessao (
    id_participante_sessao,
    id_sessao,
    id_usuario,
    papel_participante,
    entrou_em,
    saiu_em,
    status_participante,
    criado_em
)
VALUES
(1, 1, 1, 'solicitante', '2026-09-07 14:00:07', NULL, 'ativo', '2026-09-07 14:00:07'),
(2, 2, 2, 'destinatario', '2026-09-07 14:00:07', NULL, 'ativo', '2026-09-07 14:00:07');
 
 
-- =========================================================
-- 5. PERFIL DE ACESSIBILIDADE
-- =========================================================
 
INSERT INTO perfil_acessibilidade (
    id_perfil_acessibilidade,
    id_usuario,
    usa_libras,
    prefere_audio,
    prefere_texto,
    prefere_legenda,
    velocidade_audio,
    volume_audio,
    tamanho_fonte,
    criado_em,
    atualizado_em
)
VALUES
(1, 2, TRUE, FALSE, FALSE, TRUE, 1.00, 1.00, 'grande', '2026-09-07 14:00:07', '2026-09-07 14:00:07');
 
 
-- =========================================================
-- 6. MENSAGEM
-- =========================================================
 
INSERT INTO mensagem (
    id_mensagem,
    id_participante_sessao,
    tipo_entrada,
    conteudo_textual,
    sequencia_mensagem,
    enviada_em,
    recebida_em,
    status_mensagem,
    duracao_ms_mensagem,
    tamanho_bytes_mensagem,
    criado_em,
    atualizado_em
)
VALUES
(1, 1, 'texto', 'Bom dia, gostaria de agendar uma consulta.', 1, '2026-09-07 14:00:07', NULL, 'entregue', NULL, NULL, '2026-09-07 14:00:07', '2026-09-07 14:00:07');
 
 
-- =========================================================
-- 7. ARQUIVOS DE MÍDIA
-- =========================================================
 
INSERT INTO arquivo_midia (
    id_midia,
    id_mensagem,
    tipo_midia,
    formato_midia,
    mime_type,
    uri_armazenamento,
    tamanho_bytes,
    duracao_ms,
    resolucao,
    criptografado,
    criado_em,
    atualizado_em
)
VALUES
(1, NULL, 'video', 'mp4', 'video/mp4', 's3://omni-midia/glossario/bom-dia-ref.mp4', NULL, NULL, NULL, FALSE, '2026-09-07 14:00:07', '2026-09-07 14:00:07'),
(2, NULL, 'video', 'mp4', 'video/mp4', 's3://omni-midia/glossario/consulta-ref.mp4', NULL, NULL, NULL, FALSE, '2026-09-07 14:00:07', '2026-09-07 14:00:07'),
(3, 1, 'video', 'mp4', 'video/mp4', 's3://omni-midia/saidas/sessao-0001-video-libras.mp4', NULL, NULL, NULL, TRUE, '2026-09-07 14:00:07', '2026-09-07 14:00:07');
 
 
-- =========================================================
-- 8. SOLICITAÇÃO DE TRADUÇÃO
-- =========================================================
 
INSERT INTO solicitacao_traducao (
    id_solicitacao_traducao,
    id_mensagem,
    direcao_traducao,
    id_formato_idioma_origem,
    id_formato_idioma_destino,
    tipo_processamento,
    solicitada_em,
    iniciada_em,
    finalizada_em,
    tempo_processamento_ms,
    status_solicitacao_traducao,
    codigo_erro,
    mensagem_erro,
    criado_em,
    atualizado_em
)
VALUES
(1, 1, 'texto_para_libras', 1, 2, 'automatico', '2026-09-07 14:00:07', NULL, '2026-09-07 14:00:07', 1450, 'concluida', NULL, NULL, '2026-09-07 14:00:07', '2026-09-07 14:00:07');
 
 
-- =========================================================
-- 9. RESULTADO DA TRADUÇÃO
-- =========================================================
 
INSERT INTO resultado_traducao (
    id_resultado_traducao,
    id_solicitacao_traducao,
    id_formato_idioma,
    id_midia,
    tipo_saida,
    conteudo_textual,
    ordem_saida,
    revisado_em,
    status_revisao,
    criado_em,
    atualizado_em
)
VALUES
(1, 1, 4, 3, 'video_libras', NULL, 1, NULL, 'nao_revisado', '2026-09-07 14:00:07', '2026-09-07 14:00:07');
 
 
-- =========================================================
-- 10. BIBLIOTECA DE VÍDEOS
-- =========================================================
 
INSERT INTO biblioteca_video (
    id_biblioteca_video,
    id_midia,
    sinal_identificado,
    qualidade_validada,
    uso_permitido,
    status_biblioteca_video,
    criado_em,
    atualizado_em
)
VALUES
(1, 1, 'bom dia', TRUE, TRUE, 'ativo', '2026-09-07 14:00:07', '2026-09-07 14:00:07'),
(2, 2, 'consulta', TRUE, TRUE, 'ativo', '2026-09-07 14:00:07', '2026-09-07 14:00:07');
 
 
-- =========================================================
-- 11. GLOSSÁRIO
-- =========================================================
 
INSERT INTO glossario_final (
    id_glossario,
    id_biblioteca_video,
    termo_portugues,
    glosa_libras,
    descricao_sinal,
    id_midia_referencia,
    situacao_glossario_final,
    criado_em,
    atualizado_em
)
VALUES
(1, 1, 'bom dia', 'BOM-DIA', 'Mão em concha próxima ao rosto, movimento ascendente', 1, TRUE, '2026-09-07 14:00:07', '2026-09-07 14:00:07'),
(2, 2, 'consulta', 'CONSULTA', 'Sinal de duas mãos em L se aproximando', 2, TRUE, '2026-09-07 14:00:07', '2026-09-07 14:00:07');
 
 
-- =========================================================
-- 12. ETAPAS DA TRADUÇÃO
--
-- OBS: id_etapa_traducao (SERIAL, PK) não é informado aqui de
-- propósito — deixa o Postgres gerar sozinho. A combinação
-- (id_solicitacao_traducao, ordem_etapa) continua garantida
-- pela UNIQUE constraint criada no schema.
-- =========================================================
 
INSERT INTO etapa_traducao (
    id_solicitacao_traducao,
    ordem_etapa,
    id_resultado_traducao,
    tipo_etapa,
    status_etapa_traducao,
    confianca,
    iniciada_em,
    finalizada_em,
    duracao_ms_etapa,
    codigo_erro,
    mensagem_erro
)
VALUES
(1, 1, NULL, 'reconhecimento_texto', 'concluida', 0.990, NULL, NULL, 120, NULL, NULL),
(1, 2, NULL, 'traducao_linguistica', 'concluida', 0.960, NULL, NULL, 380, NULL, NULL),
(1, 3, 1, 'geracao_avatar', 'concluida', 0.940, NULL, NULL, 950, NULL, NULL);
 
 
-- =========================================================
-- 13. MOVIMENTOS DA IA
-- =========================================================
 
INSERT INTO movimento_ia (
    id_movimento_ia,
    id_resultado_traducao,
    id_biblioteca_video,
    sequencia_movimento,
    tipo_movimento,
    formato_representacao,
    dados_movimento,
    inicio_ms,
    fim_ms,
    confianca,
    versao_esquema,
    status_movimento_ia,
    criado_em
)
VALUES
(1, 1, 1, 1, 'sinal', 'gerado', 'esqueleto_2d', 0, 1800, 0.950, NULL, 'processado', '2026-09-07 14:00:07'),
(2, 1, 2, 2, 'sinal', 'gerado', 'esqueleto_2d', 1800, 4200, 0.930, NULL, 'processado', '2026-09-07 14:00:07');
 
 
-- =========================================================
-- REALINHAMENTO DAS SEQUENCES
-- Necessário porque os INSERTs acima informaram os IDs na mão.
-- Sem isso, o próximo INSERT sem id explícito (ex: feito pela
-- aplicação) tentaria gerar o id 1 de novo em cada tabela.
-- =========================================================
 
SELECT setval(pg_get_serial_sequence('usuario', 'id_usuario'), (SELECT MAX(id_usuario) FROM usuario));
SELECT setval(pg_get_serial_sequence('formato_idioma', 'id_formato_idioma'), (SELECT MAX(id_formato_idioma) FROM formato_idioma));
SELECT setval(pg_get_serial_sequence('sessao_comunicacao', 'id_sessao'), (SELECT MAX(id_sessao) FROM sessao_comunicacao));
SELECT setval(pg_get_serial_sequence('participante_sessao', 'id_participante_sessao'), (SELECT MAX(id_participante_sessao) FROM participante_sessao));
SELECT setval(pg_get_serial_sequence('perfil_acessibilidade', 'id_perfil_acessibilidade'), (SELECT MAX(id_perfil_acessibilidade) FROM perfil_acessibilidade));
SELECT setval(pg_get_serial_sequence('mensagem', 'id_mensagem'), (SELECT MAX(id_mensagem) FROM mensagem));
SELECT setval(pg_get_serial_sequence('arquivo_midia', 'id_midia'), (SELECT MAX(id_midia) FROM arquivo_midia));
SELECT setval(pg_get_serial_sequence('solicitacao_traducao', 'id_solicitacao_traducao'), (SELECT MAX(id_solicitacao_traducao) FROM solicitacao_traducao));
SELECT setval(pg_get_serial_sequence('resultado_traducao', 'id_resultado_traducao'), (SELECT MAX(id_resultado_traducao) FROM resultado_traducao));
SELECT setval(pg_get_serial_sequence('biblioteca_video', 'id_biblioteca_video'), (SELECT MAX(id_biblioteca_video) FROM biblioteca_video));
SELECT setval(pg_get_serial_sequence('glossario_final', 'id_glossario'), (SELECT MAX(id_glossario) FROM glossario_final));
SELECT setval(pg_get_serial_sequence('movimento_ia', 'id_movimento_ia'), (SELECT MAX(id_movimento_ia) FROM movimento_ia));
