namespace SchoolCore.Models.Dtos.People;

public sealed class StudentDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public string? BranchName { get; set; }
    public string EnrollmentNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Gender { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public Guid? EducationLevelId { get; set; }
    public string? EducationLevelName { get; set; }
    public string? LevelName { get; set; }
    public string? Grade { get; set; }
    public string? GroupCode { get; set; }
    public string Status { get; set; } = "active";
    public DateTime? EnrollmentDate { get; set; }
    public string? BloodType { get; set; }
    public string? Allergies { get; set; }
    public string? MedicalNotes { get; set; }
    public decimal ScholarshipPercent { get; set; }
    public Guid? SchoolCycleId { get; set; }
    public Guid? ClassroomId { get; set; }
    public string? PhotoUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public sealed class StudentUpsertRequest
{
    public Guid BranchId { get; set; }
    public string? EnrollmentNumber { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Gender { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public Guid? EducationLevelId { get; set; }
    public string? LevelName { get; set; }
    public string? Grade { get; set; }
    public string? GroupCode { get; set; }
    public string Status { get; set; } = "active";
    public DateTime? EnrollmentDate { get; set; }
    public string? BloodType { get; set; }
    public string? Allergies { get; set; }
    public string? MedicalNotes { get; set; }
    public decimal ScholarshipPercent { get; set; }
    public Guid? SchoolCycleId { get; set; }
    public Guid? ClassroomId { get; set; }
    public string? PhotoUrl { get; set; }
}

public sealed class GuardianDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Occupation { get; set; }
    public string? Address { get; set; }
    public string Status { get; set; } = "active";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? Relationship { get; set; }
    public bool? IsPrimary { get; set; }
}

public sealed class GuardianUpsertRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Occupation { get; set; }
    public string? Address { get; set; }
    public string Status { get; set; } = "active";
}

public sealed class LinkGuardianRequest
{
    public Guid GuardianId { get; set; }
    public string Relationship { get; set; } = "padre";
    public bool IsPrimary { get; set; }
}

public sealed class DocumentDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid FileId { get; set; }
    public Guid UploaderUserId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string Extension { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string RelativePath { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public DateTime CreatedAt { get; set; }
}

public sealed class TimelineEventDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public DateTime EventDate { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public string? Badge { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class TimelineEventCreateRequest
{
    public string EntityType { get; set; } = "Student";
    public Guid EntityId { get; set; }
    public DateTime EventDate { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public string? Badge { get; set; }
}
