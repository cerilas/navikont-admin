import re

path = '/Users/deniz/Documents/Navikont/navikont/navikont/Theme.swift'
with open(path, 'r') as f:
    content = f.read()

new_entries = """
        "Sunucu hatası": "Server error",
        "Veri yüklenemedi": "Data could not be loaded",
        "Resim yüklenirken bir hata oluştu": "An error occurred while loading the image",
        "Anket yüklenemedi": "Survey could not be loaded",
        "Güncelleme sırasında bir hata oluştu": "An error occurred during update",
        "Bağlantı hatası": "Connection error",
        "Veri işleme hatası": "Data processing error",
        "Gönderilemedi": "Could not send",
        "Giriş başarısız": "Login failed",
        "Güncellenemedi": "Could not update",
        "Son Güncelleme:": "Last Update:",
        "Gün:": "Day:",
        "Gün": "Day",
        "Aktif": "Active"
"""

content = content.replace('"Değerleriniz normal.": "Your values are normal.",', '"Değerleriniz normal.": "Your values are normal.",\n' + new_entries)

with open(path, 'w') as f:
    f.write(content)

