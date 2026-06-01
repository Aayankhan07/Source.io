
-- 1) Profiles: restrict SELECT to owner only
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Users view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2) user_roles: prevent privilege escalation
-- Drop the broad ALL policy and replace with admin-only management policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Admins insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3) Storage: add missing UPDATE policy for uploads bucket (owner-scoped)
CREATE POLICY "Users update own uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4) Podcasts bucket: make private and restrict reads to owner
UPDATE storage.buckets SET public = false WHERE id = 'podcasts';

DROP POLICY IF EXISTS "Podcasts readable by path" ON storage.objects;

CREATE POLICY "Users read own podcasts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'podcasts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5) Revoke EXECUTE on SECURITY DEFINER functions from public/anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
