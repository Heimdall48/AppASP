using AppASP.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using System.Linq;
using System.Xml.Linq;

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
            SqlParameter vPhoto = new SqlParameter("@Photo", System.Data.SqlDbType.NVarChar, 3000000, System.Data.ParameterDirection.Output, true, 0, 0, string.Empty, System.Data.DataRowVersion.Default, DBNull.Value);
            this.Database.ExecuteSqlRaw("SELECT TOP 1 @Photo = M.Photo FROM dbo.Model M WHERE M.Model_ID = @Model_ID", vPhoto, vModel_ID);
            return vPhoto.Value;
        }

        public void SaveModel(string name, int current_ID, string description, string? image, AppASP.Models.ItemModify itemmodify)
        {
            var vName = new SqlParameter("@Name", name);
            var vDescription = new SqlParameter("@Description", string.IsNullOrWhiteSpace(description) ? DBNull.Value : description);
            var vPhoto = new SqlParameter("@Photo", string.IsNullOrWhiteSpace(image) ? DBNull.Value : image);

            if (current_ID == 0)
            {
                SqlParameter vParameter = new SqlParameter("@Model_ID", System.Data.SqlDbType.Int, 8, System.Data.ParameterDirection.Output, true, 0, 0, string.Empty, System.Data.DataRowVersion.Default, DBNull.Value);
                this.Database.ExecuteSqlRaw(@"INSERT INTO [dbo].[Model] ([Name],[Photo] ,[Description]) 
                                              VALUES (@Name,@Photo, @Description)
                                              SELECT @Model_ID = SCOPE_IDENTITY()", vName, vPhoto, vDescription, vParameter);
                itemmodify.ID = Convert.ToInt32(vParameter.Value);
            }
            else
            {
                var vModel_ID = new SqlParameter("@Model_ID", current_ID);

                itemmodify.ID = current_ID;
                this.Database.ExecuteSqlRaw(@"UPDATE [dbo].[Model]
                                              SET [Name] = @Name, [Photo] = @Photo, [Description] = @Description
                                              WHERE Model_ID = @Model_ID", vName, vPhoto, vDescription, vModel_ID);
            }
        }
    }
  
}
