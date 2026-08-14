using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolCore.Business.Services;
using SchoolCore.Common.Responses;
using SchoolCore.Models.Dtos.Common;
using SchoolCore.Models.Dtos.Organization;

namespace SchoolCore.API.Controllers;

[ApiController]
[Authorize]
[Route("api")]
public sealed class OrganizationController : ControllerBase
{
    private readonly IOrganizationService _service;
    public OrganizationController(IOrganizationService service) => _service = service;

    [HttpGet("branches")]
    public async Task<ActionResult<ApiResponse<PagedResult<BranchDto>>>> ListBranches([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? search = null, CancellationToken ct = default)
        => Ok(ApiResponse<PagedResult<BranchDto>>.Ok(await _service.ListBranchesAsync(new PagedRequest { Page = page, PageSize = pageSize }, search, ct)));

    [HttpGet("branches/{id:guid}")]
    public async Task<ActionResult<ApiResponse<BranchDto>>> GetBranch(Guid id, CancellationToken ct)
        => Ok(ApiResponse<BranchDto>.Ok(await _service.GetBranchAsync(id, ct)));

    [HttpPost("branches")]
    public async Task<ActionResult<ApiResponse<BranchDto>>> CreateBranch([FromBody] BranchUpsertRequest request, CancellationToken ct)
        => Ok(ApiResponse<BranchDto>.Ok(await _service.CreateBranchAsync(request, ct)));

    [HttpPut("branches/{id:guid}")]
    public async Task<ActionResult<ApiResponse<BranchDto>>> UpdateBranch(Guid id, [FromBody] BranchUpsertRequest request, CancellationToken ct)
        => Ok(ApiResponse<BranchDto>.Ok(await _service.UpdateBranchAsync(id, request, ct)));

    [HttpDelete("branches/{id:guid}")]
    public async Task<ActionResult<ApiResponse>> DeleteBranch(Guid id, CancellationToken ct)
    { await _service.DeleteBranchAsync(id, ct); return Ok(ApiResponse.Ok("Branch deleted.")); }

    [HttpGet("school-cycles")]
    public async Task<ActionResult<ApiResponse<PagedResult<SchoolCycleDto>>>> ListCycles([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? search = null, CancellationToken ct = default)
        => Ok(ApiResponse<PagedResult<SchoolCycleDto>>.Ok(await _service.ListSchoolCyclesAsync(new PagedRequest { Page = page, PageSize = pageSize }, search, ct)));

    [HttpGet("school-cycles/{id:guid}")]
    public async Task<ActionResult<ApiResponse<SchoolCycleDto>>> GetCycle(Guid id, CancellationToken ct)
        => Ok(ApiResponse<SchoolCycleDto>.Ok(await _service.GetSchoolCycleAsync(id, ct)));

    [HttpPost("school-cycles")]
    public async Task<ActionResult<ApiResponse<SchoolCycleDto>>> CreateCycle([FromBody] SchoolCycleUpsertRequest request, CancellationToken ct)
        => Ok(ApiResponse<SchoolCycleDto>.Ok(await _service.CreateSchoolCycleAsync(request, ct)));

    [HttpPut("school-cycles/{id:guid}")]
    public async Task<ActionResult<ApiResponse<SchoolCycleDto>>> UpdateCycle(Guid id, [FromBody] SchoolCycleUpsertRequest request, CancellationToken ct)
        => Ok(ApiResponse<SchoolCycleDto>.Ok(await _service.UpdateSchoolCycleAsync(id, request, ct)));

    [HttpDelete("school-cycles/{id:guid}")]
    public async Task<ActionResult<ApiResponse>> DeleteCycle(Guid id, CancellationToken ct)
    { await _service.DeleteSchoolCycleAsync(id, ct); return Ok(ApiResponse.Ok("SchoolCycle deleted.")); }

    [HttpGet("institution-settings")]
    public async Task<ActionResult<ApiResponse<InstitutionSettingsDto?>>> GetSettings(CancellationToken ct)
        => Ok(ApiResponse<InstitutionSettingsDto?>.Ok(await _service.GetInstitutionSettingsAsync(ct)));

    [HttpPut("institution-settings")]
    public async Task<ActionResult<ApiResponse<InstitutionSettingsDto>>> UpsertSettings([FromBody] InstitutionSettingsUpsertRequest request, CancellationToken ct)
        => Ok(ApiResponse<InstitutionSettingsDto>.Ok(await _service.UpsertInstitutionSettingsAsync(request, ct)));

    [HttpGet("timezones")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<TimeZoneCatalogItemDto>>>> ListTimeZones(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<TimeZoneCatalogItemDto>>.Ok(await _service.ListTimeZonesAsync(ct)));

    [HttpGet("context/timezone")]
    public async Task<ActionResult<ApiResponse<EffectiveTimeZoneDto>>> ResolveTimeZone([FromQuery] Guid? branchId, CancellationToken ct)
        => Ok(ApiResponse<EffectiveTimeZoneDto>.Ok(await _service.ResolveTimeZoneAsync(branchId, ct)));

    [HttpGet("education-levels")]
    public async Task<ActionResult<ApiResponse<PagedResult<EducationLevelDto>>>> ListLevels([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? search = null, CancellationToken ct = default)
        => Ok(ApiResponse<PagedResult<EducationLevelDto>>.Ok(await _service.ListEducationLevelsAsync(new PagedRequest { Page = page, PageSize = pageSize }, search, ct)));

    [HttpGet("education-levels/{id:guid}")]
    public async Task<ActionResult<ApiResponse<EducationLevelDto>>> GetLevel(Guid id, CancellationToken ct)
        => Ok(ApiResponse<EducationLevelDto>.Ok(await _service.GetEducationLevelAsync(id, ct)));

    [HttpPost("education-levels")]
    public async Task<ActionResult<ApiResponse<EducationLevelDto>>> CreateLevel([FromBody] EducationLevelUpsertRequest request, CancellationToken ct)
        => Ok(ApiResponse<EducationLevelDto>.Ok(await _service.CreateEducationLevelAsync(request, ct)));

    [HttpPut("education-levels/{id:guid}")]
    public async Task<ActionResult<ApiResponse<EducationLevelDto>>> UpdateLevel(Guid id, [FromBody] EducationLevelUpsertRequest request, CancellationToken ct)
        => Ok(ApiResponse<EducationLevelDto>.Ok(await _service.UpdateEducationLevelAsync(id, request, ct)));

    [HttpDelete("education-levels/{id:guid}")]
    public async Task<ActionResult<ApiResponse>> DeleteLevel(Guid id, CancellationToken ct)
    { await _service.DeleteEducationLevelAsync(id, ct); return Ok(ApiResponse.Ok("EducationLevel deleted.")); }

    [HttpGet("payment-methods")]
    public async Task<ActionResult<ApiResponse<PagedResult<PaymentMethodDto>>>> ListMethods([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? search = null, CancellationToken ct = default)
        => Ok(ApiResponse<PagedResult<PaymentMethodDto>>.Ok(await _service.ListPaymentMethodsAsync(new PagedRequest { Page = page, PageSize = pageSize }, search, ct)));

    [HttpGet("payment-methods/{id:guid}")]
    public async Task<ActionResult<ApiResponse<PaymentMethodDto>>> GetMethod(Guid id, CancellationToken ct)
        => Ok(ApiResponse<PaymentMethodDto>.Ok(await _service.GetPaymentMethodAsync(id, ct)));

    [HttpPost("payment-methods")]
    public async Task<ActionResult<ApiResponse<PaymentMethodDto>>> CreateMethod([FromBody] PaymentMethodUpsertRequest request, CancellationToken ct)
        => Ok(ApiResponse<PaymentMethodDto>.Ok(await _service.CreatePaymentMethodAsync(request, ct)));

    [HttpPut("payment-methods/{id:guid}")]
    public async Task<ActionResult<ApiResponse<PaymentMethodDto>>> UpdateMethod(Guid id, [FromBody] PaymentMethodUpsertRequest request, CancellationToken ct)
        => Ok(ApiResponse<PaymentMethodDto>.Ok(await _service.UpdatePaymentMethodAsync(id, request, ct)));

    [HttpDelete("payment-methods/{id:guid}")]
    public async Task<ActionResult<ApiResponse>> DeleteMethod(Guid id, CancellationToken ct)
    { await _service.DeletePaymentMethodAsync(id, ct); return Ok(ApiResponse.Ok("PaymentMethod deleted.")); }

    [HttpGet("payment-concepts")]
    public async Task<ActionResult<ApiResponse<PagedResult<PaymentConceptDto>>>> ListConcepts([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? search = null, CancellationToken ct = default)
        => Ok(ApiResponse<PagedResult<PaymentConceptDto>>.Ok(await _service.ListPaymentConceptsAsync(new PagedRequest { Page = page, PageSize = pageSize }, search, ct)));

    [HttpGet("payment-concepts/{id:guid}")]
    public async Task<ActionResult<ApiResponse<PaymentConceptDto>>> GetConcept(Guid id, CancellationToken ct)
        => Ok(ApiResponse<PaymentConceptDto>.Ok(await _service.GetPaymentConceptAsync(id, ct)));

    [HttpPost("payment-concepts")]
    public async Task<ActionResult<ApiResponse<PaymentConceptDto>>> CreateConcept([FromBody] PaymentConceptUpsertRequest request, CancellationToken ct)
        => Ok(ApiResponse<PaymentConceptDto>.Ok(await _service.CreatePaymentConceptAsync(request, ct)));

    [HttpPut("payment-concepts/{id:guid}")]
    public async Task<ActionResult<ApiResponse<PaymentConceptDto>>> UpdateConcept(Guid id, [FromBody] PaymentConceptUpsertRequest request, CancellationToken ct)
        => Ok(ApiResponse<PaymentConceptDto>.Ok(await _service.UpdatePaymentConceptAsync(id, request, ct)));

    [HttpPut("payment-concepts/{id:guid}/amounts")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PaymentConceptAmountDto>>>> SetAmounts(Guid id, [FromBody] SetPaymentConceptAmountsRequest request, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<PaymentConceptAmountDto>>.Ok(await _service.SetPaymentConceptAmountsAsync(id, request, ct)));

    [HttpDelete("payment-concepts/{id:guid}")]
    public async Task<ActionResult<ApiResponse>> DeleteConcept(Guid id, CancellationToken ct)
    { await _service.DeletePaymentConceptAsync(id, ct); return Ok(ApiResponse.Ok("PaymentConcept deleted.")); }

    [HttpGet("users")]
    public async Task<ActionResult<ApiResponse<PagedResult<StaffUserDto>>>> ListUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? search = null, CancellationToken ct = default)
        => Ok(ApiResponse<PagedResult<StaffUserDto>>.Ok(await _service.ListStaffAsync(new PagedRequest { Page = page, PageSize = pageSize }, search, ct)));

    [HttpGet("users/{id:guid}")]
    public async Task<ActionResult<ApiResponse<StaffUserDto>>> GetUser(Guid id, CancellationToken ct)
        => Ok(ApiResponse<StaffUserDto>.Ok(await _service.GetStaffAsync(id, ct)));

    [HttpPost("users")]
    public async Task<ActionResult<ApiResponse<StaffUserDto>>> CreateUser([FromBody] CreateStaffUserRequest request, CancellationToken ct)
        => Ok(ApiResponse<StaffUserDto>.Ok(await _service.CreateStaffAsync(request, ct)));

    [HttpPut("users/{id:guid}")]
    public async Task<ActionResult<ApiResponse<StaffUserDto>>> UpdateUser(Guid id, [FromBody] UpdateStaffUserRequest request, CancellationToken ct)
        => Ok(ApiResponse<StaffUserDto>.Ok(await _service.UpdateStaffAsync(id, request, ct)));

    [HttpDelete("users/{id:guid}")]
    public async Task<ActionResult<ApiResponse>> DeleteUser(Guid id, CancellationToken ct)
    { await _service.DeleteStaffAsync(id, ct); return Ok(ApiResponse.Ok("User deleted.")); }

    [HttpGet("roles")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<RoleDto>>>> ListRoles(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<RoleDto>>.Ok(await _service.ListRolesAsync(ct)));

    [HttpGet("email-templates")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<EmailTemplateDto>>>> ListTemplates(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<EmailTemplateDto>>.Ok(await _service.ListEmailTemplatesAsync(ct)));

    [HttpGet("email-templates/{id:guid}")]
    public async Task<ActionResult<ApiResponse<EmailTemplateDto>>> GetTemplate(Guid id, CancellationToken ct)
        => Ok(ApiResponse<EmailTemplateDto>.Ok(await _service.GetEmailTemplateAsync(id, ct)));

    [HttpPut("email-templates")]
    public async Task<ActionResult<ApiResponse<EmailTemplateDto>>> UpsertTemplate([FromBody] EmailTemplateUpsertRequest request, CancellationToken ct)
        => Ok(ApiResponse<EmailTemplateDto>.Ok(await _service.UpsertEmailTemplateAsync(request, ct)));

    [HttpDelete("email-templates/{id:guid}")]
    public async Task<ActionResult<ApiResponse>> DeactivateTemplate(Guid id, CancellationToken ct)
    { await _service.DeactivateEmailTemplateAsync(id, ct); return Ok(ApiResponse.Ok("EmailTemplate deactivated.")); }

    [HttpGet("feature-flags")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<FeatureFlagDto>>>> ListFlags([FromQuery] Guid? branchId, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<FeatureFlagDto>>.Ok(await _service.ListFeatureFlagsAsync(branchId, ct)));

    [HttpPut("feature-flags")]
    public async Task<ActionResult<ApiResponse>> SetFlag([FromBody] SetFeatureFlagRequest request, CancellationToken ct)
    { await _service.SetFeatureFlagAsync(request, ct); return Ok(ApiResponse.Ok("Feature flag updated.")); }
}
