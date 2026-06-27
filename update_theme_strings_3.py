import re

path = '/Users/deniz/Documents/Navikont/navikont/navikont/Theme.swift'
with open(path, 'r') as f:
    content = f.read()

new_entries = """
        "Günaydın 👋": "Good morning 👋",
        "İyi günler 👋": "Good afternoon 👋",
        "İyi akşamlar 👋": "Good evening 👋",
        "İyi geceler 🌙": "Good night 🌙"
"""

content = content.replace('"Otomatik": "Auto",', 
                          '"Otomatik": "Auto",' + new_entries)

with open(path, 'w') as f:
    f.write(content)

