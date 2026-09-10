const fs = require('fs');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';

// 1. Create SmsConfig.cs entity
const smsConfigEntityPath = `${basePath}\\Ecollect.Data\\Entities\\SmsConfig.cs`;
const smsConfigEntityCode = `using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ecollect.Data.Entities
{
    [Table("SmsConfigs")]
    public class SmsConfig
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public int? MerchantId { get; set; }

        [MaxLength(50)]
        public string? ProviderName { get; set; }

        [MaxLength(500)]
        public string GatewayUrl { get; set; } = "http://sms.aanvinsolutions.com/SMS_API/sendsms.php";

        [MaxLength(100)]
        public string Username { get; set; } = "anvinsolutions";

        [MaxLength(200)]
        public string Password { get; set; } = "@nvin@123";

        [MaxLength(20)]
        public string DefaultSenderId { get; set; } = "ADSSPY";

        [MaxLength(10)]
        public string RouteType { get; set; } = "1";

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
`;
fs.writeFileSync(smsConfigEntityPath, smsConfigEntityCode, 'utf8');
console.log('✅ Created SmsConfig.cs entity');

// 2. Create SmsTemplate.cs entity
const smsTemplateEntityPath = `${basePath}\\Ecollect.Data\\Entities\\SmsTemplate.cs`;
const smsTemplateEntityCode = `using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ecollect.Data.Entities
{
    [Table("SmsTemplates")]
    public class SmsTemplate
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string TemplateCode { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? DltTemplateId { get; set; }

        [MaxLength(20)]
        public string SenderId { get; set; } = "ADSSPY";

        [MaxLength(50)]
        public string Category { get; set; } = "AUTHENTICATION";

        [Required]
        [MaxLength(1000)]
        public string TemplateText { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? VariablesDescription { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
`;
fs.writeFileSync(smsTemplateEntityPath, smsTemplateEntityCode, 'utf8');
console.log('✅ Created SmsTemplate.cs entity');

// 3. Update ApplicationDbContext.cs with DbSet<SmsConfig> and DbSet<SmsTemplate>
const dbContextPath = `${basePath}\\Ecollect.Data\\Context\\ApplicationDbContext.cs`;
let dbContextCode = fs.readFileSync(dbContextPath, 'utf8');

if (!dbContextCode.includes('DbSet<SmsConfig>')) {
  dbContextCode = dbContextCode.replace(
    'public DbSet<MobLogin> MobLogin { get; set; }',
    'public DbSet<MobLogin> MobLogin { get; set; }\n        public DbSet<SmsConfig> SmsConfigs { get; set; }\n        public DbSet<SmsTemplate> SmsTemplates { get; set; }'
  );
  fs.writeFileSync(dbContextPath, dbContextCode, 'utf8');
  console.log('✅ Added DbSet<SmsConfig> & DbSet<SmsTemplate> to ApplicationDbContext.cs');
}
