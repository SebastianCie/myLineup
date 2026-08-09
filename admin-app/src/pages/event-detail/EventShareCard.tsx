import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { eventPublicUrl } from "../../api";

interface Props {
  publicToken: string;
}

export default function EventShareCard({ publicToken }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const url = eventPublicUrl(publicToken);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 150, margin: 1 });
    }
  }, [url]);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadQr() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `event-${publicToken}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="panel-form">
      <h3>Direktlink &amp; QR-Code</h3>
      <p className="muted">
        Funktioniert unabhängig davon, ob das Event auf der Landkarte sichtbar ist — ideal zum
        Ausdrucken/Teilen.
      </p>
      <div className="event-share">
        <canvas ref={canvasRef} />
        <div className="event-share-actions">
          <code className="event-share-url">{url}</code>
          <div className="form-actions">
            <button type="button" onClick={copyLink}>
              {copied ? "Kopiert!" : "Link kopieren"}
            </button>
            <button type="button" onClick={downloadQr}>
              QR herunterladen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
