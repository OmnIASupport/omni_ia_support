INSERT INTO formato_idioma (codigo, nome, tipo, descricao) VALUES
('pt-BR', 'Português brasileiro', 'IDIOMA', 'Português utilizado no Brasil'),
('libras-BR', 'Libras brasileira', 'IDIOMA', 'Língua Brasileira de Sinais'),
('audio-pt-BR', 'Áudio em português brasileiro', 'FORMATO', 'Saída de voz sintetizada'),
('video-libras', 'Vídeo em Libras', 'FORMATO', 'Saída visual em Libras'),
('texto-pt-BR', 'Texto em português brasileiro', 'FORMATO', 'Entrada ou saída textual');

INSERT INTO usuario (nome_exibicao, nome_completo, email, tipo_usuario, status_usuario) VALUES
('Usuário Surdo', 'Usuário Acadêmico Surdo', 'surdo@exemplo.com', 'PESSOA_SURDA', 'ATIVO'),
('Usuário Ouvinte', 'Usuário Acadêmico Ouvinte', 'ouvinte@exemplo.com', 'OUVINTE', 'ATIVO'),
('Intérprete', 'Intérprete Acadêmico', 'interprete@exemplo.com', 'INTERPRETE', 'ATIVO');

INSERT INTO perfil_acessibilidade (id_usuario, idioma_interface, usa_libras, prefere_audio, prefere_texto, prefere_legenda, prefere_video_libras, velocidade_audio, volume_audio, tamanho_fonte, alto_contraste, notificacao_visual, notificacao_vibratoria)
SELECT id_usuario, 'pt-BR', TRUE, FALSE, TRUE, TRUE, TRUE, 1.00, 1.00, 16, FALSE, TRUE, TRUE
FROM usuario WHERE email = 'surdo@exemplo.com';

INSERT INTO perfil_acessibilidade (id_usuario, idioma_interface, usa_libras, prefere_audio, prefere_texto, prefere_legenda, prefere_video_libras, velocidade_audio, volume_audio, tamanho_fonte, alto_contraste, notificacao_visual, notificacao_vibratoria)
SELECT id_usuario, 'pt-BR', FALSE, TRUE, TRUE, TRUE, TRUE, 1.00, 1.00, 16, FALSE, TRUE, FALSE
FROM usuario WHERE email = 'ouvinte@exemplo.com';

INSERT INTO usuario_perfil (id_usuario, nome_perfil)
SELECT id_usuario, tipo_usuario FROM usuario;

INSERT INTO sessao_comunicacao (codigo_sessao, tipo_sessao, iniciada_por_usuario_id, id_idioma_origem, id_idioma_destino, status)
SELECT 'SESSAO-001', 'CONVERSA', u.id_usuario, origem.id_formato_idioma, destino.id_formato_idioma, 'ABERTA'
FROM usuario u, formato_idioma origem, formato_idioma destino
WHERE u.email = 'surdo@exemplo.com' AND origem.codigo = 'libras-BR' AND destino.codigo = 'audio-pt-BR';

INSERT INTO participante_sessao (id_sessao, id_usuario, papel, status)
SELECT s.id_sessao, u.id_usuario, 'SINALIZANTE', 'CONECTADO'
FROM sessao_comunicacao s, usuario u
WHERE s.codigo_sessao = 'SESSAO-001' AND u.email = 'surdo@exemplo.com';

INSERT INTO participante_sessao (id_sessao, id_usuario, papel, status)
SELECT s.id_sessao, u.id_usuario, 'OUVINTE', 'CONECTADO'
FROM sessao_comunicacao s, usuario u
WHERE s.codigo_sessao = 'SESSAO-001' AND u.email = 'ouvinte@exemplo.com';

INSERT INTO mensagem (id_sessao, id_remetente, tipo_entrada, conteudo_textual, sequencia_mensagem, status)
SELECT s.id_sessao, u.id_usuario, 'VIDEO_LIBRAS', NULL, 1, 'RECEBIDA'
FROM sessao_comunicacao s, usuario u
WHERE s.codigo_sessao = 'SESSAO-001' AND u.email = 'surdo@exemplo.com';

INSERT INTO solicitacao_traducao (id_mensagem, direcao_traducao, id_idioma_origem, id_idioma_destino, tipo_processamento, status)
SELECT m.id_mensagem, 'LIBRAS_PARA_PORTUGUES', origem.id_formato_idioma, destino.id_formato_idioma, 'LIBRAS_VIDEO_PARA_PORTUGUES_AUDIO', 'PENDENTE'
FROM mensagem m, formato_idioma origem, formato_idioma destino
WHERE m.sequencia_mensagem = 1 AND origem.codigo = 'libras-BR' AND destino.codigo = 'audio-pt-BR';

INSERT INTO glossario_final (termo_portugues, glosa_libras, descricao_sinal, categoria, regiao)
VALUES ('bom dia', 'BOM DIA', 'Saudação utilizada no início do dia.', 'SAUDACAO', 'BRASIL');
