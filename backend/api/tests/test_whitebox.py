import os
import io
import json
import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime
from PIL import Image
from django.test import RequestFactory
from django.core.files.uploadedfile import SimpleUploadedFile

from api.services.consultation_service import ConsultationService
from api.services.prediction_service import PredictionService
from api.services.profile_service import ProfileService
from api.services.auth_service import AuthService
from api.services.coach_chat_service import CoachChatService
from api.services.analysis_service import AnalysisService
from api.services.nutrition_retrieval_service import NutritionRetrievalService
from api.services.detection_service import DetectionService
from api.controllers.detection_controller import detect_food_api, detect_frame_api
from api.supabase_auth import hash_password, verify_password, generate_token
from api import cache as app_cache


class DummyUser:
    def __init__(self, user_id=1, username="testuser", email="test@example.com", full_name="Test User"):
        self.id = user_id
        self.username = username
        self.email = email
        self._full_name = full_name

    def get_full_name(self):
        return self._full_name


class TestWhiteBoxConsultationService(unittest.TestCase):
    """White box test suite for ConsultationService (Statement Coverage)."""

    @patch("api.services.consultation_service.ConsultationModel.update")
    def test_tc_wb_001_update_status_only(self, mock_update):
        # TC_WB_001: Menguji pembaruan parameter status saja
        mock_update.return_value = {"id": "123", "status": "completed"}
        result = ConsultationService.update_consultation("123", {"status": "completed"})
        self.assertEqual(result["status"], "completed")
        mock_update.assert_called_once_with("123", {"status": "completed"})

    @patch("api.services.consultation_service.ConsultationModel.update")
    def test_tc_wb_002_update_handled_by_and_status(self, mock_update):
        # TC_WB_002: Menguji pembaruan parameter handled_by dan status
        mock_update.return_value = {"id": "123", "status": "active", "handled_by": "Dr. Sarah"}
        result = ConsultationService.update_consultation("123", {"status": "active", "handled_by": "Dr. Sarah"})
        self.assertEqual(result["handled_by"], "Dr. Sarah")
        self.assertEqual(result["status"], "active")
        mock_update.assert_called_once_with("123", {"status": "active", "handled_by": "Dr. Sarah"})

    def test_tc_wb_003_update_empty_data(self):
        # TC_WB_003: Menguji fungsi saat parameter data kosong
        with self.assertRaises(ValueError) as ctx:
            ConsultationService.update_consultation("123", {})
        self.assertIn("No fields to update", str(ctx.exception))

    def test_tc_wb_004_update_invalid_key(self):
        # TC_WB_004: Menguji parameter yang tidak terdaftar (invalid key)
        with self.assertRaises(ValueError) as ctx:
            ConsultationService.update_consultation("123", {"kolom_asal": "bebas"})
        self.assertIn("No fields to update", str(ctx.exception))

    @patch("api.services.consultation_service.ConsultationModel.update")
    def test_tc_wb_005_update_all_valid_fields(self, mock_update):
        # TC_WB_005: Menguji fungsi dengan semua field valid secara bersamaan
        expected_payload = {
            "status": "completed",
            "nutritionist_notes": "Aman",
            "handled_by": "Dr. Andi"
        }
        mock_update.return_value = {"id": "123", **expected_payload}
        result = ConsultationService.update_consultation("123", expected_payload)
        self.assertEqual(result["status"], "completed")
        self.assertEqual(result["nutritionist_notes"], "Aman")
        self.assertEqual(result["handled_by"], "Dr. Andi")
        mock_update.assert_called_once_with("123", expected_payload)

    @patch("api.services.consultation_service.ConsultationModel.find_by_id")
    def test_tc_wb_006_patient_details_consultation_not_found(self, mock_find_cons):
        # TC_WB_006: Menguji saat consultation_id tidak ditemukan di database
        mock_find_cons.return_value = None
        with self.assertRaises(ValueError) as ctx:
            ConsultationService.get_patient_details("ID_TIDAK_VALID")
        self.assertIn("Consultation not found", str(ctx.exception))

    @patch("api.supabase_client.supabase.select")
    @patch("api.services.consultation_service.UserModel.find_by_id")
    @patch("api.services.consultation_service.ConsultationModel.find_by_id")
    def test_tc_wb_007_patient_details_user_none(self, mock_find_cons, mock_find_user, mock_select):
        # TC_WB_007: Menguji penanganan (fallback) saat data user tidak ditemukan (None)
        mock_find_cons.return_value = {"id": "123", "user_id": 999, "handled_by": "Dr. Sarah"}
        mock_find_user.return_value = None
        mock_select.return_value = []
        result = ConsultationService.get_patient_details("123")
        self.assertEqual(result["profile"], {})
        self.assertEqual(result["consultation"]["id"], "123")

    @patch("api.supabase_client.supabase.select")
    @patch("api.services.consultation_service.UserModel.find_by_id")
    @patch("api.services.consultation_service.ConsultationModel.find_by_id")
    def test_tc_wb_008_patient_details_food_records_exception(self, mock_find_cons, mock_find_user, mock_select):
        # TC_WB_008: Menguji blok try-except saat koneksi ke tabel food_records gagal
        mock_find_cons.return_value = {"id": "123", "user_id": 1, "handled_by": "Dr. Sarah"}
        mock_find_user.return_value = {"id": 1, "full_name": "Test User"}
        mock_select.side_effect = Exception("DB Connection Timeout")
        result = ConsultationService.get_patient_details("123")
        self.assertEqual(result["food_history"], [])

    @patch("api.supabase_client.supabase.select")
    @patch("api.services.consultation_service.UserModel.find_by_id")
    @patch("api.services.consultation_service.ConsultationModel.find_by_id")
    def test_tc_wb_009_patient_details_happy_path(self, mock_find_cons, mock_find_user, mock_select):
        # TC_WB_009: Menguji alur normal (Happy Path) dengan semua data valid & lengkap
        mock_find_cons.return_value = {"id": "123", "user_id": 1, "status": "pending"}
        mock_find_user.return_value = {"id": 1, "full_name": "Test User", "password": "secret"}
        mock_select.return_value = [{"food_name": "Nasi Goreng", "calories": 400}]
        result = ConsultationService.get_patient_details("123")
        self.assertNotIn("password", result["profile"])
        self.assertEqual(len(result["food_history"]), 1)
        self.assertEqual(result["consultation"]["handled_by"], "")


class TestWhiteBoxPredictionService(unittest.TestCase):
    """White box test suite for PredictionService.chat (Statement Coverage)."""

    def test_tc_wb_010_chat_empty_message(self):
        # TC_WB_010: Menguji sistem keamanan input pesan kosong
        with self.assertRaises(ValueError) as ctx:
            PredictionService.chat(1, "123", "")
        self.assertIn("Pesan tidak boleh kosong", str(ctx.exception))

    @patch("api.models.CoachSessionModel.find_by_id_and_user")
    def test_tc_wb_011_chat_session_not_found(self, mock_find_session):
        # TC_WB_011: Menguji validasi eksistensi ID Sesi
        mock_find_session.return_value = None
        with self.assertRaises(ValueError) as ctx:
            PredictionService.chat(1, "ID_SALAH", "Halo")
        self.assertIn("Session not found", str(ctx.exception))

    @patch("api.cache.delete")
    @patch("api.models.CoachSessionModel.update")
    @patch("api.models.CoachMessageModel.create")
    @patch("api.services.prediction_service.PredictionService._call_gemini")
    @patch("api.services.prediction_service.PredictionService._build_nutrition_context")
    @patch("api.models.CoachMessageModel.find_by_session")
    @patch("api.models.CoachSessionModel.find_by_id_and_user")
    def test_tc_wb_012_chat_auto_rename_first_message(
        self, mock_find_sess, mock_find_msg, mock_nutrition, mock_gemini,
        mock_create_msg, mock_update_sess, mock_cache_del
    ):
        # TC_WB_012: Menguji logika penggantian judul otomatis pada pesan pertama
        mock_find_sess.return_value = {"id": "123", "title": "New Consultation", "user_id": 1}
        mock_find_msg.return_value = []
        mock_nutrition.return_value = {
            "target_calories": 2000, "total_cal": 500,
            "total_protein": 30, "total_carbs": 60, "total_fat": 15
        }
        mock_gemini.return_value = "Ayam goreng sekitar 260 kalori per potong."
        mock_update_sess.return_value = {"id": "123", "title": "Berapa kalori ayam goreng?"}

        with patch.dict(os.environ, {"GEMINI_API_KEY": "fake-key"}):
            result = PredictionService.chat(1, "123", "Berapa kalori ayam goreng?")
            self.assertIn("Ayam goreng", result["reply"])
            self.assertFalse(result["needs_consultation"])
            mock_update_sess.assert_any_call("123", {"title": "Berapa kalori ayam goreng?"})

    @patch("api.services.prediction_service.PredictionService._build_nutrition_context")
    @patch("api.models.CoachMessageModel.find_by_session")
    @patch("api.models.CoachSessionModel.find_by_id_and_user")
    def test_tc_wb_013_chat_fallback_all_api_keys_missing(
        self, mock_find_sess, mock_find_msg, mock_nutrition
    ):
        # TC_WB_013: Menguji mekanisme fallback saat semua API Key tidak ada / putus koneksi
        mock_find_sess.return_value = {"id": "123", "title": "Sesi Tes", "user_id": 1}
        mock_find_msg.return_value = [{"sender": "user", "message": "tes"}]
        mock_nutrition.return_value = {
            "target_calories": 2000, "total_cal": 0,
            "total_protein": 0, "total_carbs": 0, "total_fat": 0
        }

        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(RuntimeError) as ctx:
                PredictionService.chat(1, "123", "Diet keto?")
            self.assertIn("OPENROUTER_API_KEY belum diatur", str(ctx.exception))

    @patch("api.cache.delete")
    @patch("api.models.CoachSessionModel.update")
    @patch("api.models.CoachMessageModel.create")
    @patch("api.services.prediction_service.PredictionService._call_gemini")
    @patch("api.services.prediction_service.PredictionService._build_nutrition_context")
    @patch("api.models.CoachMessageModel.find_by_session")
    @patch("api.models.CoachSessionModel.find_by_id_and_user")
    def test_tc_wb_014_chat_disease_keyword_triage(
        self, mock_find_sess, mock_find_msg, mock_nutrition, mock_gemini,
        mock_create_msg, mock_update_sess, mock_cache_del
    ):
        # TC_WB_014: Menguji deteksi kata kunci penyakit (Sistem Triage Medis) & Alur Normal
        mock_find_sess.return_value = {"id": "123", "title": "Sesi Konsultasi", "user_id": 1}
        mock_find_msg.return_value = [{"sender": "ai", "message": "Halo, ada yang bisa dibantu?"}]
        mock_nutrition.return_value = {
            "target_calories": 2000, "total_cal": 1200,
            "total_protein": 50, "total_carbs": 150, "total_fat": 40
        }
        mock_gemini.return_value = "Harap berhati-hati dengan asupan gula dan garam."
        mock_update_sess.return_value = {"id": "123", "title": "Sesi Konsultasi"}

        with patch.dict(os.environ, {"GEMINI_API_KEY": "fake-key"}):
            result = PredictionService.chat(1, "123", "Saya menderita diabetes dan hipertensi")
            self.assertTrue(result["needs_consultation"])
            self.assertIn("Harap berhati-hati", result["reply"])

    @patch("api.cache.delete")
    @patch("api.models.CoachSessionModel.update")
    @patch("api.models.CoachMessageModel.create")
    @patch("api.services.prediction_service.PredictionService._call_openrouter")
    @patch("api.services.prediction_service.PredictionService._call_gemini")
    @patch("api.services.prediction_service.PredictionService._build_nutrition_context")
    @patch("api.models.CoachMessageModel.find_by_session")
    @patch("api.models.CoachSessionModel.find_by_id_and_user")
    def test_tc_wb_019_chat_openrouter_fallback_success(
        self, mock_find_sess, mock_find_msg, mock_nutrition, mock_gemini, mock_openrouter,
        mock_create_msg, mock_update_sess, mock_cache_del
    ):
        # TC_WB_019: Menguji fallback berhasil ke OpenRouter saat Gemini gagal
        mock_find_sess.return_value = {"id": "123", "title": "Sesi OpenRouter", "user_id": 1}
        mock_find_msg.return_value = [{"sender": "user", "message": "Info gizi"}]
        mock_nutrition.return_value = {
            "target_calories": 2000, "total_cal": 800,
            "total_protein": 40, "total_carbs": 100, "total_fat": 20
        }
        mock_gemini.return_value = None  # Gemini fails
        mock_openrouter.return_value = "Balasan sukses dari OpenRouter model."
        mock_update_sess.return_value = {"id": "123", "title": "Sesi OpenRouter"}

        with patch.dict(os.environ, {"GEMINI_API_KEY": "fake-key", "OPENROUTER_API_KEY": "fake-or-key"}):
            result = PredictionService.chat(1, "123", "Berapa kalori telur rebus?")
            self.assertIn("Balasan sukses dari OpenRouter", result["reply"])
            mock_openrouter.assert_called_once()

    @patch("api.models.CoachSessionModel.update")
    @patch("api.services.prediction_service.PredictionService._call_openrouter")
    @patch("api.services.prediction_service.PredictionService._call_gemini")
    @patch("api.services.prediction_service.PredictionService._build_nutrition_context")
    @patch("api.models.CoachMessageModel.find_by_session")
    @patch("api.models.CoachSessionModel.find_by_id_and_user")
    def test_tc_wb_020_chat_openrouter_fallback_failure(
        self, mock_find_sess, mock_find_msg, mock_nutrition, mock_gemini, mock_openrouter, mock_update_sess
    ):
        # TC_WB_020: Menguji penanganan eksepsi saat OpenRouter juga gagal merespons
        mock_find_sess.return_value = {"id": "123", "title": "Sesi OpenRouter Fail", "user_id": 1}
        mock_find_msg.return_value = []
        mock_nutrition.return_value = {
            "target_calories": 2000, "total_cal": 0,
            "total_protein": 0, "total_carbs": 0, "total_fat": 0
        }
        mock_gemini.return_value = None
        mock_openrouter.return_value = None  # OpenRouter also fails

        with patch.dict(os.environ, {"GEMINI_API_KEY": "fake-key", "OPENROUTER_API_KEY": "fake-or-key"}):
            with self.assertRaises(RuntimeError) as ctx:
                PredictionService.chat(1, "123", "Halo bot?")
            self.assertIn("OpenRouter juga gagal merespons", str(ctx.exception))


class TestWhiteBoxProfileService(unittest.TestCase):
    """White box test suite for ProfileService.update_profile (Statement Coverage)."""

    def setUp(self):
        self.user = DummyUser(user_id=1, username="testuser", email="test@example.com", full_name="Ahmad Test")

    def test_tc_wb_015_update_profile_invalid_fields_only(self):
        # TC_WB_015: Menguji filter kolom (Hanya parameter tidak sah/kosong yang dikirim)
        with self.assertRaises(ValueError) as ctx:
            ProfileService.update_profile(self.user, {"is_admin": True, "asal": "tes"})
        self.assertIn("No valid fields to update", str(ctx.exception))

    @patch("api.cache.delete")
    @patch("api.models.UserModel.update")
    @patch("api.models.UserModel.find_by_id")
    def test_tc_wb_016_update_profile_tdee_calculation(self, mock_find, mock_update, mock_cache_del):
        # TC_WB_016: Menguji perhitungan otomatis kalori harian (TDEE)
        mock_find.return_value = {"id": 1, "weight": 70, "height": 175, "age": 25, "gender": "male"}
        mock_update.return_value = {"id": 1, "daily_calorie_target": 2623}
        
        result = ProfileService.update_profile(
            self.user,
            {"weight": 70, "height": 175, "age": 25, "gender": "male"}
        )
        self.assertEqual(result["message"], "Profil berhasil diperbarui.")
        # Verify TDEE was calculated and included in the update payload
        args, kwargs = mock_update.call_args
        self.assertIn("daily_calorie_target", args[1])
        self.assertGreater(args[1]["daily_calorie_target"], 0)

    @patch("api.cache.delete")
    @patch("api.models.UserModel.update")
    @patch("api.models.UserModel.find_by_id")
    def test_tc_wb_017_update_profile_existing_profile(self, mock_find, mock_update, mock_cache_del):
        # TC_WB_017: Menguji rute (branch) ketika pengguna sudah memiliki profil (Mode Update)
        mock_find.return_value = {"id": 1, "full_name": "Ahmad Test", "goal": "maintain"}
        mock_update.return_value = {"id": 1, "full_name": "Ahmad Baru", "goal": "maintain"}

        result = ProfileService.update_profile(self.user, {"full_name": "Ahmad Baru"})
        self.assertEqual(result["message"], "Profil berhasil diperbarui.")
        mock_update.assert_called_once()

    @patch("api.cache.delete")
    @patch("api.models.UserModel.create")
    @patch("api.models.UserModel.find_by_id")
    def test_tc_wb_018_update_profile_new_profile_with_fullname(self, mock_find, mock_create, mock_cache_del):
        # TC_WB_018: Menguji rute (branch) ketika pengguna belum punya profil (Mode Create / Akun Baru)
        mock_find.return_value = None
        mock_create.return_value = {"id": 1, "email": "test@example.com", "full_name": "Profil Baru"}

        result = ProfileService.update_profile(self.user, {"full_name": "Profil Baru"})
        self.assertEqual(result["message"], "Profil berhasil diperbarui.")
        mock_create.assert_called_once()
        create_payload = mock_create.call_args[0][0]
        self.assertEqual(create_payload["id"], self.user.id)
        self.assertEqual(create_payload["email"], self.user.email)
        self.assertEqual(create_payload["full_name"], "Profil Baru")

    @patch("api.cache.delete")
    @patch("api.models.UserModel.update")
    @patch("api.models.UserModel.find_by_id")
    def test_tc_wb_021_update_profile_female_and_weight_goals(self, mock_find, mock_update, mock_cache_del):
        # TC_WB_021: Menguji perhitungan TDEE untuk female dan variasi target goal (lose & gain)
        # Test goal == "lose" with female
        mock_find.return_value = {"id": 1, "weight": 55, "height": 160, "age": 24, "gender": "female", "activity_level": "active"}
        mock_update.return_value = {"id": 1, "status": "ok"}
        result_lose = ProfileService.update_profile(
            self.user,
            {"weight": 55, "height": 160, "age": 24, "gender": "female", "goal": "lose", "activity_level": "active"}
        )
        tdee_lose = mock_update.call_args[0][1]["daily_calorie_target"]

        # Test goal == "gain"
        result_gain = ProfileService.update_profile(
            self.user,
            {"weight": 55, "height": 160, "age": 24, "gender": "female", "goal": "gain", "activity_level": "active"}
        )
        tdee_gain = mock_update.call_args[0][1]["daily_calorie_target"]
        self.assertGreater(tdee_gain, tdee_lose)

    @patch("api.cache.delete")
    @patch("api.models.UserModel.create")
    @patch("api.models.UserModel.find_by_id")
    def test_tc_wb_022_update_profile_new_profile_fallback_fullname(self, mock_find, mock_create, mock_cache_del):
        # TC_WB_022: Menguji pembuatan profil baru tanpa field full_name (fallback ke user.get_full_name())
        mock_find.return_value = None
        mock_create.return_value = {"id": 1, "email": "test@example.com", "full_name": "Ahmad Test"}

        result = ProfileService.update_profile(self.user, {"age": 25})
        create_payload = mock_create.call_args[0][0]
        self.assertEqual(create_payload["full_name"], "Ahmad Test")


class TestWhiteBoxAuthService(unittest.TestCase):
    """White box test suite for AuthService (Statement Coverage)."""

    def test_tc_wb_023_register_empty_fields(self):
        # TC_WB_023: Menguji validasi registrasi saat ada field wajib kosong
        with self.assertRaises(ValueError) as ctx:
            AuthService.register("", "test@mail.com", "pass123")
        self.assertIn("Username, email, dan password wajib diisi", str(ctx.exception))

    @patch("api.models.UserModel.find_by_username")
    def test_tc_wb_024_register_duplicate_username(self, mock_find_user):
        # TC_WB_024: Menguji validasi registrasi saat username sudah digunakan
        mock_find_user.return_value = {"id": 1, "username": "existing_user"}
        with self.assertRaises(ValueError) as ctx:
            AuthService.register("existing_user", "new@mail.com", "pass123")
        self.assertIn("Username sudah digunakan", str(ctx.exception))

    @patch("api.models.UserModel.find_by_email")
    @patch("api.models.UserModel.find_by_username")
    def test_tc_wb_025_register_duplicate_email(self, mock_find_user, mock_find_email):
        # TC_WB_025: Menguji validasi registrasi saat email sudah terdaftar
        mock_find_user.return_value = None
        mock_find_email.return_value = {"id": 1, "email": "existing@mail.com"}
        with self.assertRaises(ValueError) as ctx:
            AuthService.register("new_user", "existing@mail.com", "pass123")
        self.assertIn("Email sudah terdaftar", str(ctx.exception))

    @patch("api.models.UserModel.create")
    @patch("api.models.UserModel.find_by_email")
    @patch("api.models.UserModel.find_by_username")
    def test_tc_wb_026_register_success_with_tdee(self, mock_find_user, mock_find_email, mock_create):
        # TC_WB_026: Menguji alur normal registrasi sukses beserta kalkulasi otomatis TDEE
        mock_find_user.return_value = None
        mock_find_email.return_value = None
        mock_create.return_value = {"id": 10, "username": "budi"}

        extra_data = {"age": 25, "weight": 70, "height": 175, "activity_level": "moderate"}
        result = AuthService.register("budi", "budi@mail.com", "rahasia123", full_name="Budi Santoso", extra_data=extra_data)
        self.assertEqual(result["username"], "budi")
        self.assertEqual(result["user_id"], 10)
        self.assertTrue(len(result["token"]) > 0)
        created_data = mock_create.call_args[0][0]
        self.assertIn("daily_calorie_target", created_data)

    def test_tc_wb_027_login_empty_input(self):
        # TC_WB_027: Menguji validasi login saat username atau password kosong
        with self.assertRaises(ValueError) as ctx:
            AuthService.login("", "pass")
        self.assertIn("Username dan password wajib diisi", str(ctx.exception))

    @patch("api.supabase_client.supabase.select")
    def test_tc_wb_028_login_nutritionist_success(self, mock_select):
        # TC_WB_028: Menguji alur login khusus untuk role Ahli Gizi (nutritionist)
        mock_select.return_value = [{
            "id": "ahli_1",
            "username": "dr_sarah",
            "password": "pass_nutri_123",
            "full_name": "Dr. Sarah Sp.GK",
            "specialization": "Clinical Nutrition",
            "license_number": "STR-12345"
        }]
        result = AuthService.login("dr_sarah", "pass_nutri_123")
        self.assertEqual(result["role"], "ahli_gizi")
        self.assertEqual(result["token"], "ahligizi_ahli_1")
        self.assertEqual(result["user"]["full_name"], "Dr. Sarah Sp.GK")

    @patch("api.models.UserModel.find_by_username")
    @patch("api.supabase_client.supabase.select")
    def test_tc_wb_029_login_invalid_credentials(self, mock_select, mock_find_user):
        # TC_WB_029: Menguji kegagalan login saat user tidak ditemukan atau password salah
        mock_select.return_value = []
        mock_find_user.return_value = None
        with self.assertRaises(ValueError) as ctx:
            AuthService.login("non_existent", "pass123")
        self.assertIn("Username atau password salah", str(ctx.exception))

    @patch("api.models.UserModel.update")
    @patch("api.services.auth_service.verify_password")
    @patch("api.models.UserModel.find_by_username")
    @patch("api.supabase_client.supabase.select")
    def test_tc_wb_030_login_regular_user_success(self, mock_select, mock_find_user, mock_verify, mock_update):
        # TC_WB_030: Menguji alur normal login pengguna reguler dengan rotasi token sesi
        mock_select.return_value = []
        mock_find_user.return_value = {"id": 1, "username": "user1", "password": "hashed_password", "email": "user1@mail.com"}
        mock_verify.return_value = True

        result = AuthService.login("user1", "correct_pass")
        self.assertEqual(result["message"], "Login berhasil.")
        self.assertIn("token", result)
        mock_update.assert_called_once()

    @patch("api.models.UserModel.update")
    def test_tc_wb_031_logout_regular_and_nutritionist(self, mock_update):
        # TC_WB_031: Menguji logout pengguna reguler (reset token) dan pengecualian untuk nutrisionis
        # Reguler user
        reg_user = DummyUser(user_id=1)
        AuthService.logout(reg_user)
        mock_update.assert_called_with(1, {"token": None})

        # Nutritionist user
        nutri_user = DummyUser(user_id=2)
        nutri_user.role = "nutritionist"
        mock_update.reset_mock()
        AuthService.logout(nutri_user)
        mock_update.assert_not_called()


class TestWhiteBoxCoachChatService(unittest.TestCase):
    """White box test suite for CoachChatService (Statement Coverage)."""

    def test_tc_wb_032_send_chat_validation_empty_and_sender(self):
        # TC_WB_032: Menguji validasi pesan kosong dan sender tidak sah
        with self.assertRaises(ValueError) as ctx:
            CoachChatService.send_chat("123", "user", "   ")
        self.assertIn("Message cannot be empty", str(ctx.exception))

        with self.assertRaises(ValueError) as ctx:
            CoachChatService.send_chat("123", "unknown_role", "Halo dokter")
        self.assertIn("Sender must be user or nutritionist", str(ctx.exception))

    @patch("api.models.ConsultationMessageModel.create")
    @patch("api.models.ConsultationModel.find_by_id")
    def test_tc_wb_033_send_chat_consultation_not_found_and_success(self, mock_find_cons, mock_create_msg):
        # TC_WB_033: Menguji validasi eksistensi konsultasi dan alur berhasil kirim chat
        mock_find_cons.return_value = None
        with self.assertRaises(ValueError) as ctx:
            CoachChatService.send_chat("ID_SALAH", "user", "Halo")
        self.assertIn("Consultation not found", str(ctx.exception))

        # Sukses kirim chat
        mock_find_cons.return_value = {"id": "123"}
        mock_create_msg.return_value = {"id": "msg_1", "consultation_id": "123", "sender": "user", "message": "Halo"}
        result = CoachChatService.send_chat("123", "user", "Halo")
        self.assertEqual(result["id"], "msg_1")
        mock_create_msg.assert_called_once()

    @patch("api.models.ConsultationMessageModel.delete")
    @patch("api.models.ConsultationMessageModel.find_by_consultation")
    def test_tc_wb_034_list_and_delete_chat(self, mock_find_msgs, mock_delete_msg):
        # TC_WB_034: Menguji pengambilan riwayat pesan konsultasi dan penghapusan pesan
        mock_find_msgs.return_value = [{"id": "msg_1", "message": "Pesan 1"}]
        messages = CoachChatService.list_chat("123")
        self.assertEqual(len(messages), 1)

        mock_delete_msg.return_value = True
        del_result = CoachChatService.delete_chat("msg_1")
        self.assertTrue(del_result)


class TestWhiteBoxAnalysisService(unittest.TestCase):
    """White box test suite for AnalysisService (Statement Coverage)."""

    def test_tc_wb_035_create_food_record_validation(self):
        # TC_WB_035: Menguji validasi wajib nama makanan dan kalori
        with self.assertRaises(ValueError) as ctx:
            AnalysisService.create_food_record(1, {})
        self.assertIn("food_name / nama_makanan is required", str(ctx.exception))

        with self.assertRaises(ValueError) as ctx:
            AnalysisService.create_food_record(1, {"food_name": "Apel"})
        self.assertIn("calories / kalori is required", str(ctx.exception))

    @patch("api.cache.delete")
    @patch("api.models.FoodRecordModel.create")
    @patch("api.models.ImageModel.create")
    def test_tc_wb_036_create_food_record_with_image_success(self, mock_create_img, mock_create_rec, mock_cache_del):
        # TC_WB_036: Menguji alur simpan catatan makanan lengkap beserta tautan image_url
        mock_create_img.return_value = {"id": 100}
        mock_create_rec.return_value = {"id": 55, "food_name": "Sate Ayam", "calories": 450, "image_id": 100}

        payload = {"food_name": "Sate Ayam", "calories": 450, "image_url": "https://storage.supabase.com/sate.jpg"}
        result = AnalysisService.create_food_record(1, payload)
        self.assertEqual(result["id"], 55)
        mock_create_img.assert_called_once()
        mock_create_rec.assert_called_once()

    @patch("api.models.FoodRecordModel.delete")
    @patch("api.models.FoodRecordModel.find_by_id_and_user")
    @patch("api.cache.set")
    @patch("api.cache.get")
    @patch("api.models.FoodRecordModel.find_by_user")
    def test_tc_wb_037_list_and_delete_food_records(self, mock_find_user, mock_get_cache, mock_set_cache, mock_find_rec, mock_del_rec):
        # TC_WB_037: Menguji listing data makanan (unfiltered & filter tanggal), get single record, dan delete
        mock_get_cache.return_value = None
        mock_find_user.return_value = [{"id": 1, "food_name": "Nasi Uduk"}]

        # Unfiltered listing
        records_unfiltered = AnalysisService.list_food_records(1)
        self.assertEqual(len(records_unfiltered), 1)

        # Filtered listing with date range
        records_filtered = AnalysisService.list_food_records(1, date_from="2026-11-01", date_to="2026-11-02")
        self.assertEqual(len(records_filtered), 1)

        # Get single food record
        mock_find_rec.return_value = {"id": 1, "food_name": "Nasi Uduk"}
        rec = AnalysisService.get_food_record(1, 1)
        self.assertEqual(rec["food_name"], "Nasi Uduk")

        # Delete food record
        mock_del_rec.return_value = True
        del_status = AnalysisService.delete_food_record(1, 1)
        self.assertTrue(del_status)

    @patch("api.models.UserModel.find_by_id")
    @patch("api.models.FoodRecordModel.find_by_user")
    @patch("api.cache.set")
    @patch("api.cache.get")
    def test_tc_wb_038_get_dashboard_summary(self, mock_get_cache, mock_set_cache, mock_find_records, mock_find_user):
        # TC_WB_038: Menguji agregasi total nutrisi harian dan perhitungan tren kalori mingguan (7 hari)
        mock_get_cache.return_value = None
        mock_find_records.return_value = [
            {"id": 1, "recorded_at": "2026-11-01T08:00:00Z", "calories": 400, "protein": 20, "fat": 10, "carbs": 50},
            {"id": 2, "recorded_at": "2026-11-01T12:30:00Z", "calories": 600, "protein": 30, "fat": 15, "carbs": 80},
        ]
        mock_find_user.return_value = {"id": 1, "daily_calorie_target": 2200}

        summary = AnalysisService.get_dashboard_summary(1, "2026-11-01")
        self.assertEqual(summary["total_meals"], 2)
        self.assertEqual(summary["total_calories"], 1000.0)
        self.assertEqual(summary["target_calories"], 2200)
        self.assertEqual(len(summary["weekly_data"]), 7)


class TestWhiteBoxNutritionRetrievalService(unittest.TestCase):
    """White box test suite for NutritionRetrievalService (Statement Coverage)."""

    @classmethod
    def setUpClass(cls):
        NutritionRetrievalService.initialize()

    def test_tc_wb_039_nutrition_retrieval_exact(self):
        # TC_WB_039: Menguji pencocokan eksak pangan lokal dengan skor kemiripan 1.0
        result = NutritionRetrievalService.retrieve("Ayam_Bakar")
        self.assertIsNotNone(result)
        self.assertEqual(result["food_name"].lower(), "ayam bakar")
        self.assertEqual(result["similarity_score"], 1.0)
        self.assertEqual(result["match_type"], "exact")

    def test_tc_wb_040_nutrition_retrieval_fuzzy_and_unknown(self):
        # TC_WB_040: Menguji pencarian fuzzy TF-IDF dan penanganan input di bawah batas ambang
        # Fuzzy match
        result_fuzzy = NutritionRetrievalService.retrieve("Bakso", threshold=0.40)
        self.assertIsNotNone(result_fuzzy)
        self.assertIn("bakso", result_fuzzy["food_name"].lower())

        # Unknown / below threshold
        result_none = NutritionRetrievalService.retrieve("Makanan_Khayalan_Antariksa_9999", threshold=0.40)
        self.assertIsNone(result_none)


class TestWhiteBoxDetectionService(unittest.TestCase):
    """White box test suite for DetectionService (Computer Vision & Model Logic)."""

    def test_tc_wb_041_is_human_false_positive(self):
        # TC_WB_041: Menguji algoritma IoU dan overlap deteksi palsu makanan pada manusia
        food_box = [100, 100, 300, 300]
        # Kasus 1: Overlap tinggi (orang terdeteksi sebagai makanan)
        person_boxes_overlap = [[90, 90, 310, 310]]
        self.assertTrue(DetectionService._is_human_false_positive(food_box, person_boxes_overlap))

        # Kasus 2: Tidak ada overlap (makanan terpisah dari manusia)
        person_boxes_no_overlap = [[500, 500, 700, 700]]
        self.assertFalse(DetectionService._is_human_false_positive(food_box, person_boxes_no_overlap))

        # Kasus 3: person_boxes kosong
        self.assertFalse(DetectionService._is_human_false_positive(food_box, []))

    def test_tc_wb_042_get_fast_nutrition(self):
        # TC_WB_042: Menguji lookup cepat nutrisi pangan dari cache/CSV tanpa panggilan AI
        result = DetectionService.get_fast_nutrition("Ayam_Bakar")
        self.assertIsNotNone(result)
        self.assertIn("calories", result)
        self.assertGreater(result["calories"], 0)
        self.assertEqual(result["source"], "csv")

        # Test cached lookup
        result_cached = DetectionService.get_fast_nutrition("Ayam_Bakar")
        self.assertEqual(result["calories"], result_cached["calories"])

    def test_tc_wb_043_parse_portion_response(self):
        # TC_WB_043: Menguji parsing respon porsi gram AI dan batas sanity check 0-5000g
        valid_json = '{"portion_grams": 150, "fiber_per_100g": 2.5, "sugar_per_100g": 1.0}'
        parsed = DetectionService._parse_portion_response(valid_json)
        self.assertEqual(parsed["portion_grams"], 150.0)
        self.assertEqual(parsed["fiber_per_100g"], 2.5)

        # Sanity check: porsi di luar batas (misal > 5000g) fallback ke 100g
        invalid_portion_json = '{"portion_grams": 99999}'
        parsed_invalid = DetectionService._parse_portion_response(invalid_portion_json)
        self.assertEqual(parsed_invalid["portion_grams"], 100.0)

    def test_tc_wb_044_parse_ai_nutrition_response(self):
        # TC_WB_044: Menguji parsing terstruktur food_name, portion, dan nutrition dari model AI
        ai_raw = """```json
        {
            "food_name": "Gado-Gado",
            "food_portion": {"serving_size": 250, "serving_unit": "g"},
            "food_nutrition": {"calories": 320, "protein": 12, "fat": 14, "carbs": 38, "fiber": 6, "sugar": 8}
        }
        ```"""
        parsed = DetectionService._parse_ai_nutrition_response(ai_raw, "Gado_Gado")
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed["ai_food_name"], "Gado-Gado")
        self.assertEqual(parsed["serving_size"], 250.0)
        self.assertEqual(parsed["calories"], 320.0)

    @patch("ultralytics.YOLO")
    def test_tc_wb_045_get_model_and_person_model(self, mock_yolo):
        # TC_WB_045: Menguji pemuatan instans model deteksi YOLOv8
        mock_yolo.return_value = MagicMock()
        DetectionService.model = None
        DetectionService.person_model = None

        model = DetectionService.get_model()
        self.assertIsNotNone(model)

        person_model = DetectionService.get_person_model()
        self.assertIsNotNone(person_model)

    def test_tc_wb_048_detect_frame_inference(self):
        # TC_WB_048: Menguji inferensi Computer Vision YOLOv8 pada frame citra makanan
        img = Image.new("RGB", (416, 416), color=(220, 220, 220))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        buf.seek(0)

        result = DetectionService.detect_frame(buf, fast_mode=True)
        self.assertEqual(result["status"], "success")
        self.assertIn("count", result)
        self.assertIn("inference_ms", result)
        self.assertLessEqual(result["inference_ms"], 3000.0)
        self.assertIsInstance(result["detections"], list)

    def test_tc_wb_049_macronutrient_prediction_indonesian_foods(self):
        # TC_WB_049: Menguji prediksi makronutrisi makanan Indonesia (kalori, protein, lemak, karbohidrat)
        foods_to_test = ["Ayam_Bakar", "Tempe_Mendoan", "Pastel"]
        for food in foods_to_test:
            data = DetectionService._get_nutrition_data(food)
            self.assertIsNotNone(data)
            self.assertGreater(data["calories"], 0)
            self.assertGreater(data["protein"], 0)
            self.assertGreaterEqual(data["carbs"], 0)
            self.assertGreater(data["fat"], 0)
            self.assertIn("source", data)

    def test_tc_wb_050_detect_food_api_controller(self):
        # TC_WB_050: Menguji endpoint HTTP detect_food_api untuk unggah citra dan penanganan error
        rf = RequestFactory()
        img = Image.new("RGB", (300, 300), color=(200, 200, 200))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        buf.seek(0)
        uploaded = SimpleUploadedFile("food.jpg", buf.read(), content_type="image/jpeg")

        # Kasus 1: Berkas citra valid
        req = rf.post("/api/detect-food/?fast=1", {"image": uploaded})
        resp = detect_food_api(req)
        self.assertEqual(resp.status_code, 200)
        body = json.loads(resp.content)
        self.assertEqual(body["status"], "success")

        # Kasus 2: Berkas citra tidak ada
        req_empty = rf.post("/api/detect-food/", {})
        resp_empty = detect_food_api(req_empty)
        self.assertEqual(resp_empty.status_code, 400)

    def test_tc_wb_051_detect_frame_api_controller(self):
        # TC_WB_051: Menguji endpoint HTTP detect_frame_api untuk streaming kamera berlatensi rendah
        rf = RequestFactory()
        img = Image.new("RGB", (256, 256), color=(180, 180, 180))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        buf.seek(0)
        uploaded = SimpleUploadedFile("frame.jpg", buf.read(), content_type="image/jpeg")

        # Kasus 1: Frame valid via multipart
        req = rf.post("/api/detect-frame/", {"image": uploaded, "fast": "true"})
        resp = detect_frame_api(req)
        self.assertEqual(resp.status_code, 200)
        body = json.loads(resp.content)
        self.assertEqual(body["status"], "success")

        # Kasus 2: Frame kosong
        req_empty = rf.post("/api/detect-frame/", {})
        resp_empty = detect_frame_api(req_empty)
        self.assertEqual(resp_empty.status_code, 400)

    def test_tc_wb_052_portion_macronutrient_scaling(self):
        # TC_WB_052: Menguji penskalaan makronutrisi proporsional berdasarkan gramatur porsi
        base_data = DetectionService.get_fast_nutrition("Ayam_Bakar")
        base_cal = base_data["calories"]
        base_prot = base_data["protein"]
        base_fat = base_data["fat"]

        # Skala porsi 250 gram (2.5x dari porsi standar 100g)
        factor = 250.0 / 100.0
        scaled_cal = round(base_cal * factor, 1)
        scaled_prot = round(base_prot * factor, 1)
        scaled_fat = round(base_fat * factor, 1)

        self.assertAlmostEqual(scaled_cal, base_cal * 2.5, places=1)
        self.assertAlmostEqual(scaled_prot, base_prot * 2.5, places=1)
        self.assertAlmostEqual(scaled_fat, base_fat * 2.5, places=1)
        self.assertGreater(scaled_cal, base_cal)


class TestWhiteBoxNonFunctional(unittest.TestCase):
    """White box test suite for Non-Functional Logic: Security & Performance Caching."""

    def test_tc_wb_046_password_security_and_token(self):
        # TC_WB_046: Menguji keamanan kriptografis PBKDF2 hashing dan verifikasi kata sandi
        raw_pass = "P@ssw0rdKuat123!"
        hashed = hash_password(raw_pass)
        self.assertNotEqual(raw_pass, hashed)
        self.assertTrue(verify_password(raw_pass, hashed))
        self.assertFalse(verify_password("wrong_password", hashed))

        token = generate_token()
        self.assertEqual(len(token), 40)  # secrets.token_hex(20) menghasilkan 40 hex chars

    def test_tc_wb_047_cache_operations_and_ttl(self):
        # TC_WB_047: Menguji operasi caching in-memory dan pembentukan cache key
        key = app_cache.key_profile(999)
        app_cache.set(key, {"nama": "Test Cache"}, ttl=60)
        val = app_cache.get(key)
        self.assertEqual(val["nama"], "Test Cache")

        app_cache.delete(key)
        val_after_del = app_cache.get(key)
        self.assertIsNone(val_after_del)


if __name__ == "__main__":
    unittest.main()
