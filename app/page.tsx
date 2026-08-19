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

  const [selectedFrame, setSelectedFrame] = useState("/moldura-1.png");

  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const [dragging, setDragging] = useState(false);

  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
    positionX: 0,
    positionY: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Escolha um arquivo de imagem.");
      return;
    }

    const url = URL.createObjectURL(file);

    setPhoto(url);
    setResult(null);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }

  function selectFrame(frame: string) {
    setSelectedFrame(frame);
    setResult(null);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!photo) return;

    event.currentTarget.setPointerCapture(event.pointerId);

    setDragging(true);

    setDragStart({
      x: event.clientX,
      y: event.clientY,
      positionX: position.x,
      positionY: position.y,
    });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging) return;

    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;

    setPosition({
      x: dragStart.positionX + deltaX,
      y: dragStart.positionY + deltaY,
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    setDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
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
      const frame = await loadImage(selectedFrame);

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
        "Não foi possível gerar a imagem. Verifique se moldura-1.png e moldura-2.png estão dentro da pasta public."
      );
    }
  }

  function downloadPhoto() {
    if (!result) return;

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
    setSelectedFrame("/moldura-1.png");
  }

  function resetPosition() {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setResult(null);
  }

  return (
    <main
      className="min-h-screen px-4 py-8 text-white sm:px-6"
      style={{
        background:
          "linear-gradient(135deg, #001F46 0%, #003B73 50%, #002B55 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl">

        {/* CABEÇALHO */}

        <header className="mb-10 text-center">

          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-bold backdrop-blur">
            🇧🇷
            <span>Juntos por Mato Grosso do Sul</span>
          </div>

          <h1 className="text-4xl font-black uppercase leading-tight sm:text-6xl">
            André{" "}
            <span className="text-[#00A651]">
              Salineiro
            </span>
          </h1>

          <p className="mt-2 text-lg font-bold uppercase tracking-[0.25em] text-white/90">
            Deputado Estadual
          </p>

          <div className="mt-3 text-6xl font-black leading-none text-[#FFCC00] sm:text-8xl">
            22067
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-7 text-white/80">
            Escolha sua foto, selecione a moldura que preferir
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

          <section className="rounded-[28px] border border-white/10 bg-white p-5 text-slate-950 shadow-2xl sm:p-7">

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

                {/* ESCOLHA DA MOLDURA */}

                <div className="mt-6">

                  <p className="font-black text-[#001F46]">
                    Escolha sua moldura
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Toque em uma opção para visualizar.
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-4">

                    {/* MOLDURA 1 */}

                    <button
                      type="button"
                      onClick={() => selectFrame("/moldura-1.png")}
                      className={`overflow-hidden rounded-2xl border-4 transition ${
                        selectedFrame === "/moldura-1.png"
                          ? "border-[#00843D] shadow-lg"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="relative aspect-square bg-slate-100">

                        <img
                          src="/moldura-1.png"
                          alt="Moldura 1"
                          className="absolute inset-0 h-full w-full object-contain"
                        />

                      </div>

                      <div
                        className={`py-3 text-sm font-black ${
                          selectedFrame === "/moldura-1.png"
                            ? "bg-[#00843D] text-white"
                            : "bg-slate-100 text-[#003B73]"
                        }`}
                      >
                        OPÇÃO 1
                      </div>
                    </button>

                    {/* MOLDURA 2 */}

                    <button
                      type="button"
                      onClick={() => selectFrame("/moldura-2.png")}
                      className={`overflow-hidden rounded-2xl border-4 transition ${
                        selectedFrame === "/moldura-2.png"
                          ? "border-[#00843D] shadow-lg"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="relative aspect-square bg-slate-100">

                        <img
                          src="/moldura-2.png"
                          alt="Moldura 2"
                          className="absolute inset-0 h-full w-full object-contain"
                        />

                      </div>

                      <div
                        className={`py-3 text-sm font-black ${
                          selectedFrame === "/moldura-2.png"
                            ? "bg-[#00843D] text-white"
                            : "bg-slate-100 text-[#003B73]"
                        }`}
                      >
                        OPÇÃO 2
                      </div>
                    </button>

                  </div>

                </div>

                {/* EDITOR POWERCLIP */}

                <p className="mt-6 text-sm font-medium text-slate-500">
                  Arraste sua foto para posicioná-la dentro da moldura.
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
                    src={selectedFrame}
                    alt="Moldura selecionada"
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

          <section className="rounded-[28px] border border-white/10 bg-white p-5 text-slate-950 shadow-2xl sm:p-7">

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
                    Escolha uma foto, selecione sua moldura,
                    faça o enquadramento e clique em gerar.
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