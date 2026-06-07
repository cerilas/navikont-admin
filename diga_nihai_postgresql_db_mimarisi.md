# DiGA Platformu Nihai PostgreSQL Veritabanı Mimarisi

Bu doküman, davranış temelli hastalıklara yönelik modüler DiGA benzeri sağlık uygulaması platformu için önerilen **nihai PostgreSQL veritabanı mimarisini** açıklar.

Sistem; hipertansiyon, obezite, aşırı aktif mesane gibi farklı hastalık alanları için ayrı ayrı dijital sağlık programları oluşturabilen, Süper Admin Paneli üzerinden dinamik şekilde yönetilebilen, doktor tarafından hastaya atanabilen ve mobil uygulama üzerinden kullanılabilen esnek bir platform olarak kurgulanmıştır.

---

## 1. Temel Mimari Prensip

Bu sistemde amaç, her hastalık için ayrı ayrı yazılım geliştirmek değil; tek bir altyapı üzerinde farklı hastalıklar için farklı app/programlar üretmektir.

Bu nedenle veritabanı şu prensibe göre tasarlanmalıdır:

```text
Platform genelinde kullanıcı hesabı tek olur.
Hasta profili genel olur.
App/program üyeliği ise app + app_version + enrollment bazlı olur.
```

Yani bir hasta sisteme bir kez kayıt olur, ancak farklı hastalık programlarına ayrı ayrı dahil edilebilir.

Örnek:

```text
Ahmet Yılmaz
   |
   |-- Hipertansiyon App v1.0 üyeliği
   |-- Obezite App v1.2 üyeliği
   |-- Aşırı Aktif Mesane App v1.0 üyeliği
```

Bu modelde en kritik tablo:

```text
patient.patient_app_enrollments
```

Bu tablo, hastanın belirli bir app/programa katılımını temsil eder.

---

## 2. Ana Kavramlar

| Kavram | Açıklama |
|---|---|
| User | Platformdaki gerçek kullanıcı hesabı |
| Patient Profile | Hastanın genel profili |
| Disease | Hipertansiyon, obezite, aşırı aktif mesane gibi hastalık alanı |
| App / Program | Hastalığa bağlı dijital müdahale programı |
| App Version | Programın belirli klinik/içerik versiyonu |
| Module | Video, HTML içerik, nefes egzersizi, soru-cevap gibi yapı taşı |
| Questionnaire | Dinamik form / klinik ölçek / anket |
| Check-in | Günlük veri girişi yapısı |
| Journey | Günlük/haftalık program akışı |
| Enrollment | Hastanın belirli app versiyonuna atanması |
| Measurement | Tansiyon, kilo, nabız, semptom skoru gibi ölçüm verisi |
| Risk Alert | Kritik veri veya kurala bağlı doktor uyarısı |

---

## 3. Schema Ayrımı

Büyük ve sürdürülebilir bir PostgreSQL yapısı için tabloları schema bazında ayırmak önerilir.

```sql
CREATE SCHEMA core;
CREATE SCHEMA medical;
CREATE SCHEMA content;
CREATE SCHEMA forms;
CREATE SCHEMA journey;
CREATE SCHEMA patient;
CREATE SCHEMA analytics;
CREATE SCHEMA audit;
```

| Schema | Amaç |
|---|---|
| core | Kullanıcı, rol, kurum, yetki, onam dokümanları |
| medical | Hastalık ve klinik sınıflama yapısı |
| content | App, app version, modül, rozet, bildirim şablonları |
| forms | Questionnaire, soru, cevap seçenekleri, check-in şablonları |
| journey | Program akışı ve gün/hafta bazlı içerik sıralaması |
| patient | Hasta profili, app üyelikleri, cevaplar, ölçümler, risk uyarıları |
| analytics | Mobil/web kullanım eventleri ve özet analitik veriler |
| audit | Kim neyi ne zaman değiştirdi kayıtları |

---

## 4. UUID ve Ortak Kolon Standardı

Tüm ana tablolarda UUID kullanılmalıdır.

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

Standart id yapısı:

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

Çoğu ana tabloda şu ortak kolonlar bulunmalıdır:

```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
created_by UUID NULL,
updated_by UUID NULL,
deleted_at TIMESTAMPTZ NULL,
is_active BOOLEAN NOT NULL DEFAULT true
```

Sağlık verilerinde fiziksel silme yerine mümkün olduğunca `deleted_at` ile soft delete tercih edilmelidir.

---

## 5. App İzlenebilirliği Kuralı

Bu sistemde her klinik, içerik, operasyon ve hasta kullanım verisinin hangi app’e ait olduğu izlenebilir olmalıdır.

Ancak her tabloda körü körüne `app_id` koymak yerine şu kural uygulanmalıdır:

```text
Content ana tablolarında: app_id
Version tablolarında: app_version_id
Hasta kullanım tablolarında: enrollment_id + app_id + app_version_id
```

Bu yapı hem veri bütünlüğü sağlar hem de raporlamayı hızlandırır.

### Neden sadece app_id yeterli değildir?

Çünkü sağlık uygulamasında içerik ve klinik kurallar zamanla değişebilir.

Örnek:

```text
Hipertansiyon App v1.0
- Check-in: tansiyon + nabız

Hipertansiyon App v1.1
- Check-in: tansiyon + nabız + stres seviyesi

Hipertansiyon App v1.2
- Risk eşikleri güncellendi
```

Bu nedenle hasta verisinde sadece `app_id` değil, mutlaka `app_version_id` de tutulmalıdır.

---

## 6. App Üyelik Mantığı

Üyelikler app’e özel olmalıdır.

Daha doğru ifade:

```text
Kullanıcı hesabı platform genelinde tek olur.
Hasta profili genel olur.
App/program üyeliği ise app + app_version + doctor + journey bazlı olur.
```

Bu nedenle `core.users` ile `patient.patient_app_enrollments` birbirinden ayrı düşünülmelidir.

```text
core.users
   ↓
patient.patient_profiles
   ↓
patient.patient_app_enrollments
```

Bir hasta aynı anda farklı programlara dahil olabilir:

```text
Hasta A
   |-- Hipertansiyon Programı / Dr. 1 / v1.0
   |-- Obezite Programı / Dr. 2 / v1.2
```

Aynı hasta, aynı app’e ileride tekrar da dahil olabilir. Bu nedenle `UNIQUE(patient_user_id, app_id)` gibi sert bir kısıt önerilmez. Bunun yerine aynı anda tek aktif üyelik için partial unique index kullanılabilir.

```sql
CREATE UNIQUE INDEX uniq_active_patient_app_enrollment
ON patient.patient_app_enrollments(patient_user_id, app_id)
WHERE status IN ('invited', 'active', 'paused');
```

---

## 7. Genel İlişki Şeması

```text
medical.diseases
   ↓
content.apps
   ↓
content.app_versions
   ↓
content.module_versions
forms.questionnaire_versions
forms.checkin_template_versions
journey.journeys
   ↓
patient.patient_app_enrollments
   ↓
patient.patient_module_progress
patient.questionnaire_responses
patient.checkin_submissions
patient.measurements
patient.risk_alerts
```

---

# 8. Core Schema

## 8.1. Kullanıcılar

```sql
CREATE TABLE core.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT,
    full_name TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK (
        user_type IN (
            'super_admin',
            'clinic_admin',
            'doctor',
            'patient',
            'content_editor',
            'medical_reviewer',
            'regulatory_reviewer'
        )
    ),
    status TEXT NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'passive', 'invited', 'suspended')
    ),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
```

---

## 8.2. Roller

```sql
CREATE TABLE core.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 8.3. Yetkiler

```sql
CREATE TABLE core.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    description TEXT
);
```

Örnek yetki kodları:

```text
disease.create
app.create
app.publish
module.create
module.update
questionnaire.review
doctor.assign_patient
patient.view_data
risk_alert.view
```

---

## 8.4. Rol-Yetki İlişkisi

```sql
CREATE TABLE core.role_permissions (
    role_id UUID REFERENCES core.roles(id),
    permission_id UUID REFERENCES core.permissions(id),
    PRIMARY KEY (role_id, permission_id)
);
```

---

## 8.5. Kullanıcı-Rol İlişkisi

```sql
CREATE TABLE core.user_roles (
    user_id UUID REFERENCES core.users(id),
    role_id UUID REFERENCES core.roles(id),
    PRIMARY KEY (user_id, role_id)
);
```

---

## 8.6. Kurumlar

```sql
CREATE TABLE core.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    organization_type TEXT CHECK (
        organization_type IN ('hospital', 'clinic', 'university', 'company', 'research_center')
    ),
    tax_number TEXT,
    country TEXT DEFAULT 'TR',
    city TEXT,
    address TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 8.7. Kullanıcı-Kurum İlişkisi

```sql
CREATE TABLE core.user_organizations (
    user_id UUID REFERENCES core.users(id),
    organization_id UUID REFERENCES core.organizations(id),
    role_in_organization TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, organization_id)
);
```

---

# 9. Medical Schema

## 9.1. Hastalık Kategorileri

```sql
CREATE TABLE medical.disease_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES medical.disease_categories(id),
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 9.2. Hastalıklar

```sql
CREATE TABLE medical.diseases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES medical.disease_categories(id),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icd_code TEXT,
    description TEXT,
    clinical_goal TEXT,
    behavior_intervention_scope JSONB,
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'draft' CHECK (
        status IN ('draft', 'review', 'active', 'passive', 'archived')
    ),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
```

Örnek `behavior_intervention_scope`:

```json
{
  "areas": [
    "nutrition",
    "physical_activity",
    "stress_management",
    "symptom_tracking",
    "sleep_hygiene"
  ]
}
```

---

# 10. Content Schema

## 10.1. Apps / Programs

```sql
CREATE TABLE content.apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disease_id UUID NOT NULL REFERENCES medical.diseases(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    short_description TEXT,
    clinical_description TEXT,
    target_user_profile JSONB,
    default_duration_days INTEGER,
    requires_doctor_assignment BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'draft' CHECK (
        status IN ('draft', 'review', 'testing', 'published', 'paused', 'archived')
    ),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(disease_id, slug)
);
```

---

## 10.2. App Versions

```sql
CREATE TABLE content.app_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL REFERENCES content.apps(id),
    version_number TEXT NOT NULL,
    version_name TEXT,
    changelog TEXT,
    status TEXT DEFAULT 'draft' CHECK (
        status IN (
            'draft',
            'clinical_review',
            'regulatory_review',
            'testing',
            'published',
            'deprecated',
            'archived'
        )
    ),
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES core.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(app_id, version_number)
);
```

---

## 10.3. Module Types

Modül tipleri dinamik olmalıdır. Video, HTML içerik, nefes egzersizi, check-in, timer gibi modüller burada tanımlanır.

```sql
CREATE TABLE content.module_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    schema_definition JSONB NOT NULL,
    ui_schema JSONB,
    is_system_type BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

Örnek modül tipleri:

```text
video
html_content
question_answer
questionnaire
checkin
breathing_exercise
timer
measurement_input
diary
quiz
goal
reminder
file_pdf
consent
risk_alert
```

---

## 10.4. Module Type Schema Örneği

```json
{
  "required": ["title", "videoUrl"],
  "properties": {
    "title": {
      "type": "string",
      "label": "Başlık"
    },
    "description": {
      "type": "html",
      "label": "Açıklama"
    },
    "videoUrl": {
      "type": "url",
      "label": "Video Linki"
    },
    "completionPercentage": {
      "type": "number",
      "default": 80
    }
  }
}
```

Bu yapı sayesinde Süper Admin Paneli, modül tipine göre form alanlarını otomatik üretebilir.

---

## 10.5. Modules

```sql
CREATE TABLE content.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL REFERENCES content.apps(id),
    module_type_id UUID NOT NULL REFERENCES content.module_types(id),
    name TEXT NOT NULL,
    internal_name TEXT,
    description TEXT,
    status TEXT DEFAULT 'draft' CHECK (
        status IN ('draft', 'review', 'published', 'archived')
    ),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
```

---

## 10.6. Module Versions

```sql
CREATE TABLE content.module_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES content.modules(id),
    app_version_id UUID NOT NULL REFERENCES content.app_versions(id),
    version_number INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    subtitle TEXT,
    content JSONB NOT NULL,
    settings JSONB,
    completion_rules JSONB,
    visibility_rules JSONB,
    status TEXT DEFAULT 'draft' CHECK (
        status IN ('draft', 'review', 'published', 'archived')
    ),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(module_id, app_version_id, version_number)
);
```

Örnek `content`:

```json
{
  "videoUrl": "https://cdn.example.com/video.mp4",
  "title": "Tuz Tüketimi ve Hipertansiyon",
  "descriptionHtml": "<p>Tuz tüketimi tansiyonu etkileyebilir...</p>",
  "thumbnailUrl": "https://cdn.example.com/thumb.jpg"
}
```

Örnek `completion_rules`:

```json
{
  "type": "video_watch_percentage",
  "value": 80,
  "requiresQuiz": true
}
```

---

## 10.7. App Version Modules

Bir app versiyonunun hangi modüllerden oluştuğunu ve sıralamayı tutar.

```sql
CREATE TABLE content.app_version_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_version_id UUID NOT NULL REFERENCES content.app_versions(id),
    module_version_id UUID NOT NULL REFERENCES content.module_versions(id),
    sort_order INTEGER NOT NULL,
    section_name TEXT,
    is_required BOOLEAN DEFAULT true,
    unlock_rules JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(app_version_id, module_version_id)
);
```

---

## 10.8. Badges

```sql
CREATE TABLE content.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID REFERENCES content.apps(id),
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    unlock_rule JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 10.9. Notification Templates

```sql
CREATE TABLE content.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID REFERENCES content.apps(id),
    code TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (
        channel IN ('push', 'sms', 'email', 'in_app')
    ),
    title_template TEXT,
    body_template TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

# 11. Forms Schema

## 11.1. Questionnaires

```sql
CREATE TABLE forms.questionnaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID REFERENCES content.apps(id),
    name TEXT NOT NULL,
    description TEXT,
    questionnaire_type TEXT CHECK (
        questionnaire_type IN (
            'baseline',
            'daily',
            'weekly',
            'monthly',
            'followup',
            'clinical_scale',
            'custom'
        )
    ),
    status TEXT DEFAULT 'draft' CHECK (
        status IN ('draft', 'review', 'published', 'archived')
    ),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 11.2. Questionnaire Versions

```sql
CREATE TABLE forms.questionnaire_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    questionnaire_id UUID NOT NULL REFERENCES forms.questionnaires(id),
    app_version_id UUID REFERENCES content.app_versions(id),
    version_number INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    description_html TEXT,
    scoring_method JSONB,
    risk_rules JSONB,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(questionnaire_id, version_number)
);
```

---

## 11.3. Questions

```sql
CREATE TABLE forms.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    questionnaire_version_id UUID NOT NULL REFERENCES forms.questionnaire_versions(id),
    question_key TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (
        question_type IN (
            'single_choice',
            'multiple_choice',
            'number',
            'text',
            'textarea',
            'date',
            'time',
            'datetime',
            'slider',
            'scale',
            'boolean',
            'matrix',
            'file',
            'measurement'
        )
    ),
    label TEXT NOT NULL,
    description_html TEXT,
    placeholder TEXT,
    is_required BOOLEAN DEFAULT false,
    sort_order INTEGER NOT NULL,
    validation_rules JSONB,
    display_rules JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(questionnaire_version_id, question_key)
);
```

---

## 11.4. Question Options

```sql
CREATE TABLE forms.question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES forms.questions(id) ON DELETE CASCADE,
    option_value TEXT NOT NULL,
    option_label TEXT NOT NULL,
    score NUMERIC,
    sort_order INTEGER,
    metadata JSONB
);
```

---

## 11.5. Check-in Templates

Check-in, her app için özel tanımlanabilen günlük/haftalık veri giriş yapısıdır.

```sql
CREATE TABLE forms.checkin_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL REFERENCES content.apps(id),
    name TEXT NOT NULL,
    description TEXT,
    frequency TEXT DEFAULT 'daily' CHECK (
        frequency IN ('daily', 'weekly', 'custom')
    ),
    streak_enabled BOOLEAN DEFAULT true,
    settings JSONB,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 11.6. Check-in Template Versions

```sql
CREATE TABLE forms.checkin_template_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkin_template_id UUID NOT NULL REFERENCES forms.checkin_templates(id),
    app_version_id UUID REFERENCES content.app_versions(id),
    version_number INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    description_html TEXT,
    streak_rules JSONB,
    reminder_rules JSONB,
    risk_rules JSONB,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(checkin_template_id, version_number)
);
```

---

## 11.7. Check-in Fields

```sql
CREATE TABLE forms.checkin_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkin_template_version_id UUID NOT NULL REFERENCES forms.checkin_template_versions(id),
    field_key TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (
        field_type IN (
            'number',
            'text',
            'boolean',
            'single_choice',
            'multiple_choice',
            'slider',
            'measurement',
            'time',
            'date'
        )
    ),
    label TEXT NOT NULL,
    unit TEXT,
    is_required BOOLEAN DEFAULT false,
    sort_order INTEGER NOT NULL,
    validation_rules JSONB,
    risk_rules JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(checkin_template_version_id, field_key)
);
```

---

# 12. Journey Schema

## 12.1. Journeys

```sql
CREATE TABLE journey.journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_version_id UUID NOT NULL REFERENCES content.app_versions(id),
    name TEXT NOT NULL,
    description TEXT,
    duration_days INTEGER,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 12.2. Journey Steps

```sql
CREATE TABLE journey.journey_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id UUID NOT NULL REFERENCES journey.journeys(id),
    day_number INTEGER,
    week_number INTEGER,
    step_order INTEGER NOT NULL,
    step_type TEXT NOT NULL CHECK (
        step_type IN ('module', 'questionnaire', 'checkin', 'message', 'reminder', 'branch')
    ),
    module_version_id UUID REFERENCES content.module_versions(id),
    questionnaire_version_id UUID REFERENCES forms.questionnaire_versions(id),
    checkin_template_version_id UUID REFERENCES forms.checkin_template_versions(id),
    title TEXT,
    description TEXT,
    unlock_rules JSONB,
    completion_rules JSONB,
    visibility_rules JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

Örnek `unlock_rules`:

```json
{
  "type": "after_day",
  "day": 3
}
```

Örnek koşullu açılma:

```json
{
  "type": "condition",
  "condition": {
    "source": "checkin",
    "field": "stress_level",
    "operator": ">=",
    "value": 7
  }
}
```

---

# 13. Rules

Kurallar; risk uyarısı, görünürlük, kilit açma, skor hesaplama, bildirim ve öneri üretme için kullanılır.

```sql
CREATE TABLE core.rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (
        rule_type IN ('risk', 'visibility', 'unlock', 'scoring', 'notification', 'recommendation')
    ),
    target_type TEXT NOT NULL CHECK (
        target_type IN ('app', 'module', 'questionnaire', 'checkin', 'journey', 'patient')
    ),
    target_id UUID,
    condition JSONB NOT NULL,
    actions JSONB NOT NULL,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

Örnek risk kuralı:

```json
{
  "condition": {
    "all": [
      {
        "field": "systolic",
        "operator": ">=",
        "value": 180
      }
    ]
  },
  "actions": [
    {
      "type": "notify_doctor",
      "severity": "high"
    },
    {
      "type": "show_patient_warning",
      "message": "Tansiyon değeriniz yüksek görünüyor. Lütfen hekiminizle iletişime geçin."
    }
  ]
}
```

---

# 14. Patient Schema

## 14.1. Patient Profiles

Genel hasta profili app’e özel değildir.

```sql
CREATE TABLE patient.patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES core.users(id),
    birth_date DATE,
    gender TEXT CHECK (gender IN ('female', 'male', 'other', 'unknown')),
    height_cm NUMERIC,
    weight_kg NUMERIC,
    blood_type TEXT,
    medical_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 14.2. Doctor Patients

Doktor-hasta ilişkisidir. Ancak operasyonel olarak asıl bağ çoğu zaman `enrollment_id` üzerinden yürütülmelidir.

```sql
CREATE TABLE patient.doctor_patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_user_id UUID NOT NULL REFERENCES core.users(id),
    patient_user_id UUID NOT NULL REFERENCES core.users(id),
    organization_id UUID REFERENCES core.organizations(id),
    status TEXT DEFAULT 'active' CHECK (
        status IN ('active', 'ended', 'transferred')
    ),
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    UNIQUE(doctor_user_id, patient_user_id, organization_id)
);
```

---

## 14.3. Patient App Enrollments

Bu tablo, app’e özel üyeliği temsil eder.

```sql
CREATE TABLE patient.patient_app_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_user_id UUID NOT NULL REFERENCES core.users(id),
    doctor_user_id UUID REFERENCES core.users(id),
    organization_id UUID REFERENCES core.organizations(id),

    app_id UUID NOT NULL REFERENCES content.apps(id),
    app_version_id UUID NOT NULL REFERENCES content.app_versions(id),
    journey_id UUID REFERENCES journey.journeys(id),

    status TEXT NOT NULL DEFAULT 'active' CHECK (
        status IN ('invited', 'active', 'paused', 'completed', 'cancelled', 'expired')
    ),

    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,

    current_day INTEGER DEFAULT 1,
    progress_percent NUMERIC DEFAULT 0,

    assigned_at TIMESTAMPTZ DEFAULT now(),
    activated_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    metadata JSONB,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

Aynı hastanın aynı app’te aynı anda tek aktif üyeliği olması için:

```sql
CREATE UNIQUE INDEX uniq_active_patient_app_enrollment
ON patient.patient_app_enrollments(patient_user_id, app_id)
WHERE status IN ('invited', 'active', 'paused');
```

---

## 14.4. Patient Module Progress

```sql
CREATE TABLE patient.patient_module_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    enrollment_id UUID NOT NULL REFERENCES patient.patient_app_enrollments(id),
    patient_user_id UUID NOT NULL REFERENCES core.users(id),

    app_id UUID NOT NULL REFERENCES content.apps(id),
    app_version_id UUID NOT NULL REFERENCES content.app_versions(id),

    module_version_id UUID NOT NULL REFERENCES content.module_versions(id),

    status TEXT DEFAULT 'not_started' CHECK (
        status IN ('not_started', 'in_progress', 'completed', 'skipped', 'locked')
    ),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    progress_percent NUMERIC DEFAULT 0,
    result_data JSONB,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(enrollment_id, module_version_id)
);
```

---

## 14.5. Questionnaire Responses

```sql
CREATE TABLE patient.questionnaire_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    enrollment_id UUID NOT NULL REFERENCES patient.patient_app_enrollments(id),
    patient_user_id UUID NOT NULL REFERENCES core.users(id),

    app_id UUID NOT NULL REFERENCES content.apps(id),
    app_version_id UUID NOT NULL REFERENCES content.app_versions(id),

    questionnaire_version_id UUID NOT NULL REFERENCES forms.questionnaire_versions(id),

    status TEXT DEFAULT 'completed' CHECK (
        status IN ('draft', 'completed', 'invalidated')
    ),
    total_score NUMERIC,
    risk_level TEXT CHECK (risk_level IN ('none', 'low', 'medium', 'high', 'critical')),

    submitted_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB
);
```

---

## 14.6. Questionnaire Answers

```sql
CREATE TABLE patient.questionnaire_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES patient.questionnaire_responses(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES forms.questions(id),
    answer_value JSONB NOT NULL,
    score NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

`questionnaire_answers` içinde ayrıca `app_id` zorunlu değildir. Çünkü üst tablo olan `questionnaire_responses` zaten `app_id`, `app_version_id` ve `enrollment_id` içerir.

---

## 14.7. Check-in Submissions

```sql
CREATE TABLE patient.checkin_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    enrollment_id UUID NOT NULL REFERENCES patient.patient_app_enrollments(id),
    patient_user_id UUID NOT NULL REFERENCES core.users(id),

    app_id UUID NOT NULL REFERENCES content.apps(id),
    app_version_id UUID NOT NULL REFERENCES content.app_versions(id),

    checkin_template_version_id UUID NOT NULL REFERENCES forms.checkin_template_versions(id),

    checkin_date DATE NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT now(),

    streak_day INTEGER,
    risk_level TEXT CHECK (risk_level IN ('none', 'low', 'medium', 'high', 'critical')),

    metadata JSONB,

    UNIQUE(enrollment_id, checkin_template_version_id, checkin_date)
);
```

---

## 14.8. Check-in Values

```sql
CREATE TABLE patient.checkin_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES patient.checkin_submissions(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES forms.checkin_fields(id),
    value JSONB NOT NULL,
    numeric_value NUMERIC,
    text_value TEXT,
    boolean_value BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

Burada hem `value JSONB` hem de `numeric_value`, `text_value`, `boolean_value` tutulur. Böylece sistem hem esnek hem de raporlanabilir olur.

---

## 14.9. Measurements

Tansiyon, kilo, nabız, glukoz, adım sayısı, işeme sayısı gibi ölçümler merkezi tabloda tutulmalıdır.

```sql
CREATE TABLE patient.measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_user_id UUID NOT NULL REFERENCES core.users(id),
    enrollment_id UUID REFERENCES patient.patient_app_enrollments(id),

    app_id UUID REFERENCES content.apps(id),
    app_version_id UUID REFERENCES content.app_versions(id),

    measurement_type TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,

    measured_at TIMESTAMPTZ NOT NULL,

    source TEXT DEFAULT 'manual' CHECK (
        source IN ('manual', 'device', 'wearable', 'imported', 'doctor')
    ),
    metadata JSONB,

    created_at TIMESTAMPTZ DEFAULT now()
);
```

`app_id` ve `app_version_id` burada nullable olabilir. Çünkü ölçüm app dışından da gelebilir. Ancak DiGA programı içinden geldiyse dolu olmalıdır.

Örnek `measurement_type` değerleri:

```text
systolic_bp
diastolic_bp
heart_rate
weight
bmi
waist_circumference
glucose
steps
urination_count
urgency_score
sleep_duration
stress_level
```

---

## 14.10. Patient Streaks

Streak kesinlikle user bazlı değil, enrollment bazlı olmalıdır.

```sql
CREATE TABLE patient.patient_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_user_id UUID NOT NULL REFERENCES core.users(id),
    enrollment_id UUID NOT NULL REFERENCES patient.patient_app_enrollments(id),

    app_id UUID NOT NULL REFERENCES content.apps(id),
    app_version_id UUID NOT NULL REFERENCES content.app_versions(id),

    streak_type TEXT DEFAULT 'checkin',
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completed_date DATE,
    freeze_count INTEGER DEFAULT 0,

    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(enrollment_id, streak_type)
);
```

---

## 14.11. Patient Badges

```sql
CREATE TABLE patient.patient_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_user_id UUID NOT NULL REFERENCES core.users(id),
    enrollment_id UUID REFERENCES patient.patient_app_enrollments(id),
    app_id UUID REFERENCES content.apps(id),
    app_version_id UUID REFERENCES content.app_versions(id),
    badge_id UUID NOT NULL REFERENCES content.badges(id),
    earned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(patient_user_id, badge_id, enrollment_id)
);
```

---

## 14.12. Notifications

```sql
CREATE TABLE patient.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES core.users(id),
    enrollment_id UUID REFERENCES patient.patient_app_enrollments(id),

    app_id UUID REFERENCES content.apps(id),
    app_version_id UUID REFERENCES content.app_versions(id),

    channel TEXT NOT NULL CHECK (
        channel IN ('push', 'sms', 'email', 'in_app')
    ),
    title TEXT,
    body TEXT NOT NULL,

    status TEXT DEFAULT 'pending' CHECK (
        status IN ('pending', 'sent', 'failed', 'read', 'cancelled')
    ),
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,

    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 14.13. Risk Alerts

```sql
CREATE TABLE patient.risk_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_user_id UUID NOT NULL REFERENCES core.users(id),
    doctor_user_id UUID REFERENCES core.users(id),
    enrollment_id UUID REFERENCES patient.patient_app_enrollments(id),

    app_id UUID REFERENCES content.apps(id),
    app_version_id UUID REFERENCES content.app_versions(id),

    source_type TEXT CHECK (
        source_type IN ('checkin', 'questionnaire', 'measurement', 'manual', 'rule_engine')
    ),
    source_id UUID,

    severity TEXT NOT NULL CHECK (
        severity IN ('low', 'medium', 'high', 'critical')
    ),
    title TEXT NOT NULL,
    message TEXT,

    status TEXT DEFAULT 'open' CHECK (
        status IN ('open', 'acknowledged', 'resolved', 'dismissed')
    ),

    triggered_at TIMESTAMPTZ DEFAULT now(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,

    metadata JSONB
);
```

---

## 14.14. Doctor Notes

```sql
CREATE TABLE patient.doctor_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_user_id UUID NOT NULL REFERENCES core.users(id),
    patient_user_id UUID NOT NULL REFERENCES core.users(id),
    enrollment_id UUID REFERENCES patient.patient_app_enrollments(id),
    app_id UUID REFERENCES content.apps(id),
    app_version_id UUID REFERENCES content.app_versions(id),
    note TEXT NOT NULL,
    visibility TEXT DEFAULT 'doctor_only' CHECK (
        visibility IN ('doctor_only', 'patient_visible', 'clinic_visible')
    ),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

# 15. Consent / KVKK Yapısı

## 15.1. Consent Documents

```sql
CREATE TABLE core.consent_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    content_html TEXT NOT NULL,
    version_number TEXT NOT NULL,
    document_type TEXT CHECK (
        document_type IN ('kvkk', 'gdpr', 'terms', 'medical_consent', 'research_consent')
    ),
    is_required BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'published',
    published_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(code, version_number)
);
```

---

## 15.2. Patient Consents

Onamlar genel veya app/enrollment özel olabilir.

```sql
CREATE TABLE patient.patient_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_user_id UUID NOT NULL REFERENCES core.users(id),

    app_id UUID REFERENCES content.apps(id),
    app_version_id UUID REFERENCES content.app_versions(id),
    enrollment_id UUID REFERENCES patient.patient_app_enrollments(id),

    consent_document_id UUID NOT NULL REFERENCES core.consent_documents(id),

    accepted BOOLEAN NOT NULL,
    accepted_at TIMESTAMPTZ DEFAULT now(),

    ip_address INET,
    user_agent TEXT,
    metadata JSONB
);
```

---

# 16. Analytics Schema

## 16.1. Events

```sql
CREATE TABLE analytics.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID REFERENCES core.users(id),
    enrollment_id UUID REFERENCES patient.patient_app_enrollments(id),

    app_id UUID REFERENCES content.apps(id),
    app_version_id UUID REFERENCES content.app_versions(id),

    event_name TEXT NOT NULL,
    event_properties JSONB,

    platform TEXT CHECK (
        platform IN ('ios', 'android', 'web', 'admin', 'doctor_panel')
    ),

    occurred_at TIMESTAMPTZ DEFAULT now()
);
```

Örnek eventler:

```text
app_opened
module_started
module_completed
video_played
checkin_submitted
questionnaire_submitted
streak_earned
notification_opened
risk_alert_triggered
```

---

# 17. Audit Schema

## 17.1. Audit Logs

```sql
CREATE TABLE audit.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES core.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

Örnek action değerleri:

```text
app.created
app.published
module.updated
questionnaire.approved
patient.assigned
risk_alert.resolved
consent.accepted
```

---

# 18. JSONB Kullanım Stratejisi

PostgreSQL JSONB bu sistem için çok önemlidir. Ancak her şeyi JSONB yapmak doğru değildir.

## JSONB Kullanılması Uygun Alanlar

| Alan | Neden |
|---|---|
| Modül içerikleri | Her modül tipi farklı alanlara sahip |
| Completion rules | Tamamlama mantığı dinamik |
| Visibility rules | Kullanıcı cevabına göre görünürlük değişebilir |
| Risk rules | Hastalık bazlı klinik eşikler değişebilir |
| UI schema | Admin paneli form üretimi için gerekli |
| Metadata | Ek alanlar için esneklik sağlar |
| Event properties | Analitik eventlerin içeriği değişkendir |

## JSONB Kullanılmaması Gereken Alanlar

| Alan | Neden |
|---|---|
| user_id | İlişkisel olmalı |
| patient_user_id | İlişkisel olmalı |
| app_id | İlişkisel ve filtrelenebilir olmalı |
| app_version_id | İzlenebilirlik için kolon olmalı |
| enrollment_id | Operasyonel ana bağ olmalı |
| Tarihler | Sorgu ve indeks için kolon olmalı |
| Sayısal ölçümler | Grafik ve raporlama için kolon olmalı |
| Risk seviyesi | Doktor paneli filtreleri için kolon olmalı |
| Status | Operasyonel filtreler için kolon olmalı |

---

# 19. İndeksleme Stratejisi

```sql
CREATE INDEX idx_apps_disease_id ON content.apps(disease_id);
CREATE INDEX idx_app_versions_app_id ON content.app_versions(app_id);

CREATE INDEX idx_modules_app_id ON content.modules(app_id);
CREATE INDEX idx_module_versions_app_version_id ON content.module_versions(app_version_id);

CREATE INDEX idx_questionnaires_app_id ON forms.questionnaires(app_id);
CREATE INDEX idx_questionnaire_versions_app_version_id ON forms.questionnaire_versions(app_version_id);

CREATE INDEX idx_checkin_templates_app_id ON forms.checkin_templates(app_id);
CREATE INDEX idx_checkin_template_versions_app_version_id ON forms.checkin_template_versions(app_version_id);

CREATE INDEX idx_enrollments_patient ON patient.patient_app_enrollments(patient_user_id);
CREATE INDEX idx_enrollments_doctor ON patient.patient_app_enrollments(doctor_user_id);
CREATE INDEX idx_enrollments_app ON patient.patient_app_enrollments(app_id);
CREATE INDEX idx_enrollments_app_version ON patient.patient_app_enrollments(app_version_id);
CREATE INDEX idx_enrollments_status ON patient.patient_app_enrollments(status);

CREATE INDEX idx_module_progress_enrollment ON patient.patient_module_progress(enrollment_id);
CREATE INDEX idx_module_progress_app ON patient.patient_module_progress(app_id);

CREATE INDEX idx_questionnaire_responses_enrollment ON patient.questionnaire_responses(enrollment_id);
CREATE INDEX idx_questionnaire_responses_app ON patient.questionnaire_responses(app_id);

CREATE INDEX idx_checkin_patient_date 
ON patient.checkin_submissions(patient_user_id, checkin_date);

CREATE INDEX idx_checkin_enrollment_date 
ON patient.checkin_submissions(enrollment_id, checkin_date);

CREATE INDEX idx_measurements_patient_type_date 
ON patient.measurements(patient_user_id, measurement_type, measured_at DESC);

CREATE INDEX idx_measurements_app_type_date 
ON patient.measurements(app_id, measurement_type, measured_at DESC);

CREATE INDEX idx_risk_alerts_doctor_status 
ON patient.risk_alerts(doctor_user_id, status, severity);

CREATE INDEX idx_risk_alerts_app_status 
ON patient.risk_alerts(app_id, status, severity);

CREATE INDEX idx_events_user_time 
ON analytics.events(user_id, occurred_at DESC);

CREATE INDEX idx_events_app_time 
ON analytics.events(app_id, occurred_at DESC);
```

JSONB için:

```sql
CREATE INDEX idx_module_content_gin 
ON content.module_versions USING GIN (content);

CREATE INDEX idx_event_properties_gin 
ON analytics.events USING GIN (event_properties);
```

---

# 20. Partition Önerisi

Zamanla çok büyüyecek tablolar partition edilmeye uygundur.

Özellikle:

```text
patient.checkin_submissions
patient.checkin_values
patient.measurements
patient.notifications
analytics.events
audit.audit_logs
```

Örnek partition yaklaşımı:

```sql
CREATE TABLE patient.measurements_partitioned (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    patient_user_id UUID NOT NULL,
    enrollment_id UUID,
    app_id UUID,
    app_version_id UUID,
    measurement_type TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    measured_at TIMESTAMPTZ NOT NULL,
    source TEXT DEFAULT 'manual',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (id, measured_at)
) PARTITION BY RANGE (measured_at);
```

---

# 21. Multi-Tenant Yapı

Birden fazla hastane, klinik veya kurum kullanılacaksa `organization_id` kritik tablolarda tutulmalıdır.

Özellikle:

```text
core.user_organizations
patient.doctor_patients
patient.patient_app_enrollments
patient.risk_alerts
analytics.events
```

MVP’de yetki kontrolü backend servis katmanında yapılabilir. Daha ileri aşamada PostgreSQL Row Level Security eklenebilir.

---

# 22. Row Level Security Önerisi

Doktor sadece kendi hastalarını ve kendi atadığı programları görmelidir.

İleri aşamada:

```sql
ALTER TABLE patient.patient_app_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient.checkin_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient.measurements ENABLE ROW LEVEL SECURITY;
```

MVP aşamasında RLS zorunlu değildir; ancak sağlık verisi ölçeklendikçe düşünülmelidir.

---

# 23. MVP İçin Minimum Tablo Seti

İlk geliştirme için tüm tablolar yerine aşağıdaki set yeterli olabilir.

```text
core.users
core.roles
core.user_roles
core.organizations
core.user_organizations

medical.disease_categories
medical.diseases

content.apps
content.app_versions
content.module_types
content.modules
content.module_versions
content.app_version_modules

forms.questionnaires
forms.questionnaire_versions
forms.questions
forms.question_options
forms.checkin_templates
forms.checkin_template_versions
forms.checkin_fields

journey.journeys
journey.journey_steps

patient.patient_profiles
patient.doctor_patients
patient.patient_app_enrollments
patient.patient_module_progress
patient.questionnaire_responses
patient.questionnaire_answers
patient.checkin_submissions
patient.checkin_values
patient.measurements
patient.patient_streaks
patient.risk_alerts

core.consent_documents
patient.patient_consents

audit.audit_logs
analytics.events
```

Rozetler, gelişmiş bildirim kuyrukları, detaylı notlar ve gelişmiş raporlama ikinci faza bırakılabilir.

---

# 24. Hipertansiyon Örneği

## Disease

```text
medical.diseases
name = Hipertansiyon
icd_code = I10
```

## App

```text
content.apps
name = 8 Haftalık Hipertansiyon Destek Programı
duration = 56 days
```

## App Version

```text
content.app_versions
version_number = 1.0.0
status = published
```

## Modules

```text
Video: Tuz Tüketimi ve Tansiyon
HTML: Hipertansiyonda Yaşam Tarzı
Breathing: 3 Dakikalık Nefes Egzersizi
```

## Check-in Fields

```text
systolic_bp
diastolic_bp
heart_rate
salt_consumption
stress_level
walking_done
```

## Journey

```text
Day 1:
- Onam
- Başlangıç anketi
- Tuz tüketimi videosu
- Günlük check-in

Day 2:
- Yaşam tarzı içeriği
- Nefes egzersizi
- Günlük check-in
```

## Enrollment

```text
Hasta A
Doktor B
App: Hipertansiyon Programı
App Version: v1.0.0
Start Date: 2026-06-04
```

## Hasta Verisi

```text
patient.checkin_submissions
patient.checkin_values
patient.measurements
patient.risk_alerts
```

---

# 25. Kritik Tasarım Kararları

## 25.1. Hasta app’e değil app version’a atanmalıdır

Doğru:

```text
patient_app_enrollments.app_version_id
```

Yanlış:

```text
Sadece app_id ile hasta atamak
```

Çünkü sağlık içeriği versiyonlanmalıdır.

---

## 25.2. Streak user bazlı değil enrollment bazlı olmalıdır

Yanlış:

```text
user_id bazlı tek streak
```

Doğru:

```text
enrollment_id bazlı streak
```

---

## 25.3. Ölçüm verileri normalize edilmelidir

Check-in cevapları JSONB içinde kalabilir ama tansiyon, kilo, nabız gibi kritik ölçümler ayrıca `patient.measurements` tablosuna yazılmalıdır.

Bu sayede:

```text
Grafikler hızlı çalışır.
Doktor paneli kolay rapor üretir.
Risk kuralları daha rahat çalışır.
Uzun dönem veri analizi yapılabilir.
```

---

## 25.4. Modül içeriği JSONB olmalıdır

Video, HTML içerik, nefes egzersizi, timer, soru-cevap ve diary modülleri birbirinden farklı alanlara sahiptir. Bu nedenle `content.module_versions.content` alanı JSONB olmalıdır.

---

## 25.5. Onamlar hem genel hem app özel olabilir

Genel onamlar:

```text
KVKK
Kullanım şartları
Genel sağlık verisi işleme onamı
```

App özel onamlar:

```text
Hipertansiyon programı bilgilendirme onamı
Obezite davranış değişikliği programı onamı
Araştırma katılım onamı
```

Bu yüzden `patient.patient_consents` tablosunda `app_id`, `app_version_id` ve `enrollment_id` opsiyonel olarak bulunmalıdır.

---

# 26. Nihai Mimari Özeti

Bu veritabanı mimarisi şu modeli kullanır:

```text
Hybrid Relational + JSONB Metadata-Driven Architecture
```

Yani:

## İlişkisel tutulanlar

```text
Kullanıcılar
Doktorlar
Hastalar
Kurumlar
Hastalıklar
App’ler
App versiyonları
Hasta app üyelikleri
Klinik ölçümler
Risk uyarıları
Onam kayıtları
```

## JSONB ile dinamik tutulanlar

```text
Modül içerikleri
Form ayarları
UI schema
Completion rules
Visibility rules
Risk rules
Event properties
Metadata
```

Bu sayede sistem:

```text
Yeni hastalık ekleyebilir.
Yeni app/program oluşturabilir.
Yeni modül tipi tanımlayabilir.
Formları kod yazmadan değiştirebilir.
Check-in alanlarını hastalık bazlı kurgulayabilir.
Hastayı belirli app version’a atayabilir.
Her programın ilerlemesini ayrı takip edebilir.
Doktor bazlı risk uyarıları üretebilir.
Mobil uygulamayı tek tutup içerikleri dinamik hale getirebilir.
```

---

# 27. En Net Tasarım Cümlesi

Bu platformda:

```text
User hesabı genel,
Patient profile genel,
App/program üyeliği app + app_version + enrollment bazlı,
Hasta kullanım verileri enrollment + app_id + app_version_id ile izlenebilir,
İçerik ve form yapıları ise JSONB destekli metadata-driven mimariyle dinamik olmalıdır.
```

Bu, DiGA benzeri modüler sağlık uygulaması platformu için en esnek, ölçeklenebilir ve klinik açıdan izlenebilir PostgreSQL yaklaşımıdır.
