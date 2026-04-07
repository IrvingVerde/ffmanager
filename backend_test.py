#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Free Fire Account Management System
Tests all CRUD operations for transactions and accounts, plus financial dashboard
"""

import requests
import json
from datetime import datetime, timezone
import sys
import uuid

# Backend URL from frontend environment
BACKEND_URL = "https://account-sync-pro-2.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.created_transactions = []
        self.created_accounts = []
        
    def log(self, message, level="INFO"):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_health_check(self):
        """Test the health check endpoint"""
        self.log("Testing health check endpoint...")
        try:
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                if data.get("estado") == "ok":
                    self.log("✅ Health check passed")
                    return True
                else:
                    self.log(f"❌ Health check failed - unexpected response: {data}")
                    return False
            else:
                self.log(f"❌ Health check failed - status code: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Health check failed - error: {str(e)}")
            return False
    
    def test_initial_financial_dashboard(self):
        """Test financial dashboard with empty state"""
        self.log("Testing initial financial dashboard...")
        try:
            response = self.session.get(f"{self.base_url}/dashboard/financiero")
            if response.status_code == 200:
                data = response.json()
                expected_zeros = [
                    "total_ingresos_pen", "total_ingresos_usd",
                    "total_gastos_pen", "total_gastos_usd", 
                    "total_inversiones_pen", "total_inversiones_usd",
                    "ganancia_neta_pen", "ganancia_neta_usd"
                ]
                
                all_zero = all(data.get(field, -1) == 0.0 for field in expected_zeros)
                if all_zero:
                    self.log("✅ Initial financial dashboard shows all zeros")
                    return True
                else:
                    self.log(f"❌ Initial financial dashboard not all zeros: {data}")
                    return False
            else:
                self.log(f"❌ Financial dashboard failed - status code: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Financial dashboard failed - error: {str(e)}")
            return False
    
    def test_create_transactions(self):
        """Test creating different types of transactions"""
        self.log("Testing transaction creation...")
        
        transactions_to_create = [
            {
                "tipo": "ingreso",
                "monto": 1500.0,
                "moneda": "PEN",
                "fecha": datetime.now(timezone.utc).isoformat(),
                "notas": "Venta de cuenta premium"
            },
            {
                "tipo": "gasto", 
                "monto": 50.0,
                "moneda": "USD",
                "fecha": datetime.now(timezone.utc).isoformat(),
                "notas": "Compra de diamantes"
            },
            {
                "tipo": "inversion",
                "monto": 300.0,
                "moneda": "PEN", 
                "fecha": datetime.now(timezone.utc).isoformat(),
                "notas": "Inversión en nuevas cuentas"
            }
        ]
        
        success_count = 0
        for i, transaction_data in enumerate(transactions_to_create):
            try:
                response = self.session.post(
                    f"{self.base_url}/transacciones",
                    json=transaction_data
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("id") and data.get("tipo") == transaction_data["tipo"]:
                        self.created_transactions.append(data["id"])
                        self.log(f"✅ Transaction {i+1} created successfully: {data['tipo']} {data['monto']} {data['moneda']}")
                        success_count += 1
                    else:
                        self.log(f"❌ Transaction {i+1} creation failed - invalid response: {data}")
                else:
                    self.log(f"❌ Transaction {i+1} creation failed - status code: {response.status_code}")
                    self.log(f"Response: {response.text}")
                    
            except Exception as e:
                self.log(f"❌ Transaction {i+1} creation failed - error: {str(e)}")
        
        return success_count == len(transactions_to_create)
    
    def test_list_transactions(self):
        """Test listing all transactions"""
        self.log("Testing transaction listing...")
        try:
            response = self.session.get(f"{self.base_url}/transacciones")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) >= len(self.created_transactions):
                    self.log(f"✅ Transaction listing successful - found {len(data)} transactions")
                    return True
                else:
                    self.log(f"❌ Transaction listing failed - unexpected data: {data}")
                    return False
            else:
                self.log(f"❌ Transaction listing failed - status code: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Transaction listing failed - error: {str(e)}")
            return False
    
    def test_financial_dashboard_with_data(self):
        """Test financial dashboard after creating transactions"""
        self.log("Testing financial dashboard with transaction data...")
        try:
            response = self.session.get(f"{self.base_url}/dashboard/financiero")
            if response.status_code == 200:
                data = response.json()
                
                # Expected values based on our test transactions
                expected_ingresos_pen = 1500.0
                expected_gastos_usd = 50.0
                expected_inversiones_pen = 300.0
                expected_ganancia_pen = 1500.0 - 0.0  # ingresos - gastos in PEN
                expected_ganancia_usd = 0.0 - 50.0    # ingresos - gastos in USD
                
                checks = [
                    (data.get("total_ingresos_pen"), expected_ingresos_pen, "ingresos PEN"),
                    (data.get("total_gastos_usd"), expected_gastos_usd, "gastos USD"),
                    (data.get("total_inversiones_pen"), expected_inversiones_pen, "inversiones PEN"),
                    (data.get("ganancia_neta_pen"), expected_ganancia_pen, "ganancia neta PEN"),
                    (data.get("ganancia_neta_usd"), expected_ganancia_usd, "ganancia neta USD")
                ]
                
                all_correct = True
                for actual, expected, field_name in checks:
                    if actual != expected:
                        self.log(f"❌ {field_name}: expected {expected}, got {actual}")
                        all_correct = False
                    else:
                        self.log(f"✅ {field_name}: {actual}")
                
                if all_correct:
                    self.log("✅ Financial dashboard calculations are correct")
                    return True
                else:
                    self.log(f"❌ Financial dashboard has calculation errors")
                    return False
            else:
                self.log(f"❌ Financial dashboard failed - status code: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Financial dashboard failed - error: {str(e)}")
            return False
    
    def test_update_transaction(self):
        """Test updating a transaction"""
        if not self.created_transactions:
            self.log("❌ No transactions to update")
            return False
            
        self.log("Testing transaction update...")
        transaction_id = self.created_transactions[0]
        
        update_data = {
            "tipo": "ingreso",
            "monto": 2000.0,  # Changed from 1500
            "moneda": "PEN",
            "fecha": datetime.now(timezone.utc).isoformat(),
            "notas": "Venta de cuenta premium - actualizada"
        }
        
        try:
            response = self.session.put(
                f"{self.base_url}/transacciones/{transaction_id}",
                json=update_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("monto") == 2000.0 and "actualizada" in data.get("notas", ""):
                    self.log("✅ Transaction update successful")
                    return True
                else:
                    self.log(f"❌ Transaction update failed - data not updated correctly: {data}")
                    return False
            else:
                self.log(f"❌ Transaction update failed - status code: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Transaction update failed - error: {str(e)}")
            return False
    
    def test_delete_transaction(self):
        """Test deleting a transaction"""
        if len(self.created_transactions) < 2:
            self.log("❌ Not enough transactions to delete")
            return False
            
        self.log("Testing transaction deletion...")
        transaction_id = self.created_transactions[-1]  # Delete the last one
        
        try:
            response = self.session.delete(f"{self.base_url}/transacciones/{transaction_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "eliminada" in data.get("mensaje", "").lower():
                    self.log("✅ Transaction deletion successful")
                    self.created_transactions.remove(transaction_id)
                    return True
                else:
                    self.log(f"❌ Transaction deletion failed - unexpected response: {data}")
                    return False
            else:
                self.log(f"❌ Transaction deletion failed - status code: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Transaction deletion failed - error: {str(e)}")
            return False
    
    def test_create_accounts(self):
        """Test creating Free Fire accounts"""
        self.log("Testing account creation...")
        
        accounts_to_create = [
            {
                "titulo": "Cuenta Premium Facebook",
                "plataforma": "Facebook",
                "email": "premium.ff@gmail.com",
                "password": "SecurePass123!",
                "region": "South America",
                "estado": ["Disponible"],
                "notas": "Cuenta con muchos diamantes"
            },
            {
                "titulo": "Cuenta Elite Google",
                "plataforma": "Google", 
                "email": "elite.player@gmail.com",
                "password": "ElitePass456!",
                "region": "USA",
                "estado": ["Email Confirmado", "Disponible"],
                "notas": "Cuenta con skins raras"
            }
        ]
        
        success_count = 0
        for i, account_data in enumerate(accounts_to_create):
            try:
                response = self.session.post(
                    f"{self.base_url}/cuentas",
                    json=account_data
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("id") and data.get("email") == account_data["email"]:
                        self.created_accounts.append(data["id"])
                        self.log(f"✅ Account {i+1} created successfully: {data['titulo']}")
                        success_count += 1
                    else:
                        self.log(f"❌ Account {i+1} creation failed - invalid response: {data}")
                else:
                    self.log(f"❌ Account {i+1} creation failed - status code: {response.status_code}")
                    self.log(f"Response: {response.text}")
                    
            except Exception as e:
                self.log(f"❌ Account {i+1} creation failed - error: {str(e)}")
        
        return success_count == len(accounts_to_create)
    
    def test_list_accounts(self):
        """Test listing all accounts"""
        self.log("Testing account listing...")
        try:
            response = self.session.get(f"{self.base_url}/cuentas")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) >= len(self.created_accounts):
                    self.log(f"✅ Account listing successful - found {len(data)} accounts")
                    return True
                else:
                    self.log(f"❌ Account listing failed - unexpected data: {data}")
                    return False
            else:
                self.log(f"❌ Account listing failed - status code: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Account listing failed - error: {str(e)}")
            return False
    
    def test_get_specific_account(self):
        """Test getting a specific account by ID"""
        if not self.created_accounts:
            self.log("❌ No accounts to retrieve")
            return False
            
        self.log("Testing specific account retrieval...")
        account_id = self.created_accounts[0]
        
        try:
            response = self.session.get(f"{self.base_url}/cuentas/{account_id}")
            if response.status_code == 200:
                data = response.json()
                if data.get("id") == account_id:
                    self.log(f"✅ Specific account retrieval successful: {data['titulo']}")
                    return True
                else:
                    self.log(f"❌ Specific account retrieval failed - wrong account: {data}")
                    return False
            else:
                self.log(f"❌ Specific account retrieval failed - status code: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Specific account retrieval failed - error: {str(e)}")
            return False
    
    def test_update_account(self):
        """Test updating an account"""
        if not self.created_accounts:
            self.log("❌ No accounts to update")
            return False
            
        self.log("Testing account update...")
        account_id = self.created_accounts[0]
        
        update_data = {
            "titulo": "Cuenta Premium Facebook - VENDIDA",
            "plataforma": "Facebook",
            "email": "premium.ff@gmail.com",
            "password": "SecurePass123!",
            "region": "South America",
            "estado": ["Vendida"],
            "notas": "Cuenta vendida exitosamente"
        }
        
        try:
            response = self.session.put(
                f"{self.base_url}/cuentas/{account_id}",
                json=update_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if "Vendida" in data.get("estado", []) and "VENDIDA" in data.get("titulo", ""):
                    self.log("✅ Account update successful")
                    return True
                else:
                    self.log(f"❌ Account update failed - data not updated correctly: {data}")
                    return False
            else:
                self.log(f"❌ Account update failed - status code: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Account update failed - error: {str(e)}")
            return False
    
    def test_search_accounts(self):
        """Test searching accounts by email"""
        self.log("Testing account search...")
        search_query = "gmail.com"
        
        try:
            response = self.session.get(f"{self.base_url}/cuentas/buscar/{search_query}")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check if all returned accounts contain the search term
                    all_match = all(
                        search_query.lower() in account.get("email", "").lower() or
                        search_query.lower() in account.get("titulo", "").lower() or
                        search_query.lower() in account.get("notas", "").lower()
                        for account in data
                    )
                    if all_match:
                        self.log(f"✅ Account search successful - found {len(data)} matching accounts")
                        return True
                    else:
                        self.log(f"❌ Account search failed - some results don't match query")
                        return False
                else:
                    self.log(f"❌ Account search failed - unexpected data format: {data}")
                    return False
            else:
                self.log(f"❌ Account search failed - status code: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Account search failed - error: {str(e)}")
            return False
    
    def test_delete_account(self):
        """Test deleting an account"""
        if len(self.created_accounts) < 2:
            self.log("❌ Not enough accounts to delete")
            return False
            
        self.log("Testing account deletion...")
        account_id = self.created_accounts[-1]  # Delete the last one
        
        try:
            response = self.session.delete(f"{self.base_url}/cuentas/{account_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "eliminada" in data.get("mensaje", "").lower():
                    self.log("✅ Account deletion successful")
                    self.created_accounts.remove(account_id)
                    return True
                else:
                    self.log(f"❌ Account deletion failed - unexpected response: {data}")
                    return False
            else:
                self.log(f"❌ Account deletion failed - status code: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Account deletion failed - error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests in sequence"""
        self.log("=" * 60)
        self.log("STARTING COMPREHENSIVE BACKEND TESTING")
        self.log("=" * 60)
        
        tests = [
            ("Health Check", self.test_health_check),
            ("Initial Financial Dashboard", self.test_initial_financial_dashboard),
            ("Create Transactions", self.test_create_transactions),
            ("List Transactions", self.test_list_transactions),
            ("Financial Dashboard with Data", self.test_financial_dashboard_with_data),
            ("Update Transaction", self.test_update_transaction),
            ("Delete Transaction", self.test_delete_transaction),
            ("Create Accounts", self.test_create_accounts),
            ("List Accounts", self.test_list_accounts),
            ("Get Specific Account", self.test_get_specific_account),
            ("Update Account", self.test_update_account),
            ("Search Accounts", self.test_search_accounts),
            ("Delete Account", self.test_delete_account),
        ]
        
        results = {}
        for test_name, test_func in tests:
            self.log(f"\n--- Running: {test_name} ---")
            try:
                results[test_name] = test_func()
            except Exception as e:
                self.log(f"❌ {test_name} failed with exception: {str(e)}")
                results[test_name] = False
        
        # Summary
        self.log("\n" + "=" * 60)
        self.log("TEST RESULTS SUMMARY")
        self.log("=" * 60)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status}: {test_name}")
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 ALL TESTS PASSED!")
            return True
        else:
            self.log(f"⚠️  {total - passed} tests failed")
            return False

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)