-- Add database-level CHECK constraints for data integrity

-- 1. Consultations table constraints
ALTER TABLE public.consultations 
  ADD CONSTRAINT chk_subject_length CHECK (char_length(subject) >= 3 AND char_length(subject) <= 255),
  ADD CONSTRAINT chk_description_length CHECK (char_length(description) >= 10 AND char_length(description) <= 5000),
  ADD CONSTRAINT chk_symptoms_length CHECK (symptoms IS NULL OR char_length(symptoms) <= 5000),
  ADD CONSTRAINT chk_urgency_level CHECK (urgency_level IN ('low', 'medium', 'high', 'emergency'));

-- 2. Animals table constraints
ALTER TABLE public.animals
  ADD CONSTRAINT chk_name_length CHECK (name IS NULL OR char_length(name) <= 100),
  ADD CONSTRAINT chk_breed_length CHECK (breed IS NULL OR char_length(breed) <= 100),
  ADD CONSTRAINT chk_age_years_range CHECK (age_years IS NULL OR (age_years >= 0 AND age_years <= 100)),
  ADD CONSTRAINT chk_age_months_range CHECK (age_months IS NULL OR (age_months >= 0 AND age_months <= 11)),
  ADD CONSTRAINT chk_weight_range CHECK (weight_kg IS NULL OR (weight_kg > 0 AND weight_kg <= 50000)),
  ADD CONSTRAINT chk_medical_history_length CHECK (medical_history IS NULL OR char_length(medical_history) <= 10000);

-- 3. Profiles table constraints  
ALTER TABLE public.profiles
  ADD CONSTRAINT chk_full_name_length CHECK (char_length(full_name) >= 1 AND char_length(full_name) <= 100),
  ADD CONSTRAINT chk_phone_length CHECK (phone_number IS NULL OR char_length(phone_number) <= 30),
  ADD CONSTRAINT chk_bio_length CHECK (bio IS NULL OR char_length(bio) <= 2000),
  ADD CONSTRAINT chk_location_length CHECK (location IS NULL OR char_length(location) <= 255),
  ADD CONSTRAINT chk_specialization_length CHECK (specialization IS NULL OR char_length(specialization) <= 255);

-- 4. Vet portfolios table constraints
ALTER TABLE public.vet_portfolios
  ADD CONSTRAINT chk_portfolio_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  ADD CONSTRAINT chk_portfolio_description_length CHECK (description IS NULL OR char_length(description) <= 2000),
  ADD CONSTRAINT chk_portfolio_category_length CHECK (category IS NULL OR char_length(category) <= 100);

-- 5. Consultation messages constraints
ALTER TABLE public.consultation_messages
  ADD CONSTRAINT chk_message_length CHECK (char_length(message) >= 1 AND char_length(message) <= 5000);