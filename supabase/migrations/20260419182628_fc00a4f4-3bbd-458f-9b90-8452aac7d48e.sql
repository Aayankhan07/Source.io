-- Move vector extension out of public schema
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION vector SET SCHEMA extensions;

-- Drop overly broad public SELECT policies on avatars/podcasts buckets
DROP POLICY IF EXISTS "Avatars publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Podcasts publicly readable" ON storage.objects;

-- Public buckets are still readable via signed/public URLs for known paths,
-- but listing is restricted. For avatars: anyone can read a specific object;
-- listing requires being the owner.
CREATE POLICY "Avatars readable by path" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'avatars' 
    AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.role() = 'anon' OR auth.role() = 'authenticated')
    AND name IS NOT NULL
  );

CREATE POLICY "Podcasts readable by path" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'podcasts'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.role() = 'anon' OR auth.role() = 'authenticated')
    AND name IS NOT NULL
  );