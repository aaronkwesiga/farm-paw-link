import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getUserFriendlyError } from '@/lib/errorHandling';
import { logger } from '@/lib/logger';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface UploadOptions {
  bucket: string;
  folder: string;
  maxFiles?: number;
}

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);

  const validateMagicBytes = async (file: File): Promise<boolean> => {
    const buffer = await file.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // JPEG: FF D8 FF, PNG: 89 50 4E 47, WebP: 52 49 46 46
    const isJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    const isWebP = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
    
    return isJPEG || isPNG || isWebP;
  };

  const validateFile = async (file: File): Promise<boolean> => {
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: `${file.name} exceeds 5MB limit`,
        variant: 'destructive',
      });
      return false;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: `${file.name} must be JPEG, PNG, or WebP`,
        variant: 'destructive',
      });
      return false;
    }

    // Validate magic bytes to prevent file type spoofing
    const isValidMagicBytes = await validateMagicBytes(file);
    if (!isValidMagicBytes) {
      toast({
        title: 'Invalid file content',
        description: `${file.name} is not a valid image file`,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const uploadFiles = async (
    files: FileList | File[],
    options: UploadOptions
  ): Promise<string[]> => {
    const fileArray = Array.from(files);
    
    if (options.maxFiles && fileArray.length > options.maxFiles) {
      toast({
        title: 'Too many files',
        description: `Maximum ${options.maxFiles} files allowed`,
        variant: 'destructive',
      });
      return [];
    }

    // Validate all files first (async validation for magic bytes)
    const validationResults = await Promise.all(
      fileArray.map(file => validateFile(file))
    );
    const validFiles = fileArray.filter((_, index) => validationResults[index]);
    if (validFiles.length === 0) return [];

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of validFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${options.folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(options.bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          logger.error('Upload error:', uploadError);
          toast({
            title: 'Upload failed',
            description: `Failed to upload ${file.name}`,
            variant: 'destructive',
          });
          continue;
        }

        // Get signed URL (valid for 1 hour)
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from(options.bucket)
          .createSignedUrl(filePath, 3600);

        if (urlError || !signedUrlData) {
          logger.error('URL error:', urlError);
          continue;
        }

        uploadedUrls.push(signedUrlData.signedUrl);
      }

      if (uploadedUrls.length > 0) {
        toast({
          title: 'Upload successful',
          description: `${uploadedUrls.length} file(s) uploaded`,
        });
      }

      return uploadedUrls;
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: getUserFriendlyError(error, "file_upload"),
        variant: "destructive",
      });
      return [];
    } finally {
      setUploading(false);
    }
  };

  return { uploadFiles, uploading };
};
