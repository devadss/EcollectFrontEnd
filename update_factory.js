const fs = require('fs');
const path = require('path');

const factoryPath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi\\Ecollect.Tests\\CustomWebApplicationFactory.cs';

const factoryContent = `using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Ecollect.Core.Interfaces;
using Ecollect.Services;
using EcollectApi.Services;
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

fs.writeFileSync(factoryPath, factoryContent, 'utf8');
console.log('✅ Updated CustomWebApplicationFactory.cs with correct namespace.');
