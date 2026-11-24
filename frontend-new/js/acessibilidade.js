/* =========================================================
   Omni IA Support — Widget de Acessibilidade
   ========================================================= */


   (() => {
    "use strict";


    const API_URL = "http://127.0.0.1:8000";
    const CHAVE_TOKEN = "omni:access_token";
    const CHAVE_CACHE = "omni:acessibilidade_perfil";


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
    let usuarioAutenticado = false;
    let sincronizando = false;
    let alteracoesPendentes = {};
    let temporizadorAudio = null;


    const obterToken = () => {
        try {
            return localStorage.getItem(CHAVE_TOKEN);
        } catch (erro) {
            return null;
        }
    };


    const salvarCache = () => {
        try {
            localStorage.setItem(
                CHAVE_CACHE,
                JSON.stringify(estado),
            );
        } catch (erro) {
            console.warn(
                "Não foi possível salvar as preferências localmente.",
                erro,
            );
        }
    };


    const carregarCache = () => {
        try {
            const salvo = localStorage.getItem(CHAVE_CACHE);

            if (!salvo) return;

            const dados = JSON.parse(salvo);

            estado = {
                ...estadoPadrao,
                ...dados,
            };
        } catch (erro) {
            console.warn(
                "Preferências locais inválidas foram ignoradas.",
                erro,
            );
        }
    };


    const converterTamanhoParaInterface = (valor) => {
        if (valor === "pequeno") return 90;
        if (valor === "grande") return 120;
        return 100;
    };


    const validarNumero = (valor, minimo, maximo, padrao) => {
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


    const prepararEstadoRecebido = (perfil) => {
        estado = {
            prefere_legenda: perfil.prefere_legenda === true,
            velocidade_audio: validarNumero(
                perfil.velocidade_audio,
                0.5,
                2,
                1.0,
            ),
            volume_audio: validarNumero(
                perfil.volume_audio,
                0,
                1,
                1.0,
            ),
            tamanho_fonte: ORDEM_TAMANHOS.includes(
                perfil.tamanho_fonte,
            )
                ? perfil.tamanho_fonte
                : "medio",
            letra_destacada: perfil.letra_destacada === true,
            modo_escuro: perfil.modo_escuro === true,
        };

        idPerfil = perfil.id_perfil_acessibilidade;
    };


    const criarWidget = () => {
        if (document.getElementById("omni-acess-fab")) return;

        const fab = document.createElement("button");
        fab.id = "omni-acess-fab";
        fab.className = "acessibilidade-fab";
        fab.setAttribute(
            "aria-label",
            "Abrir opções de acessibilidade",
        );
        fab.setAttribute("aria-expanded", "false");
        fab.innerHTML =
            '<i class="fa-solid fa-universal-access" aria-hidden="true"></i>';

        document.body.appendChild(fab);

        const painel = document.createElement("aside");
        painel.id = "omni-acess-painel";
        painel.className = "painel-glass";
        painel.setAttribute("aria-hidden", "true");
        painel.innerHTML = `
            <header class="painel-header">
                <h2>
                    <i class="fa-solid fa-universal-access" aria-hidden="true"></i>
                    Acessibilidade
                </h2>
                <button
                    class="btn-close"
                    id="omni-acess-close"
                    aria-label="Fechar painel"
                >
                    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
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
                            <i class="fa-solid fa-moon" aria-hidden="true"></i>
                            Modo Escuro
                        </span>

                        <label class="switch">
                            <input
                                type="checkbox"
                                id="chk-modo-escuro"
                            >
                            <span class="slider"></span>
                        </label>
                    </div>

                    <div class="controle-linha">
                        <span class="label">
                            <i class="fa-solid fa-a" aria-hidden="true"></i>
                            Letra Destacada
                        </span>

                        <label class="switch">
                            <input
                                type="checkbox"
                                id="chk-letra-destacada"
                            >
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>

                <div class="grupo">
                    <h3>Tamanho do Texto</h3>

                    <div class="controle-tamanho-fonte">
                        <span class="label">
                            <i class="fa-solid fa-font" aria-hidden="true"></i>
                            Tamanho da Fonte
                        </span>

                        <div class="botoes-fonte">
                            <button
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
                            <i class="fa-solid fa-closed-captioning" aria-hidden="true"></i>
                            Legendas
                        </span>

                        <label class="switch">
                            <input
                                type="checkbox"
                                id="chk-legenda"
                            >
                            <span class="slider"></span>
                        </label>
                    </div>

                    <div class="controle-slider">
                        <label>
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
                        <label>
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
                    id="omni-acess-reset"
                    class="btn-resetar"
                >
                    Restaurar Padrões
                </button>
            </div>
        `;

        document.body.appendChild(painel);

        const alternarPainel = (abrir) => {
            painel.classList.toggle("aberto", abrir);
            painel.setAttribute("aria-hidden", String(!abrir));
            fab.setAttribute("aria-expanded", String(abrir));
        };

        fab.addEventListener("click", () => {
            alternarPainel(
                !painel.classList.contains("aberto"),
            );
        });

        document
            .getElementById("omni-acess-close")
            .addEventListener("click", () => {
                alternarPainel(false);
            });

        configurarEventos();
        aplicarEstadoVisual();
    };


    const mostrarStatus = (texto, erro = false) => {
        const status = document.getElementById(
            "omni-acess-status",
        );

        if (!status) return;

        status.textContent = texto;
        status.classList.toggle("erro", erro);
    };


    const aplicarEstadoVisual = () => {
        document.body.classList.toggle(
            "dark-mode",
            estado.modo_escuro,
        );

        const chkEscuro = document.getElementById(
            "chk-modo-escuro",
        );

        if (chkEscuro) {
            chkEscuro.checked = estado.modo_escuro;
        }

        document.body.classList.toggle(
            "omni-letra-destacada",
            estado.letra_destacada,
        );

        const chkLetra = document.getElementById(
            "chk-letra-destacada",
        );

        if (chkLetra) {
            chkLetra.checked = estado.letra_destacada;
        }

        const chkLegenda = document.getElementById(
            "chk-legenda",
        );

        if (chkLegenda) {
            chkLegenda.checked = estado.prefere_legenda;
        }

        const percentual = converterTamanhoParaInterface(
            estado.tamanho_fonte,
        );

        document.documentElement.style.fontSize =
            `${percentual}%`;

        const txtFonte = document.getElementById(
            "txt-fonte-valor",
        );

        if (txtFonte) {
            txtFonte.textContent = `${percentual}%`;
        }

        const rVelocidade = document.getElementById(
            "range-velocidade",
        );

        if (rVelocidade) {
            rVelocidade.value = estado.velocidade_audio;

            document
                .getElementById("txt-velocidade")
                .textContent =
                    `${Number(estado.velocidade_audio).toFixed(1)}x`;
        }

        const rVolume = document.getElementById(
            "range-volume",
        );

        if (rVolume) {
            rVolume.value = estado.volume_audio;

            document
                .getElementById("txt-volume")
                .textContent =
                    `${Math.round(estado.volume_audio * 100)}%`;
        }
    };


    const requisicao = async (caminho, opcoes = {}) => {
        const token = obterToken();

        const cabecalhos = {
            "Content-Type": "application/json",
        };

        if (token) {
            cabecalhos.Authorization = `Bearer ${token}`;
        }

        const resposta = await fetch(
            API_URL + caminho,
            {
                ...opcoes,
                headers: {
                    ...cabecalhos,
                    ...opcoes.headers,
                },
            },
        );

        if (resposta.status === 204) {
            return null;
        }

        let dados = null;

        try {
            dados = await resposta.json();
        } catch (erro) {
            dados = null;
        }

        if (!resposta.ok) {
            const erro = new Error(
                dados?.detail ||
                "Não foi possível comunicar com o servidor.",
            );

            erro.status = resposta.status;
            throw erro;
        }

        return dados;
    };


    const enviarAlteracoes = async () => {
        if (!usuarioAutenticado) {
            return;
        }

        if (sincronizando) {
            return;
        }

        const campos = { ...alteracoesPendentes };
        alteracoesPendentes = {};

        if (!Object.keys(campos).length) {
            return;
        }

        if (!idPerfil) {
            mostrarStatus("Criando seu perfil…");

            const perfilCriado = await requisicao(
                "/perfis_acessibilidade/",
                {
                    method: "POST",
                    body: JSON.stringify({
                        ...estadoPadrao,
                        ...campos,
                    }),
                },
            );

            idPerfil = perfilCriado.id_perfil_acessibilidade;

            mostrarStatus("Preferências salvas.");
            return;
        }

        mostrarStatus("Salvando…");

        await requisicao(
            `/perfis_acessibilidade/${idPerfil}`,
            {
                method: "PATCH",
                body: JSON.stringify(campos),
            },
        );

        mostrarStatus("Preferências salvas.");
    };


    const agendarSincronizacao = (campos) => {
        Object.assign(alteracoesPendentes, campos);

        salvarCache();

        if (!usuarioAutenticado) {
            mostrarStatus(
                "Aplicado nesta tela. Entre para salvar no banco.",
            );
            return;
        }

        if (sincronizando) {
            return;
        }

        sincronizando = true;

        enviarAlteracoes()
            .catch((erro) => {
                if (erro.status === 401) {
                    mostrarStatus(
                        "Sessão expirada. Entre novamente para salvar.",
                        true,
                    );

                    return;
                }

                mostrarStatus(
                    erro.message ||
                    "Não foi possível salvar as preferências.",
                    true,
                );
            })
            .finally(() => {
                sincronizando = false;

                if (
                    Object.keys(alteracoesPendentes).length
                ) {
                    agendarSincronizacao({});
                }
            });
    };


    const agendarAudio = (campos) => {
        Object.assign(alteracoesPendentes, campos);

        salvarCache();

        if (!usuarioAutenticado) {
            mostrarStatus(
                "Aplicado nesta tela. Entre para salvar no banco.",
            );
            return;
        }

        clearTimeout(temporizadorAudio);

        temporizadorAudio = setTimeout(() => {
            agendarSincronizacao({});
        }, 600);
    };


    const configurarEventos = () => {
        document
            .getElementById("chk-modo-escuro")
            ?.addEventListener("change", (evento) => {
                estado.modo_escuro =
                    evento.target.checked;

                aplicarEstadoVisual();

                agendarSincronizacao({
                    modo_escuro: estado.modo_escuro,
                });
            });

        document
            .getElementById("chk-letra-destacada")
            ?.addEventListener("change", (evento) => {
                estado.letra_destacada =
                    evento.target.checked;

                aplicarEstadoVisual();

                agendarSincronizacao({
                    letra_destacada:
                        estado.letra_destacada,
                });
            });

        document
            .getElementById("chk-legenda")
            ?.addEventListener("change", (evento) => {
                estado.prefere_legenda =
                    evento.target.checked;

                aplicarEstadoVisual();

                agendarSincronizacao({
                    prefere_legenda:
                        estado.prefere_legenda,
                });
            });

        document
            .getElementById("btn-fonte-mais")
            ?.addEventListener("click", () => {
                const indiceAtual =
                    ORDEM_TAMANHOS.indexOf(
                        estado.tamanho_fonte,
                    );

                const proximoIndice = Math.min(
                    indiceAtual + 1,
                    ORDEM_TAMANHOS.length - 1,
                );

                estado.tamanho_fonte =
                    ORDEM_TAMANHOS[proximoIndice];

                aplicarEstadoVisual();

                agendarSincronizacao({
                    tamanho_fonte: estado.tamanho_fonte,
                });
            });

        document
            .getElementById("btn-fonte-menos")
            ?.addEventListener("click", () => {
                const indiceAtual =
                    ORDEM_TAMANHOS.indexOf(
                        estado.tamanho_fonte,
                    );

                const anterior = Math.max(
                    indiceAtual - 1,
                    0,
                );

                estado.tamanho_fonte =
                    ORDEM_TAMANHOS[anterior];

                aplicarEstadoVisual();

                agendarSincronizacao({
                    tamanho_fonte: estado.tamanho_fonte,
                });
            });

        document
            .getElementById("range-velocidade")
            ?.addEventListener("input", (evento) => {
                estado.velocidade_audio =
                    Number(evento.target.value);

                aplicarEstadoVisual();

                agendarAudio({
                    velocidade_audio:
                        estado.velocidade_audio,
                });
            });

        document
            .getElementById("range-volume")
            ?.addEventListener("input", (evento) => {
                estado.volume_audio =
                    Number(evento.target.value);

                aplicarEstadoVisual();

                agendarAudio({
                    volume_audio: estado.volume_audio,
                });
            });

        document
            .getElementById("omni-acess-reset")
            ?.addEventListener("click", () => {
                estado = { ...estadoPadrao };

                aplicarEstadoVisual();

                agendarSincronizacao({
                    prefere_legenda: false,
                    velocidade_audio: 1.0,
                    volume_audio: 1.0,
                    tamanho_fonte: "medio",
                    letra_destacada: false,
                    modo_escuro: false,
                });
            });
    };


    const carregarPerfil = async () => {
        const token = obterToken();

        if (!token) {
            usuarioAutenticado = false;
            idPerfil = null;

            mostrarStatus(
                "Aplicado nesta tela. Entre para salvar no banco.",
            );

            return;
        }

        mostrarStatus("Carregando suas preferências…");

        const perfil = await requisicao(
            "/perfis_acessibilidade/meu",
        );

        if (perfil) {
            prepararEstadoRecebido(perfil);
            usuarioAutenticado = true;

            mostrarStatus("Preferências carregadas.");

            return;
        }

        usuarioAutenticado = true;
        idPerfil = null;
        estado = { ...estadoPadrao };

        mostrarStatus(
            "Usando preferências padrão. Elas serão salvas na primeira alteração.",
        );
    };


    const iniciar = async () => {
        criarWidget();
        carregarCache();
        aplicarEstadoVisual();

        try {
            await carregarPerfil();
            aplicarEstadoVisual();
            salvarCache();
        } catch (erro) {
            if (erro.status === 401) {
                usuarioAutenticado = false;
                idPerfil = null;

                mostrarStatus(
                    "Sessão expirada. Entre novamente para sincronizar.",
                    true,
                );

                return;
            }

            mostrarStatus(
                erro.message ||
                "Não foi possível carregar suas preferências.",
                true,
            );
        }
    };


    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            iniciar,
        );
    } else {
        iniciar();
    }
})();