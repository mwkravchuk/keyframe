-- Align NextAuth Account model with Google OAuth payload fields.
ALTER TABLE "Account"
ADD COLUMN "refresh_token_expires_in" INTEGER;
