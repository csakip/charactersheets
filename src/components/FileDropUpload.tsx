import React, { useRef, useState } from "react";
import { supabase } from "../supabase";
import { Button } from "primereact/button";

interface FileDropUploadProps {
  charsheet_id: number;
  bucket: string;
  imageUrl?: string;
  editable?: boolean;
  onUploadSuccess?: (path: string, url: string) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  className?: string;
}

export const FileDropUpload: React.FC<FileDropUploadProps> = ({
  bucket,
  imageUrl,
  editable = true,
  onUploadSuccess,
  onUploadError,
  accept = "image/*",
  className = "",
  charsheet_id,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleClearImage = (e: React.MouseEvent) => {
    // delete from Supabase Storage
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Biztosan törölni szeretnéd a képet?")) {
      const fileName = `${charsheet_id}.profile`;
      const filePath = `public/${fileName}`;
      supabase.storage.from(bucket).remove([filePath]);

      onUploadSuccess?.("", "");
    }
  };

  const uploadFile = async (file: File) => {
    const resizedFile = await resizeImage(file, 300);

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileName = `${charsheet_id}.profile`;
      const filePath = `public/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage.from(bucket).upload(filePath, resizedFile, {
        cacheControl: "84600",
        upsert: true,
      });

      if (error) {
        throw error;
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      const urlWithCachebust = urlData.publicUrl + "?t=" + Date.now();
      imageRef.current?.setAttribute("src", urlWithCachebust);

      onUploadSuccess?.(data.path, urlWithCachebust);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      onUploadError?.(error.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const resizeImage = (file: File, maxWidth: number = 300): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        const { width, height } = img;

        // Only resize if width is greater than maxWidth
        if (width <= maxWidth) {
          resolve(file);
          return;
        }

        // Calculate new dimensions maintaining aspect ratio
        const ratio = height / width;
        const newWidth = maxWidth;
        const newHeight = newWidth * ratio;

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and resize image
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          0.925
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleClick = () => {
    if (editable) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      className={`relative border-round text-center justify-content-center align-items-center flex
        ${imageUrl ? "border-transparent p-0" : " hover:border-gray-400 p-2"}
        ${isDragOver ? "border-yellow-600 bg-yellow-900" : "border-gray-300"}
        ${isUploading ? "pointer-events-none opacity-75" : ""}
        ${editable ? "cursor-pointer border-2 border-dashed" : "cursor-default border-1 border-50"}
        ${className}
      `}
      style={{ minHeight: "182px" }}
      onDragOver={editable ? handleDragOver : undefined}
      onDragLeave={editable ? handleDragLeave : undefined}
      onDrop={editable ? handleDrop : undefined}
      onClick={handleClick}>
      <input
        ref={fileInputRef}
        type='file'
        accept={accept}
        onChange={handleFileSelect}
        className='hidden'
      />

      {/* Clear button - only shown when editable and imageUrl exists */}
      {editable && imageUrl && !isUploading && (
        <Button
          onClick={handleClearImage}
          text
          severity='danger'
          className='absolute top-0 right-0 z-5 p-2'
          title='Kép törlése'>
          <i className='pi pi-times font-bold' />
        </Button>
      )}

      {isUploading ? (
        <div>
          <p className='text-sm text-gray-600'>Feltöltés...</p>
        </div>
      ) : (
        <div>
          {imageUrl ? (
            <div className='relative'>
              <img
                ref={imageRef}
                src={imageUrl}
                alt='Profilkép'
                className='w-full h-auto bg-contain border-round block'
              />
            </div>
          ) : (
            editable && (
              <div>
                <p className='text-lg font-medium text-gray-900 m-0'>
                  Húzz ide egy képet,
                  <br />
                  vagy kattints!
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
