using AppASP.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using System.Linq;

namespace AppASP.Data
{
    public class ApplicationContext : DbContext
    {
        public DbSet<Model> Models { get; set; } = null!;
        public DbSet<AccessObject> AccessObjects { get; set; } = null!;
        public ApplicationContext(DbContextOptions<ApplicationContext> options)
            : base(options)
        {

        }

        public List<AccessObject> GetAccessMenuItems(string username)
        {
            Microsoft.Data.SqlClient.SqlParameter param = new Microsoft.Data.SqlClient.SqlParameter("@UserName", username);
            return this.AccessObjects.FromSqlRaw("GetAccessMenuItems @UserName", param).ToList<AccessObject>();
        }

        public object GetModelImage(int pModel_ID)
        {
            Microsoft.Data.SqlClient.SqlParameter vModel_ID = new Microsoft.Data.SqlClient.SqlParameter("@Model_ID", pModel_ID);
            SqlParameter vPhoto = new SqlParameter("@Photo", System.Data.SqlDbType.Binary, 8000, System.Data.ParameterDirection.Output, true, 0, 0, string.Empty, System.Data.DataRowVersion.Default, DBNull.Value);
            this.Database.ExecuteSqlRaw("SELECT TOP 1 @Photo = M.Photo FROM dbo.Model M WHERE M.Model_ID = @Model_ID", vPhoto, vModel_ID);
            return vPhoto.Value;
        }
    }
  
}
