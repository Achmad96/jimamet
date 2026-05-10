-- ============================================
-- JALANKAN DI SUPABASE SQL EDITOR
-- Password semua user: password123
-- ============================================

INSERT INTO users (id, name, email, password, created_at, updated_at) VALUES
('a1111111-1111-1111-1111-111111111111', 'Budi Santoso', 'budi@example.com', '$2b$12$i9viNdiDjo5X7qY7bYgohe3kCIID1yoO9JwiWv6Ajqy8kCj3wH6hy', NOW(), NOW()),
('b2222222-2222-2222-2222-222222222222', 'Sari Rahayu', 'sari@example.com', '$2b$12$i9viNdiDjo5X7qY7bYgohe3kCIID1yoO9JwiWv6Ajqy8kCj3wH6hy', NOW(), NOW()),
('c3333333-3333-3333-3333-333333333333', 'Andi Pratama', 'andi@example.com', '$2b$12$i9viNdiDjo5X7qY7bYgohe3kCIID1yoO9JwiWv6Ajqy8kCj3wH6hy', NOW(), NOW());

INSERT INTO user_profiles (id, weight, height, age, job, activity, created_at, updated_at) VALUES
('a1111111-1111-1111-1111-111111111111', 88.5, 170, 25, 'Karyawan Swasta', 'ringan', NOW(), NOW()),
('b2222222-2222-2222-2222-222222222222', 55.0, 160, 30, 'Guru SMA', 'sedang', NOW(), NOW()),
('c3333333-3333-3333-3333-333333333333', 52.0, 175, 22, 'Mahasiswa', 'berat', NOW(), NOW());

INSERT INTO consumption_history (user_id, food_name, calories, protein, carbs, fat, consumed_at) VALUES
('a1111111-1111-1111-1111-111111111111', 'Nasi Goreng Spesial', 650, 18, 85, 25, NOW() - INTERVAL '4 hours'),
('a1111111-1111-1111-1111-111111111111', 'Teh Manis Dingin', 120, 0, 30, 0, NOW() - INTERVAL '4 hours'),
('a1111111-1111-1111-1111-111111111111', 'Ayam Geprek + Nasi', 750, 30, 80, 35, NOW() - INTERVAL '8 hours'),
('a1111111-1111-1111-1111-111111111111', 'Es Kopi Susu Gula Aren', 250, 3, 40, 8, NOW() - INTERVAL '6 hours'),
('a1111111-1111-1111-1111-111111111111', 'Indomie Goreng 2 Bungkus', 760, 16, 96, 34, NOW() - INTERVAL '12 hours'),
('b2222222-2222-2222-2222-222222222222', 'Oatmeal + Pisang + Madu', 320, 8, 55, 6, NOW() - INTERVAL '4 hours'),
('b2222222-2222-2222-2222-222222222222', 'Nasi + Ikan Bakar + Sayur Bayam', 450, 28, 50, 12, NOW() - INTERVAL '8 hours'),
('b2222222-2222-2222-2222-222222222222', 'Jus Alpukat Tanpa Gula', 180, 2, 12, 14, NOW() - INTERVAL '6 hours'),
('b2222222-2222-2222-2222-222222222222', 'Salad Buah', 150, 2, 35, 1, NOW() - INTERVAL '3 hours'),
('b2222222-2222-2222-2222-222222222222', 'Sup Ayam + Roti Gandum', 380, 22, 40, 10, NOW() - INTERVAL '12 hours'),
('c3333333-3333-3333-3333-333333333333', 'Roti Bakar + Teh', 200, 5, 35, 4, NOW() - INTERVAL '4 hours'),
('c3333333-3333-3333-3333-333333333333', 'Nasi + Tahu Goreng', 350, 12, 50, 10, NOW() - INTERVAL '8 hours'),
('c3333333-3333-3333-3333-333333333333', 'Mie Instan', 380, 8, 48, 17, NOW() - INTERVAL '12 hours'),
('c3333333-3333-3333-3333-333333333333', 'Air Putih', 0, 0, 0, 0, NOW() - INTERVAL '2 hours'),
('c3333333-3333-3333-3333-333333333333', 'Pisang 1 Buah', 105, 1, 27, 0.4, NOW() - INTERVAL '6 hours');
