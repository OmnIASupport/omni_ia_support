/* =========================================================
   Omni IA Support — Traduzir
   Sessão, entrada de texto, voz e leitura.
   Registra traduções realizadas no banco.
   ========================================================= */


   (() => {
    "use strict";
  
  
    const $ = s => document.querySelector(s);
    const API_REGISTRAR_TRADUCAO =
      "http://127.0.0.1:8000/usuarios/me/registrar-traducao";
    const CHAVE_TOKEN = "omni:token_acesso";
    const KEY_USER = "omni:usuario";
    const KEY_SESSION = "omni:sessao";
  
  
    const pill = $("#user-pill");
    const perfil = $("#user-perfil-logado");
    const entrar = $("#btn-entrar-header");
    const nomeEl = $("#user-nome");
    const papelEl = $("#user-papel");
    const iniciaisEl = $("#avatar-iniciais");
  
  
    const input = $("#texto-entrada");
    const count = $("#contador");
    const result = $("#texto-resultado");
    const status = $("#status-entrada");
    const state = $("#estado-texto");
    const avatarTitle = $("#avatar-titulo");
    const avatarDesc = $("#avatar-descricao");
  
  
    let direction = "pt-libras";
    let recognition = null;
    let listening = false;
  
  
    // --- Sessão e Cabeçalho ---
    function readSession() {
      try {
        const raw = localStorage.getItem(KEY_USER) || sessionStorage.getItem(KEY_SESSION);
        if (!raw) return null;
        const data = JSON.parse(raw);
        return data && data.usuario ? data.usuario : data;
      } catch (_) {
        return null;
      }
    }
  
  
    function initials(name) {
      const p = String(name || "Usuário").trim().split(/\s+/).filter(Boolean);
      return p.length > 1
        ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
        : (p[0] || "?").slice(0, 2).toUpperCase();
    }
  
  
    function updateHeader() {
      if (!pill) return;
      const user = readSession();
      const logged = Boolean(user);
  
  
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
  
  
    $("#btn-sair")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      localStorage.removeItem(KEY_USER);
      sessionStorage.removeItem(KEY_SESSION);
      location.href = "../../index.html"; // Sobe 2 níveis da pasta pages/
    });
  
  
    // --- Contador e Direção ---
    function updateCount() {
      count.textContent = `${input.value.length} / 1000`;
    }
  
  
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
      $("#titulo-entrada").textContent = pt
        ? "Sua mensagem em Português"
        : "Transcrição da mensagem em Libras";
      input.placeholder = pt
        ? "Digite aqui o que deseja comunicar..."
        : "Digite a transcrição em Português da mensagem sinalizada...";
      
      // Mostra o microfone apenas se houver suporte e a direção for PT -> Libras
      const temSuporte = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      $("#btn-microfone").hidden = !pt || !temSuporte;
      
      resetResult();
      status.textContent = pt
        ? "Digite ou dite uma mensagem em Português."
        : "Digite a transcrição em texto da mensagem em Libras.";
    }
  
  
    $("#btn-inverter").addEventListener("click", () => {
      direction = direction === "pt-libras" ? "libras-pt" : "pt-libras";
      updateDirection();
    });
  
  
    // --- Registro de tradução ---
    function registrarTraducao() {
      const token = localStorage.getItem(CHAVE_TOKEN);
  
      if (!token) {
        return;
      }
  
      fetch(API_REGISTRAR_TRADUCAO, {
        method: "POST",
  
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
  
        body: JSON.stringify({}),
      }).catch(() => {
        // A tradução continua mesmo se o registro falhar.
      });
    }
  
  
    // --- Ações de Tradução ---
    $("#btn-traduzir").addEventListener("click", () => {
      const text = input.value.trim();
      if (!text) {
        status.textContent = "Digite uma mensagem antes de continuar.";
        input.focus();
        return;
      }
  
  
      // Registra a tradução no banco antes de preparar o resultado.
      registrarTraducao();
  
  
      result.textContent = text;
      state.textContent = "Texto preparado";
      avatarTitle.textContent = direction === "pt-libras"
        ? "Texto recebido com sucesso"
        : "Transcrição disponível";
      avatarDesc.textContent = direction === "pt-libras"
        ? "O texto está pronto. Para gerar sinais reais em Libras, conecte um serviço de tradução e o avatar."
        : "O texto digitado foi preparado como transcrição. Reconhecer sinais pela câmera exige um modelo específico.";
      
      $("#rotulo-resultado").textContent = direction === "pt-libras"
        ? "Texto original (Português)"
        : "Transcrição informada";
      
      status.textContent = "Texto preparado. A tradução automática real ainda não está conectada.";
    });
  
  
    $("#btn-limpar").addEventListener("click", () => {
      input.value = "";
      updateCount();
      resetResult();
      status.textContent = "Campo limpo.";
      input.focus();
    });
  
  
    input.addEventListener("input", updateCount);
  
  
    // --- Copiar e Ouvir ---
    $("#btn-copiar").addEventListener("click", async () => {
      const text = result.textContent.trim();
      if (!text || text === "Sua mensagem aparecerá aqui.") {
        status.textContent = "Ainda não há texto para copiar.";
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        status.textContent = "Texto copiado.";
      } catch (_) {
        status.textContent = "Não foi possível copiar automaticamente neste navegador.";
      }
    });
  
  
    $("#btn-ouvir").addEventListener("click", () => {
      const text = result.textContent.trim();
      if (!text || text === "Sua mensagem aparecerá aqui.") {
        status.textContent = "Prepare uma mensagem antes de ouvir.";
        return;
      }
      if (!("speechSynthesis" in window)) {
        status.textContent = "Leitura em voz alta não disponível neste navegador.";
        return;
      }
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.onstart = () => status.textContent = "Lendo o texto em voz alta…";
      utterance.onend = () => status.textContent = "Leitura concluída.";
      speechSynthesis.speak(utterance);
    });
  
  
    // --- Microfone (Sensibilidade Aumentada) ---
    function stopListening() {
      listening = false;
      const button = $("#btn-microfone");
      button.innerHTML = '<i class="fa-solid fa-microphone"></i> Falar';
      button.classList.remove("gravando");
    }
  
  
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  
    if (SpeechRecognitionAPI) {
      recognition = new SpeechRecognitionAPI();
      recognition.lang = "pt-BR";
      
      // --- AJUSTES DE SENSIBILIDADE ---
      recognition.continuous = true;       // Continua ouvindo após pausas
      recognition.interimResults = true;   // Mostra resultados parciais enquanto fala
      recognition.maxAlternatives = 1;
  
  
      recognition.onstart = () => {
        listening = true;
        const button = $("#btn-microfone");
        button.innerHTML = '<i class="fa-solid fa-stop"></i> Parar';
        button.classList.add("gravando");
        status.textContent = "Estou ouvindo. Fale agora...";
      };
  
  
      recognition.onresult = (e) => {
        let finalTranscript = "";
        let interimTranscript = "";
  
  
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const transcript = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }
  
  
        // Atualiza o input com o texto final
        if (finalTranscript) {
          input.value = (input.value.trim() ? input.value.trim() + " " : "") + finalTranscript.trim();
          updateCount();
        }
        
        // Mostra o texto provisório no status
        if (interimTranscript) {
          status.textContent = `Ouvindo: "${interimTranscript}"`;
        } else if (finalTranscript) {
          status.textContent = "Fala capturada. Você pode parar ou continuar falando.";
        }
      };
  
  
      recognition.onerror = (e) => {
        if (e.error === "not-allowed") {
          status.textContent = "Permita o acesso ao microfone no navegador.";
        } else if (e.error === "no-speech") {
          status.textContent = "Nenhuma fala detectada. Tente novamente.";
        } else {
          status.textContent = "Erro no microfone: " + e.error;
        }
        stopListening();
      };
  
  
      recognition.onend = () => {
        stopListening();
        if (input.value.trim()) {
          status.textContent = "Gravação finalizada. Revise o texto antes de traduzir.";
        } else {
          status.textContent = "Nenhuma fala foi capturada.";
        }
      };
  
  
      $("#btn-microfone").addEventListener("click", () => {
        if (listening) {
          recognition.stop();
        } else {
          try {
            // Limpa o input anterior se estiver vazio ou se o usuário quiser começar de novo
            // (Pode comentar a linha abaixo se quiser adicionar ao texto existente)
            // input.value = ""; 
            // updateCount();
            
            recognition.start();
          } catch (_) {
            status.textContent = "Aguarde um instante e tente iniciar o microfone novamente.";
          }
        }
      });
    } else {
      $("#btn-microfone").hidden = true;
    }
  
  
    // --- Inicialização ---
    updateHeader();
    updateCount();
    updateDirection();
  })();