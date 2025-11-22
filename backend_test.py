#!/usr/bin/env python3
"""
Backend API Testing Script for AgroFarm Application
Tests focused on IoT sensor endpoints and AI analysis functionality.
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import uuid

# Configuration
BASE_URL = "https://smartfarm-31.preview.emergentagent.com/api"
TEST_USER_EMAIL = "admin@agrofarm.com"
TEST_USER_PASSWORD = "admin123"
TEST_EMPLOYEE_EMAIL = "employee@agrofarm.com"
TEST_EMPLOYEE_PASSWORD = "employee123"

class BackendTester:
    def __init__(self):
        self.admin_token = None
        self.employee_token = None
        self.admin_user_id = None
        self.employee_user_id = None
        self.test_results = []
        self.created_task_id = None
        self.created_sensor_device_id = None
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def setup_test_users(self):
        """Create test users if they don't exist"""
        print("\n=== Setting up test users ===")
        
        # Try to create admin user
        admin_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "full_name": "Test Admin",
            "role": "admin"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/auth/register", json=admin_data)
            if response.status_code == 200:
                print("✅ Admin user created successfully")
            elif response.status_code == 400 and "already registered" in response.text:
                print("ℹ️  Admin user already exists")
            else:
                print(f"⚠️  Admin user creation response: {response.status_code}")
        except Exception as e:
            print(f"⚠️  Admin user creation error: {e}")
        
        # Try to create employee user
        employee_data = {
            "email": TEST_EMPLOYEE_EMAIL,
            "password": TEST_EMPLOYEE_PASSWORD,
            "full_name": "Test Employee",
            "role": "employee"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/auth/register", json=employee_data)
            if response.status_code == 200:
                print("✅ Employee user created successfully")
            elif response.status_code == 400 and "already registered" in response.text:
                print("ℹ️  Employee user already exists")
            else:
                print(f"⚠️  Employee user creation response: {response.status_code}")
        except Exception as e:
            print(f"⚠️  Employee user creation error: {e}")
    
    def authenticate_users(self):
        """Authenticate both admin and employee users"""
        print("\n=== Authenticating users ===")
        
        # Authenticate admin
        admin_login = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        
        try:
            response = requests.post(f"{BASE_URL}/auth/login", json=admin_login)
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data["token"]
                self.admin_user_id = data["user"]["id"]
                self.log_result("Admin Authentication", True, "Admin login successful")
            else:
                self.log_result("Admin Authentication", False, f"Admin login failed: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Admin Authentication", False, f"Admin login error: {e}")
            return False
        
        # Authenticate employee
        employee_login = {
            "email": TEST_EMPLOYEE_EMAIL,
            "password": TEST_EMPLOYEE_PASSWORD
        }
        
        try:
            response = requests.post(f"{BASE_URL}/auth/login", json=employee_login)
            if response.status_code == 200:
                data = response.json()
                self.employee_token = data["token"]
                self.employee_user_id = data["user"]["id"]
                self.log_result("Employee Authentication", True, "Employee login successful")
            else:
                self.log_result("Employee Authentication", False, f"Employee login failed: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Employee Authentication", False, f"Employee login error: {e}")
            return False
        
        return True
    
    def test_employees_endpoint(self):
        """Test /api/employees endpoint"""
        print("\n=== Testing /api/employees endpoint ===")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            response = requests.get(f"{BASE_URL}/employees", headers=headers)
            
            if response.status_code != 200:
                self.log_result("Employees Endpoint", False, f"HTTP {response.status_code}", response.text)
                return
            
            employees = response.json()
            
            # Check if list is non-empty
            if not employees:
                self.log_result("Employees List", False, "Employee list is empty")
                return
            
            self.log_result("Employees List", True, f"Found {len(employees)} employees")
            
            # Check required fields for each employee
            required_fields = ["id", "full_name", "email", "role", "tasks_completed", "performance_score"]
            
            for i, emp in enumerate(employees):
                missing_fields = [field for field in required_fields if field not in emp]
                
                if missing_fields:
                    self.log_result(f"Employee {i+1} Fields", False, f"Missing fields: {missing_fields}", emp)
                else:
                    self.log_result(f"Employee {i+1} Fields", True, "All required fields present")
                    
                    # Validate field types
                    if not isinstance(emp.get("tasks_completed"), int):
                        self.log_result(f"Employee {i+1} Tasks Completed Type", False, f"Expected int, got {type(emp.get('tasks_completed'))}")
                    
                    if not isinstance(emp.get("performance_score"), (int, float)):
                        self.log_result(f"Employee {i+1} Performance Score Type", False, f"Expected number, got {type(emp.get('performance_score'))}")
        
        except Exception as e:
            self.log_result("Employees Endpoint", False, f"Request error: {e}")
    
    def test_tasks_endpoint_admin(self):
        """Test /api/tasks endpoint with admin user (should see all tasks)"""
        print("\n=== Testing /api/tasks endpoint (Admin) ===")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            response = requests.get(f"{BASE_URL}/tasks", headers=headers)
            
            if response.status_code != 200:
                self.log_result("Tasks Endpoint (Admin)", False, f"HTTP {response.status_code}", response.text)
                return
            
            tasks = response.json()
            self.log_result("Tasks Endpoint (Admin)", True, f"Admin can access tasks endpoint, found {len(tasks)} tasks")
            
            # Store task count for comparison with employee
            self.admin_task_count = len(tasks)
            
        except Exception as e:
            self.log_result("Tasks Endpoint (Admin)", False, f"Request error: {e}")
    
    def test_tasks_endpoint_employee(self):
        """Test /api/tasks endpoint with employee user (should see only assigned tasks)"""
        print("\n=== Testing /api/tasks endpoint (Employee) ===")
        
        headers = {"Authorization": f"Bearer {self.employee_token}"}
        
        try:
            response = requests.get(f"{BASE_URL}/tasks", headers=headers)
            
            if response.status_code != 200:
                self.log_result("Tasks Endpoint (Employee)", False, f"HTTP {response.status_code}", response.text)
                return
            
            tasks = response.json()
            self.log_result("Tasks Endpoint (Employee)", True, f"Employee can access tasks endpoint, found {len(tasks)} tasks")
            
            # Verify all tasks are assigned to this employee
            for task in tasks:
                if task.get("assigned_to") != self.employee_user_id:
                    self.log_result("Employee Task Filtering", False, f"Employee sees task not assigned to them: {task.get('id')}")
                    return
            
            if tasks:
                self.log_result("Employee Task Filtering", True, "All visible tasks are correctly assigned to employee")
            else:
                self.log_result("Employee Task Filtering", True, "No tasks assigned to employee (expected)")
            
        except Exception as e:
            self.log_result("Tasks Endpoint (Employee)", False, f"Request error: {e}")
    
    def test_task_creation(self):
        """Test POST /api/tasks endpoint"""
        print("\n=== Testing task creation ===")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Create a task with valid data
        task_data = {
            "title": "Test Task Creation",
            "description": "This is a test task created by automated testing",
            "assigned_to": self.employee_user_id,
            "priority": "high",
            "due_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        }
        
        try:
            response = requests.post(f"{BASE_URL}/tasks", json=task_data, headers=headers)
            
            if response.status_code != 200:
                self.log_result("Task Creation", False, f"HTTP {response.status_code}", response.text)
                return
            
            created_task = response.json()
            
            # Check if response contains required fields
            if "id" not in created_task:
                self.log_result("Task Creation Response", False, "Response missing 'id' field", created_task)
                return
            
            self.created_task_id = created_task["id"]
            
            # Verify all sent fields are in response
            for field, value in task_data.items():
                if field not in created_task:
                    self.log_result("Task Creation Fields", False, f"Response missing field: {field}")
                    return
                elif created_task[field] != value:
                    self.log_result("Task Creation Values", False, f"Field {field}: expected {value}, got {created_task[field]}")
                    return
            
            self.log_result("Task Creation", True, f"Task created successfully with ID: {self.created_task_id}")
            
            # Verify task is stored in database by fetching it
            get_response = requests.get(f"{BASE_URL}/tasks", headers=headers)
            if get_response.status_code == 200:
                all_tasks = get_response.json()
                task_found = any(task["id"] == self.created_task_id for task in all_tasks)
                
                if task_found:
                    self.log_result("Task Storage Verification", True, "Created task found in database")
                else:
                    self.log_result("Task Storage Verification", False, "Created task not found in database")
            
        except Exception as e:
            self.log_result("Task Creation", False, f"Request error: {e}")
    
    def test_task_status_update(self):
        """Test PUT /api/tasks/{task_id} endpoint"""
        print("\n=== Testing task status update ===")
        
        if not self.created_task_id:
            self.log_result("Task Status Update", False, "No task ID available for testing")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            # Update task status to in_progress
            response = requests.put(
                f"{BASE_URL}/tasks/{self.created_task_id}?status=in_progress", 
                headers=headers
            )
            
            if response.status_code != 200:
                self.log_result("Task Status Update", False, f"HTTP {response.status_code}", response.text)
                return
            
            self.log_result("Task Status Update", True, "Task status update request successful")
            
            # Verify the status was actually updated in database
            get_response = requests.get(f"{BASE_URL}/tasks", headers=headers)
            if get_response.status_code == 200:
                all_tasks = get_response.json()
                updated_task = next((task for task in all_tasks if task["id"] == self.created_task_id), None)
                
                if updated_task:
                    if updated_task["status"] == "in_progress":
                        self.log_result("Task Status Verification", True, "Task status correctly updated to 'in_progress'")
                    else:
                        self.log_result("Task Status Verification", False, f"Expected status 'in_progress', got '{updated_task['status']}'")
                else:
                    self.log_result("Task Status Verification", False, "Updated task not found in database")
            
        except Exception as e:
            self.log_result("Task Status Update", False, f"Request error: {e}")
    
    def test_task_deletion(self):
        """Test DELETE /api/tasks/{task_id} endpoint"""
        print("\n=== Testing task deletion ===")
        
        if not self.created_task_id:
            self.log_result("Task Deletion", False, "No task ID available for testing")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            # Delete the task
            response = requests.delete(f"{BASE_URL}/tasks/{self.created_task_id}", headers=headers)
            
            if response.status_code != 200:
                self.log_result("Task Deletion", False, f"HTTP {response.status_code}", response.text)
                return
            
            self.log_result("Task Deletion", True, "Task deletion request successful")
            
            # Verify the task was actually deleted from database
            get_response = requests.get(f"{BASE_URL}/tasks", headers=headers)
            if get_response.status_code == 200:
                all_tasks = get_response.json()
                task_found = any(task["id"] == self.created_task_id for task in all_tasks)
                
                if not task_found:
                    self.log_result("Task Deletion Verification", True, "Task successfully deleted from database")
                else:
                    self.log_result("Task Deletion Verification", False, "Task still exists in database after deletion")
            
        except Exception as e:
            self.log_result("Task Deletion", False, f"Request error: {e}")
    
    def test_sensor_devices_creation(self):
        """Test POST /api/sensors/devices endpoint"""
        print("\n=== Testing sensor device creation ===")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test different sensor types
        sensor_types = [
            {
                "name": "Capteur Température Air Zone A",
                "sensor_type": "temperature_air",
                "location": "Zone A",
                "unit": "°C",
                "description": "Capteur de température de l'air"
            },
            {
                "name": "Capteur Humidité Sol Zone B", 
                "sensor_type": "soil_moisture",
                "location": "Zone B",
                "unit": "%",
                "description": "Capteur d'humidité du sol"
            },
            {
                "name": "Capteur pH Sol Zone C",
                "sensor_type": "ph_soil", 
                "location": "Zone C",
                "unit": "pH"
            }
        ]
        
        for i, device_data in enumerate(sensor_types):
            try:
                response = requests.post(f"{BASE_URL}/sensors/devices", json=device_data, headers=headers)
                
                if response.status_code != 200:
                    self.log_result(f"Sensor Device Creation {i+1}", False, f"HTTP {response.status_code}", response.text)
                    continue
                
                created_device = response.json()
                
                # Check required fields in response
                required_fields = ["id", "name", "sensor_type", "location", "created_at"]
                missing_fields = [field for field in required_fields if field not in created_device]
                
                if missing_fields:
                    self.log_result(f"Sensor Device {i+1} Response Fields", False, f"Missing fields: {missing_fields}")
                    continue
                
                # Verify created_at is ISO format
                try:
                    datetime.fromisoformat(created_device["created_at"].replace('Z', '+00:00'))
                    iso_valid = True
                except:
                    iso_valid = False
                
                if not iso_valid:
                    self.log_result(f"Sensor Device {i+1} ISO Format", False, f"created_at not in ISO format: {created_device['created_at']}")
                    continue
                
                # Store first device ID for later tests
                if i == 0:
                    self.created_sensor_device_id = created_device["id"]
                
                self.log_result(f"Sensor Device Creation {i+1}", True, f"Device created: {created_device['name']} (ID: {created_device['id']})")
                
            except Exception as e:
                self.log_result(f"Sensor Device Creation {i+1}", False, f"Request error: {e}")
    
    def test_sensor_devices_list(self):
        """Test GET /api/sensors/devices endpoint"""
        print("\n=== Testing sensor devices list ===")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            response = requests.get(f"{BASE_URL}/sensors/devices", headers=headers)
            
            if response.status_code != 200:
                self.log_result("Sensor Devices List", False, f"HTTP {response.status_code}", response.text)
                return
            
            devices = response.json()
            
            if not devices:
                self.log_result("Sensor Devices List", False, "No devices found (expected at least the created ones)")
                return
            
            self.log_result("Sensor Devices List", True, f"Found {len(devices)} sensor devices")
            
            # Verify no MongoDB _id field is present
            for device in devices:
                if "_id" in device:
                    self.log_result("Sensor Devices MongoDB ID", False, "Response contains MongoDB _id field")
                    return
            
            self.log_result("Sensor Devices MongoDB ID", True, "No MongoDB _id fields in response")
            
        except Exception as e:
            self.log_result("Sensor Devices List", False, f"Request error: {e}")
    
    def test_sensor_readings_ingestion(self):
        """Test POST /api/sensors/readings endpoint"""
        print("\n=== Testing sensor readings ingestion ===")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        if not self.created_sensor_device_id:
            self.log_result("Sensor Readings Ingestion", False, "No sensor device ID available for testing")
            return
        
        # Test with valid sensor_id
        reading_data = {
            "sensor_id": self.created_sensor_device_id,
            "value": 23.5
        }
        
        try:
            response = requests.post(f"{BASE_URL}/sensors/readings", json=reading_data, headers=headers)
            
            if response.status_code != 200:
                self.log_result("Sensor Reading Valid ID", False, f"HTTP {response.status_code}", response.text)
            else:
                reading_response = response.json()
                
                # Check required fields
                required_fields = ["sensor_id", "sensor_type", "value", "unit", "location", "timestamp"]
                missing_fields = [field for field in required_fields if field not in reading_response]
                
                if missing_fields:
                    self.log_result("Sensor Reading Response Fields", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_result("Sensor Reading Valid ID", True, f"Reading ingested successfully for sensor {self.created_sensor_device_id}")
            
        except Exception as e:
            self.log_result("Sensor Reading Valid ID", False, f"Request error: {e}")
        
        # Test with invalid sensor_id (should return 404)
        invalid_reading_data = {
            "sensor_id": "non-existent-sensor-id",
            "value": 25.0
        }
        
        try:
            response = requests.post(f"{BASE_URL}/sensors/readings", json=invalid_reading_data, headers=headers)
            
            if response.status_code == 404:
                self.log_result("Sensor Reading Invalid ID", True, "Correctly returned 404 for non-existent sensor_id")
            else:
                self.log_result("Sensor Reading Invalid ID", False, f"Expected 404, got {response.status_code}")
                
        except Exception as e:
            self.log_result("Sensor Reading Invalid ID", False, f"Request error: {e}")
    
    def test_sensor_readings_history(self):
        """Test GET /api/sensors/readings/{sensor_id} endpoint"""
        print("\n=== Testing sensor readings history ===")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        if not self.created_sensor_device_id:
            self.log_result("Sensor Readings History", False, "No sensor device ID available for testing")
            return
        
        try:
            response = requests.get(f"{BASE_URL}/sensors/readings/{self.created_sensor_device_id}?limit=10", headers=headers)
            
            if response.status_code != 200:
                self.log_result("Sensor Readings History", False, f"HTTP {response.status_code}", response.text)
                return
            
            readings = response.json()
            
            # Should have at least one reading from previous test
            if not readings:
                self.log_result("Sensor Readings History", False, "No readings found (expected at least one from ingestion test)")
                return
            
            # Verify all readings belong to the requested sensor
            for reading in readings:
                if reading.get("sensor_id") != self.created_sensor_device_id:
                    self.log_result("Sensor Readings Filtering", False, f"Found reading for different sensor: {reading.get('sensor_id')}")
                    return
                
                # Verify no MongoDB _id field
                if "_id" in reading:
                    self.log_result("Sensor Readings MongoDB ID", False, "Response contains MongoDB _id field")
                    return
            
            self.log_result("Sensor Readings History", True, f"Found {len(readings)} readings for sensor {self.created_sensor_device_id}")
            self.log_result("Sensor Readings Filtering", True, "All readings correctly filtered by sensor_id")
            self.log_result("Sensor Readings MongoDB ID", True, "No MongoDB _id fields in response")
            
        except Exception as e:
            self.log_result("Sensor Readings History", False, f"Request error: {e}")
    
    def test_sensor_ai_analysis(self):
        """Test POST /api/sensors/ai-analysis endpoint"""
        print("\n=== Testing sensor AI analysis ===")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # First, ensure we have some sensor data by calling /api/sensors/current
        try:
            current_response = requests.get(f"{BASE_URL}/sensors/current", headers=headers)
            if current_response.status_code == 200:
                print("✅ Generated some sensor data for AI analysis")
            else:
                print("⚠️  Could not generate sensor data, proceeding with existing data")
        except:
            print("⚠️  Error generating sensor data, proceeding with existing data")
        
        # Test with French language
        analysis_request = {"language": "fr"}
        
        try:
            response = requests.post(f"{BASE_URL}/sensors/ai-analysis", json=analysis_request, headers=headers)
            
            if response.status_code != 200:
                self.log_result("Sensor AI Analysis French", False, f"HTTP {response.status_code}", response.text)
            else:
                analysis_response = response.json()
                
                # Check required fields
                if "summary" not in analysis_response or "analysis" not in analysis_response:
                    self.log_result("Sensor AI Analysis Response Fields", False, f"Missing required fields. Got: {list(analysis_response.keys())}")
                else:
                    # Verify summary contains sensor data
                    summary = analysis_response["summary"]
                    analysis = analysis_response["analysis"]
                    
                    if not summary or not analysis:
                        self.log_result("Sensor AI Analysis Content", False, "Summary or analysis is empty")
                    else:
                        self.log_result("Sensor AI Analysis French", True, f"AI analysis completed successfully (summary: {len(summary)} chars, analysis: {len(analysis)} chars)")
                        
                        # Check if response is in French (basic check)
                        french_indicators = ["température", "humidité", "capteur", "recommand", "irrigation", "sol"]
                        has_french = any(indicator in analysis.lower() for indicator in french_indicators)
                        
                        if has_french:
                            self.log_result("Sensor AI Analysis Language", True, "Response appears to be in French")
                        else:
                            self.log_result("Sensor AI Analysis Language", False, "Response may not be in French as requested")
                
        except Exception as e:
            self.log_result("Sensor AI Analysis French", False, f"Request error: {e}")
        
        # Test with English language
        analysis_request_en = {"language": "en"}
        
        try:
            response = requests.post(f"{BASE_URL}/sensors/ai-analysis", json=analysis_request_en, headers=headers)
            
            if response.status_code != 200:
                self.log_result("Sensor AI Analysis English", False, f"HTTP {response.status_code}", response.text)
            else:
                analysis_response = response.json()
                
                if "summary" in analysis_response and "analysis" in analysis_response:
                    self.log_result("Sensor AI Analysis English", True, "AI analysis completed successfully in English")
                else:
                    self.log_result("Sensor AI Analysis English", False, "Missing required fields in response")
                
        except Exception as e:
            self.log_result("Sensor AI Analysis English", False, f"Request error: {e}")
    
    def test_existing_sensor_endpoints(self):
        """Test existing sensor endpoints to ensure they still work"""
        print("\n=== Testing existing sensor endpoints ===")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test /api/sensors/current
        try:
            response = requests.get(f"{BASE_URL}/sensors/current", headers=headers)
            
            if response.status_code != 200:
                self.log_result("Sensors Current Endpoint", False, f"HTTP {response.status_code}", response.text)
            else:
                current_sensors = response.json()
                
                if not current_sensors:
                    self.log_result("Sensors Current Data", False, "No sensor data returned")
                else:
                    # Verify no MongoDB _id fields
                    has_mongo_id = any("_id" in sensor for sensor in current_sensors)
                    
                    if has_mongo_id:
                        self.log_result("Sensors Current MongoDB ID", False, "Response contains MongoDB _id field")
                    else:
                        self.log_result("Sensors Current Endpoint", True, f"Current sensors endpoint working, returned {len(current_sensors)} sensors")
                        self.log_result("Sensors Current MongoDB ID", True, "No MongoDB _id fields in response")
                
        except Exception as e:
            self.log_result("Sensors Current Endpoint", False, f"Request error: {e}")
        
        # Test /api/sensors/history
        try:
            response = requests.get(f"{BASE_URL}/sensors/history?sensor_type=temperature&limit=10", headers=headers)
            
            if response.status_code != 200:
                self.log_result("Sensors History Endpoint", False, f"HTTP {response.status_code}", response.text)
            else:
                history_sensors = response.json()
                
                # Verify no MongoDB _id fields
                has_mongo_id = any("_id" in sensor for sensor in history_sensors)
                
                if has_mongo_id:
                    self.log_result("Sensors History MongoDB ID", False, "Response contains MongoDB _id field")
                else:
                    self.log_result("Sensors History Endpoint", True, f"History sensors endpoint working, returned {len(history_sensors)} sensors")
                    self.log_result("Sensors History MongoDB ID", True, "No MongoDB _id fields in response")
                
        except Exception as e:
            self.log_result("Sensors History Endpoint", False, f"Request error: {e}")
    
    def test_stock_ai_alerts_empty_stock(self):
        """Test /api/stock/ai-alerts with empty stock or all levels OK"""
        print("\n=== Testing stock AI alerts with empty/OK stock ===")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # First, clear any existing stock items to ensure clean test
        try:
            # Get existing stock items
            get_response = requests.get(f"{BASE_URL}/stock", headers=headers)
            if get_response.status_code == 200:
                existing_items = get_response.json()
                # Delete existing items for clean test
                for item in existing_items:
                    requests.delete(f"{BASE_URL}/stock/{item['id']}", headers=headers)
        except:
            pass  # Ignore errors, proceed with test
        
        # Test with French language
        alert_request = {"language": "fr"}
        
        try:
            response = requests.post(f"{BASE_URL}/stock/ai-alerts", json=alert_request, headers=headers)
            
            if response.status_code != 200:
                self.log_result("Stock AI Alerts Empty (FR)", False, f"HTTP {response.status_code}", response.text)
                return
            
            alert_response = response.json()
            
            # Check required fields
            required_fields = ["critical_items", "warning_items", "summary", "recommendations"]
            missing_fields = [field for field in required_fields if field not in alert_response]
            
            if missing_fields:
                self.log_result("Stock AI Alerts Response Fields", False, f"Missing fields: {missing_fields}")
                return
            
            # Verify empty arrays for critical and warning items
            if alert_response["critical_items"] != []:
                self.log_result("Stock AI Alerts Critical Items Empty", False, f"Expected empty array, got: {alert_response['critical_items']}")
                return
            
            if alert_response["warning_items"] != []:
                self.log_result("Stock AI Alerts Warning Items Empty", False, f"Expected empty array, got: {alert_response['warning_items']}")
                return
            
            # Verify summary is non-empty
            if not alert_response["summary"]:
                self.log_result("Stock AI Alerts Summary Non-Empty", False, "Summary should be non-empty")
                return
            
            # Verify recommendations is empty string
            if alert_response["recommendations"] != "":
                self.log_result("Stock AI Alerts Recommendations Empty", False, f"Expected empty string, got: {alert_response['recommendations']}")
                return
            
            self.log_result("Stock AI Alerts Empty (FR)", True, "Empty stock case handled correctly with French language")
            
        except Exception as e:
            self.log_result("Stock AI Alerts Empty (FR)", False, f"Request error: {e}")
    
    def test_stock_ai_alerts_with_items(self):
        """Test /api/stock/ai-alerts with critical and warning items"""
        print("\n=== Testing stock AI alerts with critical and warning items ===")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Create test stock items with different levels
        test_items = [
            {
                "item_name": "Graines de Tomates",
                "category": "seeds",
                "quantity": 5.0,  # Critical: <= min_threshold (10)
                "unit": "kg",
                "min_threshold": 10.0,
                "price_per_unit": 25.0,
                "currency": "EUR"
            },
            {
                "item_name": "Engrais NPK",
                "category": "fertilizers", 
                "quantity": 11.0,  # Warning: > min_threshold but <= 1.2 * min_threshold (12)
                "unit": "kg",
                "min_threshold": 10.0,
                "price_per_unit": 15.0,
                "currency": "EUR"
            },
            {
                "item_name": "Pesticide Bio",
                "category": "pesticides",
                "quantity": 2.0,  # Critical: <= min_threshold (8)
                "unit": "L",
                "min_threshold": 8.0,
                "price_per_unit": 45.0,
                "currency": "EUR"
            },
            {
                "item_name": "Outils de Jardinage",
                "category": "tools",
                "quantity": 25.0,  # OK: > 1.2 * min_threshold (24)
                "unit": "pieces",
                "min_threshold": 20.0,
                "price_per_unit": 12.0,
                "currency": "EUR"
            }
        ]
        
        created_item_ids = []
        
        # Create the test items
        for item_data in test_items:
            try:
                response = requests.post(f"{BASE_URL}/stock", json=item_data, headers=headers)
                if response.status_code == 200:
                    created_item = response.json()
                    created_item_ids.append(created_item["id"])
                    print(f"✅ Created test item: {item_data['item_name']}")
                else:
                    print(f"⚠️  Failed to create test item: {item_data['item_name']}")
            except Exception as e:
                print(f"⚠️  Error creating test item {item_data['item_name']}: {e}")
        
        # Test with French language
        alert_request = {"language": "fr"}
        
        try:
            response = requests.post(f"{BASE_URL}/stock/ai-alerts", json=alert_request, headers=headers)
            
            if response.status_code != 200:
                self.log_result("Stock AI Alerts With Items (FR)", False, f"HTTP {response.status_code}", response.text)
                return
            
            alert_response = response.json()
            
            # Verify critical items (should have 2: Graines de Tomates and Pesticide Bio)
            critical_items = alert_response.get("critical_items", [])
            expected_critical = 2
            
            if len(critical_items) != expected_critical:
                self.log_result("Stock AI Alerts Critical Count", False, f"Expected {expected_critical} critical items, got {len(critical_items)}")
            else:
                self.log_result("Stock AI Alerts Critical Count", True, f"Correctly identified {expected_critical} critical items")
            
            # Verify warning items (should have 1: Engrais NPK)
            warning_items = alert_response.get("warning_items", [])
            expected_warning = 1
            
            if len(warning_items) != expected_warning:
                self.log_result("Stock AI Alerts Warning Count", False, f"Expected {expected_warning} warning items, got {len(warning_items)}")
            else:
                self.log_result("Stock AI Alerts Warning Count", True, f"Correctly identified {expected_warning} warning items")
            
            # Verify no MongoDB _id fields
            all_items = critical_items + warning_items
            has_mongo_id = any("_id" in item for item in all_items)
            
            if has_mongo_id:
                self.log_result("Stock AI Alerts MongoDB ID", False, "Response contains MongoDB _id field")
            else:
                self.log_result("Stock AI Alerts MongoDB ID", True, "No MongoDB _id fields in response")
            
            # Verify recommendations are provided (should be non-empty)
            recommendations = alert_response.get("recommendations", "")
            if not recommendations:
                self.log_result("Stock AI Alerts Recommendations", False, "Recommendations should be non-empty when there are critical/warning items")
            else:
                self.log_result("Stock AI Alerts Recommendations", True, f"AI recommendations provided ({len(recommendations)} characters)")
                
                # Check if response is in French (basic check)
                french_indicators = ["stock", "réapprovision", "recommand", "critique", "seuil", "rupture"]
                has_french = any(indicator in recommendations.lower() for indicator in french_indicators)
                
                if has_french:
                    self.log_result("Stock AI Alerts Language (FR)", True, "Recommendations appear to be in French")
                else:
                    self.log_result("Stock AI Alerts Language (FR)", False, "Recommendations may not be in French as requested")
            
        except Exception as e:
            self.log_result("Stock AI Alerts With Items (FR)", False, f"Request error: {e}")
        
        # Test with English language
        alert_request_en = {"language": "en"}
        
        try:
            response = requests.post(f"{BASE_URL}/stock/ai-alerts", json=alert_request_en, headers=headers)
            
            if response.status_code != 200:
                self.log_result("Stock AI Alerts With Items (EN)", False, f"HTTP {response.status_code}", response.text)
            else:
                alert_response = response.json()
                recommendations = alert_response.get("recommendations", "")
                
                if recommendations:
                    # Check if response is in English (basic check)
                    english_indicators = ["stock", "restock", "recommend", "critical", "threshold", "shortage"]
                    has_english = any(indicator in recommendations.lower() for indicator in english_indicators)
                    
                    if has_english:
                        self.log_result("Stock AI Alerts Language (EN)", True, "Recommendations appear to be in English")
                    else:
                        self.log_result("Stock AI Alerts Language (EN)", False, "Recommendations may not be in English as requested")
                    
                    self.log_result("Stock AI Alerts With Items (EN)", True, "English language request handled correctly")
                else:
                    self.log_result("Stock AI Alerts With Items (EN)", False, "No recommendations provided for English request")
                
        except Exception as e:
            self.log_result("Stock AI Alerts With Items (EN)", False, f"Request error: {e}")
        
        # Cleanup: Delete created test items
        for item_id in created_item_ids:
            try:
                requests.delete(f"{BASE_URL}/stock/{item_id}", headers=headers)
            except:
                pass  # Ignore cleanup errors
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend API Tests for IoT Sensor Endpoints and AI Analysis")
        print(f"Base URL: {BASE_URL}")
        
        # Setup
        self.setup_test_users()
        
        if not self.authenticate_users():
            print("❌ Authentication failed, cannot continue with tests")
            return False
        
        # Run sensor tests (new endpoints)
        self.test_sensor_devices_creation()
        self.test_sensor_devices_list()
        self.test_sensor_readings_ingestion()
        self.test_sensor_readings_history()
        self.test_sensor_ai_analysis()
        
        # Test existing sensor endpoints
        self.test_existing_sensor_endpoints()
        
        # Summary
        print("\n" + "="*50)
        print("TEST SUMMARY")
        print("="*50)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        if total - passed > 0:
            print("\nFailed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  ❌ {result['test']}: {result['message']}")
        
        return passed == total

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)