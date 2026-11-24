/* =========================================================
   Omni IA Support — Widget de Acessibilidade

   - Consulta o perfil do usuário autenticado.
   - Cria o perfil na primeira alteração, quando necessário.
   - Atualiza preferências com PATCH.
   - Visitantes usam somente armazenamento local.
   ========================================================= */

   (() => {
    "use strict";

    const API_URL = "http://127.0.0.1:8000";

    // Deve ser a mesma chave utilizada no login.js.
    const CHAVE_TOKEN = "omni:token_acesso";

    // Cache exclusivo para uso como visitante.
    const CHAVE_CACHE_VISITANTE =
        "omni:acessibilidade_visitante";

    const TAMANHOS_FONTE = {
        pequeno: 90,
        medio: 100,
        grande: 120,
    };

    const ORDEM_TAMANHOS = [
        "pequeno",
        "medio",
        "grande",
    ];

    const estadoPadrao = {
        prefere_legenda: false,
        velocidade_audio: 1.0,
        volume_audio: 1.0,
        tamanho_fonte: "medio",
        letra_destacada: false,
        modo_escuro: false,
    };

    let estado = { ...estadoPadrao };

    let idPerfil = null;
    let tokenDaSessao = null;
    let usuarioAutenticado = false;

    let sincronizando = false;
    let sincronizacaoBloqueada = false;

    let alteracoesPendentes = {};
    let temporizadorAudio = null;

    const obterToken = () => {
        try {
            return localStorage.getItem(CHAVE_TOKEN);
        } catch {
            return null;
        }
    };

    const validarNumero = (
        valor,
        minimo,
        maximo,
        padrao,
    ) => {
        if (valor === null || valor === undefined) {
            return padrao;
        }

        const numero = Number(valor);

        if (
            !Number.isFinite(numero) ||
            numero < minimo ||
            numero > maximo
        ) {
            return padrao;
        }

        return numero;
    };

    const normalizarEstado = (dados) => {
        const origem =
            dados && typeof dados === "object"
                ? dados
                : {};

        return {
            prefere_legenda:
                origem.prefere_legenda === true,

            velocidade_audio: validarNumero(
                origem.velocidade_audio,
                0.5,
                2,
                1,
            ),

            volume_audio: validarNumero(
                origem.volume_audio,
                0,
                1,
                1,
            ),

            tamanho_fonte: ORDEM_TAMANHOS.includes(
                origem.tamanho_fonte,
            )
                ? origem.tamanho_fonte
                : "medio",

            letra_destacada:
                origem.letra_destacada === true,

            modo_escuro:
                origem.modo_escuro === true,
        };
    };

    const carregarCacheVisitante = () => {
        try {
            const salvo = localStorage.getItem(
                CHAVE_CACHE_VISITANTE,
            );

            if (!salvo) return;

            estado = normalizarEstado(
                JSON.parse(salvo),
            );
        } catch {
            estado = { ...estadoPadrao };

            console.warn(
                "Preferências locais inválidas foram ignoradas.",
            );
        }
    };

    const salvarCacheVisitante = () => {
        // Preferências de contas não sobrescrevem
        // as preferências locais do visitante.
        if (tokenDaSessao) return;

        try {
            localStorage.setItem(
                CHAVE_CACHE_VISITANTE,
                JSON.stringify(estado),
            );
        } catch {
            console.warn(
                "Não foi possível salvar as preferências locais.",
            );
        }
    };

    const mostrarStatus = (texto, erro = false) => {
        const elemento = document.getElementById(
            "omni-acess-status",
        );

        if (!elemento) return;

        elemento.textContent = texto;
        elemento.classList.toggle("erro", erro);
    };

    const definirControlesDesabilitados = (
        desabilitados,
    ) => {
        const painel = document.getElementById(
            "omni-acess-painel",
        );

        if (!painel) return;

        painel
            .querySelectorAll(
                ".painel-body input, .painel-body button",
            )
            .forEach((elemento) => {
                elemento.disabled = desabilitados;
            });

        painel.setAttribute(
            "aria-busy",
            String(desabilitados),
        );
    };

    const requisicao = async (
        caminho,
        opcoes = {},
    ) => {
        // Evita continuar usando a identidade anterior
        // se o token for removido ou substituído.
        if (
            !tokenDaSessao ||
            obterToken() !== tokenDaSessao
        ) {
            const erro = new Error(
                "A sessão mudou. Recarregue a página.",
            );

            erro.status = 401;
            throw erro;
        }

        let resposta;

        try {
            resposta = await fetch(
                API_URL + caminho,
                {
                    ...opcoes,

                    headers: {
                        Accept: "application/json",

                        ...(opcoes.body
                            ? {
                                "Content-Type":
                                    "application/json",
                            }
                            : {}),

                        ...opcoes.headers,

                        Authorization:
                            `Bearer ${tokenDaSessao}`,
                    },

                    cache: "no-store",
                },
            );
        } catch {
            throw new Error(
                "Não foi possível comunicar com o servidor.",
            );
        }

        // Ignora respostas de uma sessão que já mudou.
        if (obterToken() !== tokenDaSessao) {
            const erro = new Error(
                "A sessão mudou. Recarregue a página.",
            );

            erro.status = 401;
            throw erro;
        }

        if (resposta.status === 204) {
            if (!resposta.ok) {
                throw new Error(
                    "Não foi possível concluir a operação.",
                );
            }

            return null;
        }

        let dados = null;
        let jsonValido = true;

        try {
            dados = await resposta.json();
        } catch {
            jsonValido = false;
        }

        if (!resposta.ok) {
            const mensagem =
                typeof dados?.detail === "string"
                    ? dados.detail
                    : `Não foi possível concluir a operação. HTTP ${resposta.status}.`;

            const erro = new Error(mensagem);
            erro.status = resposta.status;

            throw erro;
        }

        if (!jsonValido) {
            throw new Error(
                "O servidor retornou uma resposta inesperada.",
            );
        }

        return dados;
    };

    const prepararEstadoRecebido = (perfil) => {
        const identificador = Number(
            perfil?.id_perfil_acessibilidade,
        );

        if (
            !Number.isSafeInteger(identificador) ||
            identificador <= 0
        ) {
            throw new Error(
                "O servidor retornou um perfil sem ID válido.",
            );
        }

        estado = normalizarEstado(perfil);
        idPerfil = identificador;
    };

    const aplicarEstadoVisual = () => {
        document.body.classList.toggle(
            "dark-mode",
            estado.modo_escuro,
        );

        document.body.classList.toggle(
            "omni-letra-destacada",
            estado.letra_destacada,
        );

        const atualizarCheckbox = (
            identificador,
            valor,
        ) => {
            const elemento = document.getElementById(
                identificador,
            );

            if (elemento) {
                elemento.checked = valor;
            }
        };

        atualizarCheckbox(
            "chk-modo-escuro",
            estado.modo_escuro,
        );

        atualizarCheckbox(
            "chk-letra-destacada",
            estado.letra_destacada,
        );

        atualizarCheckbox(
            "chk-legenda",
            estado.prefere_legenda,
        );

        const percentual =
            TAMANHOS_FONTE[estado.tamanho_fonte] ?? 100;

        document.documentElement.style.fontSize =
            `${percentual}%`;

        const textoFonte = document.getElementById(
            "txt-fonte-valor",
        );

        if (textoFonte) {
            textoFonte.textContent =
                `${percentual}%`;
        }

        const velocidade = document.getElementById(
            "range-velocidade",
        );

        const textoVelocidade = document.getElementById(
            "txt-velocidade",
        );

        if (velocidade) {
            velocidade.value =
                String(estado.velocidade_audio);
        }

        if (textoVelocidade) {
            textoVelocidade.textContent =
                `${estado.velocidade_audio.toFixed(1)}x`;
        }

        const volume = document.getElementById(
            "range-volume",
        );

        const textoVolume = document.getElementById(
            "txt-volume",
        );

        if (volume) {
            volume.value =
                String(estado.volume_audio);
        }

        if (textoVolume) {
            textoVolume.textContent =
                `${Math.round(estado.volume_audio * 100)}%`;
        }
    };

    const carregarPerfil = async () => {
        mostrarStatus(
            "Carregando suas preferências…",
        );

        const perfil = await requisicao(
            "/perfis_acessibilidade/meu",
        );

        if (perfil === null) {
            idPerfil = null;
            estado = { ...estadoPadrao };

            usuarioAutenticado = true;

            mostrarStatus(
                "Usando preferências padrão. " +
                "Elas serão salvas na primeira alteração.",
            );

            return;
        }

        prepararEstadoRecebido(perfil);
        usuarioAutenticado = true;

        mostrarStatus(
            "Preferências carregadas.",
        );
    };

    const enviarAlteracoes = async () => {
        if (
            !usuarioAutenticado ||
            sincronizando ||
            sincronizacaoBloqueada ||
            !Object.keys(alteracoesPendentes).length
        ) {
            return;
        }

        sincronizando = true;

        let camposEmEnvio = {};

        try {
            while (
                usuarioAutenticado &&
                !sincronizacaoBloqueada &&
                Object.keys(alteracoesPendentes).length
            ) {
                camposEmEnvio = {
                    ...alteracoesPendentes,
                };

                alteracoesPendentes = {};

                if (idPerfil === null) {
                    mostrarStatus(
                        "Criando seu perfil…",
                    );

                    // Envia o estado completo atual na criação.
                    const perfilCriado = await requisicao(
                        "/perfis_acessibilidade/",
                        {
                            method: "POST",

                            body: JSON.stringify({
                                ...estado,
                            }),
                        },
                    );

                    const identificador = Number(
                        perfilCriado
                            ?.id_perfil_acessibilidade,
                    );

                    if (
                        !Number.isSafeInteger(
                            identificador,
                        ) ||
                        identificador <= 0
                    ) {
                        throw new Error(
                            "A resposta não confirmou " +
                            "o ID do perfil criado.",
                        );
                    }

                    idPerfil = identificador;
                } else {
                    mostrarStatus("Salvando…");

                    await requisicao(
                        `/perfis_acessibilidade/${idPerfil}`,
                        {
                            method: "PATCH",

                            body: JSON.stringify(
                                camposEmEnvio,
                            ),
                        },
                    );
                }

                camposEmEnvio = {};
            }

            mostrarStatus(
                "Preferências salvas.",
            );
        } catch (erro) {
            // Preserva campos não confirmados.
            // Mudanças mais recentes têm prioridade.
            alteracoesPendentes = {
                ...camposEmEnvio,
                ...alteracoesPendentes,
            };

            // Evita repetir automaticamente uma gravação
            // cuja resposta pode ter sido perdida.
            sincronizacaoBloqueada = true;

            clearTimeout(temporizadorAudio);

            if (erro.status === 401) {
                usuarioAutenticado = false;

                mostrarStatus(
                    "Sessão inválida ou expirada. " +
                    "Entre novamente para sincronizar.",
                    true,
                );

                return;
            }

            mostrarStatus(
                `${erro.message || "Não foi possível salvar."} ` +
                "Aplicado nesta tela, mas sem confirmação " +
                "da gravação. Recarregue e confira o perfil " +
                "antes de tentar novamente.",
                true,
            );
        } finally {
            sincronizando = false;
        }
    };

    const registrarAlteracao = (campos) => {
        if (obterToken() !== tokenDaSessao) {
            usuarioAutenticado = false;
            sincronizacaoBloqueada = true;

            mostrarStatus(
                "A sessão mudou. Recarregue a página " +
                "antes de salvar preferências.",
                true,
            );

            return false;
        }

        if (!tokenDaSessao) {
            salvarCacheVisitante();

            mostrarStatus(
                "Preferências salvas somente neste navegador. " +
                "Entre para salvar no banco.",
            );

            return false;
        }

        if (
            !usuarioAutenticado ||
            sincronizacaoBloqueada
        ) {
            mostrarStatus(
                "Aplicado somente nesta tela. " +
                "A sincronização está indisponível. " +
                "Recarregue a página ou entre novamente.",
                true,
            );

            return false;
        }

        Object.assign(
            alteracoesPendentes,
            campos,
        );

        return true;
    };

    const agendarSincronizacao = (campos) => {
        if (!registrarAlteracao(campos)) {
            return;
        }

        void enviarAlteracoes();
    };

    const agendarAudio = (campos) => {
        if (!registrarAlteracao(campos)) {
            return;
        }

        clearTimeout(temporizadorAudio);

        temporizadorAudio = setTimeout(() => {
            void enviarAlteracoes();
        }, 600);
    };

    const configurarEventos = () => {
        const associarCheckbox = (
            identificador,
            campo,
        ) => {
            document
                .getElementById(identificador)
                ?.addEventListener(
                    "change",
                    (evento) => {
                        estado[campo] =
                            evento.target.checked;

                        aplicarEstadoVisual();

                        agendarSincronizacao({
                            [campo]: estado[campo],
                        });
                    },
                );
        };

        associarCheckbox(
            "chk-modo-escuro",
            "modo_escuro",
        );

        associarCheckbox(
            "chk-letra-destacada",
            "letra_destacada",
        );

        associarCheckbox(
            "chk-legenda",
            "prefere_legenda",
        );

        const alterarFonte = (direcao) => {
            const indiceAtual =
                ORDEM_TAMANHOS.indexOf(
                    estado.tamanho_fonte,
                );

            const novoIndice = Math.max(
                0,
                Math.min(
                    indiceAtual + direcao,
                    ORDEM_TAMANHOS.length - 1,
                ),
            );

            const novoTamanho =
                ORDEM_TAMANHOS[novoIndice];

            if (
                novoTamanho ===
                estado.tamanho_fonte
            ) {
                return;
            }

            estado.tamanho_fonte = novoTamanho;

            aplicarEstadoVisual();

            agendarSincronizacao({
                tamanho_fonte:
                    estado.tamanho_fonte,
            });
        };

        document
            .getElementById("btn-fonte-mais")
            ?.addEventListener("click", () => {
                alterarFonte(1);
            });

        document
            .getElementById("btn-fonte-menos")
            ?.addEventListener("click", () => {
                alterarFonte(-1);
            });

        document
            .getElementById("range-velocidade")
            ?.addEventListener(
                "input",
                (evento) => {
                    estado.velocidade_audio =
                        Number(evento.target.value);

                    aplicarEstadoVisual();

                    agendarAudio({
                        velocidade_audio:
                            estado.velocidade_audio,
                    });
                },
            );

        document
            .getElementById("range-volume")
            ?.addEventListener(
                "input",
                (evento) => {
                    estado.volume_audio =
                        Number(evento.target.value);

                    aplicarEstadoVisual();

                    agendarAudio({
                        volume_audio:
                            estado.volume_audio,
                    });
                },
            );

        document
            .getElementById("omni-acess-reset")
            ?.addEventListener("click", () => {
                clearTimeout(temporizadorAudio);

                estado = {
                    ...estadoPadrao,
                };

                aplicarEstadoVisual();

                agendarSincronizacao({
                    ...estadoPadrao,
                });
            });
    };

    const criarWidget = () => {
        const fab = document.createElement("button");

        fab.type = "button";
        fab.id = "omni-acess-fab";
        fab.className = "acessibilidade-fab";

        fab.setAttribute(
            "aria-label",
            "Abrir opções de acessibilidade",
        );

        fab.setAttribute(
            "aria-expanded",
            "false",
        );

        fab.setAttribute(
            "aria-controls",
            "omni-acess-painel",
        );

        fab.innerHTML = `
            <i
                class="fa-solid fa-universal-access"
                aria-hidden="true"
            ></i>
        `;

        document.body.appendChild(fab);

        const painel = document.createElement("aside");

        painel.id = "omni-acess-painel";
        painel.className = "painel-glass";

        painel.setAttribute(
            "aria-hidden",
            "true",
        );

        painel.setAttribute(
            "aria-labelledby",
            "omni-acess-titulo",
        );

        painel.inert = true;

        painel.innerHTML = `
            <header class="painel-header">
                <h2 id="omni-acess-titulo">
                    <i
                        class="fa-solid fa-universal-access"
                        aria-hidden="true"
                    ></i>
                    Acessibilidade
                </h2>

                <button
                    type="button"
                    class="btn-close"
                    id="omni-acess-close"
                    aria-label="Fechar painel"
                >
                    <i
                        class="fa-solid fa-xmark"
                        aria-hidden="true"
                    ></i>
                </button>
            </header>

            <div class="painel-body">
                <p
                    id="omni-acess-status"
                    class="omni-acess-status"
                    role="status"
                    aria-live="polite"
                ></p>

                <div class="grupo">
                    <h3>Visão e Leitura</h3>

                    <div class="controle-linha">
                        <span class="label">
                            <i
                                class="fa-solid fa-moon"
                                aria-hidden="true"
                            ></i>
                            Modo Escuro
                        </span>

                        <label class="switch">
                            <input
                                type="checkbox"
                                id="chk-modo-escuro"
                                aria-label="Modo escuro"
                            >
                            <span class="slider"></span>
                        </label>
                    </div>

                    <div class="controle-linha">
                        <span class="label">
                            <i
                                class="fa-solid fa-a"
                                aria-hidden="true"
                            ></i>
                            Letra Destacada
                        </span>

                        <label class="switch">
                            <input
                                type="checkbox"
                                id="chk-letra-destacada"
                                aria-label="Letra destacada"
                            >
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>

                <div class="grupo">
                    <h3>Tamanho do Texto</h3>

                    <div class="controle-tamanho-fonte">
                        <span class="label">
                            <i
                                class="fa-solid fa-font"
                                aria-hidden="true"
                            ></i>
                            Tamanho da Fonte
                        </span>

                        <div class="botoes-fonte">
                            <button
                                type="button"
                                class="btn-fonte"
                                id="btn-fonte-menos"
                                aria-label="Diminuir fonte"
                            >
                                A-
                            </button>

                            <span
                                class="valor-fonte"
                                id="txt-fonte-valor"
                            >
                                100%
                            </span>

                            <button
                                type="button"
                                class="btn-fonte"
                                id="btn-fonte-mais"
                                aria-label="Aumentar fonte"
                            >
                                A+
                            </button>
                        </div>
                    </div>
                </div>

                <div class="grupo">
                    <h3>Áudio e Mídia</h3>

                    <div class="controle-linha">
                        <span class="label">
                            <i
                                class="fa-solid fa-closed-captioning"
                                aria-hidden="true"
                            ></i>
                            Legendas
                        </span>

                        <label class="switch">
                            <input
                                type="checkbox"
                                id="chk-legenda"
                                aria-label="Legendas"
                            >
                            <span class="slider"></span>
                        </label>
                    </div>

                    <div class="controle-slider">
                        <label for="range-velocidade">
                            Velocidade
                            <span
                                class="valor-slider"
                                id="txt-velocidade"
                            >
                                1.0x
                            </span>
                        </label>

                        <input
                            type="range"
                            id="range-velocidade"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value="1.0"
                        >
                    </div>

                    <div class="controle-slider">
                        <label for="range-volume">
                            Volume
                            <span
                                class="valor-slider"
                                id="txt-volume"
                            >
                                100%
                            </span>
                        </label>

                        <input
                            type="range"
                            id="range-volume"
                            min="0"
                            max="1"
                            step="0.1"
                            value="1.0"
                        >
                    </div>
                </div>

                <button
                    type="button"
                    id="omni-acess-reset"
                    class="btn-resetar"
                >
                    Restaurar Padrões
                </button>
            </div>
        `;

        document.body.appendChild(painel);

        const fechar = document.getElementById(
            "omni-acess-close",
        );

        const alternarPainel = (abrir) => {
            if (abrir) {
                painel.inert = false;

                painel.setAttribute(
                    "aria-hidden",
                    "false",
                );

                painel.classList.add("aberto");

                fab.setAttribute(
                    "aria-expanded",
                    "true",
                );

                fechar.focus();
            } else {
                if (
                    painel.contains(
                        document.activeElement,
                    )
                ) {
                    fab.focus();
                }

                painel.classList.remove("aberto");

                painel.setAttribute(
                    "aria-hidden",
                    "true",
                );

                painel.inert = true;

                fab.setAttribute(
                    "aria-expanded",
                    "false",
                );
            }
        };

        fab.addEventListener("click", () => {
            alternarPainel(
                !painel.classList.contains(
                    "aberto",
                ),
            );
        });

        fechar.addEventListener("click", () => {
            alternarPainel(false);
        });

        painel.addEventListener(
            "keydown",
            (evento) => {
                if (evento.key === "Escape") {
                    evento.preventDefault();
                    alternarPainel(false);
                }
            },
        );

        configurarEventos();
    };

    const iniciar = async () => {
        if (
            document.getElementById(
                "omni-acess-fab",
            )
        ) {
            return;
        }

        tokenDaSessao = obterToken();

        criarWidget();

        if (!tokenDaSessao) {
            carregarCacheVisitante();
            aplicarEstadoVisual();

            mostrarStatus(
                "Preferências locais. " +
                "Entre para salvar no banco.",
            );

            return;
        }

        // Não reaproveita cache de visitante
        // nem preferências de uma conta anterior.
        estado = { ...estadoPadrao };

        aplicarEstadoVisual();
        definirControlesDesabilitados(true);

        try {
            await carregarPerfil();
            aplicarEstadoVisual();
        } catch (erro) {
            usuarioAutenticado = false;
            sincronizacaoBloqueada = true;
            idPerfil = null;

            if (erro.status === 401) {
                mostrarStatus(
                    "Sessão inválida ou expirada. " +
                    "Entre novamente para sincronizar.",
                    true,
                );
            } else {
                mostrarStatus(
                    `${erro.message || "Não foi possível carregar o perfil."} ` +
                    "As alterações ficarão somente nesta tela " +
                    "até recarregar e restabelecer a conexão.",
                    true,
                );
            }
        } finally {
            definirControlesDesabilitados(false);
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            iniciar,
            { once: true },
        );
    } else {
        void iniciar();
    }
})();