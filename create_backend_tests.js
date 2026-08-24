const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Automatic Backend Test Suite Setup...');

const backendBase = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';
const testProjDir = path.join(backendBase, 'Ecollect.Tests');
const testControllersDir = path.join(testProjDir, 'Controllers');

// 1. Ensure directories exist
if (!fs.existsSync(testProjDir)) {
  fs.mkdirSync(testProjDir, { recursive: true });
  console.log('✅ Created directory:', testProjDir);
}
if (!fs.existsSync(testControllersDir)) {
  fs.mkdirSync(testControllersDir, { recursive: true });
  console.log('✅ Created directory:', testControllersDir);
}

// 2. Write Ecollect.Tests.csproj
const csprojContent = `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <IsPackable>false</IsPackable>
    <IsTestProject>true</IsTestProject>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.8.0" />
    <PackageReference Include="xunit" Version="2.6.4" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.5.6">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="coverlet.collector" Version="6.0.0">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="8.0.0" />
    <PackageReference Include="Moq" Version="4.20.70" />
    <PackageReference Include="FluentAssertions" Version="6.12.0" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\\EcollectApi\\EcollectApi.csproj" />
    <ProjectReference Include="..\\Ecollect.Core\\Ecollect.Core.csproj" />
    <ProjectReference Include="..\\Ecollect.Data\\Ecollect.Data.csproj" />
    <ProjectReference Include="..\\Ecollect.Shared\\Ecollect.Shared.csproj" />
  </ItemGroup>

</Project>
`;

fs.writeFileSync(path.join(testProjDir, 'Ecollect.Tests.csproj'), csprojContent, 'utf8');
console.log('✅ Created Ecollect.Tests.csproj');

// 3. Write CustomWebApplicationFactory.cs
const factoryContent = `using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Ecollect.Core.Interfaces;
using Ecollect.Services;
using System.Net.Http.Headers;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace Ecollect.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    public Mock<IPaymentGatewayService> MockPaymentGateway { get; } = new();
    public Mock<IPushNotificationService> MockPushNotification { get; } = new();
    public Mock<ICashCollectionService> MockCashCollection { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // 1. Remove 3rd-Party Payment Gateway
            var paymentDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IPaymentGatewayService));
            if (paymentDescriptor != null) services.Remove(paymentDescriptor);

            // 2. Remove Push Notification (Firebase)
            var pushDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IPushNotificationService));
            if (pushDescriptor != null) services.Remove(pushDescriptor);

            // 3. Remove External Cash Collection Service
            var cashDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(ICashCollectionService));
            if (cashDescriptor != null) services.Remove(cashDescriptor);

            // 4. Inject Safe Mocks (No external network calls)
            services.AddScoped(_ => MockPaymentGateway.Object);
            services.AddScoped(_ => MockPushNotification.Object);
            services.AddScoped(_ => MockCashCollection.Object);
        });
    }

    public HttpClient CreateAdminClient()
    {
        var client = CreateClient();
        var token = GenerateTestJwtToken("admin_test_user", "SoftwareAdmin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private static string GenerateTestJwtToken(string username, string role)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes("EcollectSuperSecretJwtSigningKey2026!@#$%^&*()_+");
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Name, username),
                new Claim(ClaimTypes.Role, role),
                new Claim("MerchantId", "1"),
                new Claim("BranchCode", "TEST_BR01")
            }),
            Expires = DateTime.UtcNow.AddHours(2),
            Issuer = "localhost",
            Audience = "localhost",
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
`;

fs.writeFileSync(path.join(testProjDir, 'CustomWebApplicationFactory.cs'), factoryContent, 'utf8');
console.log('✅ Created CustomWebApplicationFactory.cs');

// 4. Write BranchControllerTests.cs
const branchTests = `using System.Net;
using System.Net.Http.Json;
using Xunit;
using FluentAssertions;

namespace Ecollect.Tests.Controllers;

public class BranchControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public BranchControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateAdminClient();
    }

    [Fact]
    public async Task GetAllBranches_ShouldReturnOk()
    {
        var response = await _client.GetAsync("/api/Branch/get-all");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task FetchBranchList_ShouldReturnOk()
    {
        var response = await _client.GetAsync("/api/Branch/fetch-branch-list");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Branch_FullCrudCycle_Create_Read_Update_Delete()
    {
        var randomId = Guid.NewGuid().ToString("N")[..6];
        
        // 1. CREATE
        var createPayload = new
        {
            BranchName = $"AutoTest Branch {randomId}",
            BranchCode = $"BR_{randomId}",
            Address = "123 Financial District",
            ContactNumber = "9988776655",
            Status = "Active"
        };
        var createResponse = await _client.PostAsJsonAsync("/api/Branch/create", createPayload);
        createResponse.StatusCode.Should().Match(s => s == HttpStatusCode.OK || s == HttpStatusCode.Created);

        var body = await createResponse.Content.ReadFromJsonAsync<dynamic>();
        long? branchId = body?.id ?? body?.data?.id;

        if (branchId.HasValue && branchId.Value > 0)
        {
            // 2. READ BY ID
            var getResponse = await _client.GetAsync($"/api/Branch/{branchId.Value}");
            getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            // 3. UPDATE
            var updatePayload = new
            {
                BranchName = $"Updated Branch {randomId}",
                Address = "456 Updated Lane",
                Status = "Active"
            };
            var updateResponse = await _client.PutAsJsonAsync($"/api/Branch/{branchId.Value}", updatePayload);
            updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            // 4. TOGGLE STATUS
            var toggleResponse = await _client.PatchAsync($"/api/Branch/toggle-status/{branchId.Value}", null);
            toggleResponse.StatusCode.Should().Match(s => s == HttpStatusCode.OK || s == HttpStatusCode.NoContent);

            // 5. DELETE
            var deleteResponse = await _client.DeleteAsync($"/api/Branch/{branchId.Value}");
            deleteResponse.StatusCode.Should().Match(s => s == HttpStatusCode.OK || s == HttpStatusCode.NoContent);
        }
    }
}
`;
fs.writeFileSync(path.join(testControllersDir, 'BranchControllerTests.cs'), branchTests, 'utf8');
console.log('✅ Created BranchControllerTests.cs');

// 5. Write AgentControllerTests.cs
const agentTests = `using System.Net;
using System.Net.Http.Json;
using Xunit;
using FluentAssertions;

namespace Ecollect.Tests.Controllers;

public class AgentControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AgentControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateAdminClient();
    }

    [Fact]
    public async Task GetAllAgents_ShouldReturnOk()
    {
        var response = await _client.GetAsync("/api/Agent/get-all");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task FetchAgentList_ShouldReturnOk()
    {
        var response = await _client.GetAsync("/api/Agent/fetch-agent-list");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Agent_FullCrudCycle_Create_Read_Update_Delete()
    {
        var randomId = Guid.NewGuid().ToString("N")[..6];

        // 1. CREATE AGENT
        var createPayload = new
        {
            AgentName = $"Agent_{randomId}",
            AgentCode = $"AG_{randomId}",
            Email = $"agent_{randomId}@testfinwin.com",
            MobileNumber = "9876543210",
            BranchCode = "TEST_BR01",
            Status = "Active"
        };
        var createRes = await _client.PostAsJsonAsync("/api/Agent/create", createPayload);
        createRes.StatusCode.Should().Match(s => s == HttpStatusCode.OK || s == HttpStatusCode.Created);

        var body = await createRes.Content.ReadFromJsonAsync<dynamic>();
        long? agentId = body?.id ?? body?.data?.id;

        if (agentId.HasValue && agentId.Value > 0)
        {
            // 2. READ
            var getRes = await _client.GetAsync($"/api/Agent/{agentId.Value}");
            getRes.StatusCode.Should().Be(HttpStatusCode.OK);

            // 3. UPDATE
            var updatePayload = new
            {
                AgentName = $"Updated Agent {randomId}",
                Status = "Active"
            };
            var updateRes = await _client.PutAsJsonAsync($"/api/Agent/{agentId.Value}", updatePayload);
            updateRes.StatusCode.Should().Be(HttpStatusCode.OK);

            // 4. TOGGLE STATUS
            var toggleRes = await _client.PatchAsync($"/api/Agent/{agentId.Value}/toggle-status", null);
            toggleRes.StatusCode.Should().Match(s => s == HttpStatusCode.OK || s == HttpStatusCode.NoContent);

            // 5. DELETE
            var deleteRes = await _client.DeleteAsync($"/api/Agent/{agentId.Value}");
            deleteRes.StatusCode.Should().Match(s => s == HttpStatusCode.OK || s == HttpStatusCode.NoContent);
        }
    }
}
`;
fs.writeFileSync(path.join(testControllersDir, 'AgentControllerTests.cs'), agentTests, 'utf8');
console.log('✅ Created AgentControllerTests.cs');

// 6. Write MerchantControllerTests.cs
const merchantTests = `using System.Net;
using System.Net.Http.Json;
using Xunit;
using FluentAssertions;

namespace Ecollect.Tests.Controllers;

public class MerchantControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public MerchantControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateAdminClient();
    }

    [Fact]
    public async Task GetAllMerchants_ShouldReturnOk()
    {
        var response = await _client.GetAsync("/api/Merchant/get-all");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAllMerchantConfigs_ShouldReturnOk()
    {
        var response = await _client.GetAsync("/api/Config/get-all");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ConfigMerchant_Create_Update_Delete()
    {
        var randomId = Guid.NewGuid().ToString("N")[..4];

        // CREATE CONFIG
        var configPayload = new
        {
            MerchantId = 1,
            ProductType = "RD",
            MinAmount = 100,
            MaxAmount = 50000,
            Status = "Active"
        };
        var createRes = await _client.PostAsJsonAsync("/api/Config/config-merchant", configPayload);
        createRes.StatusCode.Should().Match(s => s == HttpStatusCode.OK || s == HttpStatusCode.Created);

        var body = await createRes.Content.ReadFromJsonAsync<dynamic>();
        long? configId = body?.id ?? body?.data?.id;

        if (configId.HasValue && configId.Value > 0)
        {
            // UPDATE CONFIG
            var updatePayload = new
            {
                MaxAmount = 75000,
                Status = "Active"
            };
            var updateRes = await _client.PutAsJsonAsync($"/api/Config/update/{configId.Value}", updatePayload);
            updateRes.StatusCode.Should().Be(HttpStatusCode.OK);

            // DELETE CONFIG
            var deleteRes = await _client.DeleteAsync($"/api/Config/delete/{configId.Value}");
            deleteRes.StatusCode.Should().Match(s => s == HttpStatusCode.OK || s == HttpStatusCode.NoContent);
        }
    }
}
`;
fs.writeFileSync(path.join(testControllersDir, 'MerchantControllerTests.cs'), merchantTests, 'utf8');
console.log('✅ Created MerchantControllerTests.cs');

// 7. Write CustomerControllerTests.cs
const customerTests = `using System.Net;
using Xunit;
using FluentAssertions;

namespace Ecollect.Tests.Controllers;

public class CustomerControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public CustomerControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateAdminClient();
    }

    [Fact]
    public async Task GetAllCustomers_ShouldReturnOk()
    {
        var response = await _client.GetAsync("/api/Customer");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task FetchRdCustomersUnderBranch_ShouldReturnOk()
    {
        var response = await _client.GetAsync("/api/Branch/fetch-rd-customers");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
`;
fs.writeFileSync(path.join(testControllersDir, 'CustomerControllerTests.cs'), customerTests, 'utf8');
console.log('✅ Created CustomerControllerTests.cs');

// 8. Write AuthControllerTests.cs
const authTests = `using System.Net;
using System.Net.Http.Json;
using Xunit;
using FluentAssertions;

namespace Ecollect.Tests.Controllers;

public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateAdminClient();
    }

    [Fact]
    public async Task GetProfile_WithValidToken_ShouldReturnOk()
    {
        var response = await _client.GetAsync("/api/Auth/profile");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetMenus_WithValidToken_ShouldReturnOk()
    {
        var response = await _client.GetAsync("/api/Auth/menus");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ShouldReturnUnauthorized()
    {
        var invalidPayload = new
        {
            UsernameOrEmail = "invalid_user_test",
            Password = "WrongPassword!@#"
        };
        var response = await _client.PostAsJsonAsync("/api/Auth/login", invalidPayload);
        response.StatusCode.Should().Match(s => s == HttpStatusCode.Unauthorized || s == HttpStatusCode.BadRequest);
    }
}
`;
fs.writeFileSync(path.join(testControllersDir, 'AuthControllerTests.cs'), authTests, 'utf8');
console.log('✅ Created AuthControllerTests.cs');

// 9. Update Program.cs if public partial class Program is not present
const programPath = path.join(backendBase, 'EcollectApi', 'Program.cs');
if (fs.existsSync(programPath)) {
  let programContent = fs.readFileSync(programPath, 'utf8');
  if (!programContent.includes('public partial class Program')) {
    programContent += '\n\npublic partial class Program { }\n';
    fs.writeFileSync(programPath, programContent, 'utf8');
    console.log('✅ Updated Program.cs with `public partial class Program { }`');
  } else {
    console.log('ℹ️ Program.cs already contains `public partial class Program`');
  }
}

// 10. Add project to solution if not already present
const slnPath = path.join(backendBase, 'EcollectApi.sln');
try {
  console.log('🔗 Adding Ecollect.Tests.csproj to solution...');
  execSync(`dotnet sln "${slnPath}" add "${path.join(testProjDir, 'Ecollect.Tests.csproj')}"`, { stdio: 'inherit' });
  console.log('✅ Project added to solution file.');
} catch (e) {
  console.log('ℹ️ Note on adding to sln:', e.message);
}

console.log('\n🎉 ALL Test Cases and Configuration Successfully Created in Backend Solution!\n');
