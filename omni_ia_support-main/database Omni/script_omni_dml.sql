-- =========================================================
-- DADOS INICIAIS - PROJETO OMNI
-- Compatível com a estrutura final do banco
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
(
    1,
    'Maria Souza',
    'Maria da Silva Souza',
    'maria@exemplo.com',
    '+5544999990001',
    'usuario',
    'ativo',
    '2026-09-07 14:00:07',
    '2026-09-07 14:00:07'
),
(
    2,
    'João Surdo',
    'João Pereira Lima',
    'joao@exemplo.com',
    '+5544999990002',
    'usuario',
    'ativo',
    '2026-09-07 14:00:07',
    '2026-09-07 14:00:07'
),
(
    3,
    'Ana Intérprete',
    'Ana Costa Ribeiro',
    'ana@exemplo.com',
    '+5544999990003',
    'usuario',
    'ativo',
    '2026-09-07 14:00:07',
    '2026-09-07 14:00:07'
);


-- =========================================================
-- 2. FORMATO / IDIOMA
-- Precisa existir antes das sessões e traduções
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
(
    1,
    'pt-BR',
    'Português (Brasil)',
    'texto',
    'Idioma falado/escrito padrão',
    1
),
(
    2,
    'libras-BR',
    'Libras (Brasil)',
    'sinal',
    'Língua de sinais brasileira',
    1
),
(
    3,
    'audio-pt-BR',
    'Áudio em Português',
    'audio',
    'Saída de voz sintetizada',
    1
),
(
    4,
    'video-libras',
    'Vídeo em Libras (avatar)',
    'video',
    'Saída em avatar 3D',
    1
),
(
    5,
    'texto-pt-BR',
    'Texto em Português',
    'texto',
    'Saída em texto simples',
    1
);


-- =========================================================
-- 3. SESSÃO DE COMUNICAÇÃO
-- Agora possui id_sessao próprio.
-- Origem e destino são FKs para formato_idioma.
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
(
    1,
    'SESS-2026-0002',
    'conversa',
    1,
    2,
    '2026-09-08 14:00:07',
    NULL,
    'ativa',
    '2026-09-08 14:00:07',
    '2026-09-09 14:00:07'
),
(
    2,
    'SESS-2026-0001',
    'conversa',
    1,
    2,
    '2026-09-07 14:00:07',
    NULL,
    'ativa',
    '2026-09-07 14:00:07',
    '2026-09-07 14:00:07'
);


-- =========================================================
-- 4. PARTICIPANTES DA SESSÃO
-- Agora possui id_sessao + id_usuario
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
(
    1,
    1,
    1,
    'solicitante',
    '2026-09-07 14:00:07',
    NULL,
    'ativo',
    '2026-09-07 14:00:07'
),
(
    2,
    2,
    2,
    'destinatario',
    '2026-09-07 14:00:07',
    NULL,
    'ativo',
    '2026-09-07 14:00:07'
);


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
(
    1,
    2,
    1,
    0,
    0,
    1,
    1.00,
    1.00,
    'grande',
    '2026-09-07 14:00:07',
    '2026-09-07 14:00:07'
);


-- =========================================================
-- 6. MENSAGEM
-- id_usuario foi removido.
-- O usuário é obtido através de participante_sessao.
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
(
    1,
    1,
    'texto',
    'Bom dia, gostaria de agendar uma consulta.',
    1,
    '2026-09-07 14:00:07',
    NULL,
    'entregue',
    NULL,
    NULL,
    '2026-09-07 14:00:07',
    '2026-09-07 14:00:07'
);


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
(
    1,
    NULL,
    'video',
    'mp4',
    'video/mp4',
    's3://omni-midia/glossario/bom-dia-ref.mp4',
    NULL,
    NULL,
    NULL,
    0,
    '2026-09-07 14:00:07',
    '2026-09-07 14:00:07'
),
(
    2,
    NULL,
    'video',
    'mp4',
    'video/mp4',
    's3://omni-midia/glossario/consulta-ref.mp4',
    NULL,
    NULL,
    NULL,
    0,
    '2026-09-07 14:00:07',
    '2026-09-07 14:00:07'
),
(
    3,
    1,
    'video',
    'mp4',
    'video/mp4',
    's3://omni-midia/saidas/sessao-0001-video-libras.mp4',
    NULL,
    NULL,
    NULL,
    1,
    '2026-09-07 14:00:07',
    '2026-09-07 14:00:07'
);


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
(
    1,
    1,
    'texto_para_libras',
    1,
    2,
    'automatico',
    '2026-09-07 14:00:07',
    NULL,
    '2026-09-07 14:00:07',
    1450,
    'concluida',
    NULL,
    NULL,
    '2026-09-07 14:00:07',
    '2026-09-07 14:00:07'
);


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
(
    1,
    1,
    4,
    3,
    'video_libras',
    NULL,
    1,
    NULL,
    'nao_revisado',
    '2026-09-07 14:00:07',
    '2026-09-07 14:00:07'
);


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
(
    1,
    1,
    'bom dia',
    1,
    1,
    'ativo',
    '2026-09-07 14:00:07',
    '2026-09-07 14:00:07'
),
(
    2,
    2,
    'consulta',
    1,
    1,
    'ativo',
    '2026-09-07 14:00:07',
    '2026-09-07 14:00:07'
);


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
(
    1,
    1,
    'bom dia',
    'BOM-DIA',
    'Mão em concha próxima ao rosto, movimento ascendente',
    1,
    1,
    '2026-09-07 14:00:07',
    '2026-09-07 14:00:07'
),
(
    2,
    2,
    'consulta',
    'CONSULTA',
    'Sinal de duas mãos em L se aproximando',
    2,
    1,
    '2026-09-07 14:00:07',
    '2026-09-07 14:00:07'
);


-- =========================================================
-- 12. ETAPAS DA TRADUÇÃO
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
(
    1,
    1,
    NULL,
    'reconhecimento_texto',
    'concluida',
    0.990,
    NULL,
    NULL,
    120,
    NULL,
    NULL
),
(
    1,
    2,
    NULL,
    'traducao_linguistica',
    'concluida',
    0.960,
    NULL,
    NULL,
    380,
    NULL,
    NULL
),
(
    1,
    3,
    1,
    'geracao_avatar',
    'concluida',
    0.940,
    NULL,
    NULL,
    950,
    NULL,
    NULL
);


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
(
    1,
    1,
    1,
    1,
    'sinal',
    'gerado',
    'esqueleto_3d',
    0,
    1800,
    0.950,
    NULL,
    'processado',
    '2026-09-07 14:00:07'
),
(
    2,
    1,
    2,
    2,
    'sinal',
    'gerado',
    'esqueleto_3d',
    1800,
    4200,
    0.930,
    NULL,
    'processado',
    '2026-09-07 14:00:07'
);