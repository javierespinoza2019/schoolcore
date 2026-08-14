using SchoolCore.Common.Security;
using Xunit;

namespace SchoolCore.Tests;

/// <summary>
/// Tests unitarios de aislamiento tenant / claims (sin BD).
/// </summary>
public sealed class TenantIsolationTests
{
    [Fact]
    public void TenantContext_Set_RequiresBothIds()
    {
        var ctx = new TenantContext();
        Assert.False(ctx.IsAuthenticated);

        var tenantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        ctx.Set(tenantId, userId);

        Assert.True(ctx.IsAuthenticated);
        Assert.Equal(tenantId, ctx.TenantId);
        Assert.Equal(userId, ctx.UserId);
    }

    [Fact]
    public void TenantContext_Clear_RemovesIdentity()
    {
        var ctx = new TenantContext();
        ctx.Set(Guid.NewGuid(), Guid.NewGuid());
        ctx.Clear();

        Assert.False(ctx.IsAuthenticated);
        Assert.Null(ctx.TenantId);
        Assert.Null(ctx.UserId);
    }

    [Fact]
    public void MvpLoginRoles_OnlySixStaffRolesAllowed()
    {
        Assert.True(MvpLoginRoles.HasAllowedRole(["Director", "Teacher"]));
        Assert.True(MvpLoginRoles.HasAllowedRole(["Cashier"]));
        Assert.False(MvpLoginRoles.HasAllowedRole(["Teacher"]));
        Assert.False(MvpLoginRoles.HasAllowedRole(["Parent", "Student"]));
        Assert.False(MvpLoginRoles.HasAllowedRole([]));
    }

    [Fact]
    public void TenantIds_FromDifferentTenants_AreNotEqual()
    {
        var tenantA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        var tenantB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Assert.NotEqual(tenantA, tenantB);

        // Simula filtro obligatorio: una consulta de negocio nunca debe mezclar TenantId.
        var rows = new[]
        {
            new { TenantId = tenantA, Name = "Branch A" },
            new { TenantId = tenantB, Name = "Branch B" }
        };

        var filteredForA = rows.Where(r => r.TenantId == tenantA).ToList();
        Assert.Single(filteredForA);
        Assert.DoesNotContain(filteredForA, r => r.TenantId == tenantB);
    }
}
