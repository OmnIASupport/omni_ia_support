/* =========================================================
   Omni IA Support — Chat
   Interface demonstrativa; não envia mensagens para um servidor.
   ========================================================= */
(() => {
    "use strict";

    const CHAVE_USUARIO = "omni:usuario";
    const CHAVE_SESSAO = "omni:sessao";

    const pill = document.getElementById("user-pill");
    const perfilBox = document.getElementById("user-perfil-logado");
    const elNome = document.getElementById("user-nome");
    const elPapel = document.getElementById("user-papel");
    const elIniciais = document.getElementById("avatar-iniciais");
    const btnSair = document.getElementById("btn-sair");

    // Cabeçalho dinâmico compatível com a sessão usada na página inicial.
    const lerSessao = () => {
        try {
            const raw = localStorage.getItem(CHAVE_USUARIO) ||
                        sessionStorage.getItem(CHAVE_SESSAO);
            if (!raw) return null;
            const dado = JSON.parse(raw);
            return dado.usuario || dado;
        } catch (_) {
            return null;
        }
    };

    if (pill) {
        const usuario = lerSessao();
        if (usuario) {
            pill.dataset.logado = "true";
            if (perfilBox) perfilBox.hidden = false;
            if (elNome) elNome.textContent = usuario.nome || "Usuário";
            if (elPapel) elPapel.textContent = usuario.papel || "Conta ativa";
            if (elIniciais) elIniciais.textContent = usuario.iniciais || iniciaisDe(usuario.nome);
        } else {
            pill.dataset.logado = "false";
            if (perfilBox) perfilBox.hidden = true;
        }
    }

    function iniciaisDe(nome = "") {
        return nome.trim().split(/\s+/).filter(Boolean).slice(0, 2)
            .map(parte => parte[0].toLocaleUpperCase("pt-BR")).join("") || "?";
    }

    btnSair?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        localStorage.removeItem(CHAVE_USUARIO);
        sessionStorage.removeItem(CHAVE_SESSAO);
        window.location.href = "index.html";
    });

    const form = document.getElementById("chat-form");
    const campo = document.getElementById("mensagem");
    const mensagens = document.getElementById("chat-messages");
    const contador = document.getElementById("contador");
    const status = document.getElementById("status-chat");
    const btnLimpar = document.getElementById("btn-limpar");
    const btnVoz = document.getElementById("btn-voz");
    let ultimaResposta = "Olá! Seja bem-vindo ao Omni IA Support. Como posso ajudar?";

    const horaAtual = () => new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit", minute: "2-digit"
    }).format(new Date());

    function adicionarMensagem(texto, tipo, remetente) {
        const article = document.createElement("article");
        article.className = `message ${tipo}`;

        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        avatar.setAttribute("aria-hidden", "true");
        const icone = document.createElement("i");
        icone.className = tipo === "sent" ? "fa-solid fa-user" : "fa-solid fa-hands-asl-interpreting";
        avatar.appendChild(icone);

        const body = document.createElement("div");
        body.className = "message-body";

        const sender = document.createElement("p");
        sender.className = "message-sender";
        sender.textContent = remetente;

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";
        bubble.textContent = texto;

        const time = document.createElement("time");
        time.dateTime = new Date().toISOString();
        time.textContent = horaAtual();

        body.append(sender, bubble, time);
        article.append(avatar, body);
        mensagens.appendChild(article);
        mensagens.scrollTop = mensagens.scrollHeight;
        return article;
    }

    function respostaDemonstrativa(texto) {
        const t = texto.toLocaleLowerCase("pt-BR");
        if (t.includes("libras") || t.includes("tradu")) {
            return "Para experimentar a área de tradução, acesse “Traduzir” no menu. A página atual é uma demonstração de chat e ainda não está conectada a um serviço de tradução automática para Libras.";
        }
        if (t.includes("ajuda") || t.includes("suporte")) {
            return "Posso mostrar os caminhos da plataforma nesta demonstração. Use o menu “Ajuda” para consultar orientações ou “Traduzir” para abrir a ferramenta de Português e Libras.";
        }
        if (t.includes("sugest")) {
            return "Obrigado pela sugestão! Nesta versão demonstrativa, a mensagem não é enviada nem salva. Para receber sugestões de verdade, será necessário conectar o chat a um sistema de atendimento.";
        }
        return "Recebi sua mensagem nesta demonstração. Para transformar este chat em um atendimento real, será necessário conectar a interface a um servidor ou serviço de mensagens.";
    }

    function enviar(texto) {
        const mensagem = texto.trim();
        if (!mensagem) return;
        adicionarMensagem(mensagem, "sent", "Você");
        campo.value = "";
        atualizarContador();
        status.textContent = "Mensagem adicionada à demonstração.";
        const resposta = respostaDemonstrativa(mensagem);
        ultimaResposta = resposta;
        adicionarMensagem(resposta, "received", "Assistente Omni");
    }

    function atualizarContador() {
        contador.textContent = `${campo.value.length}/1000 · Seja respeitoso e claro`;
    }

    form?.addEventListener("submit", (event) => {
        event.preventDefault();
        enviar(campo.value);
    });

    campo?.addEventListener("input", atualizarContador);
    campo?.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            form.requestSubmit();
        }
    });

    document.querySelectorAll(".quick-reply").forEach((botao) => {
        botao.addEventListener("click", () => enviar(botao.dataset.message || botao.textContent));
    });

    btnLimpar?.addEventListener("click", () => {
        mensagens.replaceChildren();
        const divider = document.createElement("div");
        divider.className = "date-divider";
        const label = document.createElement("span");
        label.textContent = "Conversa limpa";
        divider.appendChild(label);
        mensagens.appendChild(divider);
        ultimaResposta = "Conversa limpa. Como posso ajudar?";
        adicionarMensagem("Conversa limpa! Pode escrever uma nova mensagem ou escolher uma sugestão abaixo.", "received", "Assistente Omni");
        status.textContent = "A conversa demonstrativa foi limpa.";
    });

    btnVoz?.addEventListener("click", () => {
        if (!("speechSynthesis" in window)) {
            status.textContent = "A leitura em voz alta não é compatível com este navegador.";
            return;
        }
        window.speechSynthesis.cancel();
        const fala = new SpeechSynthesisUtterance(ultimaResposta);
        fala.lang = "pt-BR";
        window.speechSynthesis.speak(fala);
        status.textContent = "Lendo a última resposta em voz alta.";
    });
})();
