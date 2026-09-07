-- -----------------------------------------------------------------
-- 1. FORMATO_IDIOMA
-- -----------------------------------------------------------------
INSERT INTO FORMATO_IDIOMA (codigo, nome, tipo, descricao, ativo) VALUES
    ('pt-BR',        'Português (Brasil)',       'texto', 'Idioma falado/escrito padrão', true), -- id 1
    ('libras-BR',    'Libras (Brasil)',          'sinal', 'Língua de sinais brasileira',  true), -- id 2
    ('audio-pt-BR',  'Áudio em Português',       'audio', 'Saída de voz sintetizada',     true), -- id 3
    ('video-libras', 'Vídeo em Libras (avatar)', 'video', 'Saída em avatar 3D',           true), -- id 4
    ('texto-pt-BR',  'Texto em Português',       'texto', 'Saída em texto simples',       true); -- id 5
 
-- -----------------------------------------------------------------
-- 2. USUARIO
-- -----------------------------------------------------------------
INSERT INTO USUARIO (nome_exibicao, nome_completo, email_usuario, telefone, tipo_usuario, status_usuario) VALUES
    ('Maria Souza',    'Maria da Silva Souza', 'maria@exemplo.com', '+5544999990001', 'ouvinte',    'ativo'), -- id 1
    ('João Surdo',     'João Pereira Lima',    'joao@exemplo.com',  '+5544999990002', 'surdo',      'ativo'), -- id 2
    ('Ana Intérprete', 'Ana Costa Ribeiro',    'ana@exemplo.com',   '+5544999990003', 'interprete', 'ativo'); -- id 3
 
-- -----------------------------------------------------------------
-- 3. PERFIL_ACESSIBILIDADE (id_usuario 2 = Joao Surdo)
-- -----------------------------------------------------------------
INSERT INTO PERFIL_ACESSIBILIDADE (id_usuario, usa_libras, prefere_audio, prefere_texto, prefere_legenda, tamanho_fonte) VALUES
    (2, true, false, false, true, 'grande');
 
-- -----------------------------------------------------------------
-- 4. PARTICIPANTE_SESSAO (registros independentes de participacao)
-- -----------------------------------------------------------------
INSERT INTO PARTICIPANTE_SESSAO (id_usuario, papel, status) VALUES
    (1, 'solicitante',  'ativo'), -- id_participante_sessao 1 (Maria)
    (2, 'destinatario', 'ativo'); -- id_participante_sessao 2 (Joao)
 
-- -----------------------------------------------------------------
-- 5. SESSAO_COMUNICACAO (uma linha por participante da sessao
--    SESS-2026-0001; as duas linhas compartilham o codigo_sessao)
-- -----------------------------------------------------------------
INSERT INTO SESSAO_COMUNICACAO (id_usuario, id_participante_sessao, codigo_sessao, tipo_sessao, idioma_origem, idioma_destino, status) VALUES
    (1, 1, 'SESS-2026-0001', 'conversa', 'pt-BR', 'libras-BR', 'ativa'), -- Maria
    (2, 2, 'SESS-2026-0001', 'conversa', 'pt-BR', 'libras-BR', 'ativa'); -- Joao
 
-- -----------------------------------------------------------------
-- 6. MENSAGEM (enviada por Maria, dentro da sua entrada na sessao)
-- -----------------------------------------------------------------
INSERT INTO MENSAGEM (id_usuario, id_participante_sessao, tipo_entrada, conteudo_textual, sequencia_mensagem, status) VALUES
    (1, 1, 'texto', 'Bom dia, gostaria de agendar uma consulta.', 1, 'entregue'); -- id_mensagem 1
 
-- -----------------------------------------------------------------
-- 7. ARQUIVO_MIDIA (referencia do glossario + saida da traducao)
-- -----------------------------------------------------------------
INSERT INTO ARQUIVO_MIDIA (id_mensagem, tipo_midia, formato_midia, mime_type, uri_armazenamento, criptografado) VALUES
    (NULL, 'video', 'mp4', 'video/mp4', 's3://omni-midia/glossario/bom-dia-ref.mp4',           false), -- id 1
    (NULL, 'video', 'mp4', 'video/mp4', 's3://omni-midia/glossario/consulta-ref.mp4',          false), -- id 2
    (1,    'video', 'mp4', 'video/mp4', 's3://omni-midia/saidas/sessao-0001-video-libras.mp4', true);  -- id 3
 
-- -----------------------------------------------------------------
-- 8. SOLICITACAO_TRADUCAO
-- -----------------------------------------------------------------
INSERT INTO SOLICITACAO_TRADUCAO (id_mensagem, direcao_traducao, id_formato_idioma_origem, id_formato_idioma_destino, tipo_processamento, status, finalizada_em, tempo_processamento_ms) VALUES
    (1, 'texto_para_libras', 1, 2, 'automatico', 'concluida', now(), 1450); -- id_solicitacao_traducao 1
 
-- -----------------------------------------------------------------
-- 9. BIBLIOTECA_VIDEO
-- -----------------------------------------------------------------
INSERT INTO BIBLIOTECA_VIDEO (id_midia, sinal_identificado, qualidade_validada, uso_permitido, status) VALUES
    (1, 'bom dia',  true, true, 'ativo'), -- id 1
    (2, 'consulta', true, true, 'ativo'); -- id 2
 
-- -----------------------------------------------------------------
-- 10. GLOSSARIO_FINAL
-- -----------------------------------------------------------------
INSERT INTO GLOSSARIO_FINAL (id_biblioteca_video, termo_portugues, glosa_libras, descricao_sinal, id_midia_referencia, ativo) VALUES
    (1, 'bom dia',  'BOM-DIA',  'Mão em concha próxima ao rosto, movimento ascendente', 1, true), -- id 1
    (2, 'consulta', 'CONSULTA', 'Sinal de duas mãos em L se aproximando',              2, true); -- id 2
 
-- -----------------------------------------------------------------
-- 11. RESULTADO_TRADUCAO
-- -----------------------------------------------------------------
INSERT INTO RESULTADO_TRADUCAO (id_solicitacao_traducao, id_formato_idioma, id_midia, tipo_saida, ordem_saida, status_revisao) VALUES
    (1, 4, 3, 'video_libras', 1, 'nao_revisado'); -- id_resultado_traducao 1
 
-- -----------------------------------------------------------------
-- 12. ETAPA_TRADUCAO (3 etapas da mesma solicitacao, PK composta
--     por id_solicitacao_traducao + ordem_etapa)
-- -----------------------------------------------------------------
INSERT INTO ETAPA_TRADUCAO (id_solicitacao_traducao, ordem_etapa, id_resultado_traducao, tipo_etapa, status, confianca, duracao_ms_etapa) VALUES
    (1, 1, NULL, 'reconhecimento_texto', 'concluida', 0.9900, 120),
    (1, 2, NULL, 'traducao_linguistica', 'concluida', 0.9600, 380),
    (1, 3, 1,    'geracao_avatar',       'concluida', 0.9400, 950); -- so a ultima etapa ja tem o resultado final gerado
 
-- -----------------------------------------------------------------
-- 13. MOVIMENTO_IA
-- -----------------------------------------------------------------
INSERT INTO MOVIMENTO_IA (id_resultado_traducao, id_biblioteca_video, sequencia_movimento, tipo_movimento, formato_representacao, dados_movimento, inicio_ms, fim_ms, confianca, status) VALUES
    (1, 1, 1, 'sinal', 'gerado', 'esqueleto_3d', 0,    1800, 0.9500, 'processado'),
    (1, 2, 2, 'sinal', 'gerado', 'esqueleto_3d', 1800, 4200, 0.9300, 'processado');