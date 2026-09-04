-- -----------------------------------------------------------------
-- 1. FORMATO_IDIOMA - dominio de idiomas/formatos
-- -----------------------------------------------------------------
INSERT INTO FORMATO_IDIOMA (codigo, nome, tipo, descricao, ativo) VALUES
    ('pt-BR',        'Português (Brasil)',       'texto', 'Idioma falado/escrito padrão', true), -- id 1
    ('libras-BR',    'Libras (Brasil)',          'sinal',  'Língua de sinais brasileira',  true), -- id 2
    ('audio-pt-BR',  'Áudio em Português',       'audio',  'Saída de voz sintetizada',     true), -- id 3
    ('video-libras', 'Vídeo em Libras (avatar)', 'video',  'Saída em avatar 3D',           true), -- id 4
    ('texto-pt-BR',  'Texto em Português',       'texto',  'Saída em texto simples',       true); -- id 5
 
-- -----------------------------------------------------------------
-- 2. USUARIO
-- -----------------------------------------------------------------
INSERT INTO USUARIO (nome_exibicao, nome_completo, email, telefone, tipo_usuario, status_usuario) VALUES
    ('Maria Souza',    'Maria da Silva Souza', 'maria@exemplo.com', '+5544999990001', 'ouvinte',    'ativo'), -- id 1
    ('João Surdo',     'João Pereira Lima',    'joao@exemplo.com',  '+5544999990002', 'surdo',      'ativo'), -- id 2
    ('Ana Intérprete', 'Ana Costa Ribeiro',    'ana@exemplo.com',   '+5544999990003', 'interprete', 'ativo'); -- id 3
 
-- -----------------------------------------------------------------
-- 3. PERFIL_ACESSIBILIDADE (id_usuario 2 = Joao Surdo)
-- -----------------------------------------------------------------
INSERT INTO PERFIL_ACESSIBILIDADE (id_usuario, id_idioma_interface, usa_libras, prefere_video_libras, tamanho_fonte, alto_contraste, notificacao_visual, notificacao_vibratoria) VALUES
    (2, 2, true, true, 'grande', true, true, true);
 
-- -----------------------------------------------------------------
-- 4. SESSAO_COMUNICACAO (iniciada por Maria, id_usuario 1)
-- -----------------------------------------------------------------
INSERT INTO SESSAO_COMUNICACAO (id_usuario, id_participante_sessao status) VALUES
    ('SESS-2026-0001', 'conversa', 1, 1, 2, 'ativa'); -- id_sessao 1
 
-- -----------------------------------------------------------------
-- 5. PARTICIPANTE_SESSAO (sessao 1: Maria e Joao)
-- -----------------------------------------------------------------
INSERT INTO PARTICIPANTE_SESSAO (id_sessao_comunicao, id_usuario, papel, status) VALUES
    (1, 1, 'solicitante',  'ativo'), -- id 1
    (1, 2, 'destinatario', 'ativo'); -- id 2
 
-- -----------------------------------------------------------------
-- 6. MENSAGEM
-- -----------------------------------------------------------------
INSERT INTO MENSAGEM (id_usuario, status) VALUES
    (1, 1, 1, 'texto', 'Bom dia, gostaria de agendar uma consulta.', 1, 'entregue'); -- id_mensagem 1
 
-- -----------------------------------------------------------------
-- 7. GLOSSARIO_FINAL
-- -----------------------------------------------------------------
INSERT INTO GLOSSARIO_FINAL (termo_portugues, glosa_libras, descricao_sinal, categoria, regiao, ativo) VALUES
    ('bom dia',  'BOM-DIA',  'Mão em concha próxima ao rosto, movimento ascendente', 'saudacao', 'nacional', true), -- id 1
    ('consulta', 'CONSULTA', 'Sinal de duas mãos em L se aproximando',              'saude',    'nacional', true); -- id 2
 
-- ---------------------------------------------------------------
-- 8. ARQUIVO_MIDIA (referencia do glossario + saida da traducao)
-- ---------------------------------------------------------------
INSERT INTO ARQUIVO_MIDIA (id_mensagem, tipo_midia, formato_midia, mime_type, uri_armazenamento, criptografado) VALUES
    (NULL, 'video', 'mp4', 'video/mp4', 's3://omni-midia/glossario/bom-dia-ref.mp4',           false), -- id 1
    (NULL, 'video', 'mp4', 'video/mp4', 's3://omni-midia/glossario/consulta-ref.mp4',          false), -- id 2
    (NULL, 'video', 'mp4', 'video/mp4', 's3://omni-midia/saidas/sessao-0001-video-libras.mp4', true);  -- id 3
 
-- -----------------------------------------------------------------
-- 9. BIBLIOTECA_VIDEO - videos de interpretes reais usados pela IA
-- -----------------------------------------------------------------
INSERT INTO BIBLIOTECA_VIDEO (id_arquivo_midia, sinal_identificacao, qualidade_validada, uso_permitido, status) VALUES
    (1, 1, 'Ana Costa Ribeiro', 'frontal', true, true, 'ativo'), -- id 1
    (2, 2, 'Ana Costa Ribeiro', 'frontal', true, true, 'ativo'); -- id 2
 
-- ------------------------
-- 10. SOLICITACAO_TRADUCAO
-- ------------------------
INSERT INTO SOLICITACAO_TRADUCAO (id_mensagem, direcao_traducao, idioma_origem_solitacao, idioma_destino_solicitacao, tipo_processamento, status, finalizada_em, tempo_processamento_ms) VALUES
    (1, 'texto_para_libras', 1, 2, 'automatico', 'concluida', now(), 1450); -- id_traducao 1
 
-- ------------------
-- 11. ETAPA_TRADUCAO
-- ------------------
INSERT INTO ETAPA_TRADUCAO (id_solicitacao_traducao, id_resultado_traducao, tipo_etapa, ordem_etapa, status, duracao_ms,) VALUES
    (1, 'reconhecimento_texto', 1, 'concluida', 120, 0.9900),
    (1, 'traducao_linguistica',  2, 'concluida', 380, 0.9600),
    (1, 'geracao_avatar',        3, 'concluida', 950, 0.9400);
 
-- ----------------------
-- 12. RESULTADO_TRADUCAO
-- ----------------------
INSERT INTO RESULTADO_TRADUCAO (id_traducao, id_solicitacao_traducao, id_formato_idioma, id_arquivo_midia, ordem_saida) VALUES
    (1, 'video_libras', 4, 3, 0.9900, 0.9600, 0.9400, 0.9633, false, 1, now()); -- id_resultado 1
 
-- ---------------------------------------------------------------------------
-- 15. MOVIMENTO_IA - movimentos gerados, referenciando a biblioteca de videos
-- ---------------------------------------------------------------------------
INSERT INTO MOVIMENTO_IA (id_resultado_traducao, id_biblioteca_video, sequencia_movimento, tipo_movimento, formato_representacao, dados_movimento, inicio_ms, fim_ms, confianca, status) VALUES
    (1, 1, 1, 'sinal', 'gerado', 'esqueleto_3d', 'referencia_bom_dia',  0,    1800, 0.9500, 'processado'),
    (1, 2, 2, 'sinal', 'gerado', 'esqueleto_3d', 'referencia_consulta', 1800, 4200, 0.9300, 'processado');
 