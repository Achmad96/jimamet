"""
WebSocket URL routing for Django Channels.
"""

from django.urls import re_path
from api.consumers import ConsultationChatConsumer, DetectionStreamConsumer

websocket_urlpatterns = [
    re_path(r"ws/consultation/(?P<consultation_id>[^/]+)/$", ConsultationChatConsumer.as_asgi()),
    re_path(r"ws/detect-stream/?$", DetectionStreamConsumer.as_asgi()),
]
