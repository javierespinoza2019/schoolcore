namespace SchoolCore.Models.Dtos.Common;

/// <summary>
/// Resultado paginado estándar.
/// </summary>
public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; set; } = Array.Empty<T>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

/// <summary>
/// Request de paginación.
/// </summary>
public class PagedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;

    public void Normalize(int maxPageSize = 100)
    {
        if (Page < 1)
        {
            Page = 1;
        }

        if (PageSize < 1)
        {
            PageSize = 20;
        }

        if (PageSize > maxPageSize)
        {
            PageSize = maxPageSize;
        }
    }
}
