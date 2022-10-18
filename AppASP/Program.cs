using AppASP.Data;
using AppASP.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.Configuration;

var builder = WebApplication.CreateBuilder(args);

#region "настройка identity"
// получаем строку подключения из файла конфигурации
string connection = builder.Configuration.GetConnectionString("DefaultConnection");
// добавляем контекст ApplicationContext в качестве сервиса в приложение
builder.Services.AddDbContext<ApplicationContext>(options => options.UseSqlServer(connection));

builder.Services.AddDbContext<IdentityContext>(options => options.UseSqlServer(connection));
builder.Services.AddIdentity<User, IdentityRole<int>>(opts => {
    opts.User.RequireUniqueEmail = true;    // уникальный email
    //opts.User.AllowedUserNameCharacters = ".@abcdefghijklmnopqrstuvwxyz"; // допустимые символы
}).AddEntityFrameworkStores<IdentityContext>();
#endregion

// Add services to the container.
builder.Services.AddControllersWithViews();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
}
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();    // подключение аутентификации
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
