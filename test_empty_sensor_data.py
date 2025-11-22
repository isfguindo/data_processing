#!/usr/bin/env python3
"""
Test AI analysis with empty sensor data to verify error handling
"""

import requests
import json

BASE_URL = "https://smartfarm-31.preview.emergentagent.com/api"
TEST_USER_EMAIL = "admin@agrofarm.com"
TEST_USER_PASSWORD = "admin123"

def test_empty_sensor_data():
    # Authenticate
    login_data = {"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    
    if response.status_code != 200:
        print("❌ Authentication failed")
        return
    
    token = response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Clear sensor_data collection by connecting to MongoDB directly
    from motor.motor_asyncio import AsyncIOMotorClient
    import asyncio
    import os
    
    async def clear_sensor_data():
        client = AsyncIOMotorClient("mongodb://localhost:27017")
        db = client["test_database"]
        result = await db.sensor_data.delete_many({})
        print(f"Cleared {result.deleted_count} sensor data records")
        client.close()
    
    # Run the async function
    asyncio.run(clear_sensor_data())
    
    # Test AI analysis with empty data
    print("\n=== Testing AI analysis with empty sensor data ===")
    
    # Test French
    response = requests.post(f"{BASE_URL}/sensors/ai-analysis", json={"language": "fr"}, headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        print("✅ French response:", result)
        
        if "message" in result and "aucune donnée" in result["message"].lower():
            print("✅ Correct French error message for empty data")
        else:
            print("⚠️  Unexpected response structure for empty data")
    else:
        print(f"❌ French request failed: {response.status_code}")
    
    # Test English
    response = requests.post(f"{BASE_URL}/sensors/ai-analysis", json={"language": "en"}, headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        print("✅ English response:", result)
        
        if "message" in result and "no sensor data" in result["message"].lower():
            print("✅ Correct English error message for empty data")
        else:
            print("⚠️  Unexpected response structure for empty data")
    else:
        print(f"❌ English request failed: {response.status_code}")

if __name__ == "__main__":
    test_empty_sensor_data()