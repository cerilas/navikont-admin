const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    const ddl = `
      create table if not exists patient_notifications
      (
          id             uuid                                               not null
              primary key,
          user_id        uuid                                               not null
              references core_users
                  on update cascade on delete restrict,
          enrollment_id  uuid
                                                                            references patient_app_enrollments
                                                                                on update cascade on delete set null,
          app_id         uuid
                                                                            references content_apps
                                                                                on update cascade on delete set null,
          app_version_id uuid
                                                                            references content_app_versions
                                                                                on update cascade on delete set null,
          channel        text                                               not null,
          title          text,
          body           text                                               not null,
          status         text                     default 'pending'::text   not null,
          scheduled_at   timestamp with time zone,
          sent_at        timestamp with time zone,
          read_at        timestamp with time zone,
          metadata       jsonb,
          created_at     timestamp with time zone default CURRENT_TIMESTAMP not null
      );

      alter table patient_notifications
          owner to postgres;
    `;
    console.log('Creating table patient_notifications...');
    await client.query(ddl);
    console.log('Table created successfully.');
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
