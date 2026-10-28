/* Omni IA Support — Traduzir: sessão, entrada de texto, voz e leitura. */
(() => {
  "use strict";
  const $ = s => document.querySelector(s);
  const KEY_USER = "omni:usuario", KEY_SESSION = "omni:sessao";
  const pill = $("#user-pill"), perfil = $("#user-perfil-logado");
  const entrar = $("#btn-entrar-header"), nomeEl = $("#user-nome");
  const papelEl = $("#user-papel"), iniciaisEl = $("#avatar-iniciais");
  const input = $("#texto-entrada"), count = $("#contador");
  const result = $("#texto-resultado"), status = $("#status-entrada");
  const state = $("#estado-texto"), avatarTitle = $("#avatar-titulo");
  const avatarDesc = $("#avatar-descricao");
  let direction = "pt-libras", recognition = null, listening = false;

  function readSession() {
    try {
      const raw = localStorage.getItem(KEY_USER) || sessionStorage.getItem(KEY_SESSION);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data && data.usuario ? data.usuario : data;
    } catch (_) { return null; }
  }
  function initials(name) {
    const p = String(name || "Usuário").trim().split(/\s+/).filter(Boolean);
    return p.length > 1 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : (p[0] || "?").slice(0,2).toUpperCase();
  }
  function updateHeader() {
    if (!pill) return;
    const user = readSession(), logged = Boolean(user);
    pill.dataset.logado = String(logged);
    if (entrar) entrar.hidden = logged;
    if (perfil) perfil.hidden = !logged;
    if (logged) {
      const name = user.nome || user.name || "Usuário";
      if (nomeEl) nomeEl.textContent = name;
      if (papelEl) papelEl.textContent = user.papel || user.tipo || user.role || "Conta ativa";
      if (iniciaisEl) iniciaisEl.textContent = user.iniciais || initials(name);
    }
  }
  $("#btn-sair")?.addEventListener("click", e => {
    e.preventDefault(); e.stopPropagation();
    localStorage.removeItem(KEY_USER); sessionStorage.removeItem(KEY_SESSION);
    location.href = "index.html";
  });
  function updateCount() { count.textContent = `${input.value.length} / 1000`; }
  function resetResult() {
    result.textContent = "Sua mensagem aparecerá aqui.";
    state.textContent = "Aguardando mensagem";
    avatarTitle.textContent = "Sua tradução aparecerá aqui";
    avatarDesc.textContent = direction === "pt-libras"
      ? "A tradução automática e a animação do avatar precisam de uma integração de IA."
      : "A transcrição em Português ficará disponível aqui após preparar o texto.";
  }
  function updateDirection() {
    const pt = direction === "pt-libras";
    $("#idioma-origem").textContent = pt ? "Português" : "Libras";
    $("#idioma-destino").textContent = pt ? "Libras" : "Português";
    $("#titulo-entrada").textContent = pt ? "Sua mensagem em Português" : "Transcrição da mensagem em Libras";
    input.placeholder = pt ? "Digite aqui o que deseja comunicar..." : "Digite a transcrição em Português da mensagem sinalizada...";
    $("#btn-microfone").hidden = !pt || !(window.SpeechRecognition || window.webkitSpeechRecognition);
    resetResult();
    status.textContent = pt ? "Digite ou dite uma mensagem em Português." : "Digite a transcrição em texto da mensagem em Libras.";
  }
  $("#btn-inverter").addEventListener("click", () => {
    direction = direction === "pt-libras" ? "libras-pt" : "pt-libras";
    updateDirection();
  });
  $("#btn-traduzir").addEventListener("click", () => {
    const text = input.value.trim();
    if (!text) { status.textContent = "Digite uma mensagem antes de continuar."; input.focus(); return; }
    result.textContent = text;
    state.textContent = "Texto preparado";
    avatarTitle.textContent = direction === "pt-libras" ? "Texto recebido com sucesso" : "Transcrição disponível";
    avatarDesc.textContent = direction === "pt-libras"
      ? "O texto está pronto. Para gerar sinais reais em Libras, conecte um serviço de tradução e o avatar."
      : "O texto digitado foi preparado como transcrição. Reconhecer sinais pela câmera exige um modelo específico.";
    $("#rotulo-resultado").textContent = direction === "pt-libras" ? "Texto original (Português)" : "Transcrição informada";
    status.textContent = "Texto preparado. A tradução automática real ainda não está conectada.";
  });
  $("#btn-limpar").addEventListener("click", () => {
    input.value = ""; updateCount(); resetResult(); status.textContent = "Campo limpo."; input.focus();
  });
  input.addEventListener("input", updateCount);
  $("#btn-copiar").addEventListener("click", async () => {
    const text = result.textContent.trim();
    if (!text || text === "Sua mensagem aparecerá aqui.") { status.textContent = "Ainda não há texto para copiar."; return; }
    try { await navigator.clipboard.writeText(text); status.textContent = "Texto copiado."; }
    catch (_) { status.textContent = "Não foi possível copiar automaticamente neste navegador."; }
  });
  $("#btn-ouvir").addEventListener("click", () => {
    const text = result.textContent.trim();
    if (!text || text === "Sua mensagem aparecerá aqui.") { status.textContent = "Prepare uma mensagem antes de ouvir."; return; }
    if (!("speechSynthesis" in window)) { status.textContent = "Leitura em voz alta não disponível neste navegador."; return; }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.onstart = () => status.textContent = "Lendo o texto em voz alta…";
    utterance.onend = () => status.textContent = "Leitura concluída.";
    speechSynthesis.speak(utterance);
  });
  function stopListening() {
    listening = false;
    const button = $("#btn-microfone");
    button.innerHTML = '<i class="fa-solid fa-microphone"></i> Falar';
  }
  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognitionAPI) {
    recognition = new SpeechRecognitionAPI();
    recognition.lang = "pt-BR"; recognition.interimResults = false; recognition.continuous = false;
    recognition.onstart = () => { listening = true; $("#btn-microfone").innerHTML = '<i class="fa-solid fa-stop"></i> Parar'; status.textContent = "Estou ouvindo. Fale agora."; };
    recognition.onresult = e => { input.value = (input.value.trim() ? input.value.trim() + " " : "") + e.results[0][0].transcript; updateCount(); status.textContent = "Fala convertida em texto. Revise antes de preparar."; };
    recognition.onerror = e => status.textContent = e.error === "not-allowed" ? "Permita o acesso ao microfone no navegador." : "Não foi possível reconhecer a fala. Tente novamente.";
    recognition.onend = stopListening;
    $("#btn-microfone").addEventListener("click", () => {
      if (listening) recognition.stop();
      else { try { recognition.start(); } catch (_) { status.textContent = "Aguarde e tente iniciar o microfone novamente."; } }
    });
  } else {
    $("#btn-microfone").hidden = true;
  }
  updateHeader(); updateCount(); updateDirection();
})();