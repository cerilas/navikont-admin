import os

src_dir = '/Users/deniz/Documents/Navikont/navikont/navikont'

replacements = {
    '"Sunucu hatası (\\(code))"': 'AppStrings.t("Sunucu hatası") + " (\\(code))"',
    '"Veri yüklenemedi: \\(error.localizedDescription)"': 'AppStrings.t("Veri yüklenemedi") + ": \\(error.localizedDescription)"',
    '"Resim yüklenirken bir hata oluştu: \\(error.localizedDescription)"': 'AppStrings.t("Resim yüklenirken bir hata oluştu") + ": \\(error.localizedDescription)"',
    '"Anket yüklenemedi: \\(error.localizedDescription)"': 'AppStrings.t("Anket yüklenemedi") + ": \\(error.localizedDescription)"',
    '"Güncelleme sırasında bir hata oluştu: \\(error.localizedDescription)"': 'AppStrings.t("Güncelleme sırasında bir hata oluştu") + ": \\(error.localizedDescription)"',
    '"Bağlantı hatası: \\(error.localizedDescription)"': 'AppStrings.t("Bağlantı hatası") + ": \\(error.localizedDescription)"',
    '"Veri işleme hatası: \\(error.localizedDescription)"': 'AppStrings.t("Veri işleme hatası") + ": \\(error.localizedDescription)"',
    '"Gönderilemedi: \\(error.localizedDescription)"': 'AppStrings.t("Gönderilemedi") + ": \\(error.localizedDescription)"',
    '"Giriş başarısız: \\(error.localizedDescription)"': 'AppStrings.t("Giriş başarısız") + ": \\(error.localizedDescription)"',
    '"Güncellenemedi: \\(error.localizedDescription)"': 'AppStrings.t("Güncellenemedi") + ": \\(error.localizedDescription)"',
    '"Son Güncelleme: \\(formattedDate())"': 'AppStrings.t("Son Güncelleme:") + " \\(formattedDate())"',
    '"Gün: \\(enrollment.currentDay ?? 1)"': 'AppStrings.t("Gün:") + " \\(enrollment.currentDay ?? 1)"',
    '"Gün \\(enrollment.currentDay) • Aktif"': 'AppStrings.t("Gün") + " \\(enrollment.currentDay) • " + AppStrings.t("Aktif")'
}

for root, _, files in os.walk(src_dir):
    for f in files:
        if f.endswith('.swift'):
            path = os.path.join(root, f)
            with open(path, 'r') as file:
                content = file.read()
            
            new_content = content
            for old, new in replacements.items():
                new_content = new_content.replace(old, new)
            
            if new_content != content:
                with open(path, 'w') as file:
                    file.write(new_content)
                print(f'Updated interpolations in {f}')

