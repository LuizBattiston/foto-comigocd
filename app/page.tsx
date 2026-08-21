"use client";

import {
  ChangeEvent,
  PointerEvent,
  useRef,
  useState,
} from "react";

export default function Home() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

 

  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const [dragging, setDragging] = useState(false);
const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(
    new Map()
  );

  const dragStartRef = useRef<{
    x: number;
    y: number;
    positionX: number;
    positionY: number;
  } | null>(null);

  const pinchStartRef = useRef<{
    distance: number;
    zoom: number;
  } | null>(null);


  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Escolha um arquivo de imagem.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result;

      if (typeof imageData !== "string") {
        alert("Não foi possível carregar essa imagem.");
        return;
      }

      setPhoto(imageData);
      setResult(null);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    };

    reader.onerror = () => {
      alert("Não foi possível ler a foto selecionada.");
    };

    reader.readAsDataURL(file);
  }

  function getPointerDistance() {
    const pointers = Array.from(pointersRef.current.values());

    if (pointers.length < 2) return 0;

    const [p1, p2] = pointers;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!photo) return;

    event.preventDefault();

    event.currentTarget.setPointerCapture(event.pointerId);

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    // UM DEDO = ARRASTAR
    if (pointersRef.current.size === 1) {
      dragStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        positionX: position.x,
        positionY: position.y,
      };

      setDragging(true);
    }

    // DOIS DEDOS = ZOOM
    if (pointersRef.current.size === 2) {
      setDragging(false);

      pinchStartRef.current = {
        distance: getPointerDistance(),
        zoom,
      };
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) return;

    event.preventDefault();

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    // ZOOM COM DOIS DEDOS
    if (
      pointersRef.current.size === 2 &&
      pinchStartRef.current
    ) {
      const currentDistance = getPointerDistance();

      if (
        currentDistance > 0 &&
        pinchStartRef.current.distance > 0
      ) {
        const scale =
          currentDistance /
          pinchStartRef.current.distance;

        const newZoom =
          pinchStartRef.current.zoom * scale;

        setZoom(
          Math.min(
            5,
            Math.max(0.2, newZoom)
          )
        );
      }

      return;
    }

    // ARRASTAR COM UM DEDO
    if (
      pointersRef.current.size === 1 &&
      dragStartRef.current
    ) {
      const deltaX =
        event.clientX - dragStartRef.current.x;

      const deltaY =
        event.clientY - dragStartRef.current.y;

      setPosition({
        x: dragStartRef.current.positionX + deltaX,
        y: dragStartRef.current.positionY + deltaY,
      });
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();

    pointersRef.current.delete(event.pointerId);

    if (
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      );
    }

    // TERMINOU O ZOOM
    if (pointersRef.current.size < 2) {
      pinchStartRef.current = null;
    }

    // TODOS OS DEDOS SAÍRAM
    if (pointersRef.current.size === 0) {
      dragStartRef.current = null;
      setDragging(false);
      return;
    }

    // SOBROU UM DEDO DEPOIS DA PINÇA:
    // começa um novo arraste a partir dali
    if (pointersRef.current.size === 1) {
      const remainingPointer =
        Array.from(pointersRef.current.values())[0];

      dragStartRef.current = {
        x: remainingPointer.x,
        y: remainingPointer.y,
        positionX: position.x,
        positionY: position.y,
      };

      setDragging(true);
    }
  }

  function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();

      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function generatePhoto() {
    if (!photo) {
      alert("Escolha uma foto primeiro.");
      return;
    }

    const canvas = canvasRef.current;
    const preview = previewRef.current;

    if (!canvas || !preview) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    try {
      const userPhoto = await loadImage(photo);
      const frame = await loadImage("/moldura-1.png");

      const SIZE = 1000;

      canvas.width = SIZE;
      canvas.height = SIZE;

      ctx.clearRect(0, 0, SIZE, SIZE);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, SIZE, SIZE);

      const baseScale = Math.min(
        SIZE / userPhoto.width,
        SIZE / userPhoto.height
      );

      const finalScale = baseScale * zoom;

      const drawWidth = userPhoto.width * finalScale;
      const drawHeight = userPhoto.height * finalScale;

      const previewSize = preview.clientWidth;
      const multiplier = SIZE / previewSize;

      const drawX =
        (SIZE - drawWidth) / 2 +
        position.x * multiplier;

      const drawY =
        (SIZE - drawHeight) / 2 +
        position.y * multiplier;

      ctx.save();

      ctx.beginPath();
      ctx.rect(0, 0, SIZE, SIZE);
      ctx.clip();

      ctx.drawImage(
        userPhoto,
        drawX,
        drawY,
        drawWidth,
        drawHeight
      );

      ctx.restore();

      ctx.drawImage(
        frame,
        0,
        0,
        SIZE,
        SIZE
      );

      const finalImage = canvas.toDataURL("image/png", 1);

      setResult(finalImage);
    } catch (error) {
      console.error(error);

      alert(
        "Não foi possível gerar a imagem. Verifique se moldura-1.png está dentro da pasta public."
      );
    }
  }

  function downloadPhoto() {
    if (!result) return;

    const ua = navigator.userAgent;

    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" &&
        navigator.maxTouchPoints > 1);

    const isAndroid = /Android/i.test(ua);

    // iPhone / iPad:
    // mantém o fluxo que já estava funcionando.
    if (isIOS) {
      const newWindow = window.open("", "_blank");

      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html lang="pt-BR">
            <head>
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
              />
              <title>Salvar sua foto</title>

              <style>
                * {
                  box-sizing: border-box;
                }

                body {
                  margin: 0;
                  background: #001F46;
                  color: white;
                  font-family: Arial, sans-serif;
                  text-align: center;
                  padding: 20px;
                }

                .container {
                  max-width: 700px;
                  margin: 0 auto;
                }

                h2 {
                  margin-top: 10px;
                }

                p {
                  line-height: 1.6;
                  opacity: 0.9;
                }

                img {
                  display: block;
                  width: 100%;
                  height: auto;
                  margin: 20px auto;
                  border-radius: 16px;
                  background: white;
                }

                .aviso {
                  margin-top: 16px;
                  padding: 14px;
                  border-radius: 12px;
                  background: rgba(255,255,255,0.1);
                  font-size: 14px;
                }
              </style>
            </head>

            <body>
              <div class="container">
                <h2>✅ Sua foto está pronta!</h2>

                <p>
                  Toque e segure a imagem abaixo e escolha
                  <strong>Salvar em Fotos</strong>.
                </p>

                <img
                  src="${result}"
                  alt="Foto personalizada"
                />

                <div class="aviso">
                  Se o site estiver aberto dentro do WhatsApp ou Instagram,
                  use a opção de abrir no Safari para salvar a imagem.
                </div>
              </div>
            </body>
          </html>
        `);

        newWindow.document.close();
      } else {
        window.open(result, "_blank");
      }

      return;
    }

    // Android:
    // alguns navegadores móveis ignoram o atributo download em imagens
    // geradas pelo canvas. Abrimos a imagem para permitir "Baixar imagem".
    if (isAndroid) {
      const newWindow = window.open("", "_blank");

      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html lang="pt-BR">
            <head>
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
              />
              <title>Baixar sua foto</title>

              <style>
                * {
                  box-sizing: border-box;
                }

                body {
                  margin: 0;
                  background: #001F46;
                  color: white;
                  font-family: Arial, sans-serif;
                  text-align: center;
                  padding: 20px;
                }

                .container {
                  max-width: 700px;
                  margin: 0 auto;
                }

                h2 {
                  margin-top: 10px;
                }

                p {
                  line-height: 1.6;
                  opacity: 0.9;
                }

                img {
                  display: block;
                  width: 100%;
                  height: auto;
                  margin: 20px auto;
                  border-radius: 16px;
                  background: white;
                }

                .aviso {
                  margin-top: 16px;
                  padding: 14px;
                  border-radius: 12px;
                  background: rgba(255,255,255,0.1);
                  font-size: 14px;
                }
              </style>
            </head>

            <body>
              <div class="container">
                <h2>✅ Sua foto está pronta!</h2>

                <p>
                  Toque e segure a imagem abaixo e escolha
                  <strong>Baixar imagem</strong> ou
                  <strong>Salvar imagem</strong>.
                </p>

                <img
                  src="${result}"
                  alt="Foto personalizada"
                />

                <div class="aviso">
                  Se estiver usando o navegador do WhatsApp ou Instagram,
                  abra a página no Chrome para salvar a imagem.
                </div>
              </div>
            </body>
          </html>
        `);

        newWindow.document.close();
      } else {
        window.open(result, "_blank");
      }

      return;
    }

    // Computador / navegadores desktop
    const link = document.createElement("a");
    link.href = result;
    link.download = "foto-andre-salineiro-22067.png";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function resetPhoto() {
  setPhoto(null);
  setResult(null);
  setZoom(1);
  setPosition({ x: 0, y: 0 });
  
}

  function resetPosition() {
  setZoom(1);
  setPosition({ x: 0, y: 0 });
  setResult(null);
}
  return (
    <main
      className="min-h-screen px-3 py-5 text-white sm:px-6 sm:py-8"
      style={{
        background:
          "linear-gradient(135deg, #001F46 0%, #003B73 50%, #002B55 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl">

        {/* CABEÇALHO */}

        <header className="mb-6 text-center sm:mb-10">

  <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur sm:mb-5 sm:px-5 sm:text-sm">
    🇧🇷
    <span>Juntos por Mato Grosso do Sul</span>
  </div>

  <h1 className="text-3xl font-black uppercase leading-tight sm:text-6xl">
    André{" "}
    <span className="text-[#00A651]">
      Salineiro
    </span>
  </h1>

  <p className="mt-1 text-sm font-bold uppercase tracking-[0.18em] text-white/90 sm:mt-2 sm:text-lg sm:tracking-[0.25em]">
    Deputado Estadual
  </p>

  <div className="mt-2 text-5xl font-black leading-none text-[#FFCC00] sm:mt-3 sm:text-8xl">
    22067
  </div>

  <p className="mx-auto mt-4 max-w-2xl px-2 text-sm leading-6 text-white/80 sm:mt-6 sm:text-lg sm:leading-7">
    Escolha sua foto, ajuste o enquadramento
    e crie sua imagem personalizada.
  </p>

</header>

        {/* FAIXA */}

        <div className="relative mb-10 h-5 overflow-hidden rounded-full bg-[#FFCC00]">
          <div className="absolute bottom-0 left-0 h-2/3 w-full bg-[#00843D]" />
        </div>

        {/* GERADOR */}

        <div className="grid gap-8 lg:grid-cols-2">

          {/* EDITOR */}

          <section className="rounded-2xl border border-white/10 bg-white p-4 text-slate-950 shadow-2xl sm:rounded-[28px] sm:p-7">

            <p className="text-sm font-black uppercase tracking-widest text-[#003B73]">
              Foto personalizada
            </p>

            <h2 className="mt-2 text-2xl font-black text-[#001F46]">
              Monte sua foto
            </h2>

            <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4">

              <p className="font-bold text-[#006B35]">
                ✓ Dica para um melhor resultado
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Escolha uma foto nítida e bem iluminada.
                Você poderá ajustar posição e zoom antes de gerar.
              </p>

            </div>

            {!photo ? (
              <label
                htmlFor="photo"
                className="mt-6 flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#00843D] bg-[#F4FBF6] p-6 text-center transition hover:bg-green-50"
              >

                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#00843D] text-4xl text-white">
                  📷
                </div>

                <p className="mt-5 text-xl font-black text-[#001F46]">
                  Escolher foto
                </p>

                <p className="mt-2 max-w-xs text-sm text-slate-500">
                  Pode ser vertical, horizontal ou quadrada.
                </p>

                <span className="mt-6 rounded-xl bg-[#003B73] px-6 py-3 font-bold text-white">
                  SELECIONAR FOTO
                </span>

                <input
                  id="photo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />

              </label>
            ) : (
              <>

                {/* EDITOR POWERCLIP */}

                <p className="mt-6 text-sm font-medium text-slate-500">
                  Arraste para posicionar. Use dois dedos para aumentar ou diminuir o zoom.
                </p>

                <div
                  ref={previewRef}
                  className={`relative mt-4 aspect-square w-full overflow-hidden rounded-2xl bg-white touch-none ${
                    dragging
                      ? "cursor-grabbing"
                      : "cursor-grab"
                  }`}
                  style={{
                    boxShadow:
                      "inset 0 0 0 2px rgba(0,132,61,0.25)",
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >

                  {/* FOTO */}

                  <img
                    src={photo}
                    alt="Foto selecionada"
                    draggable={false}
                    className="pointer-events-none absolute left-1/2 top-1/2 max-h-full max-w-full select-none object-contain"
                    style={{
                      transform: `
                        translate(
                          calc(-50% + ${position.x}px),
                          calc(-50% + ${position.y}px)
                        )
                        scale(${zoom})
                      `,
                      transformOrigin: "center center",
                    }}
                  />

                  {/* MOLDURA SELECIONADA */}

                  <img
                    src="/moldura-1.png"
                    alt="Moldura da campanha"
                    draggable={false}
                    className="pointer-events-none absolute inset-0 z-20 h-full w-full select-none object-fill"
                  />

                </div>

                {/* ZOOM */}

                <div className="mt-6">

                  <div className="flex items-center justify-between">

                    <span className="font-bold text-[#001F46]">
                      Ajustar zoom
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-500">
                      {Math.round(zoom * 100)}%
                    </span>

                  </div>

                  <div className="mt-4 flex items-center gap-4">

                    <button
                      type="button"
                      onClick={() =>
                        setZoom((value) =>
                          Math.max(0.2, value - 0.1)
                        )
                      }
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-[#003B73] transition hover:bg-slate-200"
                    >
                      −
                    </button>

                    <input
                      type="range"
                      min="0.2"
                      max="5"
                      step="0.01"
                      value={zoom}
                      onChange={(event) =>
                        setZoom(Number(event.target.value))
                      }
                      className="w-full accent-[#00843D]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setZoom((value) =>
                          Math.min(5, value + 0.1)
                        )
                      }
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-[#003B73] transition hover:bg-slate-200"
                    >
                      +
                    </button>

                  </div>

                </div>

                {/* CONTROLES */}

                <div className="mt-5 grid grid-cols-2 gap-3">

                  <label
                    htmlFor="change-photo"
                    className="cursor-pointer rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-bold text-[#003B73] transition hover:bg-slate-200"
                  >
                    Trocar foto

                    <input
                      id="change-photo"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />

                  </label>

                  <button
                    type="button"
                    onClick={resetPosition}
                    className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-[#003B73] transition hover:bg-slate-200"
                  >
                    Centralizar
                  </button>

                </div>

                {/* GERAR */}

                <button
                  type="button"
                  onClick={generatePhoto}
                  className="mt-5 w-full rounded-xl bg-[#00843D] px-6 py-4 text-lg font-black text-white shadow-lg transition hover:bg-[#006B35] active:scale-[0.99]"
                >
                  ✨ GERAR MINHA FOTO
                </button>

              </>
            )}

            <p className="mt-4 text-center text-xs text-slate-400">
              Sua imagem é processada diretamente no navegador.
            </p>

          </section>

          {/* RESULTADO */}

          <section className="rounded-2xl border border-white/10 bg-white p-4 text-slate-950 shadow-2xl sm:rounded-[28px] sm:p-7">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-sm font-black uppercase tracking-widest text-[#00843D]">
                  Resultado
                </p>

                <h2 className="mt-2 text-2xl font-black text-[#001F46]">
                  Sua foto ficará assim
                </h2>

              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                1000 × 1000
              </span>

            </div>

            <div
              className="mt-6 flex aspect-square items-center justify-center overflow-hidden rounded-2xl"
              style={{
                background:
                  "linear-gradient(135deg, #001F46, #003B73)",
              }}
            >

              {result ? (
                <img
                  src={result}
                  alt="Resultado final"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="px-8 text-center text-white/70">

                  <div className="text-6xl">
                    🇧🇷
                  </div>

                  <p className="mt-5 text-lg font-bold">
                    Sua foto personalizada aparecerá aqui.
                  </p>

                  <p className="mt-2 text-sm text-white/60">
                    Escolha uma foto, faça o enquadramento
                    e clique em gerar.
                  </p>

                </div>
              )}

            </div>

            {result && (
              <>

                <button
                  type="button"
                  onClick={downloadPhoto}
                  className="mt-5 w-full rounded-xl bg-[#003B73] px-6 py-4 text-lg font-black text-white shadow-lg transition hover:bg-[#001F46]"
                >
                  ↓ BAIXAR FOTO
                </button>

                <button
                  type="button"
                  onClick={resetPhoto}
                  className="mt-3 w-full rounded-xl border-2 border-[#00843D] bg-white px-6 py-3 font-bold text-[#00843D] transition hover:bg-green-50"
                >
                  FAZER OUTRA FOTO
                </button>

              </>
            )}

          </section>

        </div>

        <footer className="mt-10 text-center">

  <div className="mx-auto mb-6 h-1.5 max-w-md rounded-full bg-[#FFCC00]">
    <div className="h-full w-2/3 rounded-full bg-[#00843D]" />
  </div>

  <p className="text-lg font-black uppercase">
    André Salineiro
  </p>

  <p className="mt-1 text-sm font-bold uppercase tracking-[0.2em] text-white/70">
    Deputado Estadual • 22067
  </p>

  {/* INFORMAÇÕES LEGAIS DA CAMPANHA */}
  <div className="mx-auto mt-6 max-w-5xl border-t border-white/15 px-4 pt-5">

    <p className="text-[11px] font-bold uppercase leading-5 tracking-[0.06em] text-white/90 sm:text-xs md:text-sm">
      PROPAGANDA ELEITORAL | ANDRÉ SALINEIRO | CNPJ 68.345.672/0001-72
    </p>

    <p className="mx-auto mt-2 max-w-4xl text-[9px] font-medium leading-4 text-white/60 sm:text-[10px] md:text-[11px]">
      Coligação Fazendo o Futuro Acontecer (Federação União Progressista – União Brasil e PP, PL, PSD, Republicanos, Federação PSDB-Cidadania, MDB, Avante, Podemos)
    </p>

  </div>

</footer>

        <canvas
          ref={canvasRef}
          className="hidden"
        />

      </div>
    </main>
  );
}