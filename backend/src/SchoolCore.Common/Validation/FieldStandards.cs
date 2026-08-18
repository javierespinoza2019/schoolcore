namespace SchoolCore.Common.Validation;

/// <summary>
/// Catálogo de campos alineado a fieldStandards.ts (UI → API → BD).
/// </summary>
public static class FieldStandards
{
    public const int PersonNameMin = 2;
    public const int PersonNameMax = 100;
    public const int EmailMax = 256;
    public const int PhoneMax = 50;
    public const int PhoneDigitsMin = 8;
    public const int AddressMax = 400;
    public const int AllergiesMax = 500;
    public const int MedicalNotesMax = 1000;
    public const int BloodTypeMax = 5;
    public const int OccupationMax = 150;
    public const int GradeMax = 20;
    public const int GroupMax = 10;
    public const int LevelNameMax = 100;
    public const int SpecialtyMax = 150;
    public const int ScheduleNotesMax = 500;
    public const int ClassroomNameMax = 100;
    public const int BuildingMax = 100;
    public const int BranchNameMax = 200;
    public const int BranchCodeMax = 20;
    public const int BranchAddressMax = 300;
    public const int CityMax = 100;
    public const int StateMax = 100;
    public const int PostalCodeMax = 10;
    public const int InstitutionDisplayNameMax = 200;
    public const int LegalNameMax = 300;
    public const int TaxIdMax = 20;
    public const int WebsiteMax = 300;
    public const int PaymentNotesMax = 500;
    public const int ReverseReasonMin = 5;
    public const int ReverseReasonMax = 500;
    public const int ExpenseConceptMax = 200;
    public const int ReferenceMax = 100;
    public const int PasswordMin = 8;
    public const int PasswordMax = 128;
}
