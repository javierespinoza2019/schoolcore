namespace SchoolCore.Models.Dtos.Academic;

public sealed class TeacherDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Specialty { get; set; }
    public string? SubjectsJson { get; set; }
    public string? EmploymentType { get; set; }
    public decimal? MonthlySalary { get; set; }
    public Guid? EducationLevelId { get; set; }
    public string Status { get; set; } = "active";
    public DateTime? HireDate { get; set; }
    public string? ScheduleNotes { get; set; }
    public string? LevelName { get; set; }
    /// <summary>GUID del documento o URL corta. Nunca data URL.</summary>
    public string? PhotoUrl { get; set; }
    public string? BranchName { get; set; }
    public string? EducationLevelName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public sealed class TeacherUpsertRequest
{
    public Guid BranchId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Specialty { get; set; }
    public string? SubjectsJson { get; set; }
    public string? EmploymentType { get; set; }
    public decimal? MonthlySalary { get; set; }
    public Guid? EducationLevelId { get; set; }
    public string Status { get; set; } = "active";
    public DateTime? HireDate { get; set; }
    public string? ScheduleNotes { get; set; }
    public string? LevelName { get; set; }
    /// <summary>GUID del documento o URL corta. Nunca data URL.</summary>
    public string? PhotoUrl { get; set; }
}

public sealed class ClassroomDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid? EducationLevelId { get; set; }
    public string? Grade { get; set; }
    public string? GroupCode { get; set; }
    public int Capacity { get; set; }
    public int Occupied { get; set; }
    public string? RoomType { get; set; }
    public string? Building { get; set; }
    public int? FloorNumber { get; set; }
    public string Status { get; set; } = "available";
    public Guid? TeacherId { get; set; }
    public string? ScheduleNotes { get; set; }
    public string? EquipmentJson { get; set; }
    public string? LevelName { get; set; }
    public string? AssignedTeacherName { get; set; }
    public string? AssignedGroupsJson { get; set; }
    public string? BranchName { get; set; }
    public string? EducationLevelName { get; set; }
    public string? TeacherName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public sealed class ClassroomUpsertRequest
{
    public Guid BranchId { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid? EducationLevelId { get; set; }
    public string? Grade { get; set; }
    public string? GroupCode { get; set; }
    public int Capacity { get; set; }
    public int? Occupied { get; set; }
    public string? RoomType { get; set; }
    public string? Building { get; set; }
    public int? FloorNumber { get; set; }
    public string Status { get; set; } = "available";
    public Guid? TeacherId { get; set; }
    public string? ScheduleNotes { get; set; }
    public string? EquipmentJson { get; set; }
    public string? LevelName { get; set; }
    public string? AssignedTeacherName { get; set; }
    public string? AssignedGroupsJson { get; set; }
}

public sealed class EnrollmentDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid BranchId { get; set; }
    public Guid SchoolCycleId { get; set; }
    public Guid? StudentId { get; set; }
    public string EnrollmentNumber { get; set; } = string.Empty;
    public string Status { get; set; } = "draft";
    public int CurrentStep { get; set; }
    public string? Step1StudentJson { get; set; }
    public string? Step2GuardiansJson { get; set; }
    public string? Step3AcademicJson { get; set; }
    public string? Step4DocumentsJson { get; set; }
    public string? Step5FinanceJson { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public sealed class CreateEnrollmentRequest
{
    public Guid BranchId { get; set; }
    public Guid SchoolCycleId { get; set; }
}

public sealed class SaveEnrollmentWizardRequest
{
    public int CurrentStep { get; set; }
    public string? Step1StudentJson { get; set; }
    public string? Step2GuardiansJson { get; set; }
    public string? Step3AcademicJson { get; set; }
    public string? Step4DocumentsJson { get; set; }
    public string? Step5FinanceJson { get; set; }
}

public sealed class CompleteEnrollmentRequest
{
    public Guid StudentId { get; set; }
}
