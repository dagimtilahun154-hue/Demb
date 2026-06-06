import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

SYSTEM_PROMPT = Path("system_prompt.md").read_text(encoding="utf-8")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

CRISIS_TERMS = [
    "kill myself",
    "suicide",
    "end my life",
    "hurt myself",
    "self harm",
    "harm myself",
    "hurt someone",
    "kill someone",
]

TASK_TYPES = {
    "walking",
    "breathing",
    "screen_off",
    "hydration",
    "reading",
    "sound_therapy",
    "sleep_preparation",
}

VERIFICATIONS = {"timer", "pedometer", "screen_off", "manual"}

app = FastAPI(title="Demb AI Engine", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str
    text: str
    createdAt: Optional[str] = None


class SupportChatRequest(BaseModel):
    text: str = Field(default="", max_length=2000)
    recentMessages: List[ChatMessage] = Field(default_factory=list)
    recoveryPlan: Optional[Dict[str, Any]] = None
    risk: Optional[Dict[str, Any]] = None
    observationSummary: Optional[Dict[str, Any]] = None


class RecoveryPlanRequest(BaseModel):
    userId: str = "local-user"
    risk: Dict[str, Any] = Field(default_factory=dict)
    userProfile: Dict[str, Any] = Field(default_factory=dict)
    latestBiometrics: Dict[str, Any] = Field(default_factory=dict)
    observationSummary: Dict[str, Any] = Field(default_factory=dict)


def is_crisis_text(text: str) -> bool:
    lower = text.lower()
    return any(term in lower for term in CRISIS_TERMS)


def safe_json_loads(raw: str, fallback: Dict[str, Any]) -> Dict[str, Any]:
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else fallback
    except Exception:
        start = raw.find("{")
        end = raw.rfind("}")
        if start >= 0 and end > start:
            try:
                parsed = json.loads(raw[start : end + 1])
                return parsed if isinstance(parsed, dict) else fallback
            except Exception:
                return fallback
        return fallback


def groq_json(user_prompt: str, fallback: Dict[str, Any], temperature: float = 0.35) -> Dict[str, Any]:
    if not GROQ_API_KEY:
        return fallback

    try:
        response = requests.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": temperature,
                "response_format": {"type": "json_object"},
            },
            timeout=20,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        return safe_json_loads(content, fallback)
    except Exception as exc:
        print(f"[Demb AI] Groq request failed: {exc}")
        return fallback


def bounded_int(value: Any, default: int, minimum: int, maximum: int) -> int:
    try:
        parsed = int(value)
    except Exception:
        parsed = default
    return max(minimum, min(maximum, parsed))


def normalize_plan(raw: Dict[str, Any], fallback: Dict[str, Any]) -> Dict[str, Any]:
    causes = raw.get("primaryCauses")
    if not isinstance(causes, list) or not causes:
        causes = fallback["primaryCauses"]
    causes = [str(item)[:48] for item in causes[:4]]

    rules = []
    for index, rule in enumerate(raw.get("digitalRules") if isinstance(raw.get("digitalRules"), list) else []):
        if not isinstance(rule, dict):
            continue
        rules.append(
            {
                "id": str(rule.get("id") or f"rule_{index + 1}"),
                "appCategory": str(rule.get("appCategory") or "social_media")[:40],
                "appName": str(rule.get("appName") or "Social Apps")[:48],
                "allowedMinutes": bounded_int(rule.get("allowedMinutes"), 40, 5, 120),
                "windowMinutes": bounded_int(rule.get("windowMinutes"), 120, 30, 360),
                "recoveryRequiredAfterLimit": bool(rule.get("recoveryRequiredAfterLimit", True)),
            }
        )
    if not rules:
        rules = fallback["digitalRules"]

    tasks = []
    for index, task in enumerate(raw.get("recoveryTasks") if isinstance(raw.get("recoveryTasks"), list) else []):
        if not isinstance(task, dict):
            continue
        task_type = task.get("type")
        if task_type not in TASK_TYPES:
            task_type = "walking" if "walk" in str(task).lower() else "breathing"
        verification = task.get("verification")
        if verification not in VERIFICATIONS:
            verification = "pedometer" if task_type == "walking" else "timer"
        tasks.append(
            {
                "id": str(task.get("id") or f"task_{index + 1}"),
                "type": task_type,
                "title": str(task.get("title") or task.get("task") or "Recovery Reset")[:48],
                "target": str(task.get("target") or task.get("task") or "Complete one small recovery action.")[:120],
                "durationMinutes": bounded_int(task.get("durationMinutes"), 10, 1, 90),
                "verification": verification,
                "rewardPoints": bounded_int(task.get("rewardPoints"), 20, 5, 60),
                "recoveryValue": bounded_int(task.get("recoveryValue"), 20, 5, 60),
            }
        )
    if not tasks:
        tasks = fallback["recoveryTasks"]

    schedule = []
    for index, slot in enumerate(raw.get("schedule") if isinstance(raw.get("schedule"), list) else []):
        if not isinstance(slot, dict):
            continue
        schedule.append(
            {
                "label": str(slot.get("label") or slot.get("task") or "Recovery window")[:48],
                "timeWindow": str(slot.get("timeWindow") or slot.get("time") or "20:00 - 21:00")[:32],
                "taskId": str(slot.get("taskId") or tasks[index % len(tasks)]["id"]),
            }
        )
    if not schedule:
        schedule = fallback["schedule"]

    buddy_actions_raw = raw.get("buddyActions")
    buddy_actions = []
    if isinstance(buddy_actions_raw, list):
        for item in buddy_actions_raw[:3]:
            if isinstance(item, dict):
                buddy_actions.append(str(item.get("action") or item)[:100])
            else:
                buddy_actions.append(str(item)[:100])
    if not buddy_actions:
        buddy_actions = fallback["buddyActions"]

    prompts = raw.get("supportPrompts") if isinstance(raw.get("supportPrompts"), list) else fallback["supportPrompts"]
    actions = raw.get("aiActions") if isinstance(raw.get("aiActions"), list) else fallback["aiActions"]
    normalized_actions = []
    for item in actions[:6]:
        if isinstance(item, dict):
            item = item.get("action")
        if item in {"start_focus", "start_recovery_task", "delay_app", "update_intention", "ask_buddy", "mood_checkin"}:
            normalized_actions.append(item)
    if not normalized_actions:
        normalized_actions = fallback["aiActions"]

    return {
        "explanation": str(raw.get("explanation") or fallback["explanation"])[:280],
        "primaryCauses": causes,
        "digitalRules": rules,
        "recoveryTasks": tasks,
        "schedule": schedule,
        "buddyActions": buddy_actions,
        "lockScreenMessage": str(raw.get("lockScreenMessage") or fallback["lockScreenMessage"])[:90],
        "supportPrompts": [str(item)[:120] for item in prompts[:5]],
        "dailyCheckInTime": str(raw.get("dailyCheckInTime") or fallback["dailyCheckInTime"])[:5],
        "emotionalSupportTone": str(raw.get("emotionalSupportTone") or fallback["emotionalSupportTone"])[:80],
        "aiActions": normalized_actions,
    }

@app.get("/")
def root() -> Dict[str, Any]:
    return {"ok": True, "service": "demb-ai-engine", "model": GROQ_MODEL}


@app.get("/health")
def health() -> Dict[str, Any]:
    return {"ok": True, "groqConfigured": bool(GROQ_API_KEY), "model": GROQ_MODEL}


@app.post("/support-chat")
def support_chat(payload: SupportChatRequest) -> Dict[str, Any]:
    text = payload.text.strip()
    if is_crisis_text(text):
        return {
            "reply": "This sounds urgent. Please contact local emergency services now and reach a trusted person near you. You do not have to handle this alone.",
            "suggestedAction": "ask_buddy",
            "riskLevel": "crisis",
        }

    fallback = {
        "reply": "I hear you. This can be a private space to let it out, and Demb chats are designed to expire after 24 hours. What feels hardest to hold right now?",
        "suggestedAction": None,
        "riskLevel": "none",
    }
    prompt = json.dumps(
        {
            "task": "Offer psychiatric-informed emotional support with reflective listening and one gentle question. Help the user vent and feel understood. Do not diagnose. Do not call yourself a psychiatrist or therapist. Do not give tasks unless explicitly asked or safety requires it. Return JSON only.",
            "privacyContext": "Demb is designed as a private support space. Local chat messages expire after 24 hours.",
            "latestUserText": text,
            "recentMessages": [message.model_dump() for message in payload.recentMessages[-10:]],
            "recoveryPlan": payload.recoveryPlan,
            "risk": payload.risk,
            "observationSummary": payload.observationSummary,
        },
        ensure_ascii=True,
    )
    result = groq_json(prompt, fallback, temperature=0.42)
    reply = str(result.get("reply") or fallback["reply"])[:600]
    action = result.get("suggestedAction")
    if action not in {"start_focus", "start_recovery_task", "delay_app", "update_intention", "ask_buddy", "mood_checkin"}:
        action = None
    risk_level = result.get("riskLevel") if result.get("riskLevel") in {"none", "elevated", "crisis"} else "none"
    return {"reply": reply, "suggestedAction": action, "riskLevel": risk_level}


@app.post("/recovery-plan")
def recovery_plan(payload: RecoveryPlanRequest) -> Dict[str, Any]:
    fallback = {
        "explanation": "A practical plan to reduce social overload and add short recovery actions.",
        "primaryCauses": ["excessive social media"],
        "digitalRules": [
            {
                "appCategory": "social_media",
                "appName": "Social Apps",
                "allowedMinutes": 40,
                "windowMinutes": 120,
                "recoveryRequiredAfterLimit": True,
            }
        ],
        "recoveryTasks": [
            {
                "type": "breathing",
                "title": "Breathing Gap",
                "target": "Breathe slowly for five minutes.",
                "durationMinutes": 5,
                "verification": "timer",
                "rewardPoints": 15,
                "recoveryValue": 15,
            },
            {
                "type": "walking",
                "title": "Gentle Walk",
                "target": "Walk for ten minutes.",
                "durationMinutes": 10,
                "verification": "pedometer",
                "rewardPoints": 25,
                "recoveryValue": 25,
            },
        ],
        "schedule": [{"label": "Evening check-in", "timeWindow": "20:00 - 21:00"}],
        "buddyActions": ["Ask one buddy for a check-in."],
        "lockScreenMessage": "Pause here. One small reset first.",
        "supportPrompts": ["What are you trying to feel by opening this app?"],
        "dailyCheckInTime": "20:00",
        "emotionalSupportTone": "calm, brief, practical",
        "aiActions": ["start_focus", "start_recovery_task", "delay_app", "mood_checkin"],
    }
    prompt = json.dumps(
        {
            "task": "Create a 48-hour digital wellness recovery plan. Return JSON only.",
            "userId": payload.userId,
            "risk": payload.risk,
            "userProfile": payload.userProfile,
            "latestBiometrics": payload.latestBiometrics,
            "observationSummary": payload.observationSummary,
        },
        ensure_ascii=True,
    )
    plan = normalize_plan(groq_json(prompt, fallback, temperature=0.32), fallback)
    return {"plan": plan}
