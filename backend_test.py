#!/usr/bin/env python3
"""
Backend API Testing for Free Fire Account Management App
Testing focus areas:
1. DELETE /api/cuentas/{id} - Account deletion
2. POST /api/cuentas - Account creation with vendedor/comprador fields
3. GET /api/cuentas - Account listing with vendedor/comprador fields
4. PUT /api/cuentas/{id} - Account update with vendedor/comprador fields
5. Estados secundarios including "Pura"
"""

import requests
import json
from datetime import datetime
import sys

# Backend URL from environment
BACKEND_URL = "https://account-sync-pro-2.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_account_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "details": details
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        print()

    def test_health_check(self):
        """Test basic connectivity"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Health Check", True, f"Status: {data.get('estado')}")
                return True
            else:
                self.log_test("Health Check", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
            return False

    def test_create_account_with_new_fields(self):
        """Test POST /api/cuentas with vendedor/comprador fields and Pura estado"""
        test_data = {
            "titulo": "Test Account with New Fields",
            "plataforma": "Facebook",
            "email": "test@example.com",
            "password": "password123",
            "region": "SUR",
            "precio_compra": 10.0,
            "precio_venta": 20.0,
            "estado_principal": "Disponible",
            "estados_secundarios": ["Pura", "Correo Confirmado"],
            "vendedor": "Juan Perez",
            "comprador": "Maria Lopez"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/cuentas",
                json=test_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                account = response.json()
                self.test_account_id = account.get("id")
                
                # Verify all fields are present
                checks = []
                checks.append(("vendedor", account.get("vendedor") == "Juan Perez"))
                checks.append(("comprador", account.get("comprador") == "Maria Lopez"))
                checks.append(("estados_secundarios", "Pura" in account.get("estados_secundarios", [])))
                checks.append(("id_generated", bool(account.get("id"))))
                
                all_passed = all(check[1] for check in checks)
                failed_checks = [check[0] for check in checks if not check[1]]
                
                if all_passed:
                    self.log_test("Create Account with New Fields", True, 
                                f"Account created with ID: {self.test_account_id}")
                else:
                    self.log_test("Create Account with New Fields", False, 
                                f"Missing/incorrect fields: {failed_checks}")
                return all_passed
            else:
                self.log_test("Create Account with New Fields", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create Account with New Fields", False, f"Error: {str(e)}")
            return False

    def test_get_accounts_with_new_fields(self):
        """Test GET /api/cuentas returns vendedor/comprador fields"""
        try:
            response = requests.get(f"{self.base_url}/cuentas", timeout=10)
            
            if response.status_code == 200:
                accounts = response.json()
                
                if not accounts:
                    self.log_test("Get Accounts with New Fields", False, "No accounts found")
                    return False
                
                # Find our test account
                test_account = None
                for account in accounts:
                    if account.get("id") == self.test_account_id:
                        test_account = account
                        break
                
                if test_account:
                    # Verify fields are returned
                    has_vendedor = "vendedor" in test_account
                    has_comprador = "comprador" in test_account
                    has_estados = "estados_secundarios" in test_account
                    has_pura = "Pura" in test_account.get("estados_secundarios", [])
                    
                    if has_vendedor and has_comprador and has_estados and has_pura:
                        self.log_test("Get Accounts with New Fields", True, 
                                    f"All new fields present in response")
                        return True
                    else:
                        missing = []
                        if not has_vendedor: missing.append("vendedor")
                        if not has_comprador: missing.append("comprador")
                        if not has_estados: missing.append("estados_secundarios")
                        if not has_pura: missing.append("Pura in estados_secundarios")
                        
                        self.log_test("Get Accounts with New Fields", False, 
                                    f"Missing fields: {missing}")
                        return False
                else:
                    self.log_test("Get Accounts with New Fields", False, 
                                "Test account not found in response")
                    return False
            else:
                self.log_test("Get Accounts with New Fields", False, 
                            f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Get Accounts with New Fields", False, f"Error: {str(e)}")
            return False

    def test_update_account_with_new_fields(self):
        """Test PUT /api/cuentas/{id} with vendedor/comprador fields"""
        if not self.test_account_id:
            self.log_test("Update Account with New Fields", False, "No test account ID available")
            return False
            
        update_data = {
            "titulo": "Updated Test Account",
            "plataforma": "Google",
            "email": "updated@example.com",
            "password": "newpassword123",
            "region": "NORTE",
            "precio_compra": 15.0,
            "precio_venta": 25.0,
            "estado_principal": "Reservada",
            "estados_secundarios": ["Pura", "En Proceso"],
            "vendedor": "Carlos Rodriguez",
            "comprador": "Ana Martinez"
        }
        
        try:
            response = requests.put(
                f"{self.base_url}/cuentas/{self.test_account_id}",
                json=update_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                account = response.json()
                
                # Verify updates
                checks = []
                checks.append(("titulo", account.get("titulo") == "Updated Test Account"))
                checks.append(("vendedor", account.get("vendedor") == "Carlos Rodriguez"))
                checks.append(("comprador", account.get("comprador") == "Ana Martinez"))
                checks.append(("estado_principal", account.get("estado_principal") == "Reservada"))
                checks.append(("estados_pura", "Pura" in account.get("estados_secundarios", [])))
                
                all_passed = all(check[1] for check in checks)
                failed_checks = [check[0] for check in checks if not check[1]]
                
                if all_passed:
                    self.log_test("Update Account with New Fields", True, 
                                "All fields updated correctly")
                else:
                    self.log_test("Update Account with New Fields", False, 
                                f"Update failed for: {failed_checks}")
                return all_passed
            else:
                self.log_test("Update Account with New Fields", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Update Account with New Fields", False, f"Error: {str(e)}")
            return False

    def test_delete_account(self):
        """Test DELETE /api/cuentas/{id}"""
        if not self.test_account_id:
            self.log_test("Delete Account", False, "No test account ID available")
            return False
            
        try:
            # First verify account exists in the list
            list_response = requests.get(f"{self.base_url}/cuentas", timeout=10)
            if list_response.status_code != 200:
                self.log_test("Delete Account", False, "Could not get accounts list")
                return False
            
            accounts_before = list_response.json()
            found_before = any(acc.get("id") == self.test_account_id for acc in accounts_before)
            
            if not found_before:
                self.log_test("Delete Account", False, "Test account not found in list before deletion")
                return False
            
            # Delete the account
            delete_response = requests.delete(f"{self.base_url}/cuentas/{self.test_account_id}", timeout=10)
            
            if delete_response.status_code == 200:
                result = delete_response.json()
                
                # Verify account is actually deleted by checking the list
                list_response_after = requests.get(f"{self.base_url}/cuentas", timeout=10)
                if list_response_after.status_code == 200:
                    accounts_after = list_response_after.json()
                    found_after = any(acc.get("id") == self.test_account_id for acc in accounts_after)
                    
                    if not found_after:
                        self.log_test("Delete Account", True, 
                                    f"Account deleted successfully: {result.get('mensaje')}")
                        return True
                    else:
                        self.log_test("Delete Account", False, 
                                    "Account still exists in list after deletion")
                        return False
                else:
                    self.log_test("Delete Account", False, 
                                "Could not verify deletion - list request failed")
                    return False
            else:
                self.log_test("Delete Account", False, 
                            f"Delete failed - Status: {delete_response.status_code}, Response: {delete_response.text}")
                return False
                
        except Exception as e:
            self.log_test("Delete Account", False, f"Error: {str(e)}")
            return False

    def test_estados_secundarios_pura(self):
        """Test creating account specifically with 'Pura' estado"""
        test_data = {
            "titulo": "Pura Estado Test Account",
            "plataforma": "Facebook",
            "email": "pura@test.com",
            "password": "password123",
            "region": "SUR",
            "precio_compra": 5.0,
            "precio_venta": 15.0,
            "estado_principal": "Disponible",
            "estados_secundarios": ["Pura"]
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/cuentas",
                json=test_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                account = response.json()
                account_id = account.get("id")
                
                # Verify Pura is in estados_secundarios
                estados = account.get("estados_secundarios", [])
                has_pura = "Pura" in estados
                
                if has_pura:
                    self.log_test("Estados Secundarios - Pura", True, 
                                f"'Pura' estado successfully saved: {estados}")
                    
                    # Clean up - delete this test account
                    try:
                        requests.delete(f"{self.base_url}/cuentas/{account_id}", timeout=10)
                    except:
                        pass  # Cleanup failure is not critical
                    
                    return True
                else:
                    self.log_test("Estados Secundarios - Pura", False, 
                                f"'Pura' not found in estados: {estados}")
                    return False
            else:
                self.log_test("Estados Secundarios - Pura", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Estados Secundarios - Pura", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 60)
        print("BACKEND API TESTING - FREE FIRE ACCOUNT MANAGEMENT")
        print("=" * 60)
        print(f"Testing against: {self.base_url}")
        print()
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("Create Account with New Fields", self.test_create_account_with_new_fields),
            ("Get Accounts with New Fields", self.test_get_accounts_with_new_fields),
            ("Update Account with New Fields", self.test_update_account_with_new_fields),
            ("Delete Account", self.test_delete_account),
            ("Estados Secundarios - Pura", self.test_estados_secundarios_pura),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
            except Exception as e:
                self.log_test(test_name, False, f"Unexpected error: {str(e)}")
        
        # Summary
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        print()
        
        # Detailed results
        for result in self.test_results:
            print(f"{result['status']}: {result['test']}")
            if result['details']:
                print(f"   {result['details']}")
        
        return passed == total

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)