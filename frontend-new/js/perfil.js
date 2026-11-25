/* =========================================================
   Omni IA Support — Perfil do Usuário (Com Trava de Segurança)
   ========================================================= */
   (() => {
    "use strict";

    const CHAVE_USUARIO = "omni:usuario";
    const CHAVE_SESSAO = "omni:sessao";

    // Elementos do Cabeçalho
    const pill = document.getElementById("user-pill");
    const perfilBox = document.getElementById("user-perfil-logado");
    const elNome = document.getElementById("user-nome");
    const elIniciais = document.getElementById("avatar-iniciais");
    const btnSair = document.getElementById("btn-sair");

    // Elementos da Página
    const avatarGrande = document.getElementById("perfil-avatar");
    const nomeDisplay = document.getElementById("perfil-nome-display");
    const emailDisplay = document.getElementById("perfil-email-display");
    const nivelBadge = document.getElementById("perfil-nivel");
    
    const form = document.getElementById("form-perfil");
    const inputNome = document.getElementById("edit-nome");
    const inputEmail = document.getElementById("edit-email");
    const inputTelefone = document.getElementById("edit-telefone");
    const inputNivel = document.getElementById("edit-nivel");
    const msgErro = document.getElementById("erro-perfil");
    const msgSucesso = document.getElementById("sucesso-perfil");
    const btnSalvar = document.getElementById("btn-salvar-perfil");
    const btnEncerrarSessao = document.getElementById("btn-encerrar-sessao");

    // Lê os dados salvos
    function lerSessao() {
        try {
            const raw = localStorage.getItem(CHAVE_USUARIO) || sessionStorage.getItem(CHAVE_SESSAO);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    function obterIniciais(nome) {
        const partes = String(nome || "Usuário").trim().split(/\s+/).filter(Boolean);
        if (partes.length === 0) return "?";
        if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
        return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }

    function traduzirNivel(valor) {
        if (valor === "surdo") return "Surdo";
        if (valor === "ouvinte") return "Ouvinte";
        if (valor === "ambos") return "Ambos";
        return "Não informado";
    }

    // =========================================================
    // TRAVA DE SEGURANÇA: Bloqueia a tela se não estiver logado
    // =========================================================
    function bloquearAcesso() {
        // 1. Esconde o botão de salvar
        if (btnSalvar) btnSalvar.style.display = "none";

        // 2. Desabilita todos os inputs do formulário
        const inputs = form.querySelectorAll("input, select");
        inputs.forEach(input => {
            input.disabled = true;
            input.placeholder = "Faça login para editar";
        });

        // 3. Mostra a mensagem de erro
        msgErro.innerHTML = '<i class="fa-solid fa-lock" style="margin-right: 8px;"></i> Você precisa fazer <strong>Login</strong> ou <strong>Cadastro</strong> para desbloquear esta página e editar seus dados.';
        msgErro.hidden = false;
        
        // 4. Deixa o alerta em destaque
        msgErro.style.backgroundColor = "#fef2f2";
        msgErro.style.border = "1px solid #fecaca";
        msgErro.style.padding = "16px";
        msgErro.style.borderRadius = "8px";
        msgErro.style.fontSize = "1rem";

        // 5. Atualiza o cabeçalho para mostrar "Entrar"
        if (pill) pill.dataset.logado = "false";
        if (perfilBox) perfilBox.hidden = true;
        const btnEntrar = document.getElementById("btn-entrar-header");
        if (btnEntrar) btnEntrar.hidden = false;
    }

    // =========================================================
    // PREENCHER DADOS (Se estiver logado)
    // =========================================================
    function carregarDados() {
        const usuario = lerSessao();

        if (!usuario) {
            bloquearAcesso(); // Chama a trava
            return;
        }

        // --- Preencher Cabeçalho ---
        if (pill) pill.dataset.logado = "true";
        if (perfilBox) perfilBox.hidden = false;
        
        const nome = usuario.nome || usuario.nome_exibicao || "Usuário";
        if (elNome) elNome.textContent = nome;
        if (elIniciais) elIniciais.textContent = obterIniciais(nome);

        // --- Preencher Cartão de Identidade ---
        if (avatarGrande) avatarGrande.textContent = obterIniciais(nome);
        if (nomeDisplay) nomeDisplay.textContent = nome;
        
        const emailSalvo = usuario.email || usuario.email_usuario || "Não informado";
        if (emailDisplay) emailDisplay.textContent = emailSalvo;
        if (nivelBadge) nivelBadge.textContent = `Nível: ${traduzirNivel(usuario.nivel || usuario.tipo_usuario)}`;

        // --- Preencher Formulário ---
        if (inputNome) inputNome.value = nome;
        if (inputEmail) inputEmail.value = emailSalvo === "Não informado" ? "" : emailSalvo;
        if (inputTelefone) inputTelefone.value = usuario.telefone || usuario.telefone_usuario || "";
        if (inputNivel) inputNivel.value = usuario.nivel || usuario.tipo_usuario || "ouvinte";
    }

    // Salvar Alterações
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const usuario = lerSessao();
            if (!usuario) return bloquearAcesso();

            const novoNome = inputNome.value.trim();
            if (!novoNome) {
                msgErro.textContent = "O nome não pode ficar vazio.";
                msgErro.hidden = false;
                return;
            }

            // Atualiza o objeto
            usuario.nome = novoNome;
            usuario.nome_exibicao = novoNome;
            usuario.telefone = inputTelefone.value.trim();
            usuario.telefone_usuario = inputTelefone.value.trim();
            usuario.nivel = inputNivel.value;
            usuario.tipo_usuario = inputNivel.value;
            usuario.iniciais = obterIniciais(novoNome);

            try {
                // Salva de volta
                if (localStorage.getItem(CHAVE_USUARIO)) {
                    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
                } else {
                    sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(usuario));
                }

                // Feedback visual
                msgErro.hidden = true;
                msgSucesso.textContent = "Dados atualizados com sucesso!";
                msgSucesso.hidden = false;

                carregarDados(); // Recarrega os dados na tela
                setTimeout(() => { msgSucesso.hidden = true; }, 3000);

            } catch (err) {
                msgErro.textContent = "Erro ao salvar no navegador.";
                msgErro.hidden = false;
            }
        });
    }

    // Encerrar Sessão (Botão da lateral)
    if (btnEncerrarSessao) {
        btnEncerrarSessao.addEventListener("click", () => {
            localStorage.removeItem(CHAVE_USUARIO);
            sessionStorage.removeItem(CHAVE_SESSAO);
            window.location.href = "../../index.html";
        });
    }

    // Sair pelo Cabeçalho
    btnSair?.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem(CHAVE_USUARIO);
        sessionStorage.removeItem(CHAVE_SESSAO);
        window.location.href = "../../index.html";
    });

    // Inicializa a página
    carregarDados();
})();