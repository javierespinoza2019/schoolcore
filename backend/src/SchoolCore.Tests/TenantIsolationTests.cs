using SchoolCore.Business.Security;
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
        Assert.True(MvpLoginRoles.IsSuperAdmin(["SuperAdmin", "Director"]));
        Assert.False(MvpLoginRoles.IsSuperAdmin(["Director"]));
        Assert.False(MvpLoginRoles.IsSuperAdmin([]));
    }

    [Fact]
    public void BranchAccess_SuperAdmin_BypassesAssignment()
    {
        var ctx = new TenantContext();
        ctx.Set(Guid.NewGuid(), Guid.NewGuid(), ["SuperAdmin"], Array.Empty<Guid>());
        Assert.True(BranchAccess.IsSuperAdmin(ctx));
        BranchAccess.EnsureQueryBranch(ctx, null);
        BranchAccess.EnsureCanAccess(ctx, Guid.NewGuid());
        BranchAccess.EnsureCanAssign(ctx, [Guid.NewGuid()]);
    }

    [Fact]
    public void BranchAccess_Staff_RequiresAssignedBranch()
    {
        var tenantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var allowed = Guid.NewGuid();
        var denied = Guid.NewGuid();
        var ctx = new TenantContext();
        ctx.Set(tenantId, userId, ["Director"], [allowed]);

        Assert.False(BranchAccess.IsSuperAdmin(ctx));
        BranchAccess.EnsureCanAccess(ctx, allowed);
        Assert.Throws<SchoolCore.Common.Exceptions.AppException>(() => BranchAccess.EnsureCanAccess(ctx, denied));
        BranchAccess.EnsureQueryBranch(ctx, null);
        Assert.Throws<SchoolCore.Common.Exceptions.AppException>(() => BranchAccess.EnsureQueryBranch(ctx, denied));
        Assert.Throws<SchoolCore.Common.Exceptions.AppException>(() => BranchAccess.EnsureCanAssign(ctx, [denied]));
        BranchAccess.EnsureCanAssign(ctx, [allowed]);
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
