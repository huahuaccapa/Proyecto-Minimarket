'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCircle2,
  Flashlight,
  FlashlightOff,
  ImageIcon,
  RefreshCw,
  ScanBarcode,
  ShoppingCart,
  X,
} from 'lucide-react';

import {
  formatMoney,
} from '../data/mock';

const SAME_CODE_DELAY =
  1100;

function vibrate() {
  try {
    navigator.vibrate?.(
      70,
    );
  } catch {
    //
  }
}

function beep() {
  try {
    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (
      !AudioContext
    ) {
      return;
    }

    const context =
      new AudioContext();

    const oscillator =
      context.createOscillator();

    const gain =
      context.createGain();

    oscillator.type =
      'sine';

    oscillator.frequency.value =
      900;

    gain.gain.value =
      0.08;

    oscillator.connect(
      gain,
    );

    gain.connect(
      context.destination,
    );

    oscillator.start();

    oscillator.stop(
      context.currentTime +
        0.08,
    );

    oscillator.onended =
      () =>
        context
          .close()
          .catch(
            () => {},
          );
  } catch {
    //
  }
}

export default function BarcodeScanner({
  onBarcode,
  onClose,
  total = 0,
  cartCount = 0,
}) {
  const videoRef =
    useRef(
      null,
    );

  const controlsRef =
    useRef(
      null,
    );

  const readerRef =
    useRef(
      null,
    );

  const lastScanRef =
    useRef({
      code:
        '',

      time:
        0,
    });

  const onBarcodeRef =
    useRef(
      onBarcode,
    );

  const [
    facingMode,
    setFacingMode,
  ] =
    useState(
      'environment',
    );

  const [
    cameraRunning,
    setCameraRunning,
  ] =
    useState(
      false,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    error,
    setError,
  ] =
    useState(
      '',
    );

  const [
    lastResult,
    setLastResult,
  ] =
    useState(
      null,
    );

  const [
    scannedCount,
    setScannedCount,
  ] =
    useState(
      0,
    );

  const [
    torchAvailable,
    setTorchAvailable,
  ] =
    useState(
      false,
    );

  const [
    torchOn,
    setTorchOn,
  ] =
    useState(
      false,
    );

  useEffect(
    () => {
      onBarcodeRef.current =
        onBarcode;
    },

    [
      onBarcode,
    ],
  );

  const stopCamera =
    useCallback(
      () => {
        try {
          controlsRef
            .current
            ?.stop?.();
        } catch {
          //
        }

        controlsRef.current =
          null;

        const stream =
          videoRef
            .current
            ?.srcObject;

        if (
          stream
        ) {
          stream
            .getTracks()
            .forEach(
              (
                track,
              ) =>
                track.stop(),
            );
        }

        if (
          videoRef.current
        ) {
          videoRef.current.srcObject =
            null;
        }

        setCameraRunning(
          false,
        );

        setTorchOn(
          false,
        );

        setTorchAvailable(
          false,
        );
      },

      [],
    );

  const processCode =
    useCallback(
      (
        rawCode,
      ) => {
        const code =
          String(
            rawCode ||
              '',
          ).trim();

        if (
          !code
        ) {
          return;
        }

        const now =
          Date.now();

        const sameCode =
          lastScanRef
            .current
            .code ===
          code;

        const tooFast =
          now -
            lastScanRef
              .current
              .time <
          SAME_CODE_DELAY;

        /*
         * Evita que una sola
         * exposición del código
         * sume 10 productos.
         */
        if (
          sameCode &&
          tooFast
        ) {
          return;
        }

        lastScanRef.current = {
          code,
          time:
            now,
        };

        const response =
          onBarcodeRef
            .current?.(
              code,
            );

        const result =
          response &&
          typeof response ===
            'object'
            ? response
            : {
                ok:
                  response !==
                  false,

                message:
                  response ===
                  false
                    ? 'No se pudo agregar el producto.'
                    : `Código ${code} leído.`,
              };

        if (
          result.ok
        ) {
          beep();

          vibrate();

          setScannedCount(
            (
              value,
            ) =>
              value +
              1,
          );
        }

        setLastResult({
          ok:
            Boolean(
              result.ok,
            ),

          code,

          message:
            result.message ||
            (
              result.ok
                ? 'Producto agregado.'
                : 'No se pudo agregar.'
            ),

          time:
            Date.now(),
        });
      },

      [],
    );

  useEffect(
    () => {
      let cancelled =
        false;

      const start =
        async () => {
          stopCamera();

          setLoading(
            true,
          );

          setError(
            '',
          );

          /*
           * La cámara mediante
           * getUserMedia necesita
           * contexto seguro.
           */
          if (
            typeof window !==
              'undefined' &&
            !window
              .isSecureContext
          ) {
            setError(
              'El navegador bloqueó la cámara porque la página no usa HTTPS. Puedes usar la opción “Tomar foto” o abrir el sistema mediante HTTPS.',
            );

            setLoading(
              false,
            );

            return;
          }

          if (
            !navigator
              .mediaDevices
              ?.getUserMedia
          ) {
            setError(
              'Este navegador no permite acceso directo a la cámara.',
            );

            setLoading(
              false,
            );

            return;
          }

          try {
            const {
              BrowserMultiFormatReader,
            } =
              await import(
                '@zxing/browser'
              );

            if (
              cancelled
            ) {
              return;
            }

            const reader =
              new BrowserMultiFormatReader(
                undefined,

                {
                  delayBetweenScanAttempts:
                    80,

                  delayBetweenScanSuccess:
                    250,
                },
              );

            readerRef.current =
              reader;

            const controls =
              await reader.decodeFromConstraints(
                {
                  audio:
                    false,

                  video: {
                    facingMode: {
                      ideal:
                        facingMode,
                    },

                    width: {
                      ideal:
                        1280,
                    },

                    height: {
                      ideal:
                        720,
                    },
                  },
                },

                videoRef.current,

                (
                  result,
                ) => {
                  if (
                    result
                  ) {
                    processCode(
                      result.getText(),
                    );
                  }
                },
              );

            if (
              cancelled
            ) {
              controls.stop();

              return;
            }

            controlsRef.current =
              controls;

            setCameraRunning(
              true,
            );

            setLoading(
              false,
            );

            /*
             * Detectar flash.
             */
            window.setTimeout(
              () => {
                try {
                  const stream =
                    videoRef
                      .current
                      ?.srcObject;

                  const track =
                    stream
                      ?.getVideoTracks?.()[
                      0
                    ];

                  const capabilities =
                    track
                      ?.getCapabilities?.();

                  setTorchAvailable(
                    Boolean(
                      capabilities
                        ?.torch,
                    ),
                  );
                } catch {
                  setTorchAvailable(
                    false,
                  );
                }
              },

              300,
            );
          } catch (
            cameraError
          ) {
            if (
              cancelled
            ) {
              return;
            }

            console.error(
              cameraError,
            );

            let message =
              'No se pudo abrir la cámara.';

            if (
              cameraError
                ?.name ===
              'NotAllowedError'
            ) {
              message =
                'No se concedió permiso para utilizar la cámara.';
            } else if (
              cameraError
                ?.name ===
              'NotFoundError'
            ) {
              message =
                'No se encontró una cámara disponible.';
            } else if (
              cameraError
                ?.name ===
              'NotReadableError'
            ) {
              message =
                'La cámara está siendo utilizada por otra aplicación.';
            }

            setError(
              message,
            );

            setLoading(
              false,
            );
          }
        };

      start();

      return () => {
        cancelled =
          true;

        stopCamera();
      };
    },

    [
      facingMode,
      processCode,
      stopCamera,
    ],
  );

  const toggleTorch =
    async () => {
      try {
        const stream =
          videoRef
            .current
            ?.srcObject;

        const track =
          stream
            ?.getVideoTracks?.()[
            0
          ];

        if (
          !track
        ) {
          return;
        }

        const next =
          !torchOn;

        await track.applyConstraints({
          advanced: [
            {
              torch:
                next,
            },
          ],
        });

        setTorchOn(
          next,
        );
      } catch {
        setTorchAvailable(
          false,
        );
      }
    };

  const switchCamera =
    () => {
      setFacingMode(
        (
          current,
        ) =>
          current ===
          'environment'
            ? 'user'
            : 'environment',
      );
    };

  const scanImage =
    async (
      event,
    ) => {
      const file =
        event.target
          .files?.[
          0
        ];

      event.target.value =
        '';

      if (
        !file
      ) {
        return;
      }

      setError(
        '',
      );

      setLastResult({
        ok:
          true,

        message:
          'Analizando imagen…',
      });

      let url =
        '';

      try {
        const {
          BrowserMultiFormatReader,
        } =
          await import(
            '@zxing/browser'
          );

        const reader =
          new BrowserMultiFormatReader();

        url =
          URL.createObjectURL(
            file,
          );

        const result =
          await reader.decodeFromImageUrl(
            url,
          );

        processCode(
          result.getText(),
        );
      } catch {
        setLastResult({
          ok:
            false,

          message:
            'No se encontró un código de barras legible en la imagen.',
        });
      } finally {
        if (
          url
        ) {
          URL.revokeObjectURL(
            url,
          );
        }
      }
    };

  return (
    <div className="fixed inset-0 z-[120] bg-black">
      {/* CABECERA */}

      <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between bg-black/65 px-4 py-3 text-white backdrop-blur-md">
        <div>
          <p className="flex items-center gap-2 font-black">
            <ScanBarcode
              size={
                20
              }
            />

            Lector de
            productos
          </p>

          <p className="mt-0.5 text-xs text-white/55">
            Apunta la cámara
            al código de
            barras
          </p>
        </div>

        <button
          type="button"
          className="grid size-11 place-items-center rounded-full bg-white/10"
          onClick={() => {
            stopCamera();

            onClose();
          }}
        >
          <X
            size={
              24
            }
          />
        </button>
      </div>

      {/* VIDEO */}

      <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black">
        <video
          ref={
            videoRef
          }
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
        />

        {!cameraRunning &&
          !loading && (
            <div className="absolute inset-0 grid place-items-center bg-black px-6 text-center text-white">
              <div className="max-w-md">
                <CameraOff
                  className="mx-auto text-white/40"
                  size={
                    54
                  }
                />

                <p className="mt-4 text-lg font-black">
                  Cámara no
                  disponible
                </p>

                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {error ||
                    'No se pudo iniciar la cámara.'}
                </p>
              </div>
            </div>
          )}

        {loading && (
          <div className="absolute inset-0 grid place-items-center bg-black text-white">
            <div className="text-center">
              <RefreshCw
                className="mx-auto animate-spin"
                size={
                  34
                }
              />

              <p className="mt-3 font-bold">
                Iniciando
                cámara…
              </p>
            </div>
          </div>
        )}

        {/* MARCO */}

        {cameraRunning && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="relative h-40 w-[82%] max-w-xl">
              <span className="absolute left-0 top-0 h-10 w-10 rounded-tl-2xl border-l-4 border-t-4 border-white" />

              <span className="absolute right-0 top-0 h-10 w-10 rounded-tr-2xl border-r-4 border-t-4 border-white" />

              <span className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-2xl border-b-4 border-l-4 border-white" />

              <span className="absolute bottom-0 right-0 h-10 w-10 rounded-br-2xl border-b-4 border-r-4 border-white" />

              <div className="absolute left-3 right-3 top-1/2 h-[2px] bg-coral shadow-[0_0_18px_rgba(255,80,60,0.9)]" />
            </div>
          </div>
        )}
      </div>

      {/* RESULTADO */}

      {lastResult && (
        <div
          className={`
            absolute left-4 right-4 top-24
            z-40 mx-auto max-w-lg
            rounded-2xl p-4 shadow-2xl
            backdrop-blur-xl

            ${
              lastResult.ok
                ? 'bg-emerald-600/90 text-white'
                : 'bg-red-600/90 text-white'
            }
          `}
        >
          <div className="flex items-start gap-3">
            {lastResult.ok ? (
              <CheckCircle2
                className="mt-0.5 shrink-0"
                size={
                  21
                }
              />
            ) : (
              <AlertTriangle
                className="mt-0.5 shrink-0"
                size={
                  21
                }
              />
            )}

            <div>
              <p className="font-black">
                {
                  lastResult.message
                }
              </p>

              {lastResult.code && (
                <p className="mt-1 text-xs opacity-70">
                  Código:{' '}
                  {
                    lastResult.code
                  }
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONTROLES */}

      <div className="absolute bottom-[126px] left-0 right-0 z-30 flex justify-center gap-3 px-4">
        {torchAvailable && (
          <button
            type="button"
            onClick={
              toggleTorch
            }
            className="grid size-12 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md"
          >
            {torchOn ? (
              <FlashlightOff
                size={
                  21
                }
              />
            ) : (
              <Flashlight
                size={
                  21
                }
              />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={
            switchCamera
          }
          className="grid size-12 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md"
        >
          <RefreshCw
            size={
              21
            }
          />
        </button>

        <label className="grid size-12 cursor-pointer place-items-center rounded-full bg-black/60 text-white backdrop-blur-md">
          <ImageIcon
            size={
              21
            }
          />

          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={
              scanImage
            }
          />
        </label>
      </div>

      {/* PIE */}

      <div className="absolute bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-black/85 p-4 text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-white/45">
              Venta actual
            </p>

            <p className="mt-1 text-2xl font-black">
              {formatMoney(
                total,
              )}
            </p>

            <p className="text-xs text-white/40">
              {cartCount}{' '}
              productos ·{' '}
              {scannedCount}{' '}
              lecturas
            </p>
          </div>

          <button
            type="button"
            disabled={
              cartCount ===
              0
            }
            onClick={() => {
              stopCamera();

              onClose(
                true,
              );
            }}
            className="flex min-h-14 min-w-[150px] items-center justify-center gap-2 rounded-2xl bg-white px-5 font-black text-black disabled:opacity-40"
          >
            <ShoppingCart
              size={
                20
              }
            />

            Cobrar
          </button>
        </div>
      </div>
    </div>
  );
}