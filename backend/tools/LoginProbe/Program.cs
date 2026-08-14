using Microsoft.Extensions.Configuration; 
using Microsoft.Extensions.DependencyInjection; 
using Microsoft.Extensions.Logging; 
using SchoolCore.Business; 
using SchoolCore.Business.Services; 
using SchoolCore.Models.Dtos.Auth;
 
var config = new ConfigurationBuilder() 
    .SetBasePath(AppContext.BaseDirectory) 
    .AddJsonFile("appsettings.json") 
    .AddJsonFile("appsettings.Development.json", optional: true) 
    .Build();
 
var services = new ServiceCollection(); 
services.AddLogging(); 
services.AddSingleton<IConfiguration>(config); 
services.AddSchoolCoreBusiness(config); 
var sp = services.BuildServiceProvider(); 
var auth = sp.GetRequiredService<IAuthService>();
 
try 
{ 
    var r = await auth.LoginAsync( 
        new LoginRequest { Email = "jespinoza.ova@gmail.com", Password = "WrongPass1" }, 
        "127.0.0.1"); 
    Console.WriteLine("LOGIN_OK unexpected"); 
    Console.WriteLine(r.UserId); 
} 
catch (Exception ex) 
{ 
    Console.WriteLine(ex.GetType().FullName); 
    Console.WriteLine(ex.Message); 
    Console.WriteLine(ex.ToString()); 
}
