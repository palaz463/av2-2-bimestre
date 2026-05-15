let youtubeApiPromise;

function carregarApiYoutube() {
    if (youtubeApiPromise) {
        return youtubeApiPromise;
    }

    youtubeApiPromise = new Promise((resolve) => {
        if (window.YT && window.YT.Player) {
            resolve(window.YT);
            return;
        }

        window.onYouTubeIframeAPIReady = () => resolve(window.YT);

        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
    });

    return youtubeApiPromise;
}

function formatarTempo(segundosTotais) {
    const segundosSeguros = Math.max(0, Math.floor(segundosTotais || 0));
    const minutos = Math.floor(segundosSeguros / 60);
    const segundos = String(segundosSeguros % 60).padStart(2, "0");
    return `${minutos}:${segundos}`;
}

function iniciarPlayerYoutube(container, YT) {
    const videoId = container.dataset.videoId;
    const tela = container.querySelector(".youtube-player__screen");
    const areaVideo = container.querySelector(".youtube-player__video");
    const carregando = container.querySelector(".youtube-player__loading");
    const botaoPlay = container.querySelector(".youtube-player__play");
    const botaoMute = container.querySelector(".youtube-player__mute");
    const botaoTelaCheia = container.querySelector(".youtube-player__fullscreen");
    const barraProgresso = container.querySelector(".youtube-player__seek");
    const barraVolume = container.querySelector(".youtube-player__volume");
    const velocidade = container.querySelector(".youtube-player__speed");
    const tempoAtual = container.querySelector(".youtube-player__current");
    const duracao = container.querySelector(".youtube-player__duration");
    let usuarioArrastando = false;

    const player = new YT.Player(areaVideo, {
        videoId: videoId,
        playerVars: {
            controls: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1
        },
        events: {
            onReady: () => {
                carregando.style.display = "none";
                player.setVolume(Number(barraVolume.value));
                duracao.textContent = formatarTempo(player.getDuration());
                requestAnimationFrame(atualizarProgresso);
            },
            onStateChange: (evento) => {
                const estaTocando = evento.data === YT.PlayerState.PLAYING;
                botaoPlay.textContent = estaTocando ? "Pausar" : "Play";
                botaoPlay.setAttribute("aria-label", estaTocando ? "Pausar" : "Reproduzir");
            }
        }
    });

    function alternarPlay() {
        const estado = player.getPlayerState();

        if (estado === YT.PlayerState.PLAYING) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    }

    function atualizarProgresso() {
        if (!usuarioArrastando && player.getDuration) {
            const total = player.getDuration() || 0;
            const atual = player.getCurrentTime() || 0;

            duracao.textContent = formatarTempo(total);
            tempoAtual.textContent = formatarTempo(atual);
            barraProgresso.value = total ? (atual / total) * 100 : 0;
        }

        requestAnimationFrame(atualizarProgresso);
    }

    botaoPlay.addEventListener("click", alternarPlay);

    botaoMute.addEventListener("click", () => {
        if (player.isMuted()) {
            player.unMute();
            botaoMute.textContent = "Som";
        } else {
            player.mute();
            botaoMute.textContent = "Mudo";
        }
    });

    barraVolume.addEventListener("input", () => {
        const volume = Number(barraVolume.value);
        player.setVolume(volume);

        if (volume === 0) {
            player.mute();
            botaoMute.textContent = "Mudo";
        } else {
            player.unMute();
            botaoMute.textContent = "Som";
        }
    });

    barraProgresso.addEventListener("input", () => {
        usuarioArrastando = true;
    });

    barraProgresso.addEventListener("change", () => {
        const total = player.getDuration() || 0;
        const novoTempo = (Number(barraProgresso.value) / 100) * total;
        player.seekTo(novoTempo, true);
        usuarioArrastando = false;
    });

    velocidade.addEventListener("change", () => {
        player.setPlaybackRate(Number(velocidade.value));
    });

    botaoTelaCheia.addEventListener("click", () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            tela.requestFullscreen();
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const players = document.querySelectorAll(".youtube-player");

    if (!players.length) {
        return;
    }

    const YT = await carregarApiYoutube();
    players.forEach((player) => iniciarPlayerYoutube(player, YT));
});
