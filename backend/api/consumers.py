"""
WebSocket consumer for real-time consultation chat and low-latency food detection.
Uses Django Channels with in-memory channel layer.
"""

import asyncio
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from api.services.detection_service import DetectionService

logger = logging.getLogger(__name__)


class ConsultationChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for consultation chat rooms.
    URL: ws://localhost:8000/ws/consultation/<consultation_id>/

    Messages sent/received format:
    {
        "type": "chat_message",
        "message": "...",
        "sender": "user" | "nutritionist",
        "sent_at": "ISO timestamp"
    }
    """

    async def connect(self):
        self.consultation_id = self.scope["url_route"]["kwargs"]["consultation_id"]
        self.room_group_name = f"consultation_{self.consultation_id}"

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )
        await self.accept()
        logger.info("WebSocket connected: %s", self.room_group_name)

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name,
        )
        logger.info("WebSocket disconnected: %s", self.room_group_name)

    async def receive(self, text_data):
        """Receive message from WebSocket client and broadcast to room."""
        data = json.loads(text_data)

        # Broadcast to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": data.get("message", ""),
                "sender": data.get("sender", "user"),
                "sent_at": data.get("sent_at", ""),
                "id": data.get("id", ""),
            },
        )

    async def chat_message(self, event):
        """Receive message from room group and send to WebSocket client."""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "chat_message",
                    "id": event.get("id", ""),
                    "message": event["message"],
                    "sender": event["sender"],
                    "sent_at": event["sent_at"],
                }
            )
        )


class DetectionStreamConsumer(AsyncWebsocketConsumer):
    """
    Ultra-low latency WebSocket stream consumer for real-time food detection
    from live camera feeds or video playback.

    Accepts:
      - JSON text: {"frame": "<base64>", "ts": 123456789, "conf": 0.25, "imgsz": 320}
      - Binary bytes: raw JPEG frame buffer

    Returns JSON:
      {
        "status": "success",
        "detections": [...],
        "inference_ms": 85.4,
        "ts": 123456789,
        "width": 640,
        "height": 480
      }
    """

    async def connect(self):
        await self.accept()
        logger.info("DetectionStreamConsumer connected")

    async def disconnect(self, close_code):
        logger.info("DetectionStreamConsumer disconnected (%s)", close_code)

    async def receive(self, text_data=None, bytes_data=None):
        ts = None
        conf = 0.35
        imgsz = 320
        fast_mode = True
        image_input = None

        try:
            if bytes_data is not None:
                image_input = bytes_data
            elif text_data is not None:
                data = json.loads(text_data)
                # Client heartbeat or ping
                if data.get("type") == "ping":
                    await self.send(text_data=json.dumps({"type": "pong", "ts": data.get("ts")}))
                    return

                image_input = data.get("frame") or data.get("image")
                ts = data.get("ts")
                conf = float(data.get("conf", 0.35))
                imgsz = int(data.get("imgsz", 320))
                fast_mode = bool(data.get("fast", True))

            if not image_input:
                await self.send(text_data=json.dumps({"status": "error", "message": "No frame received"}))
                return

            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(
                None,
                DetectionService.detect_frame,
                image_input,
                imgsz,
                conf,
                0.45,
                fast_mode,
            )

            if ts is not None:
                result["ts"] = ts

            await self.send(text_data=json.dumps(result))

        except Exception as e:
            logger.error("DetectionStream error: %s", e)
            await self.send(
                text_data=json.dumps(
                    {
                        "status": "error",
                        "message": str(e),
                        "ts": ts,
                    }
                )
            )
