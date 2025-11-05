import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface UploadOptions {
  bucket: string;
  folder: string;
  maxFiles?: number;
}

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);

  const validateFile = (file: File): boolean => {
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

    // Validate all files first
    const validFiles = fileArray.filter(validateFile);
    if (validFiles.length === 0) return [];

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of validFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${options.folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(options.bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
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
          console.error('URL error:', urlError);
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
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      return [];
    } finally {
      setUploading(false);
    }
  };

  return { uploadFiles, uploading };
};
