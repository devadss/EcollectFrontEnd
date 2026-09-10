const fs = require('fs');
const path = require('path');

console.log('🚀 Synchronizing Backend AuthService for Settlements & Refunds Role Filtering...');

const authServicePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\Ecollect.Core\\Services\\AuthService.cs';

try {
  if (fs.existsSync(authServicePath)) {
    let content = fs.readFileSync(authServicePath, 'utf8');

    const targetBlock = `                var menus = roleMenus.Select(rm => new MenuDto
                {
                    Id = rm.Menu.Id,
                    Name = rm.Menu.Name,
                    Icon = rm.Menu.Icon ?? GetDefaultIcon(rm.Menu.Name),
                    Path = rm.Menu.Path,
                    ParentId = rm.Menu.ParentId,
                    DisplayOrder = rm.Menu.DisplayOrder,
                    IsActive = rm.Menu.IsActive,
                    Section = rm.Menu.Section ?? GetDefaultSection(rm.Menu.Name),
                    Permissions = new RoleMenuPermissionDto
                    {
                        CanView = rm.CanView,
                        CanCreate = rm.CanCreate,
                        CanEdit = rm.CanEdit,
                        CanDelete = rm.CanDelete
                    }
                }).ToList();`;

    const replacementBlock = `                var menus = roleMenus.Select(rm => new MenuDto
                {
                    Id = rm.Menu.Id,
                    Name = rm.Menu.Name,
                    Icon = rm.Menu.Icon ?? GetDefaultIcon(rm.Menu.Name),
                    Path = rm.Menu.Path,
                    ParentId = rm.Menu.ParentId,
                    DisplayOrder = rm.Menu.DisplayOrder,
                    IsActive = rm.Menu.IsActive,
                    Section = rm.Menu.Section ?? GetDefaultSection(rm.Menu.Name),
                    Permissions = new RoleMenuPermissionDto
                    {
                        CanView = rm.CanView,
                        CanCreate = rm.CanCreate,
                        CanEdit = rm.CanEdit,
                        CanDelete = rm.CanDelete
                    }
                }).ToList();

                // Strictly enforce: Settlements & Refunds available ONLY for SoftwareAdmin & Merchant logins
                var roleName = (user.Role?.Name ?? "").ToLower();
                bool isMerchantOrAdminRole = roleName.Contains("merchant") || roleName.Contains("admin");
                if (!isMerchantOrAdminRole)
                {
                    menus = menus.Where(m => 
                        !m.Name.Equals("Settlements", StringComparison.OrdinalIgnoreCase) &&
                        !m.Name.Equals("Refunds", StringComparison.OrdinalIgnoreCase) &&
                        !(m.Path ?? "").ToLower().Contains("settlement") &&
                        !(m.Path ?? "").ToLower().Contains("refund")
                    ).ToList();
                }`;

    if (!content.includes('Strictly enforce: Settlements & Refunds available ONLY for SoftwareAdmin & Merchant')) {
      content = content.replace(targetBlock, replacementBlock);
      fs.writeFileSync(authServicePath, content, 'utf8');
      console.log('✅ Updated AuthService.cs with role-based Settlements and Refunds filtering.');
    } else {
      console.log('ℹ️ AuthService.cs already has Settlements and Refunds role-based filtering.');
    }
  } else {
    console.error('❌ AuthService.cs not found at:', authServicePath);
  }
} catch (err) {
  console.error('❌ Error updating AuthService.cs:', err.message);
}
