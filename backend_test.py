#!/usr/bin/env python3
"""
Backend API Testing Script for AgroFarm Application
Tests specifically focused on tasks and employees endpoints as requested.
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
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend API Tests for Tasks and Employees")
        print(f"Base URL: {BASE_URL}")
        
        # Setup
        self.setup_test_users()
        
        if not self.authenticate_users():
            print("❌ Authentication failed, cannot continue with tests")
            return False
        
        # Run tests
        self.test_employees_endpoint()
        self.test_tasks_endpoint_admin()
        self.test_tasks_endpoint_employee()
        self.test_task_creation()
        self.test_task_status_update()
        self.test_task_deletion()
        
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