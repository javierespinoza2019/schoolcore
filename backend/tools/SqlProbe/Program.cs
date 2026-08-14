using System.Data;
using Microsoft.Data.SqlClient;

var cs = "Server=SQL5113.site4now.net;Database=db_a0b4b3_schoolcore;User Id=db_a0b4b3_schoolcore_admin;Password=$jd56HGJp0183x.;TrustServerCertificate=True;Encrypt=True;";
var email = args.Length > 0 ? args[0] : "jespinoza.ova@gmail.com";

await using var c = new SqlConnection(cs);
await c.OpenAsync();

await using var cmd = new SqlCommand("sp_Auth_GetUserByEmail", c)
{
    CommandType = CommandType.StoredProcedure
};
cmd.Parameters.AddWithValue("@Email", email);
cmd.Parameters.AddWithValue("@TenantCode", DBNull.Value);

await using var reader = await cmd.ExecuteReaderAsync();
Console.WriteLine($"Result set 1 (user) HasRows={reader.HasRows}");
if (await reader.ReadAsync())
{
    for (var i = 0; i < reader.FieldCount; i++)
        Console.WriteLine($"  {reader.GetName(i)}={reader.GetValue(i)}");
}

if (await reader.NextResultAsync())
{
    Console.WriteLine($"Result set 2 (roles) HasRows={reader.HasRows}");
    while (await reader.ReadAsync())
    {
        for (var i = 0; i < reader.FieldCount; i++)
            Console.Write($"{reader.GetName(i)}={reader.GetValue(i)} ");
        Console.WriteLine();
    }
}

if (await reader.NextResultAsync())
{
    Console.WriteLine($"Result set 3 (branches) HasRows={reader.HasRows}");
    while (await reader.ReadAsync())
    {
        for (var i = 0; i < reader.FieldCount; i++)
            Console.Write($"{reader.GetName(i)}={reader.GetValue(i)} ");
        Console.WriteLine();
    }
}
