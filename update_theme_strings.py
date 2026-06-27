import re

path = '/Users/deniz/Documents/Navikont/navikont/navikont/Theme.swift'
with open(path, 'r') as f:
    content = f.read()

new_entries = """
        "gün": "days",
        "Aktive Et": "Activate",
        "Kapat": "Close",
        "E-posta": "Email",
        "Şifre": "Password",
        "Giriş": "Login"
"""

content = content.replace('"Sıkça Sorulan Sorular (SSS)": "Frequently Asked Questions (FAQ)"', 
                          '"Sıkça Sorulan Sorular (SSS)": "Frequently Asked Questions (FAQ)",' + new_entries)

with open(path, 'w') as f:
    f.write(content)

