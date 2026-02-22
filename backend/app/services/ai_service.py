"""
Gemini-powered AI Assistant.
Combines ML flood risk data with real-world observations from the user.
"""

import asyncio
from google import genai
from google.genai import types
from app.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

# Models tried in order — first one to succeed wins
MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]

SYSTEM_PROMPT = """You are SafeSphere AI, an emergency flood safety assistant for New Jersey drivers.
Your job is to help users navigate safely during flood events.

You have access to real-time flood risk data. When the user reports what they see (e.g., "I see water ahead"),
combine that observation with the ML risk data to give specific, actionable guidance.

Always:
- Be concise and direct — users may be in a vehicle
- Give a specific recommendation (turn around, take alternate route, proceed with caution, etc.)
- Mention the risk level if relevant
- Remind users: "Turn Around, Don't Drown" when risk is high
- Keep responses under 3 sentences unless critical detail is needed

Never:
- Speculate without data
- Recommend driving through flooded roads
- Give overly long responses when the user needs quick action
"""


async def _try_model(model: str, contents, config) -> str:
    """Attempt a single model call, raising on any error."""
    response = await client.aio.models.generate_content(
        model=model,
        contents=contents,
        config=config,
    )
    return response.text.strip()


async def get_ai_response(
    user_message: str,
    risk_score: float = 0.0,
    risk_level: str = "unknown",
    location: str = "your location",
    conversation_history: list = None,
) -> str:
    context_message = (
        f"[SYSTEM CONTEXT: Current ML flood risk at {location} — "
        f"Score: {risk_score}/80, Level: {risk_level.upper()}]"
    )

    history = []
    if conversation_history:
        for msg in conversation_history[-6:]:
            role = "user" if msg["role"] == "user" else "model"
            history.append(types.Content(role=role, parts=[types.Part(text=msg["content"])]))

    full_message = f"{context_message}\n\nUser says: {user_message}"
    contents = history + [types.Content(role="user", parts=[types.Part(text=full_message)])]

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        max_output_tokens=500,
        temperature=0.4,
        thinking_config=types.ThinkingConfig(thinking_budget=0),
    )

    last_error = None
    for model in MODELS:
        try:
            text = await asyncio.wait_for(_try_model(model, contents, config), timeout=15.0)
            if text:
                return text
        except asyncio.TimeoutError:
            print(f"[Gemini] Timeout on {model}")
            last_error = "timeout"
        except Exception as e:
            print(f"[Gemini] {model} failed — {type(e).__name__}: {e}")
            last_error = str(e)

    print(f"[Gemini] All models failed. Last error: {last_error}")
    return (
        "I'm having trouble connecting right now. "
        "If you see water on the road, do NOT drive through it. "
        "Turn around and find an alternate route. Stay safe."
    )
