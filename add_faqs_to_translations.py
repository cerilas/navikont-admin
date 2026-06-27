import re

path = '/Users/deniz/Documents/navikont-admin-2/src/app/(app)/apps/[appId]/translations/TranslationsClientPage.tsx'
with open(path, 'r') as f:
    content = f.read()

# 1. Add faqs to props
content = content.replace('  diseases\n}: any) {', '  diseases,\n  faqs\n}: any) {')

# 2. Add to loadTranslations
load_faqs_code = """      } else if (activeTab === 'faqs') {
        if (!faqs || faqs.length === 0) {
          setTranslations({});
          return;
        }
        const entityIds = faqs.map((f: any) => f.id);
        const transMap = await getTranslationsBatch('core_faqs', entityIds, activeLang);
        setTranslations(transMap || {});
"""
content = content.replace("      } else if (activeTab === 'diseases') {", load_faqs_code + "      } else if (activeTab === 'diseases') {")

# 3. Add to handleSave
save_faqs_code = """      } else if (activeTab === 'faqs') {
        const inputs = Object.entries(translations).map(([key, translatedText]) => {
          const [entityId, fieldName] = key.split(':::');
          return { entityId, fieldName, translatedText };
        });
        const res = await saveTranslationsBatch(appId, 'core_faqs', activeLang, inputs);
        handleSaveResponse(res);
"""
content = content.replace("      } else if (activeTab === 'diseases') {", save_faqs_code + "      } else if (activeTab === 'diseases') {", 1) # Only first occurrence was replaced above? Wait, using replace will replace all. Let's do it carefully.

with open(path, 'w') as f:
    f.write(content)
