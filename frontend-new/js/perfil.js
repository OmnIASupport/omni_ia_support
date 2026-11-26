/* =========================================================
   Omni IA Support — Perfil do Usuário
   ========================================================= */
   (() => {
    "use strict";

    const API_URL = "http://127.0.0.1:8000";
    const CHAVE_TOKEN = "omni:token_acesso";
    const CHAVE_PERFIL = "omni:perfil-interface";
    const EVENTO_PERFIL = "omni:perfil-atualizado";

    const $ = (id) => document.getElementById(id);

    // Elementos da Tela Principal
    const avatarGrande = $("perfil-avatar");
    const nomeDisplay = $("perfil-nome-display");
    const emailDisplay = $("perfil-email-display");
    const nivelBadge = $("perfil-nivel");

    const form = $("form-perfil");
    const inputNome = $("edit-nome");
    const inputEmail = $("edit-email");
    const inputTelefone = $("edit-telefone");
    const inputNivel = $("edit-nivel"); // Agora é um input readonly
    const msgErro = $("erro-perfil");
    const msgSucesso = $("sucesso-perfil");
    const btnSalvar = $("btn-salvar-perfil");
    const btnEncerrarSessao = $("btn-encerrar-sessao");

    // Elementos do Modal de Senha
    const btnAbrirModalSenha = $("btn-abrir-modal-senha");
    const modalSenha = $("modal-senha");
    const btnFecharModal = $("btn-fechar-modal");
    const formSenha = $("form-senha");
    const senhaAtual = $("senha-atual");
    const senhaNova = $("senha-nova");
    const senhaConfirmar = $("senha-confirmar");
    const msgErroSenha = $("erro-senha");
    const msgSucessoSenha = $("sucesso-senha");
    const btnSalvarSenha = $("btn-salvar-senha");

    let tokenDaSessao = null;
    let usuarioAtual = null;
    let salvando = false;
    let temporizadorSucesso = null;

    // Utilitários
    const obterToken = () => {
        try { return localStorage.getItem(CHAVE_TOKEN); } catch { return null; }
    };

    const inicial = (nome) =>
        Array.from(String(nome || "").trim())[0]?.toLocaleUpperCase("pt-BR") || "?";

    const traduzirNivel = (valor) => {
        if (valor === "surdo") return "Surdo (Uso Libras como primeira língua)";
        if (valor === "ouvinte") return "Ouvinte (Quero me comunicar com surdos)";
        if (valor === "ambos") return "Ambos (Uso as duas formas)";
        return "Não informado";
    };

    const soDigitos = (valor) => String(valor || "").replace(/\D/g, "");

    function formatarTelefone(valor) {
        const d = soDigitos(valor).slice(0, 11);
        if (d.length <= 2) return d ? `(${d}` : "";
        if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
        if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
        return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    }

    // Validações
    function validarNome(nome) {
        if (!nome) return "O nome não pode ficar vazio.";
        if (nome.length < 2) return "O nome deve ter pelo menos 2 caracteres.";
        if (nome.length > 150) return "O nome deve ter até 150 caracteres.";
        return null;
    }

    // Mensagens (Tela Principal)
    function limparMensagens() {
        clearTimeout(temporizadorSucesso);
        if (msgErro) { msgErro.replaceChildren(); msgErro.hidden = true; }
        if (msgSucesso) { msgSucesso.textContent = ""; msgSucesso.hidden = true; }
    }

    function mostrarErro(texto) {
        clearTimeout(temporizadorSucesso);
        if (msgSucesso) msgSucesso.hidden = true;
        if (msgErro) {
            msgErro.replaceChildren(); 
            msgErro.textContent = texto; 
            msgErro.hidden = false;
        }
    }

    function mostrarSucesso(texto) {
        clearTimeout(temporizadorSucesso);
        if (msgErro) { msgErro.replaceChildren(); msgErro.hidden = true; }
        if (msgSucesso) {
            msgSucesso.textContent = texto; 
            msgSucesso.hidden = false;
            temporizadorSucesso = setTimeout(() => { msgSucesso.hidden = true; }, 4000);
        }
    }

    // Cabeçalho e Sessão
    function notificarCabecalho() { window.dispatchEvent(new CustomEvent(EVENTO_PERFIL)); }

    function limparSessaoLocal() {
        try { localStorage.removeItem(CHAVE_TOKEN); } catch {}
        try { sessionStorage.removeItem(CHAVE_PERFIL); } catch {}
        tokenDaSessao = null;
        notificarCabecalho();
    }

    // Estado da Tela
    function definirEdicao(habilitada) {
        if (inputNome) inputNome.disabled = !habilitada;
        if (inputTelefone) inputTelefone.disabled = !habilitada;
        if (btnSalvar) btnSalvar.style.display = habilitada ? "" : "none";
        if (btnAbrirModalSenha) btnAbrirModalSenha.disabled = !habilitada;
    }

    function bloquearAcesso() {
        usuarioAtual = null;
        definirEdicao(false);
        
        if (inputNome) { inputNome.value = ""; inputNome.placeholder = "Faça login para editar"; }
        if (inputEmail) inputEmail.value = "";
        if (inputTelefone) { inputTelefone.value = ""; inputTelefone.placeholder = "Faça login para editar"; }
        if (inputNivel) inputNivel.value = "";
        
        if (avatarGrande) avatarGrande.textContent = "?";
        if (nomeDisplay) nomeDisplay.textContent = "Visitante";
        if (emailDisplay) emailDisplay.textContent = "—";
        if (nivelBadge) nivelBadge.textContent = "Nível: —";
        
        if (msgErro) {
            msgErro.innerHTML = `<i class="fa-solid fa-lock" style="margin-right: 8px;"></i> Você precisa fazer <a href="login.html?redirect=perfil.html" style="color: inherit; font-weight: 800; text-decoration: underline;">Login</a> ou <a href="cadastro.html" style="color: inherit; font-weight: 800; text-decoration: underline;">Cadastro</a> para desbloquear esta página e editar seus dados.`;
            msgErro.hidden = false;
        }
    }

    function preencherTela(usuario) {
        const nome = usuario.nome_exibicao;
        usuarioAtual = { ...usuario };

        if (avatarGrande) avatarGrande.textContent = inicial(nome);
        if (nomeDisplay) nomeDisplay.textContent = nome;
        if (emailDisplay) emailDisplay.textContent = usuario.email_usuario || "Não informado";
        if (nivelBadge) nivelBadge.textContent = `Nível: ${traduzirNivel(usuario.tipo_usuario)}`;

        if (inputNome) inputNome.value = nome;
        if (inputEmail) inputEmail.value = usuario.email_usuario || "";
        if (inputTelefone) inputTelefone.value = formatarTelefone(usuario.telefone_usuario);
        
        // O nível agora é visual (readonly)
        if (inputNivel) inputNivel.value = traduzirNivel(usuario.tipo_usuario);

        definirEdicao(true);
    }

    // Requisição Base
    async function requisicao(caminho, opcoes = {}) {
        const token = tokenDaSessao;
        if (!token) throw new Error("Sessão inválida.");

        let resposta;
        try {
            resposta = await fetch(API_URL + caminho, {
                ...opcoes,
                headers: {
                    Accept: "application/json",
                    ...(opcoes.body ? { "Content-Type": "application/json" } : {}),
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            });
        } catch {
            throw new Error("Não foi possível comunicar com o servidor.");
        }

        const dados = await resposta.json().catch(() => null);
        if (!resposta.ok) {
            const erro = new Error(dados?.detail || `Erro HTTP ${resposta.status}`);
            erro.status = resposta.status;
            throw erro;
        }
        return dados;
    }

    // Carregamento Inicial
    async function carregarDados() {
        tokenDaSessao = obterToken();
        if (!tokenDaSessao) {
            limparSessaoLocal();
            bloquearAcesso();
            return;
        }

        definirEdicao(false);
        try {
            const usuario = await requisicao("/usuarios/me");
            preencherTela(usuario);
        } catch (erro) {
            if (erro.status === 401) {
                limparSessaoLocal();
                bloquearAcesso();
            } else {
                definirEdicao(false);
                mostrarErro(`${erro.message} Recarregue a página.`);
            }
        }
    }

    // Salvar Dados Pessoais
    if (form) {
        form.addEventListener("submit", async (evento) => {
            evento.preventDefault();
            if (salvando) return;

            if (!usuarioAtual || !tokenDaSessao) {
                bloquearAcesso();
                return;
            }

            limparMensagens();

            const nome = inputNome.value.trim();
            const telefone = soDigitos(inputTelefone.value);

            const erroNome = validarNome(nome);
            if (erroNome) {
                mostrarErro(erroNome);
                inputNome.focus();
                return;
            }

            const alteracoes = {};
            if (nome !== usuarioAtual.nome_exibicao) {
                alteracoes.nome_exibicao = nome;
            }

            const telefoneAtual = soDigitos(usuarioAtual.telefone_usuario) || null;
            if ((telefone || null) !== telefoneAtual) {
                alteracoes.telefone_usuario = telefone || null;
            }

            if (!Object.keys(alteracoes).length) {
                mostrarSucesso("Nenhuma alteração para salvar.");
                return;
            }

            salvando = true;
            btnSalvar.disabled = true;

            try {
                const atualizado = await requisicao("/usuarios/me", {
                    method: "PATCH",
                    body: JSON.stringify(alteracoes),
                });

                preencherTela(atualizado);
                mostrarSucesso("Dados atualizados com sucesso!");
            } catch (erro) {
                if (erro.status === 401) {
                    limparSessaoLocal();
                    bloquearAcesso();
                    return;
                }
                mostrarErro(`${erro.message} Suas alterações não foram confirmadas.`);
            } finally {
                salvando = false;
                btnSalvar.disabled = false;
            }
        });
    }

    // Evento ao digitar telefone
    if (inputTelefone) {
        inputTelefone.addEventListener("input", () => {
            inputTelefone.value = formatarTelefone(inputTelefone.value);
        });
    }

    // Encerrar Sessão
    if (btnEncerrarSessao) {
        btnEncerrarSessao.addEventListener("click", () => {
            limparSessaoLocal();
            window.location.href = "../../index.html";
        });
    }

    // =========================================================
    // LÓGICA DO MODAL DE TROCA DE SENHA
    // =========================================================
    
    // Abrir Modal
    if (btnAbrirModalSenha && modalSenha) {
        btnAbrirModalSenha.addEventListener("click", () => {
            modalSenha.classList.add("aberto");
            modalSenha.setAttribute("aria-hidden", "false");
            if (senhaAtual) senhaAtual.focus();
        });
    }

    // Fechar Modal (Botão X)
    if (btnFecharModal && modalSenha) {
        btnFecharModal.addEventListener("click", () => {
            modalSenha.classList.remove("aberto");
            modalSenha.setAttribute("aria-hidden", "true");
            if (formSenha) formSenha.reset();
            if (msgErroSenha) msgErroSenha.hidden = true;
            if (msgSucessoSenha) msgSucessoSenha.hidden = true;
        });
    }

    // Fechar Modal ao clicar fora
    if (modalSenha) {
        modalSenha.addEventListener("click", (e) => {
            if (e.target === modalSenha) {
                btnFecharModal.click();
            }
        });
    }

    // Enviar Nova Senha
    if (formSenha) {
        formSenha.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            if (msgErroSenha) msgErroSenha.hidden = true;
            if (msgSucessoSenha) msgSucessoSenha.hidden = true;
            btnSalvarSenha.disabled = true;
            btnSalvarSenha.textContent = "Salvando...";

            const atual = senhaAtual.value;
            const nova = senhaNova.value;
            const confirmar = senhaConfirmar.value;

            // Validação Front-end
            if (nova.length < 6) {
                msgErroSenha.textContent = "A nova senha deve ter pelo menos 6 caracteres.";
                msgErroSenha.hidden = false;
                btnSalvarSenha.disabled = false;
                btnSalvarSenha.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Atualizar Senha';
                return;
            }

            if (nova !== confirmar) {
                msgErroSenha.textContent = "As senhas novas não coincidem.";
                msgErroSenha.hidden = false;
                btnSalvarSenha.disabled = false;
                btnSalvarSenha.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Atualizar Senha';
                return;
            }

            try {
                // IMPORTANTE: Aqui chamamos a rota de troca de senha.
                // O backend (Python) precisa ter essa rota implementada.
                await requisicao("/usuarios/trocar-senha", {
                    method: "POST",
                    body: JSON.stringify({
                        senha_atual: atual,
                        senha_nova: nova
                    }),
                });

                msgSucessoSenha.textContent = "Senha atualizada com sucesso!";
                msgSucessoSenha.hidden = false;
                formSenha.reset();

                setTimeout(() => {
                    btnFecharModal.click();
                }, 2000);

            } catch (erro) {
                // Se o backend retornar erro (ex: senha atual errada), mostramos aqui
                msgErroSenha.textContent = erro.message || "Erro ao atualizar a senha.";
                msgErroSenha.hidden = false;
            } finally {
                btnSalvarSenha.disabled = false;
                btnSalvarSenha.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Atualizar Senha';
            }
        });
    }

    // Inicializa a página
    carregarDados();
})();