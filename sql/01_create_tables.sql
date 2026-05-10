-- ============================================
-- TABEL 1: user_profiles
-- Menyimpan data profil fisik dan aktivitas user
-- ============================================

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    weight FLOAT NOT NULL,
    height FLOAT NOT NULL,
    age INTEGER NOT NULL,
    job VARCHAR(100) NOT NULL,
    activity VARCHAR(50) NOT NULL CHECK (activity IN ('ringan', 'sedang', 'berat')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================
-- TABEL 2: consumption_history
-- Menyimpan histori makanan yang dikonsumsi user
-- ============================================

CREATE TABLE consumption_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    food_name VARCHAR(100) NOT NULL,
    calories FLOAT NOT NULL,
    protein FLOAT NOT NULL,
    carbs FLOAT NOT NULL,
    fat FLOAT NOT NULL,
    consumed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
