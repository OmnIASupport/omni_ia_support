"use strict";

(() => {
  const $ = (id) => document.getElementById(id);
  const { inteiro, percentual } = window.OmniFmt;
  const API = window.OmniAPI;

  const ROTULOS = {
    usa_libras: "Usa Libras",
    tipo_entrada: "Tipo de entrada",
    direcao_traducao: "Direção da tradução",
    tipo_processamento: "Tipo de processamento",
    formato_origem_tipo: "Formato de origem",
    formato_destino_tipo: "Formato de destino",
    status_usuario: "Status do usuário",
    status_sessao_comunicacao: "Status da sessão",
  };

  function mostrarErro(texto) {
    const m = $("mensagem");
    m.textContent = texto;
    m.hidden = false;
  }

  function montarFormulario(info) {
    const box = $("campos");
    box.replaceChildren();
    info.variaveis_entrada.forEach((campo) => {
      const label = document.createElement("label");
      label.className = "form-campo";
      const span = document.createElement("span");
      span.textContent = ROTULOS[campo] || campo;
      const select = document.createElement("select");
      select.name = campo;
      (info.valores_validos[campo] || []).forEach((valor) => {
        const op = document.createElement("option");
        op.value = valor;
        op.textContent = valor;
        select.append(op);
      });
      label.append(span, select);
      box.append(label);
    });
    $("btn-prever").disabled = false;
  }

  function mostrarResultado(r) {
    const box = $("resultado");
    const cores = { concluida: "#20a77a", erro: "#e16b6b", cancelada: "#e6a33b", processando: "#5688e8" };
    box.innerHTML = `<p class="previsao">Status mais provável: <b>${r.previsao}</b></p>` +
      r.probabilidades.map((p) => {
        const pct = p.probabilidade * 100;
        return `<div class="bar-item"><span class="bar-label">${p.status}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max(1, pct)}%;background:${cores[p.status] || "#8794a8"}"></div></div><b class="bar-value">${percentual(pct)}</b></div>`;
      }).join("");
  }

  async function carregar() {
    try {
      const info = await API.consultar("/modelo/info");
      $("mAcuracia").textContent = percentual(info.acuracia_teste_percentual);
      $("mReferencia").textContent = percentual(info.acuracia_referencia_percentual);
      $("mRegistros").textContent = inteiro(info.registros_treino);
      $("lastUpdated").textContent = `Classes: ${info.classes.join(", ")}`;
      montarFormulario(info);
    } catch (e) {
      $("lastUpdated").textContent = "Modelo indisponível";
      mostrarErro(e.message);
    }
  }

  $("form-modelo").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const btn = $("btn-prever");
    btn.disabled = true;
    $("mensagem").hidden = true;
    try {
      const dados = Object.fromEntries(new FormData(ev.target).entries());
      mostrarResultado(await API.enviar("/modelo/prever", dados));
    } catch (e) {
      mostrarErro(e.message);
    } finally {
      btn.disabled = false;
    }
  });

  carregar();
})();
