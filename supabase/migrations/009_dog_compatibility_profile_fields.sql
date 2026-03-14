-- Add lightweight play/compatibility fields for dog profiles
ALTER TABLE dogs
  ADD COLUMN IF NOT EXISTS dog_friendliness SMALLINT,
  ADD COLUMN IF NOT EXISTS play_style TEXT,
  ADD COLUMN IF NOT EXISTS good_with_puppies TEXT,
  ADD COLUMN IF NOT EXISTS good_with_large_dogs TEXT,
  ADD COLUMN IF NOT EXISTS good_with_small_dogs TEXT,
  ADD COLUMN IF NOT EXISTS temperament_notes TEXT;

ALTER TABLE dogs
  DROP CONSTRAINT IF EXISTS dogs_dog_friendliness_range,
  DROP CONSTRAINT IF EXISTS dogs_play_style_valid,
  DROP CONSTRAINT IF EXISTS dogs_good_with_puppies_valid,
  DROP CONSTRAINT IF EXISTS dogs_good_with_large_dogs_valid,
  DROP CONSTRAINT IF EXISTS dogs_good_with_small_dogs_valid,
  DROP CONSTRAINT IF EXISTS dogs_temperament_notes_length;

ALTER TABLE dogs
  ADD CONSTRAINT dogs_dog_friendliness_range
    CHECK (dog_friendliness IS NULL OR dog_friendliness BETWEEN 1 AND 5),
  ADD CONSTRAINT dogs_play_style_valid
    CHECK (play_style IS NULL OR play_style IN ('gentle', 'chase', 'wrestle', 'independent', 'mixed')),
  ADD CONSTRAINT dogs_good_with_puppies_valid
    CHECK (good_with_puppies IS NULL OR good_with_puppies IN ('yes', 'no', 'unsure')),
  ADD CONSTRAINT dogs_good_with_large_dogs_valid
    CHECK (good_with_large_dogs IS NULL OR good_with_large_dogs IN ('yes', 'no', 'unsure')),
  ADD CONSTRAINT dogs_good_with_small_dogs_valid
    CHECK (good_with_small_dogs IS NULL OR good_with_small_dogs IN ('yes', 'no', 'unsure')),
  ADD CONSTRAINT dogs_temperament_notes_length
    CHECK (temperament_notes IS NULL OR char_length(temperament_notes) <= 240);
