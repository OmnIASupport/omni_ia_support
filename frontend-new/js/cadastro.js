/* =========================================================
   Omni IA Support — Cadastro de perfil
   Frontend → FastAPI → Supabase
   ========================================================= */

   (() => {
    "use strict";

    // Não coloque a chave secreta do Supabase no frontend.
    const API_URL = "http://127.0.0.1:8000/usuarios/";

    const $ = (seletor) => document.querySelector(seletor);

    // ---------- Elementos ----------
    const form = $("#form-cadastro");

    if (!form) return;

    const nomeExib = $("#nome-exibicao");
    const nomeCompleto = $("#nome-completo");
    const email = $("#email");
    const telefone = $("#telefone");
    const senha = $("#senha");
    const termos = $("#termos");
    const toggleSenha = $("#toggle-senha");
    const btnCadastrar = $("#btn-cadastrar");
    const erroGeral = $("#erro-geral");
    const erroAcessibilidade = $("#erro-acessibilidade");
    const erroTermos = $("#erro-termos");

    const opcoesAcessibilidade = form.querySelectorAll(
        'input[name="acessibilidade"]'
    );

    const elementosObrigatorios = [
        nomeExib,
        nomeCompleto,
        email,
        telefone,
        termos,
        btnCadastrar,
        erroGeral,
        erroAcessibilidade,
        erroTermos,
    ];

    if (elementosObrigatorios.some((elemento) => !elemento)) {
        console.error(
            "Cadastro: existem elementos ausentes no HTML. Confira os IDs."
        );
        return;
    }

    const textoBtn = btnCadastrar.querySelector(".btn-texto");

    if (!textoBtn) {
        console.error(
            "Cadastro: o botão precisa conter um elemento .btn-texto."
        );
        return;
    }

    let enviando = false;

    // ---------- Aviso sobre autenticação ----------
    // O backend atual cadastra o perfil, mas não recebe senha.
    // Oculta e desativa o campo para não solicitar uma senha sem usá-la.
    if (senha) {
        senha.required = false;
        senha.disabled = true;
        senha.value = "";

        const blocoSenha = senha.closest(".campo");

        if (blocoSenha) {
            blocoSenha.hidden = true;
        }
    }

    if (toggleSenha) {
        toggleSenha.disabled = true;
    }

    const avisoPerfil = document.createElement("p");
    avisoPerfil.className = "ajuda-acessibilidade";
    avisoPerfil.textContent =
        "Nesta etapa, será cadastrado apenas seu perfil. " +
        "Senha e login ainda não estão disponíveis.";

    form.prepend(avisoPerfil);

    textoBtn.textContent = "Cadastrar perfil";

    // ---------- Utilidades de erro ----------
    const mostrarErro = (campo, mensagem) => {
        const wrapper =
            campo.closest(".campo-input") || campo.parentElement;

        const erro = document.getElementById(`erro-${campo.id}`);

        if (wrapper) {
            wrapper.classList.add("invalido");
        }

        if (erro) {
            erro.textContent = mensagem;
            erro.hidden = false;
        }

        campo.setAttribute("aria-invalid", "true");
    };

    const limparErro = (campo) => {
        const wrapper =
            campo.closest(".campo-input") || campo.parentElement;

        const erro = document.getElementById(`erro-${campo.id}`);

        if (wrapper) {
            wrapper.classList.remove("invalido");
        }

        if (erro) {
            erro.textContent = "";
            erro.hidden = true;
        }

        campo.removeAttribute("aria-invalid");
    };

    const mostrarErroGeral = (mensagem) => {
        erroGeral.textContent = mensagem;
        erroGeral.hidden = false;
    };

    const limparErroGeral = () => {
        erroGeral.textContent = "";
        erroGeral.hidden = true;
    };

    // ---------- Mensagem de sucesso ----------
    const mensagemSucesso = document.createElement("p");
    mensagemSucesso.id = "sucesso-cadastro";
    mensagemSucesso.setAttribute("role", "status");
    mensagemSucesso.setAttribute("aria-live", "polite");
    mensagemSucesso.hidden = true;

    erroGeral.insertAdjacentElement("afterend", mensagemSucesso);

    const limparSucesso = () => {
        mensagemSucesso.textContent = "";
        mensagemSucesso.hidden = true;
    };

// Limpa somente a tela. Não altera nem exclui dados do banco.
function limparFormulario() {
    form.reset();

    [nomeExib, nomeCompleto, email, telefone].forEach((campo) => {
        limparErro(campo);
    });

    erroAcessibilidade.textContent = "";
    erroAcessibilidade.hidden = true;

    erroTermos.textContent = "";
    erroTermos.hidden = true;

    limparErroGeral();
    limparSucesso();
}

    // ---------- Validações dos nomes ----------
    const validarNomeExib = (valor) => {
        const texto = valor.trim();

        if (!texto) {
            return "Informe como quer ser chamado.";
        }

        if (texto.length < 2) {
            return "O nome deve ter pelo menos 2 caracteres.";
        }

        if (texto.length > 150) {
            return "O nome de exibição deve ter até 150 caracteres.";
        }

        return null;
    };

    const validarNomeCompleto = (valor) => {
        const texto = valor.trim();

        if (!texto) return null;

        if (texto.length > 250) {
            return "O nome completo deve ter até 250 caracteres.";
        }

        if (!texto.includes(" ")) {
            return "Informe nome e sobrenome.";
        }

        return null;
    };

    // ---------- E-mail ----------
    const ERROS_DOMINIO = {
        "gmial.com": "gmail.com",
        "gmai.com": "gmail.com",
        "gamil.com": "gmail.com",
        "gmail.con": "gmail.com",
        "hotmial.com": "hotmail.com",
        "hotmai.com": "hotmail.com",
        "hotmail.con": "hotmail.com",
        "outlok.com": "outlook.com",
        "outlook.con": "outlook.com",
        "yaho.com": "yahoo.com",
        "yahoo.con": "yahoo.com",
    };

    const validarEmailFormato = (valor) => {
        const texto = valor.trim().toLowerCase();

        if (!texto) {
            return "Informe seu e-mail.";
        }

        if (texto.length > 255) {
            return "O e-mail deve ter até 255 caracteres.";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(texto)) {
            return "E-mail inválido.";
        }

        const dominio = texto.split("@")[1];

        if (ERROS_DOMINIO[dominio]) {
            return `Confira o domínio: você quis dizer @${ERROS_DOMINIO[dominio]}?`;
        }

        return null;
    };

    // ---------- Telefone ----------
    const DDDS_VALIDOS = new Set([
        11, 12, 13, 14, 15, 16, 17, 18, 19,
        21, 22, 24, 27, 28,
        31, 32, 33, 34, 35, 37, 38,
        41, 42, 43, 44, 45, 46, 47, 48, 49,
        51, 53, 54, 55,
        61, 62, 63, 64, 65, 66, 67, 68, 69,
        71, 73, 74, 75, 77, 79,
        81, 82, 83, 84, 85, 86, 87, 88, 89,
        91, 92, 93, 94, 95, 96, 97, 98, 99,
    ]);

    const soDigitos = (valor) => valor.replace(/\D/g, "");

    const validarTelefone = (valor) => {
        const digitos = soDigitos(valor);

        if (!digitos) return null;

        if (digitos.length < 10) {
            return "Informe o telefone com DDD. Ex.: (11) 99999-9999";
        }

        if (digitos.length > 11) {
            return "Telefone com dígitos demais.";
        }

        if (!DDDS_VALIDOS.has(Number(digitos.slice(0, 2)))) {
            return "DDD inválido.";
        }

        if (digitos.length === 11 && digitos[2] !== "9") {
            return "Celular deve começar com 9 após o DDD.";
        }

        if (
            digitos.length === 10 &&
            !"2345".includes(digitos[2])
        ) {
            return "Telefone fixo inválido.";
        }

        return null;
    };

    const formatarTelefone = (valor) => {
        const digitos = soDigitos(valor).slice(0, 11);

        if (digitos.length <= 2) {
            return digitos ? `(${digitos}` : "";
        }

        if (digitos.length <= 6) {
            return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
        }

        if (digitos.length <= 10) {
            return (
                `(${digitos.slice(0, 2)}) ` +
                `${digitos.slice(2, 6)}-${digitos.slice(6)}`
            );
        }

        return (
            `(${digitos.slice(0, 2)}) ` +
            `${digitos.slice(2, 7)}-${digitos.slice(7)}`
        );
    };

    telefone.addEventListener("input", () => {
        telefone.value = formatarTelefone(telefone.value);
    });

    // ---------- Acessibilidade ----------
    const nivelEscolhido = () =>
        form.querySelector('input[name="acessibilidade"]:checked');

    // ---------- Validação do formulário ----------
    const validarFormulario = () => {
        limparErroGeral();
        limparSucesso();

        let valido = true;

        const checar = (campo, erro) => {
            if (erro) {
                mostrarErro(campo, erro);
                valido = false;
            } else {
                limparErro(campo);
            }
        };

        checar(nomeExib, validarNomeExib(nomeExib.value));
        checar(
            nomeCompleto,
            validarNomeCompleto(nomeCompleto.value)
        );
        checar(email, validarEmailFormato(email.value));
        checar(telefone, validarTelefone(telefone.value));

        const nivel = nivelEscolhido();

        if (
            !nivel ||
            !["surdo", "ouvinte", "ambos"].includes(nivel.value)
        ) {
            erroAcessibilidade.textContent =
                "Escolha um nível de acessibilidade.";

            erroAcessibilidade.hidden = false;
            valido = false;
        } else {
            erroAcessibilidade.textContent = "";
            erroAcessibilidade.hidden = true;
        }

        if (!termos.checked) {
            erroTermos.textContent =
                "Você precisa aceitar os termos para continuar.";

            erroTermos.hidden = false;
            valido = false;
        } else {
            erroTermos.textContent = "";
            erroTermos.hidden = true;
        }

        if (!valido) {
            const primeiroInvalido = form.querySelector(
                '[aria-invalid="true"]'
            );

            if (primeiroInvalido) {
                primeiroInvalido.focus();
            } else if (!nivel) {
                opcoesAcessibilidade[0]?.focus();
            } else if (!termos.checked) {
                termos.focus();
            }
        }

        return valido;
    };

    // ---------- Limpar erros ao editar ----------
    [nomeExib, nomeCompleto, email, telefone].forEach((campo) => {
        campo.addEventListener("input", () => {
            limparErro(campo);
            limparErroGeral();
            limparSucesso();
        });
    });

    opcoesAcessibilidade.forEach((radio) => {
        radio.addEventListener("change", () => {
            erroAcessibilidade.textContent = "";
            erroAcessibilidade.hidden = true;

            limparErroGeral();
            limparSucesso();
        });
    });

    termos.addEventListener("change", () => {
        if (termos.checked) {
            erroTermos.textContent = "";
            erroTermos.hidden = true;
        }

        limparSucesso();
    });

    // ---------- Estado do botão ----------
    const atualizarBotao = (ocupado) => {
        btnCadastrar.disabled = ocupado;

        btnCadastrar.classList.toggle(
            "carregando",
            ocupado
        );

        form.setAttribute("aria-busy", String(ocupado));

        textoBtn.textContent = ocupado
            ? "Salvando perfil..."
            : "Cadastrar perfil";
    };

    // ---------- Erros retornados pela API ----------
    const obterMensagemErro = (dados, status) => {
        if (Array.isArray(dados?.detail)) {
            return dados.detail
                .map((erro) => {
                    const campo = (erro.loc || [])
                        .filter((parte) => parte !== "body")
                        .join(".");

                    const descricao =
                        erro.msg || "Valor inválido.";

                    return campo
                        ? `${campo}: ${descricao}`
                        : descricao;
                })
                .join(" | ");
        }

        if (typeof dados?.detail === "string") {
            return dados.detail;
        }

        return (
            "Não foi possível cadastrar o perfil. " +
            `Código HTTP ${status}.`
        );
    };

// Centraliza o envio e a leitura das respostas da FastAPI.
async function requisicao(
    caminho = "",
    metodo = "GET",
    dados = null
) {
    // Preserva /usuarios/ para a coleção e monta
    // /usuarios/ID quando houver um caminho individual.
    const url = caminho
        ? `${API_URL.replace(/\/+$/, "")}/${String(caminho).replace(/^\/+/, "")}`
        : API_URL;

    const opcoes = {
        method: metodo,
        headers: {
            Accept: "application/json",
        },
    };

    if (dados !== null) {
        opcoes.headers["Content-Type"] = "application/json";
        opcoes.body = JSON.stringify(dados);
    }

    let resposta;

    try {
        resposta = await fetch(url, opcoes);
    } catch {
        throw new Error(
            "Não foi possível acessar a API. " +
            "Confira se a FastAPI está iniciada, a URL e o CORS. " +
            "Se foi uma operação de gravação, confira o banco " +
            "antes de tentar novamente."
        );
    }

    if (resposta.status === 204) {
        return null;
    }

    let conteudo = null;

    try {
        conteudo = await resposta.json();
    } catch {
        // A resposta pode não conter um JSON válido.
    }

    if (!resposta.ok) {
        throw new Error(
            obterMensagemErro(conteudo, resposta.status)
        );
    }

    if (conteudo === null) {
        throw new Error(
            "A API respondeu com sucesso, mas sem um JSON válido. " +
            "Confira o banco antes de repetir uma gravação."
        );
    }

    return conteudo;
}

    // ---------- Envio para a FastAPI ----------
    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        if (enviando) return;

        if (!validarFormulario()) return;

        enviando = true;
        atualizarBotao(true);

        const conteudo = {
            nome_exibicao: nomeExib.value.trim(),
            nome_completo: nomeCompleto.value.trim() || null,
            email_usuario: email.value.trim().toLowerCase(),
            telefone_usuario: soDigitos(telefone.value) || null,

            // Mapeamento definido no HTML atual.
            tipo_usuario: nivelEscolhido().value,

            status_usuario: "ativo",
        };

        try {
            const usuario = await requisicao(
                "",
                "POST",
                conteudo
            );

            if (!usuario || usuario.id_usuario == null) {
                throw new Error(
                    "A API respondeu sem o ID do usuário. " +
                    "Confira a tabela antes de repetir o cadastro."
                );
            }

            // Limpa a tela, sem alterar o registro salvo.
            limparFormulario();

            mensagemSucesso.textContent =
                `Perfil cadastrado com sucesso! ID: ${usuario.id_usuario}. ` +
                "Senha e login ainda não estão disponíveis.";

            mensagemSucesso.hidden = false;
        } catch (erro) {
            console.error(
                "Falha no cadastro do perfil:",
                erro
            );

            mostrarErroGeral(erro.message);
        } finally {
            enviando = false;
            atualizarBotao(false);
        }
    });
})();