import time
import os
from selenium import webdriver
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By

os.makedirs('screenshots', exist_ok=True)
options = Options()
options.add_argument('--headless=new')
options.add_argument('--window-size=1440,900')
driver = webdriver.Edge(options=options)

try:
    driver.get('http://localhost:5000')
    time.sleep(2)

    # 9.1 Home / Hero
    driver.save_screenshot('screenshots/9.1_home_hero.png')
    print('[OK] 9.1_home_hero.png captured')

    # 9.2 Live Inventory Overview
    driver.execute_script('window.scrollTo(0, 800);')
    time.sleep(1)
    driver.save_screenshot('screenshots/9.2_live_inventory_overview.png')
    print('[OK] 9.2_live_inventory_overview.png captured')

    # 9.3 Blood Availability & Charts
    driver.execute_script('window.scrollTo(0, 0);')
    for btn in driver.find_elements(By.TAG_NAME, 'button'):
        if 'Availability' in btn.text:
            btn.click()
            break
    time.sleep(2)
    driver.save_screenshot('screenshots/9.3_blood_availability_charts.png')
    print('[OK] 9.3_blood_availability_charts.png captured')

    # 9.4 Donor Registration
    for btn in driver.find_elements(By.TAG_NAME, 'button'):
        if 'Become a Donor' in btn.text or 'Join Donor' in btn.text or 'Donor Registration' in btn.text:
            btn.click()
            break
    time.sleep(2)
    driver.save_screenshot('screenshots/9.4_donor_registration.png')
    print('[OK] 9.4_donor_registration.png captured')

    # 9.5 Donation Centre Map
    driver.execute_script('window.scrollTo(0, 850);')
    time.sleep(1)
    driver.save_screenshot('screenshots/9.5_donation_center_map.png')
    print('[OK] 9.5_donation_center_map.png captured')

    # 9.6 Hospital Blood Request Form
    driver.execute_script('window.scrollTo(0, 0);')
    for btn in driver.find_elements(By.TAG_NAME, 'button'):
        if 'Hospital Order' in btn.text or 'Request Blood' in btn.text:
            btn.click()
            break
    time.sleep(2)
    driver.save_screenshot('screenshots/9.6_hospital_request_form.png')
    print('[OK] 9.6_hospital_request_form.png captured')

    # 9.7 Request Tracker
    for btn in driver.find_elements(By.TAG_NAME, 'button'):
        if 'Track' in btn.text:
            btn.click()
            break
    time.sleep(1)
    inputs = driver.find_elements(By.TAG_NAME, 'input')
    for inp in inputs:
        placeholder = inp.get_attribute('placeholder') or ''
        if 'REQ-' in placeholder or 'reference' in placeholder.lower():
            inp.send_keys('REQ-8021')
            break
    for b in driver.find_elements(By.TAG_NAME, 'button'):
        if 'Track Order' in b.text or b.text == 'Track':
            b.click()
            break
    time.sleep(1.5)
    driver.save_screenshot('screenshots/9.7_request_tracker.png')
    print('[OK] 9.7_request_tracker.png captured')

    # 9.8 Admin Login
    for btn in driver.find_elements(By.TAG_NAME, 'button'):
        if 'Admin Portal' in btn.text or 'Sign In' in btn.text:
            btn.click()
            break
    time.sleep(2)
    driver.save_screenshot('screenshots/9.8_admin_login.png')
    print('[OK] 9.8_admin_login.png captured')

    # Submit Admin Login
    for b in driver.find_elements(By.TAG_NAME, 'button'):
        if 'Authorize Command Access' in b.text or 'Sign In' in b.text:
            b.click()
            break
    time.sleep(2.5)
    # 9.9 Admin Dashboard (Requisition Triage)
    driver.save_screenshot('screenshots/9.9_admin_dashboard.png')
    print('[OK] 9.9_admin_dashboard.png captured')

    # 9.10 Inventory Mutation & Audit Ledger
    for b in driver.find_elements(By.TAG_NAME, 'button'):
        if 'Inventory Command' in b.text:
            b.click()
            break
    time.sleep(1.5)
    driver.save_screenshot('screenshots/9.10_inventory_mutation_audit.png')
    print('[OK] 9.10_inventory_mutation_audit.png captured')

    # 9.11 Donor Registry & CSV Export
    for b in driver.find_elements(By.TAG_NAME, 'button'):
        if 'Donor Registry' in b.text:
            b.click()
            break
    time.sleep(1.5)
    driver.save_screenshot('screenshots/9.11_donor_registry_csv.png')
    print('[OK] 9.11_donor_registry_csv.png captured')

    # 9.12 Validation / Error States
    # Navigate to donor registration and trigger validation error
    driver.get('http://localhost:5000')
    time.sleep(1.5)
    for btn in driver.find_elements(By.TAG_NAME, 'button'):
        if 'Become a Donor' in btn.text:
            btn.click()
            break
    time.sleep(1.5)
    # Fill with invalid age
    inputs = driver.find_elements(By.TAG_NAME, 'input')
    for inp in inputs:
        name_attr = inp.get_attribute('name') or ''
        type_attr = inp.get_attribute('type') or ''
        if 'name' in name_attr.lower():
            inp.send_keys('Test Candidate')
    # Click Submit to trigger validation error alert
    for b in driver.find_elements(By.TAG_NAME, 'button'):
        if 'Confirm' in b.text or 'Submit' in b.text or 'Register' in b.text:
            b.click()
            break
    time.sleep(1)
    driver.save_screenshot('screenshots/9.12_validation_error_states.png')
    print('[OK] 9.12_validation_error_states.png captured')

finally:
    driver.quit()
    print('Screenshot automation complete!')
