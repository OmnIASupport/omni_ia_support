"use strict";

(() => {
  const $ = (id) => document.getElementById(id);
  const { inteiro, percentual, fracaoPercentual, dataBR } = window.OmniFmt;
  const API = window.OmniAPI;

  const COLUNAS_PADRAO = (chave, titulo) => [
    { chave, titulo },
    { chave: "registros", titulo: "Solicitações", num: true, fmt: inteiro, soma: true },
    { chave: "tempo_medio_ms", titulo: "Tempo médio (ms)", num: true, fmt: (v) => inteiro(Math.round(v)) },
    { chave: "confianca_media", titulo: "Confiança", num: true, fmt: fracaoPercentual },
    { chave: "percentual_concluidas", titulo: "% concluídas", num: true, fmt: percentual },
    { chave: "percentual_erro", titulo: "% erro", num: true, fmt: percentual },
  ];

  function tabela(id, dados, colunas) {
    const box = $(id);
    box.replaceChildren();
    if (!Array.isArray(dados) || !dados.length) {
      box.innerHTML = '<div class="empty">Nenhum registro encontrado.</div>';
      return;
    }
    const t = document.createElement("table");
    const thead = t.createTHead().insertRow();
    colunas.forEach((c) => {
      const th = document.createElement("th");
      th.textContent = c.titulo;
      if (c.num) th.className = "numero";
      thead.append(th);
    });
    const tbody = t.createTBody();
    dados.forEach((item) => {
      const tr = tbody.insertRow();
      colunas.forEach((c) => {
        const td = tr.insertCell();
        td.textContent = c.fmt ? c.fmt(item[c.chave]) : (item[c.chave] ?? "—");
        if (c.num) td.className = "numero";
      });
    });
    if (colunas.some((c) => c.soma)) {
      const tr = t.createTFoot().insertRow();
      colunas.forEach((c, i) => {
        const td = tr.insertCell();
        if (i === 0) td.textContent = "Total";
        else if (c.soma) { td.textContent = inteiro(dados.reduce((s, x) => s + Number(x[c.chave] || 0), 0)); td.className = "numero"; }
      });
    }
    box.append(t);
  }

  async function carregar() {
    const btn = $("refreshBtn"), msg = $("mensagem");
    btn.disabled = true;
    msg.hidden = true;
    $("lastUpdated").textContent = "Consultando a API...";
    try {
      const [r, direcoes, tipos, modalidades, usuarios, sessoes, erros] = await Promise.all([
        API.consultar("/analise/resumo"),
        API.consultar("/analise/direcoes"),
        API.consultar("/analise/tipos"),
        API.consultar("/analise/modalidades"),
        API.consultar("/analise/usuarios"),
        API.consultar("/analise/sessoes"),
        API.consultar("/analise/erros"),
      ]);
      $("rSolicitacoes").textContent = inteiro(r.total_solicitacoes);
      $("rErro").textContent = percentual(r.taxa_erro_percentual);
      $("rMediana").textContent = `${inteiro(Math.round(r.tempo_mediano_processamento_ms))} ms`;
      $("rSessoes").textContent = inteiro(r.total_sessoes);
      $("periodo").textContent = `Período dos registros: ${dataBR(r.data_inicial)} a ${dataBR(r.data_final)}`;

      tabela("tDirecoes", direcoes, COLUNAS_PADRAO("direcao_traducao", "Direção"));
      tabela("tTipos", tipos, COLUNAS_PADRAO("tipo_processamento", "Tipo"));
      tabela("tModalidades", modalidades, COLUNAS_PADRAO("tipo_entrada", "Modalidade"));
      tabela("tUsuarios", usuarios, COLUNAS_PADRAO("tipo_usuario", "Tipo de usuário"));
      tabela("tSessoes", sessoes, COLUNAS_PADRAO("status_sessao_comunicacao", "Status da sessão"));
      tabela("tErros", erros, [
        { chave: "codigo_erro", titulo: "Código" },
        { chave: "mensagem_erro", titulo: "Mensagem" },
        { chave: "quantidade", titulo: "Ocorrências", num: true, fmt: inteiro, soma: true },
      ]);
      $("lastUpdated").textContent = `Última consulta: ${new Date().toLocaleString("pt-BR")}`;
    } catch (e) {
      $("lastUpdated").textContent = "Não foi possível atualizar os dados.";
      msg.textContent = e.message || "Erro inesperado.";
      msg.hidden = false;
    } finally {
      btn.disabled = false;
    }
  }

  $("refreshBtn").addEventListener("click", carregar);
  carregar();
})();
