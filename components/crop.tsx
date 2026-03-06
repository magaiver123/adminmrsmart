import Cropper, { Area } from "react-easy-crop";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ImageCropper({
  image,
  onComplete,
}: {
  image: string;
  onComplete: (file: File) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  function onCropComplete(_: Area, cropped: Area) {
    setCroppedAreaPixels(cropped);
  }

  async function handleConfirm() {
    if (!croppedAreaPixels) return;

    const canvas = document.createElement("canvas");
    const img = new Image();
    img.src = image;

    await new Promise((res) => (img.onload = res));

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(
      img,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "product.webp", {
        type: "image/webp",
      });
      onComplete(file);
    }, "image/webp");
  }

  return (
    <div className="space-y-4">
      <div className="relative h-64 w-full bg-black rounded">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={handleConfirm}>
          Confirmar ajuste
        </Button>
      </div>
    </div>
  );
}
