const fs = require('fs');

const pDto = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\Ecollect.Shared\\DTOs\\AccountDto.cs';
let dtoContent = fs.readFileSync(pDto, 'utf8');

const dtoExtraFields = `
        public string? SchemeName { get; set; }
        public string? CustomerPhoto { get; set; }
        public string? Latitude { get; set; }
        public string? Longitude { get; set; }
        public string? CustomerAddress { get; set; }
        public DateTime? PtpDate { get; set; }
        public decimal? PtpAmount { get; set; }
        public string? PtpStatus { get; set; }
        public string? PtpNotes { get; set; }
        public bool? IsMandatoryCall { get; set; }
        public DateTime? MandatoryCallDate { get; set; }
        public string? LastCallOutcome { get; set; }
        public string? LastCallNotes { get; set; }
`;

if (!dtoContent.includes('CustomerPhoto')) {
  dtoContent = dtoContent.replace(
    'public string? AssignedAgentName { get; set; }',
    'public string? AssignedAgentName { get; set; }' + dtoExtraFields
  );
  fs.writeFileSync(pDto, dtoContent, 'utf8');
  console.log('✅ AccountDto.cs updated successfully');
} else {
  console.log('AccountDto.cs already up to date');
}

// Update Account.cs entity
const pEntity = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\Ecollect.Data\\Entities\\Account.cs';
let entityContent = fs.readFileSync(pEntity, 'utf8');

const entityExtraFields = `
        public string? CustomerPhoto { get; set; }
        public string? Latitude { get; set; }
        public string? Longitude { get; set; }
        public string? CustomerAddress { get; set; }
        public DateTime? PtpDate { get; set; }
        public decimal? PtpAmount { get; set; }
        public string? PtpStatus { get; set; }
        public string? PtpNotes { get; set; }
        public bool IsMandatoryCall { get; set; } = false;
        public DateTime? MandatoryCallDate { get; set; }
        public string? LastCallOutcome { get; set; }
        public string? LastCallNotes { get; set; }
        public DateTime? LastCallTimestamp { get; set; }
`;

if (!entityContent.includes('CustomerPhoto')) {
  entityContent = entityContent.replace(
    'public string Status { get; set; } = "Active";',
    entityExtraFields + '\n        public string Status { get; set; } = "Active";'
  );
  fs.writeFileSync(pEntity, entityContent, 'utf8');
  console.log('✅ Account.cs entity updated successfully');
} else {
  console.log('Account.cs entity already up to date');
}

// Update AccountController.cs mapping
const pCtrl = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\EcollectApi\\Controllers\\AccountController.cs';
let ctrlContent = fs.readFileSync(pCtrl, 'utf8');

const ctrlCreateMapping = `
                    CustomerPhoto = dto.CustomerPhoto,
                    Latitude = dto.Latitude,
                    Longitude = dto.Longitude,
                    CustomerAddress = dto.CustomerAddress,
                    PtpDate = dto.PtpDate,
                    PtpAmount = dto.PtpAmount,
                    PtpStatus = dto.PtpStatus ?? "NONE",
                    PtpNotes = dto.PtpNotes,
                    IsMandatoryCall = dto.IsMandatoryCall ?? false,
                    MandatoryCallDate = dto.MandatoryCallDate,
`;

if (!ctrlContent.includes('CustomerPhoto = dto.CustomerPhoto')) {
  ctrlContent = ctrlContent.replace(
    'AssignedAgentName = dto.AssignedAgentName,',
    'AssignedAgentName = dto.AssignedAgentName,' + ctrlCreateMapping
  );
  fs.writeFileSync(pCtrl, ctrlContent, 'utf8');
  console.log('✅ AccountController.cs mapping updated successfully');
} else {
  console.log('AccountController.cs mapping already up to date');
}
