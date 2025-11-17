-- Make storage buckets private for enhanced security
UPDATE storage.buckets 
SET public = false 
WHERE name IN ('animal-images', 'consultation-images');

-- Drop existing policies (only those that currently exist)
DROP POLICY "Anyone can view animal images" ON storage.objects;
DROP POLICY "Users can delete their own animal images" ON storage.objects;
DROP POLICY "Users can update their own animal images" ON storage.objects;
DROP POLICY "Users can upload consultation images" ON storage.objects;
DROP POLICY "Users can upload their own animal images" ON storage.objects;
DROP POLICY "Users can view consultation images in their consultations" ON storage.objects;

-- ===== ANIMAL IMAGES POLICIES =====

-- Allow owners to view their own animal images
CREATE POLICY "Owners can view their own animal images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'animal-images'
  AND (storage.foldername(name))[1]::uuid = auth.uid()
);

-- Allow vets to view animal images for consultations they're assigned to
CREATE POLICY "Vets can view animal images for assigned consultations"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'animal-images'
  AND EXISTS (
    SELECT 1 
    FROM consultations c
    JOIN animals a ON c.animal_id = a.id
    WHERE a.owner_id = (storage.foldername(name))[1]::uuid
    AND c.vet_id = auth.uid()
  )
);

-- Allow users to upload their own animal images
CREATE POLICY "Users can upload their own animal images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'animal-images'
  AND (storage.foldername(name))[1]::uuid = auth.uid()
);

-- Allow users to update their own animal images
CREATE POLICY "Users can update their own animal images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'animal-images'
  AND (storage.foldername(name))[1]::uuid = auth.uid()
);

-- Allow users to delete their own animal images
CREATE POLICY "Users can delete their own animal images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'animal-images'
  AND (storage.foldername(name))[1]::uuid = auth.uid()
);

-- ===== CONSULTATION IMAGES POLICIES =====

-- Allow farmers to view images from their consultations
CREATE POLICY "Farmers can view their consultation images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'consultation-images'
  AND EXISTS (
    SELECT 1 
    FROM consultations c
    WHERE c.farmer_id = auth.uid()
    AND (
      -- Match by consultation ID in path or URL in array
      (storage.foldername(name))[1]::uuid = c.id
      OR name LIKE ANY(
        SELECT '%' || unnest(c.image_urls) || '%'
      )
    )
  )
);

-- Allow vets to view images from consultations they're assigned to
CREATE POLICY "Vets can view assigned consultation images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'consultation-images'
  AND EXISTS (
    SELECT 1 
    FROM consultations c
    WHERE c.vet_id = auth.uid()
    AND (
      (storage.foldername(name))[1]::uuid = c.id
      OR name LIKE ANY(
        SELECT '%' || unnest(c.image_urls) || '%'
      )
    )
  )
);

-- Allow farmers to upload consultation images for their consultations
CREATE POLICY "Farmers can upload consultation images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'consultation-images'
  AND EXISTS (
    SELECT 1 
    FROM consultations c
    WHERE c.farmer_id = auth.uid()
    AND (storage.foldername(name))[1]::uuid = c.id
  )
);

-- Allow consultation owners to delete images
CREATE POLICY "Farmers can delete their consultation images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'consultation-images'
  AND EXISTS (
    SELECT 1 
    FROM consultations c
    WHERE c.farmer_id = auth.uid()
    AND (storage.foldername(name))[1]::uuid = c.id
  )
);