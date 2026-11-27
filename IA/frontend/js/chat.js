"use strict";

(() => {
  const $ = (sel) => document.querySelector(sel);
  const API = window.OmniAPI;
  const TIMEOUT_CONSULTA_MS = 150000; // o Ollama local pode demorar

  const form = $("#chat-form");
  const campo = $("#chat-pergunta");
  const botao = $("#chat-enviar");
  const statusChat = $("#chat-status");
  const contador = $("#chat-contador");
  const mensagens = $("#chat-mensagens");
  const inicial = mensagens.innerHTML;
  let consultando = false;

  // ---------------------------------------------------------------------------
  // Formatação dos resultados (objeto JSON -> lista e tabelas)
  // ---------------------------------------------------------------------------
  const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 });
  const formatar = (v) => {
    if (v === null || v === undefined || v === "") return "Não informado";
    if (typeof v === "number") return numero.format(v);
    if (typeof v === "boolean") return v ? "Sim" : "Não";
    if (Array.isArray(v)) return v.join(", ");
    return String(v);
  };
  const ROTULOS = {
    direcao_traducao: "Direção", tipo_processamento: "Tipo de processamento", tipo_entrada: "Modalidade",
    tipo_usuario: "Tipo de usuário", status_sessao_comunicacao: "Status da sessão", status_usuario: "Status do usuário",
    registros: "Solicitações", tempo_medio_ms: "Tempo médio (ms)", tempo_mediano_ms: "Tempo mediano (ms)",
    confianca_media: "Confiança média", confianca_media_geral: "Confiança média geral", concluidas: "Concluídas",
    com_erro: "Com erro", percentual_concluidas: "% concluídas", percentual_erro: "% erro",
    maior_valor: "Maior valor", menor_valor: "Menor valor", mais_frequente: "Mais frequente",
    categoria_consultada: "Categoria consultada", codigo_erro: "Código", mensagem_erro: "Mensagem",
    quantidade: "Quantidade", percentual: "Percentual (%)", total_solicitacoes: "Solicitações",
    acuracia_teste_percentual: "Acurácia em teste (%)", acuracia_referencia_percentual: "Acurácia de referência (%)",
    variaveis_entrada: "Variáveis de entrada", usuarios_distintos: "Usuários distintos",
    taxa_conclusao_percentual: "Taxa de conclusão (%)", taxa_erro_percentual: "Taxa de erro (%)",
    distribuicao_por_status: "Distribuição por status", erros_por_tipo: "Erros por tipo",
    solicitacoes_de_quem_usa_libras: "Solicitações de quem usa Libras",
    percentual_das_solicitacoes: "Percentual das solicitações (%)",
    usuarios_distintos_que_usam_libras: "Usuários distintos que usam Libras",
    solicitacoes_envolvendo_libras_por_direcao: "Direções que envolvem Libras",
    total_com_erro: "Total com erro", total_concluidas: "Total concluídas", total_geral: "Total geral",
    tempo_medio_por_tipo_de_processamento: "Tempo médio por tipo de processamento",
    confianca_por_direcao: "Confiança por direção", detalhamento: "Detalhamento", periodo: "Período",
    dias_com_registro: "Dias com registro", dia_com_mais_solicitacoes: "Dia com mais solicitações",
    dia_com_menos_solicitacoes: "Dia com menos solicitações", data: "Data", objetivo: "Objetivo",
    registros_treino: "Registros de treino", classes: "Classes", total_sessoes: "Total de sessões",
    por_status_do_usuario: "Por status do usuário", solicitacoes: "Solicitações",
    total_unidades_de_midia: "Total de unidades de mídia", media_por_solicitacao: "Média por solicitação",
  };
  const nome = (k) => ROTULOS[k] || String(k).replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
  const objetoEmTexto = (o) => Object.entries(o).map(([k, v]) => `${nome(k)}: ${formatar(v)}`).join(" — ");

  function criarTabela(itens) {
    const colunas = [...new Set(itens.flatMap((i) => Object.keys(i)))];
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    const t = document.createElement("table");
    const h = t.createTHead().insertRow();
    colunas.forEach((c) => { const th = document.createElement("th"); th.textContent = nome(c); h.append(th); });
    const b = t.createTBody();
    itens.forEach((item) => {
      const tr = b.insertRow();
      colunas.forEach((c) => {
        const td = tr.insertCell();
        td.textContent = formatar(item[c]);
        if (typeof item[c] === "number") td.className = "numero";
      });
    });
    wrap.append(t);
    return wrap;
  }

  function renderResultado(dados) {
    const box = document.createElement("div");
    box.className = "chat-resultado";
    if (!dados || typeof dados !== "object") {
      box.textContent = formatar(dados);
      return box;
    }
    const lista = document.createElement("ul");
    for (const [chave, valor] of Object.entries(dados)) {
      if (chave === "titulo") continue;
      if (Array.isArray(valor) && valor.length && typeof valor[0] === "object") {
        const titulo = document.createElement("p");
        titulo.className = "chat-subtitulo";
        titulo.textContent = nome(chave);
        box.append(lista.cloneNode(true));
        lista.replaceChildren();
        box.append(titulo, criarTabela(valor));
        continue;
      }
      const li = document.createElement("li");
      const k = document.createElement("strong");
      k.textContent = `${nome(chave)}: `;
      li.append(k, valor && typeof valor === "object" && !Array.isArray(valor) ? objetoEmTexto(valor) : formatar(valor));
      lista.append(li);
    }
    box.append(lista);
    [...box.querySelectorAll("ul")].forEach((ul) => { if (!ul.children.length) ul.remove(); });
    return box;
  }

  // ---------------------------------------------------------------------------
  // Mensagens
  // ---------------------------------------------------------------------------
  function adicionarUsuario(texto) {
    const art = document.createElement("article");
    art.className = "msg msg-usuario";
    const corpo = document.createElement("div");
    corpo.className = "msg-corpo";
    const s = document.createElement("small"); s.textContent = "Você";
    const p = document.createElement("p"); p.textContent = texto;
    corpo.append(s, p);
    const av = document.createElement("span"); av.className = "avatar"; av.innerHTML = '<i class="fa-solid fa-user"></i>';
    art.append(corpo, av);
    mensagens.append(art);
    mensagens.scrollTop = mensagens.scrollHeight;
  }

  function adicionarIA() {
    const art = document.createElement("article");
    art.className = "msg msg-ia";
    art.innerHTML = '<span class="avatar"><img src="../static/logo.png" alt=""></span><div class="msg-corpo"><small>Omni IA</small><p class="digitando">Consultando os dados…</p></div>';
    mensagens.append(art);
    mensagens.scrollTop = mensagens.scrollHeight;
    return art.querySelector(".msg-corpo");
  }

  function preencherIA(corpo, dados) {
    corpo.querySelector(".digitando")?.remove();
    const titulo = document.createElement("h3");
    titulo.textContent = dados.resultado?.titulo || "Resultado da consulta";
    const rotuloPy = document.createElement("p");
    rotuloPy.className = "chat-rotulo";
    rotuloPy.innerHTML = '<i class="fa-brands fa-python"></i> Calculado pelo Python (CSV)';
    const rotuloIA = document.createElement("p");
    rotuloIA.className = "chat-rotulo";
    rotuloIA.innerHTML = '<i class="fa-solid fa-brain"></i> Explicação do Ollama Local';
    const exp = document.createElement("p");
    exp.className = "chat-explicacao";
    exp.textContent = dados.explicacao || "A explicação do Ollama não está disponível.";
    corpo.append(titulo, rotuloPy, renderResultado(dados.resultado), rotuloIA, exp);
    if (dados.aviso) {
      const aviso = document.createElement("p");
      aviso.className = "chat-aviso";
      aviso.textContent = dados.aviso;
      corpo.append(aviso);
    }
    mensagens.scrollTop = mensagens.scrollHeight;
  }

  function erroIA(corpo, mensagem) {
    corpo.querySelector(".digitando")?.remove();
    const p = document.createElement("p");
    p.className = "chat-aviso chat-erro";
    p.textContent = mensagem;
    corpo.append(p);
  }

  // ---------------------------------------------------------------------------
  // Estado e conexão
  // ---------------------------------------------------------------------------
  function atualizar() {
    botao.disabled = consultando || campo.value.trim().length < 3;
    contador.textContent = `${campo.value.length}/500`;
  }

  async function verificar() {
    const dot = $("#chat-dot"), label = $("#chat-status-api"), ollama = $("#chat-ollama");
    try {
      const s = await API.consultar("/chat/status-ollama");
      dot.style.background = "#20a77a";
      label.textContent = "API conectada";
      ollama.textContent = s.conectado
        ? (s.modelo_instalado ? `Ollama online · ${s.modelo_configurado}` : `Ollama online · instale ${s.modelo_configurado}`)
        : "Ollama offline (opcional)";
    } catch {
      dot.style.background = "#df6b6b";
      label.textContent = "API desconectada";
      ollama.textContent = "Inicie o iniciar_linux.sh";
    }
  }

  async function aoEnviar(evento) {
    evento.preventDefault();
    const pergunta = campo.value.trim();
    if (pergunta.length < 3 || consultando) return;

    consultando = true;
    campo.value = "";
    atualizar();
    adicionarUsuario(pergunta);
    const corpo = adicionarIA();
    statusChat.textContent = "Consultando os dados…";

    try {
      const dados = await API.enviar("/chat", { pergunta }, TIMEOUT_CONSULTA_MS);
      preencherIA(corpo, dados);
      statusChat.textContent = "Consulta concluída com os dados do CSV.";
    } catch (err) {
      erroIA(corpo, err.message || "Não foi possível concluir a consulta.");
      statusChat.textContent = "Falha na consulta.";
      console.error("[Omni IA]", err);
    } finally {
      consultando = false;
      atualizar();
      campo.focus();
    }
  }

  // ---------------------------------------------------------------------------
  // Eventos
  // ---------------------------------------------------------------------------
  document.querySelectorAll(".chat-sugestao").forEach((b) => {
    b.addEventListener("click", () => {
      if (consultando) return;
      campo.value = b.textContent.trim();
      atualizar();
      form.requestSubmit();
    });
  });
  campo.addEventListener("input", atualizar);
  campo.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
  });
  form.addEventListener("submit", aoEnviar);
  $("#chat-limpar").addEventListener("click", () => { mensagens.innerHTML = inicial; statusChat.textContent = "Conversa limpa."; });

  atualizar();
  verificar();
})();
