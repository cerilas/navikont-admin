const apn = require('@parse/node-apn');
require('dotenv').config();

async function testPush() {
  const tokens = [
    '411184fd680b67c5c11ff4a6747f26e35fa6f2e6e0ef4469c2addff010d3bfbf',
    '80c82a8c0bd96a8b4658c454f8a271265c5f745e5c2fe83f6a64cfe419addd90aff904de242537e516e593bed4b38afaf4dd1f93bb55b4c7e2e2b81be007ef8b7816dd88b257fdafeda620cb5dd2ef84'
  ];

  let key = process.env.APN_KEY.replace(/\\n/g, '\n');

  for (const isProd of [false, true]) {
    console.log(`\n--- Testing ${isProd ? 'PRODUCTION' : 'SANDBOX'} ---`);
    const provider = new apn.Provider({
      token: {
        key: key,
        keyId: process.env.APN_KEY_ID,
        teamId: process.env.APN_TEAM_ID
      },
      production: isProd
    });

    const notification = new apn.Notification();
    notification.topic = process.env.APN_BUNDLE_ID;
    notification.alert = {
      title: "Test Push",
      body: `This is a test on ${isProd ? 'Production' : 'Sandbox'}`
    };
    notification.sound = 'default';

    try {
      const result = await provider.send(notification, tokens);
      console.log('Sent:', result.sent.length);
      if (result.failed.length > 0) {
        result.failed.forEach(f => {
          console.error(`Failed Token ${f.device}:`, f.response ? f.response.reason : f.error);
        });
      }
    } catch (e) {
      console.error('Fatal Error:', e);
    }
    
    provider.shutdown();
  }
}

testPush();
