"use strict";

(() => {
  const $ = (id) => document.getElementById(id);
  const { inteiro, percentual, fracaoPercentual, dataBR } = window.OmniFmt;
  const API = window.OmniAPI;

  const escapar = (t) => String(t ?? "—").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function setService(id, online, texto) {
    const el = $(id);
    el.textContent = texto || (online ? "Online" : "Offline");
    el.className = "service-state " + (online ? "online" : "offline");
  }

  function renderBars(id, items, labelKey, valueKey) {
    const el = $(id);
    if (!items?.length) { el.innerHTML = '<div class="empty">Sem dados disponíveis.</div>'; return; }
    const max = Math.max(...items.map((x) => Number(x[valueKey]) || 0), 1);
    el.innerHTML = items.map((item) => {
      const v = Number(item[valueKey]) || 0;
      return `<div class="bar-item" title="${escapar(item[labelKey])}: ${inteiro(v)}"><span class="bar-label">${escapar(item[labelKey])}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max(1, (v / max) * 100)}%"></div></div><b class="bar-value">${inteiro(v)}</b></div>`;
    }).join("");
  }

  function renderStatus(items) {
    const el = $("statusChart");
    if (!items?.length) { el.innerHTML = '<div class="empty">Sem dados disponíveis.</div>'; return; }
    const cores = { concluida: "#20a77a", erro: "#e16b6b", cancelada: "#e6a33b", processando: "#5688e8" };
    el.innerHTML = items.map((x) => `<div class="status-item"><span class="status-color" style="background:${cores[String(x.status).toLowerCase()] || "#8794a8"}"></span><span>${escapar(x.status)}</span><b>${inteiro(x.quantidade)} · ${percentual(x.percentual)}</b></div>`).join("");
  }

  function renderTrend(items) {
    const el = $("datasChart");
    if (!items?.length) { el.innerHTML = '<div class="empty">Sem dados disponíveis.</div>'; return; }
    const data = items.slice(-31);
    const vals = data.map((x) => Number(x.total_solicitacoes) || 0);
    const max = Math.max(...vals, 1), min = 0;
    const w = 600, h = 135, p = 12;
    const xy = (v, i) => [p + (i * (w - 2 * p)) / Math.max(vals.length - 1, 1), h - p - ((v - min) / (max - min || 1)) * (h - 2 * p)];
    const pts = vals.map((v, i) => xy(v, i).join(",")).join(" ");
    const area = `${p},${h - p} ${pts} ${w - p},${h - p}`;
    const circulos = vals.map((v, i) => {
      const [x, y] = xy(v, i);
      return `<circle cx="${x}" cy="${y}" r="3" fill="#fff" stroke="#3978ed" stroke-width="2"><title>${dataBR(data[i].data)}: ${inteiro(v)} solicitações</title></circle>`;
    }).join("");
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Solicitações por dia"><defs><linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#3978ed" stop-opacity=".25"/><stop offset="100%" stop-color="#3978ed" stop-opacity="0"/></linearGradient></defs><line x1="${p}" y1="${h - p}" x2="${w - p}" y2="${h - p}" stroke="#e8edf5"/><polygon points="${area}" fill="url(#areaFill)"/><polyline points="${pts}" fill="none" stroke="#3978ed" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${circulos}</svg><div class="trend-labels"><span>${dataBR(data[0].data)}</span><span>${dataBR(data[Math.floor(data.length / 2)].data)}</span><span>${dataBR(data[data.length - 1].data)}</span></div>`;
  }

  async function verificarServicosAuxiliares() {
    $("apiEndereco").textContent = `Análises do CSV — ${API.BASE_URL}`;
    try {
      const m = await API.consultar("/modelo/info");
      setService("mlState", true, "Treinado");
      $("modeloInfo").textContent = `Acurácia em teste: ${percentual(m.acuracia_teste_percentual)} (referência: ${percentual(m.acuracia_referencia_percentual)})`;
    } catch { setService("mlState", false, "Indisponível"); }
    try {
      const o = await API.consultar("/chat/status-ollama");
      if (o.conectado && o.modelo_instalado) setService("iaState", true, "Online");
      else if (o.conectado) setService("iaState", false, "Sem modelo");
      else setService("iaState", false, "Offline");
      $("ollamaInfo").textContent = o.conectado
        ? `Modelo ${o.modelo_configurado}${o.modelo_instalado ? "" : " não instalado (ollama pull " + o.modelo_configurado + ")"}`
        : "Opcional — o chat funciona sem ele, apenas sem explicação";
    } catch { setService("iaState", false); }
  }

  async function carregarDashboard() {
    const btn = $("refreshBtn");
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Atualizando</span>';
    $("dataState").textContent = "Atualizando...";
    $("dataDot").style.background = "#f0ae3e";
    try {
      const [resumo, usuarios, status, modalidades, datas] = await Promise.all([
        API.consultar("/analise/resumo"),
        API.consultar("/analise/usuarios"),
        API.consultar("/dashboard/status"),
        API.consultar("/analise/modalidades"),
        API.consultar("/dashboard/solicitacoes-por-dia"),
      ]);
      $("totalRegistros").textContent = inteiro(resumo.total_registros);
      $("taxaConclusao").textContent = percentual(resumo.taxa_conclusao_percentual);
      $("totalUsuarios").textContent = inteiro(resumo.total_usuarios_identificados);
      $("tempoMedio").textContent = resumo.tempo_medio_processamento_ms == null ? "—" : `${inteiro(Math.round(resumo.tempo_medio_processamento_ms))} ms`;
      $("confiancaMedia").textContent = fracaoPercentual(resumo.confianca_media_etapas);
      $("totalMidias").textContent = inteiro(resumo.total_unidades_de_midia);
      $("camposEssenciais").textContent = inteiro(resumo.registros_com_campos_essenciais_vazios);
      $("valoresVazios").textContent = inteiro(resumo.total_valores_vazios);
      $("duplicados").textContent = inteiro(resumo.linhas_duplicadas);
      $("totalColunas").textContent = inteiro(resumo.total_colunas);
      $("periodo").textContent = `Período: ${dataBR(resumo.data_inicial)} a ${dataBR(resumo.data_final)}`;

      renderBars("modalidadesChart", modalidades, "tipo_entrada", "registros");
      renderStatus(status);
      renderBars("usuariosChart", usuarios, "tipo_usuario", "registros");
      renderTrend(datas);

      $("dataState").textContent = "Dados atualizados";
      $("dataDot").style.background = "#20a77a";
      $("sideDot").style.background = "#20a77a";
      $("sideState").textContent = "API conectada";
      setService("dsState", true);
      $("lastUpdated").textContent = "Atualizado às " + new Date().toLocaleTimeString("pt-BR");
    } catch (error) {
      $("dataState").textContent = "API indisponível";
      $("dataDot").style.background = "#df6b6b";
      $("sideDot").style.background = "#df6b6b";
      $("sideState").textContent = "API desconectada";
      setService("dsState", false);
      for (const id of ["modalidadesChart", "statusChart", "usuariosChart", "datasChart"]) {
        $(id).innerHTML = `<div class="error-note">${escapar(error.message)}</div>`;
      }
      $("lastUpdated").textContent = "Falha na conexão";
      console.error("[Omni IA] Erro ao carregar dashboard:", error);
    } finally {
      await verificarServicosAuxiliares();
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-rotate"></i><span>Atualizar</span>';
    }
  }

  $("refreshBtn").addEventListener("click", carregarDashboard);
  carregarDashboard();
})();
