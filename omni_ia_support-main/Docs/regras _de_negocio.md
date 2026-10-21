DADO                  REGRA DE NEGOCIO
USUARIO	id_usuario		Identificador exclusivo gerado automaticamente pelo sistema no cadastro.	
	nome_exibicao		Nome curto/apelido visível para outros usuários nas sessões de chat.	
	nome_completo		Nome de registro do usuário; não pode se repetir na base de dados.	
	email_usuario		Endereço eletrônico para autenticação e comunicações do sistema.	
	telefone_usuario    Número de contato telefônico do usuário para validação ou avisos.	
	tipo_usuario		Define quem é o usuário (ex: Ouvinte/Surdo). 
	status_usuario		Define a situação da conta (ex: Ativo, Inativo, Suspenso).	
	criado_em		   Registra automaticamente o carimbo de data/hora da criação da conta.	
	atualizado_em      Atualiza o carimbo de data/hora a cada modificação no cadastro.

SESSAO_COMUNICACAO	id_usuario		Identificador interno gerado automaticamente para controle da sessão.	
	id_participante_sessao		Código alfanumérico gerado aleatoriamente e usado para convidar novos membros.	
	tipo_sessao		         Tipo de ambiente criado (ex: Sala Privada, Transmissão Pública).	
	codigo_sessao	       Armazena o ID do usuário que abriu e é o proprietário da sessão.	
	idioma_origem		   Idioma principal falado/digitado no início da conversa.	
	idioma_destino		Idioma padrão para o qual as conversas serão convertidas.	
	iniciada_em		Carimbo de data/hora do momento exato de abertura da sessão.	
	encerrada_em		Carimbo de data/hora gravado apenas quando a sessão for finalizada.
	criado_em		Data/hora de registro da linha no banco de dados.	
	atualizado_em		Data/hora da última alteração de estado ou configuração da sessão.	

PARTICIPANTE_SESSAO	id_participante_sessao    Identificador sequencial da entrada do participante na tabela.	
	id_usuario	                      Código da sessão à qual o participante está atrelado.	
	papel_participante		         Código do usuário que ingressou na respectiva sessão.
	entrado_em		                 Carimbo de data/hora que marca o momento de entrada na sala.	
	saido_em		                Carimbo de data/hora preenchido assim que o usuário desconecta ou sai.	
	status_participante	            Situação do usuário na sala (ex: Conectado, Desconectado, Expulso).	
	criado_em	                    Registro de inserção do histórico de participação.

MENSAGEM	id_mensagem		Identificador exclusivo gerado para cada mensagem enviada.	
	id_usuario		Vínculo com a sessão de comunicação onde a mensagem foi postada.	
	tipo_entrada		Identificador do usuário participante que enviou a mensagem.	
	conteudo_textual		Identificador obrigatório para que o sistema reconheça para onde a mensagem deve ser enviada.	
	sequencia_mensagem		Formato original da mensagem enviada (ex: Texto, Áudio de Voz).	
	sequencia_mensagem	Contador sequencial numérico para ordenar o chat cronologicamente sem falhas.	
	enviada_em		Carimbo de data/hora exato do envio pelo cliente.	
	recebida_em		Carimbo de data/hora de quando o servidor processou a entrega.	
	duracao_ms_mensagem		Tempo de duração medido em milissegundos caso a entrada seja em áudio.	
	tamanho_bytes_mensagem		Peso total do arquivo de texto ou payload em bytes.
	integridade_do_hash	 	Código hash de segurança gerado para validar que a mensagem não foi alterada.	
	criado_em		Data/hora da gravação da mensagem no banco.	
	atualizado_em		Data/hora de modificações (ex: quando a mensagem é editada ou deletada).

ARQUIVO_MIDIA	id_arquivo_midia		Identificador único do arquivo binário ou de mídia na plataforma.	
	tipo_midia	         Classificação geral do arquivo (ex: Áudio, Vídeo, Imagem).	
	formato_midia		Tipo de mídia da internet oficial para renderização (ex: audio/mpeg, video/mp4).	
	tipo_mime		Tipo de mídia da internet oficial para renderização (ex: audio/mpeg, video/mp4).	
	uri_armazenamento		Caminho físico ou link direto para o arquivo armazenado na nuvem.	
	tamanho_bytes	Tempo de reprodução da mídia calculado em milissegundos.	
	duracao_ms		Tempo de reprodução da mídia calculado em milissegundos.	
	resolucao	Dimensões de tela de vídeo/imagem expressas em pixels (ex: 1920x1080).	
	criado_em		Data/hora em que o upload do arquivo foi concluído.	

SOLICITACAO_TRADUCAO  id_solicitacao_traducao		Identificador exclusivo do processo de tradução disparado.	
	id_mensagem	Inteiro		                Mensagem de origem que gerou a necessidade da tradução.	
	direcao_traducao		                Sentido do fluxo linguístico (ex: Texto-para-Libras, Audio-para-Texto).	
	idioma_origem_solicitacao	Código do idioma de entrada da mensagem original.	
	idioma_destino_solicitacao		Código do idioma pretendido para o resultado.	
	tipo_processamento		Modo de execução do motor de IA (ex: Tempo Real, Em Lote).	
	solicitado_em		Carimbo de data/hora de quando a requisição entrou na fila da IA.	
	iniciada_em		    Carimbo de data/hora de quando o processamento da IA efetivamente começou.	
	finalizada_em	    Carimbo de data/hora do término da atividade da IA.	
	tempo_processamento_ms		Tempo total gasto na tradução medido em milissegundos.	
	status_solicitacao		Estado do processo (ex: Na Fila, Processando, Concluído, Falhou).	
	código_erro		Código abreviado do erro gerado caso o processo falhe.	
	mensagem_erro		Descrição textual do erro da IA para depuração técnica.	
	criado_em       Registro inicial de criação do log da solicitação.	
	atualizado_em		Última atualização no estado da solicitação.	

ETAPA_TRADUCAO	id_solicitacao_traducao	Identificador individual do subpasso da tradução.	
	id_resultado_traducao		Código da solicitação de tradução mãe à qual este subpasso pertence.	
	tipo_etapa		Nome técnico da ação interna (ex: Tokenização, Sintetização, NLP).	
	ordem_etapa		Número inteiro sequencial que dita a ordem exata das fases.	
	status_etapa		Situação daquela subfase específica (ex: Pendente, Executando, Sucesso, Falha).	
	iniciada_em		Carimbo de data/hora de começo da etapa atual.	
	finalizada_em		Carimbo de data/hora de fim da etapa atual.	
	duracao_ms_etapa	Tempo em milissegundos consumido especificamente nesta subfase.	
	código_erro		Código de falha interno restrito a este subpasso.	
	mensagem_erro		Detalhamento do erro ocorrido na etapa da tradução.	
