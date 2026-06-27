path = '/Users/deniz/Documents/Navikont/navikont/navikont/Theme.swift'
with open(path, 'r') as f:
    content = f.read()

new_method = """
    static var currentLocale: Locale {
        let lang = Locale.current.language.languageCode?.identifier ?? "tr"
        if lang.starts(with: "en") {
            return Locale(identifier: "en_US")
        }
        return Locale(identifier: "tr_TR")
    }
"""

content = content.replace('static func t(_ text: String) -> String {', new_method + '\n    static func t(_ text: String) -> String {')

with open(path, 'w') as f:
    f.write(content)

