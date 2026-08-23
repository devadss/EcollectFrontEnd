const fs = require('fs');

console.log('🚀 Starting JWT Synchronization...');

try {
  // 1. appsettings.json
  const appsettingsPath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\EcollectApi\\appsettings.json';
  let appsettings = fs.readFileSync(appsettingsPath, 'utf8');
  if (!appsettings.includes('"Jwt"')) {
    appsettings = appsettings.replace('"AllowedHosts": "*",', '"AllowedHosts": "*",\r\n  "Jwt": {\r\n    "Key": "EcollectSuperSecretJwtSigningKey2026!@#$%^&*()_+",\r\n    "Issuer": "localhost",\r\n    "Audience": "localhost"\r\n  },');
    fs.writeFileSync(appsettingsPath, appsettings);
    console.log('✅ 1. appsettings.json updated with Jwt config');
  } else {
    console.log('ℹ️ 1. appsettings.json already has Jwt section');
  }

  // 2. Program.cs
  const progPath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\EcollectApi\\Program.cs';
  let prog = fs.readFileSync(progPath, 'utf8');
  prog = prog.replace('DevSecretKey12345678901234567890123456789012', 'EcollectSuperSecretJwtSigningKey2026!@#$%^&*()_+');
  fs.writeFileSync(progPath, prog);
  console.log('✅ 2. Program.cs updated with synchronized Jwt key');

  // 3. AuthService.cs
  const authServicePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\Ecollect.Core\\Services\\AuthService.cs';
  let authService = fs.readFileSync(authServicePath, 'utf8');
  authService = authService.replace('YourSuperSecretKeyThatIsAtLeast32CharactersLong!', 'EcollectSuperSecretJwtSigningKey2026!@#$%^&*()_+');
  fs.writeFileSync(authServicePath, authService);
  console.log('✅ 3. AuthService.cs updated with synchronized Jwt key');

  // 4. AuthController.cs
  const authControllerPath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\EcollectApi\\Controllers\\AuthController.cs';
  let authController = fs.readFileSync(authControllerPath, 'utf8');
  authController = authController.replace('YourSuperSecretKeyThatIsAtLeast32CharactersLong!', 'EcollectSuperSecretJwtSigningKey2026!@#$%^&*()_+');
  fs.writeFileSync(authControllerPath, authController);
  console.log('✅ 4. AuthController.cs updated with synchronized Jwt key');

  console.log('🎉 JWT Synchronization Complete! All backend components now use the exact same signature key.');
} catch (err) {
  console.error('❌ Error during synchronization:', err.message);
}
