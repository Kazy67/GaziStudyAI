# check_models.py
import os
from google import genai # The new SDK
from dotenv import load_dotenv

load_dotenv()
# The new way to authenticate
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

print("--- Listing Available Models ---")
try:
    for model in client.models.list():
        print(f"Model: {model.name}")
except Exception as e:
    print(f"Error: {e}")